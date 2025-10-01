import os
import csv
import json
import zipfile
from datetime import datetime
from typing import Dict, List, Any, Optional

from .classifier import classify_file, batch_classify
from ..utils.helpers import (
    get_extension,
    get_source,
    get_timestamp,
    clean_value,
    clean_header,
)


def process_files(
    zip_path: str, tsv_files: List[str], temp_dir: str, file_hash: str = None
) -> Dict[str, Any]:
    input_dir = os.path.join(temp_dir, "input")
    output_dir = os.path.join(temp_dir, "output")
    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    print(
        f"[parser] extracting {len(tsv_files)} TSV from {os.path.basename(zip_path)}",
        flush=True,
    )
    extracted_files = extract_files(zip_path, tsv_files, input_dir)
    filenames = [os.path.basename(f) for f in extracted_files]
    # temporary disable batch classification due to memory issues with large files + ai rate limit
    # try:
    print(f"[parser] classifying {len(filenames)} files", flush=True)
    file_classifications = batch_classify(filenames)
    # except Exception:
    #     file_classifications = {filename: {"type": "Unknown Data", "category": "general data"} for filename in filenames}

    successful = 0
    total_records = 0

    for tsv_file in extracted_files:
        filename = os.path.basename(tsv_file)
        output_path = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}.json")

        num_records = process_file(
            tsv_file, output_path, file_classifications.get(filename), file_hash
        )

        if num_records > 0:
            successful += 1
            total_records += num_records

    print(
        f"[parser] converted {successful}/{len(extracted_files)} files -> {total_records} records",
        flush=True,
    )
    return {
        "temp_dir": output_dir,
        "files_converted": successful,
        "total_records": total_records,
    }


def process_file(
    tsv_path: str,
    output_path: str,
    classification: Optional[Dict[str, str]] = None,
    file_hash: str = None,
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
                doc = create_doc(row, i, tsv_path, classification, file_hash)
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
    file_hash: str = None,
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

    if file_hash:
        doc["file_hash"] = file_hash

    for header, value in row.items():
        if value and str(value).strip():
            clean_header_name = clean_header(header)
            doc[clean_header_name] = clean_value(value)

    return doc
