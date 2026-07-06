# backend/core/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from core.security import verify_token
from core.enums import Role
from repositories.user_repo import UserRepo


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
):
    """Проверяет JWT-токен и возвращает текущего пользователя"""
    token = credentials.credentials
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен"
        )
    user_id = payload["sub"]
    user = await UserRepo.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден или отключён")
    return user


async def require_role(role: Role):
    """Декоратор для проверки роли (используется в роутах)"""
    async def _role_checker(current_user=Depends(get_current_user)):
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Требуется роль {role}"
            )
        return current_user
    return _role_checker


async def get_current_admin(user=Depends(get_current_user)):
    """Проверка, что текущий пользователь — админ"""
    if user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуется роль администратора"
        )
    return user