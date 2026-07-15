# backend/api/v1/tables.py

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from services.db_service import DBService
from repositories.table_repo import TableRepo
from config.database import get_db
from schemas.table import TableInDB, FieldInDB
from models.connection import DatabaseConnection
from pydantic import BaseModel
from utils.logger import setup_logger

logger = setup_logger("instrument.api.tables")

router = APIRouter()


class SyncRequest(BaseModel):
    connection_id: str


@router.get("/", response_model=list[TableInDB])
async def list_tables(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Список таблиц пользователя"""
    return await TableRepo.get_by_user(db, user.id)


@router.get("/{table_id}", response_model=TableInDB)
async def get_table(
    table_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Получение метаданных таблицы"""
    table = await TableRepo.get_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Таблица не найдена")
    # Проверка владельца через явный запрос подключения
    conn_result = await db.execute(
        select(DatabaseConnection).where(DatabaseConnection.id == table.connection_id)
    )
    connection = conn_result.scalar_one_or_none()
    if not connection or str(connection.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Таблица не найдена")
    return table


@router.get("/{table_id}/fields", response_model=list[FieldInDB])
async def get_table_fields(
    table_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Список полей таблицы"""
    fields = await TableRepo.get_fields(db, table_id)
    return fields


@router.post("/sync")
async def sync_tables(
    request: SyncRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Синхронизация структуры таблиц из внешней СУБД."""
    logger.info(
        f"Пользователь {user.id} запускает синхронизацию для подключения {request.connection_id}"
    )
    
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == request.connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    connection = result.scalar_one_or_none()
    if not connection:
        logger.warning(
            f"Подключение {request.connection_id} не найдено для пользователя {user.id}"
        )
        raise HTTPException(status_code=404, detail="Подключение не найдено")

    from core.security import decrypt_db_password

    password = decrypt_db_password(connection.password_encrypted) if connection.password_encrypted else ""

    logger.info(
        f"Начало синхронизации: {connection.db_type}://{connection.host}:{connection.port}/{connection.database_name}"
    )
    
    try:
        result = await DBService.sync_structure(
            db_session=db,
            connection_id=connection.id,
            user_id=user.id,
            db_type=connection.db_type,
            host=connection.host,
            port=connection.port,
            db_name=connection.database_name,
            username=connection.username or "",
            password_encrypted=password
        )
        logger.info(f"Синхронизация завершена: {result}")
        return result
    except Exception as e:
        logger.error(f"Ошибка синхронизации: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка синхронизации: {str(e)}")