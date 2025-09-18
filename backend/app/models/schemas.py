from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Dict, List, Optional, Union


class LocationModel(BaseModel):
    lat: float
    lon: float


class HashModel(BaseModel):
    md5: Optional[str] = None
    sha1: Optional[str] = None
    sha256: Optional[str] = None


class UFDRDocument(BaseModel):
    _id: str
    artifact_id: str
    case_id: str
    device_id: str
    type: str
    data_type: str
    timestamp: datetime
    source_path: str

    channel: Optional[str] = None
    platform: Optional[str] = None
    service: Optional[str] = None
    message_id: Optional[str] = None
    thread_id: Optional[str] = None
    from_: Optional[Union[str, List[str]]] = Field(None, alias="from")
    to: Optional[Union[str, List[str]]] = None
    participants: Optional[List[str]] = None
    display_from: Optional[str] = None
    display_to: Optional[str] = None
    text: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    duration_sec: Optional[int] = None
    direction: Optional[str] = None
    call_type: Optional[str] = None
    status: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    url: Optional[str] = None
    email: Optional[str] = None
    filename: Optional[str] = None
    hashes: Optional[HashModel] = None
    location: Optional[LocationModel] = None
    country: Optional[str] = None
    languages: Optional[List[str]] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    method: Optional[str] = None
    ip: Optional[str] = None
    event: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    size: int = Field(default=10, ge=1, le=100)
    from_: int = Field(default=0, ge=0, alias="from")


class SearchResponse(BaseModel):
    hits: List[UFDRDocument]
    total: int
    took: int


class TimelineRequest(BaseModel):
    interval: str = Field(default="1d", description="Time interval (1h, 1d, 1w, 1M)")
    filters: Optional[Dict[str, Any]] = None


class TimelineBucket(BaseModel):
    timestamp: str
    count: int


class TimelineResponse(BaseModel):
    buckets: List[TimelineBucket]
    took: int


class EntityRelationship(BaseModel):
    source: str
    target: str
    weight: int
    common_artifacts: List[str]


class EntityResponse(BaseModel):
    relationships: List[EntityRelationship]
    took: int
