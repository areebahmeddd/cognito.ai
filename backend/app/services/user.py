from datetime import datetime
from typing import Optional

from bson import ObjectId

from ..models.user import User, UserCreate, UserUpdate, UserInDB
from ..services.jwt import hash_password, verify_password
from ..services.mongodb import get_database
from ..services.elasticsearch import delete_documents


async def create_user(user: UserCreate) -> User:
    db = get_database()

    existing_user = await db.users.find_one(
        {
            "$or": [
                {"username": user.username},
                {"email": user.email},
            ]
        }
    )

    if existing_user:
        raise ValueError("Username or email already exists")

    hashed_password = hash_password(user.password)

    user_doc = {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)

    return User(
        id=str(result.inserted_id),
        username=user_doc["username"],
        email=user_doc["email"],
        role=user_doc["role"],
        is_active=user_doc["is_active"],
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"],
    )


async def authenticate_user(
    username_or_email: str, password: str
) -> Optional[UserInDB]:
    user = await get_by_username(username_or_email)
    if not user:
        user = await get_by_email(username_or_email)

    if not user or not verify_password(password, user.hashed_password):
        return None

    return user


async def get_by_username(username: str) -> Optional[UserInDB]:
    db = get_database()
    user_doc = await db.users.find_one({"username": username})

    if user_doc:
        user_doc["id"] = str(user_doc["_id"])
        return UserInDB(**user_doc)

    return None


async def get_by_email(email: str) -> Optional[UserInDB]:
    db = get_database()
    user_doc = await db.users.find_one({"email": email})

    if user_doc:
        user_doc["id"] = str(user_doc["_id"])
        return UserInDB(**user_doc)

    return None


async def get_by_id(user_id: str) -> Optional[UserInDB]:
    try:
        db = get_database()
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})

        if user_doc:
            return UserInDB(
                id=str(user_doc["_id"]),
                username=user_doc["username"],
                email=user_doc["email"],
                role=user_doc["role"],
                hashed_password=user_doc["hashed_password"],
                is_active=user_doc["is_active"],
                created_at=user_doc["created_at"],
                updated_at=user_doc["updated_at"],
            )

        return None
    except Exception:
        return None


async def update_user(user_id: str, user_update: UserUpdate) -> Optional[User]:
    try:
        db = get_database()
        update_data = {}

        if user_update.username is not None:
            update_data["username"] = user_update.username
        if user_update.email is not None:
            update_data["email"] = user_update.email
        if user_update.role is not None:
            update_data["role"] = user_update.role
        if user_update.password is not None:
            update_data["hashed_password"] = hash_password(user_update.password)

        if not update_data:
            return None

        update_data["updated_at"] = datetime.utcnow()

        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
        )

        if result.modified_count == 0:
            return None

        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})

        if user_doc:
            return User(
                id=str(user_doc["_id"]),
                username=user_doc["username"],
                email=user_doc["email"],
                role=user_doc["role"],
                is_active=user_doc["is_active"],
                created_at=user_doc["created_at"],
                updated_at=user_doc["updated_at"],
            )

        return None
    except Exception:
        return None


async def delete_user(user_id: str) -> bool:
    try:
        db = get_database()
        delete_documents(user_id)

        await db.cases.delete_many({"user_id": user_id})
        await db.files.delete_many({"user_id": user_id})

        user_result = await db.users.delete_one({"_id": ObjectId(user_id)})
        return user_result.deleted_count > 0
    except Exception:
        return False
