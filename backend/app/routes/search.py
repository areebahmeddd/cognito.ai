from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.schemas import QueryRequest, UFDRDocument
from ..services.agent import gemini_agent

router = APIRouter()


@router.post("/query", response_model=Dict[str, Any])
async def search_query(request: QueryRequest):
    try:
        result = gemini_agent.process_query(request.query)

        hits = []
        for hit in result.get("results", []):
            try:
                hits.append(UFDRDocument(**hit))
            except Exception:
                continue

        return {
            "query": request.query,
            "query_intent": result.get("query_intent", "forensic_analysis"),
            "total_results": result.get("total_results", 0),
            "results": hits,
            "tools_used": result.get("tools_used", []),
            "took": 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
