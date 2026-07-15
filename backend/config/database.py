from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from config.settings import settings
from utils.logger import setup_logger

# Настройка логгера
logger = setup_logger("instrument.database")

# Ссылки на asyncpg (PostgreSQL) и aiomysql (MySQL)
DB_URLS = {
    "POSTGRES": f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}",
    "MYSQL": f"mysql+aiomysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
}

# Основная БД проекта (PostgreSQL по умолчанию)
PROJECT_DB_URL = DB_URLS["POSTGRES"]

logger.info(f"Инициализация БД: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
logger.info(f"Драйвер: asyncpg (PostgreSQL)")

engine = create_async_engine(PROJECT_DB_URL, echo=settings.DEBUG, future=True)
async_session_factory = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    """Получение сессии БД с логированием."""
    logger.debug("Открытие сессии БД")
    async with async_session_factory() as session:
        try:
            yield session
            logger.debug("Сессия БД успешно закрыта")
        except Exception as e:
            logger.error(f"Ошибка сессии БД: {e}")
            await session.rollback()
            raise