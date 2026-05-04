export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean' | 'text' | 'id'

export interface ColumnSchema {
  name: string
  type: ColumnType
  nullable: boolean
  unique: number
  missing: number
  missingPct: number
  min?: number | string
  max?: number | string
  mean?: number
  std?: number
  sample: unknown[]
}

export interface DatasetMeta {
  id: string
  name: string
  rows: number
  cols: number
  createdAt: number
  schema: ColumnSchema[]
  sourceType: 'csv' | 'excel' | 'json' | 'manual' | 'sample'
  fileSize?: number
  schemaConfidence?: number
  parseDetails?: string
}

export interface Dataset extends DatasetMeta {
  data: Record<string, unknown>[]
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  datasetIds: string[]
  notes: string
}

export interface ChartConfig {
  id: string
  type: 'histogram' | 'bar' | 'scatter' | 'box' | 'line' | 'heatmap' | 'violin' | 'pie'
  title: string
  xCol?: string
  yCol?: string
  colorCol?: string
  datasetId: string
}

export interface StatResult {
  label: string
  value: number | string
  description?: string
}

export interface HypothesisTestResult {
  testName: string
  statistic: number
  pValue: number
  degreesOfFreedom?: number
  criticalValue?: number
  alpha: number
  reject: boolean
  interpretation: string
  ciLow?: number
  ciHigh?: number
}

export interface DistributionParams {
  [key: string]: number
}

export interface SampleDataset {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  data: Record<string, unknown>[]
}
