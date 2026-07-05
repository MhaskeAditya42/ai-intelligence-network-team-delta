import networkx as nx


def identify_ultimate_beneficiaries(graph: nx.DiGraph, target_node: str, signals: dict) -> list[dict]:
    """
    Flags individuals (type == "Individual") sitting within a circular flow
    detected for the target. Funds cycling back to a natural person, rather
    than terminating at another corporate/MSME entity, is the strongest
    UBO-siphoning signal — this reads directly off
    signals["circular_flow_detected"] rather than re-running cycle detection.
    """
    cycles = signals.get("circular_flow_detected") or []
    beneficiaries = []

    for cycle in cycles:
        for node in cycle:
            if graph.nodes[node].get("type") == "Individual":
                beneficiaries.append({
                    "entity": node,
                    "cycle_path": cycle,
                    "risk_note": (
                        f"{node} sits within a circular fund flow involving {target_node}, "
                        "indicating they may be the hidden Ultimate Beneficial Owner (UBO) "
                        "of the network."
                    ),
                })

    return beneficiaries


if __name__ == "__main__":
    from graph.build_graph import build_synthetic_network
    from graph.extract_signals import extract_network_signals
    import json

    G = build_synthetic_network()
    target = "Gaurav_Sustainable_Corp"
    signals = extract_network_signals(G, target)
    print(json.dumps(identify_ultimate_beneficiaries(G, target, signals), indent=2, default=str))
