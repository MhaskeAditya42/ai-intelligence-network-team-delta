from fastapi import APIRouter, HTTPException

from graph.build_graph import build_synthetic_network
from graph.extract_signals import extract_network_signals

router = APIRouter()

# Build once at startup — fine for a hackathon demo
G = build_synthetic_network()


@router.get("/{entity}")
def analyze_entity(entity: str):
    if entity not in G.nodes:
        raise HTTPException(status_code=404, detail=f"Entity '{entity}' not found in graph")

    signals = extract_network_signals(G, entity)

    return {
        "entity": entity,
        "signals": signals,
        "graph": {
            "nodes": [{"id": n, **attrs} for n, attrs in G.nodes(data=True)],
            "edges": [
                {"source": u, "target": v, **attrs}
                for u, v, attrs in G.edges(data=True)
            ],
        },
    }