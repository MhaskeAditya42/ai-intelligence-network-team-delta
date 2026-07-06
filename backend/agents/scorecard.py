import math
from typing import List, Dict, Any


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def compute_scorecard(graph, target_node: str, signals: dict, worker_output: dict) -> List[Dict[str, Any]]:
    """Compute a deterministic score (0-100) for every node in the graph
    representing the strength of relationship / risk between target_node and
    that node.

    Returns a list of dicts: {"entity": name, "score": int, "reasons": [str]}.

    Scoring (example weights):
    - UBO presence in same cycle: +30
    - Node appears in detected circular flow: +20
    - Exposure to exclusion (short path): +20 scaled by inverse path length
    - Shared address density: + (density * 8)
    - Gatekeeper candidate membership: +15
    - Mule/layerer candidate membership: +10

    Keep this deterministic and auditable — the values are tunable.
    """

    results: List[Dict[str, Any]] = []

    # Prepare quick lookup sets
    cycles = signals.get("circular_flow_detected") or []
    nodes_in_cycles = set(n for c in cycles for n in c)

    exclusion_paths = signals.get("exposure_to_exclusion") or []
    # map node -> shortest distance from target to that excluded node (if any)
    exclusion_distance = {}
    for path in exclusion_paths:
        for dist, node in enumerate(path):
            # only record the closest occurrence (smallest dist)
            exclusion_distance[node] = min(dist, exclusion_distance.get(node, dist))

    # quick maps for worker outputs
    gatekeepers = {g['entity'] for g in (worker_output.get('gatekeeper_candidates') or []) if 'entity' in g}
    mules = {m['entity'] for m in (worker_output.get('mule_candidates') or []) if 'entity' in m}
    ubos = {u['entity'] for u in (worker_output.get('ubo_candidates') or []) if 'entity' in u}

    shared_density = signals.get('shared_address_density', 0)

    for node in graph.nodes:
        if node == target_node:
            continue

        score = 0.0
        reasons = []

        # UBO strong signal
        if node in ubos:
            score += 30
            reasons.append('Identified as UBO candidate in detected cycle')

        # Node sits in a detected cycle
        if node in nodes_in_cycles:
            score += 20
            reasons.append('Node participates in a circular fund flow')

        # Exposure to exclusion: closer nodes are more significant
        if node in exclusion_distance:
            dist = exclusion_distance[node]
            # guard against zero distance; invert and scale
            contribution = 20 * (1.0 / (1 + dist))
            score += contribution
            reasons.append(f'Reaches an excluded entity (path distance {dist})')

        # Shared address density (applies mainly to downstream entities)
        # We award small points proportional to reported density
        if shared_density and node != target_node:
            # signal is global for the target; reward nodes if they share address
            addr = graph.nodes[node].get('registered_address')
            if addr:
                # Count how many nodes share the same address
                peers = [n for n in graph.successors(target_node) if graph.nodes[n].get('registered_address') == addr]
                if len(peers) >= 2:
                    contrib = min(16, len(peers) * 8)
                    score += contrib
                    reasons.append(f'Shares registered address with {len(peers)} counterparties')

        # Gatekeeper / Mule signals
        if node in gatekeepers:
            score += 15
            reasons.append('Flagged as gatekeeper / shared-address manager')

        if node in mules:
            score += 10
            reasons.append('Shows pass-through / layering behavior (mule candidate)')

        # Add small proximity component: shorter graph distance -> higher small bonus
        try:
            if graph.has_node(node) and graph.has_node(target_node):
                if graph.has_edge(target_node, node) or graph.has_edge(node, target_node):
                    score += 5
                    reasons.append('Direct transaction edge with target')
                else:
                    # shortest path length if exists
                    if graph.is_directed():
                        if nx := None:  # type: ignore
                            pass
        except Exception:
            # ignore distance heuristics on problematic graphs
            pass

        final = int(_clamp(round(score)))
        results.append({
            'entity': node,
            'score': final,
            'reasons': reasons,
        })

    # sort by descending score
    results.sort(key=lambda r: r['score'], reverse=True)
    return results
