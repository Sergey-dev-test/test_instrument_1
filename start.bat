@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Instrument_v3 - Запуск приложения
echo ========================================
echo.

set PYTHON_CMD=py

echo [1/6] Проверка Python...
%PYTHON_CMD% -c "import sys; print('Python', sys.version.split()[0])" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python не найден.
    echo         Установите Python 3.10+ с https://www.python.org/downloads/
    echo         При установке поставьте галочку "Add Python to PATH"
    pause
    exit /b 1
)
%PYTHON_CMD% --version
echo      Python готов
echo.

echo [2/6] Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js не найден. Установите Node.js 18+
    echo         Скачайте с https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo      Node.js готов
echo.

echo [3/6] Проверка PostgreSQL...
echo      Ожидается на порту 5432
%PYTHON_CMD% -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', 5432)); s.close(); print('  [OK] PostgreSQL подключается')" 2>nul
if errorlevel 1 echo      [WARN] Не удалось подключиться к PostgreSQL (пропустите, если используете Docker)
echo.

echo [4/6] Проверка Redis...
echo      Ожидается на порту 6379
%PYTHON_CMD% -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', 6379)); s.close(); print('  [OK] Redis подключается')" 2>nul
if errorlevel 1 echo      [WARN] Не удалось подключиться к Redis (опционально для MVP)
echo.

echo [5/6] Настройка backend...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo      Копирование .env.example -> .env
        copy backend\.env.example backend\.env >nul
        echo      Отредактируйте backend\.env перед запуском
    ) else (
        echo      [WARN] Файл .env не найден. Будут использованы значения по умолчанию.
    )
) else (
    echo      Файл .env найден
)

if not exist "backend\venv" (
    echo      Создание виртуального окружения...
    %PYTHON_CMD% -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Не удалось создать виртуальное окружение
        pause
        exit /b 1
    )
)
call backend\venv\Scripts\activate.bat

REM Устанавливаем UTF-8 для pip
set PYTHONUTF8=1

echo      Установка зависимостей backend...
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Не удалось установить зависимости backend
    pause
    exit /b 1
)
echo      Зависимости backend установлены
echo.

echo [6/6] Настройка frontend...
cd frontend
if not exist "node_modules" (
    echo      Установка npm пакетов...
    npm install
    if errorlevel 1 (
        echo [ERROR] Не удалось установить зависимости frontend
        pause
        exit /b 1
    )
) else (
    echo      node_modules уже существуют
)
cd ..
echo.

mkdir backend\tmp /q 2>nul
mkdir backend\logs /q 2>nul
echo      Директории созданы
echo.

echo ========================================
echo   Запуск сервисов
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo.
echo   Логи backend: backend\logs\app.log
echo.
echo   Нажмите Ctrl+C в каждом окне для остановки
echo ========================================
echo.

start "Instrument_v3 - Backend (port 8000)" cmd /k "cd /d backend && call venv\Scripts\activate.bat && echo [INFO] Backend запускается... && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo      Ожидание запуска backend (10 сек)...
timeout /t 10 /nobreak >nul

echo      Проверка доступности backend...
%PYTHON_CMD% -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3); print('  [OK] Backend доступен!')" 2>nul
if errorlevel 1 echo      [WARN] Backend ещё не доступен, подождите...

start "Instrument_v3 - Frontend (port 5173)" cmd /k "cd /d frontend && echo [INFO] Frontend запускается... && npm run dev"

echo.
echo ========================================
echo   Все сервисы запущены
echo ========================================
echo.
pause
