# backend/schemas/types.py

from enum import Enum


class DBType(str, Enum):
    POSTGRES = "POSTGRES"
    MYSQL = "MYSQL"
