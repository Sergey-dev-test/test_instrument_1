// src/pages/connections/ConnectionList.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../services/api';

interface Connection {
  id: string;
  name: string;
  db_type: string;
  host: string;
  database_name: string;
}

export default function ConnectionList() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await axios.get('/db/');
      setConnections(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки подключений');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      await axios.post(`/tables/sync?connection_id=${connectionId}`);
      alert('Таблицы синхронизированы!');
    } catch (err: any) {
      setError('Ошибка синхронизации: ' + (err.response?.data?.detail || 'Неизвестная ошибка'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Подключения к БД</h1>
        <Link
          to="/connections/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          + Добавить подключение
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {connections.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">Нет подключений к БД</p>
          <Link
            to="/connections/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Создать подключение
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((conn) => (
            <div key={conn.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{conn.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {conn.db_type} • {conn.host} • {conn.database_name}
              </p>
              <div className="flex justify-between items-center">
                <Link
                  to={`/tables?connection_id=${conn.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  Таблицы
                </Link>
                <button
                  onClick={() => handleSync(conn.id)}
                  className="text-green-600 hover:underline"
                >
                  🔄 Синхронизировать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}