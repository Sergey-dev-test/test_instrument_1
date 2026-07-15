# backend/repositories/user_repo.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user import User
from schemas.user import UserCreate
from core.security import hash_password
from utils.logger import setup_logger

logger = setup_logger("instrument.repo.user")
from core.enums import Role


class UserRepo:
    @staticmethod
    async def get_by_username(session: AsyncSession, username: str) -> User:
        logger.debug(f"Поиск пользователя по имени: {username}")
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if user:
            logger.debug(f"Пользователь найден: {username}")
        else:
            logger.debug(f"Пользователь не найден: {username}")
        return user

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: str) -> User:
        logger.debug(f"Поиск пользователя по ID: {user_id}")
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            logger.debug(f"Пользователь найден: {user_id}")
        return user

    @staticmethod
    async def create(session: AsyncSession, user_data: UserCreate) -> User:
        logger.info(f"Создание пользователя: {user_data.username}")
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hash_password(user_data.password)
        )
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
        logger.info(f"Пользователь создан: {db_user.id}")
        return db_user
