const express = require('express');
const router = express.Router();
const { getSchema, refreshSchema } = require('../services/schemaCache');

/**
 * GET /api/schema
 * Получение всех схем таблиц
 */
router.get('/api/schema', async (req, res) => {
  try {
    const schema = await getSchema();
    res.json({ tables: schema });
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: 'Ошибка при получении схемы' });
  }
});

/**
 * POST /api/refresh-schema
 * Обновление кеша схемы
 */
router.post('/api/refresh-schema', async (req, res) => {
  try {
    const schema = await refreshSchema();
    res.json({ 
      message: 'Кеш схемы обновлен',
      tables: schema.map(t => t.name)
    });
  } catch (error) {
    console.error('Error refreshing schema:', error);
    res.status(500).json({ error: 'Ошибка при обновлении схемы' });
  }
});

module.exports = router;
