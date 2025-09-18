"""Security utilities and configurations."""
from typing import Optional
from fastapi import HTTPException, status


def verify_api_key(api_key: Optional[str] = None) -> bool:
    """Verify API key if authentication is enabled."""
    # For now, no authentication required
    # This can be extended later for API key authentication
    return True


def get_current_user():
    """Get current authenticated user."""
    # Placeholder for future authentication
    return {"user_id": "anonymous", "role": "user"}
