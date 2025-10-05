import uvicorn
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .routes.auth import router as auth_router
from .routes.data import router as data_router
from .routes.search import router as search_router
from .routes.case import router as case_router
from .services.elasticsearch import (
    wait_elasticsearch,
    create_index,
    check_health as es_health,
)
from .services.mongodb import connect_database, check_health as mongo_health

app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
    allow_credentials=settings.cors_credentials,
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(data_router, prefix="/api/v1/data", tags=["data"])
app.include_router(search_router, prefix="/api/v1/search", tags=["search"])
app.include_router(case_router, prefix="/api/v1/cases", tags=["case"])


@app.on_event("startup")
async def startup():
    if not wait_elasticsearch():
        raise RuntimeError("Could not connect to Elasticsearch")
    create_index()
    print("Elasticsearch connected")

    try:
        await connect_database()
        print("MongoDB connected")
    except Exception:
        raise RuntimeError("Could not connect to MongoDB")


@app.get("/")
async def root():
    return JSONResponse(content={"server": "ok"})


@app.get("/health")
async def health():
    try:
        mongo_status = await mongo_health()
        es_status = es_health()
        return JSONResponse(
            content={
                "mongodb_status": mongo_status,
                "elasticsearch_status": es_status,
                "timestamp": datetime.now().isoformat(),
            }
        )
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "mongodb_status": "error",
                "elasticsearch_status": "error",
                "timestamp": datetime.now().isoformat(),
            },
        )


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
