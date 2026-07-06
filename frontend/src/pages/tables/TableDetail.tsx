// src/pages/tables/TableDetail.tsx

import { useEffect, useState } from 'react'
import axios from '../../services/api'
import { useParams, Link } from 'react-router-dom'

interface Field {
  id: string
  name: string
  data_type: string
  is_primary_key: boolean
  is_nullable: boolean
  default_value: string | null
}

interface Table {
  id: string
  name: string
  description: string | null
  row_count: number
  created_at: string
}

export default function TableDetail() {
  const { tableId } = useParams<{ tableId: string }>()
  const [table, setTable] = useState<Table | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (tableId) {
      fetchTableDetails(tableId)
    }
  }, [tableId])

  const fetchTableDetails = async (tableId: string) => {
    try {
      const [tableRes, fieldsRes] = await Promise.all([
        axios.get(`/tables/${tableId}`),
        axios.get(`/tables/${tableId}/fields`)
      ])
      setTable(tableRes.data)
      setFields(fieldsRes.data)
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err.response?.data?.detail || 'Неизвестная ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!table) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Таблица не найдена</p>
        <Link to="/tables" className="text-indigo-600 hover:underline">
          Вернуться к списку
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/tables" className="text-indigo-600 hover:underline mb-2">
          ← Назад к списку
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{table.name}</h1>
        <p className="text-gray-600 mt-1">
          {table.description || 'Описание отсутствует'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Всего строк</p>
          <p className="text-2xl font-bold text-gray-800">{table.row_count}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Полей</p>
          <p className="text-2xl font-bold text-gray-800">{fields.length}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PK</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NULL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">По умолчанию</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.map((field) => (
              <tr key={field.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {field.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {field.data_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {field.is_primary_key ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      PK
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {field.is_nullable ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      ✓
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      ✗
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {field.default_value || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}