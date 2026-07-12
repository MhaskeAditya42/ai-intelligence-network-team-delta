"""Inference of time-bounded, multi-hop pass-through fund flows."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import date, datetime
from typing import Any, Optional

import networkx as nx

DEFAULT_PASS_THROUGH_THRESHOLD = 0.80
DEFAULT_TIME_WINDOW_DAYS = 7
DEFAULT_MAX_HOPS = 2

_TIME_FIELDS = ("transaction_date", "date", "timestamp", "created_at")
_IDENTIFIER_FIELDS = (
    "registered_address", "address", "phone", "phone_number", "email",
    "beneficial_owner", "beneficial_owner_id", "ubo", "ubo_id", "kyc_id",
    "kyc_reference", "kyc_number",
)
_ACCOUNT_OPEN_FIELDS = ("account_open_date", "account_opened_at", "opened_at", "incorporation_date")


def _as_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _edge_time(attrs: dict[str, Any]) -> Optional[datetime]:
    return next((_as_datetime(attrs.get(field)) for field in _TIME_FIELDS if _as_datetime(attrs.get(field))), None)


def _direct_edges(graph: nx.MultiDiGraph) -> Iterable[tuple[str, str, str, dict[str, Any]]]:
    """Yield only original transfers; inferred edges are never re-used as evidence."""
    for source, target, key, attrs in graph.edges(keys=True, data=True):
        if attrs.get("edge_type", "direct") == "direct":
            yield source, target, key, attrs


def _identifier_matches(source: dict[str, Any], target: dict[str, Any]) -> list[str]:
    matches = []
    for field in _IDENTIFIER_FIELDS:
        left, right = source.get(field), target.get(field)
        if left is None or right is None:
            continue
        if str(left).strip().casefold() == str(right).strip().casefold():
            matches.append(field)
    return matches


def _mule_indicator(graph: nx.MultiDiGraph, node: str, reference_time: datetime) -> float:
    """Return a bounded shell/mule indicator using only attributes we have."""
    counterparties = set(graph.predecessors(node)) | set(graph.successors(node))
    score = 0.0
    if len(counterparties) <= 2:
        score += 0.60
    if len(set(graph.predecessors(node))) == 1 and len(set(graph.successors(node))) == 1:
        score += 0.25
    attrs = graph.nodes[node]
    opened = next((_as_datetime(attrs.get(field)) for field in _ACCOUNT_OPEN_FIELDS if _as_datetime(attrs.get(field))), None)
    if opened and 0 <= (reference_time - opened).days <= 365:
        score += 0.15
    return min(score, 1.0)


def _confidence_score(
    graph: nx.MultiDiGraph,
    path: tuple[str, ...],
    pass_through_ratio: float,
    time_delta_days: float,
    time_window_days: int,
    reference_time: datetime,
) -> tuple[float, list[str]]:
    """Score flow, timing, hop count, mule characteristics and entity matches."""
    ratio_component = min(pass_through_ratio, 1.0) * 0.45
    time_component = max(0.0, 1 - time_delta_days / max(time_window_days, 1)) * 0.20
    hop_component = max(0.0, 1 - (len(path) - 2) * 0.15) * 0.05
    mule_component = max(_mule_indicator(graph, node, reference_time) for node in path[1:-1]) * 0.15
    matches = _identifier_matches(graph.nodes[path[0]], graph.nodes[path[-1]])
    verification_component = 0.15 if matches else 0.0
    return round(min(1.0, ratio_component + time_component + hop_component + mule_component + verification_component), 3), matches


def infer_pass_through_relationships(
    graph: nx.MultiDiGraph,
    *,
    pass_through_threshold: float = DEFAULT_PASS_THROUGH_THRESHOLD,
    time_window_days: int = DEFAULT_TIME_WINDOW_DAYS,
    max_hops: int = DEFAULT_MAX_HOPS,
) -> None:
    """Add inferred edges for qualifying direct-transfer paths.

    The frontier is iterative rather than hard-coded to A->B->C.  The public
    default is two hops, while callers can safely raise ``max_hops`` later.
    Missing transaction times deliberately fail closed: timing is required to
    claim a pass-through relationship.
    """
    if not 0 < pass_through_threshold <= 1:
        raise ValueError("pass_through_threshold must be greater than 0 and no more than 1")
    if time_window_days < 0:
        raise ValueError("time_window_days must be zero or greater")
    if max_hops < 2:
        return

    direct_edges = list(_direct_edges(graph))
    outgoing: dict[str, list[tuple[str, str, str, dict[str, Any]]]] = {}
    for edge in direct_edges:
        outgoing.setdefault(edge[0], []).append(edge)

    # (path, first amount, current amount, most recent transaction time)
    frontier = []
    for source, target, _, attrs in direct_edges:
        amount, transaction_time = attrs.get("amount"), _edge_time(attrs)
        if isinstance(amount, (int, float)) and amount > 0 and transaction_time:
            frontier.append(((source, target), float(amount), float(amount), transaction_time))

    best_edges: dict[tuple[str, str], dict[str, Any]] = {}
    for _ in range(2, max_hops + 1):
        next_frontier = []
        for path, initial_amount, previous_amount, previous_time in frontier:
            for _, target, _, attrs in outgoing.get(path[-1], []):
                if target in path:
                    continue
                amount, transaction_time = attrs.get("amount"), _edge_time(attrs)
                if not isinstance(amount, (int, float)) or amount <= 0 or not transaction_time:
                    continue
                delta_days = (transaction_time - previous_time).total_seconds() / 86400
                leg_ratio = float(amount) / previous_amount
                if not 0 <= delta_days <= time_window_days or leg_ratio < pass_through_threshold:
                    continue
                extended_path = (*path, target)
                overall_ratio = float(amount) / initial_amount
                confidence, matched_identifiers = _confidence_score(
                    graph, extended_path, overall_ratio, delta_days, time_window_days, transaction_time
                )
                candidate = {
                    "edge_type": "inferred",
                    "relationship_type": "pass_through",
                    "confidence_score": confidence,
                    "hops": len(extended_path) - 1,
                    "pass_through_ratio": round(overall_ratio, 4),
                    "inferred_amount": round(float(amount), 2),
                    "path": list(extended_path[1:-1]),
                    "time_delta_days": round(delta_days, 3),
                    "matched_identifiers": matched_identifiers,
                }
                edge_key = (extended_path[0], extended_path[-1])
                if confidence > best_edges.get(edge_key, {}).get("confidence_score", -1):
                    best_edges[edge_key] = candidate
                next_frontier.append((extended_path, initial_amount, float(amount), transaction_time))
        frontier = next_frontier

    for (source, target), attrs in best_edges.items():
        graph.add_edge(source, target, key=f"inferred:{source}:{target}", **attrs)
