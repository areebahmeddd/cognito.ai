"""Forensic API endpoints for natural language queries."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
from pydantic import BaseModel

from ..models.schemas import UFDRDocument
from ..services.query import get_forensic_converter
from ..services.elasticsearch import search_with_dsl

router = APIRouter(tags=["forensic"])


class ForensicQueryRequest(BaseModel):
    """Request model for forensic queries."""
    query: str


@router.post("/query", response_model=Dict[str, Any])
async def forensic_query(request: ForensicQueryRequest):
    """
    Main forensic query endpoint - takes natural language query and returns all relevant results with analysis.
    
    Args:
        request: Natural language query
        
    Returns:
        Complete forensic analysis with all results and insights
    """
    try:
        converter = get_forensic_converter()
        converted_query = converter.convert_to_elasticsearch(request.query)
        
        # Execute the converted query with no size limit to get all results
        response = search_with_dsl(
            query_dict=converted_query.query,
            size=10000,  # Large number to get all results
            from_=0,
            sort=converted_query.sort,
            highlight=converted_query.highlight
        )
        
        hits = []
        for hit in response["hits"]["hits"]:
            doc_data = hit["_source"]
            if "highlight" in hit:
                doc_data["highlight"] = hit["highlight"]
            hits.append(UFDRDocument(**doc_data))
        
        # Analyze the results
        analysis = _analyze_search_results(hits, request.query)
        
        return {
            "query": request.query,
            "query_intent": converted_query.query_intent,
            "total_results": response["hits"]["total"]["value"],
            "analysis": analysis,
            "results": hits,
            "took": response["took"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensic query failed: {str(e)}")


def _analyze_search_results(hits: list, query: str) -> Dict[str, Any]:
    """Analyze search results and provide insights."""
    if not hits:
        return {
            "summary": "No relevant evidence found for the query.",
            "key_findings": [],
            "recommendations": ["Try broadening your search terms or checking different time periods."]
        }
    
    # Extract key information
    evidence_types = {}
    participants = set()
    time_range = {"earliest": None, "latest": None}
    key_findings = []
    
    for hit in hits:
        # Count evidence types
        evidence_type = hit.type
        evidence_types[evidence_type] = evidence_types.get(evidence_type, 0) + 1
        
        # Collect participants
        if hit.participants:
            participants.update(hit.participants)
        
        # Track time range
        if hit.timestamp:
            if not time_range["earliest"] or hit.timestamp < time_range["earliest"]:
                time_range["earliest"] = hit.timestamp
            if not time_range["latest"] or hit.timestamp > time_range["latest"]:
                time_range["latest"] = hit.timestamp
        
        # Extract key findings based on query intent
        if "crypto" in query.lower() and hit.text and any(word in hit.text.lower() for word in ["crypto", "bitcoin", "ethereum", "upi"]):
            key_findings.append(f"Cryptocurrency reference found in {hit.type}: {hit.text[:100]}...")
        
        if "foreign" in query.lower() and hit.from_ and str(hit.from_).startswith("+"):
            key_findings.append(f"International number detected: {hit.from_}")
        
        if "meeting" in query.lower() and hit.text and any(word in hit.text.lower() for word in ["meet", "location", "place"]):
            key_findings.append(f"Meeting reference found: {hit.text[:100]}...")
    
    # Generate summary
    summary = f"Found {len(hits)} pieces of evidence across {len(evidence_types)} different types."
    if participants:
        summary += f" Involves {len(participants)} unique participants."
    
    # Generate recommendations
    recommendations = []
    if len(hits) > 10:
        recommendations.append("Large number of results found. Consider adding time filters to narrow down the search.")
    if evidence_types.get("message", 0) > 5:
        recommendations.append("Multiple messages found. Review communication patterns and timestamps.")
    if evidence_types.get("transaction", 0) > 0:
        recommendations.append("Financial transactions detected. Review payment methods and amounts.")
    
    return {
        "summary": summary,
        "evidence_types": evidence_types,
        "participants": list(participants),
        "time_range": time_range,
        "key_findings": key_findings[:5],  # Limit to top 5 findings
        "recommendations": recommendations
    }
