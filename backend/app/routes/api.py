"""Main API router."""
from fastapi import APIRouter

from . import data, forensic, search

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(search.router, prefix="/api/v1/search", tags=["search"])
api_router.include_router(data.router, prefix="/api/v1/data", tags=["data"])
api_router.include_router(forensic.router, prefix="/api/v1/forensic", tags=["forensic"])
