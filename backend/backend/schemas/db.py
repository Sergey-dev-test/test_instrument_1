"""
Pydantic схемы для работы с БД
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DBConnectionCreate(BaseModel):
    name: str
    db_type: str = Field(..., pattern="^(POSTGRES|MYSQL|SQLITE|SQLSERVER)$")
    host: str
    port: int
    database_name: str
    username: str
    password: str


class DBConnectionTest(BaseModel):
    db_type: str
    host: str
    port: int
    database_name: str
    username: str
    password: str


class TableInfo(BaseModel):
    id: str
    name: str
    owner: Optional[str] = None
    description: Optional[str] = None
    row_count: int
    field_count: int
    is_custom: bool


class FieldInfo(BaseModel):
    id: str
    name: str
    data_type: str
    is_primary_key: bool
    is_foreign_key: bool
    is_nullable: bool


class TableDetail(BaseModel):
    info: TableInfo
    fields: List[FieldInfo]
    relationships: List[dict] = []


class ConnectionStatus(BaseModel):
    is_connected: bool
    database_name: Optional[str] = None
    table_count: int = 0
    error_message: Optional[str] = None
