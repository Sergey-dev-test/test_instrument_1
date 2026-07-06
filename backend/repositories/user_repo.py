# backend/repositories/user_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user import User as UserModel
from schemas.user import UserCreate
from core.security import hash_password
from core.enums import Role


class UserRepo:
    @staticmethod
    async def get_by_username(session: AsyncSession, username: str) -> UserModel:
        result = await session.execute(select(UserModel).where(UserModel.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(session: AsyncSession, email: str) -> UserModel:
        result = await session.execute(select(UserModel).where(UserModel.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        session: AsyncSession,
        username: str,
        email: str,
        password: str,
    ) -> UserModel:
        # Проверка уникальности username
        existing = await session.execute(
            select(UserModel).where(UserModel.username == username)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Пользователь '{username}' уже существует")

        # Проверка уникальности email
        existing_email = await session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        if existing_email.scalar_one_or_none():
            raise ValueError(f"Email '{email}' уже используется")

        db_user = UserModel(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=Role.USER
        )
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
        return db_user

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id) -> UserModel:
        result = await session.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()
