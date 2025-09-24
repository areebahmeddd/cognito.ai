from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.schemas import QueryRequest, UFDRDocument
from ..services.agent import analyze_intent, build_query
from ..services.elasticsearch import es_client, index_name

router = APIRouter()


@router.post("/query", response_model=Dict[str, Any])
async def search_query(request: QueryRequest):
    try:
        plan = analyze_intent(request.query)
        dsl = build_query(plan)
        resp = es_client.search(index=index_name, body=dsl)
        docs = [h.get("_source", {}) for h in resp.get("hits", {}).get("hits", [])]
        hits: list[UFDRDocument] = []
        for doc in docs[:50]:
            try:
                hits.append(UFDRDocument(**doc))
            except Exception:
                continue

        return {
            "query": request.query,
            "query_intent": plan.get("query_intent", "forensic_analysis"),
            "total_results": len(hits),
            "results": hits,
            "took": resp.get("took", 0),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
