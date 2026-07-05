"""
API endpoints для генерации SQL
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
async def generate_sql():
    """Генерация SQL запроса"""
    pass


@router.post("/execute")
async def execute_sql():
    """Выполнение SQL запроса"""
    pass


@router.get("/")
async def get_saved_queries():
    """Получение сохранённых запросов"""
    pass
