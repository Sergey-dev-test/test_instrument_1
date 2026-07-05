"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Приложение
    APP_NAME: str = "DB Manager"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Сервер
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # База данных (для хранения метаданных приложения)
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/db_manager"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Безопасность
    PASSWORD_SALT: str = "your-salt-change-in-production"
    
    # Логирование
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    # ИИ-агент
    AI_TIMEOUT: int = 30
    AI_MAX_TOKENS: int = 4000
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_PER_HOUR: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
