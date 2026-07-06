import networkx as nx


def identify_gatekeepers(graph: nx.DiGraph, target_node: str, signals: dict) -> list[dict]:
    """
    Flags shared-address clusters among the target's downstream
    counterparties. This is the same population extract_signals.py scores
    with its shared_address_density scalar — this function returns the
    actual entities and address behind that number so the LLM (and the
    frontend) can name names instead of just seeing a count.
    """
    downstream_entities = list(graph.successors(target_node))
    address_map: dict[str, list[str]] = {}

    for node in downstream_entities:
        addr = graph.nodes[node].get("registered_address")
        if addr:
            address_map.setdefault(addr, []).append(node)

    gatekeepers = []
    for address, entities in address_map.items():
        if len(entities) >= 2:
            gatekeepers.append({
                "shared_address": address,
                "linked_entities": entities,
                "matches_reported_density": len(entities) == signals.get("shared_address_density"),
                "risk_note": (
                    f"{len(entities)} of {target_node}'s counterparties share the same "
                    f"registered address ({address}), indicating possible shell-company "
                    "infrastructure managed by a single Gatekeeper."
                ),
            })

    return gatekeepers


if __name__ == "__main__":
    from ..graph.build_graph import build_synthetic_network
    from ..graph.extract_signals import extract_network_signals
    import json

    G = build_synthetic_network()
    target = "Gaurav_Sustainable_Corp"
    signals = extract_network_signals(G, target)
    print(json.dumps(identify_gatekeepers(G, target, signals), indent=2, default=str))
