from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from config.settings import settings

# Ссылки на asyncpg (PostgreSQL) и aiomysql (MySQL)
DB_URLS = {
    "POSTGRES": f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}",
    "MYSQL": f"mysql+aiomysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
}

# Основная БД проекта (PostgreSQL по умолчанию)
PROJECT_DB_URL = DB_URLS["POSTGRES"]

engine = create_async_engine(PROJECT_DB_URL, echo=settings.DEBUG, future=True)
async_session_factory = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        yield session