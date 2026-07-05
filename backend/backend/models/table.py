"""
Модель таблицы
"""
from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from backend.config.database import Base
import uuid


class Table(Base):
    __tablename__ = "tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(100), nullable=False)
    owner = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    row_count = Column(Integer, default=0)
    is_custom = Column(Boolean, default=False)  # True если создана пользователем


class Field(Base):
    __tablename__ = "fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(100), nullable=False)
    data_type = Column(String(50), nullable=False)
    is_primary_key = Column(Boolean, default=False)
    is_foreign_key = Column(Boolean, default=False)
    is_nullable = Column(Boolean, default=True)
    default_value = Column(String(255), nullable=True)
    max_length = Column(Integer, nullable=True)
    references_table = Column(String(100), nullable=True)
    references_field = Column(String(100), nullable=True)


class CustomTable(Base):
    __tablename__ = "custom_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_id = Column(UUID(as_uuid=True), nullable=False)
    creator_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)


class CustomField(Base):
    __tablename__ = "custom_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(100), nullable=False)
    data_type = Column(String(50), nullable=False)
    is_required = Column(Boolean, default=False)
    default_value = Column(String(255), nullable=True)


class Record(Base):
    __tablename__ = "records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), nullable=False)
    data = Column(JSON, nullable=False)  # JSON для гибкости
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
