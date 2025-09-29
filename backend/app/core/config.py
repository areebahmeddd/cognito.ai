from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Cognito AI"
    app_description: str = "Natural language interface for digital forensic evidence"
    app_version: str = "1.0.0"
    # debug: bool = False
    cors_origins: list[str] = ["*"]
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]
    cors_credentials: bool = True

    elasticsearch_url: str
    elasticsearch_index: str
    gemini_api_key: str
    mongodb_connection_string: str

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
