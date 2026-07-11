from fastapi import APIRouter, HTTPException, Query

from graph.build_graph import build_synthetic_network, list_available_scenarios
from graph.extract_signals import extract_network_signals

router = APIRouter()


def get_graph(
    scenario: str = "scenario_config",
    batch_date: str | None = None,
    pass_through_threshold: float = 0.80,
    time_window_days: int = 7,
):
    try:
        return build_synthetic_network(
            scenario,
            batch_date,
            pass_through_threshold=pass_through_threshold,
            time_window_days=time_window_days,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario}' not found")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/scenarios")
def list_scenarios(batch_date: str | None = Query(default=None)):
    try:
        return {"scenarios": list_available_scenarios(batch_date)}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/{entity}")
def analyze_entity(entity: str):
    G = get_graph()

    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found in scenario 'scenario_config'")

    signals = extract_network_signals(G, entity)

    return {
        "entity": entity,
        "scenario": "scenario_config",
        "signals": signals,
        "graph": {
            "nodes": [{"id": n, **attrs} for n, attrs in G.nodes(data=True)],
            "edges": [
                {"source": u, "target": v, **attrs}
                for u, v, _, attrs in G.edges(keys=True, data=True)
            ],
        },
    }


@router.get("/{scenario}/{entity}")
def analyze_entity_scenario(
    scenario: str,
    entity: str,
    batch_date: str | None = Query(default=None),
    pass_through_threshold: float = Query(default=0.80, gt=0, le=1),
    time_window_days: int = Query(default=7, ge=0),
):
    G = get_graph(scenario, batch_date, pass_through_threshold, time_window_days)

    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found in scenario '{scenario}'")

    signals = extract_network_signals(G, entity)

    return {
        "entity": entity,
        "scenario": scenario,
        "batch_date": batch_date,
        "inference_config": {
            "pass_through_threshold": pass_through_threshold,
            "time_window_days": time_window_days,
            "max_hops": 2,
        },
        "signals": signals,
        "graph": {
            "nodes": [{"id": n, **attrs} for n, attrs in G.nodes(data=True)],
            "edges": [
                {"source": u, "target": v, **attrs}
                for u, v, _, attrs in G.edges(keys=True, data=True)
            ],
        },
    }
