const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getSchema } = require('../services/schemaCache');
const { buildSelectQuery, buildCountQuery, buildInsertQuery } = require('../services/queryBuilder');
const { sanitizeObject } = require('../services/sanitizer');
const { validateTableName } = require('../services/validator');
const { generateMethodology } = require('../services/methodologyGenerator');

const DEFAULT_LIMIT = 20;

/**
 * GET /api/table/:tableName
 * Получение записей таблицы с пагинацией, сортировкой и поиском
 */
router.get('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, limit = DEFAULT_LIMIT, sort, order = 'desc', search } = req.query;

    // Валидация имени таблицы
    const tableValidation = validateTableName(tableName);
    if (tableValidation.error) {
      return res.status(400).json({ error: 'Некорректное имя таблицы' });
    }

    // Получение схемы таблицы
    const schema = await getSchema();
    const tableSchema = schema.find(s => s.name === tableName);
    
    if (!tableSchema) {
      return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
    }

    // Поиск по текстовым полям
    const searchColumns = tableSchema.columns
      .filter(col => col.type === 'text' || col.type === 'number')
      .map(col => col.name);

    // Построение запросов
    const selectQuery = buildSelectQuery(tableName, page, limit, sort, order, search, searchColumns);
    const countQuery = buildCountQuery(tableName, search, searchColumns);

    // Выполнение запросов
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery.text, countQuery.values),
      pool.query(selectQuery.text, selectQuery.values)
    ]);

    res.json({
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

/**
 * GET /api/table/:tableName/schema
 * Получение схемы таблицы
 */
router.get('/api/table/:tableName/schema', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = await getSchema();
    const tableSchema = schema.find(s => s.name === tableName);
    
    if (!tableSchema) {
      return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
    }

    res.json(tableSchema);
  } catch (error) {
    console.error('Error fetching table schema:', error);
    res.status(500).json({ error: 'Ошибка при получении схемы таблицы' });
  }
});

/**
 * POST /api/table/:tableName
 * Добавление новой записи
 */
router.post('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const data = req.body;

    // Валидация имени таблицы
    const tableValidation = validateTableName(tableName);
    if (tableValidation.error) {
      return res.status(400).json({ error: 'Некорректное имя таблицы' });
    }

    // Получение схемы таблицы
    const schema = await getSchema();
    const tableSchema = schema.find(s => s.name === tableName);
    
    if (!tableSchema) {
      return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
    }

    // Санитизация данных
    const sanitizedData = sanitizeObject(data);

    // Построение и выполнение INSERT запроса
    const insertQuery = buildInsertQuery(tableName, sanitizedData);
    const result = await pool.query(insertQuery.text, insertQuery.values);

    res.status(201).json({
      data: result.rows[0],
      message: 'Запись успешно добавлена'
    });
  } catch (error) {
    console.error('Error adding record:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Нарушение уникальности ключа' });
    }
    res.status(500).json({ error: 'Ошибка при добавлении записи' });
  }
});

/**
 * GET /api/table/:tableName/methodology
 * Генерация методики ведения таблицы
 */
router.get('/api/table/:tableName/methodology', async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = await getSchema();
    const tableSchema = schema.find(s => s.name === tableName);
    
    if (!tableSchema) {
      return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
    }

    const methodology = generateMethodology(tableSchema);
    
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(methodology);
  } catch (error) {
    console.error('Error generating methodology:', error);
    res.status(500).json({ error: 'Ошибка при генерации методики' });
  }
});

/**
 * PUT /api/table/:tableName/:id
 * Обновление записи (заблокировано)
 */
router.put('/api/table/:tableName/:id', async (req, res) => {
  res.status(403).json({ error: 'Обновление существующих записей запрещено' });
});

/**
 * DELETE /api/table/:tableName/:id
 * Удаление записи (заблокировано)
 */
router.delete('/api/table/:tableName/:id', async (req, res) => {
  res.status(405).json({ error: 'Удаление записей запрещено' });
});

module.exports = router;
