import json
import time
from typing import Any, Dict, List, Optional
from elasticsearch import Elasticsearch, helpers
from elasticsearch.dsl import Search, Q
from elasticsearch.exceptions import ConnectionError, NotFoundError
from ..core.config import settings

es_client = Elasticsearch(settings.elasticsearch_url)
index_name = settings.elasticsearch_index


def search_dsl(
    query_dict: Dict[str, Any],
    size: int = 10,
    from_: int = 0,
    sort: Optional[List[Dict[str, Any]]] = None,
    highlight: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    s = Search(using=es_client, index=index_name).extra(size=size, from_=from_)

    if query_dict:
        s = s.query(Q(query_dict))

    if sort:
        for sort_item in sort:
            field = list(sort_item.keys())[0]
            order = sort_item[field].get("order", "desc")
            s = s.sort(f"-{field}" if order == "desc" else field)

    if highlight:
        for field, config in highlight.get("fields", {}).items():
            s = s.highlight(field, **config)

    response = s.execute()
    return response.to_dict()


def load_data(file_path: str) -> int:
    def load_jsonl(path: str) -> List[Dict[str, Any]]:
        docs = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    docs.append(json.loads(line))
        return docs

    def bulk_actions(docs: List[Dict[str, Any]]):
        for doc in docs:
            doc_id = doc.pop("_id", None)
            yield {
                "_index": index_name,
                "_id": doc_id,
                "_source": doc,
            }

    docs = load_jsonl(file_path)
    helpers.bulk(es_client, bulk_actions(docs))
    es_client.indices.refresh(index=index_name)
    return len(docs)


def create_index() -> None:
    if es_client.indices.exists(index=index_name):
        return

    settings = {
        "settings": {
            "analysis": {
                "normalizer": {
                    "lowercase_normalizer": {"type": "custom", "filter": ["lowercase"]}
                }
            }
        },
        "mappings": {
            "dynamic": "strict",
            "properties": {
                "artifact_id": {"type": "keyword"},
                "type": {"type": "keyword"},
                "data_type": {"type": "keyword"},
                "channel": {"type": "keyword"},
                "platform": {"type": "keyword"},
                "service": {"type": "keyword"},
                "case_id": {"type": "keyword"},
                "device_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "app": {
                    "type": "keyword",
                    "normalizer": "lowercase_normalizer",
                    "fields": {"text": {"type": "text"}},
                },
                "from": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                "to": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                "participants": {
                    "type": "keyword",
                    "normalizer": "lowercase_normalizer",
                },
                "display_from": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "display_to": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "text": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "message_id": {"type": "keyword"},
                "thread_id": {"type": "keyword"},
                "entities": {"type": "object", "dynamic": True},
                "duration_sec": {"type": "integer"},
                "direction": {"type": "keyword"},
                "call_type": {"type": "keyword"},
                "media_type": {"type": "keyword"},
                "caption": {"type": "text"},
                "tags": {"type": "keyword"},
                "url": {"type": "keyword"},
                "email": {"type": "keyword"},
                "filename": {"type": "keyword"},
                "source_path": {"type": "keyword"},
                "hashes": {
                    "properties": {
                        "md5": {"type": "keyword"},
                        "sha1": {"type": "keyword"},
                        "sha256": {"type": "keyword"},
                    }
                },
                "location": {"type": "geo_point"},
                "country": {"type": "keyword"},
                "languages": {"type": "keyword"},
                "amount": {"type": "double"},
                "currency": {"type": "keyword"},
                "method": {"type": "keyword"},
                "ip": {"type": "ip"},
                "event": {"type": "keyword"},
                "notes": {"type": "text"},
                "status": {"type": "keyword"},
            },
        },
    }
    es_client.indices.create(index=index_name, **settings)


def wait_es(max_retries: int = 10, delay: float = 1.0) -> bool:
    for attempt in range(max_retries):
        try:
            if es_client.ping():
                return True
        except ConnectionError:
            pass
        time.sleep(delay)
    return False


def get_count() -> int:
    try:
        response = es_client.count(index=index_name)
        return response["count"]
    except NotFoundError:
        return 0


def get_index_name() -> str:
    return index_name


def check_status() -> str:
    try:
        if es_client.ping():
            return "active"
        else:
            return "inactive"
    except Exception:
        return "error"
