"""API dependencies."""
from fastapi import Depends
from ..core.database import es_client
from ..core.security import get_current_user


def get_elasticsearch():
    """Get Elasticsearch client dependency."""
    return es_client


def get_current_user_dependency():
    """Get current user dependency."""
    return get_current_user()
