import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const CA_STUDIO_SLUG = 'correlation-association'
export const CA_PROGRESS_KEY = 'anveshak-correlation-association'
export const CA_NEXT_STUDIO_SLUG = 'regression'
export const CA_EPS = 1e-12
export const KENDALL_VARIANT = 'tau-b' as const

export type CaTab = 'learn' | 'explore' | 'practice' | 'quiz'
export type CaProgress = { completed: string[] }
export type PairKind = 'concordant' | 'discordant' | 'tie-x' | 'tie-y' | 'tie-both'
export type CorrMethod = 'pearson' | 'spearman'
export type AssociationStrength = 'strong-positive' | 'moderate-positive' | 'weak-positive' | 'none' | 'weak-negative' | 'moderate-negative' | 'strong-negative' | 'undefined'

export type Observation = {
  id: string
  x: number
  y: number
  z?: number
  extras?: Record<string, number>
  group?: string
}

export type NamedSeries = {
  id: string
  label: string
  values: number[]
}

export type BivariateSummary = {
  n: number
  meanX: number
  meanY: number
  sdX: number
  sdY: number
  cov: number
  pearson: number
  spearman: number
  kendall: number
}

export type PairRecord = {
  i: number
  j: number
  a: Observation
  b: Observation
  kind: PairKind
}

export type KendallBreakdown = {
  variant: typeof KENDALL_VARIANT
  n: number
  pairs: number
  concordant: number
  discordant: number
  tieX: number
  tieY: number
  tieBoth: number
  tau: number
}

export type LinearFit = {
  intercept: number
  slope: number
  residuals: number[]
}

export type PresetId =
  | 'strong-pos'
  | 'weak-pos'
  | 'strong-neg'
  | 'weak-neg'
  | 'none'
  | 'u-shape'
  | 'monotonic-nonlinear'
  | 'outlier'
  | 'clustered'
  | 'restricted-range'
  | 'confounded'
  | 'simpson'
  | 'suppression'
  | 'height-weight'
  | 'study-exam'
  | 'ice-cream'
  | 'ranks-tied'
  | 'kendall-small'

export const CA_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === CA_STUDIO_SLUG) as Studio
export const CA_NEXT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === CA_NEXT_STUDIO_SLUG) as Studio

export const CA_HOME_COPY: Record<string, { blurb: string; tryThis: string; chips: string[]; sidebar: string }> = {
  'scatter-plot-explorer': {
    blurb: 'Read direction, form, and strength on a scatter plot before computing anything.',
    tryThis: 'Switch from a moderate line to a U-shape. Pearson drops even though the cloud is still patterned.',
    chips: ['Direction', 'Form', 'Strength', 'Outliers'],
    sidebar: 'Visualize and explore relationships',
  },
  covariance: {
    blurb: 'See how joint movement is measured, and why the units stay awkward.',
    tryThis: 'Scale X to 100X. Covariance jumps; Pearson r stays put.',
    chips: ['Quadrants', 'Units', 'Sign'],
    sidebar: 'Measure directional joint variation',
  },
  'pearson-correlation': {
    blurb: 'Standardize covariance into a number between −1 and 1.',
    tryThis: 'Add one outlier, then restrict the X range. Watch r move without a new “relationship.”',
    chips: ['Pearson r', 'Linear association', 'Invariance'],
    sidebar: 'Measure linear strength',
  },
  'spearman-rank-correlation': {
    blurb: 'Replace values with ranks to capture monotonic relationships.',
    tryThis: 'Load the curved but increasing cloud. Spearman stays high while Pearson slumps.',
    chips: ['Ranks', 'Ties', 'Monotonic'],
    sidebar: 'Capture monotonic relationships',
  },
  'kendall-tau': {
    blurb: 'Count concordant and discordant pairs instead of squaring deviations.',
    tryThis: 'Step through pairs. A tie on X or Y is neither concordant nor discordant.',
    chips: ['Concordance', 'Ties', 'Tau-b'],
    sidebar: 'Count concordant and discordant pairs',
  },
  'correlation-matrix': {
    blurb: 'Screen many pairs at once with a signed heatmap.',
    tryThis: 'Click the most negative cell, then switch to Spearman. Confirm the pairwise n.',
    chips: ['Heatmap', 'Pairwise n', 'Screening'],
    sidebar: 'Compare many variables',
  },
  'partial-correlation': {
    blurb: 'Hold a third variable fixed and see what is left of the association.',
    tryThis: 'On the confounded preset, raw r is large and rXY·Z collapses. Control is not causation.',
    chips: ['Residuals', 'Confounding', 'Suppression'],
    sidebar: 'Control for a third variable',
  },
  'correlation-vs-causation': {
    blurb: 'A real association can come from a cause — it is not enough to identify one.',
    tryThis: 'Reveal temperature under ice cream and drownings. The XY link stays; the story changes.',
    chips: ['Confounder', 'DAGs', 'Association'],
    sidebar: 'Association is not identification',
  },
}

export const MATRIX_VARS = [
  { id: 'studyHours', label: 'Study hrs' },
  { id: 'sleepHours', label: 'Sleep hrs' },
  { id: 'attendance', label: 'Attend %' },
  { id: 'testScore', label: 'Test' },
  { id: 'homework', label: 'Homework' },
  { id: 'screenTime', label: 'Screen' },
  { id: 'activity', label: 'Activity' },
] as const

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
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Clamp only tiny floating-point overshoot onto [-1, 1]. */
export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return value
  if (value > 1 && value <= 1 + 1e-10) return 1
  if (value < -1 && value >= -1 - 1e-10) return -1
  return value
}

export function formatNum(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—'
  const scaled = Number(value.toFixed(digits))
  return Object.is(scaled, -0) ? '0' : String(scaled)
}

export function formatSigned(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—'
  const text = formatNum(value, digits)
  return value > 0 ? `+${text}` : text
}

export function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sampleVariance(values: number[]): number {
  if (values.length < 2) return Number.NaN
  const mu = mean(values)
  return values.reduce((sum, value) => sum + (value - mu) ** 2, 0) / (values.length - 1)
}

export function sampleSd(values: number[]): number {
  const variance = sampleVariance(values)
  return Number.isFinite(variance) ? Math.sqrt(variance) : Number.NaN
}

export function sampleCovariance(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return Number.NaN
  const mx = mean(x.slice(0, n))
  const my = mean(y.slice(0, n))
  let sum = 0
  for (let i = 0; i < n; i++) sum += (x[i] - mx) * (y[i] - my)
  return sum / (n - 1)
}

export function pearsonR(x: number[], y: number[]): number {
  const cov = sampleCovariance(x, y)
  const sx = sampleSd(x)
  const sy = sampleSd(y)
  if (!Number.isFinite(cov) || !Number.isFinite(sx) || !Number.isFinite(sy) || sx === 0 || sy === 0) return Number.NaN
  return clampUnit(cov / (sx * sy))
}

/** Average ranks, 1-based. Ties: 2, 5, 5, 9 → 1, 2.5, 2.5, 4. */
export function averageRanks(values: number[]): number[] {
  const order = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value)
  const out = Array<number>(values.length).fill(Number.NaN)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j < order.length && order[j].value === order[i].value) j++
    const rank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) out[order[k].i] = rank
    i = j
  }
  return out
}

export function spearmanRho(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return Number.NaN
  return pearsonR(averageRanks(x), averageRanks(y))
}

export function classifyPair(a: Pick<Observation, 'x' | 'y'>, b: Pick<Observation, 'x' | 'y'>): PairKind {
  const dx = Math.sign(a.x - b.x)
  const dy = Math.sign(a.y - b.y)
  if (dx === 0 && dy === 0) return 'tie-both'
  if (dx === 0) return 'tie-x'
  if (dy === 0) return 'tie-y'
  return dx === dy ? 'concordant' : 'discordant'
}

export function kendallPairs(points: Array<Pick<Observation, 'x' | 'y'>>): PairRecord[] {
  const out: PairRecord[] = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i] as Observation
      const b = points[j] as Observation
      out.push({ i, j, a, b, kind: classifyPair(a, b) })
    }
  }
  return out
}

/** Kendall's τ-b. Pairs tied on both coordinates are dropped from C, D, and both tie counts. */
export function kendallTauB(x: number[], y: number[]): number {
  return kendallBreakdown(x, y).tau
}

export function kendallBreakdown(x: number[], y: number[]): KendallBreakdown {
  const n = Math.min(x.length, y.length)
  const points = Array.from({ length: n }, (_, i) => ({ id: String(i), x: x[i], y: y[i] }))
  const pairs = kendallPairs(points)
  let concordant = 0
  let discordant = 0
  let tieX = 0
  let tieY = 0
  let tieBoth = 0
  for (const pair of pairs) {
    if (pair.kind === 'concordant') concordant++
    else if (pair.kind === 'discordant') discordant++
    else if (pair.kind === 'tie-x') tieX++
    else if (pair.kind === 'tie-y') tieY++
    else tieBoth++
  }
  const n0 = (n * (n - 1)) / 2
  const den = Math.sqrt((n0 - tieX - tieBoth) * (n0 - tieY - tieBoth))
  return {
    variant: KENDALL_VARIANT,
    n,
    pairs: pairs.length,
    concordant,
    discordant,
    tieX,
    tieY,
    tieBoth,
    tau: den === 0 ? Number.NaN : clampUnit((concordant - discordant) / den),
  }
}

export function olsFit(x: number[], y: number[]): LinearFit {
  const n = Math.min(x.length, y.length)
  const xs = x.slice(0, n)
  const ys = y.slice(0, n)
  const sx2 = sampleVariance(xs)
  const cov = sampleCovariance(xs, ys)
  if (!Number.isFinite(sx2) || sx2 === 0 || !Number.isFinite(cov)) {
    return { intercept: Number.NaN, slope: Number.NaN, residuals: ys.map(() => Number.NaN) }
  }
  const slope = cov / sx2
  const intercept = mean(ys) - slope * mean(xs)
  return {
    intercept,
    slope,
    residuals: ys.map((value, i) => value - (intercept + slope * xs[i])),
  }
}

export function residualsOn(predictor: number[], response: number[]): number[] {
  return olsFit(predictor, response).residuals
}

export function partialCorrelation(x: number[], y: number[], z: number[]): number {
  const rxy = pearsonR(x, y)
  const rxz = pearsonR(x, z)
  const ryz = pearsonR(y, z)
  if (![rxy, rxz, ryz].every(Number.isFinite)) return Number.NaN
  const den = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz))
  if (!Number.isFinite(den) || den === 0) return Number.NaN
  return clampUnit((rxy - rxz * ryz) / den)
}

export function partialFromResiduals(x: number[], y: number[], z: number[]): number {
  return pearsonR(residualsOn(z, x), residualsOn(z, y))
}

export function summarizePair(points: Array<Pick<Observation, 'x' | 'y'>>): BivariateSummary {
  const x = points.map((point) => point.x)
  const y = points.map((point) => point.y)
  return {
    n: points.length,
    meanX: mean(x),
    meanY: mean(y),
    sdX: sampleSd(x),
    sdY: sampleSd(y),
    cov: sampleCovariance(x, y),
    pearson: pearsonR(x, y),
    spearman: spearmanRho(x, y),
    kendall: kendallTauB(x, y),
  }
}

export function describeAssociation(r: number): AssociationStrength {
  if (!Number.isFinite(r)) return 'undefined'
  const a = Math.abs(r)
  if (a < 0.08) return 'none'
  if (r >= 0.7) return 'strong-positive'
  if (r >= 0.4) return 'moderate-positive'
  if (r > 0) return 'weak-positive'
  if (r <= -0.7) return 'strong-negative'
  if (r <= -0.4) return 'moderate-negative'
  return 'weak-negative'
}

export function associationLabel(r: number): string {
  switch (describeAssociation(r)) {
    case 'undefined':
      return 'undefined (zero variance)'
    case 'none':
      return 'no linear association'
    case 'strong-positive':
      return 'strong positive association'
    case 'moderate-positive':
      return 'moderate positive association'
    case 'weak-positive':
      return 'weak positive association'
    case 'strong-negative':
      return 'strong negative association'
    case 'moderate-negative':
      return 'moderate negative association'
    case 'weak-negative':
      return 'weak negative association'
  }
}

export function transformPoints(
  points: Observation[],
  options: { scaleX?: number; shiftX?: number; scaleY?: number; shiftY?: number },
): Observation[] {
  const scaleX = options.scaleX ?? 1
  const shiftX = options.shiftX ?? 0
  const scaleY = options.scaleY ?? 1
  const shiftY = options.shiftY ?? 0
  return points.map((point) => ({
    ...point,
    x: point.x * scaleX + shiftX,
    y: point.y * scaleY + shiftY,
    z: point.z,
    extras: point.extras ? { ...point.extras } : undefined,
  }))
}

export function pairwiseComplete(
  rows: Array<Record<string, number | undefined>>,
  a: string,
  b: string,
): { x: number[]; y: number[]; n: number } {
  const x: number[] = []
  const y: number[] = []
  for (const row of rows) {
    const xv = row[a]
    const yv = row[b]
    if (typeof xv === 'number' && Number.isFinite(xv) && typeof yv === 'number' && Number.isFinite(yv)) {
      x.push(xv)
      y.push(yv)
    }
  }
  return { x, y, n: x.length }
}

export function correlationMatrix(
  columns: NamedSeries[],
  method: CorrMethod = 'pearson',
): { values: number[][]; ns: number[][] } {
  const values = columns.map(() => columns.map(() => Number.NaN))
  const ns = columns.map(() => columns.map(() => 0))
  for (let i = 0; i < columns.length; i++) {
    values[i][i] = 1
    ns[i][i] = columns[i].values.length
    for (let j = i + 1; j < columns.length; j++) {
      const pair = pairwiseComplete(
        columns[i].values.map((value, index) => ({ a: value, b: columns[j].values[index] })),
        'a',
        'b',
      )
      const r = method === 'spearman' ? spearmanRho(pair.x, pair.y) : pearsonR(pair.x, pair.y)
      values[i][j] = values[j][i] = r
      ns[i][j] = ns[j][i] = pair.n
    }
  }
  return { values, ns }
}

function idFor(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`
}

function linearCloud(
  n: number,
  r: number,
  rng: SeededRng,
  xMean: number,
  xSd: number,
  yMean: number,
  ySd: number,
  extraNoise = 0,
): Observation[] {
  const target = clamp(r, -0.999, 0.999)
  const remain = Math.sqrt(Math.max(0, 1 - target * target))
  const points: Observation[] = []
  for (let i = 0; i < n; i++) {
    const zx = rng.normal()
    const ze = rng.normal()
    const zy = target * zx + remain * ze + extraNoise * rng.normal()
    points.push({
      id: idFor('p', i),
      x: xMean + xSd * zx,
      y: yMean + ySd * zy,
    })
  }
  return points
}

export function generateLinear(options: {
  n: number
  r: number
  noise?: number
  seed?: number
  xMean?: number
  xSd?: number
  yMean?: number
  ySd?: number
}): Observation[] {
  const rng = new SeededRng(options.seed ?? 17)
  return linearCloud(
    options.n,
    options.r,
    rng,
    options.xMean ?? 50,
    options.xSd ?? 12,
    options.yMean ?? 50,
    options.ySd ?? 12,
    options.noise ?? 0,
  )
}

export function generatePreset(id: PresetId, n = 40, seed = 21): Observation[] {
  const rng = new SeededRng(seed)
  if (id === 'strong-pos') return linearCloud(n, 0.88, rng, 50, 12, 50, 12)
  if (id === 'weak-pos') return linearCloud(n, 0.32, rng, 50, 12, 50, 12)
  if (id === 'strong-neg') return linearCloud(n, -0.86, rng, 50, 12, 50, 12)
  if (id === 'weak-neg') return linearCloud(n, -0.3, rng, 50, 12, 50, 12)
  if (id === 'none') return linearCloud(n, 0, rng, 50, 12, 50, 12)
  if (id === 'height-weight') return linearCloud(n, 0.62, rng, 168, 9, 68, 11)
  if (id === 'study-exam') return linearCloud(n, 0.74, rng, 8.5, 4.2, 72, 14)

  if (id === 'u-shape') {
    return Array.from({ length: n }, (_, i) => {
      const x = 10 + (80 * i) / Math.max(1, n - 1) + rng.normal(0, 1.2)
      const z = (x - 50) / 18
      return { id: idFor('u', i), x, y: 30 + 22 * z * z + rng.normal(0, 3) }
    })
  }

  if (id === 'monotonic-nonlinear') {
    return Array.from({ length: n }, (_, i) => {
      const x = 1 + (8 * i) / Math.max(1, n - 1) + rng.normal(0, 0.12)
      return { id: idFor('m', i), x, y: 8 + 0.55 * x * x * x + rng.normal(0, 4) }
    })
  }

  if (id === 'outlier') {
    const points = linearCloud(n - 1, 0.82, rng, 40, 8, 40, 8)
    points.push({ id: 'outlier', x: 92, y: 8 })
    return points
  }

  if (id === 'clustered') {
    const left = linearCloud(Math.floor(n / 2), 0.15, rng, 28, 4, 30, 4)
    const right = linearCloud(n - left.length, 0.15, new SeededRng(seed + 9), 72, 4, 70, 4)
    return [
      ...left.map((point, i) => ({ ...point, id: idFor('cA', i), group: 'A' })),
      ...right.map((point, i) => ({ ...point, id: idFor('cB', i), group: 'B' })),
    ]
  }

  if (id === 'restricted-range') {
    return linearCloud(n + 40, 0.86, rng, 50, 16, 50, 16).filter((point) => point.x >= 42 && point.x <= 58).slice(0, n)
  }

  if (id === 'confounded') {
    return Array.from({ length: n }, (_, i) => {
      const z = rng.normal(100, 12)
      const x = 0.85 * z + rng.normal(0, 6)
      const y = 0.82 * z + rng.normal(0, 7)
      return { id: idFor('cf', i), x, y, z }
    })
  }

  if (id === 'suppression') {
    return Array.from({ length: n }, (_, i) => {
      const z = rng.normal(50, 10)
      const x = 0.75 * z + rng.normal(0, 8)
      const y = -0.7 * z + 0.35 * x + rng.normal(0, 8)
      return { id: idFor('sp', i), x, y, z }
    })
  }

  if (id === 'simpson') {
    const a = Array.from({ length: Math.floor(n / 2) }, (_, i) => {
      const x = rng.normal(22, 4)
      return { id: idFor('sA', i), x, y: 38 - 0.55 * x + rng.normal(0, 2.2), group: 'A', z: 0 }
    })
    const b = Array.from({ length: n - a.length }, (_, i) => {
      const x = rng.normal(48, 4)
      return { id: idFor('sB', i), x, y: 86 - 0.55 * x + rng.normal(0, 2.2), group: 'B', z: 1 }
    })
    return [...a, ...b]
  }

  if (id === 'ice-cream') {
    return Array.from({ length: n }, (_, i) => {
      const temperature = 12 + (28 * i) / Math.max(1, n - 1) + rng.normal(0, 1.1)
      const iceCream = 20 + 4.2 * temperature + rng.normal(0, 8)
      const drownings = 2 + 0.85 * temperature + rng.normal(0, 2.4)
      return {
        id: idFor('ice', i),
        x: iceCream,
        y: drownings,
        z: temperature,
        extras: { iceCream, drownings, temperature },
      }
    })
  }

  if (id === 'ranks-tied') {
    const x = [2, 5, 5, 9, 11, 14, 14, 18, 20, 22]
    const y = [4, 7, 6, 10, 15, 13, 16, 19, 21, 20]
    return x.map((value, i) => ({ id: idFor('rk', i), x: value, y: y[i] }))
  }

  const kendall = [
    { x: 68, y: 65 },
    { x: 72, y: 70 },
    { x: 75, y: 60 },
    { x: 80, y: 78 },
    { x: 88, y: 92 },
  ]
  return kendall.map((point, i) => ({ id: idFor('k', i), ...point }))
}

export function generateStudentMatrix(n = 36, seed = 44): Array<Record<string, number>> {
  const rng = new SeededRng(seed)
  const rows: Array<Record<string, number>> = []
  for (let i = 0; i < n; i++) {
    const study = clamp(rng.normal(7.5, 2.4), 1, 16)
    const sleep = clamp(rng.normal(7.1, 1.1), 4, 10)
    const attendance = clamp(0.55 + 0.035 * study + rng.normal(0, 0.08), 0.35, 1)
    const screen = clamp(5.8 - 0.22 * study + rng.normal(0, 1.4), 0.5, 12)
    const homework = clamp(0.55 * study + rng.normal(1.2, 1.1), 0.2, 12)
    const activity = clamp(rng.normal(3.4, 1.6), 0, 10)
    const test = clamp(42 + 3.6 * study + 18 * attendance - 1.7 * screen + rng.normal(0, 6), 30, 100)
    rows.push({
      studyHours: study,
      sleepHours: sleep,
      attendance: attendance,
      testScore: test,
      homework,
      screenTime: screen,
      activity,
    })
  }
  return rows
}

export const WORKED = {
  covariance: [
    { x: 2, y: 50 },
    { x: 5, y: 65 },
    { x: 8, y: 85 },
    { x: 11, y: 92 },
    { x: 14, y: 97 },
  ],
  pearson: [
    { x: 2, y: 58 },
    { x: 4, y: 70 },
    { x: 5, y: 78 },
    { x: 6, y: 83 },
    { x: 8, y: 91 },
    { x: 9, y: 94 },
  ],
  spearman: [
    { x: 2, y: 50 },
    { x: 4, y: 55 },
    { x: 6, y: 63 },
    { x: 8, y: 68 },
    { x: 10, y: 72 },
    { x: 12, y: 75 },
    { x: 14, y: 80 },
    { x: 16, y: 84 },
    { x: 18, y: 90 },
    { x: 20, y: 94 },
  ],
  ranks: [2, 5, 5, 9],
  umbrella: { rain: [0, 2, 6, 10, 14], umbrellas: [1, 4, 9, 15, 18], wet: [0, 1, 3, 6, 9] },
}

export function loadCaProgress(): CaProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(CA_PROGRESS_KEY) ?? '{}') as Partial<CaProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveCaProgress(progress: CaProgress): void {
  localStorage.setItem(CA_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markCaLabComplete(labSlug: string): CaProgress {
  const next = loadCaProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveCaProgress(next)
  return next
}

export function caStudioPath(): string {
  return studioPath(CA_STUDIO)
}

export function caLabPath(labSlug: string): string {
  return labPath(CA_STUDIO_SLUG, labSlug)
}

export function caNextStudioPath(): string {
  return studioPath(CA_NEXT_STUDIO)
}

export function nextIncompleteCaLab(completed: string[]): StudioLab {
  return CA_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? CA_STUDIO.labs[0]
}
