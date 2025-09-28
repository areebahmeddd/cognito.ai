import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
from ..services.mongodb import (
    create_case,
    get_cases,
    get_case,
    update_case,
    delete_case,
    archive_case as mongo_archive_case,
    activate_case as mongo_activate_case,
)

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
        new_case_data = {
            "case_id": case_id,
            "case_name": case_data.get("title", f"Case {case_id[:8]}"),
            "description": case_data.get("description", ""),
            "device_id": case_data.get("device_id", str(uuid.uuid4())),
            "metadata": {},
        }

        await create_case(new_case_data)
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
        result = await delete_case(case_id)
        if not result:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content={"message": "Case deleted successfully"})
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
