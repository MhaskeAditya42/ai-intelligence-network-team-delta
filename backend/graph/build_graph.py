import json
import networkx as nx
from pathlib import Path

SCENARIOS_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def build_graph_from_json(filepath: str) -> nx.DiGraph:
    """
    Builds a DiGraph from a scenario JSON file.
    Expects: {"nodes": [{"id": ..., ...attrs}], "edges": [{"source": ..., "target": ..., ...attrs}]}
    """
    with open(filepath, "r") as f:
        data = json.load(f)

    G = nx.DiGraph()

    for node in data["nodes"]:
        node = dict(node)  # avoid mutating the original dict
        node_id = node.pop("id")
        G.add_node(node_id, **node)

    for edge in data["edges"]:
        edge = dict(edge)
        source = edge.pop("source")
        target = edge.pop("target")
        G.add_edge(source, target, **edge)

    return G


def list_available_scenarios() -> list[str]:
    """Return the stem names of all JSON scenario files in the data folder."""
    return sorted(path.stem for path in SCENARIOS_DIR.glob("*.json"))


def _humanize_scenario_name(scenario_id: str) -> str:
    return scenario_id.replace("_", " ").title()


def list_scenario_infos() -> list[dict]:
    """Return metadata objects for all scenario JSON files."""
    scenarios = []

    for path in sorted(SCENARIOS_DIR.glob("*.json")):
        with open(path, "r") as f:
            data = json.load(f)

        nodes = data.get("nodes", [])
        edges = data.get("edges", [])
        ids = [node.get("id") for node in nodes if node.get("id")]
        trigger_entity = "Entity_A" if "Entity_A" in ids else ids[0] if ids else None

        scenarios.append({
            "id": path.stem,
            "name": _humanize_scenario_name(path.stem),
            "description": f"Transaction network for {path.stem}.",
            "entities": ids,
            "trigger_entity": trigger_entity,
            "node_count": len(ids),
            "edge_count": len(edges),
        })

    return scenarios


def get_scenario_info(scenario: str) -> dict:
    """Return metadata for a single scenario ID."""
    for info in list_scenario_infos():
        if info["id"] == scenario:
            return info
    raise FileNotFoundError(f"Scenario '{scenario}' not found")


def build_synthetic_network(scenario: str = "scenario_config") -> nx.DiGraph:
    """Convenience wrapper — loads a scenario JSON file from the data folder."""
    default_path = SCENARIOS_DIR / f"{scenario}.json"
    return build_graph_from_json(str(default_path))


if __name__ == "__main__":
    G = build_synthetic_network()
    print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")