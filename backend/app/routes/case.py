import os
import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

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
from ..services.elasticsearch import (
    delete_case_documents,
    delete_upload as es_delete_upload,
)
from ..services.jwt import get_user
from ..services.user import get_by_id


security = HTTPBearer()
router = APIRouter()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    return get_user(token)


@router.get("/")
async def list_cases(current_user: str = Depends(get_current_user)):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        cases = await get_cases(user.id)
        return JSONResponse(content={"cases": cases})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get cases")


@router.post("/case")
async def new_case(
    case_data: Dict[str, Any], current_user: str = Depends(get_current_user)
):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        case_id = str(uuid.uuid4())
        case_body = {
            "case_id": case_id,
            "case_name": case_data.get("title", f"Case {case_id[:8]}"),
            "description": case_data.get("description", ""),
            "priority_tag": case_data.get("priority_tag", ""),
            "device_id": case_data.get("device_id", str(uuid.uuid4())),
            "metadata": {},
        }

        await create_case(case_body, user.id)
        return JSONResponse(content={"case_id": case_id})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create case")


@router.get("/{case_id}")
async def fetch_case(case_id: str, current_user: str = Depends(get_current_user)):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        case = await get_case(case_id, user.id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get case")


@router.get("/{case_id}/files")
async def get_files(case_id: str, current_user: str = Depends(get_current_user)):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        files = await list_files(case_id, user.id)
        case_obj = await get_case(case_id, user.id)
        meta = (case_obj or {}).get("metadata", {}) if case_obj else {}
        uploads = meta.get("uploads", [])
        return JSONResponse(content={"files": files, "uploads": uploads})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get case files")


@router.get("/{case_id}/files/{file_name}")
async def get_file(
    case_id: str, file_name: str, current_user: str = Depends(get_current_user)
):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        case_obj = await get_case(case_id, user.id)
        if not case_obj:
            raise HTTPException(status_code=404, detail="Case not found")

        from ..services.mongodb import files_collection

        json_file_name = file_name.replace(".tsv", ".json")
        normalized = "".join(
            char
            for char in os.path.basename(json_file_name)
            if char.isalnum() or char in "._-"
        )
        candidates = [json_file_name, normalized]
        file_doc = await files_collection.find_one(
            {"case_id": case_id, "user_id": user.id, "file_name": {"$in": candidates}}
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


@router.put("/{case_id}")
async def edit_case(
    case_id: str,
    case_data: Dict[str, Any],
    current_user: str = Depends(get_current_user),
):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updated_case = await update_case(case_id, case_data, user.id)
        if not updated_case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=updated_case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update case")


@router.delete("/{case_id}")
async def remove_case(case_id: str, current_user: str = Depends(get_current_user)):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        mongo_result = await delete_case(case_id, user.id)
        if not mongo_result:
            raise HTTPException(status_code=404, detail="Case not found")

        es_result = delete_case_documents(case_id)

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
async def archive_case(case_id: str, current_user: str = Depends(get_current_user)):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        archived_case = await mongo_archive_case(case_id, user.id)
        if not archived_case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=archived_case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to archive case")


@router.post("/{case_id}/activate")
async def activate_case(case_id: str, current_user: str = Depends(get_current_user)):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        activated_case = await mongo_activate_case(case_id, user.id)
        if not activated_case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=activated_case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to activate case")


@router.delete("/{case_id}/uploads/{zip_name}")
async def delete_upload(
    case_id: str, zip_name: str, current_user: str = Depends(get_current_user)
):
    try:
        user = await get_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        case_obj = await get_case(case_id, user.id)
        if not case_obj:
            raise HTTPException(status_code=404, detail="Case not found")

        from ..services.mongodb import files_collection

        json_names = []
        file_cursor = files_collection.find(
            {"case_id": case_id, "user_id": user.id, "zip_name": zip_name}
        )
        async for file_doc in file_cursor:
            file_name = file_doc.get("file_name")
            if isinstance(file_name, str) and file_name.endswith(".json"):
                json_names.append(file_name)

        deleted_files = 0
        if json_names:
            delete_result = await files_collection.delete_many(
                {
                    "case_id": case_id,
                    "user_id": user.id,
                    "file_name": {"$in": json_names},
                }
            )
            deleted_files = getattr(delete_result, "deleted_count", 0)

        await files_collection.delete_many(
            {"case_id": case_id, "user_id": user.id, "zip_name": zip_name}
        )

        es_deleted = 0
        es_result = es_delete_upload(case_id, zip_name)
        es_deleted = es_result.get("deleted_count", 0)

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

        from ..services.mongodb import cases_collection

        await cases_collection.update_one(
            {"case_id": case_id, "user_id": user.id},
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
