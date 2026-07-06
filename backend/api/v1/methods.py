# backend/api/v1/methods.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from config.database import get_db
from services.method_service import method_service
from schemas.method import MethodCreate, Method, MethodUpdate

router = APIRouter()

@router.post("/", response_model=Method)
async def create_method(
    method: MethodCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        result = await method_service.create_method(
            db=db,
            table_id=method.table_id,
            creator_id=str(user.id),
            title=method.title,
            content=method.content
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list)
async def list_methods(
    table_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    methods = await method_service.list_methods(db, table_id)
    return methods

@router.get("/{method_id}", response_model=Method)
async def get_method(
    method_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    method = await method_service.get_method(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Методика не найдена")
    return method

@router.post("/{method_id}/export/pdf")
async def export_method(
    method_id: str,
    user=Depends(get_current_user)
):
    try:
        from fastapi.responses import FileResponse
        import os
        pdf_path = f"tmp/pdf/{method_id}.pdf"
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF файл не найден")
        return FileResponse(pdf_path, filename="method.pdf")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{method_id}", response_model=Method)
async def update_method(
    method_id: str,
    method_update: MethodUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Обновление методики"""
    try:
        result = await method_service.update_method(
            db=db,
            method_id=method_id,
            title=method_update.title,
            content=method_update.content
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{method_id}")
async def delete_method(
    method_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Удаление методики"""
    deleted = await method_service.delete_method(db, method_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Методика не найдена")
    return {"message": "Методика удалена"}