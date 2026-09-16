import { pTailChi, pTailF, pTailT, ptukey, qf, qnorm, qt } from '../analysis/engines/frequentist/dists'
import { jacobiEigen } from '../analysis/engines/frequentist/linalg'
import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const ANOVA_STUDIO_SLUG = 'anova'
export const ANOVA_PROGRESS_KEY = 'anveshak-anova-studio'
export const ANOVA_NEXT_STUDIO_SLUG = 'time-series-basics'
export const ANOVA_EPS = 1e-12
export const ANOVA_ALPHA = 0.05

export const ANOVA_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === ANOVA_STUDIO_SLUG) as Studio
export const ANOVA_NEXT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === ANOVA_NEXT_STUDIO_SLUG) as Studio

export type AnovaProgress = { completed: string[] }

export type AnovaObservation = {
  id: string
  y: number
  a: string
  b?: string
  subject?: string
  time?: string
}

export type GroupShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'plus' | 'cross'

export type GroupStyle = {
  key: string
  label: string
  color: string
  shape: GroupShape
}

export const ANOVA_PALETTE: GroupStyle[] = [
  { key: 'A', label: 'Group A', color: '#2563eb', shape: 'circle' },
  { key: 'B', label: 'Group B', color: '#7c3aed', shape: 'square' },
  { key: 'C', label: 'Group C', color: '#16a34a', shape: 'triangle' },
  { key: 'D', label: 'Group D', color: '#db2777', shape: 'diamond' },
  { key: 'E', label: 'Group E', color: '#d97706', shape: 'plus' },
  { key: 'F', label: 'Group F', color: '#0891b2', shape: 'cross' },
]

export type OneWayPresetId =
  | 'equal-means'
  | 'moderate-diffs'
  | 'strong-diffs'
  | 'high-within'
  | 'low-within'
  | 'unequal-n'
  | 'unequal-var'
  | 'teaching-methods'

export type TwoWayPresetId = 'no-interaction' | 'interaction' | 'plant-growth'

export type RmPresetId = 'rm-improvement' | 'rm-crossover' | 'rm-baseline'

export type AnovaPresetId = OneWayPresetId | TwoWayPresetId | RmPresetId

export type GroupSummary = {
  name: string
  n: number
  mean: number
  sd: number
  values: number[]
  ids: string[]
}

export type OneWayResult = {
  n: number
  k: number
  grandMean: number
  groups: GroupSummary[]
  sst: number
  ssb: number
  ssw: number
  dfB: number
  dfW: number
  dfT: number
  msb: number
  msw: number
  f: number
  p: number
  eta2: number
  alpha: number
  fCrit: number
  significant: boolean
}

export type TwoWayCell = {
  a: string
  b: string
  n: number
  mean: number
  values: number[]
}

export type TwoWayTerm = {
  name: string
  ss: number
  df: number
  ms: number
  f: number
  p: number
  eta2: number
  partialEta2: number
}

export type TwoWayResult = {
  n: number
  aLevels: string[]
  bLevels: string[]
  cells: TwoWayCell[]
  marginalA: GroupSummary[]
  marginalB: GroupSummary[]
  balanced: boolean
  ssType: 'balanced' | 'I'
  ssNote: string
  grandMean: number
  sst: number
  terms: TwoWayTerm[]
  error: { ss: number; df: number; ms: number }
  interactionDominates: boolean
}

export type PostHocMethod = 'tukey' | 'holm'
export type PostHocLabel = 'tukey-hsd' | 'tukey-kramer' | 'holm'

export type PostHocPair = {
  a: string
  b: string
  diff: number
  se: number
  t: number
  q: number
  ciLo: number
  ciHi: number
  pRaw: number
  pAdj: number
  significant: boolean
  method: PostHocLabel
}

export type PostHocResult = {
  method: PostHocLabel
  methodTitle: string
  pairs: PostHocPair[]
  k: number
  dfW: number
  msw: number
  alpha: number
}

export type RmSphericity = {
  automatic: boolean
  note: string
  w?: number
  chi?: number
  df?: number
  p?: number
  epsGG?: number
  epsHF?: number
}

export type RmResult = {
  nSubjects: number
  k: number
  dropped: number
  completeCases: boolean
  conditions: string[]
  subjects: Array<{ id: string; values: number[]; mean: number }>
  condMeans: number[]
  grandMean: number
  sst: number
  ssCond: number
  ssSubj: number
  ssErr: number
  dfCond: number
  dfSubj: number
  dfErr: number
  dfT: number
  msCond: number
  msErr: number
  f: number
  p: number
  eta2: number
  partialEta2: number
  sphericity: RmSphericity
}

export type VarianceTest = {
  method: 'levene' | 'brown-forsythe'
  title: string
  f: number
  dfB: number
  dfW: number
  p: number
}

export type ResidualPoint = {
  id: string
  residual: number
  fitted: number
  group: string
  theoretical: number
}

export const ANOVA_HOME_COPY: Record<string, { blurb: string; sidebar: string; tryThis: string }> = {
  'one-way-anova': {
    blurb: 'Compare means across three or more independent groups using a single factor.',
    sidebar: 'One factor, several means',
    tryThis: 'Move the mean-separation slider. F grows when groups pull apart relative to the scatter inside each group.',
  },
  'anova-table': {
    blurb: 'Learn to read and interpret an ANOVA table: sources of variation, degrees of freedom, mean squares, and the F statistic.',
    sidebar: 'SS, df, MS, and F',
    tryThis: 'Click a mean-square cell. MS is SS / df; F is MSB / MSW.',
  },
  'post-hoc-comparisons': {
    blurb: 'A significant ANOVA says at least one mean differs. Post-hoc tests locate which pairs, while controlling the family of comparisons.',
    sidebar: 'Which pairs differ?',
    tryThis: 'Compare raw p-values with the adjusted column. A pair can look different until the family is protected.',
  },
  'two-way-anova': {
    blurb: 'Analyze the effect of two categorical factors and whether their interaction changes the response.',
    sidebar: 'Main effects and A × B',
    tryThis: 'Switch between parallel and crossing interaction plots. Crossing is the picture of an interaction.',
  },
  'repeated-measures-anova': {
    blurb: 'Compare repeated observations from the same subjects across time or conditions.',
    sidebar: 'Same subjects, several times',
    tryThis: 'Toggle subject-centered scores. Between-person baseline drops out; the condition F uses the RM error term.',
  },
  'anova-assumptions': {
    blurb: 'Check normality, homogeneity of variances, and independence so the F test is trustworthy.',
    sidebar: 'Normality, variance, design',
    tryThis: 'Load the unequal-variance preset. Levene / Brown–Forsythe respond; independence still comes from the design, not a histogram.',
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
  const scaled = Number(value.toFixed(digits))
  return Object.is(scaled, -0) ? '0' : String(scaled)
}

export function formatP(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value < 0.001) return '< 0.001'
  return formatNum(value, 3)
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

export function median(values: number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const hi = sorted[mid] ?? Number.NaN
  if (sorted.length % 2 === 1) return hi
  const lo = sorted[mid - 1] ?? Number.NaN
  return (lo + hi) / 2
}

export function quantile(values: number[], p: number): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const idx = clamp(p, 0, 1) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  const a = sorted[lo] ?? Number.NaN
  const b = sorted[hi] ?? Number.NaN
  return a + (b - a) * (idx - lo)
}

export function groupStyle(index: number): GroupStyle {
  return ANOVA_PALETTE[index % ANOVA_PALETTE.length] ?? ANOVA_PALETTE[0]!
}

export function styleForName(name: string, names: string[]): GroupStyle {
  const index = Math.max(0, names.indexOf(name))
  return groupStyle(index)
}

function groupNames(k: number, labels?: string[]): string[] {
  if (labels && labels.length >= k) return labels.slice(0, k)
  return ANOVA_PALETTE.slice(0, k).map((item) => item.label)
}

function summarizeGroup(name: string, rows: AnovaObservation[]): GroupSummary {
  const values = rows.map((row) => row.y)
  return {
    name,
    n: values.length,
    mean: mean(values),
    sd: sampleSd(values),
    values,
    ids: rows.map((row) => row.id),
  }
}

export function oneWayAnova(rows: AnovaObservation[], alpha = ANOVA_ALPHA): OneWayResult {
  const usable = rows.filter((row) => Number.isFinite(row.y) && row.a)
  const names = [...new Set(usable.map((row) => row.a))]
  const groups = names.map((name) => summarizeGroup(name, usable.filter((row) => row.a === name)))
  const values = usable.map((row) => row.y)
  const n = values.length
  const k = groups.length
  const grandMean = mean(values)
  const sst = values.reduce((total, value) => total + (value - grandMean) ** 2, 0)
  const ssb = groups.reduce((total, group) => total + group.n * (group.mean - grandMean) ** 2, 0)
  const ssw = groups.reduce(
    (total, group) => total + group.values.reduce((inner, value) => inner + (value - group.mean) ** 2, 0),
    0,
  )
  const dfB = Math.max(0, k - 1)
  const dfW = Math.max(0, n - k)
  const dfT = Math.max(0, n - 1)
  const msb = dfB > 0 ? ssb / dfB : Number.NaN
  const msw = dfW > 0 ? ssw / dfW : Number.NaN
  const f = msw > 0 ? msb / msw : Number.NaN
  const p = Number.isFinite(f) ? pTailF(f, dfB, dfW) : Number.NaN
  const fCrit = dfB > 0 && dfW > 0 ? qf(1 - alpha, dfB, dfW) : Number.NaN
  return {
    n,
    k,
    grandMean,
    groups,
    sst,
    ssb,
    ssw,
    dfB,
    dfW,
    dfT,
    msb,
    msw,
    f,
    p,
    eta2: sst > 0 ? ssb / sst : Number.NaN,
    alpha,
    fCrit,
    significant: Number.isFinite(p) && p < alpha,
  }
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function isBalanced(cells: TwoWayCell[]): boolean {
  if (cells.length === 0) return false
  const first = cells[0]?.n ?? 0
  return first > 0 && cells.every((cell) => cell.n === first)
}

function dummyLevels(values: string[]): { levels: string[]; X: number[][] } {
  const levels = unique(values)
  const X = values.map((value) => levels.slice(1).map((level) => (value === level ? 1 : 0)))
  return { levels, X }
}

function ones(n: number): number[][] {
  return Array.from({ length: n }, () => [1])
}

function cbind(...blocks: number[][][]): number[][] {
  const n = blocks[0]?.length ?? 0
  return Array.from({ length: n }, (_, i) => blocks.flatMap((block) => block[i] ?? []))
}

function interactColumns(A: number[][], B: number[][]): number[][] {
  return A.map((rowA, i) => {
    const rowB = B[i] ?? []
    const out: number[] = []
    for (const a of rowA) for (const b of rowB) out.push(a * b)
    return out
  })
}

function olsSse(y: number[], X: number[][]): number {
  const n = y.length
  const p = X[0]?.length ?? 0
  const XtX = Array.from({ length: p }, () => Array<number>(p).fill(0))
  const Xty = Array<number>(p).fill(0)
  for (let i = 0; i < n; i++) {
    const row = X[i] ?? []
    const yi = y[i] ?? 0
    for (let a = 0; a < p; a++) {
      Xty[a] += (row[a] ?? 0) * yi
      for (let b = 0; b < p; b++) XtX[a]![b] += (row[a] ?? 0) * (row[b] ?? 0)
    }
  }
  const M = XtX.map((row, i) => [...row, Xty[i] ?? 0])
  for (let col = 0; col < p; col++) {
    let pivot = col
    for (let r = col + 1; r < p; r++) {
      if (Math.abs(M[r]?.[col] ?? 0) > Math.abs(M[pivot]?.[col] ?? 0)) pivot = r
    }
    if (Math.abs(M[pivot]?.[col] ?? 0) < 1e-12) {
      const mu = mean(y)
      return y.reduce((total, value) => total + (value - mu) ** 2, 0)
    }
    const current = M[col]
    const swapped = M[pivot]
    if (!current || !swapped) continue
    M[col] = swapped
    M[pivot] = current
    const div = M[col]?.[col] ?? 1
    for (let j = col; j <= p; j++) {
      const row = M[col]
      if (row) row[j] = (row[j] ?? 0) / div
    }
    for (let r = 0; r < p; r++) {
      if (r === col) continue
      const f = M[r]?.[col] ?? 0
      for (let j = col; j <= p; j++) {
        const row = M[r]
        const src = M[col]
        if (row) row[j] = (row[j] ?? 0) - f * (src?.[j] ?? 0)
      }
    }
  }
  const beta = M.map((row) => row[p] ?? 0)
  let sse = 0
  for (let i = 0; i < n; i++) {
    const fitted = (X[i] ?? []).reduce((total, value, j) => total + value * (beta[j] ?? 0), 0)
    sse += ((y[i] ?? 0) - fitted) ** 2
  }
  return sse
}

export function twoWayAnova(rows: AnovaObservation[], alpha = ANOVA_ALPHA): TwoWayResult {
  const usable = rows.filter((row) => Number.isFinite(row.y) && row.a && row.b)
  const aLevels = unique(usable.map((row) => row.a))
  const bLevels = unique(usable.map((row) => row.b))
  const cells: TwoWayCell[] = []
  for (const a of aLevels) {
    for (const b of bLevels) {
      const values = usable.filter((row) => row.a === a && row.b === b).map((row) => row.y)
      cells.push({ a, b, n: values.length, mean: mean(values), values })
    }
  }
  const y = usable.map((row) => row.y)
  const n = y.length
  const grandMean = mean(y)
  const sst = y.reduce((total, value) => total + (value - grandMean) ** 2, 0)
  const balanced = isBalanced(cells)
  const marginalA = aLevels.map((name) => summarizeGroup(name, usable.filter((row) => row.a === name)))
  const marginalB = bLevels.map((name) => summarizeGroup(name, usable.filter((row) => row.b === name)))

  let ssA: number
  let ssB: number
  let ssAB: number
  let ssE: number
  let ssType: 'balanced' | 'I'
  let ssNote: string

  if (balanced) {
    const nCell = cells[0]?.n ?? 0
    ssA = bLevels.length * nCell * sum(marginalA.map((g) => (g.mean - grandMean) ** 2))
    ssB = aLevels.length * nCell * sum(marginalB.map((g) => (g.mean - grandMean) ** 2))
    ssAB = 0
    for (const cell of cells) {
      const aMean = marginalA.find((g) => g.name === cell.a)?.mean ?? 0
      const bMean = marginalB.find((g) => g.name === cell.b)?.mean ?? 0
      ssAB += cell.n * (cell.mean - aMean - bMean + grandMean) ** 2
    }
    ssE = cells.reduce(
      (total, cell) => total + cell.values.reduce((inner, value) => inner + (value - cell.mean) ** 2, 0),
      0,
    )
    ssType = 'balanced'
    ssNote = 'Balanced factorial: Type I, II, and III sums of squares coincide.'
  } else {
    const A = dummyLevels(usable.map((row) => row.a))
    const B = dummyLevels(usable.map((row) => row.b ?? ''))
    const intercept = ones(n)
    const sse0 = olsSse(y, intercept)
    const sseA = olsSse(y, cbind(intercept, A.X))
    const sseAB = olsSse(y, cbind(intercept, A.X, B.X))
    const sseFull = olsSse(y, cbind(intercept, A.X, B.X, interactColumns(A.X, B.X)))
    ssA = sse0 - sseA
    ssB = sseA - sseAB
    ssAB = sseAB - sseFull
    ssE = sseFull
    ssType = 'I'
    ssNote = 'Unbalanced cells: sequential Type I SS (A, then B, then A × B). Type II/III are not mixed in silently.'
  }

  const dfA = Math.max(0, aLevels.length - 1)
  const dfB = Math.max(0, bLevels.length - 1)
  const dfAB = dfA * dfB
  const dfE = Math.max(0, n - aLevels.length * bLevels.length)
  const makeTerm = (name: string, ss: number, df: number): TwoWayTerm => {
    const ms = df > 0 ? ss / df : Number.NaN
    const f = dfE > 0 && ssE > 0 ? ms / (ssE / dfE) : Number.NaN
    const p = Number.isFinite(f) ? pTailF(f, df, dfE) : Number.NaN
    return {
      name,
      ss,
      df,
      ms,
      f,
      p,
      eta2: sst > 0 ? ss / sst : Number.NaN,
      partialEta2: ss + ssE > 0 ? ss / (ss + ssE) : Number.NaN,
    }
  }
  const terms = [
    makeTerm('Factor A', ssA, dfA),
    makeTerm('Factor B', ssB, dfB),
    makeTerm('A × B', ssAB, dfAB),
  ]
  const interactionTerm = terms[2]
  const mainMax = Math.max(terms[0]?.f ?? 0, terms[1]?.f ?? 0)
  return {
    n,
    aLevels,
    bLevels,
    cells,
    marginalA,
    marginalB,
    balanced,
    ssType,
    ssNote,
    grandMean,
    sst,
    terms,
    error: { ss: ssE, df: dfE, ms: dfE > 0 ? ssE / dfE : Number.NaN },
    interactionDominates: Boolean(
      interactionTerm && Number.isFinite(interactionTerm.f) && interactionTerm.f > mainMax && (interactionTerm.p ?? 1) < alpha,
    ),
  }
}

function holmAdjust(pValues: number[]): number[] {
  const n = pValues.length
  const order = pValues.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value)
  const out = Array<number>(n).fill(1)
  let running = 0
  for (let k = 0; k < n; k++) {
    const item = order[k]
    if (!item) continue
    const adj = Math.min(1, item.value * (n - k))
    running = Math.max(running, adj)
    out[item.i] = running
  }
  return out
}

function qtukey(p: number, k: number, df: number): number {
  if (p <= 0) return 0
  if (p >= 1) return Number.POSITIVE_INFINITY
  let lo = 0
  let hi = 40
  while (ptukey(hi, k, df) < p && hi < 200) hi *= 1.5
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    if (ptukey(mid, k, df) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function postHocComparisons(
  result: OneWayResult,
  method: PostHocMethod = 'tukey',
  alpha = ANOVA_ALPHA,
): PostHocResult {
  const { groups, msw, dfW, k } = result
  const equalN = groups.every((group) => group.n === groups[0]?.n)
  const tukeyOk = Number.isFinite(msw) && dfW > 0 && k >= 2 && Number.isFinite(ptukey(2, k, dfW))
  const useTukey = method === 'tukey' && tukeyOk
  const label: PostHocLabel = useTukey ? (equalN ? 'tukey-hsd' : 'tukey-kramer') : 'holm'
  const methodTitle =
    label === 'tukey-hsd' ? 'Tukey HSD' : label === 'tukey-kramer' ? 'Tukey–Kramer' : 'Pairwise t + Holm'
  const qCrit = useTukey ? qtukey(1 - alpha, k, dfW) : Number.NaN
  const tCrit = dfW > 0 ? qt(1 - alpha / 2, dfW) : Number.NaN
  const rawPairs: Array<Omit<PostHocPair, 'pAdj' | 'significant' | 'method' | 'ciLo' | 'ciHi'> & { ciLo: number; ciHi: number }> = []

  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const g1 = groups[i]
      const g2 = groups[j]
      if (!g1 || !g2) continue
      const se = Math.sqrt(msw * (1 / g1.n + 1 / g2.n))
      const diff = g1.mean - g2.mean
      const t = se === 0 ? 0 : diff / se
      const q = se === 0 ? 0 : Math.abs(diff) / Math.sqrt((msw / 2) * (1 / g1.n + 1 / g2.n))
      const pRaw = pTailT(t, dfW, 'two-sided')
      const half = useTukey ? (qCrit / Math.SQRT2) * se : tCrit * se
      rawPairs.push({ a: g1.name, b: g2.name, diff, se, t, q, pRaw, ciLo: diff - half, ciHi: diff + half })
    }
  }

  const pAdj = useTukey
    ? rawPairs.map((pair) => 1 - ptukey(pair.q, k, dfW))
    : holmAdjust(rawPairs.map((pair) => pair.pRaw))

  const pairs: PostHocPair[] = rawPairs.map((pair, index) => ({
    ...pair,
    pAdj: pAdj[index] ?? 1,
    significant: (pAdj[index] ?? 1) < alpha,
    method: label,
  }))

  return { method: label, methodTitle, pairs, k, dfW, msw, alpha }
}

function helmert(k: number): number[][] {
  const C: number[][] = []
  for (let i = 0; i < k - 1; i++) {
    const row = Array<number>(k).fill(0)
    const w = 1 / Math.sqrt((i + 1) * (i + 2))
    for (let j = 0; j <= i; j++) row[j] = w
    row[i + 1] = -(i + 1) * w
    C.push(row)
  }
  return C
}

function covMatrix(M: number[][]): number[][] {
  const n = M.length
  const p = M[0]?.length ?? 0
  const mu = Array.from({ length: p }, (_, j) => mean(M.map((row) => row[j] ?? 0)))
  const S = Array.from({ length: p }, () => Array<number>(p).fill(0))
  for (const row of M) {
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        S[i]![j] += ((row[i] ?? 0) - (mu[i] ?? 0)) * ((row[j] ?? 0) - (mu[j] ?? 0))
      }
    }
  }
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) S[i]![j] /= n - 1
  return S
}

function mauchlyFromWide(subjects: number[][]): RmSphericity {
  const n = subjects.length
  const k = subjects[0]?.length ?? 0
  if (k <= 2) {
    return { automatic: true, note: 'Two conditions: sphericity holds automatically.' }
  }
  if (n < 3) {
    return { automatic: false, note: 'Mauchly’s test needs at least three complete subjects. Sphericity is not assumed from a plot.' }
  }
  const C = helmert(k)
  const W = subjects.map((y) => C.map((c) => c.reduce((s, cij, j) => s + cij * (y[j] ?? 0), 0)))
  const S = covMatrix(W)
  const pDim = k - 1
  const tr = S.reduce((s, row, i) => s + (row[i] ?? 0), 0)
  const { values } = jacobiEigen(S)
  const tr2 = values.reduce((s, v) => s + v * v, 0)
  const det = values.reduce((prod, v) => prod * v, 1)
  const w = det / (tr / pDim) ** pDim
  const d = 1 - (2 * pDim * pDim + pDim + 2) / (6 * pDim * (n - 1))
  const chi = -(n - 1) * d * Math.log(Math.max(w, 1e-16))
  const df = (pDim * (pDim + 1)) / 2 - 1
  const p = pTailChi(chi, df)
  const epsGG = Math.min(1, Math.max(1 / pDim, (tr * tr) / (pDim * tr2)))
  const hf = (n * pDim * epsGG - 2) / (pDim * (n - 1 - pDim * epsGG))
  const epsHF = Math.min(1, Math.max(epsGG, hf))
  return {
    automatic: false,
    note: `Mauchly W = ${formatNum(w, 3)}, χ²(${df}) = ${formatNum(chi, 2)}, p = ${formatP(p)}. If sphericity is doubtful, Greenhouse–Geisser or Huynh–Feldt adjust the degrees of freedom.`,
    w,
    chi,
    df,
    p,
    epsGG,
    epsHF,
  }
}

export function repeatedMeasuresAnova(rows: AnovaObservation[], alpha = ANOVA_ALPHA): RmResult {
  const usable = rows.filter((row) => Number.isFinite(row.y) && row.subject && (row.time || row.a))
  const conditions = unique(usable.map((row) => row.time ?? row.a))
  const subjectIds = unique(usable.map((row) => row.subject))
  const complete: Array<{ id: string; values: number[]; mean: number }> = []
  let dropped = 0
  for (const id of subjectIds) {
    const values = conditions.map((cond) => {
      const hit = usable.find((row) => row.subject === id && (row.time ?? row.a) === cond)
      return hit?.y
    })
    if (values.every((value): value is number => value !== undefined && Number.isFinite(value))) {
      complete.push({ id, values, mean: mean(values) })
    } else {
      dropped += 1
    }
  }
  const n = complete.length
  const k = conditions.length
  const wide = complete.map((subject) => subject.values)
  const flat = wide.flat()
  const grandMean = mean(flat)
  const condMeans = Array.from({ length: k }, (_, j) => mean(wide.map((row) => row[j] ?? 0)))
  const ssCond = n * sum(condMeans.map((m) => (m - grandMean) ** 2))
  const ssSubj = k * sum(complete.map((subject) => (subject.mean - grandMean) ** 2))
  const sst = flat.reduce((total, value) => total + (value - grandMean) ** 2, 0)
  const ssErr = sst - ssCond - ssSubj
  const dfCond = Math.max(0, k - 1)
  const dfSubj = Math.max(0, n - 1)
  const dfErr = dfCond * dfSubj
  const dfT = Math.max(0, n * k - 1)
  const msCond = dfCond > 0 ? ssCond / dfCond : Number.NaN
  const msErr = dfErr > 0 ? ssErr / dfErr : Number.NaN
  const f = msErr > 0 ? msCond / msErr : Number.NaN
  const p = Number.isFinite(f) ? pTailF(f, dfCond, dfErr) : Number.NaN
  return {
    nSubjects: n,
    k,
    dropped,
    completeCases: dropped === 0,
    conditions,
    subjects: complete,
    condMeans,
    grandMean,
    sst,
    ssCond,
    ssSubj,
    ssErr,
    dfCond,
    dfSubj,
    dfErr,
    dfT,
    msCond,
    msErr,
    f,
    p,
    eta2: sst > 0 ? ssCond / sst : Number.NaN,
    partialEta2: ssCond + ssErr > 0 ? ssCond / (ssCond + ssErr) : Number.NaN,
    sphericity: mauchlyFromWide(wide),
  }
}

export function subjectCentered(rows: AnovaObservation[]): AnovaObservation[] {
  const bySubject = new Map<string, number>()
  for (const row of rows) {
    if (!row.subject) continue
    const peers = rows.filter((item) => item.subject === row.subject).map((item) => item.y)
    bySubject.set(row.subject, mean(peers))
  }
  return rows.map((row) => ({
    ...row,
    y: row.subject ? row.y - (bySubject.get(row.subject) ?? 0) : row.y,
  }))
}

export function varianceTest(rows: AnovaObservation[], method: VarianceTest['method'] = 'brown-forsythe'): VarianceTest {
  const names = unique(rows.map((row) => row.a))
  const transformed: AnovaObservation[] = []
  for (const name of names) {
    const values = rows.filter((row) => row.a === name).map((row) => row.y)
    const center = method === 'levene' ? mean(values) : median(values)
    for (const row of rows.filter((item) => item.a === name)) {
      transformed.push({ ...row, y: Math.abs(row.y - center) })
    }
  }
  const result = oneWayAnova(transformed)
  return {
    method,
    title: method === 'levene' ? 'Levene (means)' : 'Brown–Forsythe (medians)',
    f: result.f,
    dfB: result.dfB,
    dfW: result.dfW,
    p: result.p,
  }
}

export function oneWayResiduals(rows: AnovaObservation[]): ResidualPoint[] {
  const result = oneWayAnova(rows)
  const residuals = rows.map((row) => {
    const group = result.groups.find((item) => item.name === row.a)
    const fitted = group?.mean ?? result.grandMean
    return { id: row.id, residual: row.y - fitted, fitted, group: row.a, theoretical: 0 }
  })
  const ordered = [...residuals].sort((a, b) => a.residual - b.residual)
  const n = ordered.length
  return residuals.map((point) => {
    const rank = ordered.findIndex((item) => item.id === point.id)
    const p = (rank + 0.5) / n
    return { ...point, theoretical: qnorm(p) }
  })
}

export function fPdf(x: number, df1: number, df2: number): number {
  if (x <= 0 || df1 <= 0 || df2 <= 0) return 0
  const a = df1 / 2
  const b = df2 / 2
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const logP =
    a * Math.log(df1) +
    b * Math.log(df2) +
    (a - 1) * Math.log(x) -
    (a + b) * Math.log(df1 * x + df2) -
    logBeta
  return Math.exp(logP)
}

function logGamma(z: number): number {
  const p = [
    676.5203681218903, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905,
    -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  let x = 0.99999999999980993
  const t = z - 1
  for (let i = 0; i < p.length; i++) x += (p[i] ?? 0) / (t + i + 1)
  const s = t + p.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (t + 0.5) * Math.log(s) - s + Math.log(x)
}

export function fCurve(df1: number, df2: number, xmax?: number): Array<{ x: number; y: number }> {
  const hi = xmax ?? Math.max(6, qf(0.995, df1, df2) * 1.15)
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * hi
    points.push({ x, y: fPdf(x, df1, df2) })
  }
  return points
}

export function omnibusReading(result: Pick<OneWayResult, 'p' | 'significant' | 'k' | 'alpha'>): string {
  if (result.significant) {
    return `The omnibus F is significant at α = ${result.alpha}. At least one of the ${result.k} means differs. That is not a claim that every pair differs, and it is not by itself a causal claim.`
  }
  return `The omnibus F is not significant at α = ${result.alpha}. The data are compatible with equal means; they do not prove the means are identical.`
}

export function generateOneWay(options: {
  preset?: OneWayPresetId
  k?: number
  n?: number
  seed?: number
  separation?: number
  withinSd?: number
  labels?: string[]
}): AnovaObservation[] {
  const preset = options.preset ?? 'teaching-methods'
  const k = clamp(options.k ?? (preset === 'unequal-n' ? 3 : 3), 2, 6)
  const n = clamp(options.n ?? 20, 4, 80)
  const rng = new SeededRng(options.seed ?? 17)
  const labels = groupNames(k, options.labels)
  const baseSd = options.withinSd ?? (preset === 'high-within' ? 16 : preset === 'low-within' ? 4 : 8)
  const sep =
    options.separation ??
    (preset === 'equal-means' ? 0 : preset === 'strong-diffs' ? 1 : preset === 'moderate-diffs' ? 0.55 : preset === 'teaching-methods' ? 0.26 : 0.45)
  const center = 28
  const span = 18 * sep
  const means = Array.from({ length: k }, (_, i) => center + (k === 1 ? 0 : (i / (k - 1) - 0.5) * 2 * span))
  const out: AnovaObservation[] = []
  let id = 1
  for (let g = 0; g < k; g++) {
    const name = labels[g] ?? `Group ${g + 1}`
    const ni = preset === 'unequal-n' ? (g === 0 ? Math.max(6, Math.round(n * 0.55)) : g === 1 ? n : Math.max(6, Math.round(n * 1.3))) : n
    const sd = preset === 'unequal-var' ? baseSd * (0.55 + g * 0.55) : baseSd
    for (let i = 0; i < ni; i++) {
      out.push({ id: `obs-${id++}`, y: rng.normal(means[g] ?? center, sd), a: name })
    }
  }
  return out
}

export function generateTwoWay(options: {
  preset?: TwoWayPresetId
  seed?: number
  nPerCell?: number
  unbalanced?: boolean
}): AnovaObservation[] {
  const preset = options.preset ?? 'plant-growth'
  const rng = new SeededRng(options.seed ?? 21)
  const aLevels = ['None', 'Standard', 'Organic']
  const bLevels = ['Low', 'Medium', 'High']
  const nCell = options.nPerCell ?? 4
  const interact = preset === 'no-interaction' ? 0 : 8
  const out: AnovaObservation[] = []
  let id = 1
  for (let i = 0; i < aLevels.length; i++) {
    for (let j = 0; j < bLevels.length; j++) {
      const n = options.unbalanced && i === 0 && j === 0 ? Math.max(2, nCell - 2) : nCell
      const mu = 18 + i * 7 + j * 6 + (i === 2 && j === 2 ? interact : 0) - (i === 0 && j === 2 ? interact * 0.4 : 0)
      for (let r = 0; r < n; r++) {
        out.push({
          id: `tw-${id++}`,
          y: rng.normal(mu, 5.2),
          a: aLevels[i] ?? 'A',
          b: bLevels[j] ?? 'B',
        })
      }
    }
  }
  return out
}

export function generateRepeated(options: {
  preset?: RmPresetId
  seed?: number
  subjects?: number
  conditions?: number
}): AnovaObservation[] {
  const preset = options.preset ?? 'rm-improvement'
  const rng = new SeededRng(options.seed ?? 11)
  const n = clamp(options.subjects ?? 12, 4, 40)
  const k = clamp(options.conditions ?? 4, 2, 6)
  const labels = Array.from({ length: k }, (_, i) => `T${i + 1}`)
  const out: AnovaObservation[] = []
  for (let s = 0; s < n; s++) {
    const baseline = rng.normal(preset === 'rm-baseline' ? 40 + s * 1.8 : 52, preset === 'rm-baseline' ? 10 : 6)
    for (let t = 0; t < k; t++) {
      let mu = baseline
      if (preset === 'rm-improvement') mu = baseline + t * 6
      if (preset === 'rm-crossover') mu = baseline + (t % 2 === 0 ? -5 : 8)
      if (preset === 'rm-baseline') mu = baseline + t * 0.8
      out.push({
        id: `rm-${s + 1}-${t + 1}`,
        y: rng.normal(mu, 4.2),
        a: labels[t] ?? `T${t + 1}`,
        subject: `S${s + 1}`,
        time: labels[t] ?? `T${t + 1}`,
      })
    }
  }
  return out
}

export function boxStats(values: number[]): { min: number; q1: number; median: number; q3: number; max: number; fences: [number, number]; outliers: number[] } {
  const q1 = quantile(values, 0.25)
  const q3 = quantile(values, 0.75)
  const iqr = q3 - q1
  const lo = q1 - 1.5 * iqr
  const hi = q3 + 1.5 * iqr
  const inside = values.filter((value) => value >= lo && value <= hi)
  return {
    min: inside.length ? Math.min(...inside) : Math.min(...values),
    q1,
    median: median(values),
    q3,
    max: inside.length ? Math.max(...inside) : Math.max(...values),
    fences: [lo, hi],
    outliers: values.filter((value) => value < lo || value > hi),
  }
}

export function simpleEffectsA(rows: AnovaObservation[]): Array<{ b: string; result: OneWayResult }> {
  const bLevels = unique(rows.map((row) => row.b))
  return bLevels.map((b) => ({
    b,
    result: oneWayAnova(rows.filter((row) => row.b === b).map((row) => ({ ...row, a: row.a }))),
  }))
}

export function loadAnovaProgress(): AnovaProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(ANOVA_PROGRESS_KEY) ?? '{}') as Partial<AnovaProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveAnovaProgress(progress: AnovaProgress): void {
  localStorage.setItem(ANOVA_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markAnovaLabComplete(labSlug: string): AnovaProgress {
  const next = loadAnovaProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveAnovaProgress(next)
  return next
}

export function anovaStudioPath(): string {
  return studioPath(ANOVA_STUDIO)
}

export function anovaLabPath(labSlug: string): string {
  return labPath(ANOVA_STUDIO_SLUG, labSlug)
}

export function anovaNextStudioPath(): string {
  return studioPath(ANOVA_NEXT_STUDIO)
}

export function nextIncompleteAnovaLab(completed: string[]): StudioLab {
  return ANOVA_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? ANOVA_STUDIO.labs[0]!
}

export const WORKED_ONE_WAY: AnovaObservation[] = [
  ...[18, 22, 26, 20, 28, 16, 24, 30, 19, 27].map((y, i) => ({ id: `w-a-${i + 1}`, y, a: 'Method A' })),
  ...[24, 28, 32, 22, 34, 26, 30, 20, 36, 29].map((y, i) => ({ id: `w-b-${i + 1}`, y, a: 'Method B' })),
  ...[28, 34, 30, 38, 26, 36, 32, 24, 40, 33].map((y, i) => ({ id: `w-c-${i + 1}`, y, a: 'Method C' })),
]
