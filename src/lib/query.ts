import * as aq from 'arquero'
import type { Dataset } from '../types'

export type QueryResult = {
  columns: string[]
  rows: Record<string, unknown>[]
  message: string
}

export function datasetProfile(dataset: Dataset) {
  const table = aq.from(dataset.data)
  return {
    rows: table.numRows(),
    columns: table.columnNames(),
    preview: table.objects().slice(0, 5) as Record<string, unknown>[],
  }
}

export function runSimpleSelect(dataset: Dataset, input: string): QueryResult {
  const query = input.trim()
  const match = /^select\s+(.+?)\s+from\s+dataset(?:\s+limit\s+(\d+))?$/i.exec(query)
  if (!match) {
    throw new Error('Use: SELECT * FROM dataset LIMIT 20, or SELECT column_a, column_b FROM dataset LIMIT 20')
  }

  const requested = match[1].trim()
  const limit = Math.max(1, Math.min(500, Number(match[2] ?? 50)))
  const allColumns = dataset.schema.map((column) => column.name)
  const columns = requested === '*'
    ? allColumns
    : requested.split(',').map((column) => column.trim()).filter(Boolean)

  const missing = columns.filter((column) => !allColumns.includes(column))
  if (missing.length > 0) throw new Error(`Unknown column: ${missing.join(', ')}`)

  const rows = dataset.data.slice(0, limit).map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])))
  return {
    columns,
    rows,
    message: `Returned ${rows.length.toLocaleString()} row(s) from ${dataset.name}.`,
  }
}

export async function getDuckDbPackageStatus() {
  const duckdb = await import('@duckdb/duckdb-wasm')
  return {
    loaded: true,
    exports: Object.keys(duckdb).slice(0, 8),
  }
}
