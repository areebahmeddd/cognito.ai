"""API v1 router."""
from fastapi import APIRouter

from .endpoints import search, geo, entities, data

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(geo.router, prefix="/geo", tags=["geo"])
api_router.include_router(entities.router, prefix="/entities", tags=["entities"])
api_router.include_router(data.router, prefix="/data", tags=["data"])
