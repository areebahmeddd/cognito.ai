from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.schemas import QueryRequest, UFDRDocument
from ..services.agent import analyze_intent, build_query
from ..services.elasticsearch import es_client, index_name

router = APIRouter()


@router.post("/query", response_model=Dict[str, Any])
async def search_query(request: QueryRequest) -> Dict[str, Any]:
    try:
        intent_plan = analyze_intent(request.query)
        elasticsearch_dsl = build_query(intent_plan)

        if "query" in elasticsearch_dsl:
            if "bool" not in elasticsearch_dsl["query"]:
                elasticsearch_dsl["query"] = {
                    "bool": {"must": [elasticsearch_dsl["query"]]}
                }

            if "filter" not in elasticsearch_dsl["query"]["bool"]:
                elasticsearch_dsl["query"]["bool"]["filter"] = []
            elasticsearch_dsl["query"]["bool"]["filter"].append(
                {"term": {"case_id": request.case_id}}
            )

        search_response = es_client.search(index=index_name, body=elasticsearch_dsl)
        raw_documents = [
            hit.get("_source", {})
            for hit in search_response.get("hits", {}).get("hits", [])
        ]

        validated_documents: list[UFDRDocument] = []
        for document in raw_documents[:50]:
            try:
                validated_documents.append(UFDRDocument(**document))
            except Exception:
                continue

        return {
            "query": request.query,
            "query_intent": intent_plan.get("query_intent", "forensic_analysis"),
            "total_results": len(validated_documents),
            "results": validated_documents,
            "took": search_response.get("took", 0),
        }
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Search query failed: {str(error)}"
        )
