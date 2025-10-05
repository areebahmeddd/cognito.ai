from pydantic import BaseModel
from typing import Optional


class CreateCaseRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority_tag: Optional[str] = None
