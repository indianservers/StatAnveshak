import type { Dataset } from '../types'
import { STAT_MODULES, type StatModuleDef } from './statModules'

export type ColumnRole = 'target' | 'predictor' | 'group' | 'time' | 'binary' | 'weight' | 'id' | 'text' | 'unknown'

export type ColumnRoleProfile = {
  name: string
  type: Dataset['schema'][number]['type']
  primaryRole: ColumnRole
  roles: Record<ColumnRole, number>
  reasons: string[]
  riskFlags: string[]
}

export type DataQualityReport = {
  score: number
  level: 'Strong' | 'Review' | 'High Risk'
  rows: number
  cols: number
  duplicateRows: number
  missingCells: number
  missingPct: number
  typeSummary: Record<string, number>
  missingColumns: Array<{ name: string; missing: number; missingPct: number }>
  outlierColumns: Array<{ name: string; outliers: number; outlierPct: number; lower: number; upper: number }>
  suspiciousColumns: Array<{ name: string; reason: string; severity: 'info' | 'warn' }>
  columnRoles: ColumnRoleProfile[]
  largeData: LargeDatasetStrategy
}

export type LargeDatasetStrategy = {
  mode: 'full' | 'sample' | 'worker' | 'paginate'
  sampleRows: number
  pageSize: number
  memoryWarning: string
  tactics: string[]
}

export type CleaningRecommendation = {
  title: string
  detail: string
  route: string
  action: string
  severity: 'ok' | 'info' | 'warn'
}

export type ModuleDatasetMatch = {
  key: string
  title: string
  group: string
  score: number
  label: 'Excellent' | 'Good' | 'Prepare' | 'Risky'
  reasons: string[]
  required: string[]
}

const ROLE_KEYS: ColumnRole[] = ['target', 'predictor', 'group', 'time', 'binary', 'weight', 'id', 'text', 'unknown']

export function analyzeDatasetQuality(dataset: Dataset | null): DataQualityReport | null {
  if (!dataset) return null
  const rows = dataset.data
  const missingCells = dataset.schema.reduce((sum, col) => sum + col.missing, 0)
  const totalCells = Math.max(dataset.rows * dataset.cols, 1)
  const missingPct = missingCells / totalCells * 100
  const duplicateRows = countDuplicateRows(rows)
  const outlierColumns = dataset.schema
    .filter((col) => col.type === 'numeric')
    .map((col) => {
      const values = numericValues(rows, col.name)
      const fences = iqrFences(values)
      const outliers = values.filter((value) => value < fences.lower || value > fences.upper).length
      return { name: col.name, outliers, outlierPct: values.length ? outliers / values.length * 100 : 0, lower: fences.lower, upper: fences.upper }
    })
    .filter((item) => item.outliers > 0)
    .sort((a, b) => b.outlierPct - a.outlierPct)

  const columnRoles = detectColumnRoles(dataset)
  const suspiciousColumns = columnRoles.flatMap((role) => role.riskFlags.map((reason) => ({
    name: role.name,
    reason,
    severity: /identifier|leakage|constant|missing/i.test(reason) ? 'warn' as const : 'info' as const,
  })))
  const typeSummary = dataset.schema.reduce((acc, col) => {
    acc[col.type] = (acc[col.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const missingColumns = dataset.schema
    .filter((col) => col.missing > 0)
    .map((col) => ({ name: col.name, missing: col.missing, missingPct: col.missingPct }))
    .sort((a, b) => b.missingPct - a.missingPct)

  const penalties =
    Math.min(35, missingPct * 1.4)
    + Math.min(18, duplicateRows / Math.max(dataset.rows, 1) * 100)
    + Math.min(18, outlierColumns.reduce((sum, col) => sum + Math.min(6, col.outlierPct / 2), 0))
    + Math.min(24, suspiciousColumns.filter((item) => item.severity === 'warn').length * 6)
  const score = Math.max(0, Math.round(100 - penalties))
  const level: DataQualityReport['level'] = score >= 82 ? 'Strong' : score >= 58 ? 'Review' : 'High Risk'

  return {
    score,
    level,
    rows: dataset.rows,
    cols: dataset.cols,
    duplicateRows,
    missingCells,
    missingPct,
    typeSummary,
    missingColumns,
    outlierColumns,
    suspiciousColumns,
    columnRoles,
    largeData: largeDatasetStrategy(dataset),
  }
}

export function detectColumnRoles(dataset: Dataset): ColumnRoleProfile[] {
  return dataset.schema.map((col) => {
    const name = col.name.toLowerCase()
    const scores = Object.fromEntries(ROLE_KEYS.map((key) => [key, 0])) as Record<ColumnRole, number>
    const reasons: string[] = []
    const riskFlags: string[] = []
    const uniqueRatio = col.unique / Math.max(dataset.rows, 1)
    const samples = col.sample.map((value) => String(value ?? '').toLowerCase())

    if (col.type === 'id' || /(^id$|_id$|uuid|guid|serial|record|account|customer.*id|code$)/i.test(col.name) || uniqueRatio > 0.96) {
      scores.id += 95
      riskFlags.push('Identifier-like column; avoid as predictor unless it encodes real information.')
    }
    if (col.type === 'numeric') {
      scores.predictor += 35
      if (/target|outcome|response|result|score|grade|price|revenue|sales|yield|temperature|amount|total/i.test(name)) scores.target += 55
      if (/weight|wt|survey|population|frequency|count/i.test(name)) scores.weight += 75
      if (col.unique <= 2 || /binary|label|class|churn|fraud|converted|success|approved|readmission|pass|fail/i.test(name)) scores.binary += 65
      if (/day|month|year|week|date|time|period|sequence|index|order/i.test(name)) scores.time += 50
    }
    if (['categorical', 'boolean'].includes(col.type)) {
      scores.group += col.unique <= Math.max(30, Math.sqrt(dataset.rows)) ? 70 : 30
      if (col.unique <= 2) scores.binary += 45
      if (/group|category|segment|region|species|treatment|class|type|status|gender|department|channel/i.test(name)) scores.group += 35
    }
    if (col.type === 'date' || /date|time|timestamp|day|month|year|week|period/i.test(name)) scores.time += 85
    if (col.type === 'text') scores.text += 55
    if (/target|outcome|response|dependent|label|class/i.test(name)) scores.target += 45
    if (/predictor|feature|input|measure|metric|value|x\d?/i.test(name)) scores.predictor += 20
    if (samples.some((value) => /^\d{4}-\d{2}-\d{2}/.test(value))) scores.time += 30

    if (col.missingPct >= 20) riskFlags.push(`${col.missingPct.toFixed(1)}% missing; clean or document before reporting.`)
    if (col.unique <= 1) riskFlags.push('Constant or single-level column; weak analysis value.')
    if (['categorical', 'text', 'id'].includes(col.type) && col.unique > Math.max(25, Math.sqrt(dataset.rows))) riskFlags.push('High-cardinality categorical field; combine rare levels before grouped tests.')
    if (scores.target >= 60) reasons.push('Name or values look outcome-like.')
    if (scores.group >= 60) reasons.push('Low-cardinality categories look group-ready.')
    if (scores.time >= 60) reasons.push('Name/type looks ordered or time-like.')
    if (scores.binary >= 60) reasons.push('Values look binary or class-like.')
    if (scores.weight >= 60) reasons.push('Name suggests weights or frequencies.')

    const primaryRole = ROLE_KEYS
      .filter((key) => key !== 'unknown')
      .sort((a, b) => scores[b] - scores[a])[0] ?? 'unknown'
    return {
      name: col.name,
      type: col.type,
      primaryRole: scores[primaryRole] > 0 ? primaryRole : 'unknown',
      roles: scores,
      reasons: reasons.length ? reasons : ['Role inferred from schema type and cardinality.'],
      riskFlags,
    }
  })
}

export function buildCleaningRecommendations(dataset: Dataset | null, moduleKey?: string, selectedFields: string[] = []): CleaningRecommendation[] {
  const report = analyzeDatasetQuality(dataset)
  if (!dataset || !report) return []
  const selected = dataset.schema.filter((col) => selectedFields.includes(col.name))
  const actions: CleaningRecommendation[] = []
  const selectedMissing = selected.filter((col) => col.missingPct > 0)
  const selectedId = report.columnRoles.filter((col) => selectedFields.includes(col.name) && col.primaryRole === 'id')
  const selectedOutliers = report.outlierColumns.filter((col) => selectedFields.includes(col.name))

  if (selectedMissing.some((col) => col.missingPct >= 20) || report.missingPct >= 10) actions.push({ title: 'Fix missing values', detail: 'High missingness can change estimates. Filter, impute, or document complete-case analysis before final output.', route: '/data/clean', action: 'Open cleaning', severity: 'warn' })
  else if (selectedMissing.length) actions.push({ title: 'Document missing handling', detail: `${selectedMissing.map((col) => col.name).join(', ')} have missing values. Make the handling rule explicit.`, route: '/data/preview', action: 'Review missingness', severity: 'info' })
  if (report.duplicateRows > 0) actions.push({ title: 'Review duplicate rows', detail: `${report.duplicateRows.toLocaleString()} exact duplicate row(s) detected in the dataset sample/full data.`, route: '/data/grid', action: 'Inspect duplicates', severity: report.duplicateRows / Math.max(dataset.rows, 1) > 0.05 ? 'warn' : 'info' })
  if (selectedId.length) actions.push({ title: 'Remove ID leakage', detail: `${selectedId.map((col) => col.name).join(', ')} looks identifier-like. Avoid it in modeling or grouping.`, route: '/data/workbench', action: 'Change role', severity: 'warn' })
  if (selectedOutliers.length) actions.push({ title: 'Check selected outliers', detail: `${selectedOutliers.map((col) => col.name).join(', ')} contain IQR outliers that can move means, regression, and PCA.`, route: '/explore/charts', action: 'Plot outliers', severity: 'info' })
  if (/anova|chi|group|box|violin|permutation/.test(moduleKey ?? '') && report.suspiciousColumns.some((col) => /High-cardinality/.test(col.reason))) actions.push({ title: 'Group rare categories', detail: 'Grouped modules work best with interpretable category levels and enough rows per cell.', route: '/data/workbench', action: 'Recode categories', severity: 'warn' })
  if (report.largeData.mode !== 'full') actions.push({ title: 'Use large-data mode', detail: report.largeData.memoryWarning, route: '/data/grid', action: 'Open paginated view', severity: 'info' })
  if (!actions.length) actions.push({ title: 'Quality looks usable', detail: 'No urgent cleaning issue was detected for the selected module. Keep assumptions and selected-column notes in the report.', route: '/data/preview', action: 'Review schema', severity: 'ok' })
  return actions.slice(0, 5)
}

export function scoreModulesForDataset(dataset: Dataset | null, modules: StatModuleDef[] = STAT_MODULES): ModuleDatasetMatch[] {
  if (!dataset) return []
  const roles = detectColumnRoles(dataset)
  const numeric = dataset.schema.filter((col) => col.type === 'numeric')
  const categorical = dataset.schema.filter((col) => ['categorical', 'boolean', 'text'].includes(col.type))
  const binary = roles.filter((col) => col.primaryRole === 'binary')
  const time = roles.filter((col) => col.primaryRole === 'time')
  const group = roles.filter((col) => col.primaryRole === 'group')
  const target = roles.filter((col) => col.primaryRole === 'target')
  const quality = analyzeDatasetQuality(dataset)

  return modules.map((module) => {
    const req = moduleRequirements(module)
    const reasons: string[] = []
    let score = 65
    if (req.numeric) numeric.length ? (score += 12, reasons.push(`${numeric.length} numeric column(s) available`)) : (score -= 35, reasons.push('Needs numeric data'))
    if (req.paired) numeric.length >= 2 ? (score += 10, reasons.push('Paired numeric columns available')) : (score -= 25, reasons.push('Needs at least two numeric columns'))
    if (req.categorical) categorical.length ? (score += 10, reasons.push(`${categorical.length} categorical/group column(s) available`)) : (score -= 25, reasons.push('Needs categorical data'))
    if (req.grouped) group.length ? (score += 8, reasons.push('Group-like columns detected')) : categorical.length ? score += 2 : score -= 14
    if (req.binary) binary.length ? (score += 12, reasons.push('Binary target/label detected')) : (score -= 20, reasons.push('Needs binary target or score'))
    if (req.time) time.length ? (score += 14, reasons.push('Time/order column detected')) : (score -= 18, reasons.push('Needs ordered rows or time field'))
    if (target.length && /regression|model|predict|classification|logistic/.test(`${module.key} ${module.title}`.toLowerCase())) score += 6
    if ((quality?.missingPct ?? 0) > 10) score -= 8
    if ((quality?.duplicateRows ?? 0) / Math.max(dataset.rows, 1) > 0.05) score -= 6
    if ((quality?.largeData.mode ?? 'full') !== 'full' && /pca|cluster|regression|bootstrap|permutation/.test(module.key)) score -= 4
    score = Math.max(0, Math.min(100, Math.round(score)))
    return {
      key: module.key,
      title: module.title.replace(' Module', ''),
      group: module.group,
      score,
      label: moduleMatchLabel(score),
      reasons: reasons.slice(0, 3),
      required: Object.entries(req).filter(([, needed]) => needed).map(([key]) => key),
    }
  }).sort((a, b) => b.score - a.score)
}

function moduleMatchLabel(score: number): ModuleDatasetMatch['label'] {
  if (score >= 86) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 45) return 'Prepare'
  return 'Risky'
}

function moduleRequirements(module: StatModuleDef) {
  const text = `${module.key} ${module.title} ${module.description}`.toLowerCase()
  return {
    numeric: !/chi|categorical dashboard|bar chart|pie|donut|sankey|treemap|report|export|script|session|notebook/.test(text),
    paired: /paired|correlation|regression|scatter|pca|cluster|roc|classification|diagnostic|forecast|time/.test(text),
    categorical: /categor|group|anova|chi|bar|pie|donut|sankey|treemap|box|violin|fisher|tukey|permutation/.test(text),
    grouped: /group|anova|kruskal|box|violin|levene|tukey|permutation|effect/.test(text),
    binary: /binary|logistic|classification|roc|mcnemar|binomial/.test(text),
    time: /time|forecast|seasonal|arima|survival|kaplan|durbin|control/.test(text),
  }
}

function largeDatasetStrategy(dataset: Dataset): LargeDatasetStrategy {
  const estimatedBytes = JSON.stringify(dataset.data.slice(0, Math.min(dataset.data.length, 1000))).length / Math.max(Math.min(dataset.data.length, 1000), 1) * dataset.rows
  const mb = estimatedBytes / 1024 / 1024
  const mode: LargeDatasetStrategy['mode'] = dataset.rows >= 250000 || mb >= 180 ? 'worker' : dataset.rows >= 75000 || mb >= 80 ? 'sample' : dataset.rows >= 15000 ? 'paginate' : 'full'
  const sampleRows = mode === 'full' ? dataset.rows : Math.min(20000, Math.max(5000, Math.round(Math.sqrt(dataset.rows) * 120)))
  const tactics = mode === 'full'
    ? ['Run exact in-browser calculations.', 'Keep full tables available.']
    : mode === 'paginate'
      ? ['Paginate table previews.', 'Use lazy chart rendering for wide outputs.']
      : mode === 'sample'
        ? ['Use representative samples for heavy charts.', 'Run exact summaries only for selected columns.', 'Warn before bootstrap/PCA/cluster calculations.']
        : ['Prefer workerized calculations.', 'Sample first, then run selected exact checks.', 'Avoid rendering all points at once.']
  return {
    mode,
    sampleRows,
    pageSize: mode === 'full' ? 1000 : 500,
    memoryWarning: mode === 'full' ? 'Dataset is small enough for direct browser calculations.' : `${dataset.rows.toLocaleString()} rows estimated at ${mb.toFixed(1)} MB; use ${mode} strategy for heavy modules.`,
    tactics,
  }
}

function countDuplicateRows(rows: Record<string, unknown>[]) {
  const seen = new Set<string>()
  let duplicates = 0
  rows.slice(0, 50000).forEach((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) duplicates += 1
    else seen.add(key)
  })
  return duplicates
}

function numericValues(rows: Record<string, unknown>[], col: string) {
  return rows.map((row) => numericCell(row[col])).filter(Number.isFinite)
}

function numericCell(value: unknown) {
  if (value == null) return NaN
  if (typeof value === 'string' && value.trim() === '') return NaN
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

function iqrFences(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length < 4) return { lower: -Infinity, upper: Infinity }
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr }
}

function quantile(sorted: number[], p: number) {
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}
