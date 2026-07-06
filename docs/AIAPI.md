# API ДОКУМЕНТАЦИЯ ДЛЯ ИИ-АГЕНТА

## 1. ОБЩИЕ СВЕДЕНИЯ

### 1.1. Назначение API
REST API для интеграции внешних ИИ-агентов с системой управления базами данных.

### 1.2. Базовый URL
```
http://localhost:8000/api/v1/ai
```

### 1.3. Формат данных
- Content-Type: application/json
- Accept: application/json

### 1.4. Аутентификация
```python
Headers:
    X-API-Key: {your_api_key}
    Authorization: Bearer {jwt_token}
```

## 2. ENDPOINTS

### 2.1. Отправка запроса ИИ-агенту

**POST** `/chat`

Отправляет запрос ИИ-агенту и получает ответ.

#### Request Body
```json
{
    "message": "Проанализируй таблицу Users и предложи оптимизацию индексов",
    "context": {
        "table_id": "uuid-table-id",
        "connection_id": "uuid-connection-id",
        "history": [
            {
                "role": "user",
                "content": "Какие индексы есть в таблице?"
            },
            {
                "role": "assistant",
                "content": "В таблице Users есть индексы: idx_email, idx_username"
            }
        ]
    },
    "config_id": "uuid-config-id"
}
```

#### Response (200 OK)
```json
{
    "id": "uuid-message-id",
    "role": "assistant",
    "content": "На основе анализа таблицы Users рекомендую добавить следующие индексы:\n\n1. idx_created_at - для сортировки по дате создания\n2. idx_status - для фильтрации по статусу\n\nЭто улучшит производительность запросов на 30-40%.",
    "metadata": {
        "model": "gpt-4",
        "tokens_used": 150,
        "suggestions": [
            {
                "type": "index",
                "table": "Users",
                "index_name": "idx_created_at",
                "column": "created_at"
            }
        ]
    },
    "created_at": "2024-01-01T12:00:00Z"
}
```

#### Error Responses
```json
// 400 Bad Request
{
    "error": {
        "code": "INVALID_REQUEST",
        "message": "Поле 'message' обязательно для заполнения"
    }
}

// 401 Unauthorized
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Недействительный API ключ"
    }
}

// 404 Not Found
{
    "error": {
        "code": "CONFIG_NOT_FOUND",
        "message": "Конфигурация ИИ-агента не найдена"
    }
}

// 503 Service Unavailable
{
    "error": {
        "code": "AI_SERVICE_UNAVAILABLE",
        "message": "ИИ-агент временно недоступен"
    }
}
```

---

### 2.2. Анализ структуры таблицы

**POST** `/analyze/table`

Анализирует структуру таблицы и даёт рекомендации.

#### Request Body
```json
{
    "table_id": "uuid-table-id",
    "analysis_type": "optimization",
    "focus_areas": ["indexes", "constraints", "data_types"]
}
```

#### Response (200 OK)
```json
{
    "table_id": "uuid-table-id",
    "table_name": "Users",
    "analysis": {
        "structure_score": 7.5,
        "recommendations": [
            {
                "priority": "high",
                "type": "index",
                "description": "Добавить индекс на поле email для ускорения поиска",
                "sql": "CREATE INDEX idx_users_email ON Users(email);"
            },
            {
                "priority": "medium",
                "type": "constraint",
                "description": "Добавить CHECK ограничение для валидации email",
                "sql": "ALTER TABLE Users ADD CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');"
            }
        ],
        "statistics": {
            "total_fields": 10,
            "primary_keys": 1,
            "foreign_keys": 2,
            "indexes": 3,
            "constraints": 5
        }
    },
    "analyzed_at": "2024-01-01T12:00:00Z"
}
```

---

### 2.3. Генерация SQL запроса

**POST** `/generate/sql`

Генерирует SQL запрос на основе естественного языка.

#### Request Body
```json
{
    "request": "Найти всех пользователей, зарегистрированных в последнюю неделю",
    "table_id": "uuid-table-id",
    "dialect": "postgresql"
}
```

#### Response (200 OK)
```json
{
    "sql": "SELECT * FROM Users WHERE created_at >= NOW() - INTERVAL '7 days';",
    "explanation": "Запрос выбирает все записи из таблицы Users, где created_at попадает в последние 7 дней.",
    "preview": {
        "row_count": 150,
        "columns": ["id", "username", "email", "created_at"]
    },
    "generated_at": "2024-01-01T12:00:00Z"
}
```

---

### 2.4. Генерация методики ведения таблицы

**POST** `/generate/method`

Генерирует методику ведения таблицы.

#### Request Body
```json
{
    "table_id": "uuid-table-id",
    "format": "detailed",
    "include_sections": ["overview", "fields", "relationships", "maintenance"]
}
```

#### Response (200 OK)
```json
{
    "table_id": "uuid-table-id",
    "table_name": "Users",
    "method": {
        "title": "Методика ведения таблицы Users",
        "sections": [
            {
                "name": "Общие сведения",
                "content": "Таблица Users предназначена для хранения информации о пользователях системы."
            },
            {
                "name": "Владелец",
                "content": "Отдел разработки"
            },
            {
                "name": "Структура полей",
                "fields": [
                    {
                        "name": "id",
                        "type": "UUID",
                        "description": "Уникальный идентификатор пользователя"
                    },
                    {
                        "name": "username",
                        "type": "VARCHAR(50)",
                        "description": "Имя пользователя"
                    }
                ]
            },
            {
                "name": "Связи",
                "relationships": [
                    {
                        "table": "Orders",
                        "type": "ONE_TO_MANY",
                        "description": "Один пользователь может иметь много заказов"
                    }
                ]
            }
        ]
    },
    "generated_at": "2024-01-01T12:00:00Z"
}
```

---

### 2.5. Валидация данных

**POST** `/validate/data`

Валидирует данные перед добавлением в таблицу.

#### Request Body
```json
{
    "table_id": "uuid-table-id",
    "data": {
        "username": "john_doe",
        "email": "john@example.com",
        "age": 30
    }
}
```

#### Response (200 OK)
```json
{
    "is_valid": true,
    "warnings": [],
    "errors": [],
    "suggestions": [
        "Рекомендуется добавить поле 'phone' для связи"
    ]
}
```

#### Response с ошибками (200 OK)
```json
{
    "is_valid": false,
    "warnings": [
        "Поле 'age' не имеет ограничения MAX"
    ],
    "errors": [
        "Поле 'email' не проходит форматную проверку",
        "Поле 'username' слишком короткое"
    ]
}
```

---

### 2.6. Получение статистики

**GET** `/statistics`

Получает статистику использования ИИ-агента.

#### Query Parameters
```
?period=7d&user_id=uuid-user-id
```

#### Response (200 OK)
```json
{
    "period": "7d",
    "total_requests": 150,
    "requests_by_type": {
        "chat": 80,
        "analyze": 30,
        "generate_sql": 25,
        "generate_method": 15
    },
    "average_response_time_ms": 450,
    "top_tables": [
        {"table_id": "uuid-1", "table_name": "Users", "requests": 45},
        {"table_id": "uuid-2", "table_name": "Orders", "requests": 30}
    ]
}
```

---

### 2.7. Управление конфигурацией ИИ

#### 2.7.1. Создание конфигурации

**POST** `/config`

```json
{
    "name": "GPT-4 Analyzer",
    "api_url": "https://api.openai.com/v1/chat/completions",
    "api_key": "sk-...",
    "auth_type": "API_KEY",
    "model": "gpt-4",
    "temperature": 0.7
}
```

#### 2.7.2. Получение списка конфигураций

**GET** `/config`

#### 2.7.3. Обновление конфигурации

**PUT** `/config/{config_id}`

#### 2.7.4. Удаление конфигурации

**DELETE** `/config/{config_id}`

## 3. СХЕМА ВЗАИМОДЕЙСТВИЯ

```
┌──────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend│         │   Backend    │         │  AI Agent   │
│          │         │              │         │             │
│  Пользов │         │              │         │             │
│  пишет   │────────>│  Валидирует  │         │             │
│  запрос  │         │  запрос      │         │             │
│          │         │              │         │             │
│          │         │  Формирует   │────────>│  Отправляет │
│          │         │  промпт      │         │  запрос     │
│          │         │              │         │  ИИ-модели  │
│          │         │              │         │             │
│          │         │              │<────────│  Получает   │
│          │         │              │         │  ответ      │
│          │         │  Обрабатывает│         │             │
│          │         │  ответ       │         │             │
│          │         │              │         │             │
│  Получает│         │              │         │             │
│  ответ   │<────────│  Возвращает  │         │             │
│          │         │  результат   │         │             │
└──────────┘         └──────────────┘         └─────────────┘
```

## 4. ОГРАНИЧЕНИЯ И ЛИМИТЫ

### 4.1. Rate Limiting
```
Стандартные лимиты:
- 100 запросов в минуту на пользователя
- 1000 запросов в час на конфигурацию ИИ
- Максимальный размер запроса: 10MB
- Максимальная длина сообщения: 4000 токенов
```

### 4.2. Timeout
```
- Время ожидания ответа ИИ: 30 секунд
- Время ожидания ответа API: 10 секунд
- Retry policy: 3 попытки с экспоненциальной задержкой
```

## 5. БЕЗОПАСНОСТЬ

### 5.1. Шифрование
- API ключи хранятся в зашифрованном виде (AES-256)
- Все соединения через HTTPS
- Токены доступа с ограниченным временем жизни

### 5.2. Валидация
- Все входные данные валидируются
- Санитизация пользовательского ввода
- Защита от injection атак

### 5.3. Логирование
- Все запросы к ИИ логируются
- Хранение логов: 90 дней
- Конфиденциальные данные маскируются

## 6. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### 6.1. Python
```python
import requests

api_key = "your_api_key"
base_url = "http://localhost:8000/api/v1/ai"

# Отправка запроса
response = requests.post(
    f"{base_url}/chat",
    headers={"X-API-Key": api_key},
    json={
        "message": "Проанализируй таблицу Users",
        "config_id": "config-uuid"
    }
)

print(response.json())
```

### 6.2. JavaScript
```javascript
const apiKey = 'your_api_key';
const baseURL = 'http://localhost:8000/api/v1/ai';

async function sendToAI(message, configId) {
    const response = await fetch(`${baseURL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
        },
        body: JSON.stringify({
            message,
            config_id: configId
        })
    });
    
    return await response.json();
}

// Использование
sendToAI('Проанализируй таблицу Users', 'config-uuid')
    .then(result => console.log(result));
```

### 6.3. cURL
```bash
curl -X POST "http://localhost:8000/api/v1/ai/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "message": "Проанализируй таблицу Users",
    "config_id": "config-uuid"
  }'
```

## 7. WEBHOOK (ОПЦИОНАЛЬНО)

Для асинхронной обработки тяжёлых запросов.

**POST** `/analyze/async`

```json
{
    "table_id": "uuid-table-id",
    "webhook_url": "https://your-server.com/webhook",
    "callback_data": {"project_id": "123"}
}
```

Backend отправляет результат на webhook_url после завершения анализа.

---
**Версия:** 1.0
**Дата:** 2024
**Статус:** На согласовании
