from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ....services.elasticsearch_service import get_geo

router = APIRouter(tags=["geo"])


@router.get("/geo/recent")
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
