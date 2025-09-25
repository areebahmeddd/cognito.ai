import os
import json
import time
from typing import Any, Dict, List, Optional
from elasticsearch import Elasticsearch, helpers
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
    size = min(size or 10, 200)
    body: Dict[str, Any] = {
        "query": query_dict or {"match_all": {}},
        "size": size,
        "from": from_,
    }
    if sort:
        body["sort"] = sort
    if highlight:
        body["highlight"] = highlight

    response = es_client.search(index=index_name, body=body)
    return response


def bulk_index(dir_path: str) -> Dict[str, Any]:
    def iter_docs(paths: List[str]):
        for path in paths:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for doc in data:
                            doc_id = doc.pop("_id", None)
                            yield {
                                "_index": index_name,
                                "_id": doc_id,
                                "_source": doc,
                            }
                    else:
                        doc = data
                        doc_id = doc.pop("_id", None)
                        yield {
                            "_index": index_name,
                            "_id": doc_id,
                            "_source": doc,
                        }
            except Exception:
                continue

    json_files = [
        os.path.join(dir_path, name)
        for name in os.listdir(dir_path)
        if name.endswith(".json")
    ]

    try:
        success, errors = helpers.bulk(
            es_client,
            iter_docs(json_files),
            raise_on_error=False,
            raise_on_exception=False,
        )

        es_client.indices.refresh(index=index_name)

        return {
            "success_count": success,
            "error_count": len(errors) if errors else 0,
            "files_processed": len(json_files),
        }
    except Exception:
        return {
            "success_count": 0,
            "error_count": 1,
            "files_processed": len(json_files),
        }


def create_index() -> None:
    if es_client.indices.exists(index=index_name):
        return

    settings = {
        "settings": {
            "analysis": {
                "normalizer": {
                    "lowercase_normalizer": {"type": "custom", "filter": ["lowercase"]}
                }
            },
            "index": {
                "mapping": {
                    "total_fields": {"limit": 1000},
                    "depth": {"limit": 20},
                    "nested_fields": {"limit": 100},
                },
                "number_of_shards": 1,
                "number_of_replicas": 0,
            },
        },
        "mappings": {
            "dynamic": True,
            "properties": {
                "artifact_id": {"type": "keyword"},
                "case_id": {"type": "keyword"},
                "device_id": {"type": "keyword"},
                "timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "source_path": {"type": "keyword"},
                "type": {"type": "keyword"},
                "data_type": {"type": "keyword"},
                "conversion_timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "message": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "title": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "body": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "text": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "sender": {"type": "keyword"},
                "recipient": {"type": "keyword"},
                "from": {"type": "keyword"},
                "to": {"type": "keyword"},
                "display_from": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "display_to": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "message_id": {"type": "keyword"},
                "thread_id": {"type": "keyword"},
                "direction": {"type": "keyword"},
                "message_type": {"type": "keyword"},
                "channel": {"type": "keyword"},
                "platform": {"type": "keyword"},
                "service": {"type": "keyword"},
                "phone_number": {"type": "keyword"},
                "email": {"type": "keyword"},
                "username": {"type": "keyword"},
                "display_name": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "contact_name": {"type": "keyword"},
                "participants": {"type": "keyword"},
                "account_name": {"type": "keyword"},
                "account_type": {"type": "keyword"},
                "url": {"type": "keyword"},
                "host": {"type": "keyword"},
                "domain": {"type": "keyword"},
                "search_term": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "browser": {"type": "keyword"},
                "referrer": {"type": "keyword"},
                "latitude": {"type": "float"},
                "longitude": {"type": "float"},
                "altitude": {"type": "float"},
                "address": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "place": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "country": {"type": "keyword"},
                "city": {"type": "keyword"},
                "country_iso": {"type": "keyword"},
                "call_duration": {"type": "integer"},
                "call_type": {"type": "keyword"},
                "call_direction": {"type": "keyword"},
                "caller": {"type": "keyword"},
                "callee": {"type": "keyword"},
                "transcription": {"type": "text"},
                "media_type": {"type": "keyword"},
                "filename": {"type": "keyword"},
                "file_size": {"type": "integer"},
                "call_date": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "message_timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "sending_party": {"type": "keyword"},
                "sending_party_jid": {"type": "keyword"},
                "conversation_name": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "message_direction": {"type": "keyword"},
                "call_start_timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "call_end_timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "package_name": {"type": "keyword"},
                "app_name": {"type": "keyword"},
                "app_package_name": {"type": "keyword"},
                "package_id": {"type": "keyword"},
                "version": {"type": "keyword"},
                "status": {"type": "keyword"},
                "category": {"type": "keyword"},
                "notification_type": {"type": "keyword"},
                "event_type": {"type": "keyword"},
                "usage_type": {"type": "keyword"},
                "time_active_in_secs": {"type": "integer"},
                "last_time_active": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "types": {"type": "keyword"},
                "amount": {"type": "double"},
                "currency": {"type": "keyword"},
                "transaction_id": {"type": "keyword"},
                "payment_method": {"type": "keyword"},
                "bank_name": {"type": "keyword"},
                "account_number": {"type": "keyword"},
                "device_battery_(%)": {"type": "integer"},
                "charging": {"type": "boolean"},
                "speed_(mps)": {"type": "float"},
                "course": {"type": "float"},
                "device_type": {"type": "keyword"},
                "hashes": {"type": "object", "dynamic": True},
                "location": {"type": "geo_point"},
                "entities": {"type": "object", "dynamic": True},
                "tags": {"type": "keyword"},
                "notes": {"type": "text"},
                "languages": {"type": "keyword"},
                "source_file": {"type": "keyword"},
                "value": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "key": {"type": "keyword"},
                "originating_file": {"type": "keyword"},
                "record_id": {"type": "keyword"},
                "source": {"type": "keyword"},
                "package": {"type": "keyword"},
                "id": {"type": "keyword"},
                "data": {"type": "text"},
                "deleted": {"type": "boolean"},
                "visible": {"type": "boolean"},
                "is_primary": {"type": "boolean"},
                "is_system_message": {"type": "boolean"},
                "message_is_hidden": {"type": "boolean"},
                "message_is_read": {"type": "boolean"},
                "read_status": {"type": "keyword"},
                "message_read": {"type": "keyword"},
                "message_latitude": {"type": "float"},
                "message_longitude": {"type": "float"},
                "pace": {"type": "float"},
                "elevation_gain": {"type": "float"},
                "authtoken": {"type": "keyword"},
                "authtoken_type": {"type": "keyword"},
                "apk_path": {"type": "keyword"},
                "calendar_name": {"type": "keyword"},
                "calendar_display_name": {"type": "keyword"},
                "owner_account": {"type": "keyword"},
                "holder": {"type": "keyword"},
                "role": {"type": "keyword"},
                "action_type": {"type": "keyword"},
                "debug_time": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "creation_timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "last_updated_timestamp": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "last_password_entry": {
                    "type": "date",
                    "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||yyyy-MM-dd HH:mm:ssXXX",
                },
                "password": {"type": "keyword"},
                "duration": {"type": "keyword"},
                "access_count": {"type": "integer"},
                "alert_life_cycle_id": {"type": "integer"},
                "possible_rssi": {"type": "integer"},
                "user": {"type": "integer"},
                "cc": {"type": "keyword"},
                "name": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
                "data_1": {
                    "type": "text",
                    "fields": {"kw": {"type": "keyword", "ignore_above": 256}},
                },
            },
        },
    }
    es_client.indices.create(index=index_name, body=settings)


def delete_index() -> None:
    es_client.indices.delete(index=index_name, ignore=[400, 404])


def ensure_map() -> None:
    if not es_client.indices.exists(index=index_name):
        create_index()

    current_mapping = es_client.indices.get_mapping(index=index_name)
    if not current_mapping[index_name]["mappings"].get("dynamic"):
        es_client.indices.put_mapping(index=index_name, body={"dynamic": True})


def wait_es(max_retries: int = 10, delay: float = 2.0) -> bool:
    for _ in range(max_retries):
        try:
            if es_client.ping():
                return True
        except ConnectionError:
            pass
        time.sleep(delay)
    return False


def get_total() -> int:
    try:
        return es_client.count(index=index_name)["count"]
    except NotFoundError:
        return 0
    except Exception:
        return 0


def get_name() -> str:
    return index_name


def check_health() -> str:
    try:
        if es_client.ping():
            return (
                "green"
                if es_client.cluster.health(index=index_name)["status"] == "green"
                else "yellow"
            )
        return "red"
    except Exception:
        return "red"
