# backend/schemas/connection.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .types import DBType


class ConnectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    db_type: DBType
    host: str = Field(..., min_length=1)
    port: int = Field(..., ge=1, le=65535)
    database_name: str = Field(..., min_length=1)
    username: Optional[str] = None


class ConnectionCreate(ConnectionBase):
    password: str = Field(..., min_length=1)


# Алиас для обратной совместимости
DatabaseConnectionCreate = ConnectionCreate


class ConnectionUpdate(BaseModel):
    name: Optional[str] = None
    db_type: Optional[DBType] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class Connection(ConnectionBase):
    id: str
    user_id: str
    is_default: bool
    created_at: datetime
    last_connected: Optional[datetime] = None

    model_config = {"from_attributes": True}

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        data.pop("password_encrypted", None)
        return data