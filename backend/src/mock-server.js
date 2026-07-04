const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Демо-данные
const demoData = {
  employees: {
    schema: {
      name: 'employees',
      columns: [
        { name: 'id', type: 'number', nullable: false, default: 'nextval(...)' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'email', type: 'text', nullable: true },
        { name: 'department_id', type: 'number', nullable: true, fk: { table: 'departments', column: 'id' } },
        { name: 'hire_date', type: 'datetime', nullable: true },
        { name: 'is_active', type: 'boolean', nullable: false, default: 'true' }
      ]
    },
    records: [
      { id: 1, name: 'Иванов Иван', email: 'ivanov@example.com', department_id: 1, hire_date: '2020-01-15', is_active: true },
      { id: 2, name: 'Петрова Мария', email: 'petrova@example.com', department_id: 2, hire_date: '2019-05-20', is_active: true },
      { id: 3, name: 'Сидоров Алексей', email: 'sidorov@example.com', department_id: 1, hire_date: '2021-03-10', is_active: true },
      { id: 4, name: 'Козлова Анна', email: 'kozlova@example.com', department_id: 3, hire_date: '2018-11-05', is_active: false },
      { id: 5, name: 'Морозов Дмитрий', email: 'morozov@example.com', department_id: 2, hire_date: '2022-07-01', is_active: true }
    ]
  },
  departments: {
    schema: {
      name: 'departments',
      columns: [
        { name: 'id', type: 'number', nullable: false, default: 'nextval(...)' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'code', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true }
      ]
    },
    records: [
      { id: 1, name: 'IT отдел', code: 'IT', description: 'Информационные технологии' },
      { id: 2, name: 'HR отдел', code: 'HR', description: 'Управление персоналом' },
      { id: 3, name: 'Финансы', code: 'FIN', description: 'Финансовый отдел' }
    ]
  },
  products: {
    schema: {
      name: 'products',
      columns: [
        { name: 'id', type: 'number', nullable: false, default: 'nextval(...)' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'price', type: 'number', nullable: false },
        { name: 'quantity', type: 'number', nullable: false },
        { name: 'created_at', type: 'datetime', nullable: false }
      ]
    },
    records: [
      { id: 1, name: 'Ноутбук Dell', price: 45000, quantity: 10, created_at: '2023-01-15' },
      { id: 2, name: 'Монитор LG', price: 15000, quantity: 25, created_at: '2023-02-20' },
      { id: 3, name: 'Клавиатура', price: 3000, quantity: 50, created_at: '2023-03-10' },
      { id: 4, name: 'Мышь Logitech', price: 2500, quantity: 100, created_at: '2023-04-05' }
    ]
  }
};

// GET /api/schema
app.get('/api/schema', (req, res) => {
  const tables = Object.values(demoData).map(d => d.schema);
  res.json({ tables });
});

// GET /api/table/:tableName
app.get('/api/table/:tableName', (req, res) => {
  const { tableName } = req.params;
  const { page = 1, limit = 20, sort, order = 'desc', search } = req.query;
  
  const table = demoData[tableName];
  if (!table) {
    return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
  }

  let records = [...table.records];
  
  // Поиск
  if (search) {
    records = records.filter(r => 
      Object.values(r).some(v => 
        String(v).toLowerCase().includes(search.toLowerCase())
      )
    );
  }

  // Сортировка
  if (sort) {
    records.sort((a, b) => {
      if (a[sort] < b[sort]) return order === 'asc' ? -1 : 1;
      if (a[sort] > b[sort]) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const total = records.length;
  const offset = (page - 1) * limit;
  const paginated = records.slice(offset, offset + parseInt(limit));

  res.json({
    data: paginated,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// GET /api/table/:tableName/schema
app.get('/api/table/:tableName/schema', (req, res) => {
  const { tableName } = req.params;
  const table = demoData[tableName];
  
  if (!table) {
    return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
  }
  
  res.json(table.schema);
});

// POST /api/table/:tableName
app.post('/api/table/:tableName', (req, res) => {
  const { tableName } = req.params;
  const table = demoData[tableName];
  
  if (!table) {
    return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
  }

  const newRecord = {
    ...req.body,
    id: Math.max(...table.records.map(r => r.id)) + 1
  };
  
  table.records.push(newRecord);
  
  res.status(201).json({
    data: newRecord,
    message: 'Запись успешно добавлена'
  });
});

// PUT - заблокировано
app.put('/api/table/:tableName/:id', (req, res) => {
  res.status(403).json({ error: 'Обновление существующих записей запрещено' });
});

// DELETE - заблокировано
app.delete('/api/table/:tableName/:id', (req, res) => {
  res.status(405).json({ error: 'Удаление записей запрещено' });
});

// GET /api/table/:tableName/export
app.get('/api/table/:tableName/export', (req, res) => {
  const { tableName } = req.params;
  const table = demoData[tableName];
  
  if (!table) {
    return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
  }

  const headers = Object.keys(table.records[0]);
  const csvContent = [
    headers.join(','),
    ...table.records.map(row => 
      headers.map(header => {
        const value = row[header];
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
});

// GET /api/table/:tableName/methodology
app.get('/api/table/:tableName/methodology', (req, res) => {
  const { tableName } = req.params;
  const table = demoData[tableName];
  
  if (!table) {
    return res.status(404).json({ error: `Таблица "${tableName}" не найдена` });
  }

  const lines = [];
  lines.push(`# Методика ведения таблицы: ${tableName}`);
  lines.push('');
  lines.push('## 1. Назначение таблицы');
  lines.push(`Таблица "${tableName}" предназначена для хранения справочных данных.`);
  lines.push('');
  lines.push('## 2. Структура полей');
  lines.push('');
  lines.push('| Поле | Тип | Обязательное | Описание |');
  lines.push('|------|-----|--------------|----------|');
  
  table.schema.columns.forEach(col => {
    const isRequired = !col.nullable && !col.default?.includes('nextval');
    lines.push(`| ${col.name} | ${col.type} | ${isRequired ? 'Да' : 'Нет'} | ${col.fk ? 'FK → ' + col.fk.table : 'Значение'} |`);
  });
  
  lines.push('');
  lines.push('## 3. Правила заполнения');
  lines.push('');
  lines.push('- ✅ Допускается добавление новых записей');
  lines.push('- ❌ Изменение существующих записей запрещено');
  lines.push('- ❌ Удаление существующих записей запрещено');
  lines.push('');
  lines.push(`---`);
  lines.push(`*Методика сгенерирована автоматически: ${new Date().toLocaleString('ru-RU')}*`);

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(lines.join('\n'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'DEMO - без подключения к БД'
  });
});

console.log('🚀 DEMO сервер запущен на порту ' + PORT);
console.log('📊 Демо-данные: employees, departments, products');
console.log('🌐 Откройте http://localhost:3000');

app.listen(PORT, () => {
  console.log(`✅ Backend DEMO запущен: http://localhost:${PORT}`);
});
