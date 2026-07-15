# backend/api/v1/excel.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pathlib import Path
import uuid
from services.excel_service import ExcelService
from core.dependencies import get_current_user
from schemas.excel import ExcelConfirm
from utils.logger import setup_logger

logger = setup_logger("instrument.api.excel")

router = APIRouter()


@router.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Загрузка и валидация Excel-файла."""
    logger.info(f"Пользователь {user.id} загружает файл: {file.filename}")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        logger.warning(f"Неподдерживаемый формат файла: {file.filename}")
        raise HTTPException(status_code=400, detail="Только .xlsx и .xls файлы")
    
    # Сохранение файла
    file_path = f"tmp/{uuid.uuid4()}.xlsx"
    Path("tmp").mkdir(exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    logger.info(f"Файл сохранён: {file_path}")
    
    # Парсинг и валидация
    result = ExcelService.parse_excel(file_path)
    
    # Очистка
    Path(file_path).unlink(missing_ok=True)
    logger.info(f"Файл удалён: {file_path}")
    
    if result.get("errors"):
        logger.error(f"Ошибки валидации файла {file.filename}: {result['errors']}")
        raise HTTPException(status_code=400, detail=result["errors"])
    
    logger.info(
        f"Файл валиден: {file.filename}, "
        f"таблица: {result['table_name']}, "
        f"строк: {result['row_count']}, "
        f"полей: {len(result['fields'])}"
    )
    
    return {
        "message": "Файл валиден",
        "filename": file.filename,
        "table_name": result["table_name"],
        "row_count": result["row_count"],
        "fields": result["fields"],
        "errors": result.get("errors", []),
        "warnings": result.get("warnings", [])
    }


@router.post("/parse")
async def parse_excel(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Парсинг Excel-файла и валидация структуры"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Только .xlsx и .xls файлы")
    
    file_path = f"tmp/{uuid.uuid4()}.xlsx"
    Path("tmp").mkdir(exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    result = ExcelService.parse_excel(file_path)
    Path(file_path).unlink(missing_ok=True)
    
    return {
        "table_name": result["table_name"],
        "row_count": result["row_count"],
        "fields": result["fields"],
        "errors": result.get("errors", []),
        "warnings": result.get("warnings", [])
    }


@router.post("/confirm")
async def confirm_excel(
    data: ExcelConfirm,
    user=Depends(get_current_user)
):
    """Подтверждение создания таблицы из Excel-данных"""
    # В MVP — просто возвращаем подтверждение
    # В продакшене здесь создаётся CustomTable + CustomField записи
    return {
        "message": "Таблица успешно создана",
        "table_name": data.table_name,
        "fields_count": len(data.fields),
        "row_count": data.row_count
    }