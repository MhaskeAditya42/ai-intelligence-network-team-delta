from ..graph.build_graph import build_synthetic_network
from ..graph.extract_signals import extract_network_signals
from ..agents.scorecard import compute_scorecard


def test_scorecard_runs_and_returns_list():
    G = build_synthetic_network()
    target = "Gaurav_Sustainable_Corp"
    signals = extract_network_signals(G, target)

    # Minimal worker_output shape — scorecard only reads fields that may be empty
    worker_output = {
        "mule_candidates": [],
        "gatekeeper_candidates": [],
        "ubo_candidates": [],
    }

    sc = compute_scorecard(G, target, signals, worker_output)
    assert isinstance(sc, list)
    # If there are other nodes in the sample graph, ensure scores are present
    if sc:
        assert "entity" in sc[0] and "score" in sc[0]
