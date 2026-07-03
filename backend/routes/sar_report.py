from fastapi import APIRouter, HTTPException

from graph.build_graph import build_synthetic_network
from graph.extract_signals import extract_network_signals

router = APIRouter()
G = build_synthetic_network()


@router.get("/{entity}")
def sar_report(entity: str):
    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found")

    signals = extract_network_signals(G, entity)

    # TODO(teammate B): replace this stub with real call to agents/orchestrator.py
    return {
        "entity": entity,
        "classification": "PENDING_AI_REVIEW",
        "rationale": "Stub response — orchestrator agent not yet wired.",
        "signals_used": signals,
    }