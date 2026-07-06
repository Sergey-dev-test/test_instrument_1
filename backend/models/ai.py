# backend/models/ai.py

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from config.database import Base


class AIConfiguration(Base):
    """Конфигурация AI-провайдера (для MVP — локальная)"""
    __tablename__ = "ai_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), default="mock")  # mock / openai / custom
    enabled = Column(Boolean, default=False)
    api_key_encrypted = Column(String(500), nullable=True)  # Для внешних API (в будущем)
    model_name = Column(String(100), default="mock-v0.1")
    created_at = Column(DateTime, default=datetime.utcnow)


class AIChatMessage(Base):
    """Сообщение чата пользователь ↔ AI"""
    __tablename__ = "ai_chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)  # Вопрос пользователя
    response = Column(Text, nullable=True)  # Ответ AI
    context = Column(JSONB)  # Контекст (table_name, db_type)
    created_at = Column(DateTime, default=datetime.utcnow)