# backend/repositories/connection_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.connection import DatabaseConnection as ConnectionModel
from schemas.connection import ConnectionCreate
from core.security import encrypt_db_password


class ConnectionRepo:
    @staticmethod
    async def get_by_id(session: AsyncSession, connection_id: str) -> ConnectionModel:
        result = await session.execute(select(ConnectionModel).where(ConnectionModel.id == connection_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_user(session: AsyncSession, user_id: str) -> list:
        result = await session.execute(
            select(ConnectionModel).where(ConnectionModel.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create(session: AsyncSession, connection: ConnectionCreate, user_id: str) -> ConnectionModel:
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
        return db_connection

    @staticmethod
    async def update(session: AsyncSession, db_connection: ConnectionModel, connection: ConnectionCreate) -> ConnectionModel:
        if connection.name:
            db_connection.name = connection.name
        if connection.host:
            db_connection.host = connection.host
        if connection.port:
            db_connection.port = connection.port
        if connection.database_name:
            db_connection.database_name = connection.database_name
        if connection.username:
            db_connection.username = connection.username
        if connection.password:
            db_connection.password_encrypted = encrypt_db_password(connection.password)

        await session.commit()
        await session.refresh(db_connection)
        return db_connection

    @staticmethod
    async def delete(session: AsyncSession, connection_id: str) -> bool:
        result = await session.execute(select(ConnectionModel).where(ConnectionModel.id == connection_id))
        connection = result.scalar_one_or_none()
        if not connection:
            return False

        await session.delete(connection)
        await session.commit()
        return True
