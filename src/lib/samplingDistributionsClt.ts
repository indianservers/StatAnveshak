import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const CLT_STUDIO_SLUG = 'sampling-distributions-clt'
export const CLT_PROGRESS_KEY = 'anveshak-sampling-distributions-clt'
export const NEXT_STUDIO_PATH = '/statistics/estimation'

export type CltTab = 'learn' | 'explore' | 'practice' | 'quiz'
export type CltProgress = { completed: string[] }

export type PopulationKind =
  | 'normal'
  | 'uniform'
  | 'skewed'
  | 'leftSkewed'
  | 'bimodal'
  | 'discrete'
  | 'bernoulli'
  | 'custom'

export type StatisticKind = 'mean' | 'proportion' | 'median'

export type Rng = () => number

export type PopulationSpec = {
  kind: PopulationKind
  mu?: number
  sigma?: number
  min?: number
  max?: number
  p?: number
  values?: number[]
  size?: number
  seed?: number
}

export type Population = {
  kind: PopulationKind
  mean: number
  sd: number
  p?: number
  size: number
  finite: boolean
  values?: number[]
  draw: (rng: Rng) => number
  density: Array<{ x: number; y: number }>
}

export type HistBin = { x0: number; x1: number; mid: number; count: number }

export type SimulationResult = {
  R: number
  n: number
  statistics: number[]
  histogram: HistBin[]
  empiricalMean: number
  empiricalSd: number
  bias: number
  theoreticalSE: number
  lastSample: number[]
  lastStatistic: number
  usedFpc: boolean
  fpc: number
}

export const CLT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === CLT_STUDIO_SLUG) as Studio

export const CLT_HOME_COPY: Record<string, { blurb: string; tryThis: string; chips: string[] }> = {
  'sampling-distribution-of-the-mean': {
    blurb: 'See how the sample mean varies across repeated samples.',
    tryThis: 'Draw 1, then 1,000 samples. Watch the pile of means tighten around μ while one sample still wiggles.',
    chips: ['Sample mean', 'Repeated sampling', 'Sampling distribution', 'Standard error'],
  },
  'sampling-distribution-of-a-proportion': {
    blurb: 'Explore the distribution of sample proportions and its properties.',
    tryThis: 'Drop p to 0.08 with n = 20. The histogram stays lumpy — do not paste a smooth normal on top.',
    chips: ['Sample proportion', 'Center p', 'SE of p̂', 'Normal approximation'],
  },
  'standard-error': {
    blurb: 'Understand what standard error means and how it changes with sample size.',
    tryThis: 'Double n, then quadruple n. Doubling does not halve SE; four times n does.',
    chips: ['Standard error', 'σ / √n', 'Precision', 'Sample size'],
  },
  'central-limit-theorem': {
    blurb: 'Discover why sample means become approximately normal — and when that story is incomplete.',
    tryThis: 'Keep a skewed parent and slide n from 2 to 50. The sampling distribution changes by actual draws, not a morph.',
    chips: ['CLT', 'Parent shape', 'Sample size', 'Approximate normality'],
  },
  'law-of-large-numbers': {
    blurb: 'See how a sample average stabilizes as the number of observations grows.',
    tryThis: 'Run two paths of the same coin. Both wander toward p, but they do not take the same route.',
    chips: ['LLN', 'Running average', 'Convergence', 'Stability'],
  },
  'sampling-distribution-comparison': {
    blurb: 'Compare distributions across sample sizes, parent shapes, and statistics.',
    tryThis: 'Overlay n = 5 and n = 100, then switch from the mean to a proportion.',
    chips: ['Center', 'Spread', 'Shape', 'Bias'],
  },
  'bootstrap-intuition': {
    blurb: 'Use resampling with replacement to build an empirical sampling distribution from one sample.',
    tryThis: 'Resample the same ten numbers 1,000 times. Some values appear twice in a resample; that is the point.',
    chips: ['Bootstrap', 'With replacement', 'Bootstrap SE', 'Percentiles'],
  },
}

export function cltStudioPath(): string {
  return studioPath(CLT_STUDIO)
}

export function cltLabPath(labSlug: string): string {
  return labPath(CLT_STUDIO_SLUG, labSlug)
}

export function loadCltProgress(): CltProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(CLT_PROGRESS_KEY) ?? '{}') as Partial<CltProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveCltProgress(progress: CltProgress): void {
  localStorage.setItem(CLT_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markCltLabComplete(labSlug: string): CltProgress {
  const next = loadCltProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveCltProgress(next)
  return next
}

export function nextIncompleteCltLab(completed: string[]): StudioLab {
  const first = CLT_STUDIO.labs[0]
  if (!first) throw new Error('Sampling Distributions studio has no labs')
  return CLT_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? first
}

export function formatNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(digits)).toString()
}

export function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNum(value * 100, digits)}%`
}

export function createRng(seed = 20260316): Rng {
  let state = seed >>> 0
  if (state === 0) state = 0x9e3779b9
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gaussian(rng: Rng): number {
  const u = Math.max(1e-12, 1 - rng())
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function sampleNormal(rng: Rng, mu: number, sigma: number): number {
  return mu + sigma * gaussian(rng)
}

export function meanOf(values: number[]): number {
  if (values.length === 0) return Number.NaN
  let sum = 0
  for (const value of values) sum += value
  return sum / values.length
}

export function populationSd(values: number[]): number {
  if (values.length === 0) return Number.NaN
  const mu = meanOf(values)
  let sum = 0
  for (const value of values) sum += (value - mu) ** 2
  return Math.sqrt(sum / values.length)
}

export function sampleSd(values: number[]): number {
  if (values.length < 2) return Number.NaN
  const mu = meanOf(values)
  let sum = 0
  for (const value of values) sum += (value - mu) ** 2
  return Math.sqrt(sum / (values.length - 1))
}

export function medianOf(values: number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const left = sorted[mid - 1]
  const right = sorted[mid]
  if (sorted.length % 2 === 1) return right ?? Number.NaN
  if (left === undefined || right === undefined) return Number.NaN
  return (left + right) / 2
}

export function quantileOf(values: number[], p: number): number {
  if (values.length === 0) return Number.NaN
  const clamped = Math.min(1, Math.max(0, p))
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * clamped
  const lo = Math.floor(index)
  const hi = Math.ceil(index)
  const a = sorted[lo]
  const b = sorted[hi]
  if (a === undefined) return Number.NaN
  if (b === undefined || lo === hi) return a
  return a + (b - a) * (index - lo)
}

export function sampleStatistic(sample: number[], kind: StatisticKind): number {
  if (kind === 'median') return medianOf(sample)
  if (kind === 'proportion') return meanOf(sample)
  return meanOf(sample)
}

export function finitePopulationCorrection(n: number, N: number): number {
  if (!(N > 1) || !(n >= 1) || n >= N) return 0
  return Math.sqrt((N - n) / (N - 1))
}

export function fpcIsMaterial(n: number, N: number): boolean {
  return Number.isFinite(N) && N > 0 && n / N >= 0.05 && n < N
}

export function theoreticalSE(args: {
  sigma?: number
  n: number
  N?: number
  replacement?: boolean
  kind: StatisticKind
  p?: number
}): number {
  const { n, kind } = args
  if (!(n > 0)) return Number.NaN
  const replacement = args.replacement !== false
  let base = Number.NaN
  if (kind === 'proportion') {
    const p = args.p ?? 0.5
    base = Math.sqrt((p * (1 - p)) / n)
  } else if (kind === 'median') {
    const sigma = args.sigma ?? 1
    base = (1.253314137 * sigma) / Math.sqrt(n)
  } else {
    const sigma = args.sigma ?? 1
    base = sigma / Math.sqrt(n)
  }
  const N = args.N
  if (!replacement && N !== undefined && fpcIsMaterial(n, N)) {
    return base * finitePopulationCorrection(n, N)
  }
  return base
}

export function normalApproxOk(n: number, p: number, threshold = 10): boolean {
  return n * p >= threshold && n * (1 - p) >= threshold
}

export function seVsN(sigma: number, ns: number[]): Array<{ n: number; se: number }> {
  return ns.map((n) => ({ n, se: sigma / Math.sqrt(n) }))
}

function linspace(min: number, max: number, count: number): number[] {
  if (count <= 1) return [min]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => min + i * step)
}

function normalPdf(x: number, mu: number, sigma: number): number {
  if (!(sigma > 0)) return 0
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function densityCurve(xs: number[], pdf: (x: number) => number): Array<{ x: number; y: number }> {
  return xs.map((x) => ({ x, y: pdf(x) }))
}

function materialize(draw: (rng: Rng) => number, size: number, rng: Rng): number[] {
  return Array.from({ length: size }, () => draw(rng))
}

export function createPopulation(spec: PopulationSpec, rng: Rng = createRng(spec.seed ?? 17)): Population {
  const kind = spec.kind
  const mu = spec.mu ?? (kind === 'bernoulli' ? spec.p ?? 0.4 : 50)
  const sigma = spec.sigma ?? (kind === 'bernoulli' ? Math.sqrt((spec.p ?? 0.4) * (1 - (spec.p ?? 0.4))) : 10)
  const min = spec.min ?? mu - 2 * sigma
  const max = spec.max ?? mu + 2 * sigma
  const p = spec.p ?? 0.4
  const size = spec.size ?? (kind === 'custom' || kind === 'discrete' || kind === 'bernoulli' ? spec.values?.length ?? 1000 : 400)

  if (kind === 'custom' || kind === 'discrete') {
    const values = spec.values && spec.values.length > 0 ? [...spec.values] : materialize(() => sampleNormal(rng, mu, sigma), size, rng)
    const mean = meanOf(values)
    const sd = populationSd(values)
    return {
      kind,
      mean,
      sd,
      size: values.length,
      finite: true,
      values,
      draw: (next) => values[Math.floor(next() * values.length)] ?? mean,
      density: histogramToDensity(buildHistogram(values, 18)),
    }
  }

  if (kind === 'bernoulli') {
    const values =
      spec.values && spec.values.length > 0
        ? [...spec.values]
        : Array.from({ length: size }, () => (rng() < p ? 1 : 0))
    return {
      kind,
      mean: p,
      sd: Math.sqrt(p * (1 - p)),
      p,
      size: values.length,
      finite: true,
      values,
      draw: (next) => (next() < p ? 1 : 0),
      density: [
        { x: 0, y: 1 - p },
        { x: 1, y: p },
      ],
    }
  }

  let draw: (next: Rng) => number
  let mean = mu
  let sd = sigma
  let xs = linspace(mu - 4 * sigma, mu + 4 * sigma, 80)
  let density: Array<{ x: number; y: number }>

  if (kind === 'uniform') {
    const a = min
    const b = max
    mean = (a + b) / 2
    sd = (b - a) / Math.sqrt(12)
    draw = (next) => a + next() * (b - a)
    xs = linspace(a - 0.05 * (b - a), b + 0.05 * (b - a), 80)
    density = xs.map((x) => ({ x, y: x >= a && x <= b ? 1 / (b - a) : 0 }))
  } else if (kind === 'skewed') {
    const rate = 1 / Math.max(sigma, 0.2)
    mean = 1 / rate
    sd = 1 / rate
    draw = (next) => -Math.log(Math.max(1e-12, 1 - next())) / rate
    xs = linspace(0, mean + 5 * sd, 80)
    density = xs.map((x) => ({ x, y: x >= 0 ? rate * Math.exp(-rate * x) : 0 }))
  } else if (kind === 'leftSkewed') {
    const rate = 1 / Math.max(sigma, 0.2)
    const rawMean = 1 / rate
    const rawSd = 1 / rate
    const pivot = rawMean + 3 * rawSd
    mean = pivot - rawMean
    sd = rawSd
    draw = (next) => pivot - -Math.log(Math.max(1e-12, 1 - next())) / rate
    xs = linspace(mean - 5 * sd, pivot, 80)
    density = xs.map((x) => {
      const raw = pivot - x
      return { x, y: raw >= 0 ? rate * Math.exp(-rate * raw) : 0 }
    })
  } else if (kind === 'bimodal') {
    const left = mu - 1.4 * sigma
    const right = mu + 1.4 * sigma
    const part = 0.55 * sigma
    mean = mu
    sd = Math.sqrt(part * part + (1.4 * sigma) ** 2)
    draw = (next) => sampleNormal(next, next() < 0.5 ? left : right, part)
    xs = linspace(mu - 4.5 * sigma, mu + 4.5 * sigma, 90)
    density = xs.map((x) => ({
      x,
      y: 0.5 * normalPdf(x, left, part) + 0.5 * normalPdf(x, right, part),
    }))
  } else {
    draw = (next) => sampleNormal(next, mu, sigma)
    density = densityCurve(xs, (x) => normalPdf(x, mu, sigma))
  }

  const finite = spec.size !== undefined
  const values = finite ? materialize(draw, size, rng) : undefined
  return {
    kind,
    mean: values ? meanOf(values) : mean,
    sd: values ? populationSd(values) : sd,
    size: values?.length ?? Number.POSITIVE_INFINITY,
    finite,
    values,
    p: undefined,
    draw,
    density,
  }
}

export function drawSample(
  population: Population,
  n: number,
  rng: Rng,
  options: { replacement?: boolean } = {},
): number[] {
  const replacement = options.replacement !== false
  const source = population.values
  if (!replacement && source && source.length > 0) {
    const copy = [...source]
    const take = Math.min(n, copy.length)
    for (let i = 0; i < take; i += 1) {
      const j = i + Math.floor(rng() * (copy.length - i))
      const a = copy[i]
      const b = copy[j]
      if (a === undefined || b === undefined) continue
      copy[i] = b
      copy[j] = a
    }
    return copy.slice(0, take)
  }
  return Array.from({ length: n }, () => population.draw(rng))
}

export function buildHistogram(values: number[], bins = 24, range?: [number, number]): HistBin[] {
  if (values.length === 0) {
    const [lo, hi] = range ?? [0, 1]
    const width = (hi - lo) / Math.max(bins, 1)
    return Array.from({ length: bins }, (_, i) => {
      const x0 = lo + i * width
      const x1 = x0 + width
      return { x0, x1, mid: (x0 + x1) / 2, count: 0 }
    })
  }
  const lo = range?.[0] ?? Math.min(...values)
  const hi = range?.[1] ?? Math.max(...values)
  const span = hi - lo || 1
  const width = span / bins
  const counts = Array.from({ length: bins }, () => 0)
  for (const value of values) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - lo) / span) * bins)))
    counts[index] = (counts[index] ?? 0) + 1
  }
  return counts.map((count, i) => {
    const x0 = lo + i * width
    const x1 = x0 + width
    return { x0, x1, mid: (x0 + x1) / 2, count }
  })
}

function histogramToDensity(bins: HistBin[]): Array<{ x: number; y: number }> {
  const total = bins.reduce((sum, bin) => sum + bin.count, 0)
  const width = bins[0] ? bins[0].x1 - bins[0].x0 : 1
  return bins.map((bin) => ({ x: bin.mid, y: total > 0 ? bin.count / (total * width) : 0 }))
}

export function downsamplePath(values: number[], maxPoints = 360): number[] {
  if (values.length <= maxPoints) return values
  const step = values.length / maxPoints
  const out: number[] = []
  for (let i = 0; i < maxPoints; i += 1) {
    const value = values[Math.min(values.length - 1, Math.floor(i * step))]
    if (value !== undefined) out.push(value)
  }
  return out
}

export function runningMeans(draws: number[]): number[] {
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < draws.length; i += 1) {
    sum += draws[i] ?? 0
    out.push(sum / (i + 1))
  }
  return out
}

export function bootstrapResample(sample: number[], rng: Rng): number[] {
  if (sample.length === 0) return []
  return Array.from({ length: sample.length }, () => sample[Math.floor(rng() * sample.length)] ?? 0)
}

export function percentileInterval(values: number[], level = 0.95): [number, number] {
  const alpha = (1 - level) / 2
  return [quantileOf(values, alpha), quantileOf(values, 1 - alpha)]
}

export function histogramRangeForStatistic(
  population: Population,
  n: number,
  kind: StatisticKind,
): [number, number] {
  const se = theoreticalSE({
    sigma: population.sd,
    n,
    kind,
    p: population.p ?? population.mean,
    N: population.finite ? population.size : undefined,
    replacement: true,
  })
  if (kind === 'proportion') return [-0.02, 1.02]
  const pad = Math.max(4 * se, 0.35 * population.sd, 0.8)
  return [population.mean - pad, population.mean + pad]
}

export function simulateSampling(args: {
  population: Population
  n: number
  R: number
  statistic: StatisticKind
  seed: number
  replacement?: boolean
  bins?: number
  keepStatistics?: boolean
}): SimulationResult {
  const { population, n, R, statistic } = args
  const rng = createRng(args.seed)
  const replacement = args.replacement !== false
  const range = histogramRangeForStatistic(population, n, statistic)
  const bins = args.bins ?? 28
  const histogram = buildHistogram([], bins, range)
  const span = range[1] - range[0] || 1
  let sum = 0
  let sumSq = 0
  let lastSample: number[] = []
  let lastStatistic = Number.NaN
  const keepAll = args.keepStatistics !== false && R <= 2500
  const statistics: number[] = keepAll ? [] : []
  const reservoir: number[] = []

  for (let i = 0; i < R; i += 1) {
    const sample = drawSample(population, n, rng, { replacement })
    const value = sampleStatistic(sample, statistic)
    sum += value
    sumSq += value * value
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - range[0]) / span) * bins)))
    const bin = histogram[index]
    if (bin) bin.count += 1
    if (keepAll) statistics.push(value)
    else if (reservoir.length < 400) reservoir.push(value)
    lastSample = sample
    lastStatistic = value
  }

  const empiricalMean = R > 0 ? sum / R : Number.NaN
  const empiricalVar = R > 1 ? Math.max(0, sumSq / R - empiricalMean * empiricalMean) : 0
  const empiricalSd = Math.sqrt(empiricalVar)
  const usedFpc = !replacement && population.finite && fpcIsMaterial(n, population.size)
  const fpc = usedFpc ? finitePopulationCorrection(n, population.size) : 1
  const se = theoreticalSE({
    sigma: population.sd,
    n,
    N: population.finite ? population.size : undefined,
    replacement,
    kind: statistic,
    p: population.p ?? (statistic === 'proportion' ? population.mean : undefined),
  })

  return {
    R,
    n,
    statistics: keepAll ? statistics : reservoir,
    histogram,
    empiricalMean,
    empiricalSd,
    bias: empiricalMean - (statistic === 'proportion' ? (population.p ?? population.mean) : population.mean),
    theoreticalSE: se,
    lastSample,
    lastStatistic,
    usedFpc,
    fpc,
  }
}

export function appendSimulatedStatistics(args: {
  population: Population
  n: number
  add: number
  statistic: StatisticKind
  rng: Rng
  replacement?: boolean
  histogram: HistBin[]
  range: [number, number]
  prior: { R: number; sum: number; sumSq: number }
}): { R: number; sum: number; sumSq: number; lastSample: number[]; lastStatistic: number; added: number[] } {
  const { population, n, add, statistic, rng, histogram, range, prior } = args
  const replacement = args.replacement !== false
  const span = range[1] - range[0] || 1
  const bins = histogram.length
  let { R, sum, sumSq } = prior
  let lastSample: number[] = []
  let lastStatistic = Number.NaN
  const added: number[] = []
  for (let i = 0; i < add; i += 1) {
    const sample = drawSample(population, n, rng, { replacement })
    const value = sampleStatistic(sample, statistic)
    sum += value
    sumSq += value * value
    R += 1
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - range[0]) / span) * bins)))
    const bin = histogram[index]
    if (bin) bin.count += 1
    if (added.length < 80) added.push(value)
    lastSample = sample
    lastStatistic = value
  }
  return { R, sum, sumSq, lastSample, lastStatistic, added }
}

export class SamplingDistributionEngine {
  private rng: Rng
  private seed: number

  constructor(options: { seed?: number } = {}) {
    this.seed = options.seed ?? 20260316
    this.rng = createRng(this.seed)
  }

  setSeed(seed: number): void {
    this.seed = seed
    this.rng = createRng(seed)
  }

  next(): number {
    return this.rng()
  }

  createPopulation(spec: PopulationSpec): Population {
    return createPopulation(spec, this.rng)
  }

  drawSample(population: Population, n: number, options: { replacement?: boolean } = {}): number[] {
    return drawSample(population, n, this.rng, options)
  }

  statistic(sample: number[], kind: StatisticKind): number {
    return sampleStatistic(sample, kind)
  }

  simulate(args: Omit<Parameters<typeof simulateSampling>[0], 'seed'> & { seed?: number }): SimulationResult {
    return simulateSampling({ ...args, seed: args.seed ?? this.seed })
  }

  theoreticalSE(args: Parameters<typeof theoreticalSE>[0]): number {
    return theoreticalSE(args)
  }

  bootstrap(sample: number[], B: number, kind: StatisticKind, seed = this.seed): SimulationResult {
    const rng = createRng(seed)
    const stats = Array.from({ length: B }, () => sampleStatistic(bootstrapResample(sample, rng), kind))
    const mean = meanOf(sample)
    const sd = populationSd(sample)
    const fakePop: Population = {
      kind: 'custom',
      mean,
      sd,
      size: sample.length,
      finite: true,
      values: sample,
      draw: (next) => sample[Math.floor(next() * sample.length)] ?? mean,
      density: [],
    }
    const range = histogramRangeForStatistic(fakePop, sample.length, kind)
    return {
      R: B,
      n: sample.length,
      statistics: stats,
      histogram: buildHistogram(stats, 28, range),
      empiricalMean: meanOf(stats),
      empiricalSd: populationSd(stats),
      bias: meanOf(stats) - sampleStatistic(sample, kind),
      theoreticalSE: theoreticalSE({ sigma: sd, n: sample.length, kind, replacement: true }),
      lastSample: stats.length ? bootstrapResample(sample, rng) : [],
      lastStatistic: stats[stats.length - 1] ?? Number.NaN,
      usedFpc: false,
      fpc: 1,
    }
  }
}

export const DEFAULT_WAIT_TIMES = [12, 15, 14, 10, 18, 11, 17, 13, 16, 12]
export const DEFAULT_BOOTSTRAP_SAMPLE = [12, 15, 14, 10, 18, 11, 17, 13, 16, 12]
export const WORKED_SCORES = { mu: 70, sigma: 12, n: 36 }
export const WORKED_PROPORTION = { p: 0.4, n: 100 }
export const WORKED_SE = { sigma: 12, n: 36 }
export const WORKED_CLT = { mu: 4, sigma: 6, n: 36 }
export const WORKED_LLN = { p: 0.5, n: 500, observed: 0.484 }
export const WORKED_COMPARE = { mu: 50, sigma: 10, nSmall: 10, nLarge: 50 }
export const WORKED_BOOTSTRAP = { sample: [12, 15, 11, 17, 13, 16, 12], B: 1000 }

export const DRAW_BATCHES = [1, 10, 100, 1000, 10000] as const
export const CLT_SAMPLE_SIZES = [1, 2, 5, 10, 30, 50, 100] as const
export const SE_OVERLAY_NS = [5, 20, 50, 200] as const
export const COMPARE_NS = [5, 15, 30, 100] as const
