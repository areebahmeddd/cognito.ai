import os
import re
import csv
import json
import uuid
import hashlib
import zipfile
from typing import Dict, List, Any, Optional
from datetime import datetime


def convert_files(zip_path: str, tsv_files: List[str], temp_dir: str) -> Dict[str, Any]:
    ids = generate_ids()
    case_id = ids["case_id"]
    device_id = ids["device_id"]
    input_dir = os.path.join(temp_dir, "input")
    output_dir = os.path.join(temp_dir, "output")
    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    extracted_files = extract_files(zip_path, tsv_files, input_dir)

    successful = 0
    failed = 0
    total_records = 0

    for tsv_file in extracted_files:
        filename = os.path.basename(tsv_file)
        output_json_path = os.path.join(
            output_dir, f"{os.path.splitext(filename)[0]}.json"
        )

        num_records = convert_file(tsv_file, output_json_path, case_id, device_id)
        if num_records > 0:
            successful += 1
            total_records += num_records
        else:
            failed += 1

    return {
        "status": "completed",
        "successful_files": successful,
        "failed_files": failed,
        "total_records_converted": total_records,
        "temp_dir": output_dir,
    }


def extract_files(zip_path: str, tsv_files: List[str], input_dir: str) -> List[str]:
    extracted_files = []

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        for tsv_filename in tsv_files:
            try:
                file_info = zip_ref.getinfo(tsv_filename)
                safe_filename = os.path.basename(file_info.filename)
                safe_filename = "".join(
                    c for c in safe_filename if c.isalnum() or c in "._-"
                )
                if not safe_filename.endswith(".tsv"):
                    safe_filename += ".tsv"

                safe_path = os.path.join(input_dir, safe_filename)

                with zip_ref.open(file_info) as source:
                    content = source.read()
                    with open(safe_path, "wb") as target:
                        target.write(content)

                extracted_files.append(safe_path)
            except KeyError:
                continue

    return extracted_files


def convert_file(tsv_path: str, output_path: str, case_id: str, device_id: str) -> int:
    try:
        if not os.path.exists(tsv_path) or os.path.getsize(tsv_path) == 0:
            return 0

        rows = read_file(tsv_path)
        if not rows:
            return 0

        ufdr_documents = []
        for i, row in enumerate(rows):
            try:
                ufdr_doc = create_document(row, i, tsv_path, case_id, device_id)
                ufdr_documents.append(ufdr_doc)
            except Exception:
                continue

        if not ufdr_documents:
            return 0

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(ufdr_documents, f, indent=2, ensure_ascii=False)

        return len(ufdr_documents)
    except Exception:
        return 0


def read_file(tsv_path: str) -> List[Dict[str, str]]:
    with open(tsv_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        headers = reader.fieldnames

        if headers:
            cleaned_headers = [clean_name(header) for header in headers]
            reader.fieldnames = cleaned_headers

        if not headers:
            return []

        return list(reader)


def create_document(
    row: Dict[str, str], index: int, source_file: str, case_id: str, device_id: str
) -> Dict[str, Any]:
    filename = os.path.basename(source_file)
    row_fingerprint = hashlib.sha256(
        json.dumps(row, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()
    deterministic_name = f"{filename}|{index:04d}|{row_fingerprint}"
    deterministic_id = str(uuid.uuid5(uuid.NAMESPACE_URL, deterministic_name))

    original_source_path = get_source_path(row, source_file)

    ufdr_doc = {
        "_id": deterministic_id,
        "artifact_id": deterministic_id,
        "case_id": case_id,
        "device_id": device_id,
        "type": "forensic_record",
        "data_type": "tsv_record",
        "timestamp": extract_time(row),
        "source_path": original_source_path,
        "conversion_timestamp": datetime.now().isoformat(),
    }

    for header, value in row.items():
        if value and str(value).strip():
            clean_header_name = clean_name(header)
            ufdr_doc[clean_header_name] = clean_data(value)

    return ufdr_doc


def generate_ids() -> Dict[str, str]:
    uid = datetime.now().strftime("%Y%m%d%H%M%S%f")
    return {"case_id": f"CASE-{uid}", "device_id": f"DEVICE-{uid}"}


def get_source_path(row: Dict[str, str], fallback_path: str) -> str:
    source_path_fields = [
        "source_file",
        "source_path",
        "path",
        "file_path",
        "originating_file",
    ]

    for field in source_path_fields:
        if field in row and row[field] and str(row[field]).strip():
            return str(row[field]).strip()

    return fallback_path


def extract_time(row: Dict[str, str]) -> Optional[str]:
    timestamp_fields = [
        "call_date",
        "date",
        "timestamp",
        "time",
        "created_date",
        "last_access_date",
    ]

    for field in timestamp_fields:
        if field in row and row[field] and str(row[field]).strip():
            return str(row[field]).strip()

    for header, value in row.items():
        if value and str(value).strip():
            timestamp_patterns = [
                r"\d{4}-\d{2}-\d{2}",
                r"\d{4}/\d{2}/\d{2}",
                r"\d{2}-\d{2}-\d{4}",
                r"\d{2}/\d{2}/\d{4}",
            ]
            for pattern in timestamp_patterns:
                if re.search(pattern, str(value)):
                    return str(value).strip()
    return None


def clean_data(value: str) -> Any:
    cleaned = (
        str(value)
        .replace("\ufeff", "")
        .replace("\ufffd", "")
        .replace("\x00", "")
        .strip()
    )

    if cleaned.lower() in ["true", "false"]:
        return cleaned.lower() == "true"

    try:
        if "." in cleaned:
            return float(cleaned)
        else:
            return int(cleaned)
    except ValueError:
        return cleaned


def clean_name(header: str) -> str:
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




def transform_results(results):
    """Convert raw backend results into simplified rows for the PDF."""
    parsed = []

    for r in results:
        parsed.append({
            "artifact_id": r.get("artifact_id"),
            "case_id": r.get("case_id"),
            "device_id": r.get("device_id"),
            "timestamp": r.get("timestamp"),
            "message": r.get("message"),
            "conversation_name": r.get("conversation_name"),
            "sender": r.get("sending_party"),
            "direction": r.get("message_direction"),
            "reason_for_suspicion": "Contains Bitcoin/crypto promotion",  # auto-flag
            "source_path": r.get("source_path"),
        })
    return parsed

    
   