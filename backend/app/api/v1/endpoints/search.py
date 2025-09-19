from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from ....models.schemas import (
    SearchRequest,
    SearchResponse,
    TimelineRequest,
    TimelineResponse,
    UFDRDocument,
    TimelineBucket,
)
from ....services.elasticsearch_service import search_text, get_time, search_with_dsl, es_client, index_name

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_content_endpoint(request: SearchRequest):
    try:
        # Use the original text search
        response = search_text(
            query=request.query, size=request.size, from_=request.from_
        )

        hits = []
        for hit in response["hits"]["hits"]:
            doc_data = hit["_source"]
            if "highlight" in hit:
                doc_data["highlight"] = hit["highlight"]
            hits.append(UFDRDocument(**doc_data))

        return SearchResponse(
            hits=hits, total=response["hits"]["total"]["value"], took=response["took"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/timeline", response_model=TimelineResponse)
async def get_timeline_endpoint(request: TimelineRequest):
    try:
        response = get_time(interval=request.interval, filters=request.filters)

        buckets = []
        for bucket in response["aggregations"]["timeline"]["buckets"]:
            buckets.append(
                TimelineBucket(
                    timestamp=bucket["key_as_string"], count=bucket["doc_count"]
                )
            )

        return TimelineResponse(buckets=buckets, took=response["took"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timeline failed: {str(e)}")
