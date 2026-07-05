// ─── Типы полей ───────────────────────────────────────────────

export type FieldType =
  | 'int'
  | 'bigint'
  | 'smallint'
  | 'float'
  | 'decimal'
  | 'varchar'
  | 'text'
  | 'char'
  | 'date'
  | 'time'
  | 'datetime'
  | 'timestamp'
  | 'boolean'
  | 'uuid'

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  int: 'INT',
  bigint: 'BIGINT',
  smallint: 'SMALLINT',
  float: 'FLOAT',
  decimal: 'DECIMAL',
  varchar: 'VARCHAR',
  text: 'TEXT',
  char: 'CHAR',
  date: 'DATE',
  time: 'TIME',
  datetime: 'DATETIME',
  timestamp: 'TIMESTAMP',
  boolean: 'BOOLEAN',
  uuid: 'UUID',
}

export const FIELD_TYPE_CATEGORIES: Record<FieldType, FieldCategory> = {
  int: 'number',
  bigint: 'number',
  smallint: 'number',
  float: 'number',
  decimal: 'number',
  varchar: 'string',
  text: 'string',
  char: 'string',
  date: 'date',
  time: 'date',
  datetime: 'date',
  timestamp: 'date',
  boolean: 'boolean',
  uuid: 'string',
}

export type FieldCategory = 'number' | 'string' | 'date' | 'boolean'

// ─── Типы связей ──────────────────────────────────────────────

export type RelationshipType = 'one_to_one' | 'one_to_many' | 'many_to_many'

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  one_to_one: 'One-to-One',
  one_to_many: 'One-to-Many',
  many_to_many: 'Many-to-Many',
}

// ─── Поле таблицы ─────────────────────────────────────────────

export interface DbField {
  id: string
  name: string
  type: FieldType
  isPrimaryKey: boolean
  isNotNull: boolean
  isAutoIncrement: boolean
  defaultValue?: string
  comment?: string
}

// ─── Таблица (нода) ───────────────────────────────────────────

export interface DbTable {
  id: string
  name: string
  comment?: string
  x: number
  y: number
  fields: DbField[]
}

// ─── Связь (ребро) ────────────────────────────────────────────

export interface DbEdge {
  id: string
  source: string       // id поля-источника
  target: string       // id поля-назначения
  sourceTable: string  // id таблицы-источника
  targetTable: string  // id таблицы-назначения
  relationshipType: RelationshipType
}

// ─── React Flow node/edge расширенные ─────────────────────────

export interface TableNodeData {
  table: DbTable
}

export interface EdgeNodeData {
  edge: DbEdge
  sourceField: DbField
  targetField: DbField
}

// ─── ID-генератор ─────────────────────────────────────────────

export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
