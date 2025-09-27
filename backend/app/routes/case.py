from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import uuid
from datetime import datetime

router = APIRouter()

# In-memory storage for cases (since you only wanted MongoDB for JSON files)
cases_storage = []

@router.get("/")
async def get_cases():
    """Get all cases"""
    try:
        return JSONResponse(content={"cases": cases_storage})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cases: {str(e)}")

@router.post("/case")
async def create_case(case_data: Dict[str, Any]):
    """Create a new case"""
    try:
        case_id = str(uuid.uuid4())
        new_case = {
            "id": case_id,
            "title": case_data.get("title", f"Case {case_id[:8]}"),
            "description": case_data.get("description", ""),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        cases_storage.append(new_case)
        return JSONResponse(content=new_case)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create case: {str(e)}")

@router.get("/{case_id}")
async def get_case(case_id: str):
    """Get specific case"""
    try:
        case = next((c for c in cases_storage if c["id"] == case_id), None)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=case)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get case: {str(e)}")

@router.put("/{case_id}")
async def update_case(case_id: str, case_data: Dict[str, Any]):
    """Update case"""
    try:
        case_index = next((i for i, c in enumerate(cases_storage) if c["id"] == case_id), None)
        if case_index is None:
            raise HTTPException(status_code=404, detail="Case not found")
        
        cases_storage[case_index].update({
            "title": case_data.get("title", cases_storage[case_index]["title"]),
            "description": case_data.get("description", cases_storage[case_index]["description"]),
            "updated_at": datetime.now().isoformat()
        })
        
        return JSONResponse(content=cases_storage[case_index])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update case: {str(e)}")

@router.delete("/{case_id}")
async def delete_case(case_id: str):
    """Delete case"""
    try:
        global cases_storage
        cases_storage = [c for c in cases_storage if c["id"] != case_id]
        return JSONResponse(content={"message": "Case deleted successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete case: {str(e)}")
