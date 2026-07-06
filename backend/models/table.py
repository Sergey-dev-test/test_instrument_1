# backend/models/table.py

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from config.database import Base


class Table(Base):
    __tablename__ = "tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("database_connections.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    owner = Column(String(100))
    description = Column(Text)
    row_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Field(Base):
    __tablename__ = "fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), ForeignKey("tables.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    data_type = Column(String(100), nullable=False)  # VARCHAR, INTEGER и т.д.
    is_primary_key = Column(Boolean, default=False)
    is_foreign_key = Column(Boolean, default=False)
    is_nullable = Column(Boolean, default=True)
    default_value = Column(String(255))
    max_length = Column(Integer)
    references_table = Column(String(100))
    references_field = Column(String(100))