import sys
import json
from pathlib import Path
from typing import List, Tuple


def main() -> None:
    project = Path(__file__).resolve().parent.parent
    add_path(project / "backend")

    from app.services.elasticsearch import (
        es_client,
        get_name,
        get_total,
        wait_es,
        delete_index,
        create_index,
    )
    from elasticsearch import helpers

    index = get_name()
    json_dir = project / "JSON_Exports"

    print("== Elasticsearch Reindex ==")
    print(f"Index: {index}")

    print("Waiting for Elasticsearch ...")
    if not wait_es():
        print("Elasticsearch not reachable")
        sys.exit(2)

    print("Deleting index ...")
    delete_index()

    print("Creating index ...")
    create_index()

    print(f"Ingesting from: {json_dir}")
    success, errors = ingest_dir(json_dir, index, es_client, helpers)

    total = get_total()
    print("== Summary ==")
    print(f"Indexed (files sum): {success}")
    print(f"Errors: {errors}")
    print(f"ES count in '{index}': {total}")

    if success == 0 or total == 0:
        sys.exit(1)


def add_path(path: Path) -> None:
    p = str(path)
    if p not in sys.path:
        sys.path.insert(0, p)


def json_files(dir_path: Path) -> List[Path]:
    return sorted(
        [p for p in dir_path.iterdir() if p.is_file() and p.suffix == ".json"]
    )


def iter_docs(file_path: Path, index: str):
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
        if isinstance(data, list):
            for doc in data:
                doc_id = doc.pop("_id", None)
                doc["source_file"] = file_path.name
                yield {"_index": index, "_id": doc_id, "_source": doc}
        else:
            doc = data
            doc_id = doc.pop("_id", None)
            doc["source_file"] = file_path.name
            yield {"_index": index, "_id": doc_id, "_source": doc}


def ingest_dir(json_dir: Path, index: str, es_client, helpers) -> Tuple[int, int]:
    total_ok = 0
    total_err = 0

    files = json_files(json_dir)
    if not files:
        print(f"No .json files in: {json_dir}")
        return 0, 0

    print(f"Found {len(files)} files")
    for file_path in files:
        try:
            ok, errs = helpers.bulk(
                es_client,
                iter_docs(file_path, index),
                raise_on_error=False,
                raise_on_exception=False,
            )
            es_client.indices.refresh(index=index)
            if errs:
                try:
                    es_client.delete_by_query(
                        index=index,
                        body={"query": {"term": {"source_file": file_path.name}}},
                        refresh=True,
                    )
                except Exception:
                    pass
                print(f"[ERROR] {file_path.name}")
                for e in errs[:3] if isinstance(errs, list) else [errs]:
                    print(str(e))
                total_err += 1
            else:
                print(f"[INJESTED] {file_path.name}: {ok} docs")
                total_ok += int(ok or 0)
        except Exception as exc:
            try:
                es_client.delete_by_query(
                    index=index,
                    body={"query": {"term": {"source_file": file_path.name}}},
                    refresh=True,
                )
            except Exception:
                pass
            print(f"[ERRORS] {file_path.name}")
            print(str(exc))
            total_err += 1

    return total_ok, total_err


if __name__ == "__main__":
    main()
