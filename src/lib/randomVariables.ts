import jStatRaw from 'jstat'
import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

type DistFn = {
  pdf: (...args: number[]) => number
  cdf: (...args: number[]) => number
  inv: (...args: number[]) => number
}

type JStatLike = {
  normal: DistFn
  uniform: DistFn
  exponential: DistFn
  beta: DistFn
  chisquare: DistFn
  studentt: DistFn
}

const jStat = jStatRaw as unknown as JStatLike

export const RV_STUDIO_SLUG = 'random-variables'
export const RV_STORAGE_KEY = 'anveshak-random-variables'
export const RV_EPS = 1e-12

export type RvTab = 'learn' | 'explore' | 'practice' | 'quiz'
export type RvProgress = { completed: string[] }
export type DiscreteMass = { x: number; p: number }

export const RV_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === RV_STUDIO_SLUG) as Studio

export const RV_HOME_COPY: Record<string, { blurb: string; tryThis: string; chips: string[] }> = {
  'discrete-random-variables': {
    blurb: 'Explore discrete random variables, probability mass functions, and common countable outcomes.',
    tryThis: 'Switch from a die to a custom PMF, then normalize and simulate 1,000 draws.',
    chips: ['Discrete distributions', 'Probability mass function', 'Expected value', 'Real-world examples'],
  },
  'continuous-random-variables': {
    blurb: 'Learn how continuous random variables use density functions, and how interval probability is area.',
    tryThis: 'Drag the interval handles and watch P(a ≤ X ≤ b) update as shaded area.',
    chips: ['Continuous distributions', 'Probability density function', 'Normal distribution', 'Real-world examples'],
  },
  'cdf-quantiles': {
    blurb: 'Understand cumulative distribution functions, quantiles, and how percentiles invert probability.',
    tryThis: 'Move x to read F(x), then move p to recover the matching quantile Q(p).',
    chips: ['Cumulative distribution function', 'Percentiles', 'Quantiles', 'Median', 'Inverse CDF'],
  },
  'expectation-moments': {
    blurb: 'Learn how to compute expected values and moments, and what they say about a distribution.',
    tryThis: 'Shift probability mass and watch the balance point — the mean — move.',
    chips: ['Expected value', 'Moments', 'Variance connection', 'Real-world examples'],
  },
  'variance-standard-deviation': {
    blurb: 'Explore the spread of random variables using variance and standard deviation.',
    tryThis: 'Keep the mean fixed and increase σ. Watch the curve flatten while the center stays put.',
    chips: ['Measures of spread', 'Variance formula', 'Standard deviation', 'Properties'],
  },
  'skewness-kurtosis': {
    blurb: 'Understand distribution shape: how skewness describes tails and what kurtosis says about extremes.',
    tryThis: 'Morph from left-skewed to right-skewed and watch mean, median, and mode separate.',
    chips: ['Distribution shape', 'Skewness', 'Kurtosis', 'Interpretation'],
  },
  transformations: {
    blurb: 'Learn how functions of random variables create new random variables and new distributions.',
    tryThis: 'Map X through Y = X² and see probability mass fold onto the positive axis.',
    chips: ['Functions of random variables', 'Distribution transformations', 'One-to-one functions'],
  },
  'joint-marginal-conditional': {
    blurb: 'Explore joint distributions of two random variables, then recover marginals and conditionals.',
    tryThis: 'Click a row, then switch to the conditional view and watch that row renormalize to 1.',
    chips: ['Joint distribution', 'Marginal distribution', 'Conditional distribution', 'Independence'],
  },
  'covariance-correlation': {
    blurb: 'Measure and interpret the linear relationship between random variables using covariance and correlation.',
    tryThis: 'Switch to the U-shaped preset. The pattern is clear, but Pearson r can sit near zero.',
    chips: ['Covariance', 'Correlation', 'Linear relationships', 'Properties'],
  },
}

export function loadRvProgress(): RvProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(RV_STORAGE_KEY) ?? '{}') as Partial<RvProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveRvProgress(progress: RvProgress): void {
  localStorage.setItem(RV_STORAGE_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markRvLabComplete(labSlug: string): RvProgress {
  const next = loadRvProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveRvProgress(next)
  return next
}

export function rvStudioPath(): string {
  return studioPath(RV_STUDIO)
}

export function rvLabPath(labSlug: string): string {
  return labPath(RV_STUDIO_SLUG, labSlug)
}

export function nextIncompleteRvLab(completed: string[]): StudioLab {
  return RV_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? RV_STUDIO.labs[0]
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function formatNum(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = Number(value.toFixed(digits))
  return String(rounded)
}

export function formatFixed(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

export function formatProb(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

export function almostEqual(a: number, b: number, tol = 1e-8): boolean {
  return Math.abs(a - b) <= tol
}

export function sanitizeMass(items: readonly DiscreteMass[]): DiscreteMass[] {
  const merged = new Map<number, number>()
  for (const item of items) {
    if (!Number.isFinite(item.x) || !Number.isFinite(item.p) || item.p < 0) continue
    merged.set(item.x, (merged.get(item.x) ?? 0) + item.p)
  }
  return [...merged.entries()]
    .map(([x, p]) => ({ x, p }))
    .sort((a, b) => a.x - b.x)
}

export function pmfSum(items: readonly DiscreteMass[]): number {
  return sanitizeMass(items).reduce((sum, item) => sum + item.p, 0)
}

export function isValidPmf(items: readonly DiscreteMass[], tol = 1e-8): boolean {
  const clean = sanitizeMass(items)
  return clean.length > 0 && clean.every((item) => item.p >= -RV_EPS) && almostEqual(pmfSum(clean), 1, tol)
}

export function normalizePmf(items: readonly DiscreteMass[]): DiscreteMass[] {
  const clean = sanitizeMass(items)
  const total = pmfSum(clean)
  if (total <= RV_EPS) {
    const n = Math.max(1, clean.length)
    return clean.map((item) => ({ x: item.x, p: 1 / n }))
  }
  return clean.map((item) => ({ x: item.x, p: item.p / total }))
}

export function discreteCdfTable(items: readonly DiscreteMass[]): DiscreteMass[] {
  const clean = sanitizeMass(items)
  let running = 0
  return clean.map((item) => {
    running += item.p
    return { x: item.x, p: running }
  })
}

export function discreteCdfAt(items: readonly DiscreteMass[], x: number): number {
  return sanitizeMass(items).reduce((sum, item) => (item.x <= x ? sum + item.p : sum), 0)
}

export function discretePmfAt(items: readonly DiscreteMass[], x: number): number {
  return sanitizeMass(items).find((item) => almostEqual(item.x, x, 1e-10))?.p ?? 0
}

export function discreteRawMoment(items: readonly DiscreteMass[], k: number): number {
  return sanitizeMass(items).reduce((sum, item) => sum + item.p * item.x ** k, 0)
}

export function discreteMean(items: readonly DiscreteMass[]): number {
  return discreteRawMoment(items, 1)
}

export function discreteCentralMoment(items: readonly DiscreteMass[], k: number): number {
  const mu = discreteMean(items)
  return sanitizeMass(items).reduce((sum, item) => sum + item.p * (item.x - mu) ** k, 0)
}

export function discreteVariance(items: readonly DiscreteMass[]): number {
  return Math.max(0, discreteCentralMoment(items, 2))
}

export function discreteSd(items: readonly DiscreteMass[]): number {
  return Math.sqrt(discreteVariance(items))
}

export function discreteSkewness(items: readonly DiscreteMass[]): number {
  const sd = discreteSd(items)
  if (sd <= RV_EPS) return 0
  return discreteCentralMoment(items, 3) / sd ** 3
}

export function discreteKurtosis(items: readonly DiscreteMass[]): number {
  const sd = discreteSd(items)
  if (sd <= RV_EPS) return Number.NaN
  return discreteCentralMoment(items, 4) / sd ** 4
}

export function discreteQuantile(items: readonly DiscreteMass[], p: number): number {
  const prob = clamp(p, 0, 1)
  const table = discreteCdfTable(normalizePmf(items))
  if (table.length === 0) return Number.NaN
  if (prob <= 0) return table[0].x
  for (const item of table) {
    if (item.p >= prob - RV_EPS) return item.x
  }
  return table[table.length - 1].x
}

export function sampleDiscrete(items: readonly DiscreteMass[], n: number, rng: () => number = Math.random): number[] {
  const table = discreteCdfTable(normalizePmf(items))
  if (table.length === 0 || n <= 0) return []
  const draws: number[] = []
  for (let i = 0; i < n; i += 1) {
    const u = rng()
    const hit = table.find((item) => item.p >= u) ?? table[table.length - 1]
    draws.push(hit.x)
  }
  return draws
}

export function empiricalFrequencies(draws: readonly number[], support: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const x of support) counts.set(x, 0)
  for (const draw of draws) counts.set(draw, (counts.get(draw) ?? 0) + 1)
  const n = draws.length
  const freqs = new Map<number, number>()
  for (const x of support) freqs.set(x, n === 0 ? 0 : (counts.get(x) ?? 0) / n)
  return freqs
}

export function combination(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) return 0
  const r = Math.min(k, n - k)
  let result = 1
  for (let i = 1; i <= r; i += 1) result = (result * (n - r + i)) / i
  return result
}

export function binomialPmf(n: number, p: number): DiscreteMass[] {
  const prob = clamp(p, 0, 1)
  const trials = Math.max(0, Math.round(n))
  const items: DiscreteMass[] = []
  for (let k = 0; k <= trials; k += 1) {
    items.push({ x: k, p: combination(trials, k) * prob ** k * (1 - prob) ** (trials - k) })
  }
  return normalizePmf(items)
}

export function diePmf(): DiscreteMass[] {
  return [1, 2, 3, 4, 5, 6].map((x) => ({ x, p: 1 / 6 }))
}

export function coinPmf(p = 0.5): DiscreteMass[] {
  const heads = clamp(p, 0, 1)
  return [
    { x: 0, p: 1 - heads },
    { x: 1, p: heads },
  ]
}

export function twoDiceSumPmf(): DiscreteMass[] {
  const counts = new Map<number, number>()
  for (let a = 1; a <= 6; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      const sum = a + b
      counts.set(sum, (counts.get(sum) ?? 0) + 1)
    }
  }
  return [...counts.entries()].map(([x, count]) => ({ x, p: count / 36 }))
}

export function randomPmf(xs: readonly number[], rng: () => number = Math.random): DiscreteMass[] {
  const weights = xs.map(() => -Math.log(Math.max(rng(), RV_EPS)))
  return normalizePmf(xs.map((x, i) => ({ x, p: weights[i] ?? 1 })))
}

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  if (sigma <= RV_EPS) return 0
  return jStat.normal.pdf(x, mu, sigma)
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  if (sigma <= RV_EPS) return x < mu ? 0 : 1
  return jStat.normal.cdf(x, mu, sigma)
}

export function normalInv(p: number, mu = 0, sigma = 1): number {
  return jStat.normal.inv(clamp(p, RV_EPS, 1 - RV_EPS), mu, Math.max(sigma, RV_EPS))
}

export function uniformPdf(x: number, a = 0, b = 1): number {
  if (b <= a) return 0
  return x >= a && x <= b ? 1 / (b - a) : 0
}

export function uniformCdf(x: number, a = 0, b = 1): number {
  if (b <= a) return x < a ? 0 : 1
  if (x <= a) return 0
  if (x >= b) return 1
  return (x - a) / (b - a)
}

export function uniformInv(p: number, a = 0, b = 1): number {
  return a + clamp(p, 0, 1) * (b - a)
}

export function exponentialPdf(x: number, lambda = 1): number {
  if (lambda <= RV_EPS || x < 0) return 0
  return jStat.exponential.pdf(x, lambda)
}

export function exponentialCdf(x: number, lambda = 1): number {
  if (lambda <= RV_EPS) return 0
  if (x < 0) return 0
  return jStat.exponential.cdf(x, lambda)
}

export function exponentialInv(p: number, lambda = 1): number {
  return jStat.exponential.inv(clamp(p, RV_EPS, 1 - RV_EPS), Math.max(lambda, RV_EPS))
}

export function betaPdf(x: number, alpha = 2, beta = 2): number {
  if (x < 0 || x > 1) return 0
  return jStat.beta.pdf(x, Math.max(alpha, RV_EPS), Math.max(beta, RV_EPS))
}

export function betaCdf(x: number, alpha = 2, beta = 2): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return jStat.beta.cdf(x, Math.max(alpha, RV_EPS), Math.max(beta, RV_EPS))
}

export function chiSquarePdf(x: number, df = 1): number {
  if (x < 0) return 0
  return jStat.chisquare.pdf(x, Math.max(df, RV_EPS))
}

export function chiSquareCdf(x: number, df = 1): number {
  if (x < 0) return 0
  return jStat.chisquare.cdf(x, Math.max(df, RV_EPS))
}

export function studentTPdf(x: number, df = 5): number {
  return jStat.studentt.pdf(x, Math.max(df, RV_EPS))
}

export function studentTCdf(x: number, df = 5): number {
  return jStat.studentt.cdf(x, Math.max(df, RV_EPS))
}

export function skewNormalPdf(x: number, alpha = 0, mu = 0, sigma = 1): number {
  const z = (x - mu) / Math.max(sigma, RV_EPS)
  return (2 / Math.max(sigma, RV_EPS)) * normalPdf(z, 0, 1) * normalCdf(alpha * z, 0, 1)
}

export function intervalProbability(cdf: (x: number) => number, a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return clamp(cdf(hi) - cdf(lo), 0, 1)
}

export function linspace(min: number, max: number, n: number): number[] {
  if (n <= 1) return [min]
  const step = (max - min) / (n - 1)
  return Array.from({ length: n }, (_, i) => min + i * step)
}

export function trapz(ys: readonly number[], dx: number): number {
  if (ys.length < 2) return 0
  let sum = 0
  for (let i = 1; i < ys.length; i += 1) sum += ((ys[i - 1] ?? 0) + (ys[i] ?? 0)) * 0.5
  return sum * dx
}

export function integrate(f: (x: number) => number, a: number, b: number, n = 400): number {
  if (b <= a) return 0
  const xs = linspace(a, b, n)
  const dx = (b - a) / (n - 1)
  return trapz(xs.map(f), dx)
}

export function continuousMean(pdf: (x: number) => number, a: number, b: number): number {
  return integrate((x) => x * pdf(x), a, b)
}

export function continuousRawMoment(pdf: (x: number) => number, k: number, a: number, b: number): number {
  return integrate((x) => x ** k * pdf(x), a, b)
}

export function continuousCentralMoment(pdf: (x: number) => number, k: number, a: number, b: number): number {
  const mu = continuousMean(pdf, a, b)
  return integrate((x) => (x - mu) ** k * pdf(x), a, b)
}

export function continuousVariance(pdf: (x: number) => number, a: number, b: number): number {
  return Math.max(0, continuousCentralMoment(pdf, 2, a, b))
}

export function sampleMean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sampleVariance(values: readonly number[], population = false): number {
  if (values.length < (population ? 1 : 2)) return 0
  const mu = sampleMean(values)
  const ss = values.reduce((sum, value) => sum + (value - mu) ** 2, 0)
  return ss / (population ? values.length : values.length - 1)
}

export function sampleCovariance(xs: readonly number[], ys: readonly number[], population = false): number {
  const n = Math.min(xs.length, ys.length)
  if (n < (population ? 1 : 2)) return 0
  const mx = sampleMean(xs.slice(0, n))
  const my = sampleMean(ys.slice(0, n))
  let sum = 0
  for (let i = 0; i < n; i += 1) sum += ((xs[i] ?? 0) - mx) * ((ys[i] ?? 0) - my)
  return sum / (population ? n : n - 1)
}

export function pearsonR(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return 0
  const sx = Math.sqrt(sampleVariance(xs.slice(0, n)))
  const sy = Math.sqrt(sampleVariance(ys.slice(0, n)))
  if (sx <= RV_EPS || sy <= RV_EPS) return 0
  return clamp(sampleCovariance(xs.slice(0, n), ys.slice(0, n)) / (sx * sy), -1, 1)
}

export function regressionSlope(xs: readonly number[], ys: readonly number[]): { slope: number; intercept: number } {
  const n = Math.min(xs.length, ys.length)
  const mx = sampleMean(xs.slice(0, n))
  const my = sampleMean(ys.slice(0, n))
  const vx = sampleVariance(xs.slice(0, n), true)
  if (vx <= RV_EPS) return { slope: 0, intercept: my }
  const cov = sampleCovariance(xs.slice(0, n), ys.slice(0, n), true)
  return { slope: cov / vx, intercept: my - (cov / vx) * mx }
}

export function boxMuller(rng: () => number = Math.random): number {
  const u1 = Math.max(rng(), RV_EPS)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export function generateLinearCloud(
  n: number,
  r: number,
  noise = 0.2,
  rng: () => number = Math.random,
): Array<{ x: number; y: number }> {
  const rho = clamp(r, -0.999, 0.999)
  const noiseScale = Math.max(0, noise)
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i += 1) {
    const z1 = boxMuller(rng)
    const z2 = boxMuller(rng)
    const x = z1 * 3
    const y = rho * z1 * 3 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2 * 3 + boxMuller(rng) * noiseScale
    points.push({ x, y })
  }
  return points
}

export function generateUCloud(n: number, rng: () => number = Math.random): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i += 1) {
    const x = (rng() * 2 - 1) * 8
    const y = (x * x) / 8 - 4 + boxMuller(rng) * 0.6
    points.push({ x, y })
  }
  return points
}

export function generateOutlierCloud(n: number, rng: () => number = Math.random): Array<{ x: number; y: number }> {
  const points = generateLinearCloud(Math.max(2, n - 1), 0.85, 0.15, rng)
  points.push({ x: 9, y: -8 })
  return points.slice(0, n)
}

export type JointTable = {
  xs: number[]
  ys: number[]
  cells: number[][]
}

export function jointMarginalX(table: JointTable): DiscreteMass[] {
  return table.xs.map((x, i) => ({
    x,
    p: table.ys.reduce((sum, _y, j) => sum + (table.cells[i]?.[j] ?? 0), 0),
  }))
}

export function jointMarginalY(table: JointTable): DiscreteMass[] {
  return table.ys.map((y, j) => ({
    x: y,
    p: table.xs.reduce((sum, _x, i) => sum + (table.cells[i]?.[j] ?? 0), 0),
  }))
}

export function jointCell(table: JointTable, i: number, j: number): number {
  return table.cells[i]?.[j] ?? 0
}

export function conditionalGivenY(table: JointTable, j: number): DiscreteMass[] {
  const py = jointMarginalY(table)[j]?.p ?? 0
  if (py <= RV_EPS) return table.xs.map((x) => ({ x, p: 0 }))
  return table.xs.map((x, i) => ({ x, p: jointCell(table, i, j) / py }))
}

export function conditionalGivenX(table: JointTable, i: number): DiscreteMass[] {
  const px = jointMarginalX(table)[i]?.p ?? 0
  if (px <= RV_EPS) return table.ys.map((y) => ({ x: y, p: 0 }))
  return table.ys.map((y, j) => ({ x: y, p: jointCell(table, i, j) / px }))
}

export function jointIndependent(table: JointTable, tol = 1e-8): boolean {
  const px = jointMarginalX(table)
  const py = jointMarginalY(table)
  for (let i = 0; i < table.xs.length; i += 1) {
    for (let j = 0; j < table.ys.length; j += 1) {
      if (!almostEqual(jointCell(table, i, j), (px[i]?.p ?? 0) * (py[j]?.p ?? 0), tol)) return false
    }
  }
  return true
}

export function normalizeJoint(table: JointTable): JointTable {
  const total = table.cells.reduce((sum, row) => sum + row.reduce((rowSum, value) => rowSum + Math.max(0, value), 0), 0)
  const safe = total <= RV_EPS ? 1 : total
  return {
    xs: [...table.xs],
    ys: [...table.ys],
    cells: table.cells.map((row) => row.map((value) => Math.max(0, value) / safe)),
  }
}

export function transformDiscrete(items: readonly DiscreteMass[], map: (x: number) => number): DiscreteMass[] {
  return normalizePmf(sanitizeMass(items).map((item) => ({ x: map(item.x), p: item.p })))
}

export const DEFAULT_JOINT: JointTable = {
  xs: [1, 2, 3],
  ys: [1, 2, 3],
  cells: [
    [0.05, 0.1, 0.05],
    [0.1, 0.25, 0.15],
    [0.05, 0.15, 0.1],
  ],
}

export const PRACTICE_JOINT: JointTable = {
  xs: [1, 2],
  ys: [1, 2],
  cells: [
    [0.12, 0.18],
    [0.28, 0.42],
  ],
}

export const STUDY_HOURS = [2, 4, 6, 8, 10, 12]
export const EXAM_SCORES = [50, 60, 65, 70, 80, 85]
