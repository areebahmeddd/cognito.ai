from fastapi import APIRouter
from . import data, search

api_router = APIRouter()

api_router.include_router(search.router, prefix="/api/v1/search", tags=["search"])
api_router.include_router(data.router, prefix="/api/v1/data", tags=["data"])
