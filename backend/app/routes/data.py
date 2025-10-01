import os
import uuid
import shutil
import zipfile
import tempfile
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse

from ..services.elasticsearch import (
    get_count,
    get_index,
    check_health,
    create_index,
    bulk_index,
    ensure_mapping,
)
from ..services.parser import process_files
from ..services.pdf import generate_report
from ..services.mongodb import store_files
from ..utils.helpers import calculate_hash, check_duplicate, validate_case


router = APIRouter()


@router.post("/upload")
async def upload_file(
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

        if case_id and check_duplicate(file_hash, case_id):
            duplicate_metadata = {
                "file_name": file.filename,
                "file_hash": file_hash,
                "case_id": case_id,
                "upload_time": datetime.now().isoformat(),
            }
            return JSONResponse(
                content={
                    "message": "File already uploaded and indexed for this case",
                    "status": "duplicate",
                    "files_processed": 0,
                    "documents_indexed": 0,
                    "failed_to_index": 0,
                    "metadata": duplicate_metadata,
                }
            )

        if case_id and not await validate_case(case_id):
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
            tsv_list = []
            for file_info in zip_ref.infolist():
                if not file_info.is_dir() and file_info.filename.endswith(".tsv"):
                    tsv_files.append(file_info.filename)
                    tsv_list.append(os.path.basename(file_info.filename))

        if not tsv_files:
            raise HTTPException(
                status_code=400, detail="No TSV files found in the ZIP file"
            )

        create_index()
        ensure_mapping()

        conversion_result = process_files(zip_path, tsv_files, temp_dir, file_hash)
        temp_dir = conversion_result.get("temp_dir")

        mongodb_result = {"stored_files": 0, "total_records": 0, "files": []}
        if temp_dir and os.path.isdir(temp_dir):
            mongodb_result = await store_files(
                case_id or f"CASE-{device_id[:8]}",
                device_id,
                temp_dir,
                file.filename,
                file.size,
            )

        metadata = {
            "case_id": case_id,
            "device_id": device_id,
            "upload_time": datetime.now().isoformat(),
            "file_name": file.filename,
            "file_hash": file_hash,
            "files_count": len(tsv_list),
            "files_list": tsv_list,
        }

        from ..services.mongodb import update_case

        await update_case(case_id, {"metadata": metadata})

        indexing_result = {"success_count": 0, "error_count": 0, "files_processed": 0}
        if temp_dir and os.path.isdir(temp_dir):
            indexing_result = bulk_index(
                temp_dir, case_id, device_id, file_hash, file.filename
            )

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

        results = api_response.get("results", [])
        if not results:
            raise HTTPException(status_code=400, detail="No search results to export")

        pdf_path = generate_report(api_response)
        case_id = api_response.get("case_id", "unknown")
        filename = f"{case_id}.pdf"

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=filename,
            background=None,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.get("/stats")
async def get_stats():
    try:
        count = get_count()
        index_name = get_index()
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
