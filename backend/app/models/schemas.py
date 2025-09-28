from pydantic import BaseModel, Field
from typing import Optional, Union, List, Dict, Any
from datetime import datetime


class UFDRDocument(BaseModel):
    # Core forensic identification fields
    artifact_id: str
    category: Optional[str] = None
    file_type: Optional[str] = None
    app: Optional[str] = None
    data_type: Optional[str] = None
    source_path: Optional[str] = None
    timestamp: Optional[Union[str, datetime]] = None
    conversion_timestamp: Optional[Union[str, datetime]] = None

    # Message and communication content
    message: Optional[str] = None
    title: Optional[Union[str, int]] = None
    body: Optional[str] = None
    text: Optional[Union[str, int]] = None
    transcription: Optional[str] = None

    # Communication participants and routing
    sender: Optional[str] = None
    recipient: Optional[str] = None
    from_: Optional[Union[str, List[str]]] = Field(None, alias="from")
    to: Optional[Union[str, List[str]]] = None
    display_from: Optional[Union[str, int]] = None
    display_to: Optional[Union[str, int]] = None
    caller: Optional[str] = None
    callee: Optional[str] = None

    # Communication metadata
    message_id: Optional[Union[str, int]] = None
    thread_id: Optional[Union[str, int]] = None
    direction: Optional[Union[str, int]] = None
    message_direction: Optional[str] = None
    message_type: Optional[str] = None
    channel: Optional[str] = None
    platform: Optional[str] = None
    service: Optional[str] = None
    conversation_name: Optional[str] = None
    sending_party: Optional[str] = None
    sending_party_jid: Optional[str] = None

    # Contact and identity information
    phone_number: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[Union[str, int]] = None
    contact_name: Optional[str] = None
    participants: Optional[List[str]] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None

    # Web browsing and search
    url: Optional[str] = None
    host: Optional[str] = None
    domain: Optional[str] = None
    search_term: Optional[str] = None
    browser: Optional[str] = None
    referrer: Optional[str] = None

    # Geographic location data
    latitude: Optional[Union[str, float]] = None
    longitude: Optional[Union[str, float]] = None
    altitude: Optional[float] = None
    address: Optional[str] = None
    place: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    country_iso: Optional[str] = None
    message_latitude: Optional[float] = None
    message_longitude: Optional[float] = None

    # Call and media information
    call_duration: Optional[int] = None
    call_type: Optional[str] = None
    call_direction: Optional[str] = None
    call_date: Optional[str] = None
    call_start_timestamp: Optional[Union[str, datetime]] = None
    call_end_timestamp: Optional[Union[str, datetime]] = None
    media_type: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None

    # Application and system data
    package_name: Optional[str] = None
    app_name: Optional[str] = None
    app_package_name: Optional[str] = None
    package_id: Optional[str] = None
    version: Optional[str] = None
    status: Optional[Union[str, int]] = None
    notification_type: Optional[str] = None
    event_type: Optional[str] = None
    usage_type: Optional[str] = None
    time_active_in_secs: Optional[int] = None
    last_time_active: Optional[Union[str, datetime]] = None
    types: Optional[str] = None

    # Financial transaction data
    amount: Optional[float] = None
    currency: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_method: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None

    # Device hardware and sensors
    device_battery: Optional[int] = Field(None, alias="device_battery_(%)")
    charging: Optional[bool] = None
    speed: Optional[Union[str, float]] = Field(None, alias="speed_(mps)")
    course: Optional[float] = None
    device_type: Optional[Union[str, int]] = None
    pace: Optional[float] = None
    elevation_gain: Optional[float] = None
    possible_rssi: Optional[int] = None

    # Authentication and security
    authtoken: Optional[str] = None
    authtoken_type: Optional[str] = None
    password: Optional[Union[str, int]] = None
    last_password_entry: Optional[Union[datetime, str]] = None

    # File and data management
    source_file: Optional[str] = None
    originating_file: Optional[str] = None
    apk_path: Optional[str] = None
    data: Optional[str] = None
    value: Optional[Union[str, float, int, bool]] = None
    key: Optional[str] = None
    file_hash: Optional[str] = None

    # Calendar and scheduling
    calendar_name: Optional[str] = None
    calendar_display_name: Optional[str] = None

    # User and access control
    user: Optional[int] = None
    owner_account: Optional[str] = None
    holder: Optional[str] = None
    role: Optional[str] = None
    access_count: Optional[int] = None

    # Message and content status
    deleted: Optional[bool] = None
    visible: Optional[bool] = None
    is_primary: Optional[bool] = None
    is_system_message: Optional[bool] = None
    message_is_hidden: Optional[bool] = None
    message_is_read: Optional[bool] = None
    read_status: Optional[Union[str, int]] = None
    message_read: Optional[Union[str, int]] = None

    # Timestamps and temporal data
    message_timestamp: Optional[Union[str, datetime]] = None
    debug_time: Optional[Union[datetime, str]] = None
    creation_timestamp: Optional[Union[datetime, str]] = None
    last_updated_timestamp: Optional[Union[datetime, str]] = None
    duration: Optional[Union[str, int]] = None

    # System and technical metadata
    record_id: Optional[str] = None
    source: Optional[str] = None
    package: Optional[str] = None
    id: Optional[Union[str, int]] = None
    action_type: Optional[str] = None
    alert_life_cycle_id: Optional[int] = None
    cc: Optional[str] = None
    name: Optional[Union[str, int]] = None
    data_1: Optional[Union[str, int]] = None

    # Complex data structures
    hashes: Optional[Dict[str, Any]] = None
    location_data: Optional[Dict[str, Any]] = Field(None, alias="location")
    entities: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    languages: Optional[List[str]] = None

    class Config:
        extra = "allow"
        populate_by_name = True


class QueryRequest(BaseModel):
    query: str


class CreateCaseRequest(BaseModel):
    title: str
    description: str = ""
