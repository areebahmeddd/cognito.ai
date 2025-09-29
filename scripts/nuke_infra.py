import os
import requests
import urllib.parse
from pymongo import MongoClient


def parse_mongo(uri: str):
    parsed = urllib.parse.urlparse(uri)
    db = parsed.path.lstrip("/") or "cognito"
    root_uri = uri.rsplit("/" + db, 1)[0]
    return root_uri, db


def wipe_mongo(mongo_uri: str) -> str:
    root_uri, db_name = parse_mongo(mongo_uri)
    client = MongoClient(root_uri)
    if db_name in client.list_database_names():
        client.drop_database(db_name)
        return f"MongoDB: dropped database '{db_name}'"
    return f"MongoDB: database '{db_name}' not found"


def wipe_elasticsearch(es_url: str, index: str) -> str:
    es_url = es_url.rstrip("/")
    r = requests.delete(f"{es_url}/{index}")
    r_wild = requests.delete(
        f"{es_url}/{index}*?ignore_unavailable=true&expand_wildcards=all&allow_no_indices=true"
    )
    return f"Elasticsearch: delete '{index}' -> {r.status_code}; wildcard '{index}*' -> {r_wild.status_code}"


def main():
    mongo_uri = os.getenv(
        "MONGODB_CONNECTION_STRING", "mongodb://localhost:27017/cognito"
    )
    es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    es_index = os.getenv("ELASTICSEARCH_INDEX", "cognito")

    print("Wiping data...")
    try:
        print(wipe_mongo(mongo_uri))
    except Exception as e:
        print(f"MongoDB wipe failed: {e}")

    try:
        print(wipe_elasticsearch(es_url, es_index))
    except Exception as e:
        print(f"Elasticsearch wipe failed: {e}")


if __name__ == "__main__":
    main()
