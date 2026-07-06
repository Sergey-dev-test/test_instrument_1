# backend/schemas/sql.py

from pydantic import BaseModel
from typing import Optional


class SQLGenerateRequest(BaseModel):
    natural_language: str
    table_name: str
    db_type: str = "POSTGRES"


class SQLGenerateResponse(BaseModel):
    sql: str
    description: str


class SQLValidateRequest(BaseModel):
    natural_language: str
    table_name: str
    db_type: str = "POSTGRES"


class SQLValidateResponse(BaseModel):
    is_valid: bool
    message: Optional[str] = None


class SQLRequest(BaseModel):
    natural_language: str
    table_name: str
    db_type: str
    connection_id: str


class SQLResponse(BaseModel):
    sql: str