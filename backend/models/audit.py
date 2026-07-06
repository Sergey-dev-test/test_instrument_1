# backend/models/audit.py

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from enum import Enum
from config.database import Base


class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    EXPORT = "EXPORT"
    ERROR = "ERROR"


class AuditLog(Base):
    """Лог аудита действий пользователей и системы"""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # system users may have no user_id
    action = Column(SAEnum(AuditAction, name="audit_actions"), nullable=False)
    entity_type = Column(String(50))  # 'table', 'user', 'sql', 'method'
    entity_id = Column(UUID(as_uuid=True))
    details = Column(JSONB)  # Дополнительная информация (изменения, IP, User-Agent)
    ip_address = Column(String(45))  # IPv4/IPv6
    created_at = Column(DateTime, default=datetime.utcnow)