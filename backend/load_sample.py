import json
import time
from datetime import datetime
from typing import Dict, Iterable, List

from elasticsearch import Elasticsearch, helpers


INDEX_NAME = "ufdr"


def wait_for_es(client: Elasticsearch, timeout_seconds: int = 90) -> None:
    start = time.time()
    while time.time() - start < timeout_seconds:
        try:
            if client.ping():
                return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError("Elasticsearch did not become ready in time")


def create_index(client: Elasticsearch) -> None:
    if client.indices.exists(index=INDEX_NAME):
        return

    settings: Dict = {
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
                "case_id": {"type": "keyword"},
                "device_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "app": {"type": "keyword"},
                "from": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                "to": {"type": "keyword"},
                "participants": {"type": "keyword"},
                "text": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "entities": {"type": "object", "dynamic": True},
                "duration_sec": {"type": "integer"},
                "direction": {"type": "keyword"},
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
            },
        },
    }

    client.indices.create(index=INDEX_NAME, **settings)


def load_jsonl(path: str) -> List[Dict]:
    docs: List[Dict] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            doc = json.loads(line)
            if "timestamp" in doc and isinstance(doc["timestamp"], str):
                datetime.fromisoformat(doc["timestamp"].replace("Z", "+00:00"))
            docs.append(doc)
    return docs


def bulk_actions(docs: Iterable[Dict]):
    for d in docs:
        _id = d.pop("_id", None)
        yield {"_op_type": "index", "_index": INDEX_NAME, "_id": _id, "_source": d}


def main() -> None:
    client = Elasticsearch("http://localhost:9200")
    wait_for_es(client)
    create_index(client)
    docs = load_jsonl("backend/sample_data.jsonl")
    helpers.bulk(client, bulk_actions(docs))
    client.indices.refresh(index=INDEX_NAME)
    count = client.count(index=INDEX_NAME)["count"]
    print(f"Indexed {count} documents into '{INDEX_NAME}'")


if __name__ == "__main__":
    main()
