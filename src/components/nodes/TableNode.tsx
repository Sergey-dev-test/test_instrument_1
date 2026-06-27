import { memo, useState, useCallback, useRef, useEffect } from 'react'
import type { NodeProps } from 'reactflow'
import type { DbField, FieldCategory } from '../../types/database'
import { FIELD_TYPE_CATEGORIES, FIELD_TYPE_LABELS } from '../../types/database'
import { useDbModelerStore } from '../../store/dbModelerStore'
import './TableNode.css'

// ─── Цвета по категориям ─────────────────────────────────────

const FIELD_COLORS: Record<FieldCategory, { bg: string; border: string; text: string }> = {
  number: {
    bg: 'var(--color-type-number)',
    border: 'var(--color-type-number-border)',
    text: 'var(--color-type-number-text)',
  },
  string: {
    bg: 'var(--color-type-string)',
    border: 'var(--color-type-string-border)',
    text: 'var(--color-type-string-text)',
  },
  date: {
    bg: 'var(--color-type-date)',
    border: 'var(--color-type-date-border)',
    text: 'var(--color-type-date-text)',
  },
  boolean: {
    bg: 'var(--color-type-boolean)',
    border: 'var(--color-type-boolean-border)',
    text: 'var(--color-type-boolean-text)',
  },
}

// ─── Иконки для категорий ─────────────────────────────────────

const CATEGORY_ICONS: Record<FieldCategory, string> = {
  number: '123',
  string: 'ABC',
  date: '📅',
  boolean: '✓',
}

// ─── Компонент поля ───────────────────────────────────────────

interface FieldRowProps {
  field: DbField
  tableId: string
  onEditName: (fieldId: string, name: string) => void
  onRemove: (fieldId: string) => void
}

const FieldRow = memo(({ field, tableId, onEditName, onRemove }: FieldRowProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(field.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const category = FIELD_TYPE_CATEGORIES[field.type]
  const colors = FIELD_COLORS[category]

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== field.name) {
      onEditName(field.id, editValue.trim())
    } else {
      setEditValue(field.name)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setEditValue(field.name)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={`field-row ${field.isPrimaryKey ? 'primary-key' : ''}`}
      style={{
        borderLeft: field.isPrimaryKey
          ? '3px solid #f59e0b'
          : `2px solid ${colors.border}`,
        backgroundColor: colors.bg,
      }}
    >
      {/* Левый маркер связи (handle) */}
      <div className="field-handle field-handle-source" data-field-id={field.id} />
      <div field-id={field.id} className="field-handle field-handle-target" />

      {/* Иконка типа */}
      <span className="field-icon" style={{ color: colors.text }}>
        {CATEGORY_ICONS[category]}
      </span>

      {/* Имя поля */}
      {isEditing ? (
        <input
          ref={inputRef}
          className="field-name-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className="field-name"
          style={{ fontWeight: field.isPrimaryKey ? 700 : 400 }}
          onDoubleClick={handleDoubleClick}
          title="Двойной клик для редактирования"
        >
          {field.name}
        </span>
      )}

      {/* Тип */}
      <span className="field-type">{FIELD_TYPE_LABELS[field.type]}</span>

      {/* Бейджи */}
      <div className="field-badges">
        {field.isPrimaryKey && <span className="badge pk" title="Primary Key">🔒</span>}
        {field.isNotNull && <span className="badge nn" title="NOT NULL">NN</span>}
        {field.isAutoIncrement && <span className="badge ai" title="Auto Increment">AI</span>}
      </div>

      {/* Кнопка удаления */}
      <button
        className="field-remove-btn"
        onClick={() => onRemove(field.id)}
        title="Удалить поле"
      >
        ×
      </button>
    </div>
  )
})

// ─── Компонент таблицы (ноды React Flow) ──────────────────────

interface TableNodeProps extends NodeProps {
  data: { table: { id: string; name: string; x: number; y: number; fields: DbField[] } }
}

const TableNode = memo(({ data, id, selected }: TableNodeProps) => {
  const { name, fields, x, y } = data.table
  const updateTable = useDbModelerStore((s) => s.updateTable)
  const removeField = useDbModelerStore((s) => s.removeField)
  const updateField = useDbModelerStore((s) => s.updateField)

  const handleEditName = useCallback(
    (fieldId: string, newName: string) => {
      updateField(id, fieldId, { name: newName })
    },
    [id, updateField]
  )

  const handleRemoveField = useCallback(
    (fieldId: string) => {
      removeField(id, fieldId)
    },
    [id, removeField]
  )

  return (
    <div
      className={`table-node ${selected ? 'selected' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Заголовок */}
      <div className="table-header">
        <span className="table-name">{name}</span>
        <span className="table-field-count">{fields.length} поле{fields.length === 1 ? '' : fields.length < 5 ? 'а' : 'й'}</span>
      </div>

      {/* Разделитель */}
      <div className="table-divider" />

      {/* Поля */}
      <div className="table-fields">
        {fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            tableId={id}
            onEditName={handleEditName}
            onRemove={handleRemoveField}
          />
        ))}
      </div>

      {/* Маркеры связей справа */}
      <div className="table-handles-right">
        {fields.map((field) => (
          <div
            key={`handle-right-${field.id}`}
            className="field-handle field-handle-target"
            data-field-id={field.id}
          />
        ))}
      </div>
    </div>
  )
})

export default TableNode
