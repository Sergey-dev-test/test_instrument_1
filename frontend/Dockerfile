# src/frontend/Dockerfile

# 1. Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app

# Копируем зависимости и конфигурацию
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Устанавливаем зависимости
RUN npm ci --only=production || npm install --only=production

# Копируем исходный код
COPY src/ ./src/
COPY public/ ./public/

# Собираем production-версию
RUN npm run build

# 2. Продакшен-образ (с Nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Конфигурация Nginx (обязательно для SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Экспортируем порт
EXPOSE 80

# Запуск Nginx
CMD ["nginx", "-g", "daemon off;"]