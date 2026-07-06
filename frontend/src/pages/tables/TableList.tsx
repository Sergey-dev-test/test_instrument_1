// src/pages/tables/TableList.tsx

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../../services/api';

interface Table {
  id: string;
  name: string;
  description: string;
  row_count: number;
}

export default function TableList() {
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connection_id');
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTables();
  }, [connectionId]);

  const fetchTables = async () => {
    try {
      const res = connectionId
        ? await axios.get(`/tables?connection_id=${connectionId}`)
        : await axios.get('/tables');
      setTables(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки таблиц');
    } finally {
      setIsLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-800">
          {connectionId ? 'Таблицы подключения' : 'Таблицы БД'}
        </h1>
        <div className="flex space-x-2">
          <Link
            to="/excel"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            📊 Загрузить Excel
          </Link>
          <Link
            to="/sql"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📝 Генератор SQL
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {tables.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">
            {connectionId ? 'Нет таблиц в подключении' : 'Нет таблиц. Добавьте подключение и синхронизируйте.'}
          </p>
          {!connectionId && (
            <Link
              to="/connections"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Добавить подключение
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Строк</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map((table) => (
                <tr key={table.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {table.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.row_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/tables/${table.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Детали
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}