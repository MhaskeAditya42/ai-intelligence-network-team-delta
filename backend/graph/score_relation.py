import networkx as nx

# Base risk weights per relationship type — these should ideally be calibrated
# with real AML domain expertise / historical case data, not just guessed
RELATION_RISK_WEIGHTS = {
    "DIRECTOR_OF": 0.9,
    "CONSULTING_FEE": 0.8,
    "SUPPLY_CHAIN_PAYMENT": 0.6,
    "VENDOR_PAYMENT": 0.4,
    "GREEN_LOAN_DISBURSEMENT": 0.2,  # legitimate baseline transaction
}


def score_relationships(graph: nx.DiGraph) -> dict:
    """
    Computes a composite risk score (0-1) for every edge in the graph,
    based on cycle membership, address sharing, exclusion proximity,
    amount retention, and relationship type.
    """
    edge_scores = {}

    # --- Precompute cycle membership ---
    try:
        cycles = list(nx.simple_cycles(graph))
    except nx.NetworkXNoCycle:
        cycles = []

    edges_in_cycles = set()
    for cycle in cycles:
        for i in range(len(cycle)):
            edges_in_cycles.add((cycle[i], cycle[(i + 1) % len(cycle)]))

    # --- Precompute excluded/watchlisted nodes ---
    excluded_nodes = {
        n for n, attrs in graph.nodes(data=True)
        if attrs.get("watchlist_hit")
    }

    # --- Precompute address clusters ---
    address_map = {}
    for node, attrs in graph.nodes(data=True):
        addr = attrs.get("registered_address")
        if addr:
            address_map.setdefault(addr, []).append(node)
    shared_address_nodes = {
        n for entities in address_map.values() if len(entities) >= 2 for n in entities
    }

    for source, target, attrs in graph.edges(data=True):
        score = 0.0
        reasons = []

        # 1. Cycle membership — strongest signal
        if (source, target) in edges_in_cycles:
            score += 0.35
            reasons.append("part of a circular fund flow (UBO siphoning pattern)")

        # 2. Shared address on either end — gatekeeper/shell signal
        if source in shared_address_nodes or target in shared_address_nodes:
            score += 0.20
            reasons.append("connects to an entity sharing a registered address with others")

        # 3. Proximity to excluded/watchlisted entity (1-hop distance gets full weight,
        #    decays for further hops)
        if target in excluded_nodes:
            score += 0.25
            reasons.append("directly funds a watchlisted/excluded entity")
        elif nx.has_path(graph, target, tuple(excluded_nodes)[0]) if excluded_nodes else False:
            pass  # extend with shortest_path-based decay if needed

        # 4. Amount retention ratio (pass-through detection)
        # Compare this edge's amount to the node's total inbound amount
        in_edges = list(graph.in_edges(source, data=True))
        if in_edges:
            total_in = sum(e[2].get("amount", 0) for e in in_edges)
            this_amount = attrs.get("amount", 0)
            if total_in > 0:
                retention_ratio = this_amount / total_in
                if retention_ratio > 0.85:
                    score += 0.15
                    reasons.append(f"high pass-through retention ({retention_ratio:.0%} of inbound funds forwarded)")

        # 5. Relationship type base risk
        relation_type = attrs.get("edge_type") or attrics.get("relation") if False else attrs.get("edge_type")
        type_weight = RELATION_RISK_WEIGHTS.get(relation_type, 0.3)
        score += type_weight * 0.15  # scaled contribution

        # Clamp to 0-1
        score = min(round(score, 3), 1.0)

        edge_scores[(source, target)] = {
            "score": score,
            "relation": relation_type,
            "amount": attrs.get("amount"),
            "reasons": reasons,
        }

    return edge_scores


def find_strongest_connection(graph: nx.DiGraph, node_a: str, node_b: str, edge_scores: dict) -> dict:
    """
    Pillar 3 from the PDF: determine whether the strongest relationship
    lies between two specific alerted individuals/entities, using shortest
    path and aggregating edge scores along that path.
    """
    if not nx.has_path(graph.to_undirected(), node_a, node_b):
        return {"connected": False}

    path = nx.shortest_path(graph.to_undirected(), node_a, node_b)
    path_scores = []

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        key = (u, v) if (u, v) in edge_scores else (v, u)
        if key in edge_scores:
            path_scores.append(edge_scores[key]["score"])

    avg_score = sum(path_scores) / len(path_scores) if path_scores else 0

    return {
        "connected": True,
        "path": path,
        "hop_count": len(path) - 1,
        "average_edge_score": round(avg_score, 3),
        "network_strength_label": (
            "STRONG" if avg_score > 0.6 else "MODERATE" if avg_score > 0.3 else "WEAK"
        ),
    }