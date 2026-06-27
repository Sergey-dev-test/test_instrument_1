import { useCallback, useRef } from 'react'
import type { Viewport } from 'reactflow'

// ─── Константы ────────────────────────────────────────────────

const SNAP_GRID_SIZE = 20
const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.0
const ZOOM_STEP = 0.1

// ─── Hook для зума и панорамирования ───────────────────────────

export function useViewportZoom() {
  const viewportRef = useRef<Viewport | null>(null)

  const clampViewport = useCallback((vp: Viewport): Viewport => {
    return {
      ...vp,
      zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, vp.zoom)),
    }
  }, [])

  const fitViewport = useCallback((viewport: Viewport): Viewport => {
    return clampViewport({ ...viewport, zoom: Math.max(vp.zoom, 0.5) })
  }, [clampViewport])

  return {
    clampViewport,
    fitViewport,
    viewportRef,
  }
}

// ─── Hook для snap-to-grid ────────────────────────────────────

export function useSnapToGrid(): (position: { x: number; y: number }) => { x: number; y: number } {
  const snap = useCallback(
    (position: { x: number; y: number }) => ({
      x: Math.round(position.x / SNAP_GRID_SIZE) * SNAP_GRID_SIZE,
      y: Math.round(position.y / SNAP_GRID_SIZE) * SNAP_GRID_SIZE,
    }),
    []
  )

  return snap
}

// ─── Hook для горячих клавиш ──────────────────────────────────

export function useKeyboardShortcuts(handlers: {
  onDelete?: () => void
  onClear?: () => void
  onExport?: () => void
}): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Delete — удалить выбранное
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingInput(e)) {
        handlersRef.current.onDelete?.()
      }
      // Ctrl+A — очистить всё
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        handlersRef.current.onClear?.()
      }
      // Ctrl+E — экспорт SQL
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault()
        handlersRef.current.onExport?.()
      }
    },
    []
  )

  return handleKeyDown
}

function isEditingInput(e: KeyboardEvent): boolean {
  const target = e.target
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true
  }
  if (target instanceof HTMLElement && target.contentEditable === 'true') {
    return true
  }
  return false
}
