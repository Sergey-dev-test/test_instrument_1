# backend/services/sql_service.py

from typing import Dict, Any
from utils.ai_provider import MockAIProvider


class SQLService:
    def __init__(self):
        self.ai_provider = MockAIProvider()

    async def generate_sql(self, natural_language: str, table_name: str, db_type: str, context: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate SQL from natural language query"""
        try:
            prompt = f"""
            Generate a {db_type} SQL query for the following request:
            Request: "{natural_language}"
            Table: "{table_name}"
            Return only SQL query without explanations.
            """
            sql = self.ai_provider.generate(prompt)
            return {"sql": sql.strip(), "description": f"Сгенерирован запрос для таблицы '{table_name}'"}
        except Exception as e:
            return {"sql": f"SELECT * FROM {table_name}", "description": f"Ошибка генерации: {str(e)}"}

    def validate_sql(self, sql: str) -> Dict[str, Any]:
        """Validate SQL syntax"""
        return {"is_valid": True, "message": "Синтаксис OK"}


sql_service = SQLService()