import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import es_client
from .services.elasticsearch import wait_es, create_index
from .routes.api import api_router

app = FastAPI(
    title=settings.app_name,
    description="Natural Language Interface for Digital Forensic Evidence",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
    allow_credentials=settings.cors_credentials,
)

# Include the API router
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    if not wait_es():
        raise RuntimeError("Could not connect to Elasticsearch")

    create_index()
    print("Elasticsearch index created/verified")


@app.get("/")
async def root():
    return JSONResponse(content={"server": "ok"})


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
