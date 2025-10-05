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

    elasticsearch_url: str = "http://localhost:9200"
    elasticsearch_index: str = "cognito"

    jwt_secret_key: str = "1234567890"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    mongodb_connection_string: str = "mongodb://localhost:27017/cognito"
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
