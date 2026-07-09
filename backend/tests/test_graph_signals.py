from graph.build_graph import build_synthetic_network
from graph.extract_signals import extract_network_signals


def test_exclusion_exposure_detected():
    G = build_synthetic_network()
    signals = extract_network_signals(G, "Entity_A")
    assert len(signals["exposure_to_exclusion"]) > 0


def test_shared_address_density_flags_shell_cluster():
    G = build_synthetic_network()
    signals = extract_network_signals(G, "Entity_A")
    assert signals["shared_address_density"] >= 2