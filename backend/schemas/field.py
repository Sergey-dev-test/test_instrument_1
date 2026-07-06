# src/backend/schemas/field.py

from pydantic import BaseModel
from typing import Optional


class FieldBase(BaseModel):
    name: str
    data_type: str
    is_primary_key: bool = False
    is_foreign_key: bool = False
    is_nullable: bool = True
    default_value: Optional[str] = None
    max_length: Optional[int] = None
    references_table: Optional[str] = None
    references_field: Optional[str] = None


class FieldCreate(FieldBase):
    table_id: str


class Field(FieldBase):
    id: str

    class Config:
        from_attributes = True