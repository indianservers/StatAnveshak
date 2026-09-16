import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const SM_STUDIO_SLUG = 'sampling-methods'
export const SM_PROGRESS_KEY = 'anveshak-sampling-methods'
export const SM_NEXT_STUDIO_SLUG = 'sampling-distributions-clt'
export const SM_MIN_N = 20
export const SM_MAX_N = 1000
export const SM_EPS = 1e-12

export type SmTab = 'learn' | 'explore' | 'practice' | 'quiz'
export type SmProgress = { completed: string[] }
export type BiasMechanism = 'undercoverage' | 'nonresponse' | 'voluntary' | 'convenience'
export type AllocationMode = 'proportional' | 'equal' | 'custom'
export type ClusterStage = 1 | 2

export type GroupSpec = {
  id: string
  label: string
  share: number
  mean: number
  sd: number
  respondP: number
  color: string
}

export type PopulationUnit = {
  id: number
  value: number
  group: string
  cluster: number
  order: number
  respondP: number
  selected?: boolean
}

export type Population = {
  units: PopulationUnit[]
  N: number
  mu: number
  sigma: number
  groups: GroupSpec[]
  clusterCount: number
}

export const SM_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === SM_STUDIO_SLUG) as Studio
export const SM_NEXT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === SM_NEXT_STUDIO_SLUG) as Studio

export const DEFAULT_GROUPS: GroupSpec[] = [
  { id: 'A', label: 'Group A', share: 0.25, mean: 62, sd: 8, respondP: 0.88, color: '#2563eb' },
  { id: 'B', label: 'Group B', share: 0.25, mean: 70, sd: 8, respondP: 0.66, color: '#7c3aed' },
  { id: 'C', label: 'Group C', share: 0.25, mean: 78, sd: 8, respondP: 0.42, color: '#059669' },
  { id: 'D', label: 'Group D', share: 0.25, mean: 88, sd: 8, respondP: 0.22, color: '#d97706' },
]

export const STRATA_GROUPS: GroupSpec[] = [
  { id: 'S1', label: 'Stratum 1', share: 120 / 300, mean: 64, sd: 7, respondP: 0.8, color: '#2563eb' },
  { id: 'S2', label: 'Stratum 2', share: 100 / 300, mean: 74, sd: 7, respondP: 0.7, color: '#7c3aed' },
  { id: 'S3', label: 'Stratum 3', share: 80 / 300, mean: 84, sd: 7, respondP: 0.6, color: '#059669' },
]

export const SM_HOME_COPY: Record<string, { blurb: string; tryThis: string; chips: string[] }> = {
  'population-vs-sample': {
    blurb: 'Understand the difference between a population and a sample.',
    tryThis: 'Take a sample, then increase n, then run a census. Watch x̄ move toward μ.',
    chips: ['Population', 'Sample', 'Parameter', 'Statistic'],
  },
  'simple-random-sampling': {
    blurb: 'Learn how to give every member an equal chance of being selected.',
    tryThis: 'Draw 1,000 samples and watch the sampling distribution of the mean tighten around μ.',
    chips: ['Equal probability', 'Without replacement', 'Sampling fraction'],
  },
  'stratified-sampling': {
    blurb: 'Divide the population into subgroups and sample from each stratum.',
    tryThis: 'Switch from proportional to equal allocation and compare x̄_st to the simple sample mean.',
    chips: ['Strata', 'Weights', 'Proportional allocation'],
  },
  'cluster-sampling': {
    blurb: 'Learn how to sample entire groups (clusters) instead of individuals.',
    tryThis: 'Select only some clusters, then raise ICC and watch the design effect grow.',
    chips: ['Clusters', 'One-stage', 'Two-stage', 'DEFF'],
  },
  'systematic-sampling': {
    blurb: 'Select every k-th member from an ordered list.',
    tryThis: 'Match the interval k to a hidden period and see the sample lock onto one part of the cycle.',
    chips: ['Interval k', 'Random start', 'Periodicity'],
  },
  'sampling-bias': {
    blurb: 'Explore common sources of bias and how they can affect results.',
    tryThis: 'Repeat a convenience sample 200 times. The average stays away from μ.',
    chips: ['Undercoverage', 'Nonresponse', 'Voluntary', 'Convenience'],
  },
  'sampling-vs-nonsampling-error': {
    blurb: 'Distinguish between sampling error and other sources of error.',
    tryThis: 'Grow n to shrink sampling variability, then add a wording bias that will not go away.',
    chips: ['Sampling error', 'Non-sampling error', 'MSE'],
  },
}

export const WORKED = {
  pvs: { N: 2000, n: 100, transitCount: 42 },
  srs: { N: 800, n: 50 },
  stratified: { Nh: [120, 100, 80], n: 60 },
  company: { Nh: [200, 180, 120], n: 90 },
  cluster: { clusters: 20, perCluster: 25, selected: 5 },
  systematic: { N: 500, n: 50, k: 10, start: 7 },
  visitors: { N: 300, n: 30, start: 4 },
  error: { n: 400, phat: 0.62 },
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
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(digits)).toString()
}

export function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNum(value * 100, digits)}%`
}

export function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function variance(values: number[], ddof = 0): number {
  if (values.length <= ddof) return Number.NaN
  const mu = mean(values)
  return values.reduce((sum, value) => sum + (value - mu) ** 2, 0) / (values.length - ddof)
}

export function sd(values: number[], ddof = 0): number {
  return Math.sqrt(variance(values, ddof))
}

export function mse(sampleVariance: number, bias: number): number {
  return sampleVariance + bias ** 2
}

export function inclusionProbability(n: number, N: number): number {
  if (N <= 0) return Number.NaN
  return n / N
}

export function finitePopulationCorrection(n: number, N: number): number {
  if (N <= 1) return 1
  return Math.sqrt(Math.max(0, (N - n) / (N - 1)))
}

export function meanStandardError(sigma: number, n: number, N?: number): number {
  if (n <= 0) return Number.NaN
  const base = sigma / Math.sqrt(n)
  return N === undefined ? base : base * finitePopulationCorrection(n, N)
}

export function proportionMoe(p: number, n: number, z = 1.96, N?: number): number {
  if (n <= 0) return Number.NaN
  const se = Math.sqrt((p * (1 - p)) / n)
  const fpc = N === undefined ? 1 : finitePopulationCorrection(n, N)
  return z * se * fpc
}

export function designEffect(m: number, rho: number): number {
  return 1 + (Math.max(1, m) - 1) * clamp(rho, -1, 1)
}

export function largestRemainder(weights: number[], total: number): number[] {
  if (weights.length === 0) return []
  const weightSum = weights.reduce((sum, value) => sum + value, 0)
  if (weightSum <= 0 || total <= 0) return weights.map(() => 0)
  const raw = weights.map((weight) => (weight / weightSum) * total)
  const floors = raw.map((value) => Math.floor(value))
  let leftover = total - floors.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
  const next = [...floors]
  for (const item of order) {
    if (leftover <= 0) break
    next[item.index] += 1
    leftover -= 1
  }
  return next
}

export function allocateProportional(Nh: number[], n: number): number[] {
  return largestRemainder(Nh, n)
}

export function allocateEqual(H: number, n: number): number[] {
  return largestRemainder(Array.from({ length: H }, () => 1), n)
}

export function systematicInterval(N: number, n: number): number {
  if (n <= 0) return N
  return Math.max(1, Math.floor(N / n))
}

export function systematicPositions(N: number, k: number, start: number): number[] {
  const interval = Math.max(1, k)
  const r = ((start - 1) % interval) + 1
  const ids: number[] = []
  for (let pos = r; pos <= N; pos += interval) ids.push(pos)
  return ids
}

export function loadSmProgress(): SmProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(SM_PROGRESS_KEY) ?? '{}') as Partial<SmProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveSmProgress(progress: SmProgress): void {
  localStorage.setItem(SM_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markSmLabComplete(labSlug: string): SmProgress {
  const next = loadSmProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveSmProgress(next)
  return next
}

export function smStudioPath(): string {
  return studioPath(SM_STUDIO)
}

export function smLabPath(labSlug: string): string {
  return labPath(SM_STUDIO_SLUG, labSlug)
}

export function smNextStudioPath(): string {
  return studioPath(SM_NEXT_STUDIO)
}

export function nextIncompleteSmLab(completed: string[]): StudioLab {
  return SM_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? SM_STUDIO.labs[0]
}

function splitGroupCounts(N: number, groups: GroupSpec[]): number[] {
  return largestRemainder(
    groups.map((group) => group.share),
    N,
  )
}

export function createPopulation(options: {
  N: number
  seed: number
  groups?: GroupSpec[]
  clusterCount?: number
  icc?: number
  periodicEvery?: number
  highValue?: number
  lowValue?: number
}): Population {
  const N = clamp(Math.round(options.N), SM_MIN_N, SM_MAX_N)
  const groups = options.groups ?? DEFAULT_GROUPS
  const rng = new SeededRng(options.seed)
  const counts = splitGroupCounts(N, groups)
  const clusterCount = Math.max(1, Math.round(options.clusterCount ?? 8))
  const rho = clamp(options.icc ?? 0.15, 0, 0.95)
  const units: PopulationUnit[] = []
  let cursor = 0

  const clusterEffects = Array.from({ length: clusterCount }, () => rng.normal(0, 1))

  for (let g = 0; g < groups.length; g += 1) {
    const group = groups[g]
    const count = counts[g] ?? 0
    for (let i = 0; i < count; i += 1) {
      const id = cursor + 1
      const cluster = (cursor % clusterCount) + 1
      const within = rng.normal(0, 1)
      const mixed = Math.sqrt(rho) * (clusterEffects[cluster - 1] ?? 0) + Math.sqrt(1 - rho) * within
      let value = group.mean + group.sd * mixed
      if (options.periodicEvery && options.periodicEvery > 0) {
        const high = options.highValue ?? group.mean + 18
        const low = options.lowValue ?? group.mean - 8
        value = id % options.periodicEvery === 0 ? high : low
      }
      units.push({
        id,
        value,
        group: group.id,
        cluster,
        order: id,
        respondP: clamp(group.respondP, 0.02, 0.98),
      })
      cursor += 1
    }
  }

  const values = units.map((unit) => unit.value)
  return {
    units,
    N: units.length,
    mu: mean(values),
    sigma: sd(values, 0),
    groups,
    clusterCount,
  }
}

export function unitsById(pop: Population, ids: number[]): PopulationUnit[] {
  const map = new Map(pop.units.map((unit) => [unit.id, unit]))
  return ids.flatMap((id) => {
    const unit = map.get(id)
    return unit ? [unit] : []
  })
}

export function sampleMean(pop: Population, ids: number[]): number {
  return mean(unitsById(pop, ids).map((unit) => unit.value))
}

export function sampleProportion(pop: Population, ids: number[], predicate: (unit: PopulationUnit) => boolean): number {
  const chosen = unitsById(pop, ids)
  if (chosen.length === 0) return Number.NaN
  return chosen.filter(predicate).length / chosen.length
}

export function sampleSrs(pop: Population, n: number, rng: SeededRng): number[] {
  const take = clamp(Math.round(n), 0, pop.N)
  const ids = pop.units.map((unit) => unit.id)
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(rng.next() * (ids.length - i))
    const current = ids[i]
    const other = ids[j]
    if (current === undefined || other === undefined) continue
    ids[i] = other
    ids[j] = current
  }
  return ids.slice(0, take).sort((a, b) => a - b)
}

export function groupSizes(pop: Population): Record<string, number> {
  const sizes: Record<string, number> = {}
  for (const unit of pop.units) sizes[unit.group] = (sizes[unit.group] ?? 0) + 1
  return sizes
}

export function clusterSizes(pop: Population): Record<number, number> {
  const sizes: Record<number, number> = {}
  for (const unit of pop.units) sizes[unit.cluster] = (sizes[unit.cluster] ?? 0) + 1
  return sizes
}

export function sampleStratified(
  pop: Population,
  allocation: Record<string, number>,
  rng: SeededRng,
): number[] {
  const byGroup = new Map<string, PopulationUnit[]>()
  for (const unit of pop.units) {
    const list = byGroup.get(unit.group) ?? []
    list.push(unit)
    byGroup.set(unit.group, list)
  }
  const ids: number[] = []
  for (const [group, nH] of Object.entries(allocation)) {
    const members = byGroup.get(group) ?? []
    const fakePop: Population = {
      units: members,
      N: members.length,
      mu: mean(members.map((unit) => unit.value)),
      sigma: sd(members.map((unit) => unit.value)),
      groups: pop.groups,
      clusterCount: pop.clusterCount,
    }
    ids.push(...sampleSrs(fakePop, nH, rng))
  }
  return ids.sort((a, b) => a - b)
}

export function stratifiedEstimate(pop: Population, ids: number[]): { xbarSt: number; weights: Record<string, number>; means: Record<string, number> } {
  const chosen = unitsById(pop, ids)
  const byGroup = new Map<string, number[]>()
  for (const unit of chosen) {
    const list = byGroup.get(unit.group) ?? []
    list.push(unit.value)
    byGroup.set(unit.group, list)
  }
  const sizes = groupSizes(pop)
  const weights: Record<string, number> = {}
  const means: Record<string, number> = {}
  let xbarSt = 0
  for (const group of pop.groups) {
    const Nh = sizes[group.id] ?? 0
    const Wh = pop.N > 0 ? Nh / pop.N : 0
    const values = byGroup.get(group.id) ?? []
    const xh = values.length ? mean(values) : Number.NaN
    weights[group.id] = Wh
    means[group.id] = xh
    if (Number.isFinite(xh)) xbarSt += Wh * xh
  }
  return { xbarSt, weights, means }
}

export function sampleClusters(
  pop: Population,
  clusterIds: number[],
  stage: ClusterStage,
  m: number,
  rng: SeededRng,
): number[] {
  const selected = new Set(clusterIds)
  const ids: number[] = []
  for (const clusterId of selected) {
    const members = pop.units.filter((unit) => unit.cluster === clusterId)
    if (stage === 1) {
      ids.push(...members.map((unit) => unit.id))
      continue
    }
    const fakePop: Population = {
      units: members,
      N: members.length,
      mu: mean(members.map((unit) => unit.value)),
      sigma: sd(members.map((unit) => unit.value)),
      groups: pop.groups,
      clusterCount: pop.clusterCount,
    }
    ids.push(...sampleSrs(fakePop, m, rng))
  }
  return ids.sort((a, b) => a - b)
}

export function pickClusters(pop: Population, c: number, rng: SeededRng): number[] {
  const ids = Array.from({ length: pop.clusterCount }, (_, index) => index + 1)
  const take = clamp(Math.round(c), 0, ids.length)
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(rng.next() * (ids.length - i))
    const current = ids[i]
    const other = ids[j]
    if (current === undefined || other === undefined) continue
    ids[i] = other
    ids[j] = current
  }
  return ids.slice(0, take).sort((a, b) => a - b)
}

export function intraClassCorrelation(pop: Population): number {
  const byCluster = new Map<number, number[]>()
  for (const unit of pop.units) {
    const list = byCluster.get(unit.cluster) ?? []
    list.push(unit.value)
    byCluster.set(unit.cluster, list)
  }
  const clusters = [...byCluster.values()]
  if (clusters.length < 2) return 0
  const grand = pop.mu
  let ssb = 0
  let ssw = 0
  for (const values of clusters) {
    const mh = mean(values)
    ssb += values.length * (mh - grand) ** 2
    ssw += values.reduce((sum, value) => sum + (value - mh) ** 2, 0)
  }
  const dfb = clusters.length - 1
  const dfw = pop.N - clusters.length
  if (dfb <= 0 || dfw <= 0) return 0
  const msb = ssb / dfb
  const msw = ssw / dfw
  const mBar = pop.N / clusters.length
  const rho = (msb - msw) / (msb + (mBar - 1) * msw)
  return clamp(rho, -1, 1)
}

export function sampleSystematic(pop: Population, k: number, start: number): number[] {
  return systematicPositions(pop.N, k, start)
}

export function biasedSample(pop: Population, n: number, mechanism: BiasMechanism, rng: SeededRng): number[] {
  const take = clamp(Math.round(n), 0, pop.N)
  if (mechanism === 'undercoverage') {
    const excluded = pop.groups[pop.groups.length - 1]?.id
    const frame: Population = {
      ...pop,
      units: pop.units.filter((unit) => unit.group !== excluded),
      N: pop.units.filter((unit) => unit.group !== excluded).length,
    }
    frame.N = frame.units.length
    return sampleSrs(frame, Math.min(take, frame.N), rng)
  }
  if (mechanism === 'convenience') {
    const easy = new Set(pop.groups.slice(0, Math.max(1, pop.groups.length - 2)).map((group) => group.id))
    const frame: Population = {
      ...pop,
      units: pop.units.filter((unit) => easy.has(unit.group)),
    }
    frame.N = frame.units.length
    return sampleSrs(frame, Math.min(take, frame.N), rng)
  }
  if (mechanism === 'voluntary') {
    const weights = pop.units.map((unit) => unit.respondP * (1 + Math.abs(unit.value - pop.mu) / Math.max(pop.sigma, 1)))
    return weightedSample(pop.units, weights, take, rng)
  }
  const firstPass = sampleSrs(pop, Math.min(pop.N, Math.max(take * 3, take)), rng)
  const responded = firstPass.filter((id) => {
    const unit = pop.units[id - 1]
    return unit ? rng.next() < unit.respondP : false
  })
  if (responded.length >= take) return responded.slice(0, take).sort((a, b) => a - b)
  const extra = pop.units
    .filter((unit) => !responded.includes(unit.id) && rng.next() < unit.respondP)
    .map((unit) => unit.id)
  return [...responded, ...extra].slice(0, take).sort((a, b) => a - b)
}

function weightedSample(units: PopulationUnit[], weights: number[], n: number, rng: SeededRng): number[] {
  const picked: number[] = []
  const live = units.map((unit, index) => ({ id: unit.id, w: Math.max(weights[index] ?? 0, 0) }))
  const take = Math.min(n, live.length)
  for (let i = 0; i < take; i += 1) {
    const total = live.reduce((sum, item) => sum + item.w, 0)
    if (total <= 0) break
    let cut = rng.next() * total
    let chosen = 0
    for (let j = 0; j < live.length; j += 1) {
      cut -= live[j].w
      if (cut <= 0) {
        chosen = j
        break
      }
    }
    picked.push(live[chosen].id)
    live.splice(chosen, 1)
  }
  return picked.sort((a, b) => a - b)
}

export function groupShares(pop: Population, ids?: number[]): Record<string, number> {
  const units = ids ? unitsById(pop, ids) : pop.units
  const counts: Record<string, number> = {}
  for (const group of pop.groups) counts[group.id] = 0
  for (const unit of units) counts[unit.group] = (counts[unit.group] ?? 0) + 1
  const total = units.length || 1
  const shares: Record<string, number> = {}
  for (const [id, count] of Object.entries(counts)) shares[id] = count / total
  return shares
}

export type RepeatSummary = {
  stats: number[]
  mean: number
  se: number
  bias: number
  mse: number
}

export function repeatStatistic(
  reps: number,
  seed: number,
  draw: (rng: SeededRng) => number,
  truth: number,
): RepeatSummary {
  const rng = new SeededRng(seed)
  const stats: number[] = []
  for (let i = 0; i < reps; i += 1) stats.push(draw(rng))
  const avg = mean(stats)
  const se = sd(stats, 1)
  const bias = avg - truth
  return { stats, mean: avg, se, bias, mse: mse(variance(stats, 1), bias) }
}

export function histogram(values: number[], bins = 16): Array<{ x0: number; x1: number; count: number }> {
  if (values.length === 0) return []
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const width = hi === lo ? 1 : (hi - lo) / bins
  const rows = Array.from({ length: bins }, (_, index) => ({
    x0: lo + index * width,
    x1: lo + (index + 1) * width,
    count: 0,
  }))
  for (const value of values) {
    const idx = hi === lo ? 0 : Math.min(bins - 1, Math.floor((value - lo) / width))
    rows[idx].count += 1
  }
  return rows
}

export function nextSampleSize(n: number, N: number): number {
  return Math.min(N, Math.max(n + 1, Math.round(n * 2)))
}
