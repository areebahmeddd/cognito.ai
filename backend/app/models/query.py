from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str
    case_id: str
