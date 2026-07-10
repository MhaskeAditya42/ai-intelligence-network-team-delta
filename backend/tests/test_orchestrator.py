from agents.orchestrator import _build_prompt


def test_build_prompt_uses_decision_classification():
    signals = {
        "circular_flow_detected": None,
        "exposure_to_exclusion": [],
    }
    worker_output = {
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
