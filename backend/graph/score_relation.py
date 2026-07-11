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

    for source, target, _, attrs in graph.edges(keys=True, data=True):
        # The inference engine's confidence is the risk score for a derived
        # relationship. Keep it alongside (rather than overwriting) a direct
        # edge with the same endpoints.
        if attrs.get("edge_type") == "inferred":
            ratio = attrs.get("pass_through_ratio", 0)
            hops = attrs.get("hops", 2)
            path = attrs.get("path", [])
            reasons = [
                f"{ratio:.0%} of funds passed through {' → '.join(path) or 'an intermediary'} within {attrs.get('time_delta_days', 0)} days",
                f"derived from a {hops}-hop transaction path",
            ]
            if attrs.get("matched_identifiers"):
                reasons.append(
                    "shared entity identifiers: " + ", ".join(attrs["matched_identifiers"])
                )
            edge_scores[(source, target, "inferred")] = {
                "score": attrs.get("confidence_score", 0),
                "relation": "Inferred pass-through",
                "edge_type": "inferred",
                "amount": attrs.get("inferred_amount"),
                "hops": hops,
                "pass_through_ratio": ratio,
                "path": path,
                "reasons": reasons,
            }
            continue
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
        relation_type = attrs.get("relationship_type")
        type_weight = RELATION_RISK_WEIGHTS.get(relation_type, 0.3)
        score += type_weight * 0.15  # scaled contribution

        # Clamp to 0-1
        score = min(round(score, 3), 1.0)

        edge_scores[(source, target, "direct")] = {
            "score": score,
            "relation": relation_type,
            "edge_type": "direct",
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
        candidates = [
            info for (source, target, _), info in edge_scores.items()
            if (source, target) in {(u, v), (v, u)}
        ]
        if candidates:
            path_scores.append(max(candidate["score"] for candidate in candidates))

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
