// src/pages/methods/MethodList.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/api';

interface Method {
  id: string;
  title: string;
  content: string;
  format: 'TXT' | 'PDF';
  created_at: string;
  updated_at: string;
}

export default function MethodList() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<Method[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMethods();
  }, [tableId]);

  const fetchMethods = async () => {
    try {
      const url = tableId
        ? `/methods/?table_id=${tableId}`
        : '/methods/';
      const res = await axios.get(url);
      setMethods(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки методик');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (methodId: string) => {
    try {
      const res = await axios.post(`/methods/${methodId}/export/pdf`, {}, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `method_${methodId}.pdf`;
      link.click();
      URL.revokeObjectURL(url); // Освобождение памяти
    } catch (err: any) {
      setError('Ошибка экспорта PDF: ' + (err.response?.data?.detail || 'Неизвестная ошибка'));
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Методики для таблицы #{tableId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление методиками ведения таблицы
          </p>
        </div>
        <button
          onClick={() => navigate(tableId ? `/tables/${tableId}/methods/new` : '/methods/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <span className="mr-2">+</span>
          Добавить методику
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {methods.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">
            Нет методик для этой таблицы
          </p>
          <button
            onClick={() => navigate(tableId ? `/tables/${tableId}/methods/new` : '/methods/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Создать первую методику
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map((method) => (
            <div key={method.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
                  {method.title}
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {method.format}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                {method.content}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
                <span>Обновлено: {new Date(method.updated_at).toLocaleDateString()}</span>
                <button
                  onClick={() => handleExport(method.id)}
                  className="text-green-600 hover:text-green-800 hover:underline flex items-center"
                >
                  <span className="mr-1">📄</span> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}