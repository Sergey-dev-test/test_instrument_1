"""
API endpoints для работы с таблицами
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def create_table():
    """Создание новой таблицы"""
    pass


@router.get("/")
async def get_tables():
    """Получение списка таблиц"""
    pass


@router.get("/{table_id}")
async def get_table(table_id: str):
    """Получение информации о таблице"""
    pass


@router.post("/{table_id}/fields")
async def add_field(table_id: str):
    """Добавление поля в таблицу"""
    pass


@router.delete("/{table_id}")
async def delete_table(table_id: str):
    """Удаление таблицы"""
    pass
