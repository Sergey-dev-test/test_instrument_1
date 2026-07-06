# backend/services/method_service.py

import uuid
from pathlib import Path
from fpdf import FPDF
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.method import MethodDocument
from schemas.method import MethodCreate


class MethodService:
    """Сервис управления методиками с сохранением в БД"""

    # Папка для хранения временных PDF
    PDF_TEMP_DIR = Path("tmp/pdf")
    PDF_TEMP_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def create_pdf(cls, method_id: str, title: str, content: str, author: str) -> str:
        """Генерация PDF из текста методики. Имя файла = method_id"""
        pdf_path = cls.PDF_TEMP_DIR / f"{method_id}.pdf"

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Заголовок
        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(0, 10, title, ln=True, align="C")
        pdf.ln(10)

        # Данные
        pdf.set_font("Arial", size=10)
        pdf.cell(0, 8, f"Автор: {author}", ln=True)
        pdf.cell(0, 8, f"Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}", ln=True)
        pdf.ln(10)

        # Содержание (построчно)
        pdf.set_font("Arial", size=11)
        for line in content.split("\n"):
            pdf.multi_cell(0, 6, line)

        # Сохранение
        pdf.output(str(pdf_path))
        return str(pdf_path)

    @classmethod
    async def create_method(
        cls,
        db: AsyncSession,
        table_id: str,
        creator_id: str,
        title: str,
        content: str
    ) -> Dict[str, Any]:
        """Создание новой методики с сохранением в БД"""
        method = MethodDocument(
            table_id=table_id,
            title=title,
            content=content,
            owner=creator_id
        )
        db.add(method)
        await db.commit()
        await db.refresh(method)

        # Генерируем PDF с именем = method.id
        pdf_path = cls.create_pdf(str(method.id), title, content, creator_id)

        return {
            "id": str(method.id),
            "table_id": str(method.table_id) if method.table_id else "",
            "creator_id": creator_id,
            "title": method.title,
            "content": method.content,
            "format": "PDF",
            "created_at": method.created_at.isoformat() if method.created_at else "",
            "updated_at": method.updated_at.isoformat() if method.updated_at else "",
        }

    @classmethod
    async def get_method(cls, db: AsyncSession, method_id: str) -> Optional[Dict[str, Any]]:
        """Получение методики по ID из БД"""
        result = await db.execute(
            select(MethodDocument).where(MethodDocument.id == method_id)
        )
        method = result.scalar_one_or_none()
        if not method:
            return None
        return {
            "id": str(method.id),
            "table_id": str(method.table_id) if method.table_id else "",
            "creator_id": method.owner or "",
            "title": method.title,
            "content": method.content,
            "format": "PDF",
            "created_at": method.created_at.isoformat() if method.created_at else "",
            "updated_at": method.updated_at.isoformat() if method.updated_at else "",
        }

    @classmethod
    async def update_method(
        cls,
        db: AsyncSession,
        method_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None
    ) -> Dict[str, Any]:
        """Обновление методики в БД"""
        result = await db.execute(
            select(MethodDocument).where(MethodDocument.id == method_id)
        )
        method = result.scalar_one_or_none()
        if not method:
            raise ValueError(f"Методика {method_id} не найдена")

        if title:
            method.title = title
        if content:
            method.content = content

        method.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(method)

        return {
            "id": str(method.id),
            "table_id": str(method.table_id) if method.table_id else "",
            "creator_id": method.owner or "",
            "title": method.title,
            "content": method.content,
            "format": "PDF",
            "created_at": method.created_at.isoformat() if method.created_at else "",
            "updated_at": method.updated_at.isoformat() if method.updated_at else "",
        }

    @classmethod
    async def delete_method(cls, db: AsyncSession, method_id: str) -> bool:
        """Удаление методики из БД"""
        result = await db.execute(
            select(MethodDocument).where(MethodDocument.id == method_id)
        )
        method = result.scalar_one_or_none()
        if not method:
            return False
        await db.delete(method)
        await db.commit()
        return True

    @classmethod
    async def list_methods(cls, db: AsyncSession, table_id: Optional[str] = None) -> list:
        """Список методик"""
        query = select(MethodDocument)
        if table_id:
            query = query.where(MethodDocument.table_id == table_id)
        result = await db.execute(query)
        methods = result.scalars().all()
        return [
            {
                "id": str(m.id),
                "table_id": str(m.table_id) if m.table_id else "",
                "title": m.title,
                "content": m.content,
                "format": "PDF",
                "created_at": m.created_at.isoformat() if m.created_at else "",
                "updated_at": m.updated_at.isoformat() if m.updated_at else "",
            }
            for m in methods
        ]


method_service = MethodService()