import os
import json
import networkx as nx
from dotenv import load_dotenv

from graph.build_graph import build_synthetic_network
from graph.extract_signals import extract_network_signals
from agents.worker_mule import identify_mule_layerers
from agents.worker_gatekeeper import identify_gatekeepers
from agents.worker_ubo import identify_ultimate_beneficiaries

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# MOCK MODE: if no key is set yet, generate_ai_recommendation() falls back to
# a deterministic, rule-based response instead of crashing. This lets
# teammates build/test the rest of the pipeline before anyone has a key.
# Once GEMINI_API_KEY is set in the environment, live calls kick in
# automatically — no code changes needed.
MOCK_MODE = API_KEY is None

if MOCK_MODE:
    print(
        "[orchestrator] GEMINI_API_KEY not set — running in MOCK MODE. "
        "Set GEMINI_API_KEY in your .env to enable live Gemini calls."
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


def _determine_classification(target_node: str, signals: dict, worker_output: dict) -> dict:
    """
    Single source of truth for the SAR/EDD/NO_ACTION decision. This is
    deterministic, rule-based code — never delegated to the LLM — so the
    final classification can't drift, hallucinate, or be swayed by prompt
    framing. The LLM (when available) is only used afterward to write a
    human-readable rationale for whatever this function already decided.
    """
    gatekeepers = worker_output["gatekeeper_candidates"]
    ubos = worker_output["ubo_candidates"]
    has_cycle = bool(signals.get("circular_flow_detected"))
    exclusion_paths = signals.get("exposure_to_exclusion") or []

    gatekeeper_evidence = gatekeepers[0]["risk_note"] if gatekeepers else None
    ubo_evidence = ubos[0]["risk_note"] if ubos else None
    exclusion_evidence = (
        f"Funds from {target_node} reach a Framework-excluded entity via the path "
        f"{' -> '.join(exclusion_paths[0])}, indicating diversion of green-financed "
        "proceeds into a non-qualifying (high-carbon) activity."
        if exclusion_paths else None
    )

    if has_cycle and ubos and exclusion_paths:
        classification = "SAR_FILING_REQUIRED"
        rationale = (
            f"{target_node} shows both a circular fund flow terminating at a natural "
            f"person ({ubos[0]['entity']}) and a direct path to a Framework-excluded "
            "entity, indicating deliberate layering and green-financing diversion. "
            "This meets the threshold for SAR filing."
        )
    elif has_cycle or gatekeepers or exclusion_paths:
        classification = "ENHANCED_DUE_DILIGENCE"
        rationale = (
            f"One or more risk indicators were detected for {target_node} "
            "(circular flow, shared-address gatekeeper pattern, and/or exclusion-rule "
            "exposure), but evidence is not yet conclusive enough for immediate SAR "
            "filing. Recommend enhanced due diligence."
        )
    else:
        classification = "NO_ACTION_REQUIRED"
        rationale = f"No cycle, gatekeeper, or exclusion-rule exposure was detected for {target_node}."

    return {
        "classification": classification,
        "rationale": rationale,
        "risk_indicators": {
            "gatekeeper_evidence": gatekeeper_evidence,
            "ubo_siphoning_evidence": ubo_evidence,
            "exclusion_violation_evidence": exclusion_evidence,
        },
    }


def _build_prompt(target_node: str, signals: dict, worker_output: dict, decision: dict) -> str:
    payload = json.dumps({
        "subject": target_node,
        "network_signals": signals,
        "worker_agent_findings": worker_output,
    }, default=str)

    return f"""You are an expert financial crime investigator protecting the HSBC Green Financing Framework.

Review the following automated counterparty risk network payload for the entity '{target_node}'.

Payload: {payload}

A deterministic rules engine has already classified this alert as: '{decision["classification"]}'.
Your job is NOT to re-classify it — the classification is final and must be repeated exactly as given.
Your job is only to write a clear, plain-language rationale that explains this classification using
ONLY the signals and worker findings actually present in the payload above.

Ground rules:
- If "circular_flow_detected" is null or empty, there is NO cycle — do not describe or infer one.
- If "exposure_to_exclusion" is empty, there is NO exclusion-rule violation — do not describe or infer one.
- If "gatekeeper_candidates" is empty, there is NO shared-address/shell-company evidence — do not describe or infer one.
- Only include evidence for a risk_indicators field if the corresponding signal or worker finding is non-empty in the payload; otherwise set that field to null.

Respond ONLY in the following JSON format, with no preamble, no markdown formatting, no code fences:
{{
  "classification": "{decision["classification"]}",
  "rationale": "plain language explanation",
  "risk_indicators": {{
    "gatekeeper_evidence": "explanation or null",
    "ubo_siphoning_evidence": "explanation or null",
    "exclusion_violation_evidence": "explanation or null"
  }}
}}"""


def _mock_recommendation(target_node: str, signals: dict, worker_output: dict) -> dict:
    """
    Deterministic stand-in for Gemini, used in MOCK_MODE. Just returns the
    rules-engine decision directly, tagged as mock.
    """
    decision = _determine_classification(target_node, signals, worker_output)
    decision["_mock"] = True
    return decision


def _call_llm(prompt: str, decision: dict) -> dict:
    try:
        from google import genai  # lazy import — only needed on the live-LLM path
        from google.genai import errors as genai_errors
    except ImportError as e:
        return {**decision, "_mock": True, "_fallback_reason": f"llm_import_error: {e}"}

    try:
        client = genai.Client(api_key=API_KEY)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )
        raw_text = response.text.strip()
    except genai_errors.ClientError as e:
        # Rate limit / quota exhaustion / other API-side failure — don't crash
        # the whole pipeline. Fall back to the deterministic decision's own
        # rationale so the caller still gets a usable, correct classification.
        return {**decision, "_llm_unavailable": True, "_llm_error": str(e)}

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
    return llm_result


def generate_ai_recommendation(graph: nx.DiGraph, target_node: str) -> dict:
    """
    Main entry point. Runs extract_signals.py + all three worker agents
    against the graph for the given target, computes the classification
    deterministically, then (if a live key is configured) asks Gemini to
    write a narrative rationale on top of that fixed decision.
    """
    signals, worker_output = _run_pipeline(graph, target_node)
    decision = _determine_classification(target_node, signals, worker_output)

    if MOCK_MODE:
        decision["_mock"] = True
        return decision

    prompt = _build_prompt(target_node, signals, worker_output, decision)
    try:
        return _call_llm(prompt, decision)
    except Exception as exc:
        return {**decision, "_llm_unavailable": True, "_llm_error": str(exc)}


if __name__ == "__main__":
    G = build_synthetic_network()
    result = generate_ai_recommendation(G, "Gaurav_Sustainable_Corp")
    print(json.dumps(result, indent=2))