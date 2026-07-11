import networkx as nx

from graph.infer_relationships import infer_pass_through_relationships
from graph.score_relation import score_relationships


def _direct(graph, source, target, amount, transaction_date):
    graph.add_edge(
        source,
        target,
        edge_type="direct",
        relationship_type="TRANSFER",
        amount=amount,
        transaction_date=transaction_date,
    )


def test_infers_time_bounded_two_hop_edge_with_verification_boost():
    graph = nx.MultiDiGraph()
    graph.add_node("A", registered_address="Shared address")
    graph.add_node("B")
    graph.add_node("C", registered_address="Shared address")
    _direct(graph, "A", "B", 1000, "2026-01-01T09:00:00")
    _direct(graph, "B", "C", 850, "2026-01-03T09:00:00")

    infer_pass_through_relationships(graph, time_window_days=7)

    inferred = graph.get_edge_data("A", "C")["inferred:A:C"]
    assert inferred["edge_type"] == "inferred"
    assert inferred["hops"] == 2
    assert inferred["path"] == ["B"]
    assert inferred["pass_through_ratio"] == 0.85
    assert inferred["time_delta_days"] == 2.0
    assert inferred["matched_identifiers"] == ["registered_address"]
    assert inferred["confidence_score"] >= 0.75
    scores = score_relationships(graph)
    inferred_score = scores[("A", "C", "inferred")]
    assert inferred_score["score"] == inferred["confidence_score"]
    assert inferred_score["hops"] == 2


def test_rejects_late_or_below_threshold_transfer():
    graph = nx.MultiDiGraph()
    graph.add_nodes_from(["A", "B", "C"])
    _direct(graph, "A", "B", 1000, "2026-01-01")
    _direct(graph, "B", "C", 790, "2026-01-20")

    infer_pass_through_relationships(graph, time_window_days=7)

    assert not graph.has_edge("A", "C")


def test_multi_hop_extension_is_iterative_when_enabled():
    graph = nx.MultiDiGraph()
    graph.add_nodes_from(["A", "B", "C", "D"])
    _direct(graph, "A", "B", 1000, "2026-01-01")
    _direct(graph, "B", "C", 900, "2026-01-02")
    _direct(graph, "C", "D", 810, "2026-01-03")

    infer_pass_through_relationships(graph, max_hops=3)

    inferred = graph.get_edge_data("A", "D")["inferred:A:D"]
    assert inferred["hops"] == 3
    assert inferred["path"] == ["B", "C"]
    assert inferred["pass_through_ratio"] == 0.81
