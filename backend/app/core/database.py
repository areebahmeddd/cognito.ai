"""Database configuration and connections."""
from elasticsearch import Elasticsearch
from .config import settings


def get_elasticsearch_client() -> Elasticsearch:
    """Get Elasticsearch client instance."""
    return Elasticsearch([settings.elasticsearch_url])


# Global ES client instance
es_client = get_elasticsearch_client()
