# backend/core/enums.py

from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"
