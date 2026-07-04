import json
import networkx as nx
from pathlib import Path


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


def build_synthetic_network() -> nx.DiGraph:
    """Convenience wrapper — loads the default scenario_config.json"""
    default_path = Path(__file__).parent.parent.parent / "data" / "scenario_config.json"
    return build_graph_from_json(str(default_path))


if __name__ == "__main__":
    G = build_synthetic_network()
    print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")