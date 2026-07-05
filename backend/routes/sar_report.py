from fastapi import APIRouter, HTTPException
from pathlib import Path

from graph.build_graph import build_graph_from_json
from graph.extract_signals import extract_network_signals
from agents.orchestrator import generate_ai_recommendation
from agents.worker_gatekeeper import identify_gatekeepers
from agents.worker_mule import identify_mule_layerers
from agents.worker_ubo import identify_ultimate_beneficiaries

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


@router.get("/{scenario}/{entity}")
def sar_report(scenario: str, entity: str):
    G = get_graph(scenario)

    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found")

    signals = extract_network_signals(G, entity)
    recommendation = generate_ai_recommendation(entity, signals)

    return {
        "entity": entity,
        "scenario": scenario,
        "signals": signals,
        "recommendation": recommendation,
        "role_analysis": {
            "gatekeepers": identify_gatekeepers(G, entity, signals),
            "mules": identify_mule_layerers(G, entity, signals),
            "ultimate_beneficiaries": identify_ultimate_beneficiaries(G, entity, signals),
        },
    }