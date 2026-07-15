# backend/repositories/table_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.table import Table as TableModel, Field
from models.connection import DatabaseConnection
from schemas.table import TableCreate
from utils.logger import setup_logger

logger = setup_logger("instrument.repo.table")


class TableRepo:
    @staticmethod
    async def get_by_connection(session: AsyncSession, connection_id: str) -> list:
        logger.debug(f"Поиск таблиц для подключения: {connection_id}")
        result = await session.execute(
            select(TableModel).where(TableModel.connection_id == connection_id)
        )
        tables = result.scalars().all()
        logger.info(f"Найдено {len(tables)} таблиц для подключения {connection_id}")
        return tables

    @staticmethod
    async def get_by_id(session: AsyncSession, table_id) -> TableModel:
        logger.debug(f"Поиск таблицы по ID: {table_id}")
        result = await session.execute(select(TableModel).where(TableModel.id == table_id))
        table = result.scalar_one_or_none()
        if table:
            logger.debug(f"Таблица найдена: {table.name}")
        return table

    @staticmethod
    async def get_by_user(session: AsyncSession, user_id) -> list:
        logger.debug(f"Поиск таблиц пользователя: {user_id}")
        result = await session.execute(
            select(TableModel).join(DatabaseConnection).where(
                DatabaseConnection.user_id == user_id
            )
        )
        tables = result.scalars().all()
        logger.info(f"Найдено {len(tables)} таблиц для пользователя {user_id}")
        return tables

    @staticmethod
    async def get_fields(session: AsyncSession, table_id: str) -> list:
        logger.debug(f"Поиск полей таблицы: {table_id}")
        result = await session.execute(
            select(Field).where(Field.table_id == table_id)
        )
        fields = result.scalars().all()
        logger.debug(f"Найдено {len(fields)} полей для таблицы {table_id}")
        return fields

    @staticmethod
    async def create(session: AsyncSession, table: TableCreate) -> TableModel:
        logger.info(f"Создание таблицы: {table.name}")
        db_table = TableModel(
            connection_id=table.connection_id,
            name=table.name,
            description=table.description,
            row_count=0
        )
        session.add(db_table)
        await session.commit()
        await session.refresh(db_table)
        logger.info(f"Таблица создана: {db_table.id}")
        return db_table

    @staticmethod
    async def update(session: AsyncSession, db_table: TableModel, table: TableCreate) -> TableModel:
        logger.info(f"Обновление таблицы: {db_table.name}")
        if table.name:
            db_table.name = table.name
        if table.description:
            db_table.description = table.description
        await session.commit()
        await session.refresh(db_table)
        return db_table

    @staticmethod
    async def delete(session: AsyncSession, table_id: str) -> bool:
        logger.info(f"Удаление таблицы: {table_id}")
        result = await session.execute(select(TableModel).where(TableModel.id == table_id))
        table = result.scalar_one_or_none()
        if not table:
            logger.warning(f"Таблица не найдена для удаления: {table_id}")
            return False

        await session.delete(table)
        await session.commit()
        logger.info(f"Таблица удалена: {table_id}")
        return True