# backend/api/v1/db.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from config.database import get_db
from utils.logger import setup_logger
from schemas.connection import (
    DatabaseConnectionCreate,
    ConnectionCreate,
    ConnectionUpdate,
    Connection,
)
from core.dependencies import get_current_user
from repositories.connection_repo import ConnectionRepo

logger = setup_logger("instrument.api.db")

router = APIRouter()


@router.post("/test-connection")
async def test_connection(
    conn_data: DatabaseConnectionCreate,
    user=Depends(get_current_user)
):
    """Тестирование подключения к базе данных."""
    logger.info(
        f"Пользователь {user.id} тестирует подключение: "
        f"{conn_data.db_type}://{conn_data.host}:{conn_data.port}/{conn_data.database_name}"
    )
    try:
        if conn_data.db_type == "POSTGRES":
            url = f"postgresql+asyncpg://{conn_data.username}:{conn_data.password}@{conn_data.host}:{conn_data.port}/{conn_data.database_name}"
        elif conn_data.db_type == "MYSQL":
            url = f"mysql+aiomysql://{conn_data.username}:{conn_data.password}@{conn_data.host}:{conn_data.port}/{conn_data.database_name}"
        else:
            logger.error(f"Неподдерживаемый тип БД: {conn_data.db_type}")
            raise HTTPException(status_code=400, detail="Unsupported DB type")
        
        logger.debug(f"Создание движка для URL: {url[:url.rfind(':')]}:***@...")
        engine_test = create_async_engine(url)
        
        logger.debug("Проверка соединения...")
        async with engine_test.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        await engine_test.dispose()
        logger.info(f"Подключение успешно: {conn_data.db_type}://{conn_data.host}:{conn_data.port}")
        return {"message": "Подключение успешно", "db_type": conn_data.db_type}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка подключения {conn_data.host}:{conn_data.port}: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка подключения: {str(e)}")


@router.get("/", response_model=list[Connection])
async def list_connections(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Список подключений пользователя."""
    logger.info(f"Пользователь {user.id} запрашивает список подключений")
    try:
        connections = await ConnectionRepo.get_by_user(db, user.id)
        logger.info(f"Найдено {len(connections)} подключений для пользователя {user.id}")
        return connections
    except Exception as e:
        logger.error(f"Ошибка получения списка подключений: {e}")
        raise


@router.post("/", response_model=Connection)
async def create_connection(
    conn_data: ConnectionCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Создать подключение."""
    logger.info(
        f"Пользователь {user.id} создаёт подключение: "
        f"{conn_data.db_type}://{conn_data.host}:{conn_data.port}/{conn_data.database_name}"
    )
    try:
        connection = await ConnectionRepo.create(db, conn_data, str(user.id))
        logger.info(f"Подключение создано с ID: {connection.id}")
        return connection
    except Exception as e:
        logger.error(f"Ошибка создания подключения: {e}")
        raise


@router.get("/{connection_id}", response_model=Connection)
async def get_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Получить подключение по ID."""
    logger.debug(f"Пользователь {user.id} запрашивает подключение {connection_id}")
    connection = await ConnectionRepo.get_by_id(db, connection_id)
    if not connection or str(connection.user_id) != str(user.id):
        logger.warning(f"Подключение {connection_id} не найдено или доступ запрещён для {user.id}")
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    return connection


@router.put("/{connection_id}", response_model=Connection)
async def update_connection(
    connection_id: str,
    conn_data: ConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Обновить подключение."""
    logger.info(f"Пользователь {user.id} обновляет подключение {connection_id}")
    connection = await ConnectionRepo.get_by_id(db, connection_id)
    if not connection or str(connection.user_id) != str(user.id):
        logger.warning(f"Подключение {connection_id} не найдено или доступ запрещён для {user.id}")
        raise HTTPException(status_code=404, detail="Подключение не найдено")

    updated = await ConnectionRepo.update(db, connection, conn_data)
    await db.refresh(updated)
    logger.info(f"Подключение {connection_id} успешно обновлено")
    return updated


@router.delete("/{connection_id}")
async def delete_connection(
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Удалить подключение."""
    logger.info(f"Пользователь {user.id} удаляет подключение {connection_id}")
    connection = await ConnectionRepo.get_by_id(db, connection_id)
    if not connection or str(connection.user_id) != str(user.id):
        logger.warning(f"Подключение {connection_id} не найдено или доступ запрещён для {user.id}")
        raise HTTPException(status_code=404, detail="Подключение не найдено")

    deleted = await ConnectionRepo.delete(db, connection_id)
    if not deleted:
        logger.error(f"Не удалось удалить подключение {connection_id}")
        raise HTTPException(status_code=404, detail="Не удалось удалить")
    logger.info(f"Подключение {connection_id} успешно удалено")
    return {"message": "Подключение удалено"}