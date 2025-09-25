import os
import tempfile
import zipfile
import shutil
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from io import BytesIO
from pydantic import BaseModel
from typing import List, Optional

from ..services.elasticsearch import (
    get_total,
    get_name,
    check_health,
    create_index,
    bulk_index,
    ensure_map,
)
from ..services.parser import convert_files, transform_results
from ..services.pdf import generate_pdf

router = APIRouter()

class MessageItem(BaseModel):
    artifact_id: Optional[str]
    case_id: Optional[str]
    device_id: Optional[str]
    timestamp: Optional[str]
    message: Optional[str]
    conversation_name: Optional[str]
    sending_party: Optional[str]
    message_direction: Optional[str]
    source_path: Optional[str]
    hashes: Optional[str]
    creation_timestamp: Optional[str]
    last_updated_timestamp: Optional[str]
    message_timestamp: Optional[str]
class ExportRequest(BaseModel):
    query: Optional[str]
    query_intent: Optional[str]
    total_results: Optional[int]
    results: List[MessageItem]
    took: Optional[int]

@router.post("/upload")
async def upload_zip(file: UploadFile = File(...)):
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
        result = convert_files(zip_path, tsv_files, temp_dir)
        temp_dir = result.get("temp_dir")
        indexed = 0

        if temp_dir and os.path.isdir(temp_dir):
            indexed = bulk_index(temp_dir)

        if indexed > 0:
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

        return JSONResponse(
            content={
                "message": "Data successfully loaded into Elasticsearch",
                "files_processed": len(tsv_files),
                "documents_indexed": indexed,
                "status": "success",
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Upload processing failed: {str(e)}"
        )


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
    

@router.post("/export")
def export_pdf(request: ExportRequest):
    try:
        parsed_data = transform_results([r.dict() for r in request.results])
        pdf_buffer = BytesIO()
        generate_pdf(parsed_data, output_file=pdf_buffer)
        pdf_buffer.seek(0)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=forensic_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF export failed: {str(e)}")