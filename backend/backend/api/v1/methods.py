"""
API endpoints для генерации методик
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
async def generate_method():
    """Генерация методики ведения таблицы"""
    pass


@router.get("/{table_id}")
async def get_method(table_id: str):
    """Получение методики"""
    pass


@router.post("/{table_id}/export")
async def export_method(table_id: str):
    """Экспорт методики"""
    pass
