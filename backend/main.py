from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import analyze, sar_report

app = FastAPI(title="Network Intelligence Framework API")

# Allow frontend (React dev server) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this later if time allows
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(sar_report.router, prefix="/sar-report", tags=["sar-report"])


@app.get("/")
def health_check():
    return {"status": "ok"}