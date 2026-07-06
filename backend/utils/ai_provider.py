# backend/utils/ai_provider.py

import os
from abc import ABC, abstractmethod
from typing import Optional


class AIProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Генерация текста по промпту"""
        pass


class MockAIProvider(AIProvider):
    """Mock AI для MVP (без внешних API)"""

    def generate(self, prompt: str) -> str:
        # Простая заглушка — в реальном проекте заменить на OpenAI
        if "SELECT" in prompt.upper():
            return "SELECT * FROM users WHERE status = 'active'"
        elif "INSERT" in prompt.upper():
            return "INSERT INTO logs (message, created_at) VALUES ('Test', NOW())"
        elif "UPDATE" in prompt.upper():
            return "UPDATE users SET role = 'admin' WHERE id = 1"
        else:
            return "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10"


class OpenAIProvider(AIProvider):
    """OpenAI API-провайдер (prod-версия)"""

    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY")
        self.model = os.getenv("AI_MODEL", "gpt-3.5-turbo")
        self.base_url = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("AI_API_KEY not set")

        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "Ты — SQL-эксперт. Генерируй только SQL-запросы без пояснений."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            raise ValueError(f"OpenAI API error: {str(e)}")


def get_ai_provider() -> AIProvider:
    """Фабрика провайдеров"""
    ai_enabled = os.getenv("AI_ENABLED", "false").lower() == "true"
    if ai_enabled:
        return OpenAIProvider()
    else:
        return MockAIProvider()


# Глобальный экземпляр
ai_provider = get_ai_provider()