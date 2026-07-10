from fastapi import APIRouter, HTTPException, Query

from graph.build_graph import build_synthetic_network, list_available_scenarios
from graph.extract_signals import extract_network_signals
from graph.score_relation import score_relationships
from agents.orchestrator import generate_ai_recommendation
from agents.worker_gatekeeper import identify_gatekeepers
from agents.worker_mule import identify_mule_layerers
from agents.worker_ubo import identify_ultimate_beneficiaries

router = APIRouter()
_graph_cache = {}


def graph_to_json(G):
    return {
        "nodes": [
            {"id": node, **G.nodes[node]}
            for node in G.nodes
        ],
        "edges": [
            {"source": u, "target": v, **G.edges[u, v]}
            for u, v in G.edges
        ],
    }


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


@router.get("/scenarios")
def list_scenarios(batch_date: str | None = Query(default=None)):
    try:
        return {"scenarios": list_available_scenarios(batch_date)}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/{scenario}/{entity}")
def sar_report(scenario: str, entity: str, batch_date: str | None = Query(default=None)):
    G = get_graph(scenario, batch_date)

    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found")

    signals = extract_network_signals(G, entity)
    recommendation = generate_ai_recommendation(G, entity)
    graph_payload = graph_to_json(G)

    edge_scores = score_relationships(G)
    return {
        "entity": entity,
        "scenario": scenario,
        "batch_date": batch_date,
        "signals": signals,
        "recommendation": recommendation,
        "relationship_scores": {
            "edge_scores": [
                {
                    "source": source,
                    "target": target,
                    **info,
                }
                for (source, target), info in edge_scores.items()
            ]
        },
        "role_analysis": {
            "gatekeepers": identify_gatekeepers(G, entity, signals),
            "mules": identify_mule_layerers(G, entity, signals),
            "ultimate_beneficiaries": identify_ultimate_beneficiaries(G, entity, signals),
        },
        "nodes": graph_payload["nodes"],
        "edges": graph_payload["edges"],
    }
