import os
import json
import tempfile
import zipfile
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, File, UploadFile
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
from ..services.parser import process_files
from ..services.pdf import generate_report
from ..services.mongodb import mongodb_service

router = APIRouter()


@router.post("/upload")
async def upload_zip(file: UploadFile = File(...)):
    temp_dir = None
    try:
        if not file.filename.endswith(".zip"):
            raise HTTPException(status_code=400, detail="Only ZIP files are supported")

        case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
        device_id = f"DEV-{uuid.uuid4().hex[:8].upper()}"

        temp_dir = tempfile.mkdtemp(prefix="tsv_upload_")
        zip_path = os.path.join(temp_dir, file.filename)

        with open(zip_path, "wb") as f:
            content = await file.read()
            f.write(content)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            tsv_files = []
            tsv_files_for_response = []
            for file_info in zip_ref.infolist():
                if not file_info.is_dir() and file_info.filename.endswith(".tsv"):
                    tsv_files.append(file_info.filename)
                    tsv_files_for_response.append(os.path.basename(file_info.filename))

        if not tsv_files:
            raise HTTPException(
                status_code=400, detail="No TSV files found in the ZIP file"
            )

        create_index()
        ensure_map()

        conversion_result = process_files(zip_path, tsv_files, temp_dir)
        temp_dir = conversion_result.get("temp_dir")

        # Connect to MongoDB
        await mongodb_service.connect()

        # Create case in MongoDB
        case_data = {
            "case_id": case_id or f"CASE-{device_id[:8]}",
            "device_id": device_id,
            "case_name": f"Case {case_id or device_id[:8]}",
            "description": f"Forensic analysis case for device {device_id}",
            "metadata": {
                "file_name": file.filename,
                "files_count": len(tsv_files),
                "files_list": tsv_files_for_response,
            }
        }
        
        try:
            case_id = await mongodb_service.create_case(case_data)
            print(f"Created case in MongoDB: {case_id}")
        except Exception as e:
            print(f"Error creating case in MongoDB: {e}")
            # Continue with processing even if MongoDB fails

        # Store JSON files in MongoDB
        mongodb_result = {"stored_files": 0, "total_records": 0, "files": []}
        if temp_dir and os.path.isdir(temp_dir):
            try:
                mongodb_result = await mongodb_service.store_json_files(
                    case_id or f"CASE-{device_id[:8]}", 
                    device_id, 
                    temp_dir
                )
                print(f"MongoDB storage result: {mongodb_result}")
            except Exception as e:
                print(f"Error storing JSON files in MongoDB: {e}")
                # Continue with Elasticsearch indexing even if MongoDB fails

        metadata = {
            "case_id": case_id,
            "device_id": device_id,
            "upload_time": datetime.now().isoformat(),
            "file_name": file.filename,
            "files_count": len(tsv_files),
            "files_list": tsv_files_for_response,
            "mongodb_result": mongodb_result,
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
