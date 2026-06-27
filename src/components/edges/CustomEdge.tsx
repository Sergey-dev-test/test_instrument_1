import { memo } from 'react'
import type { EdgeProps } from 'reactflow'
import { getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { useDbModelerStore } from '../../store/dbModelerStore'
import type { RelationshipType } from '../../types/database'
import { RELATIONSHIP_LABELS } from '../../types/database'
import './CustomEdge.css'

// ─── Нотация Crow's Foot ──────────────────────────────────────

function renderCrowsFoot(type: RelationshipType, side: 'source' | 'target'): string {
  switch (type) {
    case 'one_to_one':
      return side === 'source' ? '1' : '1'
    case 'one_to_many':
      return side === 'source' ? '1' : '<'
    case 'many_to_many':
      return side === 'source' ? '<' : '<'
  }
}

// ─── SVG-маркеры нотации ──────────────────────────────────────

function CrowsFootMarker({
  type,
  side,
  x,
  y,
  rotation,
}: {
  type: RelationshipType
  side: 'source' | 'target'
  x: number
  y: number
  rotation: number
}) {
  const notation = renderCrowsFoot(type, side)

  if (notation === '1') {
    return (
      <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        <circle r={10} fill="var(--color-accent)" opacity={0.9} />
        <text
          x={0}
          y={4}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight={700}
          fontFamily="monospace"
        >
          1
        </text>
      </g>
    )
  }

  // Crow's foot (<)
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <line x1={8} y1={-8} x2={-4} y2={0} stroke="var(--color-accent)" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={-4} y1={0} x2={8} y2={8} stroke="var(--color-accent)" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={-4} y1={0} x2={-4} y2={0} stroke="var(--color-accent)" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={-4} cy={0} r={2.5} fill="var(--color-accent)" />
    </g>
  )
}

// ─── Компонент ребра ──────────────────────────────────────────

const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) => {
  const { edge } = data || {}
  const relationshipType = edge?.relationshipType || 'one_to_many'

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Позиция для маркера на источнике
  const sourceMarkerOffset = { x: sourceX, y: sourceY }
  const targetMarkerOffset = { x: targetX, y: targetY }

  // Угол поворота маркеров
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return (
    <>
      {/* SVG Path */}
      <path
        className={`connection-path ${selected ? 'selected' : ''}`}
        d={edgePath}
        strokeWidth={selected ? 3 : 2}
      />

      {/* Маркер нотации на источнике */}
      <CrowsFootMarker
        type={relationshipType}
        side="source"
        x={sourceMarkerOffset.x}
        y={sourceMarkerOffset.y}
        rotation={angle}
      />

      {/* Маркер нотации на целевой */}
      <CrowsFootMarker
        type={relationshipType}
        side="target"
        x={targetMarkerOffset.x}
        y={targetMarkerOffset.y}
        rotation={angle + 180}
      />

      {/* Label (редко нужен, но оставим для дебага) */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="edge-label"
        >
          <button
            className="edge-label-btn"
            title="Редактировать связь"
          >
            ✎
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

export default CustomEdge
