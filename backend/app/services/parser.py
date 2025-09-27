import os
import re
import csv
import json
import zipfile
from datetime import datetime
from typing import Dict, List, Any, Optional
from .classifier import classify_file, batch_classify


def process_files(zip_path: str, tsv_files: List[str], temp_dir: str) -> Dict[str, Any]:
    input_dir = os.path.join(temp_dir, "input")
    output_dir = os.path.join(temp_dir, "output")
    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    extracted_files = extract_files(zip_path, tsv_files, input_dir)

    filenames = [os.path.basename(tsv_file) for tsv_file in extracted_files]

    file_classifications = batch_classify(filenames)

    successful = 0
    total_records = 0

    for tsv_file in extracted_files:
        filename = os.path.basename(tsv_file)
        output_path = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}.json")

        num_records = process_file(
            tsv_file, output_path, file_classifications.get(filename)
        )
        if num_records > 0:
            successful += 1
            total_records += num_records

    return {
        "temp_dir": output_dir,
        "files_converted": successful,
        "total_records": total_records,
    }


def process_file(
    tsv_path: str, output_path: str, classification: Optional[Dict[str, str]] = None
) -> int:
    try:
        if not os.path.exists(tsv_path) or os.path.getsize(tsv_path) == 0:
            return 0

        rows = read_tsv(tsv_path)
        if not rows:
            return 0

        documents = []
        for i, row in enumerate(rows):
            try:
                doc = create_doc(row, i, tsv_path, classification)
                documents.append(doc)
            except Exception:
                continue

        if not documents:
            return 0

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(documents, f, indent=2, ensure_ascii=False)

        return len(documents)
    except Exception:
        return 0


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


def read_tsv(tsv_path: str) -> List[Dict[str, str]]:
    with open(tsv_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        headers = reader.fieldnames

        if headers:
            cleaned_headers = [clean_header(header) for header in headers]
            reader.fieldnames = cleaned_headers

        if not headers:
            return []

        return list(reader)


def create_doc(
    row: Dict[str, str],
    index: int,
    source_file: str,
    classification: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    filename = os.path.basename(source_file)
    source_path = get_source(row, source_file)

    if classification is None:
        classification = classify_file(filename)

    doc = {
        "artifact_id": f"{classification['type'].lower().replace(' ', '_')}-{index + 1:04d}",
        "category": classification["category"],
        "file_type": classification["type"],
        "app_name": classification["type"],
        "app": classification["type"],
        "data_type": get_extension(filename),
        "timestamp": get_timestamp(row),
        "source_path": source_path,
        "conversion_timestamp": datetime.now().isoformat(),
    }

    for header, value in row.items():
        if value and str(value).strip():
            clean_header_name = clean_header(header)
            doc[clean_header_name] = clean_value(value)

    return doc


def get_extension(filename: str) -> str:
    match = re.search(r"\.(\w+)$", filename.lower())
    if match:
        ext = match.group(1)
        return f"{ext}_record"
    return "unknown_record"


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

    if cleaned.lower() in ["true", "false"]:
        return cleaned.lower() == "true"

    try:
        if "." in cleaned:
            return float(cleaned)
        else:
            return int(cleaned)
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
