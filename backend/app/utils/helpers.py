import re
import hashlib
from typing import Any, Dict, Optional


def calculate_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def get_extension(filename: str) -> str:
    match = re.search(r"\.(\w+)$", filename.lower())
    return f"{match.group(1)}_record" if match else "unknown_record"


def get_source(row: Dict[str, str], fallback_path: str) -> str:
    source_fields = [
        "source_file",
        "source_path",
        "path",
        "file_path",
        "originating_file",
    ]
    for field in source_fields:
        if field in row and row[field] and str(row[field]).strip():
            return str(row[field]).strip()
    return fallback_path


def get_timestamp(row: Dict[str, str]) -> Optional[str]:
    time_fields = [
        "call_date",
        "date",
        "timestamp",
        "time",
        "created_date",
        "last_access_date",
    ]
    for field in time_fields:
        if field in row and row[field] and str(row[field]).strip():
            return str(row[field]).strip()

    for header, value in row.items():
        if value and str(value).strip():
            time_patterns = [
                r"\d{4}-\d{2}-\d{2}",
                r"\d{4}/\d{2}/\d{2}",
                r"\d{2}-\d{2}-\d{4}",
                r"\d{2}/\d{2}/\d{4}",
            ]
            for pattern in time_patterns:
                if re.search(pattern, str(value)):
                    return str(value).strip()
    return None


def clean_value(value: str) -> Any:
    cleaned = (
        str(value)
        .replace("\ufeff", "")
        .replace("\ufffd", "")
        .replace("\x00", "")
        .strip()
    )
    if cleaned.lower() in {"true", "false"}:
        return cleaned.lower() == "true"
    try:
        return float(cleaned) if "." in cleaned else int(cleaned)
    except ValueError:
        return cleaned


def clean_header(header: str) -> str:
    cleaned = (
        header.lower()
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("%", "percent")
        .replace("/", "_")
        .replace("-", "_")
        .replace(".", "")
        .replace("?", "")
        .replace("\ufeff", "")
        .replace("\u200b", "")
        .replace("\u200c", "")
        .replace("\u200d", "")
        .strip()
    )
    return cleaned


async def validate_case(case_id: str, user_id: str) -> bool:
    try:
        from ..services.mongodb import get_case

        return await get_case(case_id, user_id) is not None
    except Exception:
        return False


def check_duplicate(file_hash: str, case_id: str) -> bool:
    try:
        from ..services.elasticsearch import es_client, index_name

        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"file_hash": file_hash}},
                        {"term": {"case_id": case_id}},
                    ]
                }
            },
            "size": 1,
        }

        response = es_client.search(index=index_name, body=query)
        return response["hits"]["total"]["value"] > 0
    except Exception:
        return False
