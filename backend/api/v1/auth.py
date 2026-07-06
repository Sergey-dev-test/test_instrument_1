# backend/api/v1/auth.py

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import timedelta

from core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    verify_token
)
from schemas.user import UserCreate, UserLogin, TokenResponse
from repositories.user_repo import UserRepo
from config.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class TokenRefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=dict)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация нового пользователя"""
    user = await UserRepo.get_by_username(db, user_data.username)
    if user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")
    user = await UserRepo.create(
        db,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password
    )
    return {"message": "Пользователь создан", "user_id": str(user.id)}


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Аутентификация пользователя"""
    user = await UserRepo.get_by_username(db, user_data.username)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    
    access_token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
    })
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: TokenRefreshRequest
):
    """Обновление access-токена через refresh"""
    payload = verify_token(data.refresh_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Недействительный refresh-токен")
    
    new_access = create_access_token({"sub": payload["sub"]})
    new_refresh = create_refresh_token({"sub": payload["sub"]})
    
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout():
    """Мок эндпоинт — в MVP токены не валидируются на сервере (используется только JWT-срок действия)"""
    return {"message": "Выход выполнен (в production здесь — удаление refresh-токена из кэша)"}