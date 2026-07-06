# backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Создание структуры каталогов
RUN mkdir -p tmp models schemas services repositories api config core utils

# Копирование кода
COPY . .

# Экспорт переменных (для prod)
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Порт для приложения
EXPOSE 8000

# Запуск
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]