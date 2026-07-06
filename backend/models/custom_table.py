# backend/models/custom_table.py

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSON
import uuid
from datetime import datetime
from config.database import Base


class CustomTable(Base):
    """Пользовательская таблица (создана через UI, не привязана к внешней БД)"""
    __tablename__ = "custom_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    owner_id = Column(UUID(as_uuid=True), nullable=False)  # FK to users.id
    created_at = Column(DateTime, default=datetime.utcnow)


class CustomField(Base):
    """Поле пользовательской таблицы"""
    __tablename__ = "custom_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), ForeignKey("custom_tables.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    data_type = Column(String(50), nullable=False)  # VARCHAR, INTEGER, etc.
    is_primary_key = Column(Boolean, default=False)
    is_nullable = Column(Boolean, default=True)
    default_value = Column(String(255))
    max_length = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class Record(Base):
    """Запись в пользовательской таблице (в JSON-формате, т.к. структура меняется)"""
    __tablename__ = "custom_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), ForeignKey("custom_tables.id", ondelete="CASCADE"), nullable=False)
    data_json = Column(JSON, nullable=False)  # {"field1": "value", "field2": 123}
    created_at = Column(DateTime, default=datetime.utcnow)