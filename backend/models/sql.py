# backend/models/sql.py

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from config.database import Base


class SQLQuery(Base):
    """Сохранённый SQL-запрос (пользовательский или системный)"""
    __tablename__ = "sql_queries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    sql_text = Column(Text, nullable=False)  # Содержимое SQL
    connection_id = Column(UUID(as_uuid=True), ForeignKey("database_connections.id", ondelete="SET NULL"))
    created_by = Column(UUID(as_uuid=True), nullable=False)  # FK to users.id
    created_at = Column(DateTime, default=datetime.utcnow)
    last_executed = Column(DateTime)
    is_public = Column(Boolean, default=False)