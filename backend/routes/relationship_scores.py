from fastapi import APIRouter, HTTPException
from pathlib import Path

from graph.build_graph import build_graph_from_json
from graph.score_relation import score_relationships

router = APIRouter()
SCENARIOS_DIR = Path(__file__).parent.parent.parent / "data"
_graph_cache = {}


def get_graph(scenario: str):
    if scenario not in _graph_cache:
        filepath = SCENARIOS_DIR / f"{scenario}.json"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"Scenario '{scenario}' not found")
        _graph_cache[scenario] = build_graph_from_json(str(filepath))
    return _graph_cache[scenario]


@router.get("/{scenario}")
def relationship_scores(scenario: str):
    G = get_graph(scenario)
    scores = score_relationships(G)
    return {
        "scenario": scenario,
        "edge_scores": [
            {"source": s, "target": t, **info}
            for (s, t), info in scores.items()
        ],
    }