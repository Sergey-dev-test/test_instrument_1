# backend/api/v1/tables.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from services.db_service import DBService
from repositories.table_repo import TableRepo
from config.database import get_db
from schemas.table import TableInDB, FieldInDB
from models.connection import DatabaseConnection

router = APIRouter()


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
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Синхронизация структуры таблиц из внешней СУБД"""
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Подключение не найдено")

    result = await DBService.sync_structure(
        db_session=db,
        connection_id=connection_id,
        user_id=user.id,
        db_type=connection.db_type,
        host=connection.host,
        port=connection.port,
        db_name=connection.database_name,
        username=connection.username,
        password_encrypted=connection.password_encrypted
    )

    return result