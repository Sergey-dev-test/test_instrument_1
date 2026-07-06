// src/pages/excel/ExcelUpload.tsx

import { useState } from 'react';
import axios from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface ValidationField {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  max_length?: number;
}

interface ExcelUploadResult {
  table_name: string;
  row_count: number;
  fields: ValidationField[];
  errors: string[];
  warnings: string[];
}

export default function ExcelUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ExcelUploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setParsedData(null);
      setError('');
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/excel/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setParsedData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка парсинга Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedData) return;
    setIsLoading(true);

    try {
      await axios.post('/excel/confirm', {
        table_name: parsedData.table_name,
        fields: parsedData.fields,
        row_count: parsedData.row_count,
      });

      setSuccess(true);
      setTimeout(() => navigate('/tables'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Загрузка Excel</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Таблица успешно загружена!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!parsedData ? (
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите Excel-файл (.xlsx, .xls)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <button
            onClick={handleParse}
            disabled={!file || isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Анализ...' : 'Анализировать'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Результат анализа: {parsedData.table_name}
            </h2>

            <div className="text-sm text-gray-500 mb-4">
              Строк: <strong>{parsedData.row_count}</strong> | Ошибок: <strong>{parsedData.errors.length}</strong> | Предупреждений: <strong>{parsedData.warnings.length}</strong>
            </div>

            <h3 className="font-medium text-gray-900 mb-2">Поля:</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">PK</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">NULL</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.fields.map((field, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">{field.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{field.data_type}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-500">
                      {field.is_primary_key ? '✅' : '❌'}
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-gray-500">
                      {field.is_nullable ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {parsedData.warnings.length > 0 && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Предупреждения:</h4>
                <ul className="list-disc pl-5 text-sm text-yellow-700">
                  {parsedData.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setParsedData(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || parsedData.errors.length > 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Сохранение...' : 'Сохранить таблицу'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}