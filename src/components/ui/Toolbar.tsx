import { useCallback, useState } from 'react'
import { useDbModelerStore } from '../store/dbModelerStore'
import SqlExportModal from './SqlExportModal'
import '../styles/global.css'
import './Toolbar.css'

export default function Toolbar() {
  const tables = useDbModelerStore((s) => s.tables)
  const selectedNodeId = useDbModelerStore((s) => s.selectedNodeId)
  const selectedEdgeId = useDbModelerStore((s) => s.selectedEdgeId)
  const removeTable = useDbModelerStore((s) => s.removeTable)
  const removeEdge = useDbModelerStore((s) => s.removeEdge)
  const clearAll = useDbModelerStore((s) => s.clearAll)
  const addTable = useDbModelerStore((s) => s.addTable)

  const [showSqlModal, setShowSqlModal] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      removeTable(selectedNodeId)
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId)
    }
  }, [selectedNodeId, selectedEdgeId, removeTable, removeEdge])

  const handleClear = useCallback(() => {
    if (tables.length === 0) return
    setShowConfirmClear(true)
  }, [tables.length])

  const confirmClear = useCallback(() => {
    clearAll()
    setShowConfirmClear(false)
  }, [clearAll])

  const handleExport = useCallback(() => {
    setShowSqlModal(true)
  }, [])

  return (
    <>
      <div className="toolbar">
        {/* Группа: Добавление */}
        <div className="toolbar-group">
          <button
            className="btn btn-sm"
            onClick={() => addTable()}
            title="Добавить таблицу (Ctrl+N)"
          >
            ➕ Таблица
          </button>
        </div>

        {/* Разделитель */}
        <div className="toolbar-divider" />

        {/* Группа: Действия */}
        <div className="toolbar-group">
          <button
            className="btn btn-sm"
            onClick={handleDelete}
            disabled={!selectedNodeId && !selectedEdgeId}
            title="Удалить выбранное (Delete)"
          >
            🗑️ Удалить
          </button>
          <button
            className="btn btn-sm"
            onClick={handleExport}
            disabled={tables.length === 0}
            title="Экспорт SQL (Ctrl+E)"
          >
            📄 SQL Export
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={handleClear}
            disabled={tables.length === 0}
            title="Очистить всё (Ctrl+A)"
          >
            💣 Очистить
          </button>
        </div>

        {/* Spacer */}
        <div className="toolbar-spacer" />

        {/* Группа: Инфо */}
        <div className="toolbar-group toolbar-info">
          <span className="toolbar-info-item">
            📊 {tables.length} табл.
          </span>
          <span className="toolbar-info-divider">|</span>
          <span className="toolbar-info-item">
            📝 {tables.reduce((sum, t) => sum + t.fields.length, 0)} полей
          </span>
          <span className="toolbar-info-divider">|</span>
          <span className="toolbar-info-item">
            🔗 {useDbModelerStore.getState().edges.length} связ.
          </span>
        </div>
      </div>

      {/* Модалки */}
      {showSqlModal && (
        <SqlExportModal onClose={() => setShowSqlModal(false)} />
      )}

      {showConfirmClear && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: 300 }}>
            <h3>Очистить схему?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Все таблицы, поля и связи будут удалены. Это действие нельзя отменить.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowConfirmClear(false)}>
                Отмена
              </button>
              <button className="btn btn-danger" onClick={confirmClear}>
                Удалить всё
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
