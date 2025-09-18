import time
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from ....models.schemas import (
    NaturalLanguageQueryRequest,
    NaturalLanguageQueryResponse,
    SearchRequest,
    SearchResponse,
    UFDRDocument,
)
from ....services.forensic_query_service import get_forensic_converter, ForensicQueryConverter
from ....services.elasticsearch_service import search_text

router = APIRouter(tags=["forensic"])


@router.post("/convert-query", response_model=NaturalLanguageQueryResponse)
async def convert_natural_language_query(
    request: NaturalLanguageQueryRequest,
    converter: ForensicQueryConverter = Depends(get_forensic_converter)
):
    """Convert natural language query to Elasticsearch Query DSL"""
    try:
        start_time = time.time()
        
        # Convert the natural language query
        converted_query = converter.convert_to_elasticsearch(request.query)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return NaturalLanguageQueryResponse(
            original_query=request.query,
            converted_query=converted_query,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Query conversion failed: {str(e)}"
        )


@router.post("/search-natural", response_model=SearchResponse)
async def search_with_natural_language(
    request: NaturalLanguageQueryRequest,
    converter: ForensicQueryConverter = Depends(get_forensic_converter)
):
    """Search using natural language query (converts and executes)"""
    try:
        start_time = time.time()
        
        # Convert the natural language query
        converted_query = converter.convert_to_elasticsearch(request.query)
        
        # Execute the converted query using Elasticsearch
        search_body = {
            "query": converted_query.query,
            "size": request.size,
            "sort": converted_query.sort,
            "highlight": converted_query.highlight
        }
        
        # Use the existing search_text function but with our custom query
        from ....services.elasticsearch_service import es_client, index_name
        response = es_client.search(index=index_name, body=search_body)
        
        # Process the response similar to the existing search endpoint
        hits = []
        for hit in response["hits"]["hits"]:
            doc_data = hit["_source"]
            if "highlight" in hit:
                doc_data["highlight"] = hit["highlight"]
            hits.append(UFDRDocument(**doc_data))
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return SearchResponse(
            hits=hits, 
            total=response["hits"]["total"]["value"], 
            took=execution_time
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Natural language search failed: {str(e)}"
        )
