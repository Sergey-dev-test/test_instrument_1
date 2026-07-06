// src/pages/methods/MethodForm.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/api';

export default function MethodForm() {
  const { tableId, methodId } = useParams<{ tableId: string; methodId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (methodId && methodId !== 'new') {
      fetchMethod();
    }
  }, [methodId]);

  const fetchMethod = async () => {
    try {
      const res = await axios.get(`/methods/${methodId}`);
      setFormData({
        title: res.data.title,
        content: res.data.content,
      });
    } catch (err: any) {
      setError('Ошибка загрузки методики');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (methodId) {
        await axios.put(`/methods/${methodId}`, formData);
      } else {
        await axios.post('/methods/', {
          ...formData,
          table_id: tableId,
        });
      }
      setSuccess(true);
      setTimeout(() => navigate(`/tables/${tableId}/methods`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800 mr-4"
        >
          ← Назад
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {methodId ? 'Редактировать методику' : 'Новая методика'}
        </h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Методика успешно сохранена
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Например: Порядок ведения таблицы заказов"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Содержание
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md h-64"
            placeholder="Опишите процесс ведения таблицы..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Сохранение...' : methodId ? 'Сохранить изменения' : 'Создать методику'}
        </button>
      </form>
    </div>
  );
}