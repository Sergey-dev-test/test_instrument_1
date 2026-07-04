const pool = require('../db');

// In-memory cache for schema
let schemaCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const mapType = (pgType) => {
  if (['int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'smallint', 'integer', 'bigint'].includes(pgType)) return 'number';
  if (['varchar', 'text', 'char', 'bpchar', 'citext'].includes(pgType)) return 'text';
  if (['bool', 'boolean'].includes(pgType)) return 'boolean';
  if (['timestamp', 'timestamptz', 'date'].includes(pgType)) return 'datetime';
  if (['json', 'jsonb'].includes(pgType)) return 'json';
  return 'text';
};

const buildSchemaQuery = () => {
  return `
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length,
      kcu.table_name AS fk_table,
      kcu.column_name AS fk_column
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON c.table_catalog = kcu.table_catalog
      AND c.table_schema = kcu.table_schema
      AND c.table_name = kcu.table_name
      AND c.column_name = kcu.column_name
      AND kcu.constraint_name = (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = c.table_schema
          AND tc.table_name = c.table_name
          AND tc.constraint_type = 'FOREIGN KEY'
          AND POSITION_IN_UNIQUE_CONSTRAINT = c.ordinal_position
      )
    WHERE c.table_schema = 'public'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name != 'audit_log'
    ORDER BY c.table_name, c.ordinal_position
  `;
};

const getSchema = async () => {
  const now = Date.now();
  if (schemaCache && (now - lastFetchTime) < CACHE_TTL) {
    return schemaCache;
  }

  try {
    const result = await pool.query(buildSchemaQuery());
    const tables = {};

    result.rows.forEach(row => {
      const tableName = row.table_name;
      if (!tables[tableName]) {
        tables[tableName] = {
          name: tableName,
          columns: []
        };
      }

      const col = {
        name: row.column_name,
        type: mapType(row.data_type),
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
        maxLength: row.character_maximum_length
      };

      if (row.fk_table) {
        col.fk = {
          table: row.fk_table,
          column: row.fk_column
        };
      }

      tables[tableName].columns.push(col);
    });

    schemaCache = Object.values(tables);
    lastFetchTime = now;
    console.log('Schema cache refreshed:', schemaCache.map(t => t.name).join(', '));
    return schemaCache;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
};

const refreshSchema = async () => {
  schemaCache = null;
  return getSchema();
};

module.exports = { getSchema, refreshSchema, mapType };
