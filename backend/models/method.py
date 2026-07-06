# backend/models/method.py

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from config.database import Base


class MethodDocument(Base):
    """Методика ведения таблицы (описание владения, полей, правил)"""
    __tablename__ = "method_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(UUID(as_uuid=True), ForeignKey("tables.id", ondelete="CASCADE"), nullable=True)
    custom_table_id = Column(UUID(as_uuid=True), ForeignKey("custom_tables.id", ondelete="CASCADE"), nullable=True)
    # Обязательно одно из: table_id или custom_table_id

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)  # Описание ведения таблицы
    owner = Column(String(100))  # Ответственный (человек/команда)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Для простоты MVP — поддержка только внешних таблиц (tables.id)
    # В будущем — добавить custom_table_id