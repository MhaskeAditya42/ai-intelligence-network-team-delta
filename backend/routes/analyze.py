from fastapi import APIRouter, HTTPException

from ..graph.build_graph import build_synthetic_network, list_available_scenarios
from ..graph.extract_signals import extract_network_signals

router = APIRouter()


def get_graph(scenario: str = "scenario_config"):
    try:
        return build_synthetic_network(scenario)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario}' not found")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/scenarios")
def list_scenarios():
    return {"scenarios": list_available_scenarios()}


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
                for u, v, attrs in G.edges(data=True)
            ],
        },
    }


@router.get("/{scenario}/{entity}")
def analyze_entity_scenario(scenario: str, entity: str):
    G = get_graph(scenario)

    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found in scenario '{scenario}'")

    signals = extract_network_signals(G, entity)

    return {
        "entity": entity,
        "scenario": scenario,
        "signals": signals,
        "graph": {
            "nodes": [{"id": n, **attrs} for n, attrs in G.nodes(data=True)],
            "edges": [
                {"source": u, "target": v, **attrs}
                for u, v, attrs in G.edges(data=True)
            ],
        },
    }