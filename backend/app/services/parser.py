import os
import json
import csv
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

    converted_files = []
    successful = 0
    failed = 0
    total_records = 0

    for tsv_file in extracted_files:
        filename = os.path.basename(tsv_file)
        json_file = os.path.join(output_dir, filename + ".json")

        count = convert_file(tsv_file, json_file, case_id, device_id)
        if count > 0:
            converted_files.append(
                {
                    "filename": filename,
                    "json_file": filename + ".json",
                    "records": count,
                }
            )
            successful += 1
            total_records += count
        else:
            failed += 1

    root_dir = os.path.dirname(os.getcwd())
    project_output_dir = os.path.join(root_dir, "output")
    os.makedirs(project_output_dir, exist_ok=True)

    for converted_file in converted_files:
        source_path = os.path.join(output_dir, converted_file["json_file"])
        dest_path = os.path.join(project_output_dir, converted_file["json_file"])

        if os.path.exists(source_path):
            with open(source_path, "r", encoding="utf-8") as src:
                content = src.read()
            with open(dest_path, "w", encoding="utf-8") as dst:
                dst.write(content)

    return {
        "status": "success",
        "total_files": len(extracted_files),
        "successful_conversions": successful,
        "failed_conversions": failed,
        "total_records": total_records,
        "converted_files": converted_files,
        "output_directory": project_output_dir,
        "errors": [],
        "case_id": case_id,
        "device_id": device_id,
    }


def generate_ids() -> Dict[str, str]:
    # temp: we are generating unique id's
    uid = datetime.now().strftime("%Y%m%d%H%M%S%f")
    return {"case_id": f"CASE-{uid}", "device_id": f"DEVICE-{uid}"}


def convert_file(tsv_path: str, output_path: str, case_id: str, device_id: str) -> int:
    try:
        if not os.path.exists(tsv_path) or os.path.getsize(tsv_path) == 0:
            return 0

        with open(tsv_path, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f, delimiter="\t")
            headers = reader.fieldnames

            if headers:
                cleaned_headers = [clean_header(header) for header in headers]
                reader.fieldnames = cleaned_headers

            if not headers:
                return 0

            rows = list(reader)

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


def create_document(
    row: Dict[str, str], index: int, source_file: str, case_id: str, device_id: str
) -> Dict[str, Any]:
    ufdr_doc = {
        "_id": f"record-{index:04d}",
        "artifact_id": f"RECORD-{index:04d}",
        "case_id": case_id,
        "device_id": device_id,
        "type": "forensic_record",
        "data_type": "tsv_record",
        "timestamp": extract_timestamp(row),
        "source_path": source_file,
        "conversion_timestamp": datetime.now().isoformat(),
    }

    for header, value in row.items():
        if value and str(value).strip():
            clean_header_name = clean_header(header)
            ufdr_doc[clean_header_name] = clean_value(value)

    return ufdr_doc


def extract_timestamp(row: Dict[str, str]) -> Optional[str]:
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
            import re

            timestamp_patterns = [
                r"\d{4}-\d{2}-\d{2}",
                r"\d{2}/\d{2}/\d{4}",
                r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}",
                r"\d{10,13}",
            ]
            for pattern in timestamp_patterns:
                if re.search(pattern, value):
                    return str(value).strip()

    return None


def clean_value(value: str) -> Any:
    if not value or not str(value).strip():
        return None

    value = str(value).strip()
    value = value.replace("\ufffd", "").replace("\x00", "")

    try:
        if "." in value:
            return float(value)
        else:
            return int(value)
    except ValueError:
        pass

    if value.lower() in ["true", "false", "1", "0", "yes", "no"]:
        return value.lower() in ["true", "1", "yes"]

    return value


def clean_header(header: str) -> str:
    clean_header = header.strip()
    clean_header = (
        clean_header.replace("\ufeff", "")
        .replace("\u200b", "")
        .replace("\u200c", "")
        .replace("\u200d", "")
    )
    clean_header = clean_header.replace(" ", "_").replace("-", "_").lower()
    return clean_header
