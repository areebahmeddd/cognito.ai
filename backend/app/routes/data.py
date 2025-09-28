import os
import uuid
import json
import shutil
import zipfile
import hashlib
import asyncio
import tempfile
from datetime import datetime
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from typing import Dict, Any, Optional
from ..services.elasticsearch import (
    get_total,
    get_name,
    check_health,
    create_index,
    bulk_index,
    ensure_map,
)
from ..services.parser import process_files
from ..services.pdf import generate_report
from ..services.mongodb import create_case, store_files, get_case

router = APIRouter()


@router.post("/upload")
async def upload_zip(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    device_id: Optional[str] = Form(None),
):
    temp_dir = None
    try:
        if not file.filename.endswith(".zip"):
            raise HTTPException(status_code=400, detail="Only ZIP files are supported")

        content = await file.read()
        file_hash = calculate_hash(content)

        if check_duplicate(file_hash):
            duplicate_metadata = {
                "file_name": file.filename,
                "file_hash": file_hash,
                "upload_time": datetime.now().isoformat(),
            }
            return JSONResponse(
                content={
                    "message": "File already uploaded and indexed",
                    "status": "duplicate",
                    "files_processed": 0,
                    "documents_indexed": 0,
                    "failed_to_index": 0,
                    "metadata": duplicate_metadata,
                }
            )

        if case_id and not validate_case(case_id):
            raise HTTPException(status_code=400, detail="Invalid case ID provided")

        if not case_id:
            case_id = str(uuid.uuid4())

        if not device_id:
            device_id = str(uuid.uuid4())

        temp_dir = tempfile.mkdtemp(prefix="tsv_upload_")
        zip_path = os.path.join(temp_dir, file.filename)

        with open(zip_path, "wb") as f:
            f.write(content)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            tsv_files = []
            tsv_files_response = []
            for file_info in zip_ref.infolist():
                if not file_info.is_dir() and file_info.filename.endswith(".tsv"):
                    tsv_files.append(file_info.filename)
                    tsv_files_response.append(os.path.basename(file_info.filename))

        if not tsv_files:
            raise HTTPException(
                status_code=400, detail="No TSV files found in the ZIP file"
            )

        create_index()
        ensure_map()

        conversion_result = process_files(zip_path, tsv_files, temp_dir, file_hash)
        temp_dir = conversion_result.get("temp_dir")

        case_data = {
            "case_id": case_id or f"CASE-{device_id[:8]}",
            "device_id": device_id,
            "case_name": f"Case {case_id or device_id[:8]}",
            "description": f"Forensic analysis case for device {device_id}",
            "metadata": {
                "file_name": file.filename,
                "files_count": len(tsv_files),
                "files_list": tsv_files_response,
            },
        }

        try:
            await create_case(case_data)
        except Exception:
            pass

        mongodb_result = {"stored_files": 0, "total_records": 0, "files": []}
        if temp_dir and os.path.isdir(temp_dir):
            mongodb_result = await store_files(
                case_id or f"CASE-{device_id[:8]}", device_id, temp_dir
            )

        metadata = {
            "case_id": case_id,
            "device_id": device_id,
            "upload_time": datetime.now().isoformat(),
            "file_name": file.filename,
            "file_hash": file_hash,
            "files_count": len(tsv_files),
            "files_list": tsv_files_response,
        }

        metadata_path = os.path.join(temp_dir, "metadata.json")
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        indexing_result = {"success_count": 0, "error_count": 0, "files_processed": 0}

        if temp_dir and os.path.isdir(temp_dir):
            indexing_result = bulk_index(temp_dir)

        if indexing_result["success_count"] > 0:
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

        if indexing_result["success_count"] == 0:
            status = "failed"
        elif indexing_result["error_count"] > 100:
            status = "partial_success"
        else:
            status = "success"

        return JSONResponse(
            content={
                "message": "Data successfully loaded into Elasticsearch and MongoDB",
                "files_processed": len(tsv_files),
                "documents_indexed": indexing_result["success_count"],
                "failed_to_index": indexing_result["error_count"],
                "mongodb_stored_files": mongodb_result.get("stored_files", 0),
                "mongodb_total_records": mongodb_result.get("total_records", 0),
                "status": status,
                "metadata": metadata,
            }
        )
    except Exception as e:
        if temp_dir and os.path.isdir(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass
        raise HTTPException(
            status_code=500, detail=f"Upload processing failed: {str(e)}"
        )


@router.post("/export")
async def export_report(api_response: Dict[str, Any]):
    try:
        if not isinstance(api_response, dict):
            raise HTTPException(status_code=400, detail="Invalid API response format")

        pdf_path = generate_report(api_response)
        results = api_response.get("results", [])
        artifact_id = results[0]["artifact_id"]
        filename = f"{artifact_id}.pdf"

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=filename,
            background=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.get("/stats")
async def get_stats():
    try:
        count = get_total()
        index_name = get_name()
        status = check_health()
        return JSONResponse(
            content={
                "total_documents": count,
                "index_name": index_name,
                "status": status,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")


def calculate_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def check_duplicate(file_hash: str) -> bool:
    try:
        from ..services.elasticsearch import es_client, index_name

        query = {"query": {"term": {"file_hash": file_hash}}, "size": 1}

        response = es_client.search(index=index_name, body=query)
        return response["hits"]["total"]["value"] > 0
    except Exception:
        return False


def validate_case(case_id: str) -> bool:
    try:

        async def check_case():
            case = await get_case(case_id)
            return case is not None

        return asyncio.run(check_case())
    except Exception:
        return False
