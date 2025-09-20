from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.schemas import QueryRequest, UFDRDocument
from ..services.elasticsearch import search_dsl
from ..services.query import convert_query

router = APIRouter(tags=["search"])


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
            "query_intent": converted_query.query_intent,
            "total_results": response["hits"]["total"]["value"],
            "analysis": analysis,
            "results": hits,
            "took": response["took"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


def _analyze_results(hits: list, query: str) -> Dict[str, Any]:
    if not hits:
        return {
            "summary": "No relevant evidence found for the query.",
            "key_findings": [],
            "recommendations": [
                "Try broadening your search terms or checking different time periods."
            ],
        }

    evidence_types = {}
    participants = set()
    time_range = {"earliest": None, "latest": None}
    key_findings = []

    for hit in hits:
        evidence_type = hit.type
        evidence_types[evidence_type] = evidence_types.get(evidence_type, 0) + 1

        if hit.participants:
            participants.update(hit.participants)

        if hit.timestamp:
            if not time_range["earliest"] or hit.timestamp < time_range["earliest"]:
                time_range["earliest"] = hit.timestamp
            if not time_range["latest"] or hit.timestamp > time_range["latest"]:
                time_range["latest"] = hit.timestamp

        if (
            "crypto" in query.lower()
            and hit.text
            and any(
                word in hit.text.lower()
                for word in ["crypto", "bitcoin", "ethereum", "upi"]
            )
        ):
            key_findings.append(
                f"Cryptocurrency reference found in {hit.type}: {hit.text[:100]}..."
            )

        if "foreign" in query.lower() and hit.from_ and str(hit.from_).startswith("+"):
            key_findings.append(f"International number detected: {hit.from_}")

        if (
            "meeting" in query.lower()
            and hit.text
            and any(word in hit.text.lower() for word in ["meet", "location", "place"])
        ):
            key_findings.append(f"Meeting reference found: {hit.text[:100]}...")

    summary = f"Found {len(hits)} pieces of evidence across {len(evidence_types)} different types."
    if participants:
        summary += f" Involves {len(participants)} unique participants."

    recommendations = []
    if len(hits) > 10:
        recommendations.append(
            "Large number of results found. Consider adding time filters to narrow down the search."
        )
    if evidence_types.get("message", 0) > 5:
        recommendations.append(
            "Multiple messages found. Review communication patterns and timestamps."
        )
    if evidence_types.get("transaction", 0) > 0:
        recommendations.append(
            "Financial transactions detected. Review payment methods and amounts."
        )

    return {
        "summary": summary,
        "evidence_types": evidence_types,
        "participants": list(participants),
        "time_range": time_range,
        "key_findings": key_findings[:5],
        "recommendations": recommendations,
    }
