import React, { useState, useEffect } from 'react';
import { Admin, Resource, List, Datagrid, TextField, NumberField, DateField, BooleanField, LinearProgress, Typography, Box, AppBar, TitlePortal, IconButton, Badge } from 'react-admin';
import { Card, CardContent } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

/**
 * Простая таблица для тестирования
 */
const SimpleList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="email" />
      <NumberField source="department_id" />
      <DateField source="hire_date" />
      <BooleanField source="is_active" />
    </Datagrid>
  </List>
);

/**
 * Кастомный AppBar
 */
const CustomAppBar = () => (
  <AppBar>
    <TitlePortal />
    <IconButton
      color="inherit"
      onClick={() => alert('Настройки ИИ')}
      sx={{ ml: 'auto' }}
    >
      <Badge badgeContent={localStorage.getItem('ai_config') ? '●' : null} color="primary">
        <SmartToyIcon />
      </Badge>
    </IconButton>
  </AppBar>
);

/**
 * Data Provider для работы с API
 */
const dataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const { q } = params.filter;

    let url = `/api/table/${resource}?page=${page}&limit=${perPage}`;
    if (field && order) url += `&sort=${field}&order=${order}`;
    if (q) url += `&search=${q}`;

    const response = await fetch(url);
    const { data, total } = await response.json();
    return { data, total };
  },
  create: async (resource, params) => {
    const response = await fetch(`/api/table/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    return { data: { ...result.data, id: result.data.id } };
  },
  update: async () => ({ error: 'Обновление запрещено' }),
  delete: async () => ({ error: 'Удаление запрещено' }),
};

/**
 * Основное приложение
 */
const App = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [schemas, setSchemas] = useState({});

  useEffect(() => {
    console.log('App component mounted');
    fetch('/api/schema')
      .then(res => {
        console.log('Fetch response:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Schema data:', data);
        if (data.tables) {
          setTables(data.tables.map(t => t.name));
          const schemaMap = {};
          data.tables.forEach(t => {
            schemaMap[t.name] = t;
          });
          setSchemas(schemaMap);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading schema:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Загрузка...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>Ошибка загрузки</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{error}</Typography>
        <Typography variant="body2" color="text.secondary">
          Запустите mock-сервер: <code>cd draft-tool/backend && node src/mock-server.js</code>
        </Typography>
      </Box>
    );
  }

  console.log('Rendering resources:', tables);

  const resources = tables.map(tableName => {
    console.log('Creating resource for:', tableName);
    return (
      <Resource
        key={tableName}
        name={tableName}
        list={SimpleList}
        create={() => <Typography>Создание для {tableName}</Typography>}
        edit={() => <Typography>Редактирование для {tableName}</Typography>}
        icon={() => null}
      />
    );
  });

  return (
    <Admin dataProvider={dataProvider} layout={{ appBar: CustomAppBar }}>
      {resources}
      <Resource
        name="help"
        list={() => (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Добро пожаловать в Draft Tool v1!</Typography>
              <Typography variant="body1">
                Доступные таблицы: {tables.join(', ')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Версия: 1.0.0-minimal
              </Typography>
            </CardContent>
          </Card>
        )}
        icon={() => null}
      />
    </Admin>
  );
};

export default App;
