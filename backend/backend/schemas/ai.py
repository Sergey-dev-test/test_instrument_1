"""
Pydantic схемы для ИИ-агента
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None
    config_id: Optional[str] = None


class AIChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class AIChatResponse(BaseModel):
    id: str
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class AIAnalysisRequest(BaseModel):
    table_id: str
    analysis_type: str = Field(default="optimization")
    focus_areas: Optional[List[str]] = None


class AISuggestion(BaseModel):
    priority: str
    type: str
    description: str
    sql: Optional[str] = None


class AIAnalysisResponse(BaseModel):
    table_id: str
    table_name: str
    analysis: Dict[str, Any]
    analyzed_at: datetime


class AISQLRequest(BaseModel):
    request: str
    table_id: str
    dialect: str = Field(default="postgresql")


class AISQLResponse(BaseModel):
    sql: str
    explanation: str
    preview: Optional[Dict[str, Any]] = None
    generated_at: datetime


class AIConfigCreate(BaseModel):
    name: str
    api_url: str
    api_key: str
    auth_type: str = Field(default="API_KEY", pattern="^(NONE|API_KEY|OAUTH)$")
    model: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0, le=2)


class AIConfigResponse(BaseModel):
    id: str
    name: str
    api_url: str
    auth_type: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
