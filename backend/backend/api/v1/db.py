"""
API endpoints для работы с БД
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/test-connection")
async def test_connection():
    """Тестирование подключения к БД"""
    pass


@router.post("/scan")
async def scan_database():
    """Сканирование структуры БД"""
    pass


@router.get("/tables")
async def get_tables():
    """Получение списка таблиц"""
    pass


@router.get("/tables/{table_id}")
async def get_table_detail(table_id: str):
    """Получение детальной информации о таблице"""
    pass
