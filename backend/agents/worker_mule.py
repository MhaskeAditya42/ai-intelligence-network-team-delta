import networkx as nx


def identify_mule_layerers(graph: nx.DiGraph, target_node: str, signals: dict) -> list[dict]:
    """
    Flags pass-through / layering entities reachable from the target: any
    node that both receives from and forwards to another entity is a
    potential mule/layerer. Nodes that also sit on a detected circular flow
    for this target (signals["circular_flow_detected"]) are surfaced first,
    since a closed loop is a much stronger layering signal than an isolated
    pass-through node.
    """
    cycle_nodes = set()
    for cycle in (signals.get("circular_flow_detected") or []):
        cycle_nodes.update(cycle)

    nodes_to_check = set(nx.descendants(graph, target_node)) | {target_node}

    candidates = []
    for node in nodes_to_check:
        in_deg = graph.in_degree(node)
        out_deg = graph.out_degree(node)
        if in_deg >= 1 and out_deg >= 1:
            in_cycle = node in cycle_nodes
            candidates.append({
                "entity": node,
                "in_degree": in_deg,
                "out_degree": out_deg,
                "receives_from": list(graph.predecessors(node)),
                "forwards_to": list(graph.successors(node)),
                "in_detected_cycle": in_cycle,
                "risk_note": (
                    "Pass-through transaction pattern consistent with layering behavior"
                    + (" and sits within a detected circular flow" if in_cycle else "")
                    + "."
                ),
            })

    candidates.sort(key=lambda c: c["in_detected_cycle"], reverse=True)
    return candidates


if __name__ == "__main__":
    from ..graph.build_graph import build_synthetic_network
    from ..graph.extract_signals import extract_network_signals
    import json

    G = build_synthetic_network()
    target = "Gaurav_Sustainable_Corp"
    signals = extract_network_signals(G, target)
    print(json.dumps(identify_mule_layerers(G, target, signals), indent=2, default=str))
