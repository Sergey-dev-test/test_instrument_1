# backend/api/v1/__init__.py

from .auth import router as auth_router
from .db import router as db_router
from .tables import router as tables_router
from .excel import router as excel_router
from .sql import router as sql_router
from .methods import router as methods_router
from .ai import router as ai_router

__all__ = [
    "auth_router",
    "db_router",
    "tables_router",
    "excel_router",
    "sql_router",
    "methods_router",
    "ai_router",
]