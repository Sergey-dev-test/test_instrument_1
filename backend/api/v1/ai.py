# backend/api/v1/ai.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from services.ai_service import ai_service
from core.dependencies import get_current_user
from config.settings import settings

router = APIRouter()


class AIRequest(BaseModel):
    message: str
    context: Optional[Dict] = None


@router.post("/chat")
async def chat_with_ai(
    request: AIRequest,
    user=Depends(get_current_user)
):
    if not settings.AI_ENABLED:
        raise HTTPException(status_code=503, detail="AI отключён в настройках")
    
    try:
        response = await ai_service.chat_with_user(
            user_message=request.message,
            conversation_history=[]
        )
        return {
            "content": response,
            "metadata": {"model": "MockAI-v0.1"}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка ИИ-обработки: {str(e)}")


# Другие эндпоинты (анализ, генерация методики) аналогично