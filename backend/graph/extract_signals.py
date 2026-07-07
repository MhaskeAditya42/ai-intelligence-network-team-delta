import networkx as nx


def extract_network_signals(graph: nx.DiGraph, target_node: str) -> dict:
    signals = {}

    # --- Circular fund flow detection ---
    try:
        cycles = list(nx.simple_cycles(graph))
        target_cycles = [c for c in cycles if target_node in c]
        signals["circular_flow_detected"] = target_cycles if target_cycles else None
    except nx.NetworkXNoCycle:
        signals["circular_flow_detected"] = None

    # --- Shortest path to any excluded/watchlisted node ---
    exclusion_nodes = [
        n for n, attrs in graph.nodes(data=True)
        if attrs.get("watchlist_hit") == "Framework_Exclusion"
    ]
    signals["exposure_to_exclusion"] = []

    for ex_node in exclusion_nodes:
        if nx.has_path(graph, target_node, ex_node):
            shortest_path = nx.shortest_path(graph, target_node, ex_node)
            signals["exposure_to_exclusion"].append(shortest_path)

    # --- Shell company / gatekeeper address density ---
    downstream_entities = list(graph.successors(target_node))
    addresses = [
        graph.nodes[n].get("registered_address")
        for n in downstream_entities
        if graph.nodes[n].get("registered_address")
    ]

    if addresses:
        max_density = max(addresses.count(a) for a in set(addresses))
        signals["shared_address_density"] = max_density
    else:
        signals["shared_address_density"] = 0

    return signals


if __name__ == "__main__":
    from graph.build_graph import build_synthetic_network

    G = build_synthetic_network()
    result = extract_network_signals(G, "Entity_A")
    import json
    print(json.dumps(result, indent=2))