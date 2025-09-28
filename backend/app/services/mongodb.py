import os
import json
from datetime import datetime
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient
from ..core.config import settings

connection_string = settings.mongodb_connection_string
client = None
db = None
cases_collection = None
files_collection = None


async def connect_database():
    global client, db, cases_collection, files_collection
    try:
        client = AsyncIOMotorClient(connection_string)
        db = client.case
        cases_collection = db.cases
        files_collection = db.cases
    except Exception as e:
        raise Exception(f"Database connection failed: {str(e)}")


async def create_case(case_data: Dict[str, Any]) -> str:
    try:
        case_doc = {
            "case_id": case_data.get("case_id"),
            "case_name": case_data.get("case_name"),
            "device_id": case_data.get("device_id"),
            "description": case_data.get("description", ""),
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "metadata": case_data.get("metadata", {}),
        }

        result = await cases_collection.insert_one(case_doc)
        return str(result.inserted_id)
    except Exception as e:
        raise Exception(f"Failed to create case: {str(e)}")


async def get_cases() -> List[Dict[str, Any]]:
    try:
        cursor = cases_collection.find({})
        cases = []
        async for case in cursor:
            case["_id"] = str(case["_id"])
            cases.append(case)
        return cases
    except Exception as e:
        raise Exception(f"Failed to get cases: {str(e)}")


async def get_case(case_id: str) -> Dict[str, Any]:
    try:
        case = await cases_collection.find_one({"case_id": case_id})
        if case:
            case["_id"] = str(case["_id"])
        return case
    except Exception as e:
        raise Exception(f"Failed to get case: {str(e)}")


async def update_case(case_id: str, case_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        update_data = {
            "case_name": case_data.get("title"),
            "description": case_data.get("description"),
            "updated_at": datetime.now(),
        }

        result = await cases_collection.update_one(
            {"case_id": case_id}, {"$set": update_data}
        )

        if result.modified_count > 0:
            return await get_case(case_id)
        return None
    except Exception as e:
        raise Exception(f"Failed to update case: {str(e)}")


async def delete_case(case_id: str) -> bool:
    try:
        result = await cases_collection.delete_one({"case_id": case_id})
        return result.deleted_count > 0
    except Exception as e:
        raise Exception(f"Failed to delete case: {str(e)}")


async def archive_case(case_id: str) -> Dict[str, Any]:
    try:
        update_data = {"status": "archived", "updated_at": datetime.now()}

        result = await cases_collection.update_one(
            {"case_id": case_id}, {"$set": update_data}
        )

        if result.modified_count > 0:
            return await get_case(case_id)
        return None
    except Exception as e:
        raise Exception(f"Failed to archive case: {str(e)}")


async def activate_case(case_id: str) -> Dict[str, Any]:
    try:
        update_data = {"status": "active", "updated_at": datetime.now()}

        result = await cases_collection.update_one(
            {"case_id": case_id}, {"$set": update_data}
        )

        if result.modified_count > 0:
            return await get_case(case_id)
        return None
    except Exception as e:
        raise Exception(f"Failed to activate case: {str(e)}")


async def store_file(file_data: Dict[str, Any]) -> str:
    try:
        file_doc = {
            "case_id": file_data.get("case_id"),
            "device_id": file_data.get("device_id"),
            "file_name": file_data.get("file_name"),
            "source_path": file_data.get("source_path"),
            "records": file_data.get("records", []),
            "record_count": file_data.get("record_count", 0),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        result = await files_collection.insert_one(file_doc)
        return str(result.inserted_id)
    except Exception as e:
        raise Exception(f"Failed to store file: {str(e)}")


async def store_files(
    case_id: str, device_id: str, json_files_dir: str
) -> Dict[str, Any]:
    try:
        stored_files = []
        total_records = 0

        if not os.path.exists(json_files_dir):
            return {"stored_files": 0, "total_records": 0, "files": []}

        for filename in os.listdir(json_files_dir):
            if filename.endswith(".json"):
                file_path = os.path.join(json_files_dir, filename)

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    records = []
                    if isinstance(data, list):
                        records = data
                    elif isinstance(data, dict):
                        records = [data]

                    file_data = {
                        "case_id": case_id,
                        "device_id": device_id,
                        "file_name": filename,
                        "source_path": file_path,
                        "records": records,
                        "record_count": len(records),
                    }

                    file_id = await store_file(file_data)
                    stored_files.append(
                        {
                            "file_id": file_id,
                            "file_name": filename,
                            "record_count": len(records),
                        }
                    )

                    total_records += len(records)

                except Exception:
                    continue

        return {
            "stored_files": len(stored_files),
            "total_records": total_records,
            "files": stored_files,
        }

    except Exception as e:
        raise Exception(f"Failed to store files: {str(e)}")


async def get_stats() -> Dict[str, Any]:
    try:
        total_cases = await cases_collection.count_documents({})
        active_cases = await cases_collection.count_documents({"status": "active"})
        archived_cases = await cases_collection.count_documents({"status": "archived"})
        file_count = await files_collection.count_documents({})

        total_records = 0
        cursor = files_collection.find({}, {"record_count": 1})
        async for doc in cursor:
            total_records += doc.get("record_count", 0)

        return {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "archived_cases": archived_cases,
            "total_files": file_count,
            "total_records": total_records,
            "status": "connected",
        }
    except Exception as e:
        raise Exception(f"Failed to get stats: {str(e)}")
