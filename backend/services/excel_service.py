# src/backend/services/excel_service.py

import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
from schemas.excel import ValidationField


class ExcelService:
    @staticmethod
    def parse_excel(file_path: str) -> Dict[str, Any]:
        """Parse Excel file and validate structure"""
        try:
            df = pd.read_excel(file_path)
            fields = []

            for col in df.columns:
                # Определяем тип данных по первым 100 непустым значениям
                sample = df[col].dropna().head(100)
                data_type = "TEXT"
                if len(sample) > 0:
                    if sample.apply(lambda x: pd.to_datetime(x, errors='coerce').notna()).all():
                        data_type = "DATE"
                    elif sample.apply(lambda x: pd.to_numeric(x, errors='coerce').notna()).all():
                        if sample.apply(lambda x: float(x).is_integer() if pd.notna(x) else True).all():
                            data_type = "INTEGER"
                        else:
                            data_type = "FLOAT"
                    elif sample.apply(lambda x: isinstance(x, (int, float))).all():
                        if sample.apply(lambda x: float(x).is_integer() if pd.notna(x) else True).all():
                            data_type = "INTEGER"
                        else:
                            data_type = "FLOAT"

                is_primary_key = col.lower() in ["id", "pk", "primary_key"]
                fields.append(ValidationField(
                    name=col,
                    data_type=data_type,
                    is_nullable=not df[col].isna().all(),
                    is_primary_key=is_primary_key,
                    max_length=df[col].astype(str).str.len().max() if data_type == "TEXT" else None
                ))

            return {
                "table_name": df.columns[0] if len(df.columns) > 0 else "table",
                "row_count": len(df),
                "fields": [f.model_dump() for f in fields],
                "errors": [],
                "warnings": []
            }
        except Exception as e:
            return {
                "table_name": "unknown",
                "row_count": 0,
                "fields": [],
                "errors": [str(e)],
                "warnings": []
            }

    @staticmethod
    def validate_data(df: pd.DataFrame, fields: List[ValidationField]) -> tuple:
        """Validate data in DataFrame"""
        errors = []
        warnings = []

        for field in fields:
            if field.is_primary_key and field.name not in df.columns:
                errors.append(f"Primary key field '{field.name}' not found")
            elif field.name in df.columns:
                if df[field.name].isna().any() and not field.is_nullable:
                    warnings.append(f"Field '{field.name}' contains NULL values but is NOT NULL")

        return errors, warnings


excel_service = ExcelService()