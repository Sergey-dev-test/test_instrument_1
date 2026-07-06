# backend/core/security.py

from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.fernet import Fernet

from config.settings import settings
from core.enums import Role  # вынесено в отдельный модуль для избежания circular import

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Ключ шифрования паролей БД — загружаем из env, генерируем только при отсутствии
_fernet_key = settings.FERNET_KEY
if not _fernet_key:
    import os
    _fernet_key = os.getenv("FERNET_KEY")
if not _fernet_key:
    # Dev-режим: генерируем ключ и предупреждаем
    import warnings
    warnings.warn(
        "FERNET_KEY not set in .env! Passwords will be lost on restart. "
        "Set FERNET_KEY=<base64-key> in backend/.env",
        RuntimeWarning
    )
    _fernet_key = Fernet.generate_key().decode()

fernet = Fernet(_fernet_key.encode() if isinstance(_fernet_key, str) else _fernet_key)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def encrypt_db_password(password: str) -> str:
    return fernet.encrypt(password.encode()).decode()


def decrypt_db_password(encrypted_password: str) -> str:
    return fernet.decrypt(encrypted_password.encode()).decode()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    return create_access_token(data, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
