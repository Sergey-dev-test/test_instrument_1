# backend/config/settings.py

from pydantic_settings import BaseSettings
from typing import List
from schemas.types import DBType


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "DB Manager"
    VERSION: str = "0.2.0"
    DEBUG: bool = False
    APP_DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database (project DB)
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "db_manager"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-key-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Fernet encryption key for DB passwords
    FERNET_KEY: str = ""

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # AI (Mock по умолчанию)
    AI_ENABLED: bool = False  # Включить локальный Mock AI
    AI_MOCK_RESPONSE_DELAY_MS: int = 300

    # Security / CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()