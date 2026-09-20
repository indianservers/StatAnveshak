import {
  asFiniteNumber,
  mean,
  median,
  modes,
  numericValues,
  pairedComplete,
  pearson,
  populationSd,
  populationVariance,
  quantileType7,
  sampleKurtosis,
  sampleSd,
  sampleSkewness,
  sampleVariance,
  sdOf,
  sum,
  varianceOf,
  type SpreadKind,
} from '../analysis/engines/frequentist/numeric'

export type { SpreadKind }
export {
  asFiniteNumber,
  mean,
  median,
  modes,
  numericValues,
  pairedComplete,
  pearson,
  populationSd,
  populationVariance,
  quantileType7,
  sampleKurtosis,
  sampleSd,
  sampleSkewness,
  sampleVariance,
  sdOf,
  sum,
  varianceOf,
}

export const DISPLAY_DIGITS = 4
export const DETAIL_DIGITS = 8

export type ParseIssue = { token: string; index: number }

export type ParsedNumberList = {
  values: number[]
  issues: ParseIssue[]
  tokenCount: number
}

export type SeriesDescription = {
  valid: number
  missing: number
  sum: number
  mean: number
  median: number
  mode: string
  min: number
  max: number
  range: number
  variance: number
  sd: number
  q1: number
  q2: number
  q3: number
  iqr: number
  cv: number
  skewness: number
  kurtosis: number
  spreadKind: SpreadKind
}

export type LinearRegressionResult =
  | {
      ok: true
      n: number
      intercept: number
      slope: number
      r: number
      r2: number
      sse: number
      mse: number
      se: number
      fitted: number[]
      residuals: number[]
    }
  | { ok: false; error: string }

export type CorrelationResult =
  | { ok: true; method: 'pearson' | 'spearman'; r: number; n: number; descriptor: string }
  | { ok: false; error: string }

export type CovarianceResult =
  | { ok: true; covariance: number; n: number; kind: SpreadKind }
  | { ok: false; error: string }

export function formatStat(value: number, digits = DISPLAY_DIGITS): string {
  if (!Number.isFinite(value)) return '—'
  if (Object.is(value, -0)) return digits === 0 ? '0' : (0).toFixed(digits)
  const abs = Math.abs(value)
  if (abs !== 0 && (abs >= 1e7 || abs < 1e-4)) return value.toExponential(3)
  const rounded = Number(value.toFixed(digits))
  return Object.is(rounded, -0) ? (0).toFixed(Math.min(digits, 4)) : String(rounded)
}

export function formatStatDetail(value: number): string {
  return formatStat(value, DETAIL_DIGITS)
}

export function isMissingValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true
  if (typeof value === 'number') return !Number.isFinite(value)
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

export function parseNumberList(text: string): ParsedNumberList {
  const tokens = text
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
  const values: number[] = []
  const issues: ParseIssue[] = []
  tokens.forEach((token, index) => {
    const numeric = Number(token)
    if (!Number.isFinite(numeric)) {
      issues.push({ token, index })
      return
    }
    values.push(numeric)
  })
  return { values, issues, tokenCount: tokens.length }
}

export function extractNumericSeries(rows: Record<string, unknown>[], column: string): { values: number[]; missing: number } {
  const values: number[] = []
  let missing = 0
  for (const row of rows) {
    const raw = row[column]
    if (isMissingValue(raw)) {
      missing += 1
      continue
    }
    const numeric = asFiniteNumber(raw)
    if (numeric === null) {
      missing += 1
      continue
    }
    values.push(numeric)
  }
  return { values, missing }
}

export function requireFiniteNumber(value: unknown, label: string): string | null {
  if (value === '' || value === null || value === undefined) return `${label} is required.`
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return `${label} must be a finite number.`
  return null
}

export function requirePositiveNumber(value: unknown, label: string): string | null {
  const required = requireFiniteNumber(value, label)
  if (required) return required
  if (Number(value) <= 0) return `${label} must be greater than 0.`
  return null
}

export function requirePositiveInteger(value: unknown, label: string, max?: number): string | null {
  const required = requireFiniteNumber(value, label)
  if (required) return required
  const numeric = Number(value)
  if (!Number.isInteger(numeric)) return `${label} must be a positive integer.`
  if (numeric <= 0) return `${label} must be a positive integer.`
  if (max !== undefined && numeric > max) return `${label} must be at most ${max}.`
  return null
}

export function requireProbability(value: unknown, label: string): string | null {
  const required = requireFiniteNumber(value, label)
  if (required) return required
  const numeric = Number(value)
  if (numeric < 0 || numeric > 1) return `${label} must be between 0 and 1.`
  return null
}

export function requireMinimumObservations(count: number, min: number, label: string): string | null {
  if (count < min) {
    return `At least ${min} valid numeric observation${min === 1 ? '' : 's'} ${min === 1 ? 'is' : 'are'} required to calculate ${label}.`
  }
  return null
}

export function requirePairedLength(x: number[], y: number[]): string | null {
  if (x.length !== y.length) return 'Paired variables must have the same number of aligned observations.'
  return null
}

export function requireNonzeroVariance(values: number[], label: string, kind: SpreadKind = 'sample'): string | null {
  const sd = sdOf(values, kind)
  if (!Number.isFinite(sd) || sd === 0) return `${label} has no variation, so this statistic cannot be calculated.`
  return null
}

export function iqr(values: number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  return quantileType7(sorted, 0.75) - quantileType7(sorted, 0.25)
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0 || !Number.isFinite(p) || p < 0 || p > 100) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  return quantileType7(sorted, p / 100)
}

export function coefficientOfVariation(values: number[], kind: SpreadKind = 'sample'): number {
  const m = mean(values)
  const sd = sdOf(values, kind)
  if (!Number.isFinite(m) || !Number.isFinite(sd) || m === 0) return Number.NaN
  return sd / Math.abs(m)
}

export function describeSeries(values: number[], missing = 0, kind: SpreadKind = 'sample'): SeriesDescription {
  const n = values.length
  const sorted = [...values].sort((a, b) => a - b)
  const m = n ? mean(values) : Number.NaN
  const variance = n === 0 ? Number.NaN : kind === 'population' ? (n >= 1 ? populationVariance(values) : Number.NaN) : (n >= 2 ? sampleVariance(values) : Number.NaN)
  const sd = Math.sqrt(variance)
  const modeResult = n ? modes(values) : { values: [] as number[], frequency: 0 }
  const modeLabel = !n
    ? '—'
    : modeResult.frequency === 1 && modeResult.values.length === n
      ? 'all unique'
      : modeResult.values.map((value) => formatStat(value, 6)).join(', ')

  return {
    valid: n,
    missing,
    sum: n ? sum(values) : Number.NaN,
    mean: m,
    median: n ? median(values) : Number.NaN,
    mode: modeLabel,
    min: n ? sorted[0]! : Number.NaN,
    max: n ? sorted[n - 1]! : Number.NaN,
    range: n ? sorted[n - 1]! - sorted[0]! : Number.NaN,
    variance,
    sd,
    q1: n ? quantileType7(sorted, 0.25) : Number.NaN,
    q2: n ? quantileType7(sorted, 0.5) : Number.NaN,
    q3: n ? quantileType7(sorted, 0.75) : Number.NaN,
    iqr: n ? quantileType7(sorted, 0.75) - quantileType7(sorted, 0.25) : Number.NaN,
    cv: n && m !== 0 && Number.isFinite(sd) ? sd / Math.abs(m) : Number.NaN,
    skewness: sampleSkewness(values),
    kurtosis: sampleKurtosis(values),
    spreadKind: kind,
  }
}

export function meanTrace(values: number[]): string[] {
  const total = sum(values)
  const n = values.length
  return [
    `Σx = ${formatStatDetail(total)}`,
    `n = ${n}`,
    `Mean = ${formatStatDetail(total)} / ${n} = ${formatStat(mean(values))}`,
  ]
}

export function ranks(values: number[]): number[] {
  const order = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value)
  const out = Array<number>(values.length).fill(0)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j < order.length && order[j]!.value === order[i]!.value) j += 1
    const rank = (i + 1 + j) / 2
    for (let k = i; k < j; k += 1) out[order[k]!.i] = rank
    i = j
  }
  return out
}

export function covariance(xs: number[], ys: number[], kind: SpreadKind = 'sample'): CovarianceResult {
  const paired = requirePairedLength(xs, ys)
  if (paired) return { ok: false, error: paired }
  const n = xs.length
  const minN = kind === 'sample' ? 2 : 1
  const obs = requireMinimumObservations(n, minN, kind === 'sample' ? 'sample covariance' : 'population covariance')
  if (obs) return { ok: false, error: obs }
  const mx = mean(xs)
  const my = mean(ys)
  let total = 0
  for (let i = 0; i < n; i += 1) total += (xs[i]! - mx) * (ys[i]! - my)
  const denom = kind === 'sample' ? n - 1 : n
  return { ok: true, covariance: total / denom, n, kind }
}

export function correlationDescriptor(r: number): string {
  if (!Number.isFinite(r)) return 'Correlation is undefined for this pair.'
  const abs = Math.abs(r)
  const strength = abs >= 0.8 ? 'strong' : abs >= 0.5 ? 'moderate' : abs >= 0.2 ? 'weak' : 'negligible'
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no'
  if (r === 0) return 'No linear association in these paired observations. This does not imply causation.'
  return `${strength} ${direction} linear association (r = ${formatStat(r)}). This does not imply causation.`
}

export function pearsonCorrelation(xs: number[], ys: number[]): CorrelationResult {
  const paired = requirePairedLength(xs, ys)
  if (paired) return { ok: false, error: paired }
  const obs = requireMinimumObservations(xs.length, 2, 'Pearson correlation')
  if (obs) return { ok: false, error: obs }
  const xVar = requireNonzeroVariance(xs, 'The first variable')
  if (xVar) return { ok: false, error: 'Pearson correlation needs variation in both variables.' }
  const yVar = requireNonzeroVariance(ys, 'The second variable')
  if (yVar) return { ok: false, error: 'Pearson correlation needs variation in both variables.' }
  const r = pearson(xs, ys)
  if (!Number.isFinite(r)) return { ok: false, error: 'Pearson correlation could not be calculated for these paired observations.' }
  return { ok: true, method: 'pearson', r, n: xs.length, descriptor: correlationDescriptor(r) }
}

export function spearmanCorrelation(xs: number[], ys: number[]): CorrelationResult {
  const paired = requirePairedLength(xs, ys)
  if (paired) return { ok: false, error: paired }
  const obs = requireMinimumObservations(xs.length, 2, 'Spearman correlation')
  if (obs) return { ok: false, error: obs }
  const r = pearson(ranks(xs), ranks(ys))
  if (!Number.isFinite(r)) return { ok: false, error: 'Spearman correlation could not be calculated for these paired observations.' }
  return { ok: true, method: 'spearman', r, n: xs.length, descriptor: correlationDescriptor(r) }
}

export function pairedNumeric(rows: Record<string, unknown>[], xCol: string, yCol: string): { x: number[]; y: number[]; n: number; dropped: number } {
  const pairs = pairedComplete(rows, xCol, yCol)
  return {
    x: pairs.map((pair) => pair.x),
    y: pairs.map((pair) => pair.y),
    n: pairs.length,
    dropped: rows.length - pairs.length,
  }
}

export function simpleLinearRegression(xs: number[], ys: number[]): LinearRegressionResult {
  const paired = requirePairedLength(xs, ys)
  if (paired) return { ok: false, error: paired }
  const obs = requireMinimumObservations(xs.length, 2, 'simple linear regression')
  if (obs) return { ok: false, error: obs }
  const xVar = requireNonzeroVariance(xs, 'The predictor (x)')
  if (xVar) return { ok: false, error: 'The predictor is constant, so a unique slope cannot be estimated.' }
  const mx = mean(xs)
  const my = mean(ys)
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < xs.length; i += 1) {
    const dx = xs[i]! - mx
    sxx += dx * dx
    sxy += dx * (ys[i]! - my)
  }
  const slope = sxy / sxx
  const intercept = my - slope * mx
  const fitted = xs.map((x) => intercept + slope * x)
  const residuals = ys.map((y, i) => y - fitted[i]!)
  const sse = residuals.reduce((total, residual) => total + residual * residual, 0)
  const sst = ys.reduce((total, y) => total + (y - my) ** 2, 0)
  const r2 = sst === 0 ? Number.NaN : 1 - sse / sst
  const r = pearson(xs, ys)
  const df = xs.length - 2
  const mse = df > 0 ? sse / df : Number.NaN
  const se = df > 0 && sxx > 0 ? Math.sqrt(mse / sxx) : Number.NaN
  if (![intercept, slope].every(Number.isFinite)) {
    return { ok: false, error: 'Regression estimates were not finite. Check that x and y are numeric and not constant.' }
  }
  return {
    ok: true,
    n: xs.length,
    intercept,
    slope,
    r,
    r2,
    sse,
    mse,
    se,
    fitted,
    residuals,
  }
}

export function theoreticalSamplingMoments(mu: number, variance: number, n: number): {
  mu: number
  variance: number
  sd: number
  meanOfMean: number
  varOfMean: number
  se: number
} {
  const sd = Math.sqrt(variance)
  return {
    mu,
    variance,
    sd,
    meanOfMean: mu,
    varOfMean: n > 0 ? variance / n : Number.NaN,
    se: n > 0 ? sd / Math.sqrt(n) : Number.NaN,
  }
}

export function significanceStatement(p: number, alpha = 0.05): string {
  if (!Number.isFinite(p)) return 'The p-value could not be computed for these inputs.'
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) {
    return `The p-value is ${formatStat(p, 4)}.`
  }
  return p < alpha
    ? `At α = ${formatStat(alpha, 3)}, the result is statistically significant (p = ${formatStat(p, 4)}).`
    : `At α = ${formatStat(alpha, 3)}, the result is not statistically significant (p = ${formatStat(p, 4)}).`
}
