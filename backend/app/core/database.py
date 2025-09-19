from elasticsearch import Elasticsearch
from .config import settings


def get_elasticsearch_client() -> Elasticsearch:
    return Elasticsearch([settings.elasticsearch_url])


es_client = get_elasticsearch_client()
