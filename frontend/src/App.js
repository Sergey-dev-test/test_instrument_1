import React, { useState, useEffect } from 'react';
import { Admin, Resource, fetchUtils, Layout, AppBar, TitlePortal } from 'react-admin';
import { Typography, IconButton, Badge } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import dataProvider from './providers/dataProvider';
import { DynamicTable, DynamicCreate } from './components/DynamicTable';
import TableSchema from './components/TableSchema';
import AIConfigModal from './components/AIConfigModal';
import AIChat from './components/AIChat';

/**
 * Кастомный AppBar с кнопкой ИИ
 */
const CustomAppBar = () => (
  <AppBar>
    <TitlePortal />
    <IconButton
      color="inherit"
      onClick={() => {
        const event = new CustomEvent('open-ai-config');
        window.dispatchEvent(event);
      }}
      sx={{ ml: 'auto' }}
    >
      <Badge badgeContent={localStorage.getItem('ai_config') ? '●' : null} color="primary">
        <SmartToyIcon />
      </Badge>
    </IconButton>
    <IconButton
      color="inherit"
      onClick={() => {
        const event = new CustomEvent('open-ai-chat');
        window.dispatchEvent(event);
      }}
    >
      <SmartToyIcon />
    </IconButton>
  </AppBar>
);

const App = () => {
  const [tables, setTables] = useState([]);
  const [schemas, setSchemas] = useState({});
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiConfig, setAiConfig] = useState(null);

  // Загрузка схемы при монтировании
  useEffect(() => {
    fetch('/api/schema')
      .then(res => res.json())
      .then(data => {
        if (data.tables) {
          setTables(data.tables.map(t => t.name));
          const schemaMap = {};
          data.tables.forEach(t => {
            schemaMap[t.name] = t;
          });
          setSchemas(schemaMap);
        }
      })
      .catch(err => console.error('Error loading schema:', err));
  }, []);

  // Загрузка конфигурации ИИ
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      try {
        setAiConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error loading AI config:', e);
      }
    }
  }, []);

  // Обработчики событий для открытия модалок
  useEffect(() => {
    const handleOpenAIConfig = () => setShowAIConfig(true);
    const handleOpenAIChat = () => setShowAIChat(true);

    window.addEventListener('open-ai-config', handleOpenAIConfig);
    window.addEventListener('open-ai-chat', handleOpenAIChat);

    return () => {
      window.removeEventListener('open-ai-config', handleOpenAIConfig);
      window.removeEventListener('open-ai-chat', handleOpenAIChat);
    };
  }, []);

  // Рендер ресурсов
  const resources = tables.map(tableName => (
    <Resource
      key={tableName}
      name={tableName}
      list={() => <DynamicTable resource={tableName} schema={schemas[tableName]} />}
      create={() => <DynamicCreate resource={tableName} schema={schemas[tableName]} />}
      edit={() => null} // Отключаем редактирование
      remove={() => null} // Отключаем удаление
      icon={() => null}
    />
  ));

  return (
    <Admin dataProvider={dataProvider} layout={{ appBar: CustomAppBar }}>
      {resources}
      <Resource
        name="schema"
        list={() => <Typography>Выберите таблицу</Typography>}
        icon={() => null}
      />
      
      {/* Модальное окно настроек ИИ */}
      <AIConfigModal
        open={showAIConfig}
        onClose={() => setShowAIConfig(false)}
      />

      {/* Модальное окно чата ИИ */}
      {showAIChat && aiConfig && (
        <AIChat
          config={aiConfig}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {/* Если чат открыт, но нет конфигурации */}
      {showAIChat && !aiConfig && (
        <AIConfigModal
          open={true}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </Admin>
  );
};

export default App;
