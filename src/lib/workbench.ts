import * as ss from 'simple-statistics'
import type { ColumnSchema, ColumnType, Dataset } from '../types'
import { chiSquareIndependence, normalCDF } from './inference'
import { detectOutliersIQR, duplicateRowCount, numericColumn } from './stats'

export type VariableMeasure = 'scale' | 'ordinal' | 'nominal' | 'id'
export type VariableRole = 'input' | 'target' | 'both' | 'none' | 'partition'

export interface VariableMetadata {
  name: string
  label: string
  detectedType: ColumnType
  typeConfidence: number
  measure: VariableMeasure
  role: VariableRole
  missingRule: string
  valueLabels: string
  notes: string
  warnings: string[]
}

export interface QualityIssue {
  column?: string
  severity: 'info' | 'warning' | 'danger'
  title: string
  detail: string
}

export interface AnalysisLogEntry {
  id: string
  at: string
  action: string
  detail: string
}

export function inferVariableMetadata(dataset: Dataset): VariableMetadata[] {
  return dataset.schema.map((column) => {
    const values = dataset.data.map((row) => row[column.name])
    const nonMissing = values.filter((value) => !isMissing(value))
    const unique = new Set(nonMissing.map(String)).size
    const confidence = typeConfidence(column, values)
    const measure = inferMeasure(column, nonMissing, unique)
    const warnings = variableWarnings(column, nonMissing, unique)
    const valueLabels = measure === 'nominal' || measure === 'ordinal'
      ? [...new Set(nonMissing.map(String))].slice(0, 8).map((value) => `${value} = ${value}`).join('; ')
      : ''

    return {
      name: column.name,
      label: titleCase(column.name),
      detectedType: column.type,
      typeConfidence: confidence,
      measure,
      role: measure === 'id' ? 'none' : 'input',
      missingRule: column.missing > 0 ? 'Blank/null values treated as missing' : 'No missing rule detected',
      valueLabels,
      notes: warnings[0] ?? 'Ready for analysis.',
      warnings,
    }
  })
}

export function diagnoseDataQuality(dataset: Dataset): QualityIssue[] {
  const issues: QualityIssue[] = []
  const duplicateRows = duplicateRowCount(dataset.data)
  if (duplicateRows > 0) {
    issues.push({ severity: 'warning', title: 'Duplicate rows', detail: `${duplicateRows} repeated rows detected.` })
  }

  dataset.schema.forEach((column) => {
    const values = dataset.data.map((row) => row[column.name])
    const nonMissing = values.filter((value) => !isMissing(value))
    const unique = new Set(nonMissing.map(String)).size
    if (column.missingPct >= 20) {
      issues.push({ column: column.name, severity: 'danger', title: 'High missingness', detail: `${column.missingPct.toFixed(1)}% missing values.` })
    } else if (column.missing > 0) {
      issues.push({ column: column.name, severity: 'info', title: 'Missing values', detail: `${column.missing} blanks/nulls found.` })
    }
    if (unique <= 1 && nonMissing.length > 0) {
      issues.push({ column: column.name, severity: 'warning', title: 'Constant column', detail: 'Only one valid value; exclude from correlations and models.' })
    }
    if (column.type === 'numeric') {
      const nums = numericColumn(dataset.data, column.name)
      const outliers = detectOutliersIQR(nums).outliers.length
      const sd = nums.length > 1 ? ss.standardDeviation(nums) : 0
      const mean = nums.length ? Math.abs(ss.mean(nums)) : 0
      if (outliers > 0) issues.push({ column: column.name, severity: 'warning', title: 'Outliers', detail: `${outliers} IQR-rule outliers detected.` })
      if (sd === 0 || (mean > 0 && sd / mean < 0.01)) issues.push({ column: column.name, severity: 'info', title: 'Low variance', detail: 'Very little spread; may not help prediction.' })
    }
    if ((column.type === 'categorical' || column.type === 'text') && unique > Math.max(30, dataset.rows * 0.7)) {
      issues.push({ column: column.name, severity: 'warning', title: 'High-cardinality category', detail: 'Looks like free text or an ID; avoid using directly as a group variable.' })
    }
  })

  return issues.length ? issues : [{ severity: 'info', title: 'No major issues', detail: 'Dataset passed basic quality checks.' }]
}

export function groupedDescriptiveStats(dataset: Dataset, numericColumnName: string, groupColumnName: string) {
  const groups = new Map<string, number[]>()
  dataset.data.forEach((row) => {
    const group = String(row[groupColumnName] ?? '(missing)')
    const value = Number(row[numericColumnName])
    if (Number.isFinite(value)) groups.set(group, [...(groups.get(group) ?? []), value])
  })
  return [...groups.entries()].map(([group, values]) => ({
    group,
    n: values.length,
    mean: safeRound(values.length ? ss.mean(values) : NaN),
    median: safeRound(values.length ? ss.median(values) : NaN),
    sd: safeRound(values.length > 1 ? ss.standardDeviation(values) : 0),
    se: safeRound(values.length > 1 ? ss.standardDeviation(values) / Math.sqrt(values.length) : 0),
    min: safeRound(values.length ? ss.min(values) : NaN),
    max: safeRound(values.length ? ss.max(values) : NaN),
  }))
}

export function frequencyTableDetailed(dataset: Dataset, columnName: string) {
  const counts = new Map<string, { total: number; valid: number }>()
  let validN = 0
  dataset.data.forEach((row) => {
    const raw = row[columnName]
    const value = isMissing(raw) ? '(missing)' : String(raw)
    const current = counts.get(value) ?? { total: 0, valid: 0 }
    current.total += 1
    if (!isMissing(raw)) {
      current.valid += 1
      validN += 1
    }
    counts.set(value, current)
  })
  let cumulativeValid = 0
  return [...counts.entries()].sort((a, b) => b[1].total - a[1].total).map(([value, count]) => {
    cumulativeValid += count.valid
    return {
      value,
      frequency: count.total,
      percent: safeRound((count.total / Math.max(dataset.rows, 1)) * 100, 2),
      validPercent: count.valid ? safeRound((count.valid / Math.max(validN, 1)) * 100, 2) : 0,
      cumulativePercent: count.valid ? safeRound((cumulativeValid / Math.max(validN, 1)) * 100, 2) : '',
    }
  })
}

export function crosstab(dataset: Dataset, rowColumn: string, columnColumn: string) {
  const rowLevels = [...new Set(dataset.data.map((row) => String(row[rowColumn] ?? '(missing)')))]
  const colLevels = [...new Set(dataset.data.map((row) => String(row[columnColumn] ?? '(missing)')))]
  const table = rowLevels.map(() => colLevels.map(() => 0))
  dataset.data.forEach((row) => {
    table[rowLevels.indexOf(String(row[rowColumn] ?? '(missing)'))][colLevels.indexOf(String(row[columnColumn] ?? '(missing)'))] += 1
  })
  const rowTotals = table.map((row) => row.reduce((sum, value) => sum + value, 0))
  const colTotals = colLevels.map((_, index) => table.reduce((sum, row) => sum + row[index], 0))
  const total = rowTotals.reduce((sum, value) => sum + value, 0)
  const chi = chiSquareIndependence(table)
  const minDim = Math.max(1, Math.min(rowLevels.length - 1, colLevels.length - 1))
  const cramerV = Math.sqrt(chi.statistic / Math.max(total * minDim, 1))
  const phi = rowLevels.length === 2 && colLevels.length === 2 ? Math.sqrt(chi.statistic / Math.max(total, 1)) : null
  return { rowLevels, colLevels, table, rowTotals, colTotals, total, chiSquare: chi, cramerV: safeRound(cramerV), phi: phi === null ? null : safeRound(phi) }
}

export function normalityDiagnostics(values: number[]) {
  if (values.length < 3) return { n: values.length, skewness: 0, kurtosis: 0, jarqueBera: 0, pValue: 1, normal: false, qq: [] }
  const skewness = ss.sampleSkewness(values)
  const kurtosis = ss.sampleKurtosis(values)
  const jb = values.length / 6 * (skewness ** 2 + (kurtosis ** 2) / 4)
  const pValue = Math.exp(-jb / 2)
  const sorted = [...values].sort((a, b) => a - b)
  const mean = ss.mean(values)
  const sd = ss.standardDeviation(values) || 1
  const qq = sorted.map((value, index) => ({
    observed: safeRound(value),
    expected: safeRound(mean + sd * inverseNormal((index + 0.5) / sorted.length)),
  }))
  return {
    n: values.length,
    skewness: safeRound(skewness),
    kurtosis: safeRound(kurtosis),
    jarqueBera: safeRound(jb),
    pValue: safeRound(pValue, 4),
    normal: pValue >= 0.05,
    qq,
  }
}

export function recommendAnalysis(goal: string, outcome?: ColumnSchema, predictor?: ColumnSchema) {
  if (!outcome) return { method: 'Descriptive statistics', warning: 'Choose an outcome variable first.' }
  if (goal === 'summarize') return { method: outcome.type === 'numeric' ? 'Descriptive statistics with CI' : 'Frequency table with valid percentages', warning: '' }
  if (goal === 'compare') {
    if (outcome.type !== 'numeric') return { method: 'Chi-square test or crosstab', warning: 'Mean comparison needs a numeric outcome; categorical outcomes use association tests.' }
    if (!predictor || predictor.type === 'numeric') return { method: 'Correlation or regression', warning: 'To compare groups, select a categorical grouping variable.' }
    return { method: 'Independent t-test for 2 groups, ANOVA/Kruskal-Wallis for 3+ groups', warning: '' }
  }
  if (goal === 'predict') return { method: outcome.type === 'numeric' ? 'Linear regression' : 'Logistic regression/classification', warning: predictor ? '' : 'Add one or more predictors.' }
  if (goal === 'test') return { method: outcome.type === 'numeric' ? 't-test, ANOVA, or nonparametric alternative' : 'Chi-square test', warning: '' }
  return { method: 'Exploratory analysis', warning: '' }
}

export function filterRows(dataset: Dataset, column: string, operator: 'equals' | 'contains' | 'gt' | 'lt', value: string): Dataset {
  const data = dataset.data.filter((row) => {
    const cell = row[column]
    if (operator === 'equals') return String(cell) === value
    if (operator === 'contains') return String(cell ?? '').toLowerCase().includes(value.toLowerCase())
    if (operator === 'gt') return Number(cell) > Number(value)
    return Number(cell) < Number(value)
  })
  return cloneDataset(dataset, data, `Filtered ${column} ${operator} ${value}`)
}

export function addComputedColumn(dataset: Dataset, newColumn: string, sourceColumn: string, operation: 'zscore' | 'log' | 'sqrt' | 'standardize') {
  const nums = numericColumn(dataset.data, sourceColumn)
  const mean = nums.length ? ss.mean(nums) : 0
  const sd = nums.length > 1 ? ss.standardDeviation(nums) : 1
  const data = dataset.data.map((row) => {
    const value = Number(row[sourceColumn])
    const computed = !Number.isFinite(value)
      ? null
      : operation === 'log'
        ? Math.log(Math.max(value, Number.EPSILON))
        : operation === 'sqrt'
          ? Math.sqrt(Math.max(value, 0))
          : (value - mean) / (sd || 1)
    return { ...row, [newColumn]: computed === null ? null : safeRound(computed) }
  })
  return cloneDataset(dataset, data, `Computed ${newColumn} from ${sourceColumn}`)
}

export function recodeColumn(dataset: Dataset, sourceColumn: string, fromValue: string, toValue: string) {
  const data = dataset.data.map((row) => String(row[sourceColumn]) === fromValue ? { ...row, [sourceColumn]: toValue } : row)
  return cloneDataset(dataset, data, `Recoded ${sourceColumn}: ${fromValue} -> ${toValue}`)
}

export function binColumn(dataset: Dataset, sourceColumn: string, newColumn: string, bins = 4) {
  const nums = numericColumn(dataset.data, sourceColumn)
  const min = nums.length ? ss.min(nums) : 0
  const max = nums.length ? ss.max(nums) : 0
  const width = (max - min) / Math.max(bins, 1) || 1
  const data = dataset.data.map((row) => {
    const value = Number(row[sourceColumn])
    const bin = Number.isFinite(value) ? Math.min(bins, Math.floor((value - min) / width) + 1) : null
    return { ...row, [newColumn]: bin ? `Bin ${bin}` : null }
  })
  return cloneDataset(dataset, data, `Binned ${sourceColumn} into ${bins} groups`)
}

export function labelEncodeColumn(dataset: Dataset, sourceColumn: string, newColumn: string) {
  const levels = [...new Set(dataset.data.map((row) => row[sourceColumn]).filter((value) => !isMissing(value)).map(String))]
  const data = dataset.data.map((row) => ({ ...row, [newColumn]: isMissing(row[sourceColumn]) ? null : levels.indexOf(String(row[sourceColumn])) + 1 }))
  return cloneDataset(dataset, data, `Label encoded ${sourceColumn}`)
}

export function joinDatasets(left: Dataset, right: Dataset, leftKey: string, rightKey: string): Dataset {
  const rightIndex = new Map(right.data.map((row) => [String(row[rightKey]), row]))
  const data = left.data.map((row) => {
    const match = rightIndex.get(String(row[leftKey])) ?? {}
    const prefixed = Object.fromEntries(Object.entries(match).map(([key, value]) => [`${right.name}_${key}`, value]))
    return { ...row, ...prefixed }
  })
  return cloneDataset(left, data, `Joined ${left.name} with ${right.name}`)
}

export function createAnalysisLog(action: string, detail: string): AnalysisLogEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: new Date().toLocaleString(), action, detail }
}

function cloneDataset(dataset: Dataset, data: Record<string, unknown>[], detail: string): Dataset {
  const schema = buildSchemaFromData(data, dataset.schema)
  return { ...dataset, data, rows: data.length, cols: schema.length, schema, updatedAt: Date.now(), parseDetails: detail } as Dataset
}

function buildSchemaFromData(data: Record<string, unknown>[], previous: ColumnSchema[]) {
  const previousMap = new Map(previous.map((column) => [column.name, column]))
  const columns = Object.keys(data[0] ?? {})
  return columns.map((name) => {
    const existing = previousMap.get(name)
    const values = data.map((row) => row[name])
    const nonMissing = values.filter((value) => !isMissing(value))
    const numericCount = nonMissing.filter((value) => Number.isFinite(Number(value))).length
    const type: ColumnType = existing?.type ?? (numericCount / Math.max(nonMissing.length, 1) > 0.85 ? 'numeric' : 'categorical')
    const missing = values.length - nonMissing.length
    const nums = nonMissing.map(Number).filter(Number.isFinite)
    return {
      name,
      type,
      nullable: missing > 0,
      unique: new Set(nonMissing.map(String)).size,
      missing,
      missingPct: values.length ? missing / values.length * 100 : 0,
      min: nums.length ? Math.min(...nums) : nonMissing.map(String).sort()[0],
      max: nums.length ? Math.max(...nums) : nonMissing.map(String).sort().at(-1),
      mean: nums.length ? ss.mean(nums) : undefined,
      std: nums.length > 1 ? ss.standardDeviation(nums) : undefined,
      sample: values.slice(0, 5),
    }
  })
}

function typeConfidence(column: ColumnSchema, values: unknown[]) {
  const nonMissing = values.filter((value) => !isMissing(value))
  if (nonMissing.length === 0) return 50
  const unique = new Set(nonMissing.map(String)).size
  if (column.type === 'numeric') return safeRound(nonMissing.filter((value) => Number.isFinite(Number(value))).length / nonMissing.length * 100, 0)
  if (column.type === 'date') return safeRound(nonMissing.filter((value) => !Number.isNaN(Date.parse(String(value)))).length / nonMissing.length * 100, 0)
  if (column.type === 'id') return unique === nonMissing.length ? 95 : 70
  if (column.type === 'boolean') return unique <= 2 ? 95 : 70
  return unique <= Math.max(20, nonMissing.length * 0.3) ? 88 : 72
}

function inferMeasure(column: ColumnSchema, values: unknown[], unique: number): VariableMeasure {
  if (column.type === 'id' || (unique === values.length && values.length > 10 && /id|key|code/i.test(column.name))) return 'id'
  if (column.type === 'numeric') return unique <= 7 ? 'ordinal' : 'scale'
  if (column.type === 'boolean' || column.type === 'categorical') return unique <= 12 && values.every((value) => /^(\d+|low|medium|high|agree|neutral|disagree)$/i.test(String(value))) ? 'ordinal' : 'nominal'
  return 'nominal'
}

function variableWarnings(column: ColumnSchema, values: unknown[], unique: number) {
  const warnings: string[] = []
  if (column.missingPct >= 20) warnings.push('High missingness may bias analysis.')
  if (unique <= 1 && values.length > 0) warnings.push('Constant column; exclude from models.')
  if (column.type === 'numeric') {
    const nums = values.map(Number).filter(Number.isFinite)
    if (detectOutliersIQR(nums).outliers.length > 0) warnings.push('Outliers detected; compare robust summaries.')
  }
  if (warnings.length === 0 && column.type === 'id') warnings.push('Identifier-like column; use for joins, not analysis.')
  return warnings
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function isMissing(value: unknown) {
  return value === null || value === undefined || value === ''
}

function safeRound(value: number, digits = 3) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0
}

function inverseNormal(p: number) {
  let lo = -8
  let hi = 8
  for (let index = 0; index < 60; index += 1) {
    const mid = (lo + hi) / 2
    if (normalCDF(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
