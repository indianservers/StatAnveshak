import * as ss from 'simple-statistics'
import type { ColumnSchema, StatResult } from '../types'

export interface DatasetKpi {
  label: string
  value: number | string
  detail: string
  tone?: 'blue' | 'green' | 'amber' | 'rose' | 'slate'
}

export interface NumericDescriptiveRow {
  column: string
  count: number
  missing: number
  missingPct: number
  mean: number | string
  median: number | string
  mode: number | string
  stdDev: number | string
  variance: number | string
  min: number | string
  max: number | string
  range: number | string
  q1: number | string
  q3: number | string
  iqr: number | string
  skewness: number | string
  kurtosis: number | string
  cvPct: number | string
  outliers: number
}

export interface CategoricalDescriptiveRow {
  column: string
  count: number
  missing: number
  missingPct: number
  unique: number
  topValue: string
  topFrequency: number
  topPct: number
  entropy: number
}

export function numericColumn(data: Record<string, unknown>[], col: string): number[] {
  return data.map((r) => Number(r[col])).filter((n) => !isNaN(n) && isFinite(n))
}

export function summaryStats(data: Record<string, unknown>[], col: string): StatResult[] {
  const nums = numericColumn(data, col)
  if (nums.length === 0) return []
  const sorted = [...nums].sort((a, b) => a - b)
  const mean = ss.mean(nums)
  const std = nums.length > 1 ? ss.standardDeviation(nums) : 0
  const variance = nums.length > 1 ? ss.variance(nums) : 0

  return [
    { label: 'Count', value: nums.length },
    { label: 'Mean', value: +mean.toFixed(6) },
    { label: 'Median', value: +ss.median(nums).toFixed(6) },
    { label: 'Mode', value: +ss.mode(nums).toFixed(6) },
    { label: 'Std Dev', value: +std.toFixed(6) },
    { label: 'Variance', value: +variance.toFixed(6) },
    { label: 'Min', value: +ss.min(nums).toFixed(6) },
    { label: 'Max', value: +ss.max(nums).toFixed(6) },
    { label: 'Range', value: +(ss.max(nums) - ss.min(nums)).toFixed(6) },
    { label: 'Q1', value: +ss.quantile(sorted, 0.25).toFixed(6) },
    { label: 'Q3', value: +ss.quantile(sorted, 0.75).toFixed(6) },
    { label: 'IQR', value: +(ss.quantile(sorted, 0.75) - ss.quantile(sorted, 0.25)).toFixed(6) },
    { label: 'Skewness', value: nums.length > 2 ? +ss.sampleSkewness(nums).toFixed(6) : 0 },
    { label: 'Kurtosis', value: nums.length > 3 ? +ss.sampleKurtosis(nums).toFixed(6) : 0 },
    { label: 'CV (%)', value: mean === 0 ? '-' : +((std / Math.abs(mean)) * 100).toFixed(4) },
  ]
}

function isMissingValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

function asFiniteNumber(value: number | string | undefined): number | string {
  return typeof value === 'number' && Number.isFinite(value) ? value : '-'
}

function statValue(stats: StatResult[], label: string): number | string {
  return asFiniteNumber(stats.find((item) => item.label === label)?.value)
}

export function missingCellCount(data: Record<string, unknown>[], schema: ColumnSchema[]): number {
  return data.reduce(
    (total, row) => total + schema.filter((col) => isMissingValue(row[col.name])).length,
    0
  )
}

export function duplicateRowCount(data: Record<string, unknown>[]): number {
  const seen = new Set<string>()
  let duplicates = 0
  data.forEach((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) duplicates += 1
    seen.add(key)
  })
  return duplicates
}

export function datasetKpis(data: Record<string, unknown>[], schema: ColumnSchema[]): DatasetKpi[] {
  const rows = data.length
  const cols = schema.length
  const numericCols = schema.filter((col) => col.type === 'numeric').length
  const categoricalCols = schema.filter((col) => col.type === 'categorical').length
  const dateCols = schema.filter((col) => col.type === 'date').length
  const missing = missingCellCount(data, schema)
  const totalCells = Math.max(rows * cols, 1)
  const duplicates = duplicateRowCount(data)
  const outliers = schema
    .filter((col) => col.type === 'numeric')
    .reduce((total, col) => total + detectOutliersIQR(numericColumn(data, col.name)).outliers.length, 0)

  return [
    { label: 'Rows', value: rows, detail: 'Observations loaded', tone: 'blue' },
    { label: 'Columns', value: cols, detail: `${numericCols} numeric, ${categoricalCols} categorical`, tone: 'green' },
    { label: 'Missing Cells', value: missing, detail: `${((missing / totalCells) * 100).toFixed(2)}% of dataset`, tone: missing > 0 ? 'amber' : 'slate' },
    { label: 'Duplicate Rows', value: duplicates, detail: `${rows === 0 ? 0 : ((duplicates / rows) * 100).toFixed(2)}% repeated`, tone: duplicates > 0 ? 'amber' : 'slate' },
    { label: 'Outliers', value: outliers, detail: 'IQR rule across numeric columns', tone: outliers > 0 ? 'rose' : 'slate' },
    { label: 'Column Types', value: `${numericCols}/${categoricalCols}/${dateCols}`, detail: 'Numeric / categorical / date', tone: 'blue' },
  ]
}

export function numericDescriptiveRows(data: Record<string, unknown>[], columns: string[]): NumericDescriptiveRow[] {
  return columns.map((column) => {
    const nums = numericColumn(data, column)
    const stats = summaryStats(data, column)
    const missing = data.length - nums.length
    return {
      column,
      count: nums.length,
      missing,
      missingPct: data.length === 0 ? 0 : +((missing / data.length) * 100).toFixed(2),
      mean: statValue(stats, 'Mean'),
      median: statValue(stats, 'Median'),
      mode: statValue(stats, 'Mode'),
      stdDev: statValue(stats, 'Std Dev'),
      variance: statValue(stats, 'Variance'),
      min: statValue(stats, 'Min'),
      max: statValue(stats, 'Max'),
      range: statValue(stats, 'Range'),
      q1: statValue(stats, 'Q1'),
      q3: statValue(stats, 'Q3'),
      iqr: statValue(stats, 'IQR'),
      skewness: statValue(stats, 'Skewness'),
      kurtosis: statValue(stats, 'Kurtosis'),
      cvPct: statValue(stats, 'CV (%)'),
      outliers: detectOutliersIQR(nums).outliers.length,
    }
  })
}

export function categoricalDescriptiveRows(data: Record<string, unknown>[], columns: string[]): CategoricalDescriptiveRow[] {
  return columns.map((column) => {
    const values = data.map((row) => row[column]).filter((value) => !isMissingValue(value))
    const counts = new Map<string, number>()
    values.forEach((value) => {
      const key = String(value)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted[0] ?? ['-', 0]
    const entropy = sorted.reduce((total, [, freq]) => {
      const p = values.length === 0 ? 0 : freq / values.length
      return p === 0 ? total : total - p * Math.log2(p)
    }, 0)
    const missing = data.length - values.length

    return {
      column,
      count: values.length,
      missing,
      missingPct: data.length === 0 ? 0 : +((missing / data.length) * 100).toFixed(2),
      unique: counts.size,
      topValue: top[0],
      topFrequency: top[1],
      topPct: values.length === 0 ? 0 : +((top[1] / values.length) * 100).toFixed(2),
      entropy: +entropy.toFixed(4),
    }
  })
}

export function frequencyTable(data: Record<string, unknown>[], col: string) {
  const counts: Record<string, number> = {}
  data.forEach((r) => {
    const val = String(r[col] ?? '(missing)')
    counts[val] = (counts[val] || 0) + 1
  })
  const total = data.length
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  let cumFreq = 0
  return entries.map(([value, freq]) => {
    cumFreq += freq
    return {
      value,
      frequency: freq,
      relativeFreq: +((freq / total) * 100).toFixed(2),
      cumulativeFreq: +((cumFreq / total) * 100).toFixed(2),
    }
  })
}

export function pearsonCorrelation(data: Record<string, unknown>[], col1: string, col2: string): number {
  const pairs = data
    .map((r) => [Number(r[col1]), Number(r[col2])])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b))
  if (pairs.length < 2) return NaN
  return ss.sampleCorrelation(pairs.map((p) => p[0]), pairs.map((p) => p[1]))
}

export function correlationMatrix(data: Record<string, unknown>[], cols: string[]) {
  const matrix: number[][] = cols.map((c1) =>
    cols.map((c2) => (c1 === c2 ? 1 : pearsonCorrelation(data, c1, c2)))
  )
  return { cols, matrix }
}

// Outlier detection via IQR
export function detectOutliersIQR(nums: number[]): { lower: number; upper: number; outliers: number[] } {
  if (nums.length === 0) return { lower: NaN, upper: NaN, outliers: [] }
  const sorted = [...nums].sort((a, b) => a - b)
  const q1 = ss.quantile(sorted, 0.25)
  const q3 = ss.quantile(sorted, 0.75)
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr
  return { lower, upper, outliers: nums.filter((n) => n < lower || n > upper) }
}

// Z-scores
export function zScores(nums: number[]): number[] {
  const m = ss.mean(nums)
  const s = ss.standardDeviation(nums)
  return nums.map((n) => (s === 0 ? 0 : (n - m) / s))
}
