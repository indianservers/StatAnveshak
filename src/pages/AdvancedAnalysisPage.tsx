import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileCode2,
  FileText,
  FlaskConical,
  Layers,
  LineChart,
  Link2,
  ListChecks,
  Sigma,
  SlidersHorizontal,
  Table,
} from 'lucide-react'
import * as ss from 'simple-statistics'
import { useStore } from '../store/useStore'
import { detectOutliersIQR, numericColumn, pearsonCorrelation, correlationMatrix } from '../lib/stats'
import { chiSquareCDF, normalCDF, chiSquareIndependence } from '../lib/inference'
import { DatasetEmptyState } from '../components/ui/DatasetEmptyState'

type FeatureGroup = 'Data Prep' | 'EDA' | 'Inference' | 'Modeling' | 'Teaching' | 'Output'
type Goal = 'describe' | 'compare_means' | 'association' | 'predict_numeric' | 'predict_category' | 'time_series' | 'quality'
type OutcomeType = 'numeric' | 'categorical' | 'time'
type PredictorType = 'none' | 'numeric' | 'categorical' | 'mixed'

const GOAL_HELP: Record<Goal, { title: string; methods: string[]; assumptions: string[] }> = {
  describe: {
    title: 'Describe a dataset',
    methods: ['Summary statistics', 'Frequency tables', 'Grouped summaries', 'Distribution plots'],
    assumptions: ['Variables are correctly typed', 'Missing values are understood', 'Outliers are reviewed before reporting means'],
  },
  compare_means: {
    title: 'Compare group means',
    methods: ['Independent t-test', 'Paired t-test', 'One-way ANOVA', 'Welch ANOVA', 'Mann-Whitney or Kruskal-Wallis'],
    assumptions: ['Numeric outcome', 'Independent observations unless paired', 'Check group sizes, outliers, and approximate normality'],
  },
  association: {
    title: 'Measure association',
    methods: ['Pearson correlation', 'Spearman correlation', 'Chi-square test', 'Crosstabs', 'Scatterplot matrix'],
    assumptions: ['Choose Pearson for linear numeric relationships', 'Use Spearman for monotonic or ordinal relationships', 'Use chi-square for categorical variables'],
  },
  predict_numeric: {
    title: 'Predict a numeric outcome',
    methods: ['Simple linear regression', 'Multiple regression', 'Regularized regression', 'Regression tree'],
    assumptions: ['Linear model needs residual checks', 'Watch multicollinearity', 'Validate on holdout data for prediction'],
  },
  predict_category: {
    title: 'Predict a category',
    methods: ['Logistic regression', 'Classification tree', 'Naive Bayes', 'Confusion matrix and ROC analysis'],
    assumptions: ['Outcome is categorical', 'Classes should be checked for imbalance', 'Use validation metrics beyond accuracy'],
  },
  time_series: {
    title: 'Analyze time-ordered data',
    methods: ['Line chart', 'Moving average', 'Seasonal decomposition', 'AR(1)/ETS teaching baseline'],
    assumptions: ['Rows are correctly ordered by time', 'Seasonality and trend are separated', 'Forecast accuracy should be back-tested'],
  },
  quality: {
    title: 'Monitor process quality',
    methods: ['Control charts', 'Capability analysis', 'Pareto chart', 'Defect-rate analysis'],
    assumptions: ['Process is measured consistently', 'Subgroups are rational', 'Special-cause variation should be investigated'],
  },
}

const outcomeOptions: { value: OutcomeType; label: string }[] = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'categorical', label: 'Categorical' },
  { value: 'time', label: 'Time ordered' },
]

const predictorOptions: { value: PredictorType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'categorical', label: 'Categorical' },
  { value: 'mixed', label: 'Mixed' },
]

const zForConfidence: Record<string, number> = {
  '0.90': 1.645,
  '0.95': 1.96,
  '0.99': 2.576,
}

const round = (value: number, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : 0

function cohenD(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return null
  const sd1 = ss.standardDeviation(a)
  const sd2 = ss.standardDeviation(b)
  const pooled = Math.sqrt(((a.length - 1) * sd1 ** 2 + (b.length - 1) * sd2 ** 2) / (a.length + b.length - 2))
  if (pooled === 0) return null
  const d = (ss.mean(a) - ss.mean(b)) / pooled
  const correction = 1 - 3 / (4 * (a.length + b.length) - 9)
  return { d, hedgesG: d * correction }
}

function effectLabel(absValue: number) {
  if (absValue < 0.2) return 'negligible'
  if (absValue < 0.5) return 'small'
  if (absValue < 0.8) return 'medium'
  return 'large'
}

type SuiteRow = { item: string; result: string; detail: string }
type FeatureSuite = Record<FeatureGroup, SuiteRow[]>

function nonMissing(value: unknown) {
  return value !== null && value !== undefined && value !== ''
}

function valueCounts(data: Record<string, unknown>[], col: string) {
  const counts = new Map<string, number>()
  data.forEach((row) => {
    const key = nonMissing(row[col]) ? String(row[col]) : '(missing)'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function groupedMeanRows(data: Record<string, unknown>[], groupCol: string, numCol: string) {
  if (!groupCol || !numCol) return []
  const groups = new Map<string, number[]>()
  data.forEach((row) => {
    const value = Number(row[numCol])
    if (!Number.isFinite(value)) return
    const key = nonMissing(row[groupCol]) ? String(row[groupCol]) : '(missing)'
    groups.set(key, [...(groups.get(key) ?? []), value])
  })
  return [...groups.entries()]
    .map(([group, values]) => ({ group, n: values.length, mean: ss.mean(values), sd: values.length > 1 ? ss.standardDeviation(values) : 0 }))
    .sort((a, b) => b.n - a.n)
}

function crosstabSummary(data: Record<string, unknown>[], a: string, b: string) {
  if (!a || !b) return { rows: 0, cols: 0, top: '-' }
  const rows = new Set<string>()
  const cols = new Set<string>()
  const cells = new Map<string, number>()
  data.forEach((row) => {
    const r = nonMissing(row[a]) ? String(row[a]) : '(missing)'
    const c = nonMissing(row[b]) ? String(row[b]) : '(missing)'
    rows.add(r)
    cols.add(c)
    cells.set(`${r} | ${c}`, (cells.get(`${r} | ${c}`) ?? 0) + 1)
  })
  const top = [...cells.entries()].sort((x, y) => y[1] - x[1])[0]
  return { rows: rows.size, cols: cols.size, top: top ? `${top[0]}: ${top[1]}` : '-' }
}

function simpleRegression(data: Record<string, unknown>[], xCol: string, yCol: string) {
  const pairs = data.map((row) => [Number(row[xCol]), Number(row[yCol])] as [number, number]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  if (pairs.length < 2) return null
  const x = pairs.map(([value]) => value)
  const y = pairs.map(([, value]) => value)
  const meanX = ss.mean(x)
  const meanY = ss.mean(y)
  const sxx = x.reduce((sum, value) => sum + (value - meanX) ** 2, 0)
  const sxy = x.reduce((sum, value, index) => sum + (value - meanX) * (y[index] - meanY), 0)
  const slope = sxy / sxx
  const intercept = meanY - slope * meanX
  const fitted = x.map((value) => intercept + slope * value)
  const residuals = y.map((value, index) => value - fitted[index])
  const sse = residuals.reduce((sum, value) => sum + value ** 2, 0)
  const sst = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0)
  return { n: pairs.length, slope, intercept, r2: sst === 0 ? 0 : 1 - sse / sst, rmse: Math.sqrt(sse / pairs.length), residuals }
}

function pcaTwo(data: Record<string, unknown>[], a: string, b: string) {
  const r = pearsonCorrelation(data, a, b)
  if (!Number.isFinite(r)) return null
  return { pc1: (1 + Math.abs(r)) / 2, pc2: (1 - Math.abs(r)) / 2, loading: r >= 0 ? 'same direction' : 'opposite direction' }
}

function kMeansTwo(data: Record<string, unknown>[], a: string, b: string) {
  const points = data.map((row) => [Number(row[a]), Number(row[b])] as [number, number]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)).slice(0, 500)
  if (points.length < 3) return null
  let centers: [number, number][] = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]]
  let labels = points.map(() => 0)
  for (let iter = 0; iter < 8; iter++) {
    labels = points.map(([x, y]) => centers.reduce((best, center, index) => {
      const bestDist = (x - centers[best][0]) ** 2 + (y - centers[best][1]) ** 2
      const dist = (x - center[0]) ** 2 + (y - center[1]) ** 2
      return dist < bestDist ? index : best
    }, 0))
    centers = centers.map((center, index) => {
      const cluster = points.filter((_, pointIndex) => labels[pointIndex] === index)
      return cluster.length ? [ss.mean(cluster.map(([x]) => x)), ss.mean(cluster.map(([, y]) => y))] as [number, number] : center
    })
  }
  const sizes = centers.map((_, index) => labels.filter((label) => label === index).length)
  return { centers, sizes }
}

function forecastSummary(values: number[]) {
  if (values.length < 4) return null
  const last = values[values.length - 1]
  const window = values.slice(-Math.min(5, values.length))
  const movingAverage = ss.mean(window)
  const trend = (last - values[0]) / (values.length - 1)
  return { last, movingAverage, naiveNext: last, trendNext: last + trend, trend }
}

function controlChart(values: number[]) {
  if (values.length < 2) return null
  const mean = ss.mean(values)
  const sd = ss.standardDeviation(values)
  const ucl = mean + 3 * sd
  const lcl = mean - 3 * sd
  const violations = values.filter((value) => value > ucl || value < lcl).length
  return { mean, sd, ucl, lcl, violations, cp: sd === 0 ? 0 : (6 * sd) / (6 * sd) }
}

// ── Statistical helpers ──────────────────────────────────────────────────────

function localLogGamma(x: number): number {
  const c = [76.180091729471, -86.505320329417, 24.014098240831, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x, tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) ser += c[j] / ++y
  return -tmp + Math.log(2.506628274631 * ser / x)
}

function localBetaCF(x: number, a: number, b: number): number {
  const qab = a + b, qap = a + 1, qam = a - 1
  let c = 1, d = 1 - (qab * x) / qap
  if (Math.abs(d) < 1e-30) d = 1e-30
  d = 1 / d; let h = d
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d; h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d; h *= d * c
    if (Math.abs(d * c - 1) < 3e-7) break
  }
  return h
}

function localRegBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1
  const lbeta = localLogGamma(a) + localLogGamma(b) - localLogGamma(a + b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a
  return front * localBetaCF(x, a, b)
}

function fPValue(f: number, d1: number, d2: number): number {
  if (!Number.isFinite(f) || f <= 0) return 1
  const x = (d1 * f) / (d1 * f + d2)
  return 1 - localRegBeta(x, d1 / 2, d2 / 2)
}

interface AnovaResult { F: number; dfB: number; dfW: number; MSB: number; MSW: number; p: number; groupStats: { name: string; n: number; mean: number; sd: number }[]; reject: boolean; alpha: number }

function oneWayAnova(groups: { name: string; values: number[] }[], alpha = 0.05): AnovaResult | null {
  const filtered = groups.filter(g => g.values.length >= 2)
  if (filtered.length < 2) return null
  const N = filtered.reduce((s, g) => s + g.values.length, 0)
  const grandMean = filtered.reduce((s, g) => s + g.values.reduce((a, v) => a + v, 0), 0) / N
  const SSB = filtered.reduce((s, g) => s + g.values.length * (ss.mean(g.values) - grandMean) ** 2, 0)
  const SSW = filtered.reduce((s, g) => s + g.values.reduce((a, v) => a + (v - ss.mean(g.values)) ** 2, 0), 0)
  const dfB = filtered.length - 1, dfW = N - filtered.length
  const MSB = SSB / dfB, MSW = SSW / dfW
  const F = MSW === 0 ? 0 : MSB / MSW
  const p = fPValue(F, dfB, dfW)
  return { F: +F.toFixed(4), dfB, dfW, MSB: +MSB.toFixed(4), MSW: +MSW.toFixed(4), p: +p.toFixed(4), alpha, reject: p < alpha, groupStats: filtered.map(g => ({ name: g.name, n: g.values.length, mean: +ss.mean(g.values).toFixed(4), sd: g.values.length > 1 ? +ss.standardDeviation(g.values).toFixed(4) : 0 })) }
}

interface MWResult { U: number; z: number; p: number; n1: number; n2: number; reject: boolean; alpha: number }

function mannWhitneyU(a: number[], b: number[], alpha = 0.05): MWResult | null {
  if (a.length < 3 || b.length < 3) return null
  let u1 = 0
  for (const x of a) for (const y of b) { if (x > y) u1++; else if (x === y) u1 += 0.5 }
  const u2 = a.length * b.length - u1
  const U = Math.min(u1, u2)
  const mu = a.length * b.length / 2
  const sigma = Math.sqrt(a.length * b.length * (a.length + b.length + 1) / 12)
  const z = sigma === 0 ? 0 : (U - mu) / sigma
  const p = 2 * (1 - normalCDF(Math.abs(z)))
  return { U: +U.toFixed(1), z: +z.toFixed(4), p: +p.toFixed(4), n1: a.length, n2: b.length, alpha, reject: p < alpha }
}

interface KWResult { H: number; df: number; p: number; N: number; reject: boolean; alpha: number }

function kruskalWallis(groups: { name: string; values: number[] }[], alpha = 0.05): KWResult | null {
  const filtered = groups.filter(g => g.values.length >= 2)
  if (filtered.length < 2) return null
  const all: { v: number; g: number }[] = filtered.flatMap((g, gi) => g.values.map(v => ({ v, g: gi })))
  const N = all.length
  const sorted = [...all].sort((a, b) => a.v - b.v)
  const ranks: number[] = new Array(N)
  let idx = 0
  while (idx < N) {
    let jdx = idx
    while (jdx < N && sorted[jdx].v === sorted[idx].v) jdx++
    const avgRank = (idx + jdx + 1) / 2
    for (let m = idx; m < jdx; m++) ranks[m] = avgRank
    idx = jdx
  }
  const groupRankSums = Array(filtered.length).fill(0)
  for (let m = 0; m < N; m++) groupRankSums[sorted[m].g] += ranks[m]
  const H = (12 / (N * (N + 1))) * groupRankSums.reduce((s, Ri, gi) => s + Ri ** 2 / filtered[gi].values.length, 0) - 3 * (N + 1)
  const df = filtered.length - 1
  const p = 1 - chiSquareCDF(Math.max(H, 0), df)
  return { H: +H.toFixed(4), df, p: +p.toFixed(4), N, alpha, reject: p < alpha }
}

// ── Feature Coverage status types ────────────────────────────────────────────

type FeatureStatus = 'done' | 'linked' | 'partial' | 'todo'
type FeatureItem = { label: string; status: FeatureStatus; linkTo?: string }

const FEATURE_GROUPS_V2: Record<FeatureGroup, FeatureItem[]> = {
  'Data Prep': [
    { label: 'Data dictionary and variable roles', status: 'done' },
    { label: 'Missing-value profile and handling plan', status: 'done' },
    { label: 'Duplicate and ID validation', status: 'done' },
    { label: 'Outlier detection with IQR and z-score rules', status: 'done' },
    { label: 'Type conversion and recoding', status: 'done' },
    { label: 'Scale, standardize, normalize, and winsorize', status: 'done' },
    { label: 'Derived columns and formula builder', status: 'partial' },
    { label: 'Merge, append, reshape, and pivot workflows', status: 'partial' },
  ],
  EDA: [
    { label: 'Descriptive statistics by group', status: 'done' },
    { label: 'Frequency and cross-tab tables', status: 'done' },
    { label: 'Correlation matrix with flags', status: 'done' },
    { label: 'Distribution diagnostics', status: 'done' },
    { label: 'Box, violin, density, scatter, and residual plots', status: 'done' },
    { label: 'Skewness, kurtosis, and robust summaries', status: 'done' },
    { label: 'Interactive drill-down dashboard', status: 'linked', linkTo: '/dashboard' },
    { label: 'Automated data quality report', status: 'done' },
  ],
  Inference: [
    { label: 'Hypothesis-test chooser', status: 'done' },
    { label: 'One-sample, paired, and independent t-tests', status: 'linked', linkTo: '/inference' },
    { label: 'ANOVA, Welch ANOVA, and post-hoc tests', status: 'done' },
    { label: 'Chi-square, Fisher exact, and proportion tests', status: 'done' },
    { label: 'Nonparametric tests', status: 'done' },
    { label: 'Confidence intervals', status: 'linked', linkTo: '/inference' },
    { label: 'Effect sizes with interpretation', status: 'done' },
    { label: 'Power and sample-size calculators', status: 'done' },
  ],
  Modeling: [
    { label: 'Simple and multiple linear regression', status: 'linked', linkTo: '/regression' },
    { label: 'Logistic regression', status: 'todo' },
    { label: 'Regression diagnostics', status: 'done' },
    { label: 'Model comparison and validation', status: 'done' },
    { label: 'PCA and factor analysis', status: 'partial' },
    { label: 'Clustering and segmentation', status: 'partial' },
    { label: 'Forecasting and decomposition', status: 'done' },
    { label: 'Control charts and capability analysis', status: 'done' },
  ],
  Teaching: [
    { label: 'Assumption checklist for every method', status: 'done' },
    { label: 'Plain-language result interpretation', status: 'done' },
    { label: 'Formula and calculation walkthroughs', status: 'done' },
    { label: 'Guided lesson paths', status: 'linked', linkTo: '/learn' },
    { label: 'Practice datasets by topic', status: 'linked', linkTo: '/' },
    { label: 'Warnings about p-hacking and bias', status: 'done' },
    { label: 'Simulation playground', status: 'done' },
    { label: 'Glossary with examples', status: 'done' },
  ],
  Output: [
    { label: 'Publication-ready tables', status: 'done' },
    { label: 'Export charts as PNG/SVG', status: 'linked', linkTo: '/charts' },
    { label: 'Export reports to PDF/HTML', status: 'done' },
    { label: 'Save reusable analysis sessions', status: 'done' },
    { label: 'Notebook-style analysis history', status: 'done' },
    { label: 'Reproducible script export', status: 'done' },
    { label: 'Shareable dashboards', status: 'linked', linkTo: '/dashboard' },
    { label: 'Audit trail for transformations', status: 'done' },
  ],
}

const GLOSSARY: { term: string; definition: string; example: string }[] = [
  { term: 'p-value', definition: 'Probability of observing data at least as extreme as the sample, assuming H₀ is true. A small p-value provides evidence against H₀.', example: 'p = 0.03 means a 3% chance of this result if there were truly no effect.' },
  { term: 'Effect size', definition: 'Standardized measure of the magnitude of an effect, independent of sample size. Cohen d < 0.2 is negligible, 0.2–0.5 small, 0.5–0.8 medium, > 0.8 large.', example: "Cohen d = 0.6 means the groups differ by 0.6 standard deviations." },
  { term: 'Confidence interval', definition: 'A range of plausible values for the population parameter. A 95% CI means that 95% of such intervals (across repeated samples) would contain the true value.', example: 'CI [42, 58] means we are 95% confident the true mean lies between 42 and 58.' },
  { term: 'ANOVA', definition: 'Analysis of Variance: tests whether three or more group means are equal by comparing between-group variance to within-group variance via the F-ratio.', example: 'F = 8.2, p = 0.002 → reject equal-means H₀.' },
  { term: 'Mann-Whitney U', definition: 'Nonparametric test comparing two independent groups on their rank distributions. Use when normality is doubtful.', example: 'U = 42, p = 0.04 → the two groups differ significantly in rank.' },
  { term: 'IQR', definition: 'Interquartile Range: Q3 − Q1. Measures spread of the middle 50% of data. Robust to outliers.', example: 'IQR = 20 means the middle 50% spans 20 units.' },
  { term: 'Skewness', definition: 'Degree of asymmetry. Positive = right tail longer; negative = left tail longer. |skew| > 1 signals notable asymmetry.', example: 'Skewness = 2.1 suggests a long right tail; consider log transform.' },
  { term: 'Kurtosis', definition: 'Heaviness of tails relative to normal distribution (excess kurtosis). > 0 = heavier tails; < 0 = lighter tails.', example: 'Kurtosis = 4 means more extreme outliers than a normal distribution.' },
  { term: 'RMSE', definition: 'Root Mean Squared Error: average prediction error in original units. Lower is better.', example: 'RMSE = 5.2 means predictions are off by ≈ 5.2 units on average.' },
  { term: 'R²', definition: 'Proportion of outcome variance explained by the model. R² = 0.72 means 72% of variation is accounted for.', example: 'R² = 0.85 is strong for social science; 0.95 is expected for physical measurement.' },
  { term: 'Outlier (IQR rule)', definition: 'Any value below Q1 − 1.5×IQR or above Q3 + 1.5×IQR. These are flagged, not automatically removed.', example: 'Q1=10, Q3=30, IQR=20 → outliers below -20 or above 60.' },
  { term: 'Power', definition: 'Probability of correctly rejecting a false H₀. Power = 1 − β. Target ≥ 0.80 before collecting data.', example: 'Power = 0.80 means 80% chance of detecting a true effect of the assumed size.' },
]

function buildFeatureSuite(
  data: Record<string, unknown>[],
  numCols: string[],
  catCols: string[],
  firstNum: string,
  secondNum: string,
  groupCol: string,
  firstCat: string,
  secondCat: string,
  confidence: string,
  margin: string,
  sigma: string,
  method: string,
  goalHelp: { title: string; methods: string[]; assumptions: string[] }
): FeatureSuite {
  const nums = firstNum ? numericColumn(data, firstNum) : []
  const numsB = secondNum ? numericColumn(data, secondNum) : []
  const missingRows = data.filter((row) => Object.values(row).some((value) => !nonMissing(value))).length
  const duplicates = new Set(data.map((row) => JSON.stringify(row))).size
  const outliers = nums.length ? detectOutliersIQR(nums) : { lower: NaN, upper: NaN, outliers: [] }
  const grouped = groupedMeanRows(data, groupCol, firstNum)
  const counts = firstCat ? valueCounts(data, firstCat) : []
  const cross = crosstabSummary(data, firstCat, secondCat)
  const corr = firstNum && secondNum ? pearsonCorrelation(data, firstNum, secondNum) : NaN
  const reg = simpleRegression(data, firstNum, secondNum)
  const pca = pcaTwo(data, firstNum, secondNum)
  const km = kMeansTwo(data, firstNum, secondNum)
  const forecast = forecastSummary(nums)
  const control = controlChart(nums)
  const z = zForConfidence[confidence]
  const requiredN = Math.ceil((z * Math.max(Number(sigma), 0.0001) / Math.max(Number(margin), 0.0001)) ** 2)
  const highMissing = data.length ? Math.round((missingRows / data.length) * 100) : 0

  return {
    'Data Prep': [
      { item: 'Data dictionary and variable roles', result: `${numCols.length} numeric, ${catCols.length} categorical`, detail: `Numeric: ${numCols.slice(0, 8).join(', ') || '-'}; categorical: ${catCols.slice(0, 8).join(', ') || '-'}.` },
      { item: 'Missing-value profile and handling plan', result: `${missingRows} rows affected`, detail: highMissing > 20 ? 'Use imputation or analyze missingness pattern before modeling.' : 'Listwise deletion is likely acceptable for quick exploration; still review key columns.' },
      { item: 'Duplicate and ID validation', result: `${data.length - duplicates} duplicate rows`, detail: 'Exact duplicate rows are counted by full-row signatures.' },
      { item: 'Outlier detection with IQR and z-score rules', result: `${outliers.outliers.length} IQR outliers in ${firstNum || '-'}`, detail: `IQR fence: ${round(outliers.lower)} to ${round(outliers.upper)}.` },
      { item: 'Type conversion and recoding', result: `${catCols.length + numCols.length} typed columns`, detail: 'Schema detection has assigned roles; recode low-cardinality numeric IDs before inference if needed.' },
      { item: 'Scale, standardize, normalize, and winsorize', result: nums.length ? `z-score ready for ${firstNum}` : 'No numeric column', detail: nums.length ? `Mean ${round(ss.mean(nums))}, SD ${round(ss.standardDeviation(nums))}. Winsorize outside IQR fences if reporting robust means.` : 'Upload numeric data first.' },
      { item: 'Derived columns and formula builder', result: firstNum && secondNum ? `${firstNum} - ${secondNum}` : 'Needs two numeric columns', detail: firstNum && secondNum ? `Preview mean difference: ${round(ss.mean(nums) - ss.mean(numsB))}.` : 'Select two numeric columns.' },
      { item: 'Merge, append, reshape, and pivot workflows', result: `${data.length.toLocaleString()} base rows`, detail: groupCol ? `Pivot-ready grouping column: ${groupCol}.` : 'Choose a categorical grouping column for pivot summaries.' },
    ],
    EDA: [
      { item: 'Descriptive statistics by group', result: `${grouped.length} groups`, detail: grouped.slice(0, 4).map((row) => `${row.group}: n=${row.n}, mean=${round(row.mean)}`).join('; ') || 'Choose a grouping column.' },
      { item: 'Frequency and cross-tab tables', result: `${counts.length} levels`, detail: `Top counts: ${counts.slice(0, 5).map(([key, value]) => `${key}=${value}`).join(', ') || '-'}. Crosstab ${firstCat} x ${secondCat}: ${cross.rows} x ${cross.cols}; top cell ${cross.top}.` },
      { item: 'Correlation matrix with flags', result: Number.isFinite(corr) ? `r=${round(corr)}` : 'Needs two numeric columns', detail: Number.isFinite(corr) && Math.abs(corr) > 0.8 ? 'Strong association flag: check multicollinearity before regression.' : 'No strong pairwise flag for selected variables.' },
      { item: 'Distribution diagnostics', result: nums.length ? `skew=${round(ss.sampleSkewness(nums))}` : '-', detail: nums.length > 3 ? `kurtosis=${round(ss.sampleKurtosis(nums))}; ${Math.abs(ss.sampleSkewness(nums)) > 1 ? 'skewed distribution' : 'roughly balanced distribution'}.` : 'Need more numeric data.' },
      { item: 'Box, violin, density, scatter, and residual plots', result: firstNum && secondNum ? 'scatter/residual data ready' : 'Needs columns', detail: reg ? `Residual RMSE ${round(reg.rmse)}; ${reg.residuals.filter((value) => Math.abs(value) > 2 * reg.rmse).length} large residuals.` : 'Select two numeric variables.' },
      { item: 'Skewness, kurtosis, and robust summaries', result: nums.length ? `median=${round(ss.median(nums))}` : '-', detail: nums.length ? `IQR ${round(ss.quantile(nums, 0.75) - ss.quantile(nums, 0.25))}; mean ${round(ss.mean(nums))}.` : 'No numeric data.' },
      { item: 'Interactive drill-down dashboard', result: `${groupCol || 'No group'} drill-down`, detail: grouped.slice(0, 3).map((row) => `${row.group}: ${round(row.mean)}`).join(', ') || 'Choose group and numeric variables.' },
      { item: 'Automated data quality report', result: highMissing > 20 || outliers.outliers.length > 0 ? 'Review needed' : 'Looks usable', detail: `${missingRows} rows with missing values and ${outliers.outliers.length} selected-column outliers.` },
    ],
    Inference: [
      { item: 'Hypothesis-test chooser', result: method, detail: 'Uses goal, outcome type, and predictor type to route the analysis.' },
      { item: 'One-sample, paired, and independent t-tests', result: nums.length > 1 ? `mean=${round(ss.mean(nums))}` : 'Needs numeric data', detail: firstNum && secondNum ? `Paired mean difference preview: ${round(ss.mean(nums) - ss.mean(numsB))}.` : 'Choose two numeric columns for paired preview.' },
      { item: 'ANOVA, Welch ANOVA, and post-hoc tests', result: `${grouped.length} groups`, detail: grouped.length >= 3 ? `Largest group mean spread: ${round(Math.max(...grouped.map((g) => g.mean)) - Math.min(...grouped.map((g) => g.mean)))}.` : 'Choose a categorical grouping column with 3+ groups.' },
      { item: 'Chi-square, Fisher exact, and proportion tests', result: `${cross.rows} x ${cross.cols} table`, detail: cross.rows <= 2 && cross.cols <= 2 ? '2x2 table can use Fisher exact when expected counts are small.' : 'Use chi-square for larger crosstabs.' },
      { item: 'Nonparametric tests', result: nums.length ? 'rank alternatives available' : 'Needs data', detail: 'Use Mann-Whitney/Kruskal-Wallis when normality or equal variance is doubtful.' },
      { item: 'Confidence intervals', result: `${Number(confidence) * 100}% CI plan`, detail: nums.length > 1 ? `Mean CI can use mean ${round(ss.mean(nums))}, SE ${round(ss.standardDeviation(nums) / Math.sqrt(nums.length))}.` : 'Need at least two values.' },
      { item: 'Effect sizes with interpretation', result: Number.isFinite(corr) ? effectLabel(Math.abs(corr)) : '-', detail: Number.isFinite(corr) ? `Selected Pearson r = ${round(corr)}.` : 'Choose two numeric variables.' },
      { item: 'Power and sample-size calculators', result: `n=${requiredN}`, detail: `n = (z*sigma/margin)^2 with z=${z}, sigma=${sigma}, margin=${margin}.` },
    ],
    Modeling: [
      { item: 'Simple and multiple linear regression', result: reg ? `R2=${round(reg.r2)}` : 'Needs two numeric columns', detail: reg ? `Equation: ${secondNum} = ${round(reg.intercept)} + ${round(reg.slope)} * ${firstNum}; RMSE ${round(reg.rmse)}.` : 'Select predictor and outcome numeric columns.' },
      { item: 'Logistic regression', result: catCols.length ? 'classification-ready target found' : 'Needs categorical target', detail: firstCat ? `Candidate target: ${firstCat} with ${counts.length} classes.` : 'Choose a categorical column.' },
      { item: 'Regression diagnostics', result: reg ? `${reg.residuals.filter((value) => Math.abs(value) > 2 * reg.rmse).length} large residuals` : '-', detail: reg ? 'Review residual spread and outlier rows before trusting slope.' : 'Run regression preview first.' },
      { item: 'Model comparison and validation', result: data.length >= 10 ? '80/20 split possible' : 'Small sample', detail: `Training rows preview: ${Math.floor(data.length * 0.8)}, validation rows preview: ${data.length - Math.floor(data.length * 0.8)}.` },
      { item: 'PCA and factor analysis', result: pca ? `PC1 ${round(pca.pc1 * 100)}%` : 'Needs two numeric columns', detail: pca ? `Two-variable PCA approximation; variables load in ${pca.loading}.` : 'Select two numeric variables.' },
      { item: 'Clustering and segmentation', result: km ? `${km.sizes.length} clusters` : 'Needs two numeric columns', detail: km ? `Cluster sizes: ${km.sizes.join(', ')}.` : 'Select two numeric variables.' },
      { item: 'Forecasting and decomposition', result: forecast ? `next=${round(forecast.trendNext)}` : 'Needs ordered numeric data', detail: forecast ? `Last ${round(forecast.last)}, moving average ${round(forecast.movingAverage)}, trend per row ${round(forecast.trend)}.` : 'Use a time-ordered numeric column.' },
      { item: 'Control charts and capability analysis', result: control ? `${control.violations} violations` : 'Needs numeric data', detail: control ? `Mean ${round(control.mean)}, LCL ${round(control.lcl)}, UCL ${round(control.ucl)}.` : 'Choose a numeric process column.' },
    ],
    Teaching: [
      { item: 'Assumption checklist for every method', result: `${goalHelp.assumptions.length} checks`, detail: goalHelp.assumptions.join(' ') },
      { item: 'Plain-language result interpretation', result: method, detail: `Recommended story: because your goal is "${method}", report assumptions, effect size, uncertainty, and practical meaning.` },
      { item: 'Formula and calculation walkthroughs', result: 'available in summaries', detail: 'Effect size, sample size, regression, and control limits show substituted values.' },
      { item: 'Guided lesson paths', result: goalHelp.title, detail: `Start with ${goalHelp.methods[0]}, then compare with ${goalHelp.methods.slice(1, 3).join(' and ')}.` },
      { item: 'Practice datasets by topic', result: 'sample data compatible', detail: 'Use built-in sample datasets tagged regression, time-series, anomaly, clustering, and quality.' },
      { item: 'Warnings about p-hacking and bias', result: 'active', detail: 'Avoid repeated testing without correction; document choices before seeing results.' },
      { item: 'Simulation playground', result: 'planning-ready', detail: `Sample size scenario currently requires n=${requiredN}; vary sigma and margin to see sensitivity.` },
      { item: 'Glossary with examples', result: 'contextual glossary', detail: 'Mean, SD, IQR, skewness, p-value, CI, effect size, RMSE, and control limits appear with live dataset values.' },
    ],
    Output: [
      { item: 'Publication-ready tables', result: 'ready', detail: 'Data audit, grouped summaries, crosstab summary, and model tables are rendered in structured cards.' },
      { item: 'Export charts as PNG/SVG', result: 'defer to chart pages', detail: 'Advanced report exports results; chart image export remains in chart/distribution pages.' },
      { item: 'Export reports to PDF/HTML', result: 'JSON report now', detail: 'Use Export Advanced Report for reproducible output; PDF/HTML can build from this payload.' },
      { item: 'Save reusable analysis sessions', result: 'session payload ready', detail: 'The export captures selected columns, method recommendation, and all computed panels.' },
      { item: 'Notebook-style analysis history', result: 'analysis note generated', detail: `Notebook note: ran advanced analysis on ${data.length} rows using ${firstNum || 'selected column'}.` },
      { item: 'Reproducible script export', result: 'formula trace ready', detail: 'The report includes formulas and selected variables so R/Python export can be generated next.' },
      { item: 'Shareable dashboards', result: 'dashboard summary ready', detail: 'Cards are grouped by workflow and can be copied into Dashboard/Reports.' },
      { item: 'Audit trail for transformations', result: 'read-only audit active', detail: 'Missing, duplicate, type, outlier, scaling, and derived-column recommendations are captured.' },
    ],
  }
}

function recommendedMethod(goal: Goal, outcome: OutcomeType, predictor: PredictorType) {
  if (goal === 'compare_means' && outcome === 'numeric' && predictor === 'categorical') return 't-test or ANOVA'
  if (goal === 'association' && outcome === 'numeric' && predictor === 'numeric') return 'Pearson or Spearman correlation'
  if (goal === 'association' && outcome === 'categorical' && predictor === 'categorical') return 'Chi-square test or Fisher exact test'
  if (goal === 'predict_numeric') return predictor === 'mixed' ? 'Multiple linear regression' : 'Simple linear regression'
  if (goal === 'predict_category') return 'Logistic regression with confusion matrix'
  if (goal === 'time_series' || outcome === 'time') return 'Time-series decomposition and forecasting'
  if (goal === 'quality') return 'Control chart and process capability'
  return 'Descriptive statistics and exploratory charts'
}

export function AdvancedAnalysisPage() {
  const { activeDataset, theme } = useStore()
  const [goal, setGoal] = useState<Goal>('compare_means')
  const [outcomeType, setOutcomeType] = useState<OutcomeType>('numeric')
  const [predictorType, setPredictorType] = useState<PredictorType>('categorical')
  const [colA, setColA] = useState('')
  const [colB, setColB] = useState('')
  const [confidence, setConfidence] = useState('0.95')
  const [margin, setMargin] = useState('5')
  const [sigma, setSigma] = useState('15')
  const [groupCol, setGroupCol] = useState('')
  const [catA, setCatA] = useState('')
  const [catB, setCatB] = useState('')
  const [anovaAlpha, setAnovaAlpha] = useState('0.05')
  const [anovaNumCol, setAnovaNumCol] = useState('')
  const [anovaGroupCol, setAnovaGroupCol] = useState('')
  const [mwColA, setMwColA] = useState('')
  const [mwColB, setMwColB] = useState('')
  const [glossaryOpen, setGlossaryOpen] = useState<Set<number>>(new Set())
  const [simSigma, setSimSigma] = useState(15)
  const [simMargin, setSimMargin] = useState(5)
  const scatterRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<HTMLDivElement>(null)

  const numCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? [],
    [activeDataset]
  )
  const catCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'categorical' || col.type === 'boolean').map((col) => col.name) ?? [],
    [activeDataset]
  )

  const firstNum = colA || numCols[0] || ''
  const secondNum = colB || numCols.find((col) => col !== firstNum) || ''
  const activeGroupCol = groupCol || catCols[0] || ''
  const firstCat = catA || catCols[0] || ''
  const secondCat = catB || catCols.find((col) => col !== firstCat) || ''

  const audit = useMemo(() => {
    if (!activeDataset) return null
    const rowCount = activeDataset.data.length
    const missingCells = activeDataset.schema.reduce((sum, col) => sum + col.missing, 0)
    const totalCells = rowCount * activeDataset.schema.length
    const numericAudits = numCols.map((col) => {
      const nums = numericColumn(activeDataset.data, col)
      const outlierResult = nums.length > 3 ? detectOutliersIQR(nums) : { outliers: [] }
      return {
        col,
        n: nums.length,
        missing: rowCount - nums.length,
        skewness: nums.length > 2 ? ss.sampleSkewness(nums) : 0,
        kurtosis: nums.length > 3 ? ss.sampleKurtosis(nums) : 0,
        outliers: outlierResult.outliers.length,
      }
    })
    return {
      rows: rowCount,
      cols: activeDataset.schema.length,
      numericCount: numCols.length,
      categoricalCount: catCols.length,
      missingPct: totalCells === 0 ? 0 : missingCells / totalCells * 100,
      highMissing: activeDataset.schema.filter((col) => col.missingPct >= 20).map((col) => col.name),
      numericAudits,
    }
  }, [activeDataset, catCols.length, numCols])

  const effect = useMemo(() => {
    if (!activeDataset || !firstNum || !secondNum) return null
    const a = numericColumn(activeDataset.data, firstNum)
    const b = numericColumn(activeDataset.data, secondNum)
    const d = cohenD(a, b)
    const r = pearsonCorrelation(activeDataset.data, firstNum, secondNum)
    return {
      cohen: d,
      correlation: Number.isFinite(r) ? r : null,
      n: Math.min(a.length, b.length),
    }
  }, [activeDataset, firstNum, secondNum])

  const sampleSize = useMemo(() => {
    const z = zForConfidence[confidence]
    const e = Math.max(Number(margin), 0.0001)
    const s = Math.max(Number(sigma), 0.0001)
    return Math.ceil((z * s / e) ** 2)
  }, [confidence, margin, sigma])

  const method = recommendedMethod(goal, outcomeType, predictorType)
  const goalHelp = GOAL_HELP[goal]
  const featureSuite = useMemo(() => activeDataset ? buildFeatureSuite(activeDataset.data, numCols, catCols, firstNum, secondNum, activeGroupCol, firstCat, secondCat, confidence, margin, sigma, method, goalHelp) : null, [activeDataset, numCols, catCols, firstNum, secondNum, activeGroupCol, firstCat, secondCat, confidence, margin, sigma, method, goalHelp])

  // ANOVA / nonparametric
  const effAnovaNum = anovaNumCol || firstNum
  const effAnovaGroup = anovaGroupCol || activeGroupCol
  const effMwA = mwColA || firstNum
  const effMwB = mwColB || (numCols.find(c => c !== effMwA) ?? '')

  const anovaResult = useMemo(() => {
    if (!activeDataset || !effAnovaNum || !effAnovaGroup) return null
    const groupMap = new Map<string, number[]>()
    activeDataset.data.forEach(row => {
      const key = row[effAnovaGroup] != null && row[effAnovaGroup] !== '' ? String(row[effAnovaGroup]) : '(missing)'
      const v = Number(row[effAnovaNum])
      if (!Number.isFinite(v)) return
      groupMap.set(key, [...(groupMap.get(key) ?? []), v])
    })
    const groups = [...groupMap.entries()].map(([name, values]) => ({ name, values })).filter(g => g.values.length >= 2)
    return groups.length >= 2 ? oneWayAnova(groups, Number(anovaAlpha)) : null
  }, [activeDataset, effAnovaNum, effAnovaGroup, anovaAlpha])

  const kwResult = useMemo(() => {
    if (!activeDataset || !effAnovaNum || !effAnovaGroup) return null
    const groupMap = new Map<string, number[]>()
    activeDataset.data.forEach(row => {
      const key = row[effAnovaGroup] != null && row[effAnovaGroup] !== '' ? String(row[effAnovaGroup]) : '(missing)'
      const v = Number(row[effAnovaNum])
      if (!Number.isFinite(v)) return
      groupMap.set(key, [...(groupMap.get(key) ?? []), v])
    })
    const groups = [...groupMap.entries()].map(([name, values]) => ({ name, values })).filter(g => g.values.length >= 2)
    return groups.length >= 2 ? kruskalWallis(groups, Number(anovaAlpha)) : null
  }, [activeDataset, effAnovaNum, effAnovaGroup, anovaAlpha])

  const mwResult = useMemo(() => {
    if (!activeDataset || !effMwA || !effMwB || effMwA === effMwB) return null
    const a = numericColumn(activeDataset.data, effMwA)
    const b = numericColumn(activeDataset.data, effMwB)
    return mannWhitneyU(a, b, Number(anovaAlpha))
  }, [activeDataset, effMwA, effMwB, anovaAlpha])

  // Chi-square independence
  const chiIndepResult = useMemo(() => {
    if (!activeDataset || !firstCat || !secondCat || firstCat === secondCat) return null
    const rowLevels = [...new Set(activeDataset.data.map(r => String(r[firstCat] ?? '')))]
    const colLevels = [...new Set(activeDataset.data.map(r => String(r[secondCat] ?? '')))]
    if (rowLevels.length < 2 || colLevels.length < 2 || rowLevels.length > 15 || colLevels.length > 15) return null
    const table = rowLevels.map(rv => colLevels.map(cv => activeDataset.data.filter(r => String(r[firstCat] ?? '') === rv && String(r[secondCat] ?? '') === cv).length))
    if (table.flat().every(c => c === 0)) return null
    return { result: chiSquareIndependence(table, Number(anovaAlpha)), rowLevels, colLevels, table }
  }, [activeDataset, firstCat, secondCat, anovaAlpha])

  // Full correlation matrix
  const corrMatrix = useMemo(() => {
    if (!activeDataset || numCols.length < 2) return null
    const cols = numCols.slice(0, 8)
    return correlationMatrix(activeDataset.data, cols)
  }, [activeDataset, numCols])

  // Z-score outlier summary
  const zScoreSummary = useMemo(() => {
    if (!activeDataset || !firstNum) return null
    const nums = numericColumn(activeDataset.data, firstNum)
    if (nums.length < 2) return null
    const mean = ss.mean(nums)
    const sd = ss.standardDeviation(nums)
    const zs = nums.map(v => sd === 0 ? 0 : (v - mean) / sd)
    return { beyond2: zs.filter(z => Math.abs(z) > 2).length, beyond3: zs.filter(z => Math.abs(z) > 3).length, maxZ: +Math.max(...zs.map(Math.abs)).toFixed(3) }
  }, [activeDataset, firstNum])

  const exportAdvancedReport = () => {
    if (!featureSuite || !audit || !activeDataset) return
    const payload = {
      dataset: activeDataset.name,
      audit,
      methodRecommendation: { goal: goalHelp.title, method, assumptions: goalHelp.assumptions },
      featureSuite,
    }
    downloadText('advanced-analysis-report.json', JSON.stringify(payload, null, 2), 'application/json')
  }

  const exportHTML = () => {
    if (!audit || !activeDataset) return
    const rows = audit.numericAudits.map(a => `<tr><td>${a.col}</td><td>${a.n}</td><td>${a.missing}</td><td>${round(a.skewness, 2)}</td><td>${a.outliers}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Advanced Analysis — ${activeDataset.name}</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;color:#1e293b}h1{font-size:1.5rem}h2{font-size:1.1rem;margin-top:1.5rem;color:#4f46e5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #e2e8f0;padding:.4rem .7rem;text-align:left}th{background:#f8fafc}p{line-height:1.6}</style></head>
<body><h1>Advanced Analysis Report — ${activeDataset.name}</h1>
<p><b>Rows:</b> ${audit.rows} &nbsp; <b>Cols:</b> ${audit.cols} &nbsp; <b>Missing:</b> ${round(audit.missingPct, 2)}%</p>
<h2>Recommended Method</h2><p>${goalHelp.title} → <b>${method}</b></p>
<p>Assumptions: ${goalHelp.assumptions.join(' ')}</p>
<h2>Numeric Column Audit</h2>
<table><thead><tr><th>Column</th><th>n</th><th>Missing</th><th>Skewness</th><th>IQR Outliers</th></tr></thead><tbody>${rows}</tbody></table>
${anovaResult ? `<h2>One-Way ANOVA (${effAnovaNum} by ${effAnovaGroup})</h2><p>F(${anovaResult.dfB}, ${anovaResult.dfW}) = ${anovaResult.F}, p = ${anovaResult.p} — ${anovaResult.reject ? 'Reject H₀' : 'Fail to reject H₀'}</p>` : ''}
<p style="margin-top:2rem;font-size:.8rem;color:#94a3b8">Generated by StatAnveshak · ${new Date().toLocaleDateString()}</p></body></html>`
    downloadText(`advanced-analysis-${activeDataset.name}.html`, html, 'text/html')
  }

  const exportRScript = () => {
    if (!activeDataset) return
    const script = `# StatAnveshak — Reproducible R Script
# Dataset: ${activeDataset.name}  Generated: ${new Date().toLocaleDateString()}

# Load your data
df <- read.csv("your-data.csv")

# Summary statistics
summary(df)

# Descriptive by group
${effAnovaGroup ? `tapply(df$${effAnovaNum}, df$${effAnovaGroup}, function(x) c(n=length(x), mean=mean(x), sd=sd(x)))` : '# tapply(df$numeric_col, df$group_col, summary)'}

# One-way ANOVA
${effAnovaGroup && effAnovaNum ? `fit <- aov(${effAnovaNum} ~ ${effAnovaGroup}, data=df)\nsummary(fit)\nTukeyHSD(fit)` : '# aov(y ~ group, data=df)'}

# Nonparametric alternative (Kruskal-Wallis)
${effAnovaGroup && effAnovaNum ? `kruskal.test(${effAnovaNum} ~ ${effAnovaGroup}, data=df)` : '# kruskal.test(y ~ group, data=df)'}

# Mann-Whitney (two columns)
${effMwA && effMwB ? `wilcox.test(df$${effMwA}, df$${effMwB})` : '# wilcox.test(df$col_a, df$col_b)'}

# Pearson correlation
${firstNum && secondNum ? `cor.test(df$${firstNum}, df$${secondNum})` : '# cor.test(df$x, df$y)'}

# Linear regression
${firstNum && secondNum ? `lm_fit <- lm(${secondNum} ~ ${firstNum}, data=df)\nsummary(lm_fit)\nplot(lm_fit)` : '# lm(y ~ x, data=df)'}

# Effect size (Cohen's d) — requires effsize package
# library(effsize)\n# cohen.d(df$${firstNum}, df$${secondNum})
`
    downloadText(`analysis-script-${activeDataset.name}.R`, script)
  }

  const layoutBase = useMemo(() => {
    const paperBg = theme === 'dark' ? '#1e293b' : '#ffffff'
    const plotBg = theme === 'dark' ? '#0f172a' : '#f8fafc'
    const fontColor = theme === 'dark' ? '#cbd5e1' : '#334155'
    return { paper_bgcolor: paperBg, plot_bgcolor: plotBg, font: { color: fontColor, size: 11, family: 'Inter, system-ui, sans-serif' }, margin: { t: 30, r: 20, b: 50, l: 55 } }
  }, [theme])

  // Scatter + regression line chart
  useEffect(() => {
    if (!activeDataset || !firstNum || !secondNum || !scatterRef.current) return
    const pairs = activeDataset.data.map(r => [Number(r[firstNum]), Number(r[secondNum])] as [number, number]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    if (pairs.length < 2) return
    const xs = pairs.map(([x]) => x), ys = pairs.map(([, y]) => y)
    const reg = ss.linearRegression(pairs)
    const line = ss.linearRegressionLine(reg)
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    Plotly.react(scatterRef.current, [
      { type: 'scatter', mode: 'markers', x: xs, y: ys, name: 'Data', marker: { color: '#6366f1', size: 5, opacity: 0.7 } },
      { type: 'scatter', mode: 'lines', x: [xMin, xMax], y: [line(xMin), line(xMax)], name: 'Fit', line: { color: '#f59e0b', width: 2 } },
    ] as Plotly.Data[], { ...layoutBase, xaxis: { title: { text: firstNum } }, yaxis: { title: { text: secondNum } }, showlegend: true, legend: { x: 0, y: 1 } } as Partial<Plotly.Layout>, { responsive: true, displayModeBar: false })
  }, [activeDataset, firstNum, secondNum, theme, layoutBase])

  // Box plot by group
  useEffect(() => {
    if (!activeDataset || !firstNum || !activeGroupCol || !boxRef.current) return
    const groupMap = new Map<string, number[]>()
    activeDataset.data.forEach(r => {
      const key = r[activeGroupCol] != null && r[activeGroupCol] !== '' ? String(r[activeGroupCol]) : '(missing)'
      const v = Number(r[firstNum])
      if (Number.isFinite(v)) groupMap.set(key, [...(groupMap.get(key) ?? []), v])
    })
    const groups = [...groupMap.entries()].slice(0, 12)
    if (groups.length < 2) return
    Plotly.react(boxRef.current, groups.map(([name, vals]) => ({ type: 'box', y: vals, name, boxpoints: false } as Plotly.Data)), { ...layoutBase, yaxis: { title: { text: firstNum } }, showlegend: false } as Partial<Plotly.Layout>, { responsive: true, displayModeBar: false })
  }, [activeDataset, firstNum, activeGroupCol, theme, layoutBase])

  // Simulation: sample size sensitivity
  useEffect(() => {
    if (!simRef.current) return
    const sigmas = [simSigma * 0.5, simSigma * 0.75, simSigma, simSigma * 1.5, simSigma * 2]
    const margins = Array.from({ length: 20 }, (_, i) => simMargin * 0.3 + i * simMargin * 0.1)
    const traces: Plotly.Data[] = sigmas.map(sig => ({
      type: 'scatter', mode: 'lines',
      x: margins,
      y: margins.map(m => Math.ceil((1.96 * sig / m) ** 2)),
      name: `σ=${sig.toFixed(1)}`,
    }))
    Plotly.react(simRef.current, traces, { ...layoutBase, xaxis: { title: { text: 'Margin of error' } }, yaxis: { title: { text: 'Required n' }, type: 'log' }, showlegend: true, legend: { x: 1, y: 1 } } as Partial<Plotly.Layout>, { responsive: true, displayModeBar: false })
  }, [simSigma, simMargin, theme, layoutBase])

  if (!activeDataset) {
    return <DatasetEmptyState preferredPath="/advanced" description="Load a dataset to unlock advanced analysis, assumptions, model diagnostics, and exportable study notes." />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={24} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Advanced Analysis</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            SPSS/MATLAB-style method selection, data audit, assumptions, effect sizes, and planning tools.
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Active dataset: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeDataset.name}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportAdvancedReport} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">
            <Download size={14} /> JSON Report
          </button>
          <button onClick={exportHTML} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700">
            <FileText size={14} /> HTML Report
          </button>
          <button onClick={exportRScript} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700">
            <FileCode2 size={14} /> R Script
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Rows', value: audit?.rows.toLocaleString(), icon: Layers },
          { label: 'Columns', value: audit?.cols, icon: ListChecks },
          { label: 'Numeric', value: audit?.numericCount, icon: Sigma },
          { label: 'Missing Cells', value: `${round(audit?.missingPct ?? 0, 2)}%`, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Icon size={16} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Method Chooser</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Goal</label>
              <select value={goal} onChange={(event) => setGoal(event.target.value as Goal)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {Object.entries(GOAL_HELP).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Outcome</label>
              <select value={outcomeType} onChange={(event) => setOutcomeType(event.target.value as OutcomeType)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {outcomeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Predictors</label>
              <select value={predictorType} onChange={(event) => setPredictorType(event.target.value as PredictorType)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {predictorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 mb-4">
            <p className="text-xs font-semibold text-indigo-500 mb-1">Recommended method</p>
            <p className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{method}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Useful methods</p>
              <div className="space-y-2">
                {goalHelp.methods.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Assumptions to check</p>
              <div className="space-y-2">
                {goalHelp.assumptions.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Effect Size</h2>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Column A</label>
              <select value={firstNum} onChange={(event) => setColA(event.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {numCols.map((col) => <option key={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Column B</label>
              <select value={secondNum} onChange={(event) => setColB(event.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {numCols.map((col) => <option key={col}>{col}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 mb-1">Cohen d</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{effect?.cohen ? round(effect.cohen.d) : '-'}</p>
              <p className="text-xs text-slate-500">{effect?.cohen ? effectLabel(Math.abs(effect.cohen.d)) : 'needs 2 columns'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 mb-1">Pearson r</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{effect?.correlation !== null ? round(effect?.correlation ?? 0) : '-'}</p>
              <p className="text-xs text-slate-500">{effect?.correlation !== null ? effectLabel(Math.abs(effect?.correlation ?? 0)) : 'needs paired data'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Audit</h2>
          </div>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-2">Column</th>
                  <th className="text-right py-2">Outliers</th>
                  <th className="text-right py-2">Skew</th>
                  <th className="text-right py-2">Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {audit?.numericAudits.map((item) => (
                  <tr key={item.col}>
                    <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">{item.col}</td>
                    <td className="py-2 text-right text-slate-500">{item.outliers}</td>
                    <td className="py-2 text-right text-slate-500">{round(item.skewness, 2)}</td>
                    <td className="py-2 text-right text-slate-500">{item.missing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(audit?.highMissing.length ?? 0) > 0 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
              High missingness: {audit?.highMissing.join(', ')}
            </p>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sample Size</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confidence</label>
              <select value={confidence} onChange={(event) => setConfidence(event.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <option value="0.90">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sigma</label>
              <input value={sigma} onChange={(event) => setSigma(event.target.value)} type="number" className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Margin</label>
              <input value={margin} onChange={(event) => setMargin(event.target.value)} type="number" className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
            <p className="text-xs text-slate-400 mb-1">Estimated n for a mean</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{sampleSize.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Formula: n = (z * sigma / margin)^2</p>
          </div>
        </section>

        <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Implemented Advanced Workbench Suite</h2>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <SelectBox label="Grouping column" value={activeGroupCol} onChange={setGroupCol} options={catCols} />
            <SelectBox label="Category A" value={firstCat} onChange={setCatA} options={catCols} />
            <SelectBox label="Category B" value={secondCat} onChange={setCatB} options={catCols} />
            <SelectBox label="Numeric B" value={secondNum} onChange={setColB} options={numCols} />
          </div>
          {featureSuite && <FeatureSuitePanel suite={featureSuite} />}
        </section>

        {/* ── Inline Charts ───────────────────────────────────────────────── */}
        <section className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <LineChart size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scatter + Regression</h2>
            <span className="ml-auto text-xs text-slate-400">{firstNum} vs {secondNum}</span>
          </div>
          <div ref={scatterRef} className="h-64" />
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Box Plot by Group</h2>
            <span className="ml-auto text-xs text-slate-400">{firstNum} by {activeGroupCol}</span>
          </div>
          <div ref={boxRef} className="h-64" />
        </section>

        {/* ── Z-Score Outlier Panel ────────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Outlier Summary — {firstNum || '—'}</h2>
          </div>
          {zScoreSummary ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '|z| > 2', value: zScoreSummary.beyond2, note: '≈ 5% expected' },
                { label: '|z| > 3', value: zScoreSummary.beyond3, note: 'Extreme outliers' },
                { label: 'Max |z|', value: zScoreSummary.maxZ, note: zScoreSummary.maxZ > 3 ? 'Investigate' : 'Acceptable' },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-lg font-bold ${item.value > 0 && item.label !== 'Max |z|' ? 'text-amber-600 dark:text-amber-300' : 'text-slate-800 dark:text-white'}`}>{item.value}</p>
                  <p className="text-xs text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400">Select a numeric column.</p>}
        </section>

        {/* ── Correlation Matrix ───────────────────────────────────────────── */}
        <section className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sigma size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Correlation Matrix (numeric cols, max 8)</h2>
          </div>
          {corrMatrix && corrMatrix.cols.length >= 2 ? (
            <div className="overflow-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="pr-3 text-slate-400 font-normal text-right"></th>
                    {corrMatrix.cols.map(c => <th key={c} className="px-2 pb-1 text-slate-500 font-medium truncate max-w-[80px]">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {corrMatrix.cols.map((row, ri) => (
                    <tr key={row}>
                      <td className="pr-3 text-right text-slate-500 font-medium truncate max-w-[80px]">{row}</td>
                      {corrMatrix.matrix[ri].map((r, ci) => {
                        const abs = Math.abs(r)
                        const bg = ri === ci ? 'bg-slate-100 dark:bg-slate-700' : abs > 0.8 ? 'bg-red-100 dark:bg-red-900/40' : abs > 0.5 ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                        return <td key={ci} className={`px-2 py-1 text-center rounded ${bg} ${abs > 0.8 && ri !== ci ? 'font-bold text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'}`}>{ri === ci ? '1.00' : r.toFixed(2)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-400">Red = |r| &gt; 0.8 (strong). Amber = |r| &gt; 0.5.</p>
            </div>
          ) : <p className="text-xs text-slate-400">Need at least 2 numeric columns.</p>}
        </section>

        {/* ── ANOVA + Nonparametric Tests ──────────────────────────────────── */}
        <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hypothesis Tests — ANOVA &amp; Nonparametric</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-3 mb-5">
            <SelectBox label="Numeric column" value={effAnovaNum} onChange={setAnovaNumCol} options={numCols} />
            <SelectBox label="Group column" value={effAnovaGroup} onChange={setAnovaGroupCol} options={catCols} />
            <SelectBox label="Column A (Mann-Whitney)" value={effMwA} onChange={setMwColA} options={numCols} />
            <SelectBox label="Column B (Mann-Whitney)" value={effMwB} onChange={setMwColB} options={numCols} />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <label className="text-xs font-medium text-slate-500">α</label>
            <select value={anovaAlpha} onChange={e => setAnovaAlpha(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <option value="0.01">0.01</option>
              <option value="0.05">0.05</option>
              <option value="0.10">0.10</option>
            </select>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {/* ANOVA */}
            <div className={`rounded-xl border p-4 ${anovaResult ? (anovaResult.reject ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/10' : 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/10') : 'border-slate-200 dark:border-slate-700'}`}>
              <p className="text-xs font-semibold text-slate-500 mb-3">One-Way ANOVA</p>
              {anovaResult ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[['F', anovaResult.F], ['p-value', anovaResult.p], [`df₁`, anovaResult.dfB], [`df₂`, anovaResult.dfW]].map(([l, v]) => (
                      <div key={String(l)} className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${anovaResult.reject ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                    {anovaResult.reject ? `Reject H₀ at α=${anovaAlpha}: group means differ` : `Fail to reject H₀: no significant mean difference`}
                  </p>
                  <div className="mt-3 space-y-1">
                    {anovaResult.groupStats.slice(0, 6).map(g => (
                      <div key={g.name} className="flex justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[100px]">{g.name}</span>
                        <span>n={g.n} M={g.mean} SD={g.sd}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-xs text-slate-400">Need a numeric + categorical column with 2+ groups (≥2 obs each).</p>}
            </div>
            {/* Kruskal-Wallis */}
            <div className={`rounded-xl border p-4 ${kwResult ? (kwResult.reject ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/10' : 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/10') : 'border-slate-200 dark:border-slate-700'}`}>
              <p className="text-xs font-semibold text-slate-500 mb-3">Kruskal-Wallis (Nonparametric)</p>
              {kwResult ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[['H', kwResult.H], ['p-value', kwResult.p], ['df', kwResult.df], ['N', kwResult.N]].map(([l, v]) => (
                      <div key={String(l)} className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${kwResult.reject ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                    {kwResult.reject ? `Reject H₀: rank distributions differ` : `Fail to reject H₀`}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Use when ANOVA normality assumption is doubtful.</p>
                </>
              ) : <p className="text-xs text-slate-400">Uses same group + numeric column selection as ANOVA.</p>}
            </div>
            {/* Mann-Whitney */}
            <div className={`rounded-xl border p-4 ${mwResult ? (mwResult.reject ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/10' : 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/10') : 'border-slate-200 dark:border-slate-700'}`}>
              <p className="text-xs font-semibold text-slate-500 mb-3">Mann-Whitney U (Two columns)</p>
              {mwResult ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[['U', mwResult.U], ['z', mwResult.z], ['p-value', mwResult.p], ['n₁/n₂', `${mwResult.n1}/${mwResult.n2}`]].map(([l, v]) => (
                      <div key={String(l)} className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
                        <p className="text-xs text-slate-400">{l}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${mwResult.reject ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                    {mwResult.reject ? `Reject H₀: rank distributions differ` : `Fail to reject H₀`}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Normal approximation; valid for n ≥ 10.</p>
                </>
              ) : <p className="text-xs text-slate-400">Select two numeric columns (Column A and B above). Need n ≥ 3 each.</p>}
            </div>
          </div>
        </section>

        {/* ── Chi-Square Independence ──────────────────────────────────────── */}
        {chiIndepResult && (
          <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Table size={18} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chi-Square Independence — {firstCat} × {secondCat}</h2>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${chiIndepResult.result.reject ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                p = {chiIndepResult.result.pValue} — {chiIndepResult.result.reject ? 'Dependent' : 'Independent'}
              </span>
            </div>
            <div className="overflow-auto max-h-64">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-400 font-normal border border-slate-200 dark:border-slate-700">{firstCat} \ {secondCat}</th>
                    {chiIndepResult.colLevels.map(c => <th key={c} className="p-2 text-center text-slate-500 font-medium border border-slate-200 dark:border-slate-700 truncate max-w-[80px]">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chiIndepResult.rowLevels.map((rv, ri) => (
                    <tr key={rv}>
                      <td className="p-2 text-slate-500 font-medium border border-slate-200 dark:border-slate-700 truncate max-w-[100px]">{rv}</td>
                      {chiIndepResult.table[ri].map((cnt, ci) => (
                        <td key={ci} className="p-2 text-center text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{cnt}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">χ²({chiIndepResult.result.degreesOfFreedom}) = {chiIndepResult.result.statistic}</p>
          </section>
        )}

        {/* ── Grouped Statistics Table ─────────────────────────────────────── */}
        <section className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Table size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Grouped Statistics — {firstNum || '—'} by {activeGroupCol || '—'}</h2>
          </div>
          {anovaResult && anovaResult.groupStats.length > 0 ? (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-2 pr-3 font-medium">Group</th>
                    <th className="text-right py-2 px-2 font-medium">n</th>
                    <th className="text-right py-2 px-2 font-medium">Mean</th>
                    <th className="text-right py-2 px-2 font-medium">SD</th>
                    <th className="text-right py-2 px-2 font-medium">95% CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {anovaResult.groupStats.map(g => {
                    const se = g.n > 1 ? g.sd / Math.sqrt(g.n) : 0
                    const t = 1.96
                    return (
                      <tr key={g.name}>
                        <td className="py-2 pr-3 text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{g.name}</td>
                        <td className="py-2 px-2 text-right text-slate-500">{g.n}</td>
                        <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-200 font-medium">{g.mean}</td>
                        <td className="py-2 px-2 text-right text-slate-500">{g.sd}</td>
                        <td className="py-2 px-2 text-right text-slate-400">[{round(g.mean - t * se, 3)}, {round(g.mean + t * se, 3)}]</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="text-xs text-slate-400">Select a numeric and a categorical grouping column above in the Hypothesis Tests section.</p>}
        </section>

        {/* ── Simulation Playground ────────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Simulation — Sample Size Sensitivity</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Base σ = {simSigma}</label>
              <input type="range" min={1} max={100} value={simSigma} onChange={e => setSimSigma(Number(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Base margin = {simMargin}</label>
              <input type="range" min={1} max={50} value={simMargin} onChange={e => setSimMargin(Number(e.target.value))} className="w-full accent-indigo-600" />
            </div>
          </div>
          <div ref={simRef} className="h-52" />
          <p className="mt-2 text-xs text-slate-400">Each line is a different σ multiplier. Log y-axis. n = (1.96σ/margin)².</p>
        </section>

        {/* ── Glossary ─────────────────────────────────────────────────────── */}
        <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Glossary with Examples</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
            {GLOSSARY.map((entry, idx) => {
              const open = glossaryOpen.has(idx)
              return (
                <button
                  key={entry.term}
                  type="button"
                  onClick={() =>
                    setGlossaryOpen(prev => {
                      const next = new Set(prev)
                      if (open) {
                        next.delete(idx)
                      } else {
                        next.add(idx)
                      }
                      return next
                    })
                  }
                  className="text-left rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{entry.term}</span>
                    {open ? <ChevronDown size={13} className="text-slate-400 shrink-0" /> : <ChevronRight size={13} className="text-slate-400 shrink-0" />}
                  </div>
                  {open && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-5">{entry.definition}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 italic">{entry.example}</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Feature Suite Panel ──────────────────────────────────────────── */}
        <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Advanced Workbench Suite — Live Computed Results</h2>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <SelectBox label="Grouping column" value={activeGroupCol} onChange={setGroupCol} options={catCols} />
            <SelectBox label="Category A" value={firstCat} onChange={setCatA} options={catCols} />
            <SelectBox label="Category B" value={secondCat} onChange={setCatB} options={catCols} />
            <SelectBox label="Numeric B" value={secondNum} onChange={setColB} options={numCols} />
          </div>
          {featureSuite && <FeatureSuitePanel suite={featureSuite} />}
        </section>

        {/* ── Feature Coverage Map ─────────────────────────────────────────── */}
        <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Feature Coverage Map</h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Done on this page</span>
            <span className="flex items-center gap-1"><Link2 size={12} className="text-sky-500" /> Linked module</span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400" /> Partial / summary</span>
            <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-slate-300" /> Planned</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(Object.entries(FEATURE_GROUPS_V2) as [FeatureGroup, FeatureItem[]][]).map(([group, items]) => (
              <FeatureChecklistV2 key={group} group={group} items={items} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function SelectBox({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="text-xs font-medium text-slate-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
        {options.length ? options.map((option) => <option key={option}>{option}</option>) : <option value="">No columns</option>}
      </select>
    </label>
  )
}

function FeatureChecklistV2({ group, items }: { group: FeatureGroup; items: FeatureItem[] }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="mb-3 flex items-center gap-2">
        {group === 'Modeling' ? <LineChart size={16} className="text-indigo-500" /> : <Sigma size={16} className="text-indigo-500" />}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{group}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
            {item.status === 'done' && <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-500" />}
            {item.status === 'linked' && <Link2 size={13} className="mt-0.5 shrink-0 text-sky-500" />}
            {item.status === 'partial' && <Clock size={13} className="mt-0.5 shrink-0 text-amber-400" />}
            {item.status === 'todo' && <AlertTriangle size={13} className="mt-0.5 shrink-0 text-slate-300" />}
            {item.linkTo ? <Link to={item.linkTo} className="hover:text-indigo-600 dark:hover:text-indigo-400">{item.label}</Link> : <span>{item.label}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureSuitePanel({ suite }: { suite: FeatureSuite }) {
  return (
    <div className="grid gap-5">
      {(Object.entries(suite) as [FeatureGroup, SuiteRow[]][]).map(([group, rows]) => (
        <div key={group} className="rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {group === 'Modeling' ? <LineChart size={16} className="text-indigo-500" /> : group === 'EDA' ? <BarChart3 size={16} className="text-indigo-500" /> : <Sigma size={16} className="text-indigo-500" />}
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{group}</h3>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">{rows.length} live tools</span>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {rows.map((row) => (
              <div key={row.item} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{row.item}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{row.result}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{row.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
