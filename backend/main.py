from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import analyze, sar_report, relationship_scores

app = FastAPI(title="Network Intelligence Framework API")

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

@app.get("/")
def health_check():
    return {"status": "ok"}