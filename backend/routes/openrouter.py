import json
import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_RERANK_MODEL = os.getenv(
    "OPENROUTER_RERANK_MODEL",
    "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
)
OPENROUTER_HTTP_REFERER = os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:3000")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE", "AI Intelligence Network Team Delta")


class RerankRequest(BaseModel):
    query: str
    documents: List[Dict[str, Any]]
    top_n: Optional[int] = None
    model: Optional[str] = None


def rerank_documents(
    query: str,
    documents: List[Dict[str, Any]],
    top_n: Optional[int] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    if not query or not str(query).strip():
        raise ValueError("query cannot be empty")

    if not documents:
        raise ValueError("documents cannot be empty")

    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    payload = {
        "model": model or OPENROUTER_RERANK_MODEL,
        "query": query,
        "documents": documents,
    }
    if top_n is not None:
        payload["top_n"] = top_n

    response = requests.post(
        url=f"{OPENROUTER_BASE_URL}/rerank",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": OPENROUTER_HTTP_REFERER,
            "X-OpenRouter-Title": OPENROUTER_TITLE,
        },
        data=json.dumps(payload),
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


@router.post("/rerank")
def rerank(payload: RerankRequest):
    try:
        return rerank_documents(
            query=payload.query,
            documents=payload.documents,
            top_n=payload.top_n,
            model=payload.model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {exc}") from exc
