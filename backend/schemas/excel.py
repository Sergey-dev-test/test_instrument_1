# backend/schemas/excel.py

from pydantic import BaseModel
from typing import Optional, List


class ValidationField(BaseModel):
    name: str
    data_type: str
    is_nullable: bool
    is_primary_key: bool
    max_length: Optional[int] = None


class ExcelUpload(BaseModel):
    table_name: str
    row_count: int
    fields: List[ValidationField]
    errors: List[str]
    warnings: List[str]


class ExcelConfirm(BaseModel):
    table_name: str
    fields: List[ValidationField]
    row_count: int
    created_by: str