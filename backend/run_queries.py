from collections import Counter
from typing import Dict, List, Tuple

from elasticsearch import Elasticsearch


INDEX_NAME = "ufdr"


def content_search(client: Elasticsearch, query_text: str, size: int = 5) -> List[Dict]:
    body = {
        "size": size,
        "query": {
            "bool": {
                "should": [
                    {"match": {"text": {"query": query_text, "operator": "and"}}},
                    {"match_phrase": {"text": {"query": query_text}}},
                    {
                        "multi_match": {
                            "query": query_text,
                            "fields": ["caption", "tags", "url", "email"],
                        }
                    },
                ]
            }
        },
        "highlight": {"fields": {"text": {}, "caption": {}}},
    }
    res = client.search(index=INDEX_NAME, body=body)
    return [
        {
            "id": h.get("_id"),
            "type": h["_source"].get("type"),
            "app": h["_source"].get("app"),
            "timestamp": h["_source"].get("timestamp"),
            "from": h["_source"].get("from"),
            "to": h["_source"].get("to"),
            "text": h["_source"].get("text") or h["_source"].get("caption"),
            "highlight": h.get("highlight", {}),
        }
        for h in res["hits"]["hits"]
    ]


def timeline(client: Elasticsearch, interval: str = "1d") -> List[Tuple[str, int]]:
    body = {
        "size": 0,
        "aggs": {
            "over_time": {
                "date_histogram": {
                    "field": "timestamp",
                    "fixed_interval": interval,
                    "min_doc_count": 1,
                }
            }
        },
    }
    res = client.search(index=INDEX_NAME, body=body)
    return [
        (b["key_as_string"], b["doc_count"])
        for b in res["aggregations"]["over_time"]["buckets"]
    ]


def geo_recent(client: Elasticsearch, top_n: int = 3) -> List[Dict]:
    body = {
        "size": top_n,
        "sort": [{"timestamp": {"order": "desc"}}],
        "query": {"exists": {"field": "location"}},
        "_source": ["timestamp", "type", "location", "caption", "text"],
    }
    res = client.search(index=INDEX_NAME, body=body)
    return [h["_source"] for h in res["hits"]["hits"]]


def entity_relationships(client: Elasticsearch, min_cooccurrence: int = 1):
    res = client.search(
        index=INDEX_NAME, body={"size": 2000, "_source": ["participants", "entities"]}
    )
    counter: Counter = Counter()
    for hit in res["hits"]["hits"]:
        src = hit.get("_source", {})
        nodes = list(dict.fromkeys(src.get("participants", [])))
        for p in src.get("entities", {}).get("phones", []):
            if p not in nodes:
                nodes.append(p)
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                a, b = sorted([nodes[i], nodes[j]])
                counter[(a, b)] += 1
    return [(a, b, c) for (a, b), c in counter.items() if c >= min_cooccurrence]


def main() -> None:
    client = Elasticsearch("http://localhost:9200")
    print("\nContent search: 'crypto address'\n-------------------------------")
    for h in content_search(client, "crypto address"):
        print(h)

    print("\nTimeline (1d)\n-------------")
    for bucket in timeline(client, "1d"):
        print(bucket)

    print("\nRecent geotagged artifacts\n--------------------------")
    for doc in geo_recent(client):
        print(doc)

    print("\nEntity relationships (co-occurrence)\n-----------------------------------")
    for edge in entity_relationships(client, 1):
        print(edge)


if __name__ == "__main__":
    main()
