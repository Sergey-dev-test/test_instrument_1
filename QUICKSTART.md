# 🚀 Запуск Instrument_v3

## Вариант 1: Локальный запуск (рекомендуется для разработки)

### Требования
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+** (запущен на порту 5432)
- **Redis 7+** (запущен на порту 6379)

### Windows (PowerShell)
```powershell
.\start.bat
```

### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

### Ручной запуск

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Доступ после запуска
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Вариант 2: Docker Compose

### Требования
- **Docker** и **Docker Compose**

### Запуск
```bash
docker-compose up --build
```

### Запуск в фоне
```bash
docker-compose up -d --build
```

### Остановка
```bash
docker-compose down
```

### Остановка с удалением данных
```bash
docker-compose down -v
```

---

## Конфигурация

### Backend (.env)
Файл `backend/.env` уже создан с настройками по умолчанию.

Основные переменные:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=instrument_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres_password

REDIS_HOST=localhost
REDIS_PORT=6379

AI_ENABLED=false  # Включить для AI-функций
```

### Frontend (.env)
Файл `frontend/.env` уже создан с настройками по умолчанию.

Основные переменные:
```env
VITE_API_URL=http://localhost:8000/api
```

---

## Решение проблем

### PostgreSQL не запущен
```bash
# Windows (если установлен как сервис)
net start postgresql-x64-15

# Linux
sudo systemctl start postgresql
```

### Redis не запущен
```bash
# Windows
redis-server --start

# Linux
sudo systemctl start redis
```

### Порт 8000 уже занят
```bash
# Найти процесс на порту 8000
netstat -ano | findstr :8000

# Убить процесс (замените PID)
taskkill /PID <PID> /F
```

### Порт 5173 уже занят
```bash
# Найти процесс на порту 5173
netstat -ano | findstr :5173

# Убить процесс (замените PID)
taskkill /PID <PID> /F
```

---

## Структура проекта

```
Instrument_v3/
├── backend/              # FastAPI backend
│   ├── api/v1/          # API endpoints
│   ├── config/          # Настройки
│   ├── core/            # Безопасность, зависимости
│   ├── models/          # SQLAlchemy модели
│   ├── repositories/    # Репозитории
│   ├── schemas/         # Pydantic схемы
│   ├── services/        # Бизнес-логика
│   ├── utils/           # Утилиты
│   ├── main.py          # Точка входа
│   └── requirements.txt # Зависимости Python
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── contexts/    # Контексты (Auth)
│   │   ├── pages/       # Страницы
│   │   ├── services/    # API сервисы
│   │   └── App.tsx      # Главный компонент
│   ├── package.json     # Зависимости Node.js
│   └── vite.config.ts   # Конфигурация Vite
├── docker-compose.yml   # Docker конфигурация
├── start.bat            # Запуск Windows
└── start.sh             # Запуск Linux/macOS
```
