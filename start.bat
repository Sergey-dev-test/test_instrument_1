@echo off
echo ========================================
echo   Instrument_v3 - Запуск приложения
echo ========================================
echo.

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python не найден. Установите Python 3.11+
    pause
    exit /b 1
)

REM Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js не найден. Установите Node.js 18+
    pause
    exit /b 1
)

echo [1/4] Проверка PostgreSQL...
echo      Убедитесь, что PostgreSQL запущен на порту 5432
echo.

echo [2/4] Проверка Redis...
echo      Убедитесь, что Redis запущен на порту 6379
echo.

echo [3/4] Установка зависимостей backend...
cd backend
if not exist venv (
    echo      Создание виртуального окружения...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Не удалось установить зависимости backend
    pause
    exit /b 1
)
echo      ✓ Зависимости backend установлены
cd ..
echo.

echo [4/4] Установка зависимостей frontend...
cd frontend
if not exist node_modules (
    echo      Установка npm пакетов...
    npm install
)
echo      ✓ Зависимости frontend установлены
cd ..
echo.

echo ========================================
echo   Запуск сервисов
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo.
echo   Нажмите Ctrl+C для остановки
echo.

REM Запуск backend в фоне
start "Instrument_v3 - Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Ожидание запуска backend
echo      Ожидание запуска backend...
timeout /t 5 /nobreak >nul

REM Запуск frontend
start "Instrument_v3 - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   ✓ Приложение запущено
echo ========================================
pause
