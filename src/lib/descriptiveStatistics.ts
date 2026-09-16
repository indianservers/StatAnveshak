import {
  iqrOutliers,
  mean as numericMean,
  median as numericMedian,
  modes as numericModes,
  quantileType7,
  sampleSd,
  sampleSkewness,
  sampleVariance,
} from '../analysis/engines/frequentist/numeric'
import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const DS_STUDIO_SLUG = 'descriptive-statistics'
export const DS_PROGRESS_KEY = 'anveshak-descriptive-statistics'
export const DS_DATA_KEY = 'anveshak-descriptive-statistics-data'
export const QUANTILE_METHOD = 'R type-7'

export type DsTab = 'learn' | 'explore' | 'practice' | 'quiz'
export type DsProgress = { completed: string[] }
export type VarianceMode = 'sample' | 'population'
export type ModeInfo = { values: number[]; frequency: number }

export const DS_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === DS_STUDIO_SLUG) as Studio

export const DEFAULT_DATASET = [4, 6, 7, 8, 8, 9, 11, 13, 15, 22]
export const CENTER_DEFAULT = [4, 6, 6, 7, 8, 8, 9, 10, 10, 10]
export const SPREAD_DEFAULT = [2, 4, 7, 8, 10]
export const FIVE_NUMBER_DEFAULT = [12, 15, 17, 18, 20, 22, 22, 24, 24, 26, 26, 31, 32, 35, 37, 40, 42, 45]
export const BOX_DEFAULT = [58, 62, 65, 68, 72, 75, 78, 80, 82, 85, 85, 88, 90, 92, 120]
export const FREQ_DEFAULT = [1, 2, 2, 2, 3, 3, 4, 3, 2, 1, 4, 2, 2]
export const ECDF_DEFAULT = [12, 15, 17, 19, 20, 22, 24, 25, 28, 31, 32, 33, 36, 37, 40, 42, 44, 46, 48, 50]
export const WORKED_CENTER = [2, 4, 4, 7, 9, 9, 12]
export const WORKED_SPREAD = [3, 6, 8, 10, 13]
export const WORKED_FIVE = [5, 8, 9, 12, 14, 15, 18, 21, 22, 28]
export const WORKED_BOX = [12, 14, 16, 18, 20, 22, 24, 24, 26, 28, 30, 32, 34, 36, 80]
export const PRACTICE_CENTER = [3, 5, 6, 8, 11]
export const PRACTICE_FIVE = [3, 6, 8, 10, 12, 14, 16, 20, 24, 27]
export const PRACTICE_BOX = [4, 7, 8, 10, 11, 12, 13, 14, 40]
export const PRACTICE_FREQ = [6, 7, 6, 7, 6, 8, 9, 7, 6, 6]
export const PRACTICE_ECDF = [8, 12, 15, 18, 22, 25, 28, 30, 32, 40, 40, 45]
export const FREQ_SIBLINGS = [2, 1, 3, 2, 0, 1, 2, 1, 3, 2, 4, 1]

/** Roughly bell-shaped scores tuned so type-7 Q1≈59, median=72, Q3≈85, P80≈88. */
export const TEST_SCORES_30 = [
  45, 48, 50, 52, 54, 56, 57, 58, 62, 64, 66, 68, 70, 71, 72, 72, 73, 74, 76, 78, 80, 82, 86, 87, 92, 93, 94, 95, 96, 98,
]

export type DsPresetId =
  | 'shared'
  | 'center'
  | 'symmetric'
  | 'rightSkew'
  | 'leftSkew'
  | 'outliers'
  | 'lowSpread'
  | 'highSpread'
  | 'bimodal'
  | 'repeats'
  | 'exam'
  | 'scores30'
  | 'five'
  | 'ecdf'

export const DS_PRESETS: Record<DsPresetId, { label: string; values: number[] }> = {
  shared: { label: 'Shared workspace', values: DEFAULT_DATASET },
  center: { label: 'Test scores', values: CENTER_DEFAULT },
  symmetric: { label: 'Symmetric', values: [4, 6, 7, 8, 8, 9, 10, 11, 12] },
  rightSkew: { label: 'Positively skewed', values: [2, 3, 3, 4, 4, 5, 6, 8, 12, 18] },
  leftSkew: { label: 'Negatively skewed', values: [2, 8, 12, 14, 15, 16, 16, 17, 17, 18] },
  outliers: { label: 'With outliers', values: BOX_DEFAULT },
  lowSpread: { label: 'Low spread', values: [8, 8, 9, 9, 9, 10, 10, 11] },
  highSpread: { label: 'High spread', values: [1, 4, 8, 12, 16, 20, 24, 30] },
  bimodal: { label: 'Bimodal', values: [2, 3, 3, 4, 4, 12, 13, 13, 14, 15] },
  repeats: { label: 'Repeated values', values: [1, 2, 2, 2, 3, 3, 4] },
  exam: { label: 'Exam scores', values: BOX_DEFAULT },
  scores30: { label: 'Class test scores', values: TEST_SCORES_30 },
  five: { label: 'Eighteen scores', values: FIVE_NUMBER_DEFAULT },
  ecdf: { label: 'Twenty scores', values: ECDF_DEFAULT },
}

export const DS_HOME_COPY: Record<string, { blurb: string; tryThis: string; chips: string[] }> = {
  'measures-of-center': {
    blurb: 'Compare mean, median, and mode on a live number line and see when they disagree.',
    tryThis: 'Add one extreme value. Watch the mean jump while the median barely moves.',
    chips: ['Mean', 'Median', 'Mode', 'Robustness'],
  },
  'measures-of-spread': {
    blurb: 'Quantify variability with range, IQR, variance, and standard deviation.',
    tryThis: 'Keep the center fixed and drag points farther out. Watch variance grow faster than the range.',
    chips: ['Range', 'IQR', 'Variance', 'Standard deviation'],
  },
  'position-measures': {
    blurb: 'Locate a single observation with ranks, percentiles, quartiles, and z-scores.',
    tryThis: 'Slide to the 80th percentile and read the interpolated value on the sorted scores.',
    chips: ['Percentiles', 'Quartiles', 'Rank', 'z-score'],
  },
  'five-number-summary': {
    blurb: 'Compress a distribution into min, Q1, median, Q3, and max.',
    tryThis: 'Sort, split, and watch every hinge update as you edit the data.',
    chips: ['Minimum', 'Q1', 'Median', 'Q3', 'Maximum'],
  },
  'data-visualization-basics': {
    blurb: 'Choose the chart that matches the variable type and the question.',
    tryThis: 'Switch from a bar chart to a pie, then try a scatter plot on categorical counts.',
    chips: ['Bar chart', 'Histogram', 'Scatter', 'Chart choice'],
  },
  'distribution-shape': {
    blurb: 'Read symmetry, modality, and tail weight straight off the picture.',
    tryThis: 'Flip from left-skewed to right-skewed and watch mean, median, and mode separate.',
    chips: ['Skewness', 'Modality', 'Tails', 'Clusters'],
  },
  'box-plot-outliers': {
    blurb: 'Build the box, set Tukey fences, and decide which points stand apart.',
    tryThis: 'Add 120 to a tight exam set and watch the mean and range jump while IQR holds.',
    chips: ['Box plot', 'IQR', 'Fences', 'Outliers'],
  },
  'frequency-tables': {
    blurb: 'Count values, then convert those counts into relative and cumulative shares.',
    tryThis: 'Change class width and watch the histogram, polygon, and table update together.',
    chips: ['Frequency', 'Relative frequency', 'Cumulative frequency'],
  },
  'ecdf-stem-and-leaf': {
    blurb: 'Read percentiles from the empirical CDF and keep the raw digits in a stem-and-leaf.',
    tryThis: 'Click a stem row, then move the ECDF marker to the same value.',
    chips: ['ECDF', 'Stem-and-leaf', 'Percentiles'],
  },
}

export function loadDsProgress(): DsProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(DS_PROGRESS_KEY) ?? '{}') as Partial<DsProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function saveDsProgress(progress: DsProgress): void {
  localStorage.setItem(DS_PROGRESS_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markDsLabComplete(labSlug: string): DsProgress {
  const next = loadDsProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  saveDsProgress(next)
  return next
}

export function loadSharedData(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DS_DATA_KEY) ?? 'null') as unknown
    if (Array.isArray(raw) && raw.every((value) => typeof value === 'number' && Number.isFinite(value))) {
      return raw
    }
  } catch {
    /* keep default */
  }
  return [...DEFAULT_DATASET]
}

export function saveSharedData(values: number[]): void {
  localStorage.setItem(DS_DATA_KEY, JSON.stringify(values))
}

export function dsStudioPath(): string {
  return studioPath(DS_STUDIO)
}

export function dsLabPath(labSlug: string): string {
  return labPath(DS_STUDIO_SLUG, labSlug)
}

export function nextIncompleteDsLab(completed: string[]): StudioLab {
  return DS_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? DS_STUDIO.labs[0]
}

export function formatNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(digits)).toString()
}

export function formatList(values: number[], digits = 2): string {
  return values.map((value) => formatNum(value, digits)).join(', ')
}

export function parseNumbers(input: string): { values: number[]; invalid: string[] } {
  const tokens = input.split(/[\s,;|]+/).map((token) => token.trim()).filter(Boolean)
  const values: number[] = []
  const invalid: string[] = []
  for (const token of tokens) {
    const parsed = Number(token)
    if (Number.isFinite(parsed)) values.push(parsed)
    else invalid.push(token)
  }
  return { values, invalid }
}

export function sortedCopy(values: number[]): number[] {
  return [...values].sort((a, b) => a - b)
}

export function quantile(values: number[], p: number): number {
  if (values.length === 0) return Number.NaN
  return quantileType7(sortedCopy(values), p)
}

export function percentile(values: number[], p: number): number {
  return quantile(values, p / 100)
}

export function percentileRank(values: number[], x: number): number {
  if (values.length === 0) return Number.NaN
  const count = values.filter((value) => value <= x).length
  return (100 * count) / values.length
}

export function rankOf(values: number[], x: number): { first: number; last: number; average: number } {
  const sorted = sortedCopy(values)
  const first = sorted.findIndex((value) => value === x)
  if (first < 0) return { first: Number.NaN, last: Number.NaN, average: Number.NaN }
  let last = first
  while (last + 1 < sorted.length && sorted[last + 1] === x) last += 1
  return { first: first + 1, last: last + 1, average: (first + 1 + last + 1) / 2 }
}

export function zScore(x: number, values: number[]): number {
  if (values.length < 2) return Number.NaN
  const sd = sampleSd(values)
  if (!sd) return 0
  return (x - numericMean(values)) / sd
}

export function populationVariance(values: number[]): number {
  if (values.length === 0) return Number.NaN
  const m = numericMean(values)
  return values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length
}

export function populationSd(values: number[]): number {
  return Math.sqrt(populationVariance(values))
}

export function meanAbsoluteDeviation(values: number[]): number {
  if (values.length === 0) return Number.NaN
  const m = numericMean(values)
  return values.reduce((sum, value) => sum + Math.abs(value - m), 0) / values.length
}

export function weightedMean(pairs: Array<{ x: number; w: number }>): number {
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.w, 0)
  if (!totalWeight) return Number.NaN
  return pairs.reduce((sum, pair) => sum + pair.x * pair.w, 0) / totalWeight
}

export function trimmedMean(values: number[], trimFrac: number): number {
  const n = values.length
  const k = Math.floor(n * trimFrac)
  if (n - 2 * k < 1) return Number.NaN
  return numericMean(sortedCopy(values).slice(k, n - k))
}

export type FiveNumber = {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  iqr: number
}

export function fiveNumber(values: number[]): FiveNumber {
  const sorted = sortedCopy(values)
  const min = sorted[0] ?? Number.NaN
  const max = sorted[sorted.length - 1] ?? Number.NaN
  const q1 = quantileType7(sorted, 0.25)
  const med = quantileType7(sorted, 0.5)
  const q3 = quantileType7(sorted, 0.75)
  return { min, q1, median: med, q3, max, iqr: q3 - q1 }
}

export type TukeyBox = FiveNumber & {
  lowerFence: number
  upperFence: number
  outliers: number[]
  lowerWhisker: number
  upperWhisker: number
}

export function tukeyBox(values: number[]): TukeyBox {
  const summary = fiveNumber(values)
  const sorted = sortedCopy(values)
  const fences = iqrOutliers(sorted)
  const inliers = sorted.filter((value) => value >= fences.lower && value <= fences.upper)
  return {
    ...summary,
    lowerFence: fences.lower,
    upperFence: fences.upper,
    outliers: fences.outliers,
    lowerWhisker: inliers[0] ?? summary.min,
    upperWhisker: inliers[inliers.length - 1] ?? summary.max,
  }
}

export type DescriptiveSummary = {
  n: number
  sum: number
  mean: number
  median: number
  modes: ModeInfo
  min: number
  max: number
  range: number
  q1: number
  q3: number
  iqr: number
  sampleVar: number
  sampleSd: number
  popVar: number
  popSd: number
  mad: number
  skewness: number
  box: TukeyBox
}

export function summarize(values: number[]): DescriptiveSummary {
  const n = values.length
  const emptyModes: ModeInfo = { values: [], frequency: 0 }
  if (n === 0) {
    return {
      n: 0,
      sum: 0,
      mean: Number.NaN,
      median: Number.NaN,
      modes: emptyModes,
      min: Number.NaN,
      max: Number.NaN,
      range: Number.NaN,
      q1: Number.NaN,
      q3: Number.NaN,
      iqr: Number.NaN,
      sampleVar: Number.NaN,
      sampleSd: Number.NaN,
      popVar: Number.NaN,
      popSd: Number.NaN,
      mad: Number.NaN,
      skewness: Number.NaN,
      box: {
        min: Number.NaN,
        q1: Number.NaN,
        median: Number.NaN,
        q3: Number.NaN,
        max: Number.NaN,
        iqr: Number.NaN,
        lowerFence: Number.NaN,
        upperFence: Number.NaN,
        outliers: [],
        lowerWhisker: Number.NaN,
        upperWhisker: Number.NaN,
      },
    }
  }
  const box = tukeyBox(values)
  return {
    n,
    sum: values.reduce((total, value) => total + value, 0),
    mean: numericMean(values),
    median: numericMedian(values),
    modes: numericModes(values),
    min: box.min,
    max: box.max,
    range: box.max - box.min,
    q1: box.q1,
    q3: box.q3,
    iqr: box.iqr,
    sampleVar: sampleVariance(values),
    sampleSd: sampleSd(values),
    popVar: populationVariance(values),
    popSd: populationSd(values),
    mad: meanAbsoluteDeviation(values),
    skewness: sampleSkewness(values),
    box,
  }
}

export function formatModes(info: ModeInfo): string {
  if (info.values.length === 0) return '—'
  if (info.frequency <= 1) return 'none (all unique)'
  return info.values.map((value) => formatNum(value)).join(', ')
}

export function ecdfAt(values: number[], x: number): { count: number; n: number; value: number } {
  const n = values.length
  const count = values.filter((value) => value <= x).length
  return { count, n, value: n ? count / n : Number.NaN }
}

export type EcdfStep = { x: number; y0: number; y1: number; count: number }

export function ecdfSteps(values: number[]): EcdfStep[] {
  const sorted = sortedCopy(values)
  const n = sorted.length
  const steps: EcdfStep[] = []
  let i = 0
  while (i < n) {
    const x = sorted[i]
    let j = i
    while (j < n && sorted[j] === x) j += 1
    steps.push({ x, y0: i / n, y1: j / n, count: j })
    i = j
  }
  return steps
}

export type StemLeafRow = { stem: number; leaves: number[]; values: number[] }

export function stemLeaf(values: number[], stemUnit = 10): StemLeafRow[] {
  const rows = new Map<number, { leaves: number[]; values: number[] }>()
  for (const value of values) {
    const stem = Math.trunc(value / stemUnit)
    const leaf = Math.abs(Math.round(value - stem * stemUnit))
    const row = rows.get(stem) ?? { leaves: [], values: [] }
    row.leaves.push(leaf)
    row.values.push(value)
    rows.set(stem, row)
  }
  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([stem, row]) => ({
      stem,
      leaves: [...row.leaves].sort((a, b) => a - b),
      values: [...row.values].sort((a, b) => a - b),
    }))
}

export type FrequencyRow = {
  value: number
  tally: string
  frequency: number
  relative: number
  cumulative: number
  cumulativeRelative: number
}

export function tallyMarks(count: number): string {
  const fives = Math.floor(count / 5)
  const rest = count % 5
  return `${'卌 '.repeat(fives)}${'|'.repeat(rest)}`.trim()
}

export function ungroupedFrequency(values: number[]): FrequencyRow[] {
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  const keys = [...counts.keys()].sort((a, b) => a - b)
  let running = 0
  const n = values.length
  return keys.map((value) => {
    const frequency = counts.get(value) ?? 0
    running += frequency
    return {
      value,
      tally: tallyMarks(frequency),
      frequency,
      relative: n ? frequency / n : 0,
      cumulative: running,
      cumulativeRelative: n ? running / n : 0,
    }
  })
}

export type ClassRow = {
  start: number
  end: number
  label: string
  frequency: number
  relative: number
  cumulative: number
  cumulativeRelative: number
  midpoint: number
}

export function groupedFrequency(values: number[], bins: number, start?: number, width?: number): ClassRow[] {
  if (values.length === 0 || bins < 1) return []
  const sorted = sortedCopy(values)
  const min = start ?? sorted[0]
  const span = (sorted[sorted.length - 1] - min) || 1
  const classWidth = width && width > 0 ? width : span / bins
  const rows: ClassRow[] = []
  let running = 0
  for (let i = 0; i < bins; i += 1) {
    const lo = min + i * classWidth
    const hi = lo + classWidth
    const last = i === bins - 1
    const frequency = values.filter((value) => (last ? value >= lo && value <= hi : value >= lo && value < hi)).length
    running += frequency
    rows.push({
      start: lo,
      end: hi,
      label: `${formatNum(lo)}–${formatNum(hi)}`,
      frequency,
      relative: frequency / values.length,
      cumulative: running,
      cumulativeRelative: running / values.length,
      midpoint: (lo + hi) / 2,
    })
  }
  return rows
}

export type HistBin = { start: number; end: number; mid: number; count: number }

export function histogramBins(values: number[], bins?: number): HistBin[] {
  if (values.length === 0) return []
  const k = bins ?? Math.max(5, Math.ceil(Math.log2(values.length) + 1))
  return groupedFrequency(values, k).map((row) => ({
    start: row.start,
    end: row.end,
    mid: row.midpoint,
    count: row.frequency,
  }))
}

export function randomSample(n: number, min: number, max: number): number[] {
  const values: number[] = []
  for (let i = 0; i < n; i += 1) {
    values.push(Math.round((min + Math.random() * (max - min)) * 10) / 10)
  }
  return values
}

export function shapeSample(kind: 'symmetric' | 'left' | 'right' | 'bimodal' | 'multimodal' | 'uniform', n = 80): number[] {
  const draw = () => Math.random()
  const normal = () => {
    const u = Math.max(1e-9, draw())
    const v = Math.max(1e-9, draw())
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const values: number[] = []
  for (let i = 0; i < n; i += 1) {
    if (kind === 'symmetric') values.push(50 + 12 * normal())
    else if (kind === 'right') values.push(8 + 18 * (-Math.log(Math.max(1e-9, draw()))))
    else if (kind === 'left') values.push(92 - 18 * (-Math.log(Math.max(1e-9, draw()))))
    else if (kind === 'bimodal') values.push((draw() < 0.5 ? 28 : 72) + 7 * normal())
    else if (kind === 'multimodal') values.push((draw() < 0.34 ? 18 : draw() < 0.67 ? 50 : 82) + 5 * normal())
    else values.push(10 + draw() * 80)
  }
  return values.map((value) => Math.round(value * 10) / 10)
}

export const FAVORITE_SUBJECTS: Array<{ label: string; count: number; color: string }> = [
  { label: 'Math', count: 22, color: '#2563eb' },
  { label: 'Science', count: 28, color: '#22c55e' },
  { label: 'English', count: 18, color: '#f59e0b' },
  { label: 'History', count: 12, color: '#a855f7' },
  { label: 'Art', count: 20, color: '#f43f5e' },
]

export const HOUSEHOLD_SPEND: Array<{ label: string; count: number; color: string }> = [
  { label: 'Housing', count: 35, color: '#2563eb' },
  { label: 'Food', count: 22, color: '#22c55e' },
  { label: 'Transport', count: 15, color: '#f59e0b' },
  { label: 'Education', count: 18, color: '#a855f7' },
  { label: 'Other', count: 10, color: '#94a3b8' },
]

export const PAIRED_HOURS_SCORES: Array<{ x: number; y: number }> = [
  { x: 1, y: 52 },
  { x: 2, y: 58 },
  { x: 3, y: 61 },
  { x: 4, y: 70 },
  { x: 5, y: 74 },
  { x: 6, y: 81 },
  { x: 7, y: 84 },
  { x: 8, y: 91 },
]

export const TIME_SERIES: Array<{ label: string; value: number }> = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 15 },
  { label: 'Thu', value: 22 },
  { label: 'Fri', value: 28 },
  { label: 'Sat', value: 20 },
  { label: 'Sun', value: 14 },
]
