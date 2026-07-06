# backend/utils/sql_generator.py

from typing import List, Dict, Any, Optional
from models.table import Field


def generate_select_all(table_name: str, alias: str = "t") -> str:
    """SELECT * FROM table_name AS alias"""
    return f"SELECT {alias}.* FROM {table_name} AS {alias};"


def generate_select_by_id(table_name: str, pk_name: str, alias: str = "t") -> str:
    """SELECT ... FROM table_name WHERE pk_name = :pk_value"""
    return f"SELECT {alias}.* FROM {table_name} AS {alias} WHERE {alias}.{pk_name} = :{pk_name};"


def generate_insert(table_name: str, fields: List[Field]) -> tuple[str, List[str]]:
    """
    Возвращает (SQL, list_of_names_for_params)
    Например:
      INSERT INTO users (username, email) VALUES (:username, :email)
    """
    field_names = [f.name for f in fields if not f.is_primary_key]
    placeholders = [f":{name}" for name in field_names]
    sql = f"INSERT INTO {table_name} ({', '.join(field_names)}) VALUES ({', '.join(placeholders)});"
    return sql, field_names


def generate_update(table_name: str, fields: List[Field], pk_name: str) -> tuple[str, List[str]]:
    """
    UPDATE table SET f1 = :f1, ... WHERE pk_name = :pk_name
    """
    set_parts = [f"{f.name} = :{f.name}" for f in fields if not f.is_primary_key]
    sql = f"UPDATE {table_name} SET {', '.join(set_parts)} WHERE {pk_name} = :{pk_name};"
    params = [f.name for f in fields if not f.is_primary_key] + [pk_name]
    return sql, params


def generate_delete(table_name: str, pk_name: str) -> str:
    """DELETE FROM table WHERE pk_name = :pk_value"""
    return f"DELETE FROM {table_name} WHERE {pk_name} = :{pk_name};"


def generate_where_clause(filters: Dict[str, Any], alias: str = "t") -> tuple[str, Dict[str, Any]]:
    """
    Генерирует WHERE и параметры:
      filters = {"name": "Ivan", "age__gte": 18}
      → WHERE t.name = :name AND t.age >= :age_gte
    """
    where_parts = []
    params = {}

    for key, value in filters.items():
        if "__" in key:
            field, op = key.split("__", 1)
            op_map = {
                "lt": "<", "lte": "<=", "gt": ">", "gte": ">=", "ne": "!=", "in": "IN",
            }
            if op in op_map:
                op_sql = op_map[op]
                if op == "in":
                    # Упрощённая обработка IN — для MVP только list
                    if isinstance(value, list):
                        params[f"{field}_in"] = value
                        where_parts.append(f"{alias}.{field} IN :{field}_in")
                    else:
                        raise ValueError("IN работает только со списками")
                else:
                    params[key] = value
                    where_parts.append(f"{alias}.{field} {op_sql} :{key}")
            else:
                # Unknown op — просто сравниваем как = (не по умолчанию)
                params[key] = value
                where_parts.append(f"{alias}.{key} = :{key}")
        else:
            # Простое равенство: name = :name
            params[key] = value
            where_parts.append(f"{alias}.{key} = :{key}")

    where_sql = " AND ".join(where_parts) if where_parts else ""
    return (" WHERE " + where_sql) if where_sql else "", params


def generate_pagination(page: int = 1, page_size: int = 20) -> tuple[str, int, int]:
    """Возвращает LIMIT и OFFSET"""
    offset = (page - 1) * page_size
    return f" LIMIT {page_size} OFFSET {offset}", offset, page_size