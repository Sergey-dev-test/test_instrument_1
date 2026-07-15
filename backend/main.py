## src/backend/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from utils.logger import setup_logger
from api.v1.auth import router as auth_router
from api.v1.db import router as db_router
from api.v1.tables import router as tables_router
from api.v1.excel import router as excel_router
from api.v1.sql import router as sql_router
from api.v1.methods import router as methods_router
from api.v1.ai import router as ai_router

# Настройка логгера
logger = setup_logger(
    "instrument.main",
    log_level=settings.LOG_LEVEL,
)

# Создание приложения
logger.info(f"Запуск {settings.PROJECT_NAME} v{settings.VERSION}")
logger.info(f"Режим отладки: {settings.APP_DEBUG}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Instrument_v3 API",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS разрешённые источники: {settings.CORS_ORIGINS}")

# Регистрация роутов
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(db_router, prefix="/api/v1", tags=["connections"])
app.include_router(tables_router, prefix="/api/v1", tags=["tables"])
app.include_router(excel_router, prefix="/api/v1", tags=["excel"])
app.include_router(sql_router, prefix="/api/v1", tags=["sql"])
app.include_router(methods_router, prefix="/api/v1", tags=["methods"])
app.include_router(ai_router, prefix="/api/v1", tags=["ai"])

logger.info("Все роуты зарегистрированы")


@app.get("/")
def read_root():
    return {"message": "Instrument_v3 API", "version": settings.VERSION}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Запуск uvicorn на 0.0.0.0:8000 (reload={settings.APP_DEBUG})")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_DEBUG,
    )