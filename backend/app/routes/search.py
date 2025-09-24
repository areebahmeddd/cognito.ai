from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.schemas import QueryRequest, UFDRDocument

router = APIRouter()


@router.post("/query", response_model=Dict[str, Any])
async def search_query(request: QueryRequest):
    try:
        converted_query = convert_query(request.query)
        response = search_dsl(
            query_dict=converted_query.query,
            size=10000,
            from_=0,
            sort=converted_query.sort,
            highlight=converted_query.highlight,
        )

        hits = []
        for hit in response["hits"]["hits"]:
            doc_data = hit["_source"]
            if "highlight" in hit:
                doc_data["highlight"] = hit["highlight"]
            hits.append(UFDRDocument(**doc_data))

        analysis = _analyze_results(hits, request.query)

        return {
            "query": request.query,
            "query_intent": plan.get("query_intent", "forensic_analysis"),
            "total_results": len(hits),
            "results": hits,
            "took": response["took"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
