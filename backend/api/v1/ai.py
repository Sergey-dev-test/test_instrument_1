# backend/api/v1/ai.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from services.ai_service import ai_service
from core.dependencies import get_current_user
from config.settings import settings
from utils.logger import setup_logger

logger = setup_logger("instrument.api.ai")

router = APIRouter()


class AIRequest(BaseModel):
    message: str
    context: Optional[Dict] = None


@router.post("/chat")
async def chat_with_ai(
    request: AIRequest,
    user=Depends(get_current_user)
):
    """Чат с AI-ассистентом."""
    if not settings.AI_ENABLED:
        logger.warning(f"AI отключён. Запрос от пользователя {user.id}")
        raise HTTPException(status_code=503, detail="AI отключён в настройках")
    
    logger.info(f"Пользователь {user.id} задаёт вопрос AI: {request.message[:50]}...")
    try:
        response = await ai_service.chat_with_user(
            user_message=request.message,
            conversation_history=[]
        )
        logger.info("AI-ответ сгенерирован успешно")
        return {
            "content": response,
            "metadata": {"model": "MockAI-v0.1"}
        }
    except Exception as e:
        logger.error(f"Ошибка AI-обработки: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка ИИ-обработки: {str(e)}")


# Другие эндпоинты (анализ, генерация методики) аналогично