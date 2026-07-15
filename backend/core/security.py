# backend/core/security.py

from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from cryptography.fernet import Fernet

from config.settings import settings
from core.enums import Role  # вынесено в отдельный модуль для избежания circular import
from utils.logger import setup_logger

logger = setup_logger("instrument.security")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Ключ шифрования паролей БД — загружаем из env, генерируем только при отсутствии
_fernet_key = settings.FERNET_KEY
if not _fernet_key:
    _fernet_key = os.getenv("FERNET_KEY")
if not _fernet_key:
    import warnings
    _fernet_key = Fernet.generate_key().decode()
    warnings.warn(
        "FERNET_KEY not set in .env! Passwords will be lost on restart. "
        "Set FERNET_KEY=<base64-key> in backend/.env",
        RuntimeWarning
    )

_fernet_key = _fernet_key.encode() if isinstance(_fernet_key, str) else _fernet_key
fernet = Fernet(_fernet_key)


def hash_password(password: str) -> str:
    hashed = pwd_context.hash(password)
    logger.debug("Пароль захэширован")
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    result = pwd_context.verify(plain_password, hashed_password)
    logger.debug(f"Проверка пароля: {result}")
    return result


def encrypt_db_password(password: str) -> str:
    encrypted = fernet.encrypt(password.encode()).decode()
    logger.debug("Пароль БД зашифрован")
    return encrypted


def decrypt_db_password(encrypted_password: str) -> str:
    decrypted = fernet.decrypt(encrypted_password.encode()).decode()
    logger.debug("Пароль БД расшифрован")
    return decrypted


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    logger.debug(f"Access-токен создан для {data.get('sub', 'unknown')}")
    return token


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    logger.debug(f"Refresh-токен создан для {data.get('sub', 'unknown')}")
    return token


def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if expected_type and payload.get("type") != expected_type:
            logger.warning(f"Неверный тип токена. Ожидался: {expected_type}")
            return None
        logger.debug(f"Токен верифицирован: {payload.get('sub', 'unknown')}")
        return payload
    except JWTError as e:
        logger.warning(f"Ошибка верификации токена: {e}")
        return None
