import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from ..models.schemas import CreateCaseRequest

router = APIRouter()

cases_storage = []


@router.get("/")
async def get_cases():
    try:
        return JSONResponse(
            content={
                "message": "Cases retrieved successfully",
                "cases": cases_storage,
                "total": len(cases_storage),
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve cases: {str(e)}"
        )


@router.post("/case")
async def create_case(request: CreateCaseRequest):
    try:
        case_id = str(uuid.uuid4())
        case_data = {
            "id": case_id,
            "title": request.title,
            "description": request.description,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        cases_storage.append(case_data)

        return JSONResponse(
            content={
                "message": "Case created successfully",
                "case_id": case_id,
                "case_data": case_data,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create case: {str(e)}")


@router.get("/case/{case_id}")
async def get_case(case_id: str):
    try:
        case = next((c for c in cases_storage if c["id"] == case_id), None)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        return JSONResponse(
            content={
                "message": "Case retrieved successfully",
                "case": case,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve case: {str(e)}"
        )


@router.put("/case/{case_id}")
async def update_case(case_id: str, request: CreateCaseRequest):
    try:
        case = next((c for c in cases_storage if c["id"] == case_id), None)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        case.update(request.model_dump())

        return JSONResponse(
            content={
                "message": "Case updated successfully",
                "case": case,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update case: {str(e)}")


@router.delete("/case/{case_id}")
async def delete_case(case_id: str):
    try:
        case_index = next(
            (i for i, c in enumerate(cases_storage) if c["id"] == case_id), None
        )
        if case_index is None:
            raise HTTPException(status_code=404, detail="Case not found")

        deleted_case = cases_storage.pop(case_index)

        return JSONResponse(
            content={
                "message": "Case deleted successfully",
                "case": deleted_case,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete case: {str(e)}")
