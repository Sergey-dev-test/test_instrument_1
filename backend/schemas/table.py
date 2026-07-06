# backend/schemas/table.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TableBase(BaseModel):
    name: str
    description: Optional[str] = None


class TableCreate(TableBase):
    connection_id: str


class TableUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TableInDB(BaseModel):
    id: str
    connection_id: str
    name: str
    description: Optional[str] = None
    row_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class FieldInDB(BaseModel):
    id: str
    table_id: str
    name: str
    data_type: str
    is_primary_key: bool
    is_nullable: bool
    default_value: Optional[str] = None
    max_length: Optional[int] = None

    class Config:
        from_attributes = True