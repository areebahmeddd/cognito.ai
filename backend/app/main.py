import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import settings
from .routes.api import api_router
from .services.elasticsearch import wait_es, create_index

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
