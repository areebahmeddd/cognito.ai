import os
import tempfile
import zipfile

from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse

from ..services.index import get_count, get_index_name, check_status
from ..services.parser import convert_files

router = APIRouter()


@router.post("/upload")
async def upload_zip(
    file: UploadFile = File(...),
):
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

        try:
            result = convert_files(zip_path, tsv_files, temp_dir)
            results = [result]
        except Exception as e:
            results = [{"status": "failed", "error": str(e)}]

        return JSONResponse(
            content={
                "message": f"Processed {len(tsv_files)} TSV files",
                "results": results,
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Upload processing failed: {str(e)}"
        )


@router.get("/stats")
async def get_stats():
    try:
        count = get_count()
        index_name = get_index_name()
        status = check_status()
        return JSONResponse(
            content={
                "total_documents": count,
                "index_name": index_name,
                "status": status,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")
