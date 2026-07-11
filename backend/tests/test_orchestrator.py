from agents.orchestrator import _build_prompt, _determine_classification


def test_build_prompt_uses_decision_classification():
    signals = {
        "circular_flow_detected": None,
        "exposure_to_exclusion": [],
    }
    worker_output = {
        "mule_candidates": [],
        "gatekeeper_candidates": [],
        "ubo_candidates": [],
    }
    decision = {
        "classification": "ENHANCED_DUE_DILIGENCE",
        "rationale": "Test rationale",
    }

    prompt = _build_prompt("Entity_A", signals, worker_output, decision)

    assert "ENHANCED_DUE_DILIGENCE" in prompt
    assert '"deterministic_classification": "ENHANCED_DUE_DILIGENCE"' in prompt


def test_build_prompt_includes_scored_inferred_relationship_guidance():
    summary = {
        "subject_relationships": [{
            "source": "Entity_A", "target": "Entity_C", "edge_type": "inferred",
            "score": 0.82, "hops": 2, "pass_through_ratio": 0.9, "path": ["Entity_B"],
            "relationship": "Inferred pass-through", "reasons": [],
        }],
        "high_risk_count": 1, "medium_risk_count": 0, "highest_score": 0.82,
    }
    prompt = _build_prompt("Entity_A", {}, {}, {"classification": "ENHANCED_DUE_DILIGENCE"}, summary)

    assert '"score": 0.82' in prompt
    assert "prioritisation signal, not proof" in prompt
    assert "derived pass-through path rather than a direct payment" in prompt


def test_high_confidence_inferred_pass_through_requires_sar():
    summary = {
        "subject_relationships": [{
            "source": "GOV_017", "target": "BANK_021", "edge_type": "inferred",
            "score": 0.791, "hops": 2, "pass_through_ratio": 1.0, "path": ["MSME_020"],
        }],
    }
    decision = _determine_classification(
        "GOV_017",
        {"circular_flow_detected": None, "exposure_to_exclusion": []},
        {"gatekeeper_candidates": [], "ubo_candidates": []},
        summary,
    )

    assert decision["classification"] == "SAR_FILING_REQUIRED"
    assert decision["risk_indicators"]["high_confidence_pass_through_evidence"]


def test_mule_candidates_require_enhanced_due_diligence():
    decision = _determine_classification(
        "MSME_039",
        {"circular_flow_detected": None, "exposure_to_exclusion": []},
        {
            "mule_candidates": [
                {"entity": "BROKER_040", "risk_note": "Pass-through transaction pattern"},
                {"entity": "BROKER_041", "risk_note": "Pass-through transaction pattern"},
            ],
            "gatekeeper_candidates": [],
            "ubo_candidates": [],
        },
    )

    assert decision["classification"] == "ENHANCED_DUE_DILIGENCE"
    assert "BROKER_040" in decision["risk_indicators"]["mule_layering_evidence"]
