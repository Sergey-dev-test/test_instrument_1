# РОЛЕВАЯ МОДЕЛЬ И СИСТЕМА АУТЕНТИФИКАЦИИ

## 1. СИСТЕМА РОЛЕЙ

### 1.1. Роли пользователей

| Роль | Код | Описание |
|------|-----|----------|
| Администратор | `ADMIN` | Полный доступ ко всем функциям системы |
| Пользователь | `USER` | Ограниченный доступ, только свои таблицы |

### 1.2. Матрица прав доступа

| Действие | ADMIN | USER |
|----------|-------|------|
| Просмотр всех таблиц | ✅ | ✅ (только свои) |
| Создание таблиц | ✅ | ✅ |
| Редактирование своих таблиц | ✅ | ✅ |
| Редактирование чужих таблиц | ✅ | ❌ |
| Удаление своих таблиц | ✅ | ✅ |
| Удаление чужих таблиц | ✅ | ❌ |
| Управление пользователями | ✅ | ❌ |
| Настройка системы | ✅ | ❌ |
| Подключение к БД | ✅ | ✅ |
| Генерация SQL | ✅ | ✅ |
| Генерация методик | ✅ | ✅ |
| Работа с ИИ-агентом | ✅ | ✅ |
| Загрузка Excel | ✅ | ✅ |
| Просмотр audit log | ✅ | ❌ |

## 2. СИСТЕМА АУТЕНТИФИКАЦИИ

### 2.1. Механизм аутентификации

**JWT (JSON Web Tokens)** с двумя типами токенов:

1. **Access Token** - короткий срок жизни (15 минут)
2. **Refresh Token** - длинный срок жизни (7 дней), хранится в HTTP-only cookie

### 2.2. Процесс аутентификации

```
┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │  1. POST /auth/login          │
     │  {username, password}         │
     │──────────────────────────────>│
     │                               │
     │                               │  2. Проверка учётных данных
     │                               │  3. Генерация JWT
     │                               │  4. Установка cookie
     │                               │
     │  5. Access Token              │
     │  + Refresh Cookie             │
     │<──────────────────────────────│
     │                               │
     │  6. Запросы с Access Token    │
     │  в заголовке Authorization    │
     │──────────────────────────────>│
     │                               │
     │  (если токен истёк)           │
     │  7. POST /auth/refresh        │
     │  (отправляется автоматически) │
     │<──────────────────────────────│
```

### 2.3. Endpoints аутентификации

#### 2.3.1. Регистрация

**POST** `/api/v1/auth/register`

```json
// Request
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "USER"
}

// Response (201 Created)
{
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "created_at": "2024-01-01T00:00:00Z"
}
```

#### 2.3.2. Вход

**POST** `/api/v1/auth/login`

```json
// Request
{
    "username": "john_doe",
    "password": "SecurePass123!"
}

// Response (200 OK)
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "token_type": "bearer",
    "expires_in": 900
}
```

#### 2.3.3. Обновление токена

**POST** `/api/v1/auth/refresh`

```json
// Request (в cookie)
// refresh_token

// Response (200 OK)
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
}
```

#### 2.3.4. Выход

**POST** `/api/v1/auth/logout`

```json
// Response (200 OK)
{
    "message": "Успешный выход"
}
```

#### 2.3.5. Получение профиля

**GET** `/api/v1/auth/me`

```json
// Response (200 OK)
{
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T12:00:00Z"
}
```

## 3. ЗАЩИТА РОУТОВ

### 3.1. Декораторы для проверки прав

```python
# backend/core/security.py

from enum import Enum
from functools import wraps
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

class Role(Enum):
    ADMIN = "ADMIN"
    USER = "USER"

def require_role(required_role: Role):
    """Декоратор для проверки роли пользователя"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, credentials: HTTPAuthorizationCredentials = Depends(security), **kwargs):
            user = await verify_token(credentials.credentials)
            
            if user.role != required_role.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Требуется роль: {required_role.value}"
                )
            
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator

def require_admin(func):
    """Декоратор для проверки роли администратора"""
    return require_role(Role.ADMIN)(func)

def verify_token(token: str) -> User:
    """Проверка и декодирование JWT токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = get_user_by_id(payload["sub"])
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Недействительный токен")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Недействительный токен")
```

### 3.2. Примеры использования

```python
# backend/api/v1/auth.py

from fastapi import APIRouter, Depends
from backend.core.security import require_admin, require_role, Role

router = APIRouter()

@router.post("/users")
@require_admin
async def create_user(user_data: UserCreate, user: User = Depends(verify_token)):
    """Создание нового пользователя (только для администраторов)"""
    return await user_service.create(user_data)

@router.get("/tables")
@require_role(Role.USER)
async def get_tables(user: User = Depends(verify_token)):
    """Получение таблиц (зависит от роли)"""
    if user.role == Role.ADMIN.value:
        return await table_service.get_all()
    else:
        return await table_service.get_by_user(user.id)

@router.delete("/tables/{table_id}")
@require_role(Role.USER)
async def delete_table(table_id: str, user: User = Depends(verify_token)):
    """Удаление таблицы"""
    table = await table_service.get(table_id)
    
    # Администратор может удалять любые таблицы
    if user.role == Role.ADMIN.value:
        await table_service.delete(table_id)
    else:
        # Пользователь может удалять только свои таблицы
        if table.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Можно удалять только свои таблицы")
        await table_service.delete(table_id)
```

## 4. ВАЛИДАЦИЯ ПАРОЛЕЙ

### 4.1. Требования к паролю

- Минимум 8 символов
- Хотя бы одна заглавная буква
- Хотя бы одна строчная буква
- Хотя бы одна цифра
- Хотя бы один спецсимвол

### 4.2. Хеширование

```python
# backend/core/security.py

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)
```

## 5. УПРАВЛЕНИЕ СЕССИЯМИ

### 5.1. Хранение сессий

```python
# backend/services/session_service.py

import redis
import json
from datetime import datetime, timedelta

class SessionService:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0)
    
    def create_session(self, user_id: str, token: str):
        """Создание новой сессии"""
        session_data = {
            "user_id": user_id,
            "token": token,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        self.redis.setex(
            f"session:{user_id}",
            604800,  # 7 дней в секундах
            json.dumps(session_data)
        )
    
    def validate_session(self, user_id: str, token: str) -> bool:
        """Проверка сессии"""
        session_data = self.redis.get(f"session:{user_id}")
        if not session_data:
            return False
        
        session = json.loads(session_data)
        if session["token"] != token:
            return False
        
        return datetime.fromisoformat(session["expires_at"]) > datetime.utcnow()
    
    def invalidate_session(self, user_id: str):
        """Удаление сессии"""
        self.redis.delete(f"session:{user_id}")
```

## 6. ЖУРНАЛИРОВАНИЕ ДЕЙСТВИЙ

### 6.1. Структура логов

```python
# backend/services/audit_service.py

from enum import Enum
from typing import Optional

class ActionType(Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    DB_CONNECT = "db_connect"
    TABLE_CREATE = "table_create"
    TABLE_UPDATE = "table_update"
    TABLE_DELETE = "table_delete"
    SQL_EXECUTE = "sql_execute"
    EXCEL_UPLOAD = "excel_upload"
    AI_REQUEST = "ai_request"

class AuditService:
    @staticmethod
    async def log_action(
        user_id: str,
        action: ActionType,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None
    ):
        """Логирование действия пользователя"""
        log_entry = {
            "user_id": user_id,
            "action": action.value,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
            "ip_address": ip_address,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Сохранение в БД
        await audit_log_repository.create(log_entry)
        
        # Отправка в ELK для анализа
        await elk_client.send(log_entry)
```

### 6.2. Примеры логов

```json
{
    "user_id": "uuid-123",
    "action": "login",
    "entity_type": null,
    "entity_id": null,
    "details": {
        "username": "john_doe",
        "ip": "192.168.1.100"
    },
    "ip_address": "192.168.1.100",
    "created_at": "2024-01-01T12:00:00Z"
}

{
    "user_id": "uuid-123",
    "action": "table_create",
    "entity_type": "CustomTable",
    "entity_id": "uuid-456",
    "details": {
        "table_name": "Users",
        "fields_count": 10
    },
    "ip_address": "192.168.1.100",
    "created_at": "2024-01-01T12:05:00Z"
}
```

## 7. БЛОКИРОВКА СУЩЕСТВУЮЩИХ ДАННЫХ

### 7.1. Защита на уровне бэкенда

```python
# backend/services/table_service.py

class TableService:
    async def update_record(self, table_id: str, record_id: str, data: dict):
        """Блокировка изменения существующих данных"""
        table = await self.get(table_id)
        
        # Проверка: это внешняя таблица БД?
        if not table.is_custom:
            raise PermissionError("Изменение существующих данных запрещено")
        
        # Проверка прав
        if not self.user_can_edit(table):
            raise PermissionError("Нет прав на редактирование")
        
        await self.repository.update(record_id, data)
    
    async def delete_record(self, table_id: str, record_id: str):
        """Блокировка удаления существующих данных"""
        table = await self.get(table_id)
        
        # Проверка: это внешняя таблица БД?
        if not table.is_custom:
            raise PermissionError("Удаление существующих данных запрещено")
        
        # Проверка прав
        if not self.user_can_delete(table):
            raise PermissionError("Нет прав на удаление")
        
        await self.repository.delete(record_id)
```

### 7.2. Защита на уровне базы данных

```sql
-- Создание триггеров для защиты данных

-- Запрет на UPDATE для внешних таблиц
CREATE OR REPLACE FUNCTION prevent_external_update()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM custom_tables ct
        WHERE ct.id = NEW.table_id AND ct.is_custom = false
    ) THEN
        RAISE EXCEPTION 'Изменение существующих данных запрещено';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_update
BEFORE UPDATE ON records
FOR EACH ROW
EXECUTE FUNCTION prevent_external_update();

-- Запрет на DELETE для внешних таблиц
CREATE OR REPLACE FUNCTION prevent_external_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM custom_tables ct
        WHERE ct.id = OLD.table_id AND ct.is_custom = false
    ) THEN
        RAISE EXCEPTION 'Удаление существующих данных запрещено';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_delete
BEFORE DELETE ON records
FOR EACH ROW
EXECUTE FUNCTION prevent_external_delete();
```

## 8. FRONTEND ЗАЩИТА

### 8.1. Хук для проверки прав

```typescript
// frontend/hooks/useAuthorization.ts

import { useAuth } from './useAuth';

export function useAuthorization() {
    const { user } = useAuth();
    
    const hasRole = (requiredRole: 'ADMIN' | 'USER') => {
        return user?.role === requiredRole;
    };
    
    const canEditTable = (table: Table) => {
        if (!user) return false;
        
        if (user.role === 'ADMIN') return true;
        return table.creator_id === user.id;
    };
    
    const canDeleteTable = (table: Table) => {
        if (!user) return false;
        
        if (user.role === 'ADMIN') return true;
        return table.creator_id === user.id;
    };
    
    return {
        hasRole,
        canEditTable,
        canDeleteTable,
        isAdmin: user?.role === 'ADMIN'
    };
}
```

### 8.2. Пример использования в компоненте

```tsx
// frontend/components/tables/TableActions.tsx

import { useAuthorization } from '../../hooks/useAuthorization';

function TableActions({ table }: { table: Table }) {
    const { canEditTable, canDeleteTable } = useAuthorization();
    
    return (
        <div className="table-actions">
            {canEditTable(table) && (
                <button onClick={() => editTable(table.id)}>
                    Редактировать
                </button>
            )}
            
            {canDeleteTable(table) && (
                <button onClick={() => deleteTable(table.id)}>
                    Удалить
                </button>
            )}
            
            <button onClick={() => viewTable(table.id)}>
                Просмотр
            </button>
        </div>
    );
}
```

---
**Версия:** 1.0
**Дата:** 2024
**Статус:** На согласовании
