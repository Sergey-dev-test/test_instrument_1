import { useState, useCallback } from 'react'
import type { RelationshipType } from '../../types/database'
import { RELATIONSHIP_LABELS } from '../../types/database'
import { useDbModelerStore } from '../../store/dbModelerStore'
import '../../styles/global.css'
import './RelationshipModal.css'

interface RelationshipModalProps {
  edgeId: string | null
  onClose: () => void
}

const RELATIONSHIP_TYPES: RelationshipType[] = ['one_to_one', 'one_to_many', 'many_to_many']

export default function RelationshipModal({ edgeId, onClose }: RelationshipModalProps) {
  const store = useDbModelerStore()
  const selectedEdge = store.edges.find((e) => e.id === edgeId)
  const [selectedType, setSelectedType] = useState<RelationshipType>(
    selectedEdge?.relationshipType || 'one_to_many'
  )

  const updateEdgeRelationship = useDbModelerStore((s) => s.updateEdgeRelationship)
  const removeEdge = useDbModelerStore((s) => s.removeEdge)

  const handleSave = useCallback(() => {
    if (edgeId) {
      updateEdgeRelationship(edgeId, selectedType)
    }
    onClose()
  }, [edgeId, selectedType, updateEdgeRelationship, onClose])

  const handleDelete = useCallback(() => {
    if (edgeId) {
      removeEdge(edgeId)
    }
    onClose()
  }, [edgeId, removeEdge, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') handleSave()
    },
    [onClose, handleSave]
  )

  return (
    <div className="modal-overlay" onKeyDown={handleKeyDown}>
      <div className="modal">
        <h3>Связь между полями</h3>

        {selectedEdge && (
          <div className="relationship-info">
            <div className="relationship-source">
              <span className="info-label">Источник:</span>
              <span className="info-value">{selectedEdge.sourceTable}</span>
            </div>
            <div className="relationship-arrow">↓</div>
            <div className="relationship-target">
              <span className="info-label">Назначение:</span>
              <span className="info-value">{selectedEdge.targetTable}</span>
            </div>
          </div>
        )}

        <div className="relationship-options">
          <span className="options-label">Тип связи:</span>
          <div className="options-list">
            {RELATIONSHIP_TYPES.map((type) => (
              <button
                key={type}
                className={`option-btn ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                <span className="option-icon">
                  {type === 'one_to_one' && '1 ↔ 1'}
                  {type === 'one_to_many' && '1 → ∞'}
                  {type === 'many_to_many' && '∞ ↔ ∞'}
                </span>
                <span className="option-label">{RELATIONSHIP_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Визуальная превью нотации */}
        <div className="notation-preview">
          <span className="preview-label">Нотация:</span>
          <div className="notation-diagram">
            <span className="notation-node">A</span>
            <span className="notation-line">
              {selectedType === 'one_to_one' && '1────1'}
              {selectedType === 'one_to_many' && '1────<'}
              {selectedType === 'many_to_many' && '<────<'}
            </span>
            <span className="notation-node">B</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Удалить связь
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
