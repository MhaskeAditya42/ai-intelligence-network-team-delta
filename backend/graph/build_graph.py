from __future__ import annotations

import json
import networkx as nx
from pathlib import Path
from datetime import datetime
from typing import Optional
from graph.infer_relationships import (
    DEFAULT_MAX_HOPS,
    DEFAULT_PASS_THROUGH_THRESHOLD,
    DEFAULT_TIME_WINDOW_DAYS,
    infer_pass_through_relationships,
)

SCENARIOS_DIR = Path(__file__).resolve().parent.parent.parent / "data"
BATCHES_DIR = SCENARIOS_DIR / "batches"


def _validate_batch_month(batch_date: str) -> str:
    """Validate a monthly batch value and return its YYYY-MM representation."""
    try:
        return datetime.strptime(batch_date, "%Y-%m").strftime("%Y-%m")
    except (TypeError, ValueError) as exc:
        raise ValueError("batch_date must use the YYYY-MM format") from exc


def get_scenarios_dir(batch_date: Optional[str] = None) -> Path:
    """Return the data folder for a monthly batch, or the legacy data folder."""
    if batch_date is None:
        return SCENARIOS_DIR
    return BATCHES_DIR / _validate_batch_month(batch_date)


def list_available_batch_dates() -> list[str]:
    """Return only months that contain at least one generated scenario JSON file."""
    if not BATCHES_DIR.exists():
        return []
    dates = []
    for path in BATCHES_DIR.iterdir():
        if not path.is_dir():
            continue
        try:
            normalized = _validate_batch_month(path.name)
        except ValueError:
            continue
        if any(path.glob("*.json")):
            dates.append(normalized)
    return sorted(dates, reverse=True)


def build_graph_from_json(
    filepath: str,
    *,
    pass_through_threshold: float = DEFAULT_PASS_THROUGH_THRESHOLD,
    time_window_days: int = DEFAULT_TIME_WINDOW_DAYS,
    max_hops: int = DEFAULT_MAX_HOPS,
) -> nx.MultiDiGraph:
    """
    Builds a DiGraph from a scenario JSON file.
    Expects: {"nodes": [{"id": ..., ...attrs}], "edges": [{"source": ..., "target": ..., ...attrs}]}
    """
    with open(filepath, "r") as f:
        data = json.load(f)

    G = nx.MultiDiGraph()

    for node in data["nodes"]:
        node = dict(node)  # avoid mutating the original dict
        node_id = node.pop("id")
        G.add_node(node_id, **node)

    for edge in data["edges"]:
        edge = dict(edge)
        source = edge.pop("source")
        target = edge.pop("target")
        # ``edge_type`` is now the API/rendering contract. Preserve the old
        # business relationship label separately for scoring and display.
        relationship_type = edge.pop("edge_type", None)
        if relationship_type is None:
            relationship_type = edge.pop("relationship", None)
        G.add_edge(source, target, edge_type="direct", relationship_type=relationship_type, **edge)

    infer_pass_through_relationships(
        G,
        pass_through_threshold=pass_through_threshold,
        time_window_days=time_window_days,
        max_hops=max_hops,
    )

    return G


def list_available_scenarios(batch_date: Optional[str] = None) -> list[str]:
    """Return the stem names of all JSON scenario files in the data folder."""
    return sorted(path.stem for path in get_scenarios_dir(batch_date).glob("*.json"))


def _humanize_scenario_name(scenario_id: str) -> str:
    return scenario_id.replace("_", " ").title()


def list_scenario_infos(batch_date: Optional[str] = None) -> list[dict]:
    """Return metadata objects for all scenario JSON files."""
    scenarios = []
    scenarios_dir = get_scenarios_dir(batch_date)

    for path in sorted(scenarios_dir.glob("*.json")):
        with open(path, "r") as f:
            data = json.load(f)

        nodes = data.get("nodes", [])
        edges = data.get("edges", [])
        ids = [node.get("id") for node in nodes if node.get("id")]
        meta = data.get("meta", {})
        trigger_entity = meta.get("trigger_entity") or ("Entity_A" if "Entity_A" in ids else ids[0] if ids else None)

        scenarios.append({
            "id": path.stem,
            "name": meta.get("name", _humanize_scenario_name(path.stem)),
            "description": meta.get("description", f"Transaction network for {path.stem}."),
            "entities": ids,
            "trigger_entity": trigger_entity,
            "node_count": len(ids),
            "edge_count": len(edges),
            "batch_date": batch_date,
        })

    return scenarios


def get_scenario_info(scenario: str, batch_date: Optional[str] = None) -> dict:
    """Return metadata for a single scenario ID."""
    for info in list_scenario_infos(batch_date):
        if info["id"] == scenario:
            return info
    raise FileNotFoundError(f"Scenario '{scenario}' not found")


def build_synthetic_network(
    scenario: str = "scenario_config",
    batch_date: Optional[str] = None,
    *,
    pass_through_threshold: float = DEFAULT_PASS_THROUGH_THRESHOLD,
    time_window_days: int = DEFAULT_TIME_WINDOW_DAYS,
    max_hops: int = DEFAULT_MAX_HOPS,
) -> nx.MultiDiGraph:
    """Convenience wrapper — loads a scenario JSON file from the data folder."""
    default_path = get_scenarios_dir(batch_date) / f"{scenario}.json"
    return build_graph_from_json(
        str(default_path),
        pass_through_threshold=pass_through_threshold,
        time_window_days=time_window_days,
        max_hops=max_hops,
    )


if __name__ == "__main__":
    G = build_synthetic_network()
    print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")
