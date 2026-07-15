# 📋 План разработки и тестирования Instrument_v3

**Версия документа:** 1.0  
**Дата:** 2026-07-15  
**Текущая версия MVP:** v0.4.0

---

## 📊 Текущее состояние

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Backend (FastAPI) | ✅ Код готов | 12+ файлов с логированием |
| Frontend (React+TS) | ✅ Код готов | Tailwind подключён, сборка проходит |
| PostgreSQL | ❌ Не запущен | Требуется для работы |
| Redis | ⚠️ Опционально | Для Celery (MVP не критично) |
| Docker | ⚠️ Конфиги есть | Не используется для локальной разработки |
| Тесты | ❌ Отсутствуют | pytest / vitest не настроены |
| Миграции БД | ❌ Отсутствуют | `Base.metadata.create_all()` |

---

## 🔴 ЧАСТЬ 1. Что не хватает для полноценной работы

### Блок 1.1. Критические блокирующие проблемы (без этого приложение не работает)

#### 1.1.1. Запуск PostgreSQL

**Проблема:** База данных не запущена, backend не может подключиться.

**Что нужно сделать:**

1. Установить PostgreSQL 15+ (если не установлен):
   ```
   # Windows — скачайте с https://www.postgresql.org/download/windows/
   # Или используйте Docker:
   docker run --name instrument-pg -e POSTGRES_DB=instrument_db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 -p 5432:5432 -d postgres:15
   ```

2. Создать базу данных и пользователя:
   ```sql
   CREATE USER instrument_user WITH PASSWORD 'instrument_pass';
   CREATE DATABASE instrument_db OWNER instrument_user;
   GRANT ALL PRIVILEGES ON DATABASE instrument_db TO instrument_user;
   ```

3. Обновить `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://instrument_user:instrument_pass@localhost:5432/instrument_db
   ```

4. Проверить:
   ```bash
   python -c "import asyncpg; print('OK')"
   ```

---

#### 1.1.2. Генерация FERNET_KEY

**Проблема:** При каждом перезапуске генерируется новый ключ — зашифрованные пароли становятся недоступны.

**Что нужно сделать:**

1. Сгенерировать ключ один раз:
   ```python
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

2. Вставить в `backend/.env`:
   ```env
   FERNET_KEY=сгенерированный_ключ_здесь
   ```

---

#### 1.1.3. JWT_SECRET_KEY

**Проблема:** Секрет используется дефолтный — небезопасно.

**Что нужно сделать:**

1. Сгенерировать:
   ```python
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. Вставить в `backend/.env`:
   ```env
   JWT_SECRET_KEY=сгенерированный_ключ_здесь
   ```

---

### Блок 1.2. Миграции базы данных

**Проблема:** Нет Alembic — при изменении моделей нужно удалять БД и создавать заново.

**Что нужно сделать:**

1. Установить Alembic:
   ```bash
   cd backend
   pip install alembic
   ```

2. Инициализировать:
   ```bash
   alembic init alembic
   ```

3. Настроить `alembic.ini` и `alembic/env.py` (указать `DATABASE_URL` из settings).

4. Создать первую миграцию:
   ```bash
   alembic revision --autogenerate -m "Initial schema"
   alembic upgrade head
   ```

5. При каждом изменении моделей:
   ```bash
   alembic revision --autogenerate -m "Описание изменений"
   alembic upgrade head
   ```

---

### Блок 1.3. Тесты

**Проблема:** Нет покрытия кода тестами — невозможно безопасно рефакторить.

**Что нужно сделать:**

#### Backend (pytest):

1. Создать структуру:
   ```
   backend/tests/
   ├── conftest.py          # Fixtures: client, db_session, user
   ├── test_auth.py         # Регистрация, вход, refresh
   ├── test_db.py           # CRUD подключений
   ├── test_tables.py       # Синхронизация таблиц
   ├── test_excel.py        # Загрузка Excel
   ├── test_sql.py          # Генерация SQL
   ├── test_methods.py      # CRUD методик
   └── utils/
       └── factories.py     # Фабрики объектов
   ```

2. Базовый `conftest.py`:
   ```python
   import pytest
   from httpx import AsyncClient, ASGITransport
   from main import app
   from config.database import Base, get_db
   from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

   DATABASE_URL = "sqlite+aiosqlite:///:memory:"  # Для тестов

   @pytest.fixture
   async def client():
       transport = ASGITransport(app=app)
       async with AsyncClient(transport=transport, base_url="http://test") as ac:
           yield ac
   ```

3. Запуск:
   ```bash
   pytest tests/ -v
   ```

#### Frontend (vitest):

1. Установить:
   ```bash
   cd frontend
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. Добавить в `package.json`:
   ```json
   "scripts": {
     "test": "vitest"
   }
   ```

3. Создать `frontend/vitest.config.ts` и тесты для компонентов.

---

### Блок 1.4. Rate Limiting

**Проблема:** Нет защиты от брутфорса на `/login`, `/register`, `/ai/chat`.

**Что нужно сделать:**

1. Установить:
   ```bash
   pip install slowapi
   ```

2. Добавить в `main.py`:
   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address

   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   ```

3. Применить к эндпоинтам:
   ```python
   @router.post("/login")
   @limiter.limit("5/minute")
   async def login(...):
       ...
   ```

---

### Блок 1.5. Blacklist refresh-токенов

**Проблема:** Refresh-токены можно использовать бесконечно — нет механизма отзыва.

**Что нужно сделать:**

1. Создать таблицу `TokenBlacklist` в модели:
   ```python
   class TokenBlacklist(Base):
       __tablename__ = "token_blacklist"
       id = Column(Integer, primary_key=True)
       jti = Column(String, unique=True, index=True)
       expires_at = Column(DateTime)
   ```

2. При каждой ротации токена добавлять старый в blacklist.

3. При проверке токена проверять наличие в blacklist.

---

### Блок 1.6. Пагинация

**Проблема:** Списки таблиц/методик возвращают всё — при большом количестве зависнет.

**Что нужно сделать:**

1. Создать схему пагинации в `schemas/pagination.py`:
   ```python
   class PaginationParams(BaseModel):
       page: int = 1
       size: int = 50
       
       @property
       def skip(self) -> int:
           return (self.page - 1) * self.size
   ```

2. Добавить к endpoint-ам:
   ```python
   @router.get("/tables")
   async def list_tables(
       db: AsyncSession = Depends(get_db),
       params: PaginationParams = Query(...)
   ):
       total = await db.execute(select(func.count(Table.id)))
       items = await db.execute(
           select(Table).offset(params.skip).limit(params.size)
       )
       return {"items": items, "total": total.scalar()}
   ```

---

### Блок 1.7. Глобальный Exception Handler

**Проблема:** Ошибки возвращаются в сыром виде — нет структурированных ответов.

**Что нужно сделать:**

```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Необработанная ошибка: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Внутренняя ошибка сервера",
            "path": str(request.url.path),
        }
    )
```

---

### Блок 1.8. Healthcheck эндпоинт

**Проблема:** `/health` не реализован — невозможно мониторить состояние.

**Что нужно сделать:**

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": settings.VERSION,
        "database": "connected"  # TODO: проверить реальное подключение
    }
```

---

### Блок 1.9. Пул соединений для внешних БД

**Проблема:** Engine создаётся каждый раз при синхронизации — утечка соединений.

**Что нужно сделать:**

1. Создать менеджер пулов в `services/db_pools.py`:
   ```python
   _pools: dict[str, AsyncEngine] = {}

   def get_pool(connection: Connection) -> AsyncEngine:
       key = connection.id
       if key not in _pools:
           _pools[key] = create_async_engine(make_url(connection.to_dsn()))
       return _pools[key]

   def dispose_all():
       for pool in _pools.values():
           pool.dispose()
       _pools.clear()
   ```

---

### Блок 1.10. Production-конфигурация

**Проблема:** Backend запускается в режиме debug.

**Что нужно сделать:**

1. Добавить `.env.production` (с более строгими настройками).
2. Настроить `CORS_ORIGINS` под конкретный домен.
3. Настроить `uvicorn` с `--workers` для продакшена.
4. Добавить HTTPS (nginx reverse proxy).

---

## 🧪 ЧАСТЬ 2. Как протестировать приложение

### Шаг 0. Предварительная подготовка

```bash
# 1. Клонировать проект
cd C:\Users\splot\.vscode\Instrument_v3

# 2. Запустить start.bat (запустит backend + frontend)
.\start.bat

# 3. Открыть http://localhost:5173/
# 4. Проверить, что страница входа отображается (не чёрный экран)
```

---

### Шаг 1. Тест аутентификации

**Цель:** Убедиться, что регистрация и вход работают.

#### 1.1. Регистрация
1. Открыть `http://localhost:5173/register`
2. Заполнить:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123456!`
3. Нажать "Зарегистрироваться"
4. **Ожидаемый результат:** Редирект на `/dashboard`, в Navbar отображается "testuser"

#### 1.2. Вход
1. Открыть `http://localhost:5173/login`
2. Заполнить:
   - Username: `testuser`
   - Password: `Test123456!`
3. Нажать "Войти"
4. **Ожидаемый результат:** Редирект на `/dashboard`

#### 1.3. Выход
1. Нажать кнопку "Выход" в Navbar
2. **Ожидаемый результат:** Редирект на `/login`, Navbar показывает "Вход / Регистрация"

#### 1.4. Неверный пароль
1. Попробовать войти с неправильным паролем
2. **Ожидаемый результат:** Сообщение об ошибке, страница не перезагружается

---

### Шаг 2. Тест подключений к БД

**Цель:** Убедиться, что можно добавить и протестировать подключение.

#### 2.1. Добавить подключение
1. Перейти на `/connections`
2. Нажать "Добавить подключение"
3. Заполнить:
   - Name: `Local PostgreSQL`
   - Type: `POSTGRES`
   - Host: `localhost`
   - Port: `5432`
   - Database: `instrument_db`
   - Username: `instrument_user`
   - Password: `instrument_pass`
4. Нажать "Сохранить"
5. **Ожидаемый результат:** Подключение отображается в списке

#### 2.2. Тест подключения
1. Нажать "Тест подключения" у созданного подключения
2. **Ожидаемый результат:** Сообщение "Подключение успешно" или "Ошибка: ..."

---

### Шаг 3. Тест синхронизации таблиц

**Цель:** Убедиться, что можно синхронизировать структуру внешней БД.

#### 3.1. Синхронизация
1. Выбрать подключение из списка
2. Нажать "Синхронизировать"
3. **Ожидаемый результат:**
   - Таблицы отображаются в `/tables`
   - Для каждой таблицы показаны поля и типы

---

### Шаг 4. Тест Excel-загрузки

**Цель:** Убедиться, что можно загрузить и обработать Excel-файл.

#### 4.1. Подготовить тестовый файл
Создать `test_data.xlsx` с двумя колонками: `name`, `value` и 3-5 стрками данных.

#### 4.2. Загрузка
1. Перейти на `/excel`
2. Загрузить `test_data.xlsx`
3. Нажать "Загрузить"
4. **Ожидаемый результат:**
   - Предпросмотр данных отображается
   - После валидации данные сохраняются как `CustomTable`

---

### Шаг 5. Тест генерации SQL

**Цель:** Убедиться, что SQL-генератор работает.

#### 5.1. Генерация запроса
1. Перейти на `/sql`
2. Ввести запрос: `Выбрать все записи из users`
3. Выбрать таблицу и тип БД
4. Нажать "Сгенерировать"
5. **Ожидаемый результат:** Отображается SQL: `SELECT * FROM users;`

#### 5.2. Редактирование
1. Отредактировать сгенерированный SQL
2. Нажать "Валидировать"
3. **Ожидаемый результат:** Статус "Валидно" или ошибка с описанием

---

### Шаг 6. Тест методик

**Цель:** Убедиться, что можно создать и экспортировать методику.

#### 6.1. Создание
1. Перейти на `/methods`
2. Нажать "Создать методику"
3. Заполнить:
   - Table: выбрать из списка
   - Title: "Описание таблицы users"
   - Content: "Таблица содержит информацию о пользователях..."
4. Сохранить
5. **Ожидаемый результат:** Методика отображается в списке

#### 6.2. Экспорт в PDF
1. Открыть созданную методику
2. Нажать "Экспорт PDF"
3. **Ожидаемый результат:** Файл скачивается, открывается и содержит текст

---

### Шаг 7. Тест AI-чата

**Цель:** Убедиться, что MockAI отвечает.

#### 7.1. Отправка сообщения
1. Перейти на `/ai`
2. Ввести: `Какие таблицы доступны в БД?`
3. Нажать "Отправить"
4. **Ожидаемый результат:** Ответ от MockAI (не пустой)

---

### Шаг 8. API-тесты (через Swagger)

**Цель:** Проверить backend напрямую, без фронтенда.

1. Открыть `http://localhost:8000/docs`
2. Авторизоваться через `/auth/login`
3. Протестировать каждый endpoint:

| Endpoint | Метод | Проверка |
|----------|-------|----------|
| `/auth/register` | POST | 201 Created |
| `/auth/login` | POST | 200 OK + токены |
| `/auth/refresh` | POST | Новый access-токен |
| `/auth/logout` | POST | 200 OK |
| `/db/` | GET | Список подключений |
| `/db/` | POST | Создание подключения |
| `/tables/sync` | POST | 200 OK |
| `/sql/generate` | POST | SQL в ответе |
| `/methods/` | POST | Создание методики |

---

### Шаг 9. Тестирование на разных браузерах

| Браузер | Версия | Результат |
|---------|--------|-----------|
| Chrome | 120+ | ☐ |
| Firefox | 120+ | ☐ |
| Edge | 120+ | ☐ |
| Safari | 17+ | ☐ |

---

### Шаг 10. Нагрузочное тестирование (опционально)

```bash
# Простая проверка: 100 запросов на /health
pip install locust
# locustfile.py:
from locust import HttpUser, task

class APIUser(HttpUser):
    @task
    def health(self):
        self.client.get("/health")

# Запуск:
locust -f locustfile.py --host http://localhost:8000
```

---

## 📋 Чек-лист готовности к релизу

### Функциональные
- [ ] Регистрация / вход / выход
- [ ] CRUD подключений к БД
- [ ] Тест подключения
- [ ] Синхронизация таблиц
- [ ] Загрузка Excel
- [ ] Генерация SQL
- [ ] CRUD методик
- [ ] Экспорт в PDF
- [ ] AI-чат (MockAI)

### Нефункциональные
- [ ] Логирование работает (файл + консоль)
- [ ] JWT-токены имеют `type` (access/refresh)
- [ ] FERNET_KEY задан в .env
- [ ] Rate limiting на `/login`, `/register`, `/ai/chat`
- [ ] Blacklist refresh-токенов
- [ ] Пагинация списков
- [ ] Глобальный Exception Handler
- [ ] Healthcheck `/health`
- [ ] Alembic миграции
- [ ] Тесты (pytest + vitest)
- [ ] CORS настроен под домен
- [ ] Production .env

### Инфраструктурные
- [ ] Docker Compose работает (`docker-compose up`)
- [ ] CI/CD (GitHub Actions)
- [ ] Документация API (Swagger)
- [ ] Backup-стратегия PostgreSQL

---

## 🗂 Структура файлов для изменения

```
backend/
├── alembic/           # NEW — миграции
├── alembic.ini        # NEW
├── tests/             # NEW — тесты
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_db.py
│   └── ...
├── services/
│   └── db_pools.py    # NEW — пул соединений
├── schemas/
│   └── pagination.py  # NEW — пагинация
├── main.py            # UPDATE — limiter, exception handler
└── .env               # UPDATE — FERNET_KEY, JWT_SECRET

frontend/
├── vitest.config.ts   # NEW — конфиг тестов
├── src/
│   └── tests/         # NEW — тесты компонентов
```

---

## 📈 Приоритеты

| Приоритет | Задача | Оценка |
|-----------|--------|--------|
| 🔴 Критично | Запуск PostgreSQL | 30 мин |
| 🔴 Критично | Настройка FERNET_KEY / JWT_SECRET | 10 мин |
| 🔴 Критично | Запуск и проверка всех шагов тестирования | 2 часа |
| 🟠 Важно | Alembic миграции | 1-2 часа |
| 🟠 Важно | Тесты (pytest) | 4-8 часов |
| 🟠 Важно | Rate Limiting | 1-2 часа |
| 🟠 Важно | Blacklist refresh-токенов | 2 часа |
| 🟡 Желательно | Пагинация | 2 часа |
| 🟡 Желательно | Глобальный Exception Handler | 1 час |
| 🟡 Желательно | Healthcheck | 30 мин |
| 🟡 Желательно | Пул соединений | 2-3 часа |
| 🟢 Низкий | CI/CD | 2-4 часа |
| 🟢 Низкий | Docker Compose | 2-3 часа |
| 🟢 Низкий | Нагрузочное тестирование | 1-2 часа |

**Итого минимальный план для MVP:** ~4 часа  
**Итого полный план:** ~20-30 часов

---

## 🔗 Полезные ссылки

- **Swagger API:** http://localhost:8000/docs
- **API Docs (TZ):** docs/TZ.md
- **Архитектура:** docs/Architecture.md
- **Модель данных:** docs/DataModel.md
- **WORK_LOG:** WORK_LOG.md

---

**Создал:** Koda AI Assistant  
**Последнее обновление:** 2026-07-15
