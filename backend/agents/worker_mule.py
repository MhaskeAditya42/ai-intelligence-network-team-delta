import networkx as nx


def detect_mules(graph: nx.DiGraph, min_out_edges: int = 1) -> list[dict]:
    mules = []

    for node in graph.nodes():
        in_degree = graph.in_degree(node)
        out_degree = graph.out_degree(node)

        if in_degree >= 1 and out_degree >= min_out_edges:
            outgoing = list(graph.successors(node))
            incoming = list(graph.predecessors(node))

            mules.append({
                "entity": node,
                "in_degree": in_degree,
                "out_degree": out_degree,
                "receives_from": incoming,
                "forwards_to": outgoing,
                "risk_note": "Pass-through transaction pattern consistent with layering behavior.",
            })

    return mules


if __name__ == "__main__":
    from graph.build_graph import build_synthetic_network
    G = build_synthetic_network()
    print(detect_mules(G))