import networkx as nx


def detect_gatekeepers(graph: nx.DiGraph) -> list[dict]:
    gatekeepers = []
    address_map = {}

    for node, attrs in graph.nodes(data=True):
        address = attrs.get("registered_address")
        if address:
            address_map.setdefault(address, []).append(node)

    for address, entities in address_map.items():
        if len(entities) >= 2:
            gatekeepers.append({
                "shared_address": address,
                "linked_entities": entities,
                "risk_note": (
                    f"{len(entities)} entities share the same registered address, "
                    f"indicating possible shell-company infrastructure managed by a single Gatekeeper."
                ),
            })

    return gatekeepers


if __name__ == "__main__":
    from graph.build_graph import build_synthetic_network
    G = build_synthetic_network()
    print(detect_gatekeepers(G))