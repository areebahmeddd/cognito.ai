from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # App settings
    app_name: str = "Cognito AI"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Elasticsearch settings
    elasticsearch_url: str = "http://localhost:9200"
    elasticsearch_index: str = "ufdr"
    
    # CORS settings
    cors_origins: list[str] = ["*"]
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]
    cors_credentials: bool = True
    
    # API settings
    api_v1_prefix: str = "/api/v1"
    
    # Gemini AI settings
    gemini_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()
