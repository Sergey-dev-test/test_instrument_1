# backend/services/db_service.py

import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from typing import List, Dict, Any, Optional
from schemas.types import DBType
from utils.logger import setup_logger

logger = setup_logger("instrument.services.db")


class DBService:
    @staticmethod
    def get_connection_string(connection: dict) -> str:
        """Build database connection string"""
        db_type = connection['db_type']
        if db_type == DBType.POSTGRES:
            return f"postgresql+asyncpg://{connection['username']}:{connection['password']}@{connection['host']}:{connection['port']}/{connection['database_name']}"
        elif db_type == DBType.MYSQL:
            return f"mysql+aiomysql://{connection['username']}:{connection['password']}@{connection['host']}:{connection['port']}/{connection['database_name']}"
        else:
            raise ValueError(f"Unsupported DB type: {db_type}")

    @staticmethod
    async def test_connection(connection: dict) -> bool:
        """Test database connection"""
        try:
            engine_test = create_async_engine(DBService.get_connection_string(connection))
            async with engine_test.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await engine_test.dispose()
            return True
        except Exception:
            return False

    @staticmethod
    async def get_tables(connection: dict) -> List[Dict[str, Any]]:
        """Get list of tables from database (async)"""
        tables = []
        engine = create_async_engine(DBService.get_connection_string(connection))

        async with engine.connect() as conn:
            if connection['db_type'] == DBType.POSTGRES or str(connection['db_type']) == "POSTGRES":
                result = await conn.execute(text("""
                    SELECT
                        t.table_name,
                        obj_description((t.table_schema || '.' || t.table_name)::regclass) as description,
                        c.reltuples::bigint as row_count
                    FROM information_schema.tables t
                    JOIN pg_class c ON c.relname = t.table_name
                    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
                    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
                """))
            elif connection['db_type'] == DBType.MYSQL or str(connection['db_type']) == "MYSQL":
                result = await conn.execute(text("""
                    SELECT 
                        table_name,
                        table_comment as description,
                        table_rows as row_count
                    FROM information_schema.tables
                    WHERE table_schema = :db_name
                """), {"db_name": connection['database_name']})

            for row in result:
                tables.append({
                    'name': row[0],
                    'description': row[1],
                    'row_count': row[2] or 0
                })
        await engine.dispose()
        return tables

    @staticmethod
    async def get_fields(connection: dict, table_name: str) -> List[Dict[str, Any]]:
        """Get list of fields for a table (async)"""
        fields = []
        engine = create_async_engine(DBService.get_connection_string(connection))

        async with engine.connect() as conn:
            if connection['db_type'] == DBType.POSTGRES or str(connection['db_type']) == "POSTGRES":
                result = await conn.execute(text("""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        (
                            SELECT count(*) 
                            FROM information_schema.table_constraints tc 
                            JOIN information_schema.constraint_column_usage ccu 
                            ON tc.constraint_name = ccu.constraint_name 
                            WHERE tc.table_name = :table_name AND ccu.column_name = column_name AND tc.constraint_type = 'PRIMARY KEY'
                        ) as is_primary_key
                    FROM information_schema.columns
                    WHERE table_name = :table_name
                """), {"table_name": table_name})
            elif connection['db_type'] == DBType.MYSQL or str(connection['db_type']) == "MYSQL":
                result = await conn.execute(text("""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        (
                            SELECT count(*) 
                            FROM information_schema.key_column_usage 
                            WHERE table_name = :table_name AND column_name = column_name AND constraint_name = 'PRIMARY'
                        ) as is_primary_key
                    FROM information_schema.columns
                    WHERE table_name = :table_name
                """), {"table_name": table_name})

            for row in result:
                fields.append({
                    'name': row[0],
                    'data_type': row[1],
                    'is_nullable': row[2].upper() == 'YES' if isinstance(row[2], str) else bool(row[2]),
                    'default_value': row[3],
                    'is_primary_key': row[4] > 0
                })
        await engine.dispose()
        return fields

    @staticmethod
    async def sync_structure(
        db_session: AsyncSession,
        connection_id: str,
        user_id: str,
        db_type: str,
        host: str,
        port: int,
        db_name: str,
        username: str,
        password_encrypted: str
    ) -> dict:
        """Sync table structure from external database"""
        from core.security import decrypt_db_password
        from repositories.table_repo import TableRepo
        from models.table import Table, Field
        from models.connection import DatabaseConnection
        from sqlalchemy import select as sa_select

        # Decrypt password
        password = decrypt_db_password(password_encrypted) if password_encrypted else ""

        connection = {
            'db_type': db_type,
            'host': host,
            'port': port,
            'database_name': db_name,
            'username': username,
            'password': password
        }

        logger.info(
            f"Подключение к БД: {db_type}://{host}:{port}/{db_name} "
            f"(user: {username})"
        )

        # Get tables
        logger.info("Запрос списка таблиц из внешней БД...")
        tables_data = await DBService.get_tables(connection)
        logger.info(f"Найдено {len(tables_data)} таблиц")
        
        # Get existing tables
        result = await db_session.execute(
            sa_select(Table).where(Table.connection_id == connection_id)
        )
        existing_tables = {t.name: t for t in result.scalars().all()}

        synced = 0
        for table_data in tables_data:
            table_name = table_data['name']
            logger.debug(f"Обработка таблицы: {table_name}")
            
            if table_name in existing_tables:
                table = existing_tables[table_name]
                table.row_count = table_data['row_count']
                logger.debug(f"Таблица {table_name} обновлена (row_count={table_data['row_count']})")
            else:
                from schemas.table import TableCreate
                table = Table(
                    connection_id=connection_id,
                    name=table_name,
                    description=table_data.get('description'),
                    row_count=table_data['row_count']
                )
                db_session.add(table)
                await db_session.flush()
                logger.debug(f"Таблица {table_name} создана")
            
            # Get and sync fields
            logger.debug(f"Запрос полей для таблицы: {table_name}")
            fields_data = await DBService.get_fields(connection, table_name)
            logger.debug(f"Найдено {len(fields_data)} полей для {table_name}")
            
            result = await db_session.execute(
                sa_select(Field).where(Field.table_id == table.id)
            )
            existing_fields = {f.name: f for f in result.scalars().all()}

            for field_data in fields_data:
                field_name = field_data['name']
                if field_name in existing_fields:
                    field = existing_fields[field_name]
                    field.data_type = field_data['data_type']
                    field.is_nullable = field_data['is_nullable']
                    field.is_primary_key = field_data['is_primary_key']
                    logger.debug(f"  Поле {field_name} обновлено")
                else:
                    from models.table import Field as FieldModel
                    field = FieldModel(
                        table_id=table.id,
                        name=field_name,
                        data_type=field_data['data_type'],
                        is_nullable=field_data['is_nullable'],
                        is_primary_key=field_data['is_primary_key']
                    )
                    db_session.add(field)
                    logger.debug(f"  Поле {field_name} создано")
            
            synced += 1

        await db_session.commit()
        logger.info(f"Синхронизация завершена: {synced} таблиц обновлено")
        return {"message": f"Синхронизировано {synced} таблиц"}


db_service = DBService()