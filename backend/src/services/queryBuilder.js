/**
 * Проверка валидности имени таблицы
 */
const isValidTableName = (tableName) => {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
};

/**
 * Получение списка допустимых колонок для сортировки
 */
const getSortColumns = (schema) => {
  if (!schema) return [];
  return schema.columns
    .filter(col => col.type === 'number' || col.type === 'text' || col.type === 'datetime')
    .map(col => col.name);
};

/**
 * Построение SELECT запроса с пагинацией, сортировкой и поиском
 */
const buildSelectQuery = (table, schema, page, limit, sort, order, search) => {
  const params = [];
  let sql = `SELECT * FROM "${table}"`;
  
  // Поиск
  if (search) {
    const searchColumns = schema.columns
      .filter(col => col.type === 'text' || col.type === 'number')
      .map(col => col.name);
    
    if (searchColumns.length > 0) {
      const whereConditions = searchColumns.map((col, i) => {
        params.push(`%${search}%`);
        return `"${col}"::text ILIKE $${i + 1}`;
      });
      sql += ` WHERE ${whereConditions.join(' OR ')}`;
    }
  }
  
  // Сортировка
  if (sort) {
    const allowedColumns = getSortColumns(schema);
    if (allowedColumns.includes(sort)) {
      sql += ` ORDER BY "${sort}" ${order === 'desc' ? 'DESC' : 'ASC'}`;
    }
  }
  
  // Пагинация
  const offset = (page - 1) * limit;
  params.push(limit, offset);
  sql += ` LIMIT $${params.length} OFFSET $${params.length + 1}`;
  
  return { text: sql, values: params };
};

/**
 * Построение запроса для получения общего количества записей
 */
const buildCountQuery = (table, search, schema) => {
  const params = [];
  let sql = `SELECT COUNT(*) FROM "${table}"`;
  
  if (search) {
    const searchColumns = schema.columns
      .filter(col => col.type === 'text' || col.type === 'number')
      .map(col => col.name);
    
    if (searchColumns.length > 0) {
      const whereConditions = searchColumns.map((col, i) => {
        params.push(`%${search}%`);
        return `"${col}"::text ILIKE $${i + 1}`;
      });
      sql += ` WHERE ${whereConditions.join(' OR ')}`;
    }
  }
  
  return { text: sql, values: params };
};

/**
 * Построение INSERT запроса
 */
const buildInsertQuery = (table, data, schema) => {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const params = columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${params}) RETURNING *`;
  
  return { text: sql, values };
};

/**
 * Построение UPDATE запроса (только для новых записей)
 */
const buildUpdateQuery = (table, data, id, schema) => {
  const columns = Object.keys(data).filter(col => col !== 'id');
  const values = Object.values(data).filter((_, i) => i > 0 || !['id'].includes(columns[i]));
  const setClause = columns.map((col, i) => {
    return `"${col}" = $${i + 2}`;
  }).join(', ');
  
  const sql = `UPDATE "${table}" SET ${setClause} WHERE id = $1 RETURNING *`;
  
  return { text: sql, values: [id, ...values] };
};

module.exports = {
  isValidTableName,
  buildSelectQuery,
  buildCountQuery,
  buildInsertQuery,
  buildUpdateQuery,
  getSortColumns
};
