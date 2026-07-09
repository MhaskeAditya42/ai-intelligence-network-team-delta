"""
run_all_scenarios.py

Runs the full detection pipeline (signals -> worker agents -> orchestrator)
against every *.json file found in the data/ folder, for a given target node.

Usage (from backend/):
    python run_all_scenarios.py
    python run_all_scenarios.py --target Entity_A
    python run_all_scenarios.py --data-dir ../data --verbose
"""

import argparse
import json
from pathlib import Path

from ..graph.build_graph import build_graph_from_json
from ..agents.orchestrator import generate_ai_recommendation


def run_all(data_dir: Path, target: str, verbose: bool) -> list[dict]:
    results = []
    scenario_files = sorted(data_dir.glob("*.json"))

    if not scenario_files:
        print(f"No .json scenario files found in {data_dir.resolve()}")
        return results

    for filepath in scenario_files:
        try:
            G = build_graph_from_json(str(filepath))
        except Exception as e:
            results.append({
                "scenario": filepath.stem,
                "classification": "LOAD_ERROR",
                "error": str(e),
            })
            continue

        if target not in G.nodes:
            results.append({
                "scenario": filepath.stem,
                "classification": "TARGET_NOT_IN_GRAPH",
            })
            continue

        recommendation = generate_ai_recommendation(G, target)
        row = {
            "scenario": filepath.stem,
            "classification": recommendation.get("classification"),
        }
        if verbose:
            row["rationale"] = recommendation.get("rationale")
            row["risk_indicators"] = recommendation.get("risk_indicators")
        results.append(row)

    return results


def print_summary_table(results: list[dict]) -> None:
    name_width = max((len(r["scenario"]) for r in results), default=8) + 2
    print(f"\n{'SCENARIO'.ljust(name_width)}CLASSIFICATION")
    print("-" * (name_width + 25))
    for r in results:
        print(f"{r['scenario'].ljust(name_width)}{r['classification']}")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run all scenario_config-style JSON files through the pipeline.")
    parser.add_argument("--target", default="Entity_A", help="Target node to analyze in each scenario")
    parser.add_argument("--data-dir", default="../data", help="Folder containing scenario *.json files")
    parser.add_argument("--verbose", action="store_true", help="Print full rationale + risk indicators for each scenario")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    results = run_all(data_dir, args.target, args.verbose)

    if args.verbose:
        print(json.dumps(results, indent=2, default=str))
    else:
        print_summary_table(results)