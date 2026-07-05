import { useCallback, useRef, useEffect } from 'react'
import { generateSQL } from '../../utils/sqlGenerator'
import { useDbModelerStore } from '../../store/dbModelerStore'
import '../../styles/global.css'
import './SqlExportModal.css'

export default function SqlExportModal({ onClose }: { onClose: () => void }) {
  const tables = useDbModelerStore((s) => s.tables)
  const edges = useDbModelerStore((s) => s.edges)
  const sql = generateSQL(tables, edges)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleCopy = useCallback(() => {
    textareaRef.current?.select()
    navigator.clipboard.writeText(sql)
  }, [sql])

  const handleDownload = useCallback(() => {
    const blob = new Blob([sql], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'database_schema.sql'
    a.click()
    URL.revokeObjectURL(url)
  }, [sql])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay">
      <div className="modal sql-modal">
        <div className="sql-modal-header">
          <h3>SQL-скрипт</h3>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>

        <textarea
          ref={textareaRef}
          className="sql-output"
          value={sql}
          readOnly
          spellCheck={false}
        />

        <div className="sql-modal-actions">
          <button className="btn btn-sm" onClick={handleCopy}>
            📋 Копировать
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownload}>
            💾 Скачать .sql
          </button>
        </div>
      </div>
    </div>
  )
}
