// src/pages/ai/AIChat.tsx

import { useState, useEffect, useRef } from 'react'
import axios from '../../services/api'
import { useNavigate } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function AIChat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я ИИ-агент. Могу помочь с анализом данных, генерацией SQL и рекомендациями по структуре таблиц.', timestamp: new Date().toLocaleTimeString() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await axios.post('/ai/chat', {
        message: userMessage.content,
        context: {} // В реальном проекте: table_id, connection_id и т.д.
      })
      const assistantMessage: Message = {
        role: 'assistant',
        content: res.data.content,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Ошибка: ${err.response?.data?.detail || 'Неизвестная ошибка'}`,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">🤖 ИИ-Агент</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:underline"
        >
          ← Назад
        </button>
      </div>

      {/* Чат-окно */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 mb-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-500 text-left'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поля ввода */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Задайте вопрос ИИ..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Отправить
        </button>
      </form>

      {/* Примеры вопросов */}
      <div className="mt-4 text-sm text-gray-500">
        <p className="font-medium mb-2">💡 Примеры вопросов:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Какие таблицы содержат больше всего данных?</li>
          <li>Сгенерируй SQL для поиска дубликатов в таблице "orders"</li>
          <li>Какие поля в таблице "users" чаще всего содержат NULL?</li>
          <li>Предложи оптимизацию для таблицы "logs"</li>
        </ul>
      </div>
    </div>
  )
}