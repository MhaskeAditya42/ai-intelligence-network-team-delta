import os
import json
import networkx as nx
import requests
from dotenv import load_dotenv

from graph.build_graph import build_synthetic_network
from graph.extract_signals import extract_network_signals
from agents.worker_mule import identify_mule_layerers
from agents.worker_gatekeeper import identify_gatekeepers
from agents.worker_ubo import identify_ultimate_beneficiaries
from graph.score_relation import score_relationships

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL") or os.getenv("GEMINI_MODEL", "openai/gpt-4o-mini")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_HTTP_REFERER = os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:3000")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "AI Intelligence Network Team Delta")
SAR_INFERRED_SCORE_THRESHOLD = 0.75
SAR_INFERRED_PASS_THROUGH_THRESHOLD = 0.80

# MOCK MODE: if no key is set yet, generate_ai_recommendation() falls back to
# a deterministic, rule-based response instead of crashing. This lets
# teammates build/test the rest of the pipeline before anyone has a key.
# Once OPENROUTER_API_KEY is set in the environment, live calls kick in
# automatically — no code changes needed.
MOCK_MODE = not OPENROUTER_API_KEY

if MOCK_MODE:
    print(
        "[orchestrator] OPENROUTER_API_KEY not set — running in MOCK MODE. "
        "Set OPENROUTER_API_KEY in your .env to enable live OpenRouter calls."
    )


def _run_pipeline(graph: nx.DiGraph, target_node: str) -> tuple[dict, dict]:
    """
    Runs extract_signals.py's raw math, then hands its output to each
    worker agent so they can score/name entities without recomputing
    cycles, paths, or address counts themselves.
    """
    signals = extract_network_signals(graph, target_node)

    worker_output = {
        "mule_candidates": identify_mule_layerers(graph, target_node, signals),
        "gatekeeper_candidates": identify_gatekeepers(graph, target_node, signals),
        "ubo_candidates": identify_ultimate_beneficiaries(graph, target_node, signals),
    }
    return signals, worker_output


def _relationship_score_summary(graph: nx.DiGraph, target_node: str) -> dict:
    """Create a compact, investigator-readable view of scored relationships."""
    scores = score_relationships(graph)
    subject_scores = []
    for (source, target, edge_type), info in scores.items():
        if target_node not in {source, target}:
            continue
        subject_scores.append({
            "source": source,
            "target": target,
            "edge_type": edge_type,
            "score": info["score"],
            "relationship": info["relation"],
            "hops": info.get("hops"),
            "pass_through_ratio": info.get("pass_through_ratio"),
            "path": info.get("path", []),
            "reasons": info.get("reasons", []),
        })
    subject_scores.sort(key=lambda item: item["score"], reverse=True)

    high = [item for item in subject_scores if item["score"] >= 0.70]
    medium = [item for item in subject_scores if 0.40 <= item["score"] < 0.70]
    return {
        "subject_relationships": subject_scores,
        "high_risk_count": len(high),
        "medium_risk_count": len(medium),
        "highest_score": subject_scores[0]["score"] if subject_scores else None,
    }


def _relationship_score_feedback(summary: dict) -> str | None:
    """Explain the strongest relationship score without overstating it as fact."""
    relationships = summary["subject_relationships"]
    if not relationships:
        return None

    strongest = relationships[0]
    score = strongest["score"]
    confidence = "high" if score >= 0.70 else "moderate" if score >= 0.40 else "low"
    description = f"{strongest['source']} → {strongest['target']} has a {confidence} relationship score of {score:.2f}"
    if strongest["edge_type"] == "inferred":
        intermediaries = " → ".join(str(node) for node in strongest["path"])
        description += (
            f". This is an inferred {strongest['hops']}-hop pass-through relationship"
            f" via {intermediaries or 'an intermediary'}, with "
            f"{strongest['pass_through_ratio']:.0%} of the original value continuing through the path"
        )
    else:
        description += f". This is a direct {strongest['relationship']} relationship"
    return description + ". The score is a prioritisation signal for review, not proof of suspicious activity by itself."


def _determine_classification(
    target_node: str, signals: dict, worker_output: dict, relationship_summary: dict | None = None
) -> dict:
    """
    Single source of truth for the SAR/EDD/NO_ACTION decision. This is
    deterministic, rule-based code — never delegated to the LLM — so the
    final classification can't drift, hallucinate, or be swayed by prompt
    framing. The LLM (when available) is only used afterward to write a
    human-readable rationale for whatever this function already decided.
    """
    gatekeepers = worker_output.get("gatekeeper_candidates", [])
    mules = worker_output.get("mule_candidates", [])
    ubos = worker_output.get("ubo_candidates", [])
    has_cycle = bool(signals.get("circular_flow_detected"))
    exclusion_paths = signals.get("exposure_to_exclusion") or []

    gatekeeper_evidence = gatekeepers[0]["risk_note"] if gatekeepers else None
    mule_evidence = None
    if mules:
        mule_names = ", ".join(candidate["entity"] for candidate in mules[:3])
        mule_evidence = (
            f"Potential mule/layering entities identified: {mule_names}. These entities both receive "
            "and forward funds, which warrants review of transaction purpose, counterparties, and source of funds."
        )
    ubo_evidence = ubos[0]["risk_note"] if ubos else None
    exclusion_evidence = (
        f"Funds from {target_node} reach a Framework-excluded entity via the path "
        f"{' -> '.join(exclusion_paths[0])}, indicating diversion of green-financed "
        "proceeds into a non-qualifying (high-carbon) activity."
        if exclusion_paths else None
    )
    qualifying_inferred_flows = [
        relationship for relationship in (relationship_summary or {}).get("subject_relationships", [])
        if relationship.get("edge_type") == "inferred"
        and relationship.get("score", 0) >= SAR_INFERRED_SCORE_THRESHOLD
        and relationship.get("pass_through_ratio", 0) >= SAR_INFERRED_PASS_THROUGH_THRESHOLD
        and relationship.get("hops", 0) >= 2
    ]
    inferred_flow_evidence = None
    if qualifying_inferred_flows:
        flow = qualifying_inferred_flows[0]
        path = " → ".join([flow["source"], *flow.get("path", []), flow["target"]])
        inferred_flow_evidence = (
            f"High-confidence inferred pass-through flow: {path} (score {flow['score']:.2f}; "
            f"{flow['pass_through_ratio']:.0%} pass-through across {flow['hops']} hops). "
            "The rapid onward movement is consistent with potential layering."
        )

    if has_cycle and ubos and exclusion_paths:
        classification = "SAR_FILING_REQUIRED"
        rationale = (
            f"{target_node} shows both a circular fund flow terminating at a natural "
            f"person ({ubos[0]['entity']}) and a direct path to a Framework-excluded "
            "entity, indicating deliberate layering and green-financing diversion. "
            "This meets the threshold for SAR filing."
        )
    elif qualifying_inferred_flows:
        classification = "SAR_FILING_REQUIRED"
        rationale = (
            f"{target_node} is connected to a high-confidence inferred pass-through flow "
            f"with a score of {qualifying_inferred_flows[0]['score']:.2f} and "
            f"{qualifying_inferred_flows[0]['pass_through_ratio']:.0%} of value forwarded. "
            "This meets the institution's threshold for a potential layering SAR: document the "
            "underlying transactions, investigate economic purpose and counterparties, and file "
            "in line with applicable reporting procedures."
        )
    elif has_cycle or gatekeepers or mules or exclusion_paths:
        classification = "ENHANCED_DUE_DILIGENCE"
        rationale = (
            f"One or more risk indicators were detected for {target_node} "
            "(circular flow, potential mule/layering activity, shared-address gatekeeper pattern, and/or exclusion-rule "
            "exposure), but evidence is not yet conclusive enough for immediate SAR "
            "filing. Recommend enhanced due diligence."
        )
    else:
        classification = "NO_ACTION_REQUIRED"
        rationale = (
            f"No cycle, gatekeeper, exclusion-rule exposure, or high-confidence inferred "
            f"pass-through flow was detected for {target_node}."
        )

    return {
        "classification": classification,
        "rationale": rationale,
        "risk_indicators": {
            "gatekeeper_evidence": gatekeeper_evidence,
            "mule_layering_evidence": mule_evidence,
            "ubo_siphoning_evidence": ubo_evidence,
            "exclusion_violation_evidence": exclusion_evidence,
            "relationship_score_evidence": _relationship_score_feedback(relationship_summary)
            if relationship_summary else None,
            "high_confidence_pass_through_evidence": inferred_flow_evidence,
        },
        "relationship_score_assessment": relationship_summary or {"subject_relationships": []},
    }


def _build_prompt(
    target_node: str,
    signals: dict,
    worker_output: dict,
    decision: dict,
    relationship_summary: dict | None = None,
) -> str:
    payload = json.dumps({
        "subject": target_node,
        "network_signals": signals,
        "worker_agent_findings": worker_output,
        "relationship_score_assessment": relationship_summary or {"subject_relationships": []},
    }, default=str)
    deterministic_classification = decision.get("classification", "NO_ACTION_REQUIRED")

    return f"""You are an expert financial crime investigator protecting the HSBC Green Financing Framework.
 
Review the following automated counterparty risk network payload for the entity '{target_node}'.
 
Payload: {payload}
 
A deterministic rules engine has already classified this alert as: '{deterministic_classification}'.
Do NOT assume this is correct. Independently review the same signals, relationship scores, and
worker findings and form your OWN classification from scratch, as if the deterministic result did not exist.
 
Ground rules:
•⁠  ⁠If "circular_flow_detected" is null or empty, there is NO cycle — do not describe or infer one.
•⁠  ⁠If "exposure_to_exclusion" is empty, there is NO exclusion-rule violation — do not describe or infer one.
•⁠  ⁠If "gatekeeper_candidates" is empty, there is NO shared-address/shell-company evidence — do not describe or infer one.
•⁠  ⁠If "mule_candidates" is empty, there is NO detected mule/layering candidate — do not describe or infer one.
•⁠  ⁠Base your classification ONLY on the signals and worker findings actually present in the payload — do not invent evidence.
•⁠  ⁠Only include evidence for a risk_indicators field if the corresponding signal or worker finding is non-empty in the payload; otherwise set that field to null.
•⁠  ⁠Treat a relationship score as a prioritisation signal, not proof of financial crime. It must not create a cycle, exclusion breach, or shared-identifier match.
•⁠  ⁠However, classify as SAR_FILING_REQUIRED when the payload contains an inferred relationship connected to the subject with score ≥ 0.75, pass-through ratio ≥ 80%, and at least two hops. This is the institution's defined high-confidence potential-layering rule; explain that it requires investigation and reporting, not that it proves criminal conduct.
•⁠  ⁠For an "inferred" relationship, state clearly that it is a derived pass-through path rather than a direct payment. Name the source, destination, intermediary/path, score, pass-through ratio, and timing only when present.
•⁠  ⁠Use the highest-scored relationships connected to the subject first. Explain their practical banking relevance in plain professional language: e.g. rapid onward movement of funds, possible layering, or a counterparty relationship requiring corroboration.
•⁠  ⁠Write for a banking professional who understands AML, KYC, EDD, SAR, beneficial ownership and transaction monitoring, but does not know this application. Define application-specific terms such as "inferred pass-through" the first time you use them.
 
After you have formed your own independent classification, compare it to the deterministic
classification given above:
•⁠  ⁠If they match, set "agrees_with_deterministic" to true and set "disagreement_reason" to null.
•⁠  ⁠If they differ, set "agrees_with_deterministic" to false, and in "disagreement_reason" explain
  specifically and concretely why the deterministic rule-based classification appears too strict,
  too lenient, or otherwise wrong given the actual evidence in the payload.
 
Respond ONLY in the following JSON format, with no preamble, no markdown formatting, no code fences:
{{
  "deterministic_classification": "{deterministic_classification}",
  "ai_classification": "SAR_FILING_REQUIRED" or "ENHANCED_DUE_DILIGENCE" or "NO_ACTION_REQUIRED",
  "agrees_with_deterministic": true or false,
  "disagreement_reason": "explanation or null",
  "rationale": "plain language explanation of your ai_classification",
  "relationship_score_assessment": "plain-language explanation of the strongest scored relationship(s), or null",
  "risk_indicators": {{
    "gatekeeper_evidence": "explanation or null",
    "mule_layering_evidence": "explanation or null",
    "ubo_siphoning_evidence": "explanation or null",
    "exclusion_violation_evidence": "explanation or null",
    "relationship_score_evidence": "explanation or null",
    "high_confidence_pass_through_evidence": "explanation or null"
  }}
}}"""



def _mock_recommendation(target_node: str, signals: dict, worker_output: dict, relationship_summary: dict) -> dict:
    """
    Deterministic stand-in for OpenRouter, used in MOCK_MODE. Just returns the
    rules-engine decision directly, tagged as mock.
    """
    decision = _determine_classification(target_node, signals, worker_output, relationship_summary)
    decision["_mock"] = True
    return decision


def _call_llm(prompt: str, decision: dict) -> dict:
    if not OPENROUTER_API_KEY:
        return {**decision, "_mock": True, "_fallback_reason": "openrouter_api_key_not_configured"}

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_HTTP_REFERER,
        "X-OpenRouter-Title": OPENROUTER_TITLE,
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    try:
        response = requests.post(
            url=f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        response_data = response.json()
        raw_text = response_data["choices"][0]["message"]["content"].strip()
    except requests.RequestException as exc:
        # Rate limit / quota exhaustion / other API-side failure — don't crash
        # the whole pipeline. Fall back to the deterministic decision's own
        # rationale so the caller still gets a usable, correct classification.
        return {**decision, "_llm_unavailable": True, "_llm_error": str(exc)}
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        return {**decision, "_llm_parse_failed": True, "_llm_error": str(exc)}

    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

    try:
        llm_result = json.loads(raw_text)
    except json.JSONDecodeError:
        # LLM output didn't parse — fall back to the deterministic decision
        # verbatim rather than surfacing a broken/unusable recommendation.
        return {**decision, "_llm_parse_failed": True, "_raw_llm_text": raw_text}

    # The classification is NEVER taken from the LLM, even if it disagrees —
    # it's overwritten here with the rules-engine decision so a hallucinating
    # or drifting model can never change the actual compliance outcome.
    llm_result["classification"] = decision["classification"]
    llm_result.setdefault("relationship_score_assessment", decision["relationship_score_assessment"])
    llm_risk_indicators = llm_result.setdefault("risk_indicators", {})
    for key, value in decision["risk_indicators"].items():
        llm_risk_indicators.setdefault(key, value)
    return llm_result


def generate_ai_recommendation(graph: nx.DiGraph, target_node: str) -> dict:
    """
    Main entry point. Runs extract_signals.py + all three worker agents
    against the graph for the given target, computes the classification
    deterministically, then (if a live key is configured) asks OpenRouter to
    write a narrative rationale on top of that fixed decision.
    """
    signals, worker_output = _run_pipeline(graph, target_node)
    relationship_summary = _relationship_score_summary(graph, target_node)
    decision = _determine_classification(target_node, signals, worker_output, relationship_summary)

    if MOCK_MODE:
        decision["_mock"] = True
        return decision

    prompt = _build_prompt(target_node, signals, worker_output, decision, relationship_summary)
    try:
        return _call_llm(prompt, decision)
    except Exception as exc:
        return {**decision, "_llm_unavailable": True, "_llm_error": str(exc)}


if __name__ == "__main__":
    G = build_synthetic_network()
    result = generate_ai_recommendation(G, "Entity_A")
    print(json.dumps(result, indent=2))
