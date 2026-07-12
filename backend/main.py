from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from graph.build_graph import get_scenario_info, list_available_batch_dates, list_scenario_infos
from routes import analyze, sar_report, relationship_scores, openrouter

app = FastAPI(title="Argus AML API")

# Allow frontend (React dev server) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(sar_report.router, prefix="/sar-report", tags=["sar-report"])
app.include_router(relationship_scores.router, prefix="/relationship-scores", tags=["relationship-scores"])
app.include_router(openrouter.router, prefix="/openrouter", tags=["openrouter"])

@app.get("/scenarios")
def list_scenarios(batch_date: Optional[str] = Query(default=None)):
    try:
        return {"scenarios": list_scenario_infos(batch_date)}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.get("/batches")
def list_batches():
    """Dates that have completed, queryable data batches."""
    return {"batch_dates": list_available_batch_dates()}


@app.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str, batch_date: Optional[str] = Query(default=None)):
    try:
        return get_scenario_info(scenario_id, batch_date)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")


@app.get("/")
def health_check():
    return {"status": "ok"}
