// src/pages/connections/ConnectionForm.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/api';

interface Connection {
  id?: string;
  name: string;
  db_type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
}

const DB_TYPES = [
  { value: 'POSTGRES', label: 'PostgreSQL' },
  { value: 'MYSQL', label: 'MySQL' },
];

export default function ConnectionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<Connection>({
    name: '',
    db_type: 'POSTGRES',
    host: 'localhost',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    if (id) {
      fetchConnection(id);
    }
  }, [id]);

  const fetchConnection = async (connectionId: string) => {
    try {
      const res = await axios.get(`/db/${connectionId}`);
      setFormData(res.data);
    } catch (err: any) {
      setError('Ошибка загрузки подключения');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.name === 'port' ? parseInt(e.target.value) : e.target.value,
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('');
    setError('');
    try {
      const res = await axios.post('/db/test-connection', {
        name: formData.name || 'test',
        db_type: formData.db_type,
        host: formData.host,
        port: formData.port,
        database_name: formData.database_name,
        username: formData.username,
        password: formData.password,
      });
      setTestResult('✅ ' + res.data.message);
    } catch (err: any) {
      setTestResult('❌ ' + (err.response?.data?.detail || 'Ошибка подключения'));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (id) {
        await axios.put(`/db/${id}`, formData);
      } else {
        await axios.post('/db/', formData);
      }
      setSuccess(true);
      setTimeout(() => navigate('/connections'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800 mr-4"
        >
          ← Назад
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {id ? 'Редактировать подключение' : 'Новое подключение'}
        </h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Подключение успешно сохранено
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Название</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Например: БД заказов (PostgreSQL)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Тип СУБД</label>
          <select
            name="db_type"
            value={formData.db_type}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {DB_TYPES.map((db) => (
              <option key={db.value} value={db.value}>{db.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Хост</label>
            <input
              name="host"
              value={formData.host}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Порт</label>
            <input
              name="port"
              type="number"
              value={formData.port}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Имя БД</label>
          <input
            name="database_name"
            value={formData.database_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="my_database"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Пользователь</label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="postgres"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Пароль</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="••••••••"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : id ? 'Сохранить изменения' : 'Создать подключение'}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isTesting ? 'Тестирование...' : '🔌 Тест подключения'}
          </button>
        </div>

        {testResult && (
          <div className={`px-4 py-3 rounded ${testResult.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {testResult}
          </div>
        )}
      </form>
    </div>
  );
}