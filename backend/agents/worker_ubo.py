import networkx as nx


def detect_ultimate_beneficiaries(graph: nx.DiGraph) -> list[dict]:
    beneficiaries = []

    try:
        cycles = list(nx.simple_cycles(graph))
    except nx.NetworkXNoCycle:
        cycles = []

    for cycle in cycles:
        for node in cycle:
            attrs = graph.nodes[node]
            if attrs.get("type") == "Individual":
                beneficiaries.append({
                    "entity": node,
                    "cycle_path": cycle,
                    "risk_note": (
                        f"{node} sits within a circular fund flow, indicating they "
                        f"may be the hidden Ultimate Beneficial Owner (UBO) of the network."
                    ),
                })

    return beneficiaries


if __name__ == "__main__":
    from graph.build_graph import build_synthetic_network
    G = build_synthetic_network()
    print(detect_ultimate_beneficiaries(G))