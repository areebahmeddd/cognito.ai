import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    SearchRequest,
    SearchResponse,
    TimelineRequest,
    TimelineResponse,
    EntityResponse,
    UFDRDocument,
    TimelineBucket,
    EntityRelationship,
)
from .elasticsearch import (
    wait_es,
    create_index,
    search_text,
    get_time,
    get_geo,
    get_entities,
    get_count,
)

app = FastAPI(
    title="Cognito AI",
    description="Natural Language Interface for Digital Forensic Evidence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
async def startup_event():
    if not wait_es():
        raise RuntimeError("Could not connect to Elasticsearch")

    create_index()
    print("Elasticsearch index created/verified")


@app.get("/")
async def root():
    return JSONResponse(content={"server": "ok"})


@app.post("/search", response_model=SearchResponse)
async def search_content_endpoint(request: SearchRequest):
    try:
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


@app.post("/timeline", response_model=TimelineResponse)
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


@app.get("/geo/recent")
async def get_recent_geo_artifacts(size: int = 10):
    try:
        response = get_geo(size=size)

        artifacts = []
        for hit in response["hits"]["hits"]:
            artifacts.append(hit["_source"])

        return JSONResponse(
            content={
                "artifacts": artifacts,
                "total": response["hits"]["total"]["value"],
                "took": response["took"],
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geo search failed: {str(e)}")


@app.get("/entities/relationships")
async def get_entity_relationships_endpoint(min_doc_count: int = 2):
    try:
        response = get_entities(min_doc_count=min_doc_count)

        relationships = []
        for participant_bucket in response["aggregations"]["participants"]["buckets"]:
            source = participant_bucket["key"]
            for co_participant in participant_bucket["co_participants"]["buckets"]:
                target = co_participant["key"]
                if source != target:
                    relationships.append(
                        EntityRelationship(
                            source=source,
                            target=target,
                            weight=co_participant["doc_count"],
                            common_artifacts=[],
                        )
                    )

        return EntityResponse(relationships=relationships, took=response["took"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Entity analysis failed: {str(e)}")


@app.post("/data/load")
async def load_sample_data(file_path: str = "data/ufdr.jsonl"):
    try:
        from .elasticsearch import load_data

        count = load_data(file_path)
        return JSONResponse(
            content={
                "message": f"Successfully loaded {count} documents",
                "count": count,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data loading failed: {str(e)}")


@app.get("/stats")
async def get_stats():
    try:
        count = get_count()
        return JSONResponse(
            content={"total_documents": count, "index_name": "ufdr", "status": "active"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
