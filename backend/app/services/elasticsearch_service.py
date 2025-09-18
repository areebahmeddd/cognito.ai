import json
import time
from elasticsearch import Elasticsearch, helpers
from elasticsearch.exceptions import ConnectionError, NotFoundError
from typing import Any, Dict, List, Optional

es_client = Elasticsearch("http://localhost:9200")
index_name = "ufdr"


def wait_es(max_retries: int = 30, delay: float = 1.0) -> bool:
    for attempt in range(max_retries):
        try:
            if es_client.ping():
                return True
        except ConnectionError:
            pass
        time.sleep(delay)
    return False


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


def search_text(query: str, size: int = 10, from_: int = 0) -> Dict[str, Any]:
    search_body = {
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["text^2", "display_from^1.5", "display_to^1.5", "notes^1.2"],
                "type": "best_fields",
                "fuzziness": "AUTO",
            }
        },
        "highlight": {
            "fields": {
                "text": {"fragment_size": 150, "number_of_fragments": 2},
                "display_from": {"fragment_size": 50},
                "display_to": {"fragment_size": 50},
            }
        },
        "size": size,
        "from": from_,
        "sort": [{"timestamp": {"order": "desc"}}],
    }

    response = es_client.search(index=index_name, body=search_body)
    return response


def get_time(
    interval: str = "1d", filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    query = {"match_all": {}}
    if filters:
        query = {"bool": {"must": [{"term": {k: v} for k, v in filters.items()}]}}

    search_body = {
        "query": query,
        "aggs": {
            "timeline": {
                "date_histogram": {
                    "field": "timestamp",
                    "calendar_interval": interval,
                    "min_doc_count": 1,
                }
            }
        },
        "size": 0,
    }

    response = es_client.search(index=index_name, body=search_body)
    return response


def get_geo(size: int = 10) -> Dict[str, Any]:
    search_body = {
        "query": {
            "bool": {
                "must": [
                    {"exists": {"field": "location"}},
                    {"range": {"timestamp": {"gte": "now-30d"}}},
                ]
            }
        },
        "size": size,
        "sort": [{"timestamp": {"order": "desc"}}],
    }

    response = es_client.search(index=index_name, body=search_body)
    return response


def get_entities(min_doc_count: int = 2) -> Dict[str, Any]:
    search_body = {
        "query": {"match_all": {}},
        "aggs": {
            "participants": {
                "terms": {
                    "field": "participants",
                    "min_doc_count": min_doc_count,
                    "size": 50,
                },
                "aggs": {
                    "co_participants": {
                        "terms": {
                            "field": "participants",
                            "min_doc_count": min_doc_count,
                            "size": 10,
                        }
                    },
                },
            }
        },
        "size": 0,
    }

    response = es_client.search(index=index_name, body=search_body)
    return response


def get_count() -> int:
    try:
        response = es_client.count(index=index_name)
        return response["count"]
    except NotFoundError:
        return 0
