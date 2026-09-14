import { qt } from './dists'

export function asFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 1 : 0
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function numericValues(rows: Record<string, unknown>[], column: string): number[] {
  const values: number[] = []
  for (const row of rows) {
    const numeric = asFiniteNumber(row[column])
    if (numeric !== null) values.push(numeric)
  }
  return values
}

export function missingCount(rows: Record<string, unknown>[], column: string): number {
  return rows.length - numericValues(rows, column).length
}

export function categoryValues(rows: Record<string, unknown>[], column: string): string[] {
  return rows.map((row) => {
    const value = row[column]
    if (value === null || value === undefined || value === '') return '(missing)'
    return String(value)
  })
}

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sampleVariance(values: number[]): number {
  if (values.length < 2) return Number.NaN
  const m = mean(values)
  return values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1)
}

export function sampleSd(values: number[]): number {
  return Math.sqrt(sampleVariance(values))
}

/** R type-7 quantile (JASP / R default). */
export function quantileType7(sorted: number[], p: number): number {
  if (sorted.length === 0) return Number.NaN
  if (sorted.length === 1) return sorted[0]
  const h = 1 + (sorted.length - 1) * p
  const lo = Math.floor(h) - 1
  const hi = Math.ceil(h) - 1
  const weight = h - Math.floor(h)
  return sorted[lo] * (1 - weight) + sorted[hi] * weight
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return quantileType7(sorted, 0.5)
}

/** Unbiased sample skewness G1 (Fisher). */
export function sampleSkewness(values: number[]): number {
  const n = values.length
  if (n < 3) return Number.NaN
  const m = mean(values)
  const s = sampleSd(values)
  if (s === 0) return 0
  const m3 = values.reduce((sum, value) => sum + ((value - m) / s) ** 3, 0)
  return (n / ((n - 1) * (n - 2))) * m3
}

/** Unbiased excess kurtosis G2 (Fisher). */
export function sampleKurtosis(values: number[]): number {
  const n = values.length
  if (n < 4) return Number.NaN
  const m = mean(values)
  const s = sampleSd(values)
  if (s === 0) return Number.NaN
  const m4 = values.reduce((sum, value) => sum + ((value - m) / s) ** 4, 0)
  const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))
  const b = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
  return a * m4 - b
}

export function seSkewness(n: number): number {
  if (n < 3) return Number.NaN
  return Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)))
}

export function seKurtosis(n: number): number {
  if (n < 4) return Number.NaN
  return Math.sqrt((24 * n * (n - 1) ** 2) / ((n - 3) * (n - 2) * (n + 3) * (n + 5)))
}

export function modes(values: number[]): { values: number[]; frequency: number } {
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let frequency = 0
  for (const count of counts.values()) frequency = Math.max(frequency, count)
  const modeValues = [...counts.entries()].filter(([, count]) => count === frequency).map(([value]) => value).sort((a, b) => a - b)
  return { values: modeValues, frequency }
}

export function iqrOutliers(sorted: number[]): { lower: number; upper: number; outliers: number[] } {
  const q1 = quantileType7(sorted, 0.25)
  const q3 = quantileType7(sorted, 0.75)
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr
  return { lower, upper, outliers: sorted.filter((value) => value < lower || value > upper) }
}

export function round(value: number, digits = 6): number | string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(digits))
}

export function formatMaybe(value: number | string): string | number {
  return typeof value === 'number' ? round(value) : value
}

export { pnorm, qnorm } from './dists'

/** Two-tailed Student-t critical value. */
export function tCritical(df: number, alpha: number): number {
  return qt(1 - alpha / 2, df)
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return Number.NaN
  const mx = mean(xs.slice(0, n))
  const my = mean(ys.slice(0, n))
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const den = Math.sqrt(dx * dy)
  return den === 0 ? Number.NaN : num / den
}

export function groupedNumeric(rows: Record<string, unknown>[], groupCol: string, valueCol: string): { name: string; values: number[] }[] {
  const map = new Map<string, number[]>()
  for (const row of rows) {
    const numeric = asFiniteNumber(row[valueCol])
    if (numeric === null) continue
    const raw = row[groupCol]
    const key = raw === null || raw === undefined || raw === '' ? '(missing)' : String(raw)
    const list = map.get(key) ?? []
    list.push(numeric)
    map.set(key, list)
  }
  return [...map.entries()].map(([name, values]) => ({ name, values }))
}

export function pairedComplete(rows: Record<string, unknown>[], a: string, b: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const row of rows) {
    const x = asFiniteNumber(row[a])
    const y = asFiniteNumber(row[b])
    if (x !== null && y !== null) out.push({ x, y })
  }
  return out
}

export function gaussianKde(values: number[], points: number[]): number[] {
  const n = values.length
  const sd = sampleSd(values)
  const h = 1.06 * sd * n ** (-1 / 5) || 1
  return points.map((x) => {
    let sum = 0
    for (const value of values) {
      const z = (x - value) / h
      sum += Math.exp(-0.5 * z * z)
    }
    return sum / (n * h * Math.sqrt(2 * Math.PI))
  })
}
