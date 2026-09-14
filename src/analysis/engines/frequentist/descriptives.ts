import type { AnalysisOptions, AnalysisResult, AnalysisTable } from '../../types'
import {
  categoryValues,
  formatMaybe,
  iqrOutliers,
  mean,
  median,
  modes,
  numericValues,
  quantileType7,
  round,
  sampleKurtosis,
  sampleSd,
  sampleSkewness,
  sampleVariance,
  seKurtosis,
  seSkewness,
  tCritical,
} from './numeric'
import { shapiroWilk } from './shapiroWilk'

export type StatFlags = {
  valid: boolean
  missing: boolean
  mean: boolean
  se: boolean
  sd: boolean
  variance: boolean
  iqr: boolean
  range: boolean
  min: boolean
  max: boolean
  sum: boolean
  median: boolean
  mode: boolean
  q1: boolean
  q3: boolean
  cv: boolean
  skew: boolean
  kurtosis: boolean
  shapiro: boolean
  ciMean: boolean
}

export const DEFAULT_STAT_FLAGS: StatFlags = {
  valid: true,
  missing: true,
  mean: true,
  se: true,
  sd: true,
  variance: true,
  iqr: true,
  range: true,
  min: true,
  max: true,
  sum: true,
  median: true,
  mode: true,
  q1: true,
  q3: true,
  cv: true,
  skew: true,
  kurtosis: true,
  shapiro: true,
  ciMean: true,
}

export type NumericDescription = {
  variable: string
  group: string
  valid: number
  missing: number
  mean: number
  se: number
  sd: number
  variance: number
  min: number
  max: number
  range: number
  sum: number
  median: number
  q1: number
  q3: number
  iqr: number
  cv: number
  skew: number
  seSkew: number
  kurtosis: number
  seKurt: number
  mode: string
  shapiroW: number
  shapiroP: number
  ciLow: number
  ciHigh: number
  outlierCount: number
  whiskerLow: number
  whiskerHigh: number
}

export function describeNumeric(values: number[], missing: number, ciLevel = 0.95): Omit<NumericDescription, 'variable' | 'group'> {
  const n = values.length
  const sorted = [...values].sort((a, b) => a - b)
  const m = n ? mean(values) : Number.NaN
  const sd = n > 1 ? sampleSd(values) : Number.NaN
  const se = n > 1 ? sd / Math.sqrt(n) : Number.NaN
  const t = n > 1 ? tCritical(n - 1, 1 - ciLevel) : Number.NaN
  const sw = n >= 3 && n <= 5000 ? shapiroWilk(values) : { w: Number.NaN, p: Number.NaN }
  const fences = n ? iqrOutliers(sorted) : { lower: Number.NaN, upper: Number.NaN, outliers: [] }
  const modeResult = n ? modes(values) : { values: [], frequency: 0 }
  const modeLabel = !n ? '—'
    : modeResult.frequency === 1 && modeResult.values.length === n ? 'all unique'
    : modeResult.values.map((value) => String(round(value, 6))).join(', ')

  return {
    valid: n,
    missing,
    mean: m,
    se,
    sd,
    variance: n > 1 ? sampleVariance(values) : Number.NaN,
    min: n ? sorted[0] : Number.NaN,
    max: n ? sorted[n - 1] : Number.NaN,
    range: n ? sorted[n - 1] - sorted[0] : Number.NaN,
    sum: n ? values.reduce((total, value) => total + value, 0) : Number.NaN,
    median: n ? median(values) : Number.NaN,
    q1: n ? quantileType7(sorted, 0.25) : Number.NaN,
    q3: n ? quantileType7(sorted, 0.75) : Number.NaN,
    iqr: n ? quantileType7(sorted, 0.75) - quantileType7(sorted, 0.25) : Number.NaN,
    cv: n && m !== 0 ? sd / Math.abs(m) : Number.NaN,
    skew: sampleSkewness(values),
    seSkew: seSkewness(n),
    kurtosis: sampleKurtosis(values),
    seKurt: seKurtosis(n),
    mode: modeLabel,
    shapiroW: sw.w,
    shapiroP: sw.p,
    ciLow: n > 1 ? m - t * se : Number.NaN,
    ciHigh: n > 1 ? m + t * se : Number.NaN,
    outlierCount: fences.outliers.length,
    whiskerLow: n ? Math.max(sorted[0], fences.lower) : Number.NaN,
    whiskerHigh: n ? Math.min(sorted[n - 1], fences.upper) : Number.NaN,
  }
}

function flagsFromOptions(options: AnalysisOptions): StatFlags {
  const group = options.statistics
  if (!group || typeof group !== 'object' || Array.isArray(group)) return DEFAULT_STAT_FLAGS
  return { ...DEFAULT_STAT_FLAGS, ...group as Partial<StatFlags> }
}

function splitRows(rows: Record<string, unknown>[], splitBy: string | undefined) {
  if (!splitBy) return [['All', rows] as const]
  const groups = new Map<string, Record<string, unknown>[]>()
  for (const row of rows) {
    const raw = row[splitBy]
    const key = raw === null || raw === undefined || raw === '' ? '(missing)' : String(raw)
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }
  return [...groups.entries()]
}

export function runDescriptiveStatistics(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = (Array.isArray(options.variables) ? options.variables : options.variables ? [String(options.variables)] : []) as string[]
  const splitBy = typeof options.splitBy === 'string' ? options.splitBy : ''
  const ciLevel = typeof options.ciLevel === 'number' ? options.ciLevel : 0.95
  const flags = flagsFromOptions(options)
  const groups = splitRows(rows, splitBy || undefined)

  const descriptions: NumericDescription[] = []
  for (const variable of variables) {
    for (const [group, groupRows] of groups) {
      const values = numericValues(groupRows, variable)
      const missing = groupRows.length - values.length
      descriptions.push({ variable, group, ...describeNumeric(values, missing, ciLevel) })
    }
  }

  const columns = ['Variable', ...(splitBy ? ['Split'] : [])]
  const add = (key: keyof StatFlags, label: string) => {
    if (flags[key]) columns.push(label)
  }
  add('valid', 'Valid')
  add('missing', 'Missing')
  add('mean', 'Mean')
  add('se', 'Std. Error')
  add('ciMean', `${Math.round(ciLevel * 100)}% CI Low`)
  add('ciMean', `${Math.round(ciLevel * 100)}% CI High`)
  add('sd', 'Std. Deviation')
  add('variance', 'Variance')
  add('cv', 'CV')
  add('min', 'Minimum')
  add('q1', 'Q1')
  add('median', 'Median')
  add('q3', 'Q3')
  add('max', 'Maximum')
  add('range', 'Range')
  add('iqr', 'IQR')
  add('sum', 'Sum')
  add('mode', 'Mode')
  add('skew', 'Skewness')
  add('skew', 'SE Skewness')
  add('kurtosis', 'Kurtosis')
  add('kurtosis', 'SE Kurtosis')
  add('shapiro', 'Shapiro–Wilk W')
  add('shapiro', 'Shapiro–Wilk p')

  const tableRows = descriptions.map((row) => {
    const cells: Array<string | number> = [row.variable]
    if (splitBy) cells.push(row.group)
    const pushFlag = (key: keyof StatFlags, value: string | number) => {
      if (flags[key]) cells.push(value)
    }
    pushFlag('valid', row.valid)
    pushFlag('missing', row.missing)
    pushFlag('mean', formatMaybe(row.mean))
    pushFlag('se', formatMaybe(row.se))
    pushFlag('ciMean', formatMaybe(row.ciLow))
    pushFlag('ciMean', formatMaybe(row.ciHigh))
    pushFlag('sd', formatMaybe(row.sd))
    pushFlag('variance', formatMaybe(row.variance))
    pushFlag('cv', formatMaybe(row.cv))
    pushFlag('min', formatMaybe(row.min))
    pushFlag('q1', formatMaybe(row.q1))
    pushFlag('median', formatMaybe(row.median))
    pushFlag('q3', formatMaybe(row.q3))
    pushFlag('max', formatMaybe(row.max))
    pushFlag('range', formatMaybe(row.range))
    pushFlag('iqr', formatMaybe(row.iqr))
    pushFlag('sum', formatMaybe(row.sum))
    pushFlag('mode', row.mode)
    pushFlag('skew', formatMaybe(row.skew))
    pushFlag('skew', formatMaybe(row.seSkew))
    pushFlag('kurtosis', formatMaybe(row.kurtosis))
    pushFlag('kurtosis', formatMaybe(row.seKurt))
    pushFlag('shapiro', formatMaybe(row.shapiroW))
    pushFlag('shapiro', formatMaybe(row.shapiroP))
    return cells
  })

  const frequencyTables: AnalysisTable[] = []
  const categorical = (Array.isArray(options.categorical) ? options.categorical : []) as string[]
  for (const column of categorical) {
    const values = categoryValues(rows, column)
    const counts = new Map<string, number>()
    values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1])
    frequencyTables.push({
      id: `freq-${column}`,
      title: `Frequencies — ${column}`,
      columns: ['Level', 'Count', 'Percent'],
      rows: entries.map(([level, count]) => [level, count, round(100 * count / values.length, 3)]),
    })
  }

  const assumptions = descriptions.flatMap((row) => {
    const notes: string[] = []
    if (row.valid < 3) notes.push(`${row.variable}: Shapiro–Wilk needs at least 3 observations.`)
    if (row.valid > 5000) notes.push(`${row.variable}: Shapiro–Wilk is reported only up to n = 5000.`)
    if (row.sd === 0) notes.push(`${row.variable}: values are constant.`)
    if (row.shapiroP < 0.05) notes.push(`${row.variable}${splitBy ? ` (${row.group})` : ''}: Shapiro–Wilk p = ${round(row.shapiroP, 4)} suggests departure from normality.`)
    return notes
  })

  return {
    analysisId: 'descriptives.statistics',
    title: 'Descriptive Statistics',
    interpretation: descriptions.length
      ? `Summarized ${descriptions.length} variable×group row${descriptions.length === 1 ? '' : 's'} using sample moments (G1 skewness, G2 excess kurtosis), R type-7 quantiles, and Shapiro–Wilk (AS R94).`
      : 'Select at least one numeric variable.',
    assumptions,
    footnotes: [
      'Std. Deviation and Variance are sample (n − 1) estimators.',
      'Quantiles use R type 7 (JASP / R default).',
      'Skewness and kurtosis are Fisher G1 / G2 (excess kurtosis).',
      'Shapiro–Wilk follows Royston AS R94; p is the normality p-value.',
      'Mean confidence interval uses the Student-t critical value with n − 1 df.',
    ],
    tables: [
      { id: 'descriptives', title: 'Descriptive Statistics', columns, rows: tableRows },
      ...frequencyTables,
    ],
    plots: descriptions.slice(0, 8).map((row) => {
      const values = numericValues(
        splitBy ? rows.filter((item) => String(item[splitBy] ?? '(missing)') === row.group) : rows,
        row.variable,
      )
      return {
        id: `hist-${row.variable}-${row.group}`,
        title: `Distribution — ${row.variable}${splitBy ? ` | ${row.group}` : ''}`,
        data: [
          { type: 'histogram', x: values, histnorm: 'probability density', name: 'Histogram', marker: { color: '#4f46e5', opacity: 0.65 }, nbinsx: Math.min(30, Math.max(8, Math.round(Math.sqrt(values.length)))) },
          { type: 'box', y: values, name: 'Box', yaxis: 'y2', boxpoints: 'outliers', marker: { color: '#0f172a' } },
        ],
        layout: {
          showlegend: false,
          margin: { t: 36, r: 48, b: 40, l: 48 },
          yaxis: { title: 'Density' },
          yaxis2: { overlaying: 'y', side: 'right', showgrid: false, title: '' },
        },
      }
    }),
  }
}
