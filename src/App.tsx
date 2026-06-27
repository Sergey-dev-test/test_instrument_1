import { useCallback, useEffect } from 'react'
import Sidebar from './components/sidebars/Sidebar'
import Toolbar from './components/ui/Toolbar'
import Canvas from './components/Canvas'
import { useDbModelerStore } from './store/dbModelerStore'
import { useKeyboardShortcuts } from './hooks/useViewport'
import './styles/global.css'

export default function App() {
  const selectedNodeId = useDbModelerStore((s) => s.selectedNodeId)
  const selectedEdgeId = useDbModelerStore((s) => s.selectedEdgeId)
  const removeTable = useDbModelerStore((s) => s.removeTable)
  const removeEdge = useDbModelerStore((s) => s.removeEdge)
  const clearAll = useDbModelerStore((s) => s.clearAll)
  const addTable = useDbModelerStore((s) => s.addTable)

  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      removeTable(selectedNodeId)
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId)
    }
  }, [selectedNodeId, selectedEdgeId, removeTable, removeEdge])

  const handleClear = useCallback(() => {
    clearAll()
  }, [clearAll])

  const handleExport = useCallback(() => {
    // Trigger toolbar SQL export
    const btn = document.querySelector('[title*="Ctrl+E"]') as HTMLButtonElement
    btn?.click()
  }, [])

  useKeyboardShortcuts({ onDelete: handleDelete, onClear: handleClear, onExport: handleExport })

  // ─── Горячая клавиша для новой таблицы ──────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        addTable()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addTable])

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="app-main">
        {/* Toolbar */}
        <Toolbar />

        {/* Canvas */}
        <Canvas />
      </div>
    </div>
  )
}
