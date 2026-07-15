# backend/repositories/connection_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.connection import DatabaseConnection as ConnectionModel
from schemas.connection import ConnectionCreate, ConnectionUpdate
from core.security import encrypt_db_password
from utils.logger import setup_logger

logger = setup_logger("instrument.repo.connection")


class ConnectionRepo:
    @staticmethod
    async def get_by_id(session: AsyncSession, connection_id: str) -> ConnectionModel:
        logger.debug(f"Поиск подключения по ID: {connection_id}")
        result = await session.execute(select(ConnectionModel).where(ConnectionModel.id == connection_id))
        connection = result.scalar_one_or_none()
        if connection:
            logger.debug(f"Подключение найдено: {connection_id}")
        return connection

    @staticmethod
    async def get_by_user(session: AsyncSession, user_id: str) -> list:
        logger.debug(f"Поиск подключений пользователя: {user_id}")
        result = await session.execute(
            select(ConnectionModel).where(ConnectionModel.user_id == user_id)
        )
        connections = result.scalars().all()
        logger.info(f"Найдено {len(connections)} подключений для пользователя {user_id}")
        return connections

    @staticmethod
    async def create(session: AsyncSession, connection: ConnectionCreate, user_id: str) -> ConnectionModel:
        logger.info(f"Создание подключения для пользователя {user_id}: {connection.name}")
        db_connection = ConnectionModel(
            user_id=user_id,
            name=connection.name,
            db_type=connection.db_type,
            host=connection.host,
            port=connection.port,
            database_name=connection.database_name,
            username=connection.username,
            password_encrypted=encrypt_db_password(connection.password)
        )
        session.add(db_connection)
        await session.commit()
        await session.refresh(db_connection)
        logger.info(f"Подключение создано: {db_connection.id}")
        return db_connection

    @staticmethod
    async def update(session: AsyncSession, db_connection: ConnectionModel, connection: ConnectionUpdate) -> ConnectionModel:
        logger.info(f"Обновление подключения: {db_connection.id}")
        update_data = connection.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"]:
            db_connection.name = update_data["name"]
        if "host" in update_data and update_data["host"]:
            db_connection.host = update_data["host"]
        if "port" in update_data and update_data["port"]:
            db_connection.port = update_data["port"]
        if "database_name" in update_data and update_data["database_name"]:
            db_connection.database_name = update_data["database_name"]
        if "username" in update_data and update_data["username"]:
            db_connection.username = update_data["username"]
        if "password" in update_data and update_data["password"]:
            db_connection.password_encrypted = encrypt_db_password(update_data["password"])

        await session.commit()
        await session.refresh(db_connection)
        logger.info(f"Подключение обновлено: {db_connection.id}")
        return db_connection

    @staticmethod
    async def delete(session: AsyncSession, connection_id: str) -> bool:
        logger.info(f"Удаление подключения: {connection_id}")
        result = await session.execute(select(ConnectionModel).where(ConnectionModel.id == connection_id))
        connection = result.scalar_one_or_none()
        if not connection:
            logger.warning(f"Подключение не найдено для удаления: {connection_id}")
            return False

        await session.delete(connection)
        await session.commit()
        logger.info(f"Подключение удалено: {connection_id}")
        return True
