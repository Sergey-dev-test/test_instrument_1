#!/bin/bash

set -e

echo "========================================"
echo "  Instrument_v3 - Запуск приложения"
echo "========================================"
echo ""

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python не найден. Установите Python 3.11+"
    exit 1
fi

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js не найден. Установите Node.js 18+"
    exit 1
fi

echo "[1/4] Проверка PostgreSQL..."
echo "      Убедитесь, что PostgreSQL запущен на порту 5432"
echo ""

echo "[2/4] Проверка Redis..."
echo "      Убедитесь, что Redis запущен на порту 6379"
echo ""

echo "[3/4] Установка зависимостей backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "      Создание виртуального окружения..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
echo "      ✓ Зависимости backend установлены"
cd ..
echo ""

echo "[4/4] Установка зависимостей frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "      Установка npm пакетов..."
    npm install
fi
echo "      ✓ Зависимости frontend установлены"
cd ..
echo ""

echo "========================================"
echo "  Запуск сервисов"
echo "========================================"
echo ""
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "   Нажмите Ctrl+C для остановки"
echo ""

# Запуск backend в фоне
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Ожидание запуска backend
echo "      Ожидание запуска backend..."
sleep 5

# Запуск frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Функция остановки
cleanup() {
    echo ""
    echo "Остановка сервисов..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait
    echo "✓ Все сервисы остановлены"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "========================================"
echo "  ✓ Приложение запущено"
echo "========================================"

# Ожидание завершения
wait
