import { useDbModelerStore } from '../../store/dbModelerStore'
import type { FieldType } from '../../types/database'
import { FIELD_TYPE_LABELS, FIELD_TYPE_CATEGORIES } from '../../types/database'
import '../../styles/global.css'
import './Sidebar.css'

// ─── Доступные типы полей ─────────────────────────────────────

const NUMBER_TYPES: FieldType[] = ['int', 'bigint', 'smallint', 'float', 'decimal']
const STRING_TYPES: FieldType[] = ['varchar', 'text', 'char', 'uuid']
const DATE_TYPES: FieldType[] = ['date', 'time', 'datetime', 'timestamp']
const BOOL_TYPES: FieldType[] = ['boolean']

export default function Sidebar() {
  const addTable = useDbModelerStore((s) => s.addTable)
  const addField = useDbModelerStore((s) => s.addField)
  const tables = useDbModelerStore((s) => s.tables)
  const selectedNodeId = useDbModelerStore((s) => s.selectedNodeId)

  const handleAddField = (type: FieldType) => {
    if (selectedNodeId) {
      addField(selectedNodeId, type)
    }
  }

  return (
    <div className="sidebar">
      {/* Заголовок */}
      <div className="sidebar-header">
        <h2>🗄️ DB Modeler</h2>
      </div>

      {/* Добавление таблицы */}
      <div className="sidebar-section">
        <h3>Таблицы</h3>
        <button className="btn btn-primary btn-block" onClick={() => addTable()}>
          + Добавить таблицу
        </button>
      </div>

      {/* Добавление поля — по категориям */}
      <div className="sidebar-section">
        <h3>Добавить поле</h3>
        {selectedNodeId && (
          <p className="sidebar-hint">
            Выбрана таблица: <strong>{tables.find((t) => t.id === selectedNodeId)?.name || '...'}</strong>
          </p>
        )}
        {!selectedNodeId && (
          <p className="sidebar-hint sidebar-hint-warn">
            ⚠ Выберите таблицу для добавления поля
          </p>
        )}

        {/* Числа */}
        <div className="type-group">
          <span className="type-group-label">🔵 Числа</span>
          <div className="type-group-buttons">
            {NUMBER_TYPES.map((type) => (
              <button
                key={type}
                className="type-btn type-btn-number"
                onClick={() => handleAddField(type)}
                disabled={!selectedNodeId}
                title={`Добавить поле типа ${FIELD_TYPE_LABELS[type]}`}
              >
                {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Строки */}
        <div className="type-group">
          <span className="type-group-label">🟢 Строки</span>
          <div className="type-group-buttons">
            {STRING_TYPES.map((type) => (
              <button
                key={type}
                className="type-btn type-btn-string"
                onClick={() => handleAddField(type)}
                disabled={!selectedNodeId}
                title={`Добавить поле типа ${FIELD_TYPE_LABELS[type]}`}
              >
                {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Даты */}
        <div className="type-group">
          <span className="type-group-label">🟡 Даты</span>
          <div className="type-group-buttons">
            {DATE_TYPES.map((type) => (
              <button
                key={type}
                className="type-btn type-btn-date"
                onClick={() => handleAddField(type)}
                disabled={!selectedNodeId}
                title={`Добавить поле типа ${FIELD_TYPE_LABELS[type]}`}
              >
                {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Булевы */}
        <div className="type-group">
          <span className="type-group-label">🟣 Булевы</span>
          <div className="type-group-buttons">
            {BOOL_TYPES.map((type) => (
              <button
                key={type}
                className="type-btn type-btn-boolean"
                onClick={() => handleAddField(type)}
                disabled={!selectedNodeId}
                title={`Добавить поле типа ${FIELD_TYPE_LABELS[type]}`}
              >
                {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="sidebar-section sidebar-section-info">
        <h3>Статистика</h3>
        <div className="stat-row">
          <span>Таблиц:</span>
          <span className="stat-value">{tables.length}</span>
        </div>
        <div className="stat-row">
          <span>Полей:</span>
          <span className="stat-value">{tables.reduce((sum, t) => sum + t.fields.length, 0)}</span>
        </div>
        <div className="stat-row">
          <span>Связей:</span>
          <span className="stat-value">{useDbModelerStore.getState().edges.length}</span>
        </div>
      </div>
    </div>
  )
}
