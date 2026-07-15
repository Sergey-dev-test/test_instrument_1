# backend/utils/logger.py

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler


def setup_logger(
    name: str = "instrument",
    log_level: str = "INFO",
    log_file: str = "logs/app.log",
) -> logging.Logger:
    """Настройка логгера с консольным и файловым выводом."""

    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Создаём директорию для логов
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    # Форматирование
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Консольный handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Файловый handler с ротацией (10 МБ, 5 файлов)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


def get_logger(name: str = "instrument") -> logging.Logger:
    """Получить логгер по имени (для повторного использования)."""
    return logging.getLogger(name)
