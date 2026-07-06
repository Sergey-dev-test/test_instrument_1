# backend/repositories/table_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.table import Table as TableModel, Field
from models.connection import DatabaseConnection
from schemas.table import TableCreate


class TableRepo:
    @staticmethod
    async def get_by_connection(session: AsyncSession, connection_id: str) -> list:
        result = await session.execute(
            select(TableModel).where(TableModel.connection_id == connection_id)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_id(session: AsyncSession, table_id) -> TableModel:
        result = await session.execute(select(TableModel).where(TableModel.id == table_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_user(session: AsyncSession, user_id) -> list:
        result = await session.execute(
            select(TableModel).join(DatabaseConnection).where(
                DatabaseConnection.user_id == user_id
            )
        )
        return result.scalars().all()

    @staticmethod
    async def get_fields(session: AsyncSession, table_id: str) -> list:
        result = await session.execute(
            select(Field).where(Field.table_id == table_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create(session: AsyncSession, table: TableCreate) -> TableModel:
        db_table = TableModel(
            connection_id=table.connection_id,
            name=table.name,
            description=table.description,
            row_count=0
        )
        session.add(db_table)
        await session.commit()
        await session.refresh(db_table)
        return db_table

    @staticmethod
    async def update(session: AsyncSession, db_table: TableModel, table: TableCreate) -> TableModel:
        if table.name:
            db_table.name = table.name
        if table.description:
            db_table.description = table.description
        await session.commit()
        await session.refresh(db_table)
        return db_table

    @staticmethod
    async def delete(session: AsyncSession, table_id: str) -> bool:
        result = await session.execute(select(TableModel).where(TableModel.id == table_id))
        table = result.scalar_one_or_none()
        if not table:
            return False

        await session.delete(table)
        await session.commit()
        return True