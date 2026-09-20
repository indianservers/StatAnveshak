import type { ColumnSchema, Dataset } from '../types'
import { isDataset } from './validation'
import { asFiniteNumber } from './statEngine'

export type DatasetStatus = 'loading' | 'loaded' | 'empty' | 'invalid' | 'error'

export type DatasetInspection = {
  status: Exclude<DatasetStatus, 'loading'>
  dataset: Dataset | null
  message: string
  numericColumns: string[]
  categoricalColumns: string[]
}

const NUMERIC_TYPES = new Set(['numeric'])

export function inspectDataset(dataset: Dataset | null | undefined): DatasetInspection {
  if (!dataset) {
    return {
      status: 'empty',
      dataset: null,
      message: 'No dataset loaded.',
      numericColumns: [],
      categoricalColumns: [],
    }
  }

  if (!isDataset(dataset) || !Array.isArray(dataset.data) || !Array.isArray(dataset.schema)) {
    return {
      status: 'invalid',
      dataset: null,
      message: 'This dataset cannot be used for this analysis.',
      numericColumns: [],
      categoricalColumns: [],
    }
  }

  const schema = dataset.schema.filter((column): column is ColumnSchema => Boolean(column && typeof column.name === 'string'))
  const data = dataset.data.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  const numericColumns = schema.filter((column) => NUMERIC_TYPES.has(column.type) && !/_id$/i.test(column.name)).map((column) => column.name)
  const categoricalColumns = schema
    .filter((column) => column.type === 'categorical' || column.type === 'text' || column.type === 'boolean')
    .map((column) => column.name)

  if (schema.length === 0 && data.length === 0) {
    return {
      status: 'invalid',
      dataset: { ...dataset, schema, data, rows: 0, cols: 0 },
      message: 'This dataset has no rows or columns.',
      numericColumns,
      categoricalColumns,
    }
  }

  return {
    status: 'loaded',
    dataset: { ...dataset, schema, data, rows: data.length, cols: schema.length },
    message: '',
    numericColumns,
    categoricalColumns,
  }
}

export function hasNumericColumns(dataset: Dataset | null | undefined, min = 1): boolean {
  return inspectDataset(dataset).numericColumns.length >= min
}

export function numericColumnNames(dataset: Dataset | null | undefined): string[] {
  return inspectDataset(dataset).numericColumns
}

export function validObservationCount(dataset: Dataset | null | undefined, column: string): number {
  const inspected = inspectDataset(dataset)
  if (!inspected.dataset) return 0
  return inspected.dataset.data.reduce((count, row) => {
    return asFiniteNumber(row[column]) !== null ? count + 1 : count
  }, 0)
}

export function columnExists(dataset: Dataset | null | undefined, column: string): boolean {
  return Boolean(inspectDataset(dataset).dataset?.schema.some((item) => item.name === column))
}
