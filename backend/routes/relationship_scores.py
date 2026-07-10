from fastapi import APIRouter, HTTPException, Query

from graph.build_graph import build_synthetic_network
from graph.score_relation import score_relationships

router = APIRouter()
_graph_cache = {}


def get_graph(scenario: str, batch_date: str | None = None):
    cache_key = (scenario, batch_date)
    if cache_key not in _graph_cache:
        try:
            _graph_cache[cache_key] = build_synthetic_network(scenario, batch_date)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Scenario '{scenario}' not found")
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    return _graph_cache[cache_key]


@router.get("/{scenario}")
def relationship_scores(scenario: str, batch_date: str | None = Query(default=None)):
    G = get_graph(scenario, batch_date)
    scores = score_relationships(G)
    return {
        "scenario": scenario,
        "batch_date": batch_date,
        "edge_scores": [
            {"source": s, "target": t, **info}
            for (s, t), info in scores.items()
        ],
    }
