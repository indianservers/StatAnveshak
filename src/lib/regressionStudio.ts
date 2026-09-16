import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const REG_STUDIO_SLUG = 'regression'
export const REG_PROGRESS_KEY = 'anveshak-regression-studio'
export const REG_NEXT_STUDIO_SLUG = 'anova'
export const REG_EPS = 1e-10

export const REG_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === REG_STUDIO_SLUG) as Studio
export const REG_NEXT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === REG_NEXT_STUDIO_SLUG) as Studio

export type RegProgress = { completed: string[] }

export type Observation = {
  id: string
  x: number
  y: number
  x2?: number
  x3?: number
  category?: string
  group?: string
  binaryY?: 0 | 1
  fitted?: number
  residual?: number
}

export type PresetId =
  | 'study-exam'
  | 'strong-linear'
  | 'weak-linear'
  | 'neg-linear'
  | 'none'
  | 'heteroskedastic'
  | 'nonlinear'
  | 'influential'
  | 'grouped'
  | 'interaction'
  | 'logistic-separation'
  | 'ice-cream'
  | 'school-type'
  | 'tutoring'
  | 'heart-disease'
  | 'junk-predictor'
  | 'collinear'

export type SimpleFit = {
  n: number
  b0: number
  b1: number
  xbar: number
  ybar: number
  sxx: number
  sxy: number
  fitted: number[]
  residuals: number[]
  sse: number
  ssr: number
  sst: number
  r2: number
  adjR2: number
  residualSE: number
  dfResidual: number
  interceptOutOfRange: boolean
}

export type IntervalResult = {
  x0: number
  yhat: number
  seMean: number
  sePred: number
  tCrit: number
  ciLo: number
  ciHi: number
  piLo: number
  piHi: number
  ciWidth: number
  piWidth: number
  level: number
}

export type MultipleFit = {
  beta: number[]
  names: string[]
  fitted: number[]
  residuals: number[]
  sse: number
  ssr: number
  sst: number
  r2: number
  adjR2: number
  residualSE: number
  dfResidual: number
  rank: number
  deficient: boolean
  standardized: number[]
  vif: number[]
}

export type DummyCoding = {
  reference: string
  levels: string[]
  names: string[]
  matrix: number[][]
}

export type LogisticFit = {
  beta: number[]
  names: string[]
  eta: number[]
  probability: number[]
  oddsRatio: number[]
  iterations: number
  separated: boolean
  logLikelihood: number
}

export type ConfusionCounts = {
  threshold: number
  tp: number
  tn: number
  fp: number
  fn: number
  accuracy: number
  precision: number
  recall: number
}

export const REG_HOME_COPY: Record<string, { blurb: string; sidebar: string; tryThis: string }> = {
  'simple-linear-regression': {
    blurb: 'Fit one straight line and read slope and intercept as an association, not a proof of cause.',
    sidebar: 'One predictor, one response',
    tryThis: 'Drag a point far off the line. Slope, intercept, and R² all move.',
  },
  'least-squares': {
    blurb: 'The OLS line is the unique line that minimizes the sum of squared residuals.',
    sidebar: 'Minimize the squared errors',
    tryThis: 'Tilt the candidate line, then animate it toward OLS. SSE only bottoms out at the fit.',
  },
  prediction: {
    blurb: 'Plug an x* into the fitted equation — and mark where interpolation ends.',
    sidebar: 'Predict ŷ from x*',
    tryThis: 'Move x* past the last data point. The number is still computed; the caution is the point.',
  },
  'residual-analysis': {
    blurb: 'Read residual plots for curvature, funneling, and unusual points — in cautious language.',
    sidebar: 'Check the leftover pattern',
    tryThis: 'Switch to the curved or funnel preset. The leftover plot tells a different story than R².',
  },
  'goodness-of-fit': {
    blurb: 'R² is the share of SST sitting in SSR. It is not “80% accurate.”',
    sidebar: 'R², SSE, and adjusted R²',
    tryThis: 'Add a junk predictor. R² cannot fall; adjusted R² often does.',
  },
  'confidence-prediction-intervals': {
    blurb: 'A CI is about the mean response. A PI is about one new Y. They are not the same width.',
    sidebar: 'Mean band vs new-Y band',
    tryThis: 'Slide x* toward the mean of X. Both bands shrink; the PI stays wider.',
  },
  'multiple-regression': {
    blurb: 'Each coefficient is an association holding the other predictors fixed.',
    sidebar: 'Several predictors at once',
    tryThis: 'Toggle a correlated predictor. Coefficients move even if the outcome barely changes.',
  },
  'polynomial-regression': {
    blurb: 'Powers of X add curvature — and extra flexibility that can overfit and explode outside the data.',
    sidebar: 'Bend the line with powers of X',
    tryThis: 'Raise the degree, then look just past the last x. High-degree curves wander.',
  },
  'categorical-predictors': {
    blurb: 'Groups enter as dummy variables against a reference. The labels 1, 2, 3 are not a numeric scale.',
    sidebar: 'Dummy / reference coding',
    tryThis: 'Change the reference level. Coefficient names change; fitted values stay equivalent.',
  },
  'interaction-effects': {
    blurb: 'An interaction lets one predictor change the slope of another. β3 is the slope difference.',
    sidebar: 'When slopes are not parallel',
    tryThis: 'Compare the two group slopes. The gap equals the interaction coefficient.',
  },
  'logistic-regression-basics': {
    blurb: 'A binary outcome lives on the probability scale. The S-curve is 1 / (1 + e^{−η}).',
    sidebar: 'Log-odds, probability, threshold',
    tryThis: 'Move the decision threshold. Fitted probabilities stay put; the confusion matrix changes.',
  },
}

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

  int(min: number, max: number): number {
    if (max < min) return min
    return min + Math.floor(this.next() * (max - min + 1))
  }

  normal(mean = 0, sd = 1): number {
    const u = Math.max(this.next(), Number.EPSILON)
    const v = this.next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  uniform(min = 0, max = 1): number {
    return min + (max - min) * this.next()
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const scaled = Number(value.toFixed(digits))
  return Object.is(scaled, -0) ? '0' : String(scaled)
}

export function formatSigned(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const text = formatNum(value, digits)
  return value > 0 ? `+${text}` : text
}

export function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function sampleSd(values: number[]): number {
  if (values.length < 2) return Number.NaN
  const mu = mean(values)
  return Math.sqrt(values.reduce((total, value) => total + (value - mu) ** 2, 0) / (values.length - 1))
}

export function ids(n: number, prefix = 'p'): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix}-${i + 1}`)
}

function withIds(points: Array<Omit<Observation, 'id'>>, prefix = 'p'): Observation[] {
  return points.map((point, i) => ({ ...point, id: `${prefix}-${i + 1}` }))
}

/** Inverse normal (Acklam). Used to seed a t quantile. */
export function invNorm(p: number): number {
  if (p <= 0) return Number.NEGATIVE_INFINITY
  if (p >= 1) return Number.POSITIVE_INFINITY
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577459334652e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const plow = 0.02425
  const phigh = 1 - plow
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** Cornish–Fisher t quantile. Accurate enough for teaching intervals. */
export function tQuantile(p: number, df: number): number {
  if (!Number.isFinite(p) || !Number.isFinite(df) || df <= 0) return Number.NaN
  if (p <= 0) return Number.NEGATIVE_INFINITY
  if (p >= 1) return Number.POSITIVE_INFINITY
  if (df > 1e6) return invNorm(p)
  const z = invNorm(p)
  const z2 = z * z
  const z3 = z2 * z
  const z5 = z3 * z2
  const z7 = z5 * z2
  const g1 = (z3 + z) / 4
  const g2 = (5 * z5 + 16 * z3 + 3 * z) / 96
  const g3 = (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / 384
  return z + g1 / df + g2 / df ** 2 + g3 / df ** 3
}

export function simpleOls(x: number[], y: number[]): SimpleFit {
  const n = Math.min(x.length, y.length)
  const xs = x.slice(0, n)
  const ys = y.slice(0, n)
  const xbar = mean(xs)
  const ybar = mean(ys)
  let sxx = 0
  let sxy = 0
  let sst = 0
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - xbar) ** 2
    sxy += (xs[i] - xbar) * (ys[i] - ybar)
    sst += (ys[i] - ybar) ** 2
  }
  const b1 = sxx > REG_EPS ? sxy / sxx : 0
  const b0 = ybar - b1 * xbar
  const fitted = xs.map((xi) => b0 + b1 * xi)
  const residuals = ys.map((yi, i) => yi - fitted[i])
  const sse = residuals.reduce((total, e) => total + e * e, 0)
  const ssr = sst - sse
  const dfResidual = Math.max(0, n - 2)
  const r2 = sst > REG_EPS ? 1 - sse / sst : Number.NaN
  const adjR2 = n > 2 && Number.isFinite(r2) ? 1 - (1 - r2) * ((n - 1) / dfResidual) : Number.NaN
  const residualSE = dfResidual > 0 ? Math.sqrt(sse / dfResidual) : Number.NaN
  const xmin = Math.min(...xs)
  const xmax = Math.max(...xs)
  return {
    n,
    b0,
    b1,
    xbar,
    ybar,
    sxx,
    sxy,
    fitted,
    residuals,
    sse,
    ssr,
    sst,
    r2,
    adjR2,
    residualSE,
    dfResidual,
    interceptOutOfRange: n > 0 && (0 < xmin - 1e-9 || 0 > xmax + 1e-9),
  }
}

export function candidateSse(x: number[], y: number[], b0: number, b1: number): number {
  const n = Math.min(x.length, y.length)
  let sse = 0
  for (let i = 0; i < n; i++) sse += (y[i] - (b0 + b1 * x[i])) ** 2
  return sse
}

export function predictSimple(fit: SimpleFit, x0: number): number {
  return fit.b0 + fit.b1 * x0
}

export function meanAndPredictionIntervals(fit: SimpleFit, x0: number, level = 0.95): IntervalResult {
  const yhat = predictSimple(fit, x0)
  const tCrit = tQuantile(1 - (1 - level) / 2, fit.dfResidual)
  const leverage = fit.n > 0 && fit.sxx > REG_EPS ? 1 / fit.n + (x0 - fit.xbar) ** 2 / fit.sxx : Number.NaN
  const seMean = fit.residualSE * Math.sqrt(leverage)
  const sePred = fit.residualSE * Math.sqrt(1 + leverage)
  const ciLo = yhat - tCrit * seMean
  const ciHi = yhat + tCrit * seMean
  const piLo = yhat - tCrit * sePred
  const piHi = yhat + tCrit * sePred
  return {
    x0,
    yhat,
    seMean,
    sePred,
    tCrit,
    ciLo,
    ciHi,
    piLo,
    piHi,
    ciWidth: ciHi - ciLo,
    piWidth: piHi - piLo,
    level,
  }
}

export function interpolationKind(x0: number, xs: number[]): 'interpolation' | 'extrapolation' | 'empty' {
  if (xs.length === 0) return 'empty'
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  return x0 >= lo - 1e-9 && x0 <= hi + 1e-9 ? 'interpolation' : 'extrapolation'
}

/** Householder QR with column pivoting. Avoids forming (X′X)⁻¹. */
export function qrLeastSquares(y: number[], X: number[][]): { beta: number[]; rank: number; deficient: boolean; fitted: number[] } {
  const n = y.length
  const p = X[0]?.length ?? 0
  if (n === 0 || p === 0 || X.length !== n) {
    return { beta: Array.from({ length: p }, () => Number.NaN), rank: 0, deficient: true, fitted: Array.from({ length: n }, () => Number.NaN) }
  }
  const A = X.map((row) => [...row])
  const b = [...y]
  const perm = Array.from({ length: p }, (_, i) => i)
  let rank = 0

  for (let k = 0; k < p; k++) {
    let best = k
    let bestNorm = 0
    for (let j = k; j < p; j++) {
      let s = 0
      for (let i = k; i < n; i++) s += A[i][j] ** 2
      if (s > bestNorm) {
        bestNorm = s
        best = j
      }
    }
    if (bestNorm < REG_EPS) break
    if (best !== k) {
      for (let i = 0; i < n; i++) {
        const tmp = A[i][k]
        A[i][k] = A[i][best]
        A[i][best] = tmp
      }
      const swap = perm[k]
      perm[k] = perm[best]
      perm[best] = swap
    }
    let norm = Math.sqrt(bestNorm)
    if (A[k][k] > 0) norm = -norm
    const u = Array.from({ length: n }, () => 0)
    u[k] = A[k][k] - norm
    for (let i = k + 1; i < n; i++) u[i] = A[i][k]
    const u2 = u.reduce((total, value) => total + value * value, 0)
    if (u2 < REG_EPS) break
    const betaH = 2 / u2
    for (let j = k; j < p; j++) {
      let dot = 0
      for (let i = k; i < n; i++) dot += u[i] * A[i][j]
      const scale = betaH * dot
      for (let i = k; i < n; i++) A[i][j] -= scale * u[i]
    }
    let ydot = 0
    for (let i = k; i < n; i++) ydot += u[i] * b[i]
    const yscale = betaH * ydot
    for (let i = k; i < n; i++) b[i] -= yscale * u[i]
    rank += 1
  }

  const pivoted = Array.from({ length: p }, () => 0)
  for (let i = rank - 1; i >= 0; i--) {
    let s = b[i]
    for (let j = i + 1; j < rank; j++) s -= A[i][j] * pivoted[j]
    pivoted[i] = Math.abs(A[i][i]) < REG_EPS ? 0 : s / A[i][i]
  }
  const beta = Array.from({ length: p }, () => 0)
  for (let i = 0; i < rank; i++) beta[perm[i]] = pivoted[i]
  const fitted = X.map((row) => row.reduce((total, value, j) => total + value * beta[j], 0))
  return { beta, rank, deficient: rank < p, fitted }
}

export function designWithIntercept(columns: number[][]): number[][] {
  const n = columns[0]?.length ?? 0
  return Array.from({ length: n }, (_, i) => [1, ...columns.map((col) => col[i] ?? 0)])
}

export function multipleOls(y: number[], columns: number[][], names: string[], addIntercept = true): MultipleFit {
  const X = addIntercept ? designWithIntercept(columns) : columns[0]?.map((_, i) => columns.map((col) => col[i])) ?? []
  const fullNames = addIntercept ? ['Intercept', ...names] : names
  const fit = qrLeastSquares(y, X)
  const residuals = y.map((yi, i) => yi - fit.fitted[i])
  const sse = residuals.reduce((total, e) => total + e * e, 0)
  const ybar = mean(y)
  const sst = y.reduce((total, yi) => total + (yi - ybar) ** 2, 0)
  const ssr = sst - sse
  const p = fit.beta.length
  const dfResidual = Math.max(0, y.length - fit.rank)
  const r2 = sst > REG_EPS ? 1 - sse / sst : Number.NaN
  const adjR2 = y.length > p && Number.isFinite(r2) ? 1 - (1 - r2) * ((y.length - 1) / dfResidual) : Number.NaN
  const residualSE = dfResidual > 0 ? Math.sqrt(sse / dfResidual) : Number.NaN
  const predictorCount = addIntercept ? p - 1 : p
  const standardized = Array.from({ length: predictorCount }, (_, j) => {
    const col = addIntercept ? columns[j] : columns[j]
    const sy = sampleSd(y)
    const sx = sampleSd(col ?? [])
    const bj = addIntercept ? fit.beta[j + 1] : fit.beta[j]
    return sy > REG_EPS && sx > REG_EPS ? bj * (sx / sy) : Number.NaN
  })
  return {
    beta: fit.beta,
    names: fullNames,
    fitted: fit.fitted,
    residuals,
    sse,
    ssr,
    sst,
    r2,
    adjR2,
    residualSE,
    dfResidual,
    rank: fit.rank,
    deficient: fit.deficient,
    standardized,
    vif: varianceInflation(columns),
  }
}

/** VIF_j = 1 / (1 − R_j²) from regressing predictor j on the others. */
export function varianceInflation(columns: number[][]): number[] {
  return columns.map((col, j) => {
    if (columns.length < 2) return 1
    const others = columns.filter((_, k) => k !== j)
    const aux = multipleOls(col, others, others.map((_, k) => `x${k}`))
    if (!Number.isFinite(aux.r2) || aux.r2 >= 1 - 1e-12) return Number.POSITIVE_INFINITY
    return 1 / (1 - aux.r2)
  })
}

export function polynomialColumns(x: number[], degree: number): { columns: number[][]; names: string[] } {
  const deg = clamp(Math.round(degree), 1, 6)
  const columns = Array.from({ length: deg }, (_, p) => x.map((xi) => xi ** (p + 1)))
  const names = Array.from({ length: deg }, (_, p) => (p === 0 ? 'X' : `X^${p + 1}`))
  return { columns, names }
}

export function dummyCode(categories: string[], reference?: string): DummyCoding {
  const levels = [...new Set(categories)]
  const ref = reference && levels.includes(reference) ? reference : levels[0]
  const others = levels.filter((level) => level !== ref)
  const matrix = categories.map((value) => others.map((level) => (value === level ? 1 : 0)))
  return { reference: ref, levels, names: others.map((level) => `${level} (vs ${ref})`), matrix }
}

export function interactionColumns(x: number[], dummy: number[]): number[][] {
  return [x, dummy, x.map((xi, i) => xi * dummy[i])]
}

export function groupSlopes(beta: number[]): { interceptRef: number; slopeRef: number; interceptOther: number; slopeOther: number; slopeGap: number } {
  const [b0, b1, b2, b3] = [beta[0] ?? 0, beta[1] ?? 0, beta[2] ?? 0, beta[3] ?? 0]
  return {
    interceptRef: b0,
    slopeRef: b1,
    interceptOther: b0 + b2,
    slopeOther: b1 + b3,
    slopeGap: b3,
  }
}

export function sigmoid(eta: number): number {
  if (eta >= 30) return 1
  if (eta <= -30) return 0
  return 1 / (1 + Math.exp(-eta))
}

export function logisticFit(y: number[], columns: number[][], names: string[]): LogisticFit {
  const X = designWithIntercept(columns)
  const fullNames = ['Intercept', ...names]
  let beta = Array.from({ length: X[0].length }, () => 0)
  let iterations = 0
  let separated = false
  for (let iter = 0; iter < 40; iter++) {
    iterations = iter + 1
    const eta = X.map((row) => row.reduce((total, value, j) => total + value * beta[j], 0))
    const mu = eta.map(sigmoid)
    const w = mu.map((m) => Math.max(m * (1 - m), 1e-8))
    const z = eta.map((value, i) => value + (y[i] - mu[i]) / w[i])
    const Xw = X.map((row, i) => row.map((value) => value * Math.sqrt(w[i])))
    const zw = z.map((value, i) => value * Math.sqrt(w[i]))
    const step = qrLeastSquares(zw, Xw)
    const next = step.beta
    const maxDiff = Math.max(...next.map((value, j) => Math.abs(value - beta[j])))
    beta = next
    if (beta.some((value) => Math.abs(value) > 25)) {
      separated = true
      break
    }
    if (maxDiff < 1e-8) break
  }
  const eta = X.map((row) => row.reduce((total, value, j) => total + value * beta[j], 0))
  const probability = eta.map(sigmoid)
  const perfectlySeparated = y.every((yi, i) => (yi === 1 && probability[i] > 1 - 1e-6) || (yi === 0 && probability[i] < 1e-6))
  if (perfectlySeparated && probability.some((p) => p < 1e-4 || p > 1 - 1e-4)) separated = true
  const logLikelihood = y.reduce((total, yi, i) => {
    const p = clamp(probability[i], 1e-12, 1 - 1e-12)
    return total + yi * Math.log(p) + (1 - yi) * Math.log(1 - p)
  }, 0)
  return {
    beta,
    names: fullNames,
    eta,
    probability,
    oddsRatio: beta.map((value, i) => (i === 0 ? Number.NaN : Math.exp(value))),
    iterations,
    separated,
    logLikelihood,
  }
}

export function confusionMatrix(y: number[], probability: number[], threshold: number): ConfusionCounts {
  const cut = clamp(threshold, 0, 1)
  let tp = 0
  let tn = 0
  let fp = 0
  let fn = 0
  for (let i = 0; i < y.length; i++) {
    const pred = probability[i] >= cut ? 1 : 0
    if (pred === 1 && y[i] === 1) tp += 1
    else if (pred === 0 && y[i] === 0) tn += 1
    else if (pred === 1 && y[i] === 0) fp += 1
    else fn += 1
  }
  const accuracy = y.length ? (tp + tn) / y.length : Number.NaN
  const precision = tp + fp > 0 ? tp / (tp + fp) : Number.NaN
  const recall = tp + fn > 0 ? tp / (tp + fn) : Number.NaN
  return { threshold: cut, tp, tn, fp, fn, accuracy, precision, recall }
}

export function attachFit(points: Observation[], fitted: number[]): Observation[] {
  return points.map((point, i) => ({
    ...point,
    fitted: fitted[i],
    residual: point.y - fitted[i],
  }))
}

export function residualPatternLabel(kind: 'random' | 'curve' | 'funnel' | 'outlier' | 'leverage' | 'clustered'): string {
  switch (kind) {
    case 'random':
      return 'Residuals look consistent with unstructured leftover variation around zero.'
    case 'curve':
      return 'A curved leftover pattern may indicate that a straight line is missing a nonlinear relationship.'
    case 'funnel':
      return 'A funnel leftover pattern may indicate non-constant variance (heteroskedasticity).'
    case 'outlier':
      return 'A point with an unusually large residual may indicate an outlier that can pull the fit.'
    case 'leverage':
      return 'A point far out on X with a large residual may be high-leverage and influential.'
    case 'clustered':
      return 'Clustered leftovers may indicate distinct groups that a single line is averaging over.'
  }
}

export function generateLinear(options: {
  n: number
  seed: number
  b0: number
  b1: number
  xMin: number
  xMax: number
  noise: number
  prefix?: string
}): Observation[] {
  const rng = new SeededRng(options.seed)
  const n = clamp(Math.round(options.n), 4, 240)
  return withIds(
    Array.from({ length: n }, () => {
      const x = rng.uniform(options.xMin, options.xMax)
      return { x, y: options.b0 + options.b1 * x + rng.normal(0, options.noise) }
    }),
    options.prefix ?? 'p',
  )
}

export function generatePreset(id: PresetId, n = 50, seed = 17, noise = 8): Observation[] {
  const rng = new SeededRng(seed)
  const count = clamp(Math.round(n), 8, 240)

  if (id === 'study-exam' || id === 'strong-linear') {
    return generateLinear({ n: count, seed, b0: 48.77, b1: 5.12, xMin: 0.6, xMax: 9.6, noise: id === 'strong-linear' ? noise * 0.45 : noise })
  }
  if (id === 'weak-linear') {
    return generateLinear({ n: count, seed, b0: 50, b1: 2.1, xMin: 0.6, xMax: 9.6, noise: noise * 1.6 })
  }
  if (id === 'neg-linear') {
    return generateLinear({ n: count, seed, b0: 92, b1: -4.4, xMin: 0.6, xMax: 9.6, noise })
  }
  if (id === 'none') {
    return generateLinear({ n: count, seed, b0: 62, b1: 0, xMin: 0.6, xMax: 9.6, noise: noise * 1.4 })
  }
  if (id === 'heteroskedastic') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(0.6, 9.6)
        return { x, y: 48 + 5 * x + rng.normal(0, 1.2 + 1.35 * x) }
      }),
    )
  }
  if (id === 'nonlinear') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(0.4, 9.8)
        return { x, y: 38 + 18 * Math.sin((x / 10) * Math.PI) + 2.2 * x + rng.normal(0, 4.5) }
      }),
    )
  }
  if (id === 'influential') {
    const base = generateLinear({ n: count - 1, seed, b0: 48.77, b1: 5.12, xMin: 0.8, xMax: 8.2, noise: 6 })
    return [...base, { id: `p-${count}`, x: 14.5, y: 28 }]
  }
  if (id === 'grouped') {
    return withIds(
      Array.from({ length: count }, (_, i) => {
        const group = i < count / 2 ? 'A' : 'B'
        const x = rng.uniform(0.8, 9.2)
        const y = group === 'A' ? 38 + 3.2 * x + rng.normal(0, 5) : 62 + 3.2 * x + rng.normal(0, 5)
        return { x, y, group, category: group }
      }),
    )
  }
  if (id === 'interaction' || id === 'tutoring') {
    return withIds(
      Array.from({ length: count }, (_, i) => {
        const tutored = i % 2 === 0
        const x = rng.uniform(0.6, 9.4)
        const y = tutored ? 45.2 + 7.9 * x + rng.normal(0, 5.2) : 45.2 + 4.1 * x + rng.normal(0, 5.2)
        return { x, y, group: tutored ? 'Tutor' : 'No tutor', category: tutored ? 'Tutor' : 'No tutor' }
      }),
    )
  }
  if (id === 'logistic-separation') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(18, 78)
        const y = x > 48 ? 1 : 0
        return { x, y, binaryY: y as 0 | 1 }
      }),
    )
  }
  if (id === 'ice-cream') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(55, 98)
        const y = -420 + 16.8 * x - 0.105 * x * x + rng.normal(0, 12)
        return { x, y }
      }),
    )
  }
  if (id === 'school-type') {
    return withIds(
      Array.from({ length: count }, (_, i) => {
        const privateSchool = i >= count / 2
        const x = rng.uniform(0.7, 9.4)
        const y = 42.3 + 5.1 * x + (privateSchool ? 10.8 : 0) + rng.normal(0, 6)
        return { x, y, category: privateSchool ? 'Private' : 'Public', group: privateSchool ? 'Private' : 'Public' }
      }),
    )
  }
  if (id === 'heart-disease') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(22, 78)
        const eta = -7.521 + 0.152 * x
        const p = sigmoid(eta)
        const binaryY = rng.next() < p ? 1 : 0
        return { x, y: binaryY, binaryY: binaryY as 0 | 1 }
      }),
    )
  }
  if (id === 'junk-predictor') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(0.6, 9.6)
        const x2 = rng.uniform(0, 100)
        return { x, x2, y: 48.77 + 5.12 * x + rng.normal(0, 8) }
      }),
    )
  }
  if (id === 'collinear') {
    return withIds(
      Array.from({ length: count }, () => {
        const x = rng.uniform(1, 10)
        const x2 = x * 2 + rng.normal(0, 0.08)
        const x3 = rng.uniform(4, 9)
        return { x, x2, x3, y: 20 + 4 * x + 1.2 * x3 + rng.normal(0, 5) }
      }),
    )
  }
  return generateLinear({ n: count, seed, b0: 48.77, b1: 5.12, xMin: 0.6, xMax: 9.6, noise })
}

export function generateMultiple(n = 50, seed = 21, noise = 6.5): Observation[] {
  const rng = new SeededRng(seed)
  const count = clamp(Math.round(n), 12, 240)
  return withIds(
    Array.from({ length: count }, () => {
      const x = rng.uniform(1.5, 9.5)
      const x2 = rng.uniform(62, 98)
      const x3 = rng.uniform(4.5, 9.2)
      const y = 12.3 + 5.1 * x + 0.42 * x2 + 2.8 * x3 + rng.normal(0, noise)
      return { x, x2, x3, y }
    }),
  )
}

export function trainTestSplit(points: Observation[], seed = 9, trainShare = 0.7): { train: Observation[]; test: Observation[] } {
  const rng = new SeededRng(seed)
  const order = points.map((_, i) => i).sort((a, b) => rng.next() - 0.5 || a - b)
  const cut = Math.max(4, Math.round(points.length * trainShare))
  const train = order.slice(0, cut).map((i) => points[i])
  const test = order.slice(cut).map((i) => points[i])
  return { train, test }
}

export function predictFromColumns(beta: number[], columns: number[][], addIntercept = true): number[] {
  const n = columns[0]?.length ?? 0
  return Array.from({ length: n }, (_, i) => {
    let value = addIntercept ? beta[0] ?? 0 : 0
    for (let j = 0; j < columns.length; j++) {
      value += (addIntercept ? beta[j + 1] ?? 0 : beta[j] ?? 0) * (columns[j][i] ?? 0)
    }
    return value
  })
}

export function rmse(actual: number[], fitted: number[]): number {
  const n = Math.min(actual.length, fitted.length)
  if (n === 0) return Number.NaN
  let sse = 0
  for (let i = 0; i < n; i++) sse += (actual[i] - fitted[i]) ** 2
  return Math.sqrt(sse / n)
}

export function equationText(b0: number, terms: Array<{ name: string; coef: number }>): string {
  const head = formatNum(b0, 2)
  const rest = terms
    .map((term) => `${term.coef >= 0 ? '+' : '−'} ${formatNum(Math.abs(term.coef), 2)}${term.name}`)
    .join(' ')
  return `Ŷ = ${head} ${rest}`.replace(/\s+/g, ' ').trim()
}

export function loadRegProgress(): RegProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(REG_PROGRESS_KEY) ?? '{}') as Partial<RegProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveRegProgress(progress: RegProgress): void {
  localStorage.setItem(REG_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markRegLabComplete(labSlug: string): RegProgress {
  const next = loadRegProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveRegProgress(next)
  return next
}

export function regStudioPath(): string {
  return studioPath(REG_STUDIO)
}

export function regLabPath(labSlug: string): string {
  return labPath(REG_STUDIO_SLUG, labSlug)
}

export function regNextStudioPath(): string {
  return studioPath(REG_NEXT_STUDIO)
}

export function nextIncompleteRegLab(completed: string[]): StudioLab {
  return REG_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? REG_STUDIO.labs[0]
}

export const WORKED = {
  simpleX: [1, 3, 4, 6, 8, 9],
  simpleY: [52, 66, 68, 82, 91, 94],
}
