import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import bcrypt

from motor.motor_asyncio import AsyncIOMotorClient

from ..core.config import settings
from ..models.schemas import UserCreate, UserUpdate, UserInDB, User

connection_string = settings.mongodb_connection_string
client = None
db = None
cases_collection = None
files_collection = None
users_collection = None


async def connect_database():
    global client, db, cases_collection, files_collection, users_collection
    try:
        client = AsyncIOMotorClient(connection_string)
        db = client.cognito
        cases_collection = db.cases
        files_collection = db.files
        users_collection = db.users
    except Exception as e:
        raise Exception(f"Database connection failed: {str(e)}")


async def check_health() -> str:
    try:
        if client is None:
            return "disconnected"
        await client.admin.command("ping")
        return "connected"
    except Exception:
        return "error"


async def create_case(case_data: Dict[str, Any]) -> str:
    try:
        case_doc = {
            "case_id": case_data.get("case_id"),
            "case_name": case_data.get("case_name"),
            "device_id": case_data.get("device_id"),
            "description": case_data.get("description", ""),
            "priority_tag": case_data.get("priority_tag"),
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "metadata": case_data.get("metadata", {}),
        }
        result = await cases_collection.insert_one(case_doc)
        print(f"[mongo] case created {case_doc.get('case_id')}", flush=True)
        return str(result.inserted_id)
    except Exception as e:
        raise Exception(f"Failed to create case: {str(e)}")


async def get_cases() -> List[Dict[str, Any]]:
    try:
        cursor = cases_collection.find({})
        cases = []
        async for case in cursor:
            case["_id"] = str(case["_id"])
            case_id = case.get("case_id")
            if case_id:
                file_count = await files_collection.count_documents(
                    {"case_id": case_id}
                )
                case["total_files_count"] = file_count
            else:
                case["total_files_count"] = 0
            cases.append(case)
        return cases
    except Exception as e:
        raise Exception(f"Failed to get cases: {str(e)}")


async def get_case(case_id: str) -> Dict[str, Any]:
    try:
        case = await cases_collection.find_one({"case_id": case_id})
        if case:
            case["_id"] = str(case["_id"])
            case["total_files_count"] = await files_collection.count_documents(
                {"case_id": case_id}
            )
        return case
    except Exception as e:
        raise Exception(f"Failed to get case: {str(e)}")


async def list_files(case_id: str) -> List[Dict[str, Any]]:
    try:
        cursor = files_collection.find({"case_id": case_id})
        files = []
        async for file_doc in cursor:
            file_doc["_id"] = str(file_doc["_id"])
            files.append(file_doc)
        return files
    except Exception as e:
        raise Exception(f"Failed to get case files: {str(e)}")


async def update_case(case_id: str, case_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        update_data = {"updated_at": datetime.now().isoformat()}

        if "case_name" in case_data:
            update_data["case_name"] = case_data.get("case_name")
        if "description" in case_data:
            update_data["description"] = case_data.get("description")
        if "priority_tag" in case_data:
            update_data["priority_tag"] = case_data.get("priority_tag")

        if "metadata" in case_data:
            existing_case = await get_case(case_id)
            existing_meta = (existing_case or {}).get("metadata", {})
            existing_uploads = (
                existing_meta.get("uploads", [])
                if isinstance(existing_meta, dict)
                else []
            )

            new_upload = case_data.get("metadata") or {}
            incoming_hash = new_upload.get("file_hash")
            uploads: List[Dict[str, Any]] = list(existing_uploads)
            if not (
                incoming_hash
                and any(u.get("file_hash") == incoming_hash for u in uploads)
            ):
                uploads.append(new_upload)

            update_data["metadata"] = {
                "uploads": uploads,
                "total_uploads": len(uploads),
            }

        result = await cases_collection.update_one(
            {"case_id": case_id}, {"$set": update_data}
        )
        if result.modified_count:
            print(f"[mongo] case updated {case_id}", flush=True)
        return await get_case(case_id) if result.modified_count > 0 else None
    except Exception as e:
        raise Exception(f"Failed to update case: {str(e)}")


async def delete_case(case_id: str) -> bool:
    try:
        case_result = await cases_collection.delete_one({"case_id": case_id})
        await files_collection.delete_many({"case_id": case_id})
        if case_result.deleted_count:
            print(f"[mongo] case deleted {case_id}", flush=True)
        return case_result.deleted_count > 0
    except Exception as e:
        raise Exception(f"Failed to delete case: {str(e)}")


async def archive_case(case_id: str) -> Dict[str, Any]:
    try:
        result = await cases_collection.update_one(
            {"case_id": case_id},
            {"$set": {"status": "archived", "updated_at": datetime.now().isoformat()}},
        )
        return await get_case(case_id) if result.modified_count > 0 else None
    except Exception as e:
        raise Exception(f"Failed to archive case: {str(e)}")


async def activate_case(case_id: str) -> Dict[str, Any]:
    try:
        result = await cases_collection.update_one(
            {"case_id": case_id},
            {"$set": {"status": "active", "updated_at": datetime.now().isoformat()}},
        )
        return await get_case(case_id) if result.modified_count > 0 else None
    except Exception as e:
        raise Exception(f"Failed to activate case: {str(e)}")


async def store_files(
    case_id: str,
    device_id: str,
    json_files_dir: str,
    original_zip_name: str = None,
    file_size: int = None,
) -> Dict[str, Any]:
    try:
        stored_files = []
        total_records = 0

        if not os.path.exists(json_files_dir):
            return {"stored_files": 0, "total_records": 0, "files": []}

        for filename in os.listdir(json_files_dir):
            if not filename.endswith(".json"):
                continue

            file_path = os.path.join(json_files_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                records = data if isinstance(data, list) else [data]
                file_data = {
                    "case_id": case_id,
                    "device_id": device_id,
                    "file_name": filename,
                    "zip_name": original_zip_name,
                    "source_path": file_path,
                    "records": records,
                    "record_count": len(records),
                }

                file_id = await store_file(file_data)
                stored_files.append(
                    {
                        "file_id": file_id,
                        "file_name": filename,
                        "zip_name": original_zip_name,
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


async def store_file(file_data: Dict[str, Any]) -> str:
    try:
        file_doc = {
            "case_id": file_data.get("case_id"),
            "device_id": file_data.get("device_id"),
            "file_name": file_data.get("file_name"),
            "zip_name": file_data.get("zip_name"),
            "source_path": file_data.get("source_path"),
            "records": file_data.get("records", []),
            "record_count": file_data.get("record_count", 0),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        result = await files_collection.insert_one(file_doc)
        return str(result.inserted_id)
    except Exception as e:
        raise Exception(f"Failed to store file: {str(e)}")


# User Management Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


async def create_user(user_data: UserCreate) -> str:
    """Create a new user in the database"""
    try:
        # Check if user already exists
        existing_user = await users_collection.find_one({
            "$or": [
                {"username": user_data.username},
                {"email": user_data.email}
            ]
        })
        
        if existing_user:
            if existing_user["username"] == user_data.username:
                raise Exception("Username already exists")
            else:
                raise Exception("Email already exists")
        
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # Create user document
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "role": user_data.role,
            "hashed_password": hashed_password,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "is_active": True,
        }
        
        result = await users_collection.insert_one(user_doc)
        print(f"[mongo] user created {user_data.username}", flush=True)
        return str(result.inserted_id)
    except Exception as e:
        raise Exception(f"Failed to create user: {str(e)}")


async def get_user_by_username_or_email(username_or_email: str) -> Optional[UserInDB]:
    """Get user by username or email"""
    try:
        user = await users_collection.find_one({
            "$or": [
                {"username": username_or_email},
                {"email": username_or_email}
            ]
        })
        
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None
    except Exception as e:
        raise Exception(f"Failed to get user: {str(e)}")


async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """Get user by ID"""
    try:
        from bson import ObjectId
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None
    except Exception as e:
        raise Exception(f"Failed to get user: {str(e)}")


async def update_user(user_id: str, user_data: UserUpdate) -> Optional[UserInDB]:
    """Update user information"""
    try:
        from bson import ObjectId
        update_data = {"updated_at": datetime.now().isoformat()}
        
        if user_data.username is not None:
            # Check if username is already taken by another user
            existing_user = await users_collection.find_one({
                "username": user_data.username,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing_user:
                raise Exception("Username already exists")
            update_data["username"] = user_data.username
            
        if user_data.email is not None:
            # Check if email is already taken by another user
            existing_user = await users_collection.find_one({
                "email": user_data.email,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing_user:
                raise Exception("Email already exists")
            update_data["email"] = user_data.email
            
        if user_data.role is not None:
            update_data["role"] = user_data.role
            
        if user_data.password is not None:
            update_data["hashed_password"] = hash_password(user_data.password)
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count:
            print(f"[mongo] user updated {user_id}", flush=True)
            return await get_user_by_id(user_id)
        return None
    except Exception as e:
        raise Exception(f"Failed to update user: {str(e)}")


async def authenticate_user(username_or_email: str, password: str) -> Optional[User]:
    """Authenticate user with username/email and password"""
    try:
        user = await get_user_by_username_or_email(username_or_email)
        
        if not user or not user.is_active:
            return None
            
        if not verify_password(password, user.hashed_password):
            return None
            
        # Return user without password
        return User(
            _id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at,
            is_active=user.is_active
        )
    except Exception as e:
        raise Exception(f"Failed to authenticate user: {str(e)}")


async def delete_user(user_id: str) -> bool:
    """Delete a user"""
    try:
        from bson import ObjectId
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count:
            print(f"[mongo] user deleted {user_id}", flush=True)
        return result.deleted_count > 0
    except Exception as e:
        raise Exception(f"Failed to delete user: {str(e)}")
