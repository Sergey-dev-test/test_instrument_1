// src/pages/dashboard/Dashboard.tsx

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Управление БД</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Пользователь: {user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-sm font-medium transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Добро пожаловать!</h2>
          <p className="text-gray-600 mb-4">
            Вы вошли в систему управления структурой БД. Здесь вы можете:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Управлять подключениями к PostgreSQL и MySQL</li>
            <li>Загружать и валидировать Excel-файлы</li>
            <li>Генерировать SQL-запросы из естественного языка</li>
            <li>Создавать и экспортировать методики ведения таблиц</li>
            <li>Общаться с ИИ-агентом для анализа структуры данных</li>
          </ul>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Подключения', icon: '🔗', path: '/connections' },
            { title: 'Таблицы', icon: '📊', path: '/tables' },
            { title: 'Excel-загрузка', icon: '📄', path: '/excel' },
            { title: 'Генератор SQL', icon: '💡', path: '/sql' },
            { title: 'Методики', icon: '📝', path: '/methods' },
            { title: 'AI-чат', icon: '🤖', path: '/ai' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <span className="text-4xl mb-4">{item.icon}</span>
              <span className="font-medium text-gray-800">{item.title}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}