const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db');
const ExcelJS = require('exceljs');
const { getSchema } = require('../services/schemaCache');
const { sanitizeObject } = require('../services/sanitizer');

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Допускаются только файлы Excel (.xlsx, .xls)'));
    }
  }
});

/**
 * GET /api/table/:tableName/export
 * Экспорт таблицы в CSV
 */
router.get('/api/table/:tableName/export', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Получаем все данные таблицы
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Данные не найдены' });
    }
    
    // Формируем CSV
    const headers = Object.keys(result.rows[0]);
    const csvContent = [
      headers.join(','),
      ...result.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          // Экранирование значений, содержащих запятые или кавычки
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${tableName}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting table:', error);
    res.status(500).json({ error: 'Ошибка экспорта данных' });
  }
});

/**
 * POST /api/table/:tableName/upload
 * Загрузка данных из Excel
 */
router.post('/api/table/:tableName/upload', upload.single('file'), async (req, res) => {
  try {
    const { tableName } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    // Проверка существования таблицы
    const schema = await getSchema();
    const tableSchema = schema.find(s => s.name === tableName);
    if (!tableSchema) {
      return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ error: 'Не удалось прочитать лист Excel' });
    }
    
    // Получаем заголовки из первой строки
    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers.push(cell.value ? String(cell.value).trim() : null);
    });
    
    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Обрабатываем данные начиная со второй строки
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const data = {};
      
      // Проверяем, не пустая ли строка
      let hasData = false;
      headers.forEach((header, index) => {
        if (header) {
          const cellValue = row.getCell(index + 1).value;
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasData = true;
            data[header] = cellValue;
          }
        }
      });
      
      // Пропускаем пустые строки
      if (!hasData) {
        skippedCount++;
        continue;
      }
      
      try {
        // Санитизация данных
        const sanitizedData = sanitizeObject(data);
        
        // Формируем INSERT запрос с параметрами
        const columns = Object.keys(sanitizedData);
        const values = Object.values(sanitizedData);
        const params = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const sql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${params})`;
        
        await pool.query(sql, values);
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting row ${rowNumber}:`, error.message);
        errors.push(`Строка ${rowNumber}: ${error.message}`);
        skippedCount++;
        // Продолжаем с остальными строками
      }
    }
    
    const response = { 
      message: `Обработано: ${insertedCount} вставлено, ${skippedCount} пропущено`,
      inserted: insertedCount,
      skipped: skippedCount
    };
    
    if (errors.length > 0 && errors.length <= 5) {
      response.errors = errors;
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error uploading Excel:', error);
    res.status(500).json({ error: 'Ошибка импорта данных', details: error.message });
  }
});

module.exports = router;
