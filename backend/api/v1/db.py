# backend/api/v1/db.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from config.database import get_db
from schemas.connection import (
    DatabaseConnectionCreate,
    ConnectionCreate,
    ConnectionUpdate,
    Connection,
)
from core.dependencies import get_current_user
from repositories.connection_repo import ConnectionRepo

router = APIRouter()


@router.post("/test-connection")
async def test_connection(
    conn_data: DatabaseConnectionCreate,
    user=Depends(get_current_user)
):
    try:
        if conn_data.db_type == "POSTGRES":
            url = f"postgresql+asyncpg://{conn_data.username}:{conn_data.password}@{conn_data.host}:{conn_data.port}/{conn_data.database_name}"
            engine_test = create_async_engine(url)
        elif conn_data.db_type == "MYSQL":
            url = f"mysql+aiomysql://{conn_data.username}:{conn_data.password}@{conn_data.host}:{conn_data.port}/{conn_data.database_name}"
            engine_test = create_async_engine(url)
        else:
            raise HTTPException(status_code=400, detail="Unsupported DB type")
        
        async with engine_test.connect() as conn:
            await conn.execute(text("SELECT 1"))
        await engine_test.dispose()
        
        return {"message": "Подключение успешно", "db_type": conn_data.db_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка подключения: {str(e)}")


@router.get("/", response_model=list[Connection])
async def list_connections(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Список подключений пользователя"""
    connections = await ConnectionRepo.get_by_user(db, user.id)
    return connections


@router.post("/", response_model=Connection)
async def create_connection(
    conn_data: ConnectionCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Создать подключение"""
    connection = await ConnectionRepo.create(db, conn_data, str(user.id))
    return connection


@router.get("/{connection_id}", response_model=Connection)
async def get_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Получить подключение по ID"""
    connection = await ConnectionRepo.get_by_id(db, connection_id)
    if not connection or str(connection.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    return connection


@router.put("/{connection_id}", response_model=Connection)
async def update_connection(
    connection_id: str,
    conn_data: ConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Обновить подключение"""
    connection = await ConnectionRepo.get_by_id(db, connection_id)
    if not connection or str(connection.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Подключение не найдено")

    # Если пароль не передан — сохраняем старый
    update_data = conn_data.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        from core.security import encrypt_db_password
        connection.password_encrypted = encrypt_db_password(update_data["password"])
    if "name" in update_data:
        connection.name = update_data["name"]
    if "host" in update_data:
        connection.host = update_data["host"]
    if "port" in update_data:
        connection.port = update_data["port"]
    if "database_name" in update_data:
        connection.database_name = update_data["database_name"]
    if "username" in update_data:
        connection.username = update_data["username"]

    await db.commit()
    await db.refresh(connection)
    return connection


@router.delete("/{connection_id}")
async def delete_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Удалить подключение"""
    connection = await ConnectionRepo.get_by_id(db, connection_id)
    if not connection or str(connection.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Подключение не найдено")

    deleted = await ConnectionRepo.delete(db, connection_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Не удалось удалить")
    return {"message": "Подключение удалено"}