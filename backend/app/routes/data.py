from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from ..services.elasticsearch import load_data, get_count

router = APIRouter()


@router.post("/load")
async def load_sample_data(file_path: str = "data/ufdr.jsonl"):
    try:
        count = load_data(file_path)
        return JSONResponse(
            content={
                "message": f"Successfully loaded {count} documents",
                "count": count,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data loading failed: {str(e)}")


@router.get("/stats")
async def get_stats():
    try:
        count = get_count()
        return JSONResponse(
            content={"total_documents": count, "index_name": "ufdr", "status": "active"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")
