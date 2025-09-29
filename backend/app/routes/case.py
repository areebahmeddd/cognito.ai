import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ..services.mongodb import (
    create_case,
    get_cases,
    get_case,
    list_files,
    update_case,
    delete_case,
    archive_case as mongo_archive_case,
    activate_case as mongo_activate_case,
)
from ..services.elasticsearch import delete_documents, delete_file


router = APIRouter()


@router.get("/")
async def list_cases():
    try:
        cases = await get_cases()
        return JSONResponse(content={"cases": cases})
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get cases")


@router.post("/case")
async def new_case(case_data: Dict[str, Any]):
    try:
        case_id = str(uuid.uuid4())
        case_body = {
            "case_id": case_id,
            "case_name": case_data.get("title", f"Case {case_id[:8]}"),
            "description": case_data.get("description", ""),
            "device_id": case_data.get("device_id", str(uuid.uuid4())),
            "metadata": {},
        }

        await create_case(case_body)
        return JSONResponse(content={"case_id": case_id})
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create case")


@router.get("/{case_id}")
async def fetch_case(case_id: str):
    try:
        case = await get_case(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get case")


@router.get("/{case_id}/files")
async def get_files(case_id: str):
    try:
        files = await list_files(case_id)
        case_obj = await get_case(case_id)
        meta = (case_obj or {}).get("metadata", {}) if case_obj else {}
        uploads = meta.get("uploads", [])
        return JSONResponse(content={"files": files, "uploads": uploads})
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get case files")


@router.put("/{case_id}")
async def edit_case(case_id: str, case_data: Dict[str, Any]):
    try:
        updated_case = await update_case(case_id, case_data)
        if not updated_case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=updated_case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update case")


@router.delete("/{case_id}")
async def remove_case(case_id: str):
    try:
        mongo_result = await delete_case(case_id)
        if not mongo_result:
            raise HTTPException(status_code=404, detail="Case not found")

        es_result = delete_documents(case_id)

        return JSONResponse(
            content={
                "message": "Case and associated files deleted successfully",
                "mongodb_deleted": True,
                "elasticsearch_deleted": es_result.get("deleted_count", 0),
            }
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete case")


@router.post("/{case_id}/archive")
async def archive_case(case_id: str):
    try:
        archived_case = await mongo_archive_case(case_id)
        if not archived_case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=archived_case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to archive case")


@router.post("/{case_id}/activate")
async def activate_case(case_id: str):
    try:
        activated_case = await mongo_activate_case(case_id)
        if not activated_case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=activated_case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to activate case")


@router.get("/{case_id}/files/{file_name}")
async def get_file(case_id: str, file_name: str):
    try:
        from ..services.mongodb import get_case, files_collection

        case_obj = await get_case(case_id)
        if not case_obj:
            raise HTTPException(status_code=404, detail="Case not found")

        json_file_name = file_name.replace(".tsv", ".json")
        file_doc = await files_collection.find_one(
            {"case_id": case_id, "file_name": json_file_name}
        )

        if not file_doc:
            raise HTTPException(
                status_code=404, detail="File data not found in database"
            )

        records = file_doc.get("records", [])
        response_data = {
            "file_name": file_name,
            "json_file_name": json_file_name,
            "case_id": case_id,
            "case_name": case_obj.get("case_name", "Unknown"),
            "total_records": len(records),
            "records": records,
            "file_metadata": {
                "source_path": file_doc.get("source_path", ""),
                "record_count": file_doc.get("record_count", 0),
                "created_at": file_doc.get("created_at", ""),
                "updated_at": file_doc.get("updated_at", ""),
            },
        }

        return JSONResponse(content=response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get file content: {str(e)}"
        )


@router.delete("/{case_id}/uploads/{zip_name}")
async def delete_upload(case_id: str, zip_name: str):
    try:
        from ..services.mongodb import get_case, files_collection, cases_collection

        case_obj = await get_case(case_id)
        if not case_obj:
            raise HTTPException(status_code=404, detail="Case not found")

        json_names = []
        file_cursor = files_collection.find({"case_id": case_id, "zip_name": zip_name})
        async for file_doc in file_cursor:
            file_name = file_doc.get("file_name")
            if isinstance(file_name, str) and file_name.endswith(".json"):
                json_names.append(file_name)

        deleted_files = 0
        if json_names:
            delete_result = await files_collection.delete_many(
                {"case_id": case_id, "file_name": {"$in": json_names}}
            )
            deleted_files = getattr(delete_result, "deleted_count", 0)

        await files_collection.delete_many({"case_id": case_id, "zip_name": zip_name})

        es_deleted = 0
        for json_name in json_names:
            es_result = delete_file(case_id, json_name)
            es_deleted += es_result.get("deleted_count", 0)

        metadata = case_obj.get("metadata", {}) or {}
        uploads = metadata.get("uploads", []) if isinstance(metadata, dict) else []

        new_uploads = [
            upload_item
            for upload_item in uploads
            if not (
                isinstance(upload_item, dict)
                and upload_item.get("file_name") == zip_name
            )
        ]

        await cases_collection.update_one(
            {"case_id": case_id},
            {
                "$set": {
                    "metadata": {
                        "uploads": new_uploads,
                        "total_uploads": len(new_uploads),
                    }
                }
            },
        )

        return JSONResponse(
            content={
                "deleted_files": deleted_files,
                "deleted_from_elasticsearch": es_deleted,
                "zip_name": zip_name,
                "status": "success",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete upload: {str(e)}"
        )
