"""
API endpoints для загрузки Excel
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/upload")
async def upload_excel():
    """Загрузка Excel файла"""
    pass


@router.post("/validate")
async def validate_excel():
    """Валидация данных из Excel"""
    pass


@router.post("/import")
async def import_excel():
    """Импорт данных из Excel"""
    pass
