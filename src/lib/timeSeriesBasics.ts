import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const TS_STUDIO_SLUG = 'time-series-basics'
export const TS_PROGRESS_KEY = 'anveshak-time-series-basics'
export const TS_NEXT_STUDIO_SLUG = 'nonparametric-statistics'

export const TS_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === TS_STUDIO_SLUG) as Studio
export const TS_NEXT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === TS_NEXT_STUDIO_SLUG) as Studio

export type TsProgress = { completed: string[] }
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'index'
export type MaAlign = 'trailing' | 'centered'
export type SeasonMode = 'additive' | 'multiplicative'

export type TsObservation = {
  id: string
  t: number
  value: number
  season?: number
  label?: string
}

export type PresetId =
  | 'noise'
  | 'linear-up'
  | 'linear-down'
  | 'seasonal-monthly'
  | 'trend-season'
  | 'break'
  | 'changing-var'
  | 'ar1'
  | 'ma1'
  | 'rw'
  | 'rw-drift'
  | 'daily-temp'
  | 'airline'
  | 'retail-sales'

export type LinearTrend = {
  intercept: number
  slope: number
  fitted: number[]
  residuals: number[]
  r2: number
  sst: number
  sse: number
}

export type AcfResult = {
  lags: number[]
  values: Array<number | undefined>
  band: number
  n: number
  defined: boolean
}

export type MaSmoothResult = {
  k: number
  align: MaAlign
  smoothed: Array<number | undefined>
  edgeIndexes: number[]
}

export type SeasonalResult = {
  mode: SeasonMode
  period: number
  indexes: number[]
  seasonal: Array<number | undefined>
  deseasonalized: Array<number | undefined>
}

export type DifferenceResult = {
  d: number
  values: number[]
  original: number[]
  unnecessary: boolean
  warning?: string
}

export type ArimaSpec = { p: 0 | 1 | 2; d: 0 | 1 | 2; q: 0 | 1 | 2 }

export const TS_HOME_COPY: Record<string, { blurb: string; sidebar: string; tryThis: string }> = {
  'time-plot': {
    blurb: 'Visualize data over time and spot patterns, trends, and unusual behavior.',
    sidebar: 'Read the series in order',
    tryThis: 'Shuffle the same values. The dates stay; the story disappears.',
  },
  trend: {
    blurb: 'Identify and understand long-term movement in a series. Trend is the slow direction under the wiggles.',
    sidebar: 'Long-run direction',
    tryThis: 'Overlay the trend, then look at Y − T. Season and noise remain.',
  },
  seasonality: {
    blurb: 'Explore repeating patterns over a fixed period and see how they shape forecasts.',
    sidebar: 'Repeating period m',
    tryThis: 'Raise the amplitude, then read the seasonal subseries for December vs January.',
  },
  'moving-average': {
    blurb: 'Smooth short-run noise to see the bigger picture. Window size decides what you keep.',
    sidebar: 'Smooth with a window',
    tryThis: 'Compare k = 3 with k = 12. The large window follows the trend and hides the month-to-month hops.',
  },
  autocorrelation: {
    blurb: 'See how past values relate to future values. Autocorrelation measures similarity with a lagged copy.',
    sidebar: 'Correlate Y_t with Y_{t−k}',
    tryThis: 'Slide the lag. The scatter of Y_t vs Y_{t−k} is the same number the bar at that lag reports.',
  },
  'acf-pacf': {
    blurb: 'Use autocorrelation and partial autocorrelation together to read typical AR and MA lag structure.',
    sidebar: 'Two complementary lag plots',
    tryThis: 'Switch the AR(1) and MA(1) presets. ACF and PACF cut off in opposite ways — typically, not as a rigid rule.',
  },
  stationarity: {
    blurb: 'Ask whether mean and variance stay put, then difference or detrend when they do not.',
    sidebar: 'Stable mean and variance',
    tryThis: 'Turn on trend, then first-difference. A flat-looking graph is not the same as stationarity.',
  },
  'white-noise-random-walk': {
    blurb: 'Compare a series with no memory to one that never forgets — using the same shocks.',
    sidebar: 'No memory vs permanent shocks',
    tryThis: 'Keep the seed fixed. White noise jitters in place; the random walk wanders with those same innovations.',
  },
  'ar-ma-arima-intuition': {
    blurb: 'See how autoregressive, moving-average, and differenced pieces combine into ARIMA.',
    sidebar: 'AR, MA, then ARIMA',
    tryThis: 'Inject a shock. AR memory decays by φᵏ; MA memory lasts one lag; a random walk never lets go.',
  },
}

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const AIRLINE_SEASON = [0.88, 0.86, 0.95, 0.98, 1.02, 1.12, 1.22, 1.24, 1.08, 0.96, 0.86, 1.18]
export const RETAIL_SEASON = [0.82, 0.78, 0.9, 0.95, 1.02, 1.05, 1.0, 1.02, 0.98, 1.04, 1.12, 1.32]

export class SeededRng {
  private state: number

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  normal(mean = 0, sd = 1): number {
    const u = Math.max(this.next(), 1e-12)
    const v = this.next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}

export function formatNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function variance(values: number[], sample = true): number {
  if (values.length < (sample ? 2 : 1)) return Number.NaN
  const mu = mean(values)
  const ss = values.reduce((sum, value) => sum + (value - mu) ** 2, 0)
  return ss / (sample ? values.length - 1 : values.length)
}

export function valuesOf(series: TsObservation[]): number[] {
  return series.map((row) => row.value)
}

export function chronological(series: TsObservation[]): TsObservation[] {
  return [...series].sort((a, b) => a.t - b.t)
}

export function shuffleValues(series: TsObservation[], seed: number): TsObservation[] {
  const ordered = chronological(series)
  const bag = valuesOf(ordered)
  const rng = new SeededRng(seed)
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    const tmp = bag[i]!
    bag[i] = bag[j]!
    bag[j] = tmp
  }
  return ordered.map((row, i) => ({ ...row, value: bag[i]! }))
}

export function maxAcfLag(n: number, requested?: number): number {
  if (n < 3) return 0
  const cap = Math.max(1, n - 1)
  if (requested === undefined) return Math.min(cap, Math.max(1, Math.floor(n / 4)))
  return Math.max(0, Math.min(Math.floor(requested), cap))
}

export function sampleAcf(values: number[], maxLag?: number): AcfResult {
  const n = values.length
  const lagCap = maxAcfLag(n, maxLag)
  const mu = mean(values)
  const denom = values.reduce((sum, value) => sum + (value - mu) ** 2, 0)
  const defined = denom > 0 && n >= 2
  const lags: number[] = []
  const acf: Array<number | undefined> = []
  for (let lag = 0; lag <= lagCap; lag++) {
    lags.push(lag)
    if (!defined) {
      acf.push(undefined)
      continue
    }
    if (lag === 0) {
      acf.push(1)
      continue
    }
    let num = 0
    for (let i = lag; i < n; i++) num += (values[i]! - mu) * (values[i - lag]! - mu)
    acf.push(num / denom)
  }
  return { lags, values: acf, band: n > 0 ? 1.96 / Math.sqrt(n) : Number.NaN, n, defined }
}

export function samplePacf(acf: AcfResult): AcfResult {
  const maxLag = acf.lags.length ? acf.lags[acf.lags.length - 1]! : 0
  const rho = acf.values
  const pac: Array<number | undefined> = []
  const phi: Array<Array<number | undefined>> = Array.from({ length: maxLag + 1 }, () => Array(maxLag + 1).fill(undefined))
  for (let k = 0; k <= maxLag; k++) {
    if (!acf.defined || rho[k] === undefined) {
      pac.push(undefined)
      continue
    }
    if (k === 0) {
      pac.push(1)
      continue
    }
    let num = rho[k]!
    let den = 1
    for (let j = 1; j < k; j++) {
      const prev = phi[k - 1]![j]
      if (prev === undefined || rho[k - j] === undefined || rho[j] === undefined) {
        num = Number.NaN
        den = Number.NaN
        break
      }
      num -= prev * rho[k - j]!
      den -= prev * rho[j]!
    }
    if (!Number.isFinite(num) || !Number.isFinite(den) || Math.abs(den) < 1e-12) {
      phi[k]![k] = undefined
      pac.push(undefined)
      continue
    }
    phi[k]![k] = num / den
    for (let j = 1; j < k; j++) {
      const a = phi[k - 1]![j]
      const b = phi[k - 1]![k - j]
      phi[k]![j] = a === undefined || b === undefined ? undefined : a - phi[k]![k]! * b
    }
    pac.push(phi[k]![k])
  }
  return { lags: acf.lags, values: pac, band: acf.band, n: acf.n, defined: acf.defined }
}

export function movingAverage(values: number[], k: number, align: MaAlign = 'trailing'): MaSmoothResult {
  const window = Math.max(1, Math.floor(k))
  const smoothed: Array<number | undefined> = values.map(() => undefined)
  const edgeIndexes: number[] = []
  if (window === 1) {
    return { k: window, align, smoothed: values.slice(), edgeIndexes }
  }
  if (align === 'trailing') {
    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        edgeIndexes.push(i)
        continue
      }
      let sum = 0
      for (let j = 0; j < window; j++) sum += values[i - j]!
      smoothed[i] = sum / window
    }
    return { k: window, align, smoothed, edgeIndexes }
  }
  const left = Math.floor((window - 1) / 2)
  const right = Math.ceil((window - 1) / 2)
  for (let i = 0; i < values.length; i++) {
    if (i < left || i + right >= values.length) {
      edgeIndexes.push(i)
      continue
    }
    if (window % 2 === 1) {
      let sum = 0
      for (let j = i - left; j <= i + right; j++) sum += values[j]!
      smoothed[i] = sum / window
    } else {
      let sum = 0
      sum += 0.5 * values[i - left]!
      for (let j = i - left + 1; j <= i + right - 1; j++) sum += values[j]!
      sum += 0.5 * values[i + right]!
      smoothed[i] = sum / (window - 1)
    }
  }
  return { k: window, align, smoothed, edgeIndexes }
}

export function linearTrend(values: number[]): LinearTrend {
  const n = values.length
  const empty = { intercept: Number.NaN, slope: Number.NaN, fitted: values.map(() => Number.NaN), residuals: values.map(() => Number.NaN), r2: Number.NaN, sst: Number.NaN, sse: Number.NaN }
  if (n < 2) return empty
  const t = values.map((_, i) => i)
  const tbar = mean(t)
  const ybar = mean(values)
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sxx += (t[i]! - tbar) ** 2
    sxy += (t[i]! - tbar) * (values[i]! - ybar)
  }
  if (sxx === 0) return empty
  const slope = sxy / sxx
  const intercept = ybar - slope * tbar
  const fitted = t.map((ti) => intercept + slope * ti)
  const residuals = values.map((value, i) => value - fitted[i]!)
  const sse = residuals.reduce((sum, value) => sum + value * value, 0)
  const sst = values.reduce((sum, value) => sum + (value - ybar) ** 2, 0)
  return { intercept, slope, fitted, residuals, r2: sst === 0 ? Number.NaN : 1 - sse / sst, sst, sse }
}

export function detrend(values: number[], fitted: number[]): number[] {
  return values.map((value, i) => value - (fitted[i] ?? 0))
}

export function trendStrength(values: number[]): number {
  const fit = linearTrend(values)
  if (!Number.isFinite(fit.r2)) return Number.NaN
  return Math.max(0, Math.min(1, fit.r2))
}

export function seasonalFactors(values: number[], period: number, mode: SeasonMode): SeasonalResult {
  const m = Math.max(2, Math.floor(period))
  const buckets = Array.from({ length: m }, () => [] as number[])
  values.forEach((value, i) => {
    if (Number.isFinite(value)) buckets[i % m]!.push(value)
  })
  const overall = mean(values.filter(Number.isFinite))
  const indexes = buckets.map((bucket) => {
    if (bucket.length === 0 || !Number.isFinite(overall)) return Number.NaN
    const mu = mean(bucket)
    return mode === 'additive' ? mu - overall : overall === 0 ? Number.NaN : mu / overall
  })
  const seasonal = values.map((_, i) => indexes[i % m])
  const deseasonalized = values.map((value, i) => {
    const s = seasonal[i]
    if (s === undefined || !Number.isFinite(s)) return undefined
    if (mode === 'additive') return value - s
    return s === 0 ? undefined : value / s
  })
  return { mode, period: m, indexes, seasonal, deseasonalized }
}

export function difference(values: number[], d: number): DifferenceResult {
  const order = Math.max(0, Math.min(2, Math.floor(d)))
  let current = values.slice()
  for (let k = 0; k < order; k++) {
    current = current.slice(1).map((value, i) => value - current[i]!)
  }
  const acf1 = sampleAcf(values, 1).values[1]
  const unnecessary = order > 0 && acf1 !== undefined && Math.abs(acf1) < 0.2 && Number.isFinite(linearTrend(values).r2) && linearTrend(values).r2 < 0.15
  return {
    d: order,
    values: current,
    original: values,
    unnecessary,
    warning: unnecessary ? 'First-difference may be unnecessary: lag-1 autocorrelation is already small and the linear trend is weak.' : undefined,
  }
}

export function rollingStats(values: number[], window: number): { mean: Array<number | undefined>; variance: Array<number | undefined> } {
  const k = Math.max(2, Math.floor(window))
  const outMean: Array<number | undefined> = values.map(() => undefined)
  const outVar: Array<number | undefined> = values.map(() => undefined)
  for (let i = k - 1; i < values.length; i++) {
    const slice = values.slice(i - k + 1, i + 1)
    outMean[i] = mean(slice)
    outVar[i] = variance(slice)
  }
  return { mean: outMean, variance: outVar }
}

export function whiteNoise(n: number, seed: number, sd = 1): number[] {
  const rng = new SeededRng(seed)
  return Array.from({ length: n }, () => rng.normal(0, sd))
}

export function randomWalk(innovations: number[], drift = 0, y0 = 0): number[] {
  const out = new Array<number>(innovations.length)
  let current = y0
  for (let i = 0; i < innovations.length; i++) {
    current = current + drift + innovations[i]!
    out[i] = current
  }
  return out
}

export function ar1Series(innovations: number[], phi: number, c = 0, y0 = 0): number[] {
  const out = new Array<number>(innovations.length)
  let prev = y0
  for (let i = 0; i < innovations.length; i++) {
    const next = c + phi * prev + innovations[i]!
    out[i] = next
    prev = next
  }
  return out
}

export function ma1Series(innovations: number[], theta: number, mu = 0): number[] {
  return innovations.map((eps, i) => mu + eps + theta * (i === 0 ? 0 : innovations[i - 1]!))
}

export function shockDecay(phi: number, horizon: number): number[] {
  return Array.from({ length: horizon + 1 }, (_, k) => phi ** k)
}

export function arPhiStatus(phi: number): 'stationary' | 'unit-root' | 'explosive' {
  const abs = Math.abs(phi)
  if (abs < 1 - 1e-12) return 'stationary'
  if (Math.abs(abs - 1) < 1e-12) return 'unit-root'
  return 'explosive'
}

export function simulateArma(innovations: number[], phi: number[], theta: number[], c = 0): number[] {
  const out = new Array<number>(innovations.length).fill(0)
  for (let t = 0; t < innovations.length; t++) {
    let value = c + innovations[t]!
    for (let i = 0; i < phi.length; i++) {
      if (t - 1 - i >= 0) value += phi[i]! * out[t - 1 - i]!
    }
    for (let j = 0; j < theta.length; j++) {
      if (t - 1 - j >= 0) value += theta[j]! * innovations[t - 1 - j]!
    }
    out[t] = value
  }
  return out
}

export function integrate(values: number[], d: number, start = 0): number[] {
  let current = values.slice()
  for (let k = 0; k < d; k++) {
    const next = new Array<number>(current.length)
    let acc = start
    for (let i = 0; i < current.length; i++) {
      acc += current[i]!
      next[i] = acc
    }
    current = next
  }
  return current
}

export function simulateArima(n: number, spec: ArimaSpec, seed: number, opts?: { phi?: number[]; theta?: number[]; c?: number; shockAt?: number; shock?: number }): {
  series: number[]
  innovations: number[]
  arma: number[]
} {
  const innovations = whiteNoise(n, seed, 1)
  if (opts?.shockAt !== undefined && opts.shockAt >= 0 && opts.shockAt < n) {
    innovations[opts.shockAt] = (innovations[opts.shockAt] ?? 0) + (opts.shock ?? 3)
  }
  const phi = (opts?.phi ?? Array.from({ length: spec.p }, () => 0.6)).slice(0, spec.p)
  const theta = (opts?.theta ?? Array.from({ length: spec.q }, () => 0.5)).slice(0, spec.q)
  const arma = simulateArma(innovations, phi, theta, opts?.c ?? 0)
  return { series: integrate(arma, spec.d), innovations, arma }
}

export function arimaForecast(history: number[], spec: ArimaSpec, steps: number, phi: number[], theta: number[], residualSd: number): {
  point: number[]
  lo: number[]
  hi: number[]
} {
  const d = spec.d
  let working = history.slice()
  for (let k = 0; k < d; k++) working = working.slice(1).map((value, i) => value - working[i]!)
  const residuals = working.map(() => 0)
  const point: number[] = []
  for (let h = 0; h < steps; h++) {
    let next = 0
    for (let i = 0; i < spec.p; i++) {
      const lag = working[working.length - 1 - i]
      if (lag !== undefined) next += (phi[i] ?? 0) * lag
    }
    for (let j = 0; j < spec.q; j++) {
      const eps = residuals[residuals.length - 1 - j]
      if (eps !== undefined && h === 0) next += (theta[j] ?? 0) * eps
    }
    working.push(next)
    residuals.push(0)
    point.push(next)
  }
  let levels = point.slice()
  if (d > 0) {
    let last = history[history.length - 1] ?? 0
    levels = point.map((delta) => {
      last += delta
      return last
    })
    if (d === 2) {
      const d1 = history[history.length - 1]! - history[history.length - 2]!
      let acc = history[history.length - 1]!
      let vel = d1
      levels = point.map((delta2) => {
        vel += delta2
        acc += vel
        return acc
      })
    }
  }
  const grow = d > 0
  return {
    point: levels,
    lo: levels.map((value, h) => value - 1.96 * residualSd * (grow ? Math.sqrt(h + 1) : 1)),
    hi: levels.map((value, h) => value + 1.96 * residualSd * (grow ? Math.sqrt(h + 1) : 1)),
  }
}

function labelFor(frequency: Frequency, index: number, startYear = 2020): string {
  if (frequency === 'index') return String(index + 1)
  if (frequency === 'yearly') return String(startYear + index)
  if (frequency === 'quarterly') {
    const year = startYear + Math.floor(index / 4)
    return `Q${(index % 4) + 1} ${year}`
  }
  if (frequency === 'monthly') {
    const year = startYear + Math.floor(index / 12)
    return `${MONTH_LABELS[index % 12]} ${year}`
  }
  if (frequency === 'weekly') {
    const date = new Date(Date.UTC(startYear, 0, 1 + index * 7))
    return date.toISOString().slice(0, 10)
  }
  const date = new Date(Date.UTC(startYear, 0, 1 + index))
  return date.toISOString().slice(0, 10)
}

function pack(values: number[], frequency: Frequency, period?: number, startYear?: number): TsObservation[] {
  return values.map((value, i) => ({
    id: `obs-${i}`,
    t: i,
    value,
    season: period ? (i % period) + 1 : undefined,
    label: labelFor(frequency, i, startYear),
  }))
}

export function generatePreset(id: PresetId, n = 60, seed = 7, extras?: { phi?: number; theta?: number; drift?: number; amplitude?: number; sd?: number }): TsObservation[] {
  const rng = new SeededRng(seed)
  const sd = extras?.sd ?? 1
  const amp = extras?.amplitude ?? 8
  if (id === 'noise') return pack(Array.from({ length: n }, () => rng.normal(0, sd)), 'index')
  if (id === 'linear-up' || id === 'linear-down') {
    const sign = id === 'linear-up' ? 1 : -1
    return pack(Array.from({ length: n }, (_, t) => 20 + sign * 0.35 * t + rng.normal(0, sd)), 'index')
  }
  if (id === 'seasonal-monthly') {
    const values = Array.from({ length: n }, (_, t) => 50 + amp * Math.sin((2 * Math.PI * t) / 12) + rng.normal(0, sd))
    return pack(values, 'monthly', 12)
  }
  if (id === 'trend-season') {
    const values = Array.from({ length: n }, (_, t) => 40 + 0.4 * t + amp * Math.sin((2 * Math.PI * t) / 12) + rng.normal(0, sd))
    return pack(values, 'monthly', 12)
  }
  if (id === 'break') {
    const values = Array.from({ length: n }, (_, t) => (t < n / 2 ? 10 + rng.normal(0, sd) : 28 + rng.normal(0, sd)))
    return pack(values, 'index')
  }
  if (id === 'changing-var') {
    const values = Array.from({ length: n }, (_, t) => rng.normal(0, 0.4 + (2.2 * t) / Math.max(1, n - 1)))
    return pack(values, 'index')
  }
  if (id === 'ar1') {
    const innovations = Array.from({ length: n }, () => rng.normal(0, sd))
    return pack(ar1Series(innovations, extras?.phi ?? 0.7), 'index')
  }
  if (id === 'ma1') {
    const innovations = Array.from({ length: n }, () => rng.normal(0, sd))
    return pack(ma1Series(innovations, extras?.theta ?? 0.7), 'index')
  }
  if (id === 'rw' || id === 'rw-drift') {
    const innovations = Array.from({ length: n }, () => rng.normal(0, sd))
    return pack(randomWalk(innovations, extras?.drift ?? (id === 'rw-drift' ? 0.15 : 0)), 'index')
  }
  if (id === 'daily-temp') {
    const count = Math.max(n, 365)
    const values = Array.from({ length: count }, (_, t) => {
      const doy = t % 365
      return 12 + 11 * Math.sin((2 * Math.PI * (doy - 80)) / 365) + rng.normal(0, 2.2)
    })
    return pack(values, 'daily', 365, 2023)
  }
  if (id === 'airline') {
    const count = Math.max(n, 72)
    const values = Array.from({ length: count }, (_, t) => {
      const trend = 118 + 1.85 * t
      return trend * AIRLINE_SEASON[t % 12]! + rng.normal(0, 3)
    })
    return pack(values, 'monthly', 12, 1949)
  }
  const count = Math.max(n, 72)
  const values = Array.from({ length: count }, (_, t) => {
    const trend = 40 + 1.15 * t
    return trend * RETAIL_SEASON[t % 12]! + rng.normal(0, 3)
  })
  return pack(values, 'monthly', 12, 2020)
}

export const ARIMA_PRESETS: Array<{ id: string; spec: ArimaSpec; label: string; phi?: number[]; theta?: number[] }> = [
  { id: 'ar1', spec: { p: 1, d: 0, q: 0 }, label: 'ARIMA(1,0,0)', phi: [0.7] },
  { id: 'ma1', spec: { p: 0, d: 0, q: 1 }, label: 'ARIMA(0,0,1)', theta: [0.7] },
  { id: 'rw', spec: { p: 0, d: 1, q: 0 }, label: 'ARIMA(0,1,0)' },
  { id: 'ari', spec: { p: 1, d: 1, q: 0 }, label: 'ARIMA(1,1,0)', phi: [0.4] },
  { id: 'ima', spec: { p: 0, d: 1, q: 1 }, label: 'ARIMA(0,1,1)', theta: [0.5] },
]

export function loadTsProgress(): TsProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(TS_PROGRESS_KEY) ?? '{}') as Partial<TsProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveTsProgress(progress: TsProgress): void {
  localStorage.setItem(TS_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markTsLabComplete(labSlug: string): TsProgress {
  const next = loadTsProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveTsProgress(next)
  return next
}

export function tsStudioPath(): string {
  return studioPath(TS_STUDIO)
}

export function tsLabPath(labSlug: string): string {
  return labPath(TS_STUDIO_SLUG, labSlug)
}

export function tsNextStudioPath(): string {
  return studioPath(TS_NEXT_STUDIO)
}

export function nextIncompleteTsLab(completed: string[]): StudioLab {
  return TS_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? TS_STUDIO.labs[0]
}

export const WORKED = {
  maWindow: [120, 150, 130] as const,
  maMay: 400 / 3,
}
