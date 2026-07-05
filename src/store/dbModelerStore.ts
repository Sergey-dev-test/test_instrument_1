import { create } from 'zustand'
import type { DbTable, DbEdge, DbField, RelationshipType, FieldType } from '../types/database'
import { generateId, FIELD_TYPE_LABELS } from '../types/database'

// ─── Начальное состояние ──────────────────────────────────────

interface DbModelerState {
  tables: DbTable[]
  edges: DbEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  nextTableNameCounter: number
}

// ─── Actions ──────────────────────────────────────────────────

interface DbModelerActions {
  addTable: (x?: number, y?: number) => void
  removeTable: (tableId: string) => void
  updateTable: (tableId: string, updates: Partial<Pick<DbTable, 'name' | 'comment'>>) => void
  moveTable: (tableId: string, x: number, y: number) => void

  addField: (tableId: string, type?: FieldType) => void
  removeField: (tableId: string, fieldId: string) => void
  updateField: (tableId: string, fieldId: string, updates: Partial<DbField>) => void

  addEdge: (
    sourceFieldId: string,
    targetFieldId: string,
    sourceTableId: string,
    targetTableId: string,
    relationshipType: RelationshipType
  ) => void
  removeEdge: (edgeId: string) => void
  updateEdgeRelationship: (edgeId: string, relationshipType: RelationshipType) => void

  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void

  clearAll: () => void
}

// ─── Store ────────────────────────────────────────────────────

type DbModelerStore = DbModelerState & DbModelerActions

export const useDbModelerStore = create<DbModelerStore>((set) => ({
  tables: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  nextTableNameCounter: 1,

  addTable: (x = 100, y = 100) =>
    set((state) => {
      const name = `table_${state.nextTableNameCounter}`
      return {
        tables: [
          ...state.tables,
          {
            id: generateId(),
            name,
            x,
            y,
            fields: [
              {
                id: generateId(),
                name: 'id',
                type: 'int',
                isPrimaryKey: true,
                isNotNull: true,
                isAutoIncrement: true,
              },
            ],
          },
        ],
        nextTableNameCounter: state.nextTableNameCounter + 1,
      }
    }),

  removeTable: (tableId: string) =>
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== tableId),
      edges: state.edges.filter(
        (e) => e.sourceTable !== tableId && e.targetTable !== tableId
      ),
      selectedNodeId: state.selectedNodeId === tableId ? null : state.selectedNodeId,
    })),

  updateTable: (tableId: string, updates) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId ? { ...t, ...updates } : t
      ),
    })),

  moveTable: (tableId, x, y) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId ? { ...t, x, y } : t
      ),
    })),

  addField: (tableId, type = 'varchar') =>
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t
        return {
          ...t,
          fields: [
            ...t.fields,
            {
              id: generateId(),
              name: `field_${t.fields.length + 1}`,
              type,
              isPrimaryKey: false,
              isNotNull: false,
              isAutoIncrement: false,
            },
          ],
        }
      }),
    })),

  removeField: (tableId, fieldId) =>
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t
        return {
          ...t,
          fields: t.fields.filter((f) => f.id !== fieldId),
        }
      }),
      edges: state.edges.filter(
        (e) => e.source !== fieldId && e.target !== fieldId
      ),
    })),

  updateField: (tableId, fieldId, updates) =>
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t
        return {
          ...t,
          fields: t.fields.map((f) =>
            f.id === fieldId ? { ...f, ...updates } : f
          ),
        }
      }),
    })),

  addEdge: (sourceFieldId, targetFieldId, sourceTableId, targetTableId, relationshipType) =>
    set((state) => ({
      edges: [
        ...state.edges,
        {
          id: generateId(),
          source: sourceFieldId,
          target: targetFieldId,
          sourceTable: sourceTableId,
          targetTable: targetTableId,
          relationshipType,
        },
      ],
    })),

  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
    })),

  updateEdgeRelationship: (edgeId, relationshipType) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, relationshipType } : e
      ),
    })),

  selectNode: (nodeId) =>
    set((state) => ({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
    })),

  selectEdge: (edgeId) =>
    set((state) => ({
      selectedEdgeId: edgeId,
      selectedNodeId: null,
    })),

  clearAll: () =>
    set({
      tables: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      nextTableNameCounter: 1,
    }),
}))
