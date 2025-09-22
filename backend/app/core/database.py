from elasticsearch import Elasticsearch
from .config import settings


def get_client() -> Elasticsearch:
    return Elasticsearch([settings.elasticsearch_url])


es_client = get_client()
