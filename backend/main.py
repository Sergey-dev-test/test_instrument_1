"""
Точка входа приложения FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config.settings import settings
from backend.api.v1 import auth, db, tables, sql, methods, excel, ai

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Инструмент управления структурой баз данных с ИИ-интеграцией"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API роутов
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(db.router, prefix="/api/v1/db", tags=["database"])
app.include_router(tables.router, prefix="/api/v1/tables", tags=["tables"])
app.include_router(sql.router, prefix="/api/v1/sql", tags=["sql"])
app.include_router(methods.router, prefix="/api/v1/methods", tags=["methods"])
app.include_router(excel.router, prefix="/api/v1/excel", tags=["excel"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])


@app.get("/health")
async def health_check():
    """Проверка работоспособности"""
    return {"status": "ok", "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
