# 📊 Инструмент управления структурой БД с ИИ-интеграцией

Проект для автоматизации работы с реляционными базами данных:
- Анализ структуры (PostgreSQL, MySQL)
- Генерация SQL и методик
- Интеграция с ИИ-агентом (через REST API или локальный движок)
- Загрузка и валидация данных из Excel (проверка типов, NOT NULL, диапазонов)
- Доступ через интернет (HTTPS, CORS, аутентификация)

## 🚀 Быстрый старт

### Требования
- Python 3.10+ (с поддержкой `async/await`)
- Node.js 18+ (для frontend)
- PostgreSQL 14+ / MySQL 8+ (для проектной БД)
- Docker (опционально)

### 1. Конфигурация
```bash
cd backend
cp .env.example .env
# → Отредактируйте .env (обязательно: DB_HOST, DB_PORT, JWT_SECRET_KEY)
2. Запуск backend (без Docker)
Bash
pip install -r requirements.txt
uvicorn main:app --reload
3. Frontend
Bash
cd ../frontend
npm install && npm run dev