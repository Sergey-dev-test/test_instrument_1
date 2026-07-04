import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
  Divider,
  Stack,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Компонент чата с ИИ
 */
const AIChat = ({ config, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Загрузка истории чата
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai_chat_history');
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    }
  }, []);

  // Автоскролл вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Сохранение истории
  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  const formatMessage = (content) => {
    // Простое форматирование Markdown
    return content
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      .replace(/`(.*?)`/g, '`$1`')
      .replace(/\n/g, '\n');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    // Создаём новый AbortController для отмены
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Формируем историю для отправки
      const historyForAI = messages.length > 10 
        ? messages.slice(-10) // Последние 10 сообщений
        : messages;

      const systemMessage = {
        role: 'system',
        content: config.systemPrompt || 'Ты - помощник по работе со справочными данными.',
      };

      const messagesForAPI = [systemMessage, ...historyForAI, userMessage];

      let response;
      let data;

      if (config.provider === 'anthropic') {
        // Anthropic API
        response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: config.model || 'claude-3-haiku-20240307',
            max_tokens: config.maxTokens || 2048,
            system: config.systemPrompt,
            messages: historyForAI.map(m => ({
              role: m.role === 'system' ? 'assistant' : m.role,
              content: m.content,
            })),
          }),
        });
      } else {
        // OpenAI и совместимые API
        response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: config.model || 'gpt-3.5-turbo',
            messages: messagesForAPI.map(m => ({
              role: m.role,
              content: m.content,
            })),
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2048,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Ошибка ${response.status}`);
      }

      data = await response.json();

      let assistantContent = '';
      if (config.provider === 'anthropic') {
        assistantContent = data.content?.[0]?.text || 'Нет ответа';
      } else {
        assistantContent = data.choices?.[0]?.message?.content || 'Нет ответа';
      }

      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setError('');

    } catch (e) {
      if (e.name === 'AbortError') {
        // Пользователь отменил запрос
        return;
      }
      setError(e.message || 'Ошибка при отправке запроса');
    } finally {
      setLoading(false);
      setAbortController(null);
      inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Очистить историю чата?')) {
      setMessages([]);
      localStorage.removeItem('ai_chat_history');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
      {/* Заголовок */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon />
          <Typography variant="h6">ИИ-помощник</Typography>
          {loading && <CircularProgress size={20} color="inherit" />}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Очистить чат">
            <IconButton size="small" onClick={handleClear} sx={{ color: 'white' }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Закрыть">
              <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Сообщения */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
          }}>
            <SmartToyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" gutterBottom>ИИ-помощник готов</Typography>
            <Typography variant="body2" align="center" sx={{ maxWidth: 400 }}>
              Задайте вопрос о ваших данных, попросите помочь с анализом или генерацией SQL-запросов
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'assistant' && (
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon fontSize="small" />
                </Avatar>
              )}
              
              <Box sx={{ maxWidth: '70%' }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {formatMessage(msg.content)}
                  </Typography>
                </Paper>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mt: 0.5,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU')}
                  </Typography>
                  {msg.role === 'assistant' && (
                    <Tooltip title="Копировать">
                      <IconButton size="small" onClick={() => handleCopy(msg.content)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {msg.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
              )}
            </Box>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Ошибка */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Поле ввода */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            variant="outlined"
            size="small"
          />
          {loading ? (
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleCancel}
              sx={{ minWidth: '80px' }}
            >
              Отмена
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!input.trim()}
              endIcon={<SendIcon />}
              sx={{ minWidth: '80px' }}
            >
              Отправить
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default AIChat;
