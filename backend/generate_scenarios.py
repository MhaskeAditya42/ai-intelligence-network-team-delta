#!/usr/bin/env python3
"""
generate_scenarios_from_properties.py

Reads one monthly consolidated JSON file. It accepts either a FLAT list of entities
where each entity carries its own outgoing-edge info via three fields:

    target_node   id of the entity this one sends funds to (or null)
    amount        mock transaction amount for that transfer
    edge_type     relationship/transaction type for that transfer

Because entities only ever link to other entities that live in the same
file, the file as a whole is actually several independent graphs sitting
side by side. This script:

  1. Builds one directed graph (networkx.DiGraph) from every
     (entity["id"] -> entity["target_node"]) edge.
  2. Splits it into weakly-connected components — each component is one
     independent scenario.
  3. For each component, emits a {meta, nodes, edges} JSON file using the
     same schema the backend's build_graph_from_json() already expects
     (edges carry source/target/amount/edge_type; the three raw-linking
     fields are stripped back out of the node objects since that
     information now lives in the edges list instead).
  4. Auto-labels each scenario's complexity (simple / medium / complex)
     from node count + whether it contains a cycle, and auto-picks a
     sensible trigger_entity (a node on a cycle if one exists, else a
     root node with no incoming edges, else the first node).

Usage:
    python3 generate_scenarios_from_properties.py

Input:
    data/raw/aggregated_entity_properties.json

Output:
    data/batches/YYYY-MM/scenario_<01, 02, ...>_<complexity>.json
"""

import argparse
import json
import threading
import time
from datetime import datetime
from pathlib import Path

import networkx as nx

try:
    from watchdog.events import PatternMatchingEventHandler
    from watchdog.observers import Observer
except ImportError:  # pragma: no cover
    Observer = None
    PatternMatchingEventHandler = None

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "raw" / "aggregated_entity_properties.json"
DATA_DIR = PROJECT_ROOT / "data"
MONTHLY_INPUTS_DIR = DATA_DIR / "monthly"

EDGE_LINK_FIELDS = ("target_node", "amount", "edge_type")


def load_consolidated_graph(path: Path) -> nx.DiGraph:
    """Load either the legacy ``entities`` input or a nodes/edges consolidated graph."""
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    entities = data.get("entities")
    if entities is not None:
        return build_full_graph(entities)

    if "nodes" not in data or "edges" not in data:
        raise ValueError(f"Expected either an 'entities' key or 'nodes'/'edges' keys in {path}")

    graph = nx.DiGraph()
    for node in data["nodes"]:
        node = dict(node)
        node_id = node.pop("id")
        graph.add_node(node_id, **node)
    for edge in data["edges"]:
        edge = dict(edge)
        source, target = edge.pop("source"), edge.pop("target")
        graph.add_edge(source, target, **edge)
    return graph


def build_full_graph(entities):
    """One DiGraph across ALL entities in the file; edges come from each
    entity's own target_node/amount/edge_type fields."""
    g = nx.DiGraph()
    by_id = {e["id"]: e for e in entities}

    for e in entities:
        g.add_node(e["id"], **{k: v for k, v in e.items() if k not in EDGE_LINK_FIELDS})

    for e in entities:
        target = e.get("target_node")
        if not target:
            continue
        if target not in by_id:
            raise ValueError(f"{e['id']} points to unknown target_node {target}")
        g.add_edge(e["id"], target, amount=e["amount"], edge_type=e["edge_type"])

    return g


def classify_complexity(component_graph: nx.DiGraph):
    n = component_graph.number_of_nodes()
    has_cycle = len(list(nx.simple_cycles(component_graph))) > 0
    if n <= 3:
        return "simple"
    if n <= 6 and not has_cycle:
        return "medium"
    if n <= 6 and has_cycle:
        return "mixed"
    return "complex"


def pick_trigger_entity(component_graph: nx.DiGraph):
    cycles = list(nx.simple_cycles(component_graph))
    if cycles:
        # prefer a node that starts the longest cycle
        longest = max(cycles, key=len)
        return longest[0]
    roots = [n for n in component_graph.nodes if component_graph.in_degree(n) == 0]
    if roots:
        return sorted(roots)[0]
    return sorted(component_graph.nodes)[0]


def describe(component_graph: nx.DiGraph, complexity: str):
    types_present = sorted({component_graph.nodes[n].get("type", "Unknown")
                             for n in component_graph.nodes})
    edge_types_present = sorted({
        d.get("edge_type") or d.get("relationship", "Unknown")
        for _, _, d in component_graph.edges(data=True)
    })
    has_cycle = len(list(nx.simple_cycles(component_graph))) > 0
    watchlisted = [n for n in component_graph.nodes if component_graph.nodes[n].get("watchlist_hit")]
    bits = [
        f"{component_graph.number_of_nodes()} nodes, {component_graph.number_of_edges()} edges",
        f"entity types: {', '.join(types_present)}",
        f"relationship types: {', '.join(edge_types_present)}",
    ]
    if has_cycle:
        bits.append("contains a closed cycle (UBO round-trip pattern)")
    if watchlisted:
        bits.append(f"{len(watchlisted)} watchlisted entit{'y' if len(watchlisted)==1 else 'ies'} present")
    return f"Auto-generated {complexity} scenario. " + "; ".join(bits) + "."


def build_scenario_payload(component_graph: nx.DiGraph, index: int, complexity: str):
    nodes = [dict(component_graph.nodes[n], id=n) for n in sorted(component_graph.nodes)]
    edges = [{"source": s, "target": t, **d} for s, t, d in component_graph.edges(data=True)]
    trigger = pick_trigger_entity(component_graph)

    return {
        "meta": {
            "name": f"Auto-Generated Scenario {index:02d} ({complexity.title()})",
            "description": describe(component_graph, complexity),
            "trigger_entity": trigger,
        },
        "nodes": nodes,
        "edges": edges,
    }


def _validate_batch_month(batch_month: str) -> str:
    try:
        return datetime.strptime(batch_month, "%Y-%m").strftime("%Y-%m")
    except ValueError as exc:
        raise ValueError("--month must use the YYYY-MM format") from exc


def batch_output_dir(batch_month: str | None) -> Path:
    """Place generated scenarios in data/batches/YYYY-MM."""
    if batch_month is None:
        return DATA_DIR
    normalized = _validate_batch_month(batch_month)
    return DATA_DIR / "batches" / normalized


def monthly_input_path(batch_month: str) -> Path:
    """Conventional location for the single source JSON received each month."""
    return MONTHLY_INPUTS_DIR / _validate_batch_month(batch_month) / "consolidated.json"


def main(input_path: Path | None = None, batch_month: str | None = None):
    if batch_month and input_path is None:
        input_path = monthly_input_path(batch_month)
    input_path = input_path or INPUT_PATH
    full_graph = load_consolidated_graph(input_path)
    output_dir = batch_output_dir(batch_month)

    components = list(nx.weakly_connected_components(full_graph))
    # deterministic ordering: sort components by their smallest node id
    components.sort(key=lambda comp: sorted(comp)[0])

    output_dir.mkdir(parents=True, exist_ok=True)
    written = []

    for i, comp_nodes in enumerate(components, start=1):
        component_graph = full_graph.subgraph(comp_nodes).copy()
        complexity = classify_complexity(component_graph)
        payload = build_scenario_payload(component_graph, i, complexity)

        filename = f"scenario_{i:02d}_{complexity}.json"
        out_path = output_dir / filename
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        written.append(out_path)
        print(f"wrote {out_path}  ({component_graph.number_of_nodes()} nodes, "
              f"{component_graph.number_of_edges()} edges, {complexity})")

    print(f"\nFound {len(components)} independent graph(s) in {input_path.name}; "
          f"wrote {len(written)} scenario file(s) to {output_dir}/")


def watch_input_file(path: Path, batch_month: str | None = None):
    if Observer is None or PatternMatchingEventHandler is None:
        raise RuntimeError(
            "watchdog is required for watch mode. Install it with 'pip install watchdog'."
        )

    print(f"Watching {path} for updates...")
    debounce_timer = {"timer": None}

    def trigger_generation():
        print(f"Detected update to {path}. Regenerating scenarios...")
        try:
            main(path, batch_month)
        except Exception as exc:
            print(f"Generation failed: {exc}")

    def schedule_run():
        if debounce_timer["timer"]:
            debounce_timer["timer"].cancel()
        timer = threading.Timer(0.6, trigger_generation)
        timer.daemon = True
        debounce_timer["timer"] = timer
        timer.start()

    def on_modified(event):
        schedule_run()

    def on_created(event):
        schedule_run()

    event_handler = PatternMatchingEventHandler(patterns=[str(path)], ignore_directories=True)
    event_handler.on_modified = on_modified
    event_handler.on_created = on_created

    observer = Observer()
    observer.schedule(event_handler, path=str(path.parent), recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate scenario JSON files from raw aggregated data.")
    parser.add_argument("--watch", action="store_true", help="Watch the input JSON and regenerate when it changes.")
    parser.add_argument("--input", type=Path, help="Monthly consolidated JSON to process.")
    parser.add_argument("--month", help="Month to generate, in YYYY-MM. Defaults input to data/monthly/YYYY-MM/consolidated.json.")
    args = parser.parse_args()

    main(args.input, args.month)
    if args.watch:
        watch_path = args.input or monthly_input_path(args.month) if args.month else INPUT_PATH
        watch_input_file(watch_path, args.month)
