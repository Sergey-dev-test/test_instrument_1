# backend/api/v1/methods.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from config.database import get_db
from services.method_service import method_service
from schemas.method import MethodCreate, Method, MethodUpdate
from utils.logger import setup_logger

logger = setup_logger("instrument.api.methods")

router = APIRouter()

@router.post("/", response_model=Method)
async def create_method(
    method: MethodCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Создание новой методики."""
    logger.info(f"Пользователь {user.id} создаёт методику: {method.title}")
    try:
        result = await method_service.create_method(
            db=db,
            table_id=method.table_id,
            creator_id=str(user.id),
            title=method.title,
            content=method.content
        )
        logger.info(f"Методика создана: {result['id']}")
        return result
    except Exception as e:
        logger.error(f"Ошибка создания методики: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list)
async def list_methods(
    table_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Список методик."""
    logger.debug(f"Пользователь {user.id} запрашивает список методик (table_id={table_id})")
    methods = await method_service.list_methods(db, table_id)
    logger.info(f"Найдено {len(methods)} методик")
    return methods


@router.get("/{method_id}", response_model=Method)
async def get_method(
    method_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Получение методики по ID."""
    logger.debug(f"Пользователь {user.id} запрашивает методику {method_id}")
    method = await method_service.get_method(db, method_id)
    if not method:
        logger.warning(f"Методика не найдена: {method_id}")
        raise HTTPException(status_code=404, detail="Методика не найдена")
    return method


@router.post("/{method_id}/export/pdf")
async def export_method(
    method_id: str,
    user=Depends(get_current_user)
):
    """Экспорт методики в PDF."""
    logger.info(f"Пользователь {user.id} экспортирует методику {method_id} в PDF")
    try:
        from fastapi.responses import FileResponse
        import os
        pdf_path = f"tmp/pdf/{method_id}.pdf"
        if not os.path.exists(pdf_path):
            logger.warning(f"PDF файл не найден: {pdf_path}")
            raise HTTPException(status_code=404, detail="PDF файл не найден")
        logger.info(f"PDF файл отправлен: {pdf_path}")
        return FileResponse(pdf_path, filename="method.pdf")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка экспорта PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{method_id}", response_model=Method)
async def update_method(
    method_id: str,
    method_update: MethodUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Обновление методики."""
    logger.info(f"Пользователь {user.id} обновляет методику {method_id}")
    try:
        result = await method_service.update_method(
            db=db,
            method_id=method_id,
            title=method_update.title,
            content=method_update.content
        )
        logger.info(f"Методика {method_id} успешно обновлена")
        return result
    except ValueError as e:
        logger.warning(f"Методика не найдена: {method_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Ошибка обновления методики: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{method_id}")
async def delete_method(
    method_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Удаление методики."""
    logger.info(f"Пользователь {user.id} удаляет методику {method_id}")
    deleted = await method_service.delete_method(db, method_id)
    if not deleted:
        logger.warning(f"Методика не найдена для удаления: {method_id}")
        raise HTTPException(status_code=404, detail="Методика не найдена")
    logger.info(f"Методика {method_id} успешно удалена")
    return {"message": "Методика удалена"}