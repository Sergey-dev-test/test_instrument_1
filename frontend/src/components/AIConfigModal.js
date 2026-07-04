import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AIChat from './AIChat';

/**
 * Предустановленные провайдеры ИИ
 */
const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    url: 'https://api.openai.com/v1/chat/completions',
    keyField: 'openai_api_key',
    modelField: 'openai_model',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    url: 'https://api.anthropic.com/v1/messages',
    keyField: 'anthropic_api_key',
    modelField: 'anthropic_model',
    models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    url: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2023-05-15',
    keyField: 'azure_api_key',
    modelField: 'azure_deployment',
    models: [],
  },
  {
    id: 'custom',
    name: 'Свой API',
    url: '',
    keyField: 'custom_api_key',
    modelField: 'custom_model',
    models: [],
  },
];

/**
 * Модальное окно настройки ИИ
 */
const AIConfigModal = ({ open, onClose }) => {
  const [provider, setProvider] = useState('openai');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState(
    'Ты - помощник по работе со справочными данными. Помогай пользователю анализировать, создавать и редактировать данные в таблицах.'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Загрузка сохранённых настроек
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setProvider(config.provider || 'openai');
        setApiUrl(config.apiUrl || '');
        setApiKey(config.apiKey || '');
        setModel(config.model || '');
        setTemperature(config.temperature || 0.7);
        setMaxTokens(config.maxTokens || 2048);
        setSystemPrompt(config.systemPrompt || systemPrompt);
      } catch (e) {
        console.error('Error loading AI config:', e);
      }
    }
  }, []);

  // Применение выбранного провайдера
  useEffect(() => {
    const selected = AI_PROVIDERS.find(p => p.id === provider);
    if (selected && !apiUrl) {
      setApiUrl(selected.url);
      if (selected.models.length > 0 && !model) {
        setModel(selected.models[0]);
      }
    }
  }, [provider]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Введите API ключ');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const config = {
        provider,
        apiUrl,
        apiKey,
        model,
        temperature,
        maxTokens,
        systemPrompt,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('ai_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim() || !apiUrl.trim()) {
      setError('Введите API ключ и URL');
      return;
    }

    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      let headers = {
        'Content-Type': 'application/json',
      };

      // Добавляем авторизацию в зависимости от провайдера
      if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: 'Привет! Ответь "OK" если ты работаешь.' },
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Подключение успешно!' });
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: `Ошибка ${response.status}: ${errorData.error?.message || errorData.message || 'Неизвестная ошибка'}`,
        });
        setError('Тест подключения не прошёл');
      }
    } catch (e) {
      setTestResult({ success: false, message: e.message });
      setError('Ошибка подключения');
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('ai_config');
    setProvider('openai');
    setApiUrl('');
    setApiKey('');
    setModel('');
    setTemperature(0.7);
    setMaxTokens(2048);
    setSystemPrompt(
      'Ты - помощник по работе со справочными данными. Помогай пользователю анализировать, создавать и редактировать данные в таблицах.'
    );
    setTestResult(null);
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.id === provider);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 700,
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        overflow: 'auto',
      }}>
        {/* Заголовок */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon fontSize="large" color="primary" />
            <Typography variant="h5" component="h2">
              Настройка ИИ-помощника
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Проводер */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Провайдер ИИ</InputLabel>
          <Select
            value={provider}
            label="Провайдер ИИ"
            onChange={(e) => setProvider(e.target.value)}
          >
            {AI_PROVIDERS.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* URL API */}
        <TextField
          label="URL API"
          fullWidth
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          sx={{ mb: 3 }}
          helperText={selectedProvider?.url && !apiUrl ? `Шаблон: ${selectedProvider.url}` : ''}
        />

        {/* API Ключ */}
        <TextField
          label="API Ключ"
          type="password"
          fullWidth
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          sx={{ mb: 3 }}
          helperText="Ваш API ключ для доступа к ИИ-сервису"
        />

        {/* Модель */}
        {selectedProvider?.models.length > 0 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Модель</InputLabel>
            <Select
              value={model}
              label="Модель"
              onChange={(e) => setModel(e.target.value)}
            >
              {selectedProvider.models.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Кастомная модель */}
        {(selectedProvider?.models.length === 0 || !selectedProvider) && (
          <TextField
            label="Модель"
            fullWidth
            value={model}
            onChange={(e) => setModel(e.target.value)}
            sx={{ mb: 3 }}
            placeholder="gpt-3.5-turbo или ваша модель"
          />
        )}

        <Divider sx={{ my: 2 }} />

        {/* Параметры */}
        <Typography variant="subtitle1" gutterBottom>Параметры генерации</Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Temperature"
            type="number"
            inputProps={{ min: 0, max: 2, step: 0.1 }}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
            sx={{ flex: 1 }}
            helperText="Креативность (0-2)"
          />
          <TextField
            label="Max Tokens"
            type="number"
            inputProps={{ min: 1, max: 8192 }}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
            sx={{ flex: 1 }}
            helperText="Макс. длина ответа"
          />
        </Stack>

        {/* System Prompt */}
        <TextField
          label="System Prompt"
          fullWidth
          multiline
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          sx={{ mb: 3 }}
          helperText="Инструкция для ИИ о том, как себя вести"
        />

        <Divider sx={{ my: 2 }} />

        {/* Кнопки действий */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving && <CircularProgress size={20} />}
          >
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </Button>

          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={testing}
            startIcon={testing && <CircularProgress size={20} />}
          >
            {testing ? 'Проверка...' : '🔍 Проверить подключение'}
          </Button>

          <Button
            variant="text"
            onClick={handleClear}
          >
            🗑 Очистить настройки
          </Button>
        </Stack>

        {/* Результаты */}
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Настройки ИИ сохранены
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {testResult && (
          <Alert
            severity={testResult.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {testResult.message}
          </Alert>
        )}

        {/* Подсказка */}
        <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Совет:</strong> После сохранения настроек нажмите "Проверить подключение", 
            чтобы убедиться, что ИИ-сервис доступен. Если всё работает, вы сможете использовать 
            ИИ-помощника через кнопку "🤖 ИИ" в верхней панели.
          </Typography>
        </Paper>
      </Box>
    </Modal>
  );
};

export default AIConfigModal;
