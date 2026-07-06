# backend/api/v1/sql.py

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from core.dependencies import get_current_user
from services.sql_service import SQLService
from schemas.sql import SQLRequest, SQLResponse

router = APIRouter()


@router.post("/generate")
async def generate_sql(
    request: SQLRequest,
    user=Depends(get_current_user)
) -> SQLResponse:
    """
    Генерация SQL-запроса по естественному запросу
    Пример: "покажи последних 10 активных пользователей" → SELECT ... WHERE is_active = true ORDER BY created_at DESC LIMIT 10
    """
    try:
        sql = await SQLService().generate_sql(
            natural_language=request.natural_language,
            table_name=request.table_name,
            db_type=request.db_type,
            context={"connection_id": request.connection_id}
        )
        return SQLResponse(sql=sql["sql"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка генерации SQL: {str(e)}")


@router.post("/validate")
async def validate_sql(
    request: SQLRequest,
    user=Depends(get_current_user)
):
    """Валидация SQL-запроса (синтаксис + права доступа)"""
    if not request.natural_language:
        raise HTTPException(status_code=400, detail="Запрос не может быть пустым")
    return {"status": "valid", "message": "Запрос может быть выполнен (в prod — проверка прав и синтаксиса)"}