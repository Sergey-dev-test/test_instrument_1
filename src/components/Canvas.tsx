import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

import TableNode from '../components/nodes/TableNode'
import CustomEdge from '../components/edges/CustomEdge'
import RelationshipModal from '../components/ui/RelationshipModal'
import { useDbModelerStore } from '../store/dbModelerStore'
import { useSnapToGrid } from '../hooks/useViewport'
import type { DbTable, DbEdge } from '../types/database'
import { RELATIONSHIP_LABELS } from '../types/database'
import './Canvas.css'

// ─── Node Types ───────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  table: TableNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

// ─── Конвертация ──────────────────────────────────────────────

function dbTableToNode(table: DbTable): Node {
  return {
    id: table.id,
    type: 'table',
    position: { x: table.x, y: table.y },
    data: { table },
    draggable: true,
    selectable: true,
  }
}

function dbEdgeToReactFlowEdge(edge: DbEdge): Edge {
  return {
    id: edge.id,
    type: 'custom',
    source: edge.sourceTable,
    target: edge.targetTable,
    sourceHandle: edge.source,
    targetHandle: edge.target,
    animated: true,
    style: { stroke: '#64748b', strokeWidth: 2 },
    data: {
      edge,
      sourceField: {},
      targetField: {},
    },
    label: RELATIONSHIP_LABELS[edge.relationshipType],
    labelShowBg: false,
    labelStyle: { fill: '#94a3b8', fontSize: 10 },
  }
}

// ─── Canvas ───────────────────────────────────────────────────

export default function Canvas() {
  const tables = useDbModelerStore((s) => s.tables)
  const edges = useDbModelerStore((s) => s.edges)
  const selectedEdgeId = useDbModelerStore((s) => s.selectedEdgeId)
  const selectNode = useDbModelerStore((s) => s.selectNode)
  const selectEdge = useDbModelerStore((s) => s.selectEdge)
  const updateTable = useDbModelerStore((s) => s.updateTable)
  const addEdgeStore = useDbModelerStore((s) => s.addEdge)
  const moveTable = useDbModelerStore((s) => s.moveTable)

  const snapToGrid = useSnapToGrid()

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(
    tables.map(dbTableToNode)
  )
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(
    edges.map(dbEdgeToReactFlowEdge)
  )

  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<{
    sourceFieldId: string
    targetFieldId: string
    sourceTableId: string
    targetTableId: string
  } | null>(null)

  // Sync nodes when tables change
  useEffect(() => {
    const newNodes = tables.map(dbTableToNode)
    setReactFlowNodes(newNodes)
  }, [tables, setReactFlowNodes])

  // Sync edges when edges change
  useEffect(() => {
    const newEdges = edges.map(dbEdgeToReactFlowEdge)
    setReactFlowEdges(newEdges)
  }, [edges, setReactFlowEdges])

  // ─── Обработчики событий ────────────────────────────────────

  const handleNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(
        changes.map((c) => {
          // Применяем snap-to-grid при перемещении
          if (c.type === 'position' && c.position) {
            const snapped = snapToGrid(c.position)
            return { ...c, position: snapped }
          }
          return c
        })
      )
    },
    [onNodesChange, snapToGrid]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange]
  )

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      moveTable(node.id, node.position.x, node.position.y)
    },
    [moveTable]
  )

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.sourceHandle || !connection.targetHandle) return

      const sourceFieldId = connection.sourceHandle
      const targetFieldId = connection.targetHandle
      const sourceTableId = connection.source!
      const targetTableId = connection.target!

      setPendingConnection({
        sourceFieldId,
        targetFieldId,
        sourceTableId,
        targetTableId,
      })
      setShowRelationshipModal(true)
    },
    []
  )

  const handleSaveRelationship = useCallback(
    (relationshipType: string) => {
      if (!pendingConnection) return

      addEdgeStore(
        pendingConnection.sourceFieldId,
        pendingConnection.targetFieldId,
        pendingConnection.sourceTableId,
        pendingConnection.targetTableId,
        relationshipType as 'one_to_one' | 'one_to_many' | 'many_to_many'
      )

      setShowRelationshipModal(false)
      setPendingConnection(null)
    },
    [pendingConnection, addEdgeStore]
  )

  // ─── Render ─────────────────────────────────────────────────

  return (
    <>
      <div className="canvas-container">
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={(_, node) => selectNode(node.id)}
          onEdgeClick={(_, edge) => selectEdge(edge.id)}
          onPaneClick={() => selectNode(null)}
          onNodeDragStop={handleNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          snapToGrid
          snapGrid={[20, 20]}
          deleteKeyCode={['Delete', 'Backspace']}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="#334155"
            gap={20}
            size={1}
          />
          <Controls
            showInteractive={false}
            showZoom={true}
            showFitView={true}
            showZoomIn={true}
            showZoomOut={true}
          />
          <MiniMap
            nodeStrokeColor={(n) => (n.id === tables[0]?.id ? '#3b82f6' : '#64748b')}
            nodeColor={(n) => (n.id === tables[0]?.id ? '#3b82f6' : '#1e293b')}
            maskColor="rgba(15, 23, 42, 0.6)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      {/* Модальное окно настройки связи */}
      {showRelationshipModal && pendingConnection && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать связь</h3>

            <div className="relationship-preview">
              <span className="preview-table">
                {tables.find((t) => t.id === pendingConnection.sourceTableId)?.name}
              </span>
              <span className="preview-arrow">→</span>
              <span className="preview-table">
                {tables.find((t) => t.id === pendingConnection.targetTableId)?.name}
              </span>
            </div>

            <div className="relationship-options">
              <span className="options-label">Тип связи:</span>
              <div className="options-list">
                {(['one_to_one', 'one_to_many', 'many_to_many'] as const).map((type) => (
                  <button
                    key={type}
                    className="option-btn"
                    onClick={() => handleSaveRelationship(type)}
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

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowRelationshipModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
