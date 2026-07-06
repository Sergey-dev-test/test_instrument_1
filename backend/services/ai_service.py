# backend/services/ai_service.py

from typing import Dict, Any, Optional
from utils.ai_provider import MockAIProvider, get_ai_provider
from models.ai import AIChatMessage


class AIService:
    """Сервис для взаимодействия с AI (на данный момент — MockAI)"""

    def __init__(self):
        self.provider = get_ai_provider()

    async def generate_sql_from_natural_language(
        self,
        natural_query: str,
        context: Dict[str, Any]
    ) -> str:
        """
        Генерация SQL-запроса по запросу пользователя
        context = {"table_name": "users", "db_type": "POSTGRES"}
        """
        table = context.get("table_name", "table")
        prompt = f"Generate SQL for: {natural_query} on table: {table}"
        return self.provider.generate(prompt)

    async def generate_method_document(self, table_name: str, context: Dict[str, Any]) -> str:
        """Генерация методики ведения таблицы"""
        prompt = f"Generate method document for table: {table_name}"
        return self.provider.generate(prompt)

    async def chat_with_user(
        self,
        user_message: str,
        conversation_history: list = None
    ) -> str:
        """Имитация чата с AI (для MVP — вызывает MockAI, в будущем — логирование истории)"""
        return self.provider.generate(user_message)


ai_service = AIService()