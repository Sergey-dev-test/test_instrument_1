// src/pages/sql/SQLGenerator.tsx

import { useState } from 'react';
import axios from '../../services/api';

export default function SQLGenerator() {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [tableName, setTableName] = useState('');
  const [dbType, setDbType] = useState('POSTGRES');
  const [generatedSql, setGeneratedSql] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!naturalLanguage.trim() || !tableName.trim()) {
      setError('Введите запрос и имя таблицы');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('/sql/generate', {
        natural_language: naturalLanguage,
        table_name: tableName,
        db_type: dbType,
        connection_id: '',
      });

      setGeneratedSql(res.data.sql);
      if (res.data.description) {
        setDescription(res.data.description);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка генерации SQL');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSql);
    alert('SQL скопирован в буфер обмена!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Генератор SQL</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Входные данные</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Естественный запрос
              </label>
              <textarea
                value={naturalLanguage}
                onChange={(e) => setNaturalLanguage(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                placeholder="Покажи активных пользователей"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя таблицы
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="users"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип СУБД
              </label>
              <select
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="POSTGRES">PostgreSQL</option>
                <option value="MYSQL">MySQL</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Генерация...' : 'Сгенерировать SQL'}
            </button>
          </div>
        </div>

        {generatedSql && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Результат</h2>

            <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-2">{description}</p>
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {generatedSql}
              </pre>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              📋 Скопировать SQL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}