import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()


class CreateCaseRequest(BaseModel):
    title: str
    description: str = ""


@router.post("/cases")
async def create_case(request: CreateCaseRequest):
    """Create a new case and return the case ID"""
    try:
        case_id = str(uuid.uuid4())
        
        # Store case metadata (in a real app, this would go to a database)
        case_data = {
            "id": case_id,
            "title": request.title,
            "description": request.description,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        
        return JSONResponse(
            content={
                "message": "Case created successfully",
                "case_id": case_id,
                "case_data": case_data,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Case creation failed: {str(e)}"
        )
