import os
import json
import tempfile
import zipfile
import shutil
from datetime import datetime
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from typing import Dict, Any
from ..services.elasticsearch import (
    get_total,
    get_name,
    check_health,
    create_index,
    bulk_index,
    ensure_map,
)
from ..services.parser import convert_files
from ..services.pdf import generate_report

router = APIRouter()


@router.post("/upload")
async def upload_zip(
    file: UploadFile = File(...), case_id: str = Form(None), device_id: str = Form(None)
):
    temp_dir = None
    try:
        if not file.filename.endswith(".zip"):
            raise HTTPException(status_code=400, detail="Only ZIP files are supported")

        temp_dir = tempfile.mkdtemp(prefix="tsv_upload_")
        zip_path = os.path.join(temp_dir, file.filename)

        with open(zip_path, "wb") as f:
            content = await file.read()
            f.write(content)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            tsv_files = []
            for file_info in zip_ref.infolist():
                if not file_info.is_dir() and file_info.filename.endswith(".tsv"):
                    tsv_files.append(file_info.filename)

        if not tsv_files:
            raise HTTPException(
                status_code=400, detail="No TSV files found in the ZIP file"
            )

        create_index()
        ensure_map()

        conversion_result = convert_files(zip_path, tsv_files, temp_dir)
        temp_dir = conversion_result.get("temp_dir")

        metadata = {
            "case_id": case_id,
            "device_id": device_id,
            "upload_time": datetime.now().isoformat(),
            "file_name": file.filename,
            "files_count": len(tsv_files),
            "files_list": tsv_files,
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
                "message": "Data successfully loaded into Elasticsearch",
                "files_processed": len(tsv_files),
                "documents_indexed": indexing_result["success_count"],
                "failed_to_index": indexing_result["error_count"],
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
