# src/backend/schemas/method.py

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class MethodFormat(str, Enum):
    TXT = "TXT"
    PDF = "PDF"


class MethodBase(BaseModel):
    title: str
    content: str


class MethodCreate(MethodBase):
    table_id: Optional[str] = None


class MethodUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class Method(MethodBase):
    id: str
    table_id: Optional[str] = ""
    creator_id: str
    format: MethodFormat
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True