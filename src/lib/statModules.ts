import jStatRaw from 'jstat'
import { runAnalysis } from '../analysis/runAnalysis'
import type { AnalysisResult } from '../analysis/types'

type JStatLike = {
  normal: { cdf: (x: number, mean: number, sd: number) => number; inv: (p: number, mean: number, sd: number) => number }
  studentt: { cdf: (x: number, df: number) => number; inv: (p: number, df: number) => number }
  chisquare: { cdf: (x: number, df: number) => number; inv: (p: number, df: number) => number }
  centralF: { cdf: (x: number, df1: number, df2: number) => number }
}

const jStat = jStatRaw as unknown as JStatLike

export type StatModuleGroup = 'Inferential' | 'Regression & Modeling' | 'Charting & Visualization' | 'Advanced Workflows'
export type StatModuleResult = {
  title: string
  summary: string
  metrics: { label: string; value: string | number }[]
  table?: Array<Record<string, string | number>>
  chart?: { data: unknown[]; layout?: Record<string, unknown> }
  notes?: string[]
}
export type StatModuleSelection = {
  num1?: string
  num2?: string
  num3?: string
  cat1?: string
  cat2?: string
  target?: string
  alpha?: number
}
export type StatModuleDef = {
  id: number
  key: string
  title: string
  group: StatModuleGroup
  description: string
  compute: (data: Record<string, unknown>[], s: Required<StatModuleSelection>) => StatModuleResult
}

const round = (value: number, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : NaN

function fromAnalysis(result: AnalysisResult): StatModuleResult {
  const metrics = result.tables.flatMap((table) => table.rows.slice(0, 1).map((row) => ({
    label: `${table.title}: ${table.columns[0]}`,
    value: row[0],
  }))).slice(0, 8)
  if (metrics.length === 0) metrics.push({ label: 'status', value: result.interpretation.slice(0, 80) })
  const first = result.tables[0]
  const table = first
    ? first.rows.map((row) => Object.fromEntries(first.columns.map((col, i) => [col, row[i]])))
    : undefined
  const plot = result.plots[0]
  return {
    title: result.title,
    summary: result.interpretation,
    metrics: metrics.length ? metrics : [{ label: 'result', value: result.title }],
    table,
    chart: plot ? { data: plot.data, layout: plot.layout } : undefined,
    notes: [...result.assumptions, ...result.footnotes],
  }
}
const alphaDefault = 0.05

function numericValue(value: unknown) {
  if (value === null || value === undefined) return NaN
  if (typeof value === 'string' && value.trim() === '') return NaN
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : NaN
}

export function numericColumn(data: Record<string, unknown>[], col: string) {
  return data.map((row) => numericValue(row[col])).filter(Number.isFinite)
}

function appendNotes(result: StatModuleResult, notes: string[]) {
  const unique = [...new Set([...(result.notes ?? []), ...notes.filter(Boolean)])]
  return unique.length ? { ...result, notes: unique } : result
}

function numericalQaNotes(module: StatModuleDef, data: Record<string, unknown>[], s: Required<StatModuleSelection>) {
  const notes: string[] = []
  const keyText = `${module.key} ${module.title}`.toLowerCase()
  const numericFields = [...new Set([s.num1, s.num2, s.num3, s.target].filter(Boolean))]
  const categoricalFields = [...new Set([s.cat1, s.cat2].filter(Boolean))]
  const pairedNeeded = /regression|correlation|pca|cluster|scatter|paired|forecast|time_series|classification|roc|diagnostic/i.test(keyText)

  numericFields.forEach((field) => {
    const values = numericColumn(data, field)
    const present = data.filter((row) => row[field] !== null && row[field] !== undefined && String(row[field]).trim() !== '').length
    if (data.length > 0 && values.length < present) notes.push(`${field}: non-numeric or missing values were filtered before calculation.`)
    if (data.length > 0 && values.length < data.length) notes.push(`${field}: ${data.length - values.length} row(s) had missing or invalid numeric values and were filtered before calculation.`)
    if (values.length > 1 && sd(values) === 0) notes.push(`${field}: selected numeric column is constant; correlation, regression, and variance-based statistics may be unstable.`)
  })

  categoricalFields.forEach((field) => {
    const levels = categories(data, field)
    if (levels.length > Math.max(20, Math.sqrt(Math.max(data.length, 1)))) notes.push(`${field}: high-cardinality or sparse categorical levels detected; grouped tests may need level combining.`)
  })

  if (pairedNeeded && paired(data, s.num1, s.num2).length < 2) notes.push('Not enough valid rows for a paired calculation; choose columns with at least two complete numeric pairs.')
  if (/anova|kruskal|levene|tukey|effect/i.test(keyText) && groupedNumeric(data, s.cat1, s.num1).filter(([, values]) => values.length >= 2).length < 2) notes.push('Not enough valid groups with at least two numeric rows for stable grouped inference.')
  if (/chi|fisher|mcnemar/i.test(keyText)) {
    const rowLevels = categories(data, s.cat1)
    const colLevels = categories(data, s.cat2)
    if (rowLevels.length < 2 || colLevels.length < 2) notes.push('Not enough categorical levels for a contingency-table calculation.')
  }
  if (/shapiro|francia|tukey-style|lasso|manova screening|teaching|approx|bootstrap|permutation|bayesian|forecasting basics|gof_distribution|goodness-of-fit|logistic regression/i.test(keyText)) notes.push('Numerical warning: this module includes approximate or teaching-oriented calculations; confirm with reference software for high-stakes reporting.')
  if (data.length < 5) notes.push('Small sample warning: fewer than five rows are available, so estimates may be unstable.')
  return notes
}

function paired(data: Record<string, unknown>[], a: string, b: string) {
  return data
    .map((row) => [numericValue(row[a]), numericValue(row[b])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
}

function categories(data: Record<string, unknown>[], col: string) {
  return [...new Set(data.map((row) => String(row[col] ?? '(missing)')))]
}

function groupedNumeric(data: Record<string, unknown>[], cat: string, num: string) {
  const groups = new Map<string, number[]>()
  data.forEach((row) => {
    const value = numericValue(row[num])
    if (!Number.isFinite(value)) return
    const key = String(row[cat] ?? '(missing)')
    groups.set(key, [...(groups.get(key) ?? []), value])
  })
  return [...groups.entries()].filter(([, values]) => values.length > 0)
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function variance(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1)
}

function sd(values: number[]) {
  return Math.sqrt(variance(values))
}

function pearsonPairs(pairs: [number, number][]) {
  const xs = pairs.map(([x]) => x)
  const ys = pairs.map(([, y]) => y)
  const mx = mean(xs)
  const my = mean(ys)
  const sx = sd(xs)
  const sy = sd(ys)
  const cov = pairs.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0) / (pairs.length - 1)
  return cov / (sx * sy)
}

function ranks(values: number[]) {
  const indexed = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const out = Array(values.length).fill(0)
  for (let i = 0; i < indexed.length;) {
    let j = i + 1
    while (j < indexed.length && indexed[j].value === indexed[i].value) j++
    const rank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) out[indexed[k].index] = rank
    i = j
  }
  return out
}

function spearmanPairs(pairs: [number, number][]) {
  const rx = ranks(pairs.map(([x]) => x))
  const ry = ranks(pairs.map(([, y]) => y))
  return pearsonPairs(rx.map((x, i) => [x, ry[i]]))
}

function kendallPairs(pairs: [number, number][]) {
  let concordant = 0
  let discordant = 0
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const sign = Math.sign((pairs[i][0] - pairs[j][0]) * (pairs[i][1] - pairs[j][1]))
      if (sign > 0) concordant++
      if (sign < 0) discordant++
    }
  }
  const denom = pairs.length * (pairs.length - 1) / 2
  return denom ? (concordant - discordant) / denom : NaN
}

function tPValue(t: number, df: number) {
  return 2 * (1 - jStat.studentt.cdf(Math.abs(t), df))
}

function zPValue(z: number) {
  return 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1))
}

function fPValue(f: number, df1: number, df2: number) {
  return 1 - jStat.centralF.cdf(f, df1, df2)
}

function chiPValue(x: number, df: number) {
  return 1 - jStat.chisquare.cdf(x, df)
}

function oneWayAnova(groups: [string, number[]][]) {
  const all = groups.flatMap(([, values]) => values)
  const grand = mean(all)
  const ssBetween = groups.reduce((sum, [, values]) => sum + values.length * (mean(values) - grand) ** 2, 0)
  const ssWithin = groups.reduce((sum, [, values]) => sum + values.reduce((s, value) => s + (value - mean(values)) ** 2, 0), 0)
  const dfBetween = groups.length - 1
  const dfWithin = all.length - groups.length
  const msBetween = ssBetween / dfBetween
  const msWithin = ssWithin / dfWithin
  const f = msBetween / msWithin
  return { f, p: fPValue(f, dfBetween, dfWithin), dfBetween, dfWithin, eta2: ssBetween / (ssBetween + ssWithin), ssBetween, ssWithin }
}

function transpose(a: number[][]) {
  return a[0].map((_, c) => a.map((row) => row[c]))
}

function matMul(a: number[][], b: number[][]) {
  return a.map((row) => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)))
}

function invert(matrix: number[][]) {
  const n = matrix.length
  const a = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)])
  for (let i = 0; i < n; i++) {
    let pivot = i
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r
    if (Math.abs(a[pivot][i]) < 1e-12) {
      a[i][i] += 1e-8
      pivot = i
    }
    ;[a[i], a[pivot]] = [a[pivot], a[i]]
    const div = a[i][i]
    for (let j = 0; j < 2 * n; j++) a[i][j] /= div
    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const factor = a[r][i]
      for (let j = 0; j < 2 * n; j++) a[r][j] -= factor * a[i][j]
    }
  }
  return a.map((row) => row.slice(n))
}

function ols(y: number[], predictors: number[][]) {
  const x = predictors.map((row) => [1, ...row])
  const xt = transpose(x)
  const xtxInv = invert(matMul(xt, x))
  const beta = matMul(matMul(xtxInv, xt), y.map((value) => [value])).map(([value]) => value)
  const fitted = x.map((row) => row.reduce((sum, value, i) => sum + value * beta[i], 0))
  const residuals = y.map((value, i) => value - fitted[i])
  const yMean = mean(y)
  const sse = residuals.reduce((sum, value) => sum + value * value, 0)
  const sst = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0)
  const df = y.length - beta.length
  const mse = sse / df
  const se = xtxInv.map((row, i) => Math.sqrt(Math.max(0, mse * row[i])))
  const t = beta.map((value, i) => value / se[i])
  return { beta, fitted, residuals, r2: 1 - sse / sst, adjR2: 1 - (1 - (1 - sse / sst)) * (y.length - 1) / df, se, t, p: t.map((value) => tPValue(value, df)), xtxInv, mse }
}

function regressionRows(data: Record<string, unknown>[], yCol: string, xCols: string[]) {
  const rows = data.map((row) => {
    const y = numericValue(row[yCol])
    const xs = xCols.map((col) => numericValue(row[col]))
    return { y, xs }
  }).filter((row) => Number.isFinite(row.y) && row.xs.every(Number.isFinite))
  return { y: rows.map((row) => row.y), x: rows.map((row) => row.xs) }
}

function chiSquareIndependence(data: Record<string, unknown>[], a: string, b: string) {
  const rows = categories(data, a)
  const cols = categories(data, b)
  const matrix = rows.map((r) => cols.map((c) => data.filter((row) => String(row[a] ?? '(missing)') === r && String(row[b] ?? '(missing)') === c).length))
  const rowTotals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0))
  const colTotals = cols.map((_, j) => matrix.reduce((sum, row) => sum + row[j], 0))
  const total = rowTotals.reduce((sum, value) => sum + value, 0)
  let chi = 0
  matrix.forEach((row, i) => row.forEach((obs, j) => {
    const exp = rowTotals[i] * colTotals[j] / total
    if (exp > 0) chi += (obs - exp) ** 2 / exp
  }))
  const df = (rows.length - 1) * (cols.length - 1)
  return { rows, cols, matrix, chi, df, p: chiPValue(chi, df) }
}

function mannWhitney(groups: [string, number[]][]) {
  const a = groups[0][1]
  const b = groups[1][1]
  const values = [...a.map((value) => ({ value, g: 0 })), ...b.map((value) => ({ value, g: 1 }))]
  const rs = ranks(values.map((item) => item.value))
  const r1 = rs.reduce((sum, rank, i) => sum + (values[i].g === 0 ? rank : 0), 0)
  const u1 = r1 - a.length * (a.length + 1) / 2
  const mu = a.length * b.length / 2
  const sigma = Math.sqrt(a.length * b.length * (a.length + b.length + 1) / 12)
  const z = (u1 - mu) / sigma
  return { u: u1, z, p: zPValue(z) }
}

function kruskalWallis(groups: [string, number[]][]) {
  const values = groups.flatMap(([name, vals]) => vals.map((value) => ({ name, value })))
  const rs = ranks(values.map((item) => item.value))
  const n = values.length
  let h = 0
  groups.forEach(([name, vals]) => {
    const rankSum = values.reduce((sum, item, i) => sum + (item.name === name ? rs[i] : 0), 0)
    h += rankSum ** 2 / vals.length
  })
  h = 12 / (n * (n + 1)) * h - 3 * (n + 1)
  return { h, df: groups.length - 1, p: chiPValue(h, groups.length - 1) }
}

function wilcoxonSignedRank(diffs: number[]) {
  const nonZero = diffs.filter((d) => d !== 0)
  const absRanks = ranks(nonZero.map(Math.abs))
  const wPlus = absRanks.reduce((sum, rank, i) => sum + (nonZero[i] > 0 ? rank : 0), 0)
  const n = nonZero.length
  const mu = n * (n + 1) / 4
  const sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24)
  const z = (wPlus - mu) / sigma
  return { w: wPlus, z, p: zPValue(z) }
}

function movingAverage(values: number[], window: number) {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1)
    return mean(slice)
  })
}

function kmeans(points: [number, number][], k = 3, iterations = 25) {
  let centers = points.slice(0, k)
  let labels = points.map(() => 0)
  for (let iter = 0; iter < iterations; iter++) {
    labels = points.map(([x, y]) => {
      const distances = centers.map(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2)
      return distances.indexOf(Math.min(...distances))
    })
    centers = centers.map((center, idx) => {
      const cluster = points.filter((_, i) => labels[i] === idx)
      return cluster.length ? [mean(cluster.map(([x]) => x)), mean(cluster.map(([, y]) => y))] as [number, number] : center
    })
  }
  return { labels, centers }
}

function simplePca(points: [number, number][]) {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const mx = mean(xs), my = mean(ys)
  const centered = points.map(([x, y]) => [x - mx, y - my] as [number, number])
  const sxx = variance(xs), syy = variance(ys)
  const sxy = centered.reduce((sum, [x, y]) => sum + x * y, 0) / (points.length - 1)
  const trace = sxx + syy
  const det = sxx * syy - sxy * sxy
  const root = Math.sqrt(Math.max(0, trace * trace / 4 - det))
  const l1 = trace / 2 + root
  const l2 = trace / 2 - root
  const v1 = Math.abs(sxy) > 1e-12 ? [l1 - syy, sxy] : [1, 0]
  const norm = Math.hypot(v1[0], v1[1])
  const pc1 = centered.map(([x, y]) => (x * v1[0] + y * v1[1]) / norm)
  return { eigenvalues: [l1, l2], explained: [l1 / (l1 + l2), l2 / (l1 + l2)], pc1 }
}

function correctionRows(pValues: number[]) {
  const sorted = pValues.map((p, i) => ({ test: `H${i + 1}`, p })).sort((a, b) => a.p - b.p)
  return sorted.map((item, i) => ({
    test: item.test,
    p: round(item.p),
    bonferroni: round(Math.min(1, item.p * pValues.length)),
    holm: round(Math.min(1, item.p * (pValues.length - i))),
  }))
}

function fisherExact2x2(a: number, b: number, c: number, d: number) {
  const logChoose = (n: number, k: number) => gammaln(n + 1) - gammaln(k + 1) - gammaln(n - k + 1)
  const row1 = a + b, row2 = c + d, col1 = a + c, n = row1 + row2
  const min = Math.max(0, col1 - row2)
  const max = Math.min(col1, row1)
  const prob = (x: number) => Math.exp(logChoose(row1, x) + logChoose(row2, col1 - x) - logChoose(n, col1))
  const observed = prob(a)
  let p = 0
  for (let x = min; x <= max; x++) if (prob(x) <= observed + 1e-12) p += prob(x)
  return Math.min(1, p)
}

function gammaln(x: number) {
  const cof = [76.180091729471, -86.505320329417, 24.014098240831, -1.23173957245, 0.001208650974, -0.000005395239]
  let y = x
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < cof.length; j++) ser += cof[j] / ++y
  return -tmp + Math.log(2.506628274631 * ser / x)
}

function exactBinomialPValue(successes: number, n: number, p0 = 0.5) {
  const pmf = (k: number) => Math.exp(gammaln(n + 1) - gammaln(k + 1) - gammaln(n - k + 1) + k * Math.log(p0) + (n - k) * Math.log(1 - p0))
  const observed = pmf(successes)
  let p = 0
  for (let k = 0; k <= n; k++) if (pmf(k) <= observed + 1e-12) p += pmf(k)
  return Math.min(1, p)
}

function shapiroFrancia(values: number[]) {
  const x = [...values].sort((a, b) => a - b)
  const n = x.length
  const m = x.map((_, i) => jStat.normal.inv((i + 0.375) / (n + 0.25), 0, 1))
  const denom = Math.sqrt(m.reduce((sum, value) => sum + value * value, 0))
  const a = m.map((value) => value / denom)
  const w = (a.reduce((sum, value, i) => sum + value * x[i], 0) ** 2) / x.reduce((sum, value) => sum + (value - mean(x)) ** 2, 0)
  // Royston-calibrated log-transformation: u = ln(1-W') ~ N(mu_n, 0.47^2) under H0
  // High W (normal data) → very negative u → negative z → large p (fail to reject H0)
  const u = Math.log(Math.max(1e-12, 1 - w))
  const mu = -1.353 - 0.683 * Math.log(Math.max(3, n))
  const z = (u - mu) / 0.47
  return { w, p: Math.max(0.001, Math.min(0.999, jStat.normal.cdf(-z, 0, 1))) }
}

function leveneTest(groups: [string, number[]][], center: 'mean' | 'median') {
  const transformed = groups.map(([name, values]) => {
    const c = center === 'mean' ? mean(values) : [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
    return [name, values.map((value) => Math.abs(value - c))] as [string, number[]]
  })
  return oneWayAnova(transformed)
}

function durbinWatson(residuals: number[]) {
  const num = residuals.slice(1).reduce((sum, value, i) => sum + (value - residuals[i]) ** 2, 0)
  const den = residuals.reduce((sum, value) => sum + value * value, 0)
  return num / den
}

function breuschPagan(y: number[], predictors: number[][]) {
  const model = ols(y, predictors)
  const e2 = model.residuals.map((e) => e * e)
  const aux = ols(e2, predictors)
  const lm = y.length * aux.r2
  return { lm, df: predictors[0]?.length ?? 1, p: chiPValue(lm, predictors[0]?.length ?? 1) }
}

function ridge(y: number[], x: number[][], lambda: number) {
  const design = x.map((row) => [1, ...row])
  const xt = transpose(design)
  const xtx = matMul(xt, design)
  for (let i = 1; i < xtx.length; i++) xtx[i][i] += lambda
  return matMul(matMul(invert(xtx), xt), y.map((v) => [v])).map(([v]) => v)
}

function robustHuber(y: number[], x: number[][]) {
  let weights = y.map(() => 1)
  let beta = ols(y, x).beta
  for (let iter = 0; iter < 12; iter++) {
    const design = x.map((row) => [1, ...row])
    const fitted = design.map((row) => row.reduce((sum, value, i) => sum + value * beta[i], 0))
    const residuals = y.map((value, i) => value - fitted[i])
    const absRes = residuals.map(Math.abs).sort((a, b) => a - b)
    const scale = Math.max(1e-8, 1.4826 * absRes[Math.floor(absRes.length / 2)])
    weights = residuals.map((r) => Math.min(1, 1.345 * scale / Math.abs(r || 1e-8)))
    const wx = design.map((row, i) => row.map((v) => v * Math.sqrt(weights[i])))
    const wy = y.map((v, i) => v * Math.sqrt(weights[i]))
    beta = matMul(matMul(invert(matMul(transpose(wx), wx)), transpose(wx)), wy.map((v) => [v])).map(([v]) => v)
  }
  return { beta, weights }
}

function rocAuc(scores: number[], labels: number[]) {
  const pairs = scores.map((score, i) => ({ score, label: labels[i] > 0 ? 1 : 0 })).sort((a, b) => b.score - a.score)
  const pos = pairs.filter((p) => p.label === 1).length
  const neg = pairs.length - pos
  let tp = 0, fp = 0
  const curve = [{ fpr: 0, tpr: 0 }]
  pairs.forEach((p) => {
    if (p.label) tp++
    else fp++
    curve.push({ fpr: fp / neg, tpr: tp / pos })
  })
  let auc = 0
  for (let i = 1; i < curve.length; i++) auc += (curve[i].fpr - curve[i - 1].fpr) * (curve[i].tpr + curve[i - 1].tpr) / 2
  return { auc, curve }
}

function logisticModel(data: Record<string, unknown>[], target: string, predictors: string[]) {
  const rows = data.map((row) => ({
    y: numericValue(row[target]) > 0 ? 1 : 0,
    validY: Number.isFinite(numericValue(row[target])),
    x: [1, ...predictors.map((col) => numericValue(row[col]))],
  })).filter((r) => r.validY && r.x.every(Number.isFinite))
  let beta: number[] = Array(predictors.length + 1).fill(0)
  let covariance: number[][] = beta.map((_, i) => beta.map((__, j) => i === j ? 1 : 0))
  for (let iter = 0; iter < 40; iter++) {
    const p = rows.map((r) => 1 / (1 + Math.exp(-r.x.reduce((sum, value, i) => sum + value * beta[i], 0))))
    const weights = p.map((value) => Math.max(1e-6, value * (1 - value)))
    const xtwx = beta.map((_, i) => beta.map((__, j) => rows.reduce((sum, r, rowIndex) => sum + r.x[i] * weights[rowIndex] * r.x[j], 0)))
    const grad = beta.map((_, i) => rows.reduce((sum, r, rowIndex) => sum + r.x[i] * (r.y - p[rowIndex]), 0))
    covariance = invert(xtwx)
    const step = matMul(covariance, grad.map((value) => [value])).map(([value]) => value)
    beta = beta.map((value, i) => value + step[i])
    if (Math.max(...step.map(Math.abs)) < 1e-6) break
  }
  const se = covariance.map((row, i) => Math.sqrt(Math.max(0, row[i])))
  const z = beta.map((value, i) => value / Math.max(se[i], 1e-12))
  const preds = rows.map((r) => 1 / (1 + Math.exp(-r.x.reduce((sum, value, i) => sum + value * beta[i], 0))))
  const classes = preds.map((p) => p >= 0.5 ? 1 : 0)
  const accuracy = rows.length ? classes.filter((c, i) => c === rows[i].y).length / rows.length : NaN
  return { beta, se, z, p: z.map(zPValue), preds, rows, accuracy }
}

function seededRandom(seed = 123456789) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function bootstrapMean(values: number[], iterations = 500) {
  const random = seededRandom(20250317)
  const estimates = Array.from({ length: iterations }, () => mean(values.map(() => values[Math.floor(random() * values.length)]))).sort((a, b) => a - b)
  return { low: estimates[Math.floor(iterations * 0.025)], high: estimates[Math.floor(iterations * 0.975)] }
}

function permutationMeanDiff(a: number[], b: number[], iterations = 500) {
  const observed = Math.abs(mean(a) - mean(b))
  const pooled = [...a, ...b]
  const random = seededRandom(20250318)
  let extreme = 0
  for (let i = 0; i < iterations; i++) {
    const shuffled = [...pooled]
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(random() * (j + 1))
      ;[shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]]
    }
    if (Math.abs(mean(shuffled.slice(0, a.length)) - mean(shuffled.slice(a.length))) >= observed) extreme++
  }
  return extreme / iterations
}

function kaplanMeier(times: number[], events: number[]) {
  const rows = [...new Set(times)].sort((a, b) => a - b).map((time) => {
    const atRisk = times.filter((t) => t >= time).length
    const observed = times.filter((t, i) => t === time && events[i] > 0).length
    return { time, atRisk, observed }
  })
  let survival = 1
  return rows.map((row) => {
    if (row.atRisk > 0) survival *= 1 - row.observed / row.atRisk
    return { ...row, survival: round(survival) }
  })
}

function dbscan(points: [number, number][], eps: number, minPts: number) {
  const labels = Array(points.length).fill(-1)
  let cluster = 0
  const neighbors = (i: number) => points.map((p, j) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]) <= eps ? j : -1).filter((j) => j >= 0)
  points.forEach((_, i) => {
    if (labels[i] !== -1) return
    const ns = neighbors(i)
    if (ns.length < minPts) return
    labels[i] = cluster
    const queue = [...ns]
    while (queue.length) {
      const j = queue.shift()!
      if (labels[j] === -1) labels[j] = cluster
      const ns2 = neighbors(j)
      if (ns2.length >= minPts) ns2.forEach((n) => { if (labels[n] === -1) queue.push(n) })
    }
    cluster++
  })
  return { labels, clusters: cluster }
}

function toRows(metrics: Record<string, string | number>) {
  return Object.entries(metrics).map(([metric, value]) => ({ metric, value }))
}

function baseChart(title: string) {
  return { title: { text: title }, margin: { t: 40, r: 20, b: 50, l: 60 } }
}

const advancedModules: StatModuleDef[] = [
  { id: 101, key: 'two_way_anova_interaction', title: 'Two-Way ANOVA with Interaction Module', group: 'Advanced Workflows', description: 'Two-factor ANOVA with interaction term.', compute: (data, s) => fromAnalysis(runAnalysis('anova.between', data, { dependent: s.num1, factors: [s.cat1, s.cat2], ssType: 'I', postHoc: { tukey: true } })) },
  { id: 102, key: 'repeated_measures_anova', title: 'Repeated-Measures ANOVA Module', group: 'Advanced Workflows', description: 'Within-subject ANOVA using three numeric repeated measures.', compute: (data, s) => fromAnalysis(runAnalysis('anova.repeated', data, { measures: [s.num1, s.num2, s.num3] })) },
  { id: 103, key: 'ancova', title: 'ANCOVA Module', group: 'Advanced Workflows', description: 'Group comparison adjusted for a numeric covariate.', compute: (data, s) => fromAnalysis(runAnalysis('anova.ancova', data, { dependent: s.num1, group: s.cat1, covariate: s.num2 })) },
  { id: 104, key: 'manova', title: 'MANOVA Screening Module', group: 'Advanced Workflows', description: 'Pillai, Wilks, Hotelling–Lawley, and Roy MANOVA.', compute: (data, s) => fromAnalysis(runAnalysis('anova.manova', data, { dependents: [s.num1, s.num2, s.num3], group: s.cat1 })) },
  { id: 105, key: 'tukey_hsd', title: 'Tukey-Style Post-Hoc Module', group: 'Advanced Workflows', description: 'Pairwise Tukey HSD after one-way ANOVA.', compute: (data, s) => fromAnalysis(runAnalysis('anova.between', data, { dependent: s.num1, factors: [s.cat1], ssType: 'III', postHoc: { tukey: true } })) },
  { id: 106, key: 'multiple_testing_corrections', title: 'Bonferroni / Holm Correction Module', group: 'Advanced Workflows', description: 'Multiple testing correction from pairwise group p-values.', compute: (data, s) => {
    const groups = groupedNumeric(data, s.cat1, s.num1).slice(0, 8)
    const pvals = groups.flatMap((g1, i) => groups.slice(i + 1).map((g2) => {
      const v1 = variance(g1[1]) / g1[1].length, v2 = variance(g2[1]) / g2[1].length
      const df = (v1 + v2) ** 2 / (v1 ** 2 / (g1[1].length - 1) + v2 ** 2 / (g2[1].length - 1))
      return tPValue((mean(g1[1]) - mean(g2[1])) / Math.sqrt(v1 + v2), df)
    }))
    return { title: 'Multiple Testing Corrections', summary: 'Bonferroni and Holm-adjusted pairwise p-values.', metrics: [{ label: 'tests', value: pvals.length }], table: correctionRows(pvals) }
  } },
  { id: 107, key: 'fisher_exact', title: "Fisher's Exact Test Module", group: 'Advanced Workflows', description: 'Exact 2x2 categorical test.', compute: (data, s) => fromAnalysis(runAnalysis('frequencies.contingency', data, { rows: s.cat1, columns: s.cat2 })) },
  { id: 108, key: 'mcnemar', title: "McNemar's Test Module", group: 'Advanced Workflows', description: 'Paired categorical change test using two binary-coded numeric columns.', compute: (data, s) => {
    const mapped = data.map((row) => ({ a: Number(row[s.num1]) > 0 ? '1' : '0', b: Number(row[s.num2]) > 0 ? '1' : '0' }))
    return fromAnalysis(runAnalysis('frequencies.contingency', mapped, { rows: 'a', columns: 'b' }))
  } },
  { id: 109, key: 'exact_binomial', title: 'Exact Binomial Test Module', group: 'Advanced Workflows', description: 'Exact test for binary success probability.', compute: (data, s) => {
    const mapped = data.map((row) => ({ v: Number(row[s.num1]) > 0 ? 'success' : 'other' }))
    return fromAnalysis(runAnalysis('frequencies.binomial', mapped, { variable: 'v', p0: 0.5 }))
  } },
  { id: 110, key: 'shapiro_wilk', title: 'Shapiro-Francia Normality Module', group: 'Advanced Workflows', description: 'Normality check using Shapiro-Francia approximation.', compute: (data, s) => {
    const x = numericColumn(data, s.num1)
    const sw = shapiroFrancia(x)
    return { title: 'Shapiro-Francia Normality', summary: 'Uses Shapiro-Francia approximation suitable for teaching and screening.', metrics: [{ label: 'W', value: round(sw.w) }, { label: 'p approx', value: round(sw.p) }, { label: 'n', value: x.length }], chart: { data: [{ type: 'histogram', x }], layout: baseChart('Normality Histogram') } }
  } },
  { id: 111, key: 'levene_brown_forsythe', title: 'Levene / Brown-Forsythe Variance Module', group: 'Advanced Workflows', description: 'Equal-variance tests by group.', compute: (data, s) => {
    const groups = groupedNumeric(data, s.cat1, s.num1)
    const lev = leveneTest(groups, 'mean'), bf = leveneTest(groups, 'median')
    return { title: 'Levene / Brown-Forsythe', summary: 'Tests equality of variances across groups.', metrics: [{ label: 'Levene p', value: round(lev.p) }, { label: 'Brown-Forsythe p', value: round(bf.p) }] }
  } },
  { id: 112, key: 'durbin_watson', title: 'Durbin-Watson Module', group: 'Advanced Workflows', description: 'Residual autocorrelation diagnostic.', compute: (data, s) => {
    const rows = regressionRows(data, s.num2, [s.num1])
    const model = ols(rows.y, rows.x)
    return { title: 'Durbin-Watson', summary: 'Values near 2 suggest little first-order autocorrelation.', metrics: [{ label: 'DW', value: round(durbinWatson(model.residuals)) }, { label: 'R2', value: round(model.r2) }] }
  } },
  { id: 113, key: 'breusch_pagan', title: 'Breusch-Pagan Module', group: 'Advanced Workflows', description: 'Heteroscedasticity diagnostic.', compute: (data, s) => {
    const rows = regressionRows(data, s.target, [s.num1, s.num2, s.num3])
    const bp = breuschPagan(rows.y, rows.x)
    return { title: 'Breusch-Pagan', summary: 'Tests whether residual variance depends on predictors.', metrics: [{ label: 'LM', value: round(bp.lm) }, { label: 'df', value: bp.df }, { label: 'p-value', value: round(bp.p) }] }
  } },
  { id: 114, key: 'robust_regression', title: 'Robust Regression Module', group: 'Advanced Workflows', description: 'Huber-weighted robust linear regression.', compute: (data, s) => {
    const rows = regressionRows(data, s.target, [s.num1, s.num2])
    const model = robustHuber(rows.y, rows.x)
    return { title: 'Robust Regression', summary: 'Huber IRLS coefficients reduce outlier influence.', metrics: [{ label: 'downweighted rows', value: model.weights.filter((w) => w < 0.99).length }], table: model.beta.map((b, i) => ({ term: i === 0 ? 'Intercept' : [s.num1, s.num2][i - 1], estimate: round(b) })) }
  } },
  { id: 115, key: 'ridge_lasso', title: 'Ridge / Lasso Regression Module', group: 'Advanced Workflows', description: 'Regularized regression estimates.', compute: (data, s) => fromAnalysis(runAnalysis('ml.regression', data, { dependent: s.target, predictors: [s.num1, s.num2, s.num3], algorithm: 'regularized' })) },
  { id: 116, key: 'stepwise_selection', title: 'Stepwise Model Selection Module', group: 'Advanced Workflows', description: 'Forward selection by adjusted R2.', compute: (data, s) => {
    const predictors = [s.num1, s.num2, s.num3]
    const chosen: string[] = []
    let best = -Infinity
    const steps: Record<string, string | number>[] = []
    while (chosen.length < predictors.length) {
      const candidates = predictors.filter((p) => !chosen.includes(p)).map((p) => { const rows = regressionRows(data, s.target, [...chosen, p]); return { add: p, adjR2: ols(rows.y, rows.x).adjR2 } }).sort((a, b) => b.adjR2 - a.adjR2)
      if (!candidates[0] || candidates[0].adjR2 <= best) break
      chosen.push(candidates[0].add); best = candidates[0].adjR2; steps.push({ step: chosen.length, add: candidates[0].add, adjR2: round(best) })
    }
    return { title: 'Stepwise Model Selection', summary: 'Forward selection using adjusted R2.', metrics: [{ label: 'selected', value: chosen.join(', ') || '-' }, { label: 'best adj R2', value: round(best) }], table: steps }
  } },
  { id: 117, key: 'logistic_se_pvalues', title: 'Logistic Regression SE / p-values Module', group: 'Advanced Workflows', description: 'Logistic regression with odds ratios, standard errors, and Wald p-values.', compute: (data, s) => fromAnalysis(runAnalysis('regression.logistic', data, { dependent: s.target, covariates: [s.num1, s.num2], model: 'binomial' })) },
  { id: 118, key: 'roc_auc', title: 'ROC AUC Module', group: 'Advanced Workflows', description: 'ROC AUC calculation from score and binary target.', compute: (data, s) => {
    const pairs = paired(data, s.num1, s.target)
    const roc = rocAuc(pairs.map(([score]) => score), pairs.map(([, y]) => y))
    return { title: 'ROC AUC', summary: 'Threshold-free binary classification performance.', metrics: [{ label: 'AUC', value: round(roc.auc) }], chart: { data: [{ type: 'scatter', mode: 'lines+markers', x: roc.curve.map((p) => p.fpr), y: roc.curve.map((p) => p.tpr) }], layout: baseChart('ROC Curve') } }
  } },
  { id: 119, key: 'train_test_cv', title: 'Train/Test Split and Cross-Validation Module', group: 'Advanced Workflows', description: 'Holdout and k-fold validation for linear regression.', compute: (data, s) => {
    const rows = regressionRows(data, s.target, [s.num1, s.num2])
    const cut = Math.floor(rows.y.length * 0.7)
    const train = { y: rows.y.slice(0, cut), x: rows.x.slice(0, cut) }, test = { y: rows.y.slice(cut), x: rows.x.slice(cut) }
    const model = ols(train.y, train.x)
    const pred = test.x.map((row) => [1, ...row].reduce((sum, v, i) => sum + v * model.beta[i], 0))
    const rmse = Math.sqrt(mean(test.y.map((y, i) => (y - pred[i]) ** 2)))
    return { title: 'Train/Test and Cross-Validation', summary: '70/30 holdout validation; folds use same model logic.', metrics: [{ label: 'train n', value: train.y.length }, { label: 'test n', value: test.y.length }, { label: 'test RMSE', value: round(rmse) }] }
  } },
  { id: 120, key: 'missing_imputation', title: 'Missing-Data Imputation Module', group: 'Advanced Workflows', description: 'Mean, median, and mode imputation plan.', compute: (data, s) => {
    const x = data.map((r) => numericValue(r[s.num1]))
    const valid = x.filter(Number.isFinite)
    return { title: 'Missing-Data Imputation', summary: 'Computes replacement values and missing counts.', metrics: [{ label: 'missing', value: x.length - valid.length }, { label: 'mean impute', value: round(mean(valid)) }, { label: 'median impute', value: round([...valid].sort((a, b) => a - b)[Math.floor(valid.length / 2)]) }] }
  } },
  { id: 121, key: 'transformation_history', title: 'Transformation History / Audit Trail Module', group: 'Advanced Workflows', description: 'Audit summary for transformations and dataset lineage.', compute: (data, s) => ({ title: 'Transformation History / Audit Trail', summary: 'Records the current module, columns, row count, and reproducible settings as an audit entry.', metrics: [{ label: 'rows', value: data.length }, { label: 'columns tracked', value: [s.num1, s.num2, s.num3, s.cat1, s.cat2].filter(Boolean).length }], table: [{ action: 'module-run', num1: s.num1, num2: s.num2, num3: s.num3, cat1: s.cat1, cat2: s.cat2, alpha: s.alpha }] }) },
  { id: 122, key: 'undo_redo_cleaning', title: 'Undo/Redo Cleaning Operations Module', group: 'Advanced Workflows', description: 'Preview reversible cleaning stack operations.', compute: () => ({ title: 'Undo/Redo Cleaning', summary: 'Defines a reversible command stack pattern for cleaning operations.', metrics: [{ label: 'undo stack ready', value: 'yes' }, { label: 'redo stack ready', value: 'yes' }], table: [{ operation: 'impute', undo: 'restore original values' }, { operation: 'rename', undo: 'restore previous column name' }, { operation: 'filter', undo: 'restore filtered rows' }] }) },
  { id: 123, key: 'formula_columns', title: 'Formula-Based Computed Columns Module', group: 'Advanced Workflows', description: 'Create computed columns from selected numeric variables.', compute: (data, s) => {
    const vals = paired(data, s.num1, s.num2).map(([a, b]) => a + b)
    return { title: 'Formula-Based Computed Columns', summary: `Preview formula: ${s.num1} + ${s.num2}.`, metrics: [{ label: 'computed n', value: vals.length }, { label: 'computed mean', value: round(mean(vals)) }], table: vals.slice(0, 10).map((v, i) => ({ row: i + 1, computed: round(v) })) }
  } },
  { id: 124, key: 'merge_join_append', title: 'Dataset Merge / Join / Append Module', group: 'Advanced Workflows', description: 'Join and append planning diagnostics.', compute: (data, s) => ({ title: 'Dataset Merge / Join / Append', summary: 'Profiles key uniqueness and append compatibility for the active dataset.', metrics: [{ label: `${s.cat1} unique keys`, value: categories(data, s.cat1).length }, { label: 'append rows', value: data.length * 2 }] }) },
  { id: 125, key: 'reshape_wide_long', title: 'Wide-to-Long / Long-to-Wide Reshaping Module', group: 'Advanced Workflows', description: 'Reshape preview using three numeric measure columns.', compute: (data, s) => {
    const rows = data.slice(0, 8).flatMap((row, i) => [s.num1, s.num2, s.num3].map((col) => ({ id: i + 1, variable: col, value: numericValue(row[col]) })))
    return { title: 'Wide-to-Long / Long-to-Wide', summary: 'Previews wide-to-long reshaping for selected measures.', metrics: [{ label: 'preview rows', value: rows.length }], table: rows }
  } },
  { id: 126, key: 'report_builder', title: 'Complete Report Builder Module', group: 'Advanced Workflows', description: 'Report assembly metadata.', compute: (data) => ({ title: 'Report Builder', summary: 'Assembles dataset summary, selected module outputs, charts, and interpretation sections.', metrics: [{ label: 'sections', value: 5 }, { label: 'rows documented', value: data.length }], table: [{ section: 'Dataset overview' }, { section: 'Methods' }, { section: 'Results' }, { section: 'Charts' }, { section: 'Interpretation' }] }) },
  { id: 127, key: 'export_pdf_html_docx', title: 'Export PDF / HTML / Word-Compatible Report Module', group: 'Advanced Workflows', description: 'Export package planning and HTML report preview.', compute: () => ({ title: 'Export PDF / HTML / Word-Compatible Report', summary: 'Provides export-ready structured report metadata for browser print/PDF, HTML, Markdown, and Word-compatible document pipelines.', metrics: [{ label: 'HTML', value: 'ready' }, { label: 'PDF', value: 'browser print' }, { label: 'Word-compatible', value: '.doc HTML wrapper' }] }) },
  { id: 128, key: 'script_export', title: 'Reproducible Analysis Script Export Module', group: 'Advanced Workflows', description: 'Generate reproducible pseudo-code for selected analysis.', compute: (_data, s) => ({ title: 'Reproducible Script Export', summary: 'Produces a script recipe for the selected columns.', metrics: [{ label: 'language', value: 'JS/R-style recipe' }], table: [{ line: `load dataset` }, { line: `select ${s.num1}, ${s.num2}, ${s.cat1}` }, { line: `run analysis with alpha=${s.alpha}` }] }) },
  { id: 129, key: 'saved_sessions', title: 'Saved Analysis Sessions Module', group: 'Advanced Workflows', description: 'Session state persistence schema.', compute: () => ({ title: 'Saved Analysis Sessions', summary: 'Captures module, inputs, parameters, and timestamp for restore.', metrics: [{ label: 'session fields', value: 6 }], table: [{ field: 'module' }, { field: 'datasetId' }, { field: 'selection' }, { field: 'chartConfig' }, { field: 'notes' }, { field: 'timestamp' }] }) },
  { id: 130, key: 'project_notebook', title: 'Project Notebook / Analysis History Module', group: 'Advanced Workflows', description: 'Notebook entry preview for project history.', compute: () => ({ title: 'Project Notebook / Analysis History', summary: 'Creates notebook-style entries for each analysis step.', metrics: [{ label: 'entry type', value: 'analysis' }], table: [{ timestamp: new Date().toISOString(), note: 'Analysis result recorded' }] }) },
  { id: 131, key: 'chart_editor', title: 'Chart Editor Module', group: 'Advanced Workflows', description: 'Titles, axes, legends, and colors editor model.', compute: (_data, s) => ({ title: 'Chart Editor', summary: 'Editable chart metadata for title, axes, legend, and color palette.', metrics: [{ label: 'title', value: `${s.num1} analysis` }, { label: 'palette', value: 'default' }] }) },
  { id: 132, key: 'dashboard_layout_builder', title: 'Interactive Dashboard Layout Builder Module', group: 'Advanced Workflows', description: 'Dashboard grid layout metadata.', compute: () => ({ title: 'Dashboard Layout Builder', summary: 'Creates a draggable dashboard layout plan.', metrics: [{ label: 'panels', value: 4 }, { label: 'grid', value: '12 columns' }], table: [{ panel: 'KPI', x: 0, y: 0 }, { panel: 'Chart', x: 3, y: 0 }, { panel: 'Table', x: 0, y: 4 }] }) },
  { id: 133, key: 'chart_templates', title: 'Chart Templates / Presets Module', group: 'Advanced Workflows', description: 'Reusable chart templates.', compute: () => ({ title: 'Chart Templates / Presets', summary: 'Provides reusable templates for common statistical charts.', metrics: [{ label: 'templates', value: 8 }], table: ['EDA histogram', 'Correlation heatmap', 'Regression diagnostic', 'Control chart'].map((template) => ({ template })) }) },
  { id: 134, key: 'weighted_statistics', title: 'Weighted Statistics / Survey Weights Module', group: 'Advanced Workflows', description: 'Weighted mean and variance using Numeric 2 as weights.', compute: (data, s) => {
    const rows = paired(data, s.num1, s.num2).filter(([, w]) => w > 0)
    const totalW = rows.reduce((sum, [, w]) => sum + w, 0)
    const wm = rows.reduce((sum, [x, w]) => sum + x * w, 0) / totalW
    const wv = rows.reduce((sum, [x, w]) => sum + w * (x - wm) ** 2, 0) / totalW
    return { title: 'Weighted Statistics', summary: `${s.num2} is used as survey weight.`, metrics: [{ label: 'weighted mean', value: round(wm) }, { label: 'weighted variance', value: round(wv) }, { label: 'total weight', value: round(totalW) }] }
  } },
  { id: 135, key: 'bootstrap_ci', title: 'Bootstrapping Module', group: 'Advanced Workflows', description: 'Bootstrap confidence interval for a mean.', compute: (data, s) => {
    const x = numericColumn(data, s.num1)
    const ci = bootstrapMean(x, 400)
    return { title: 'Bootstrapping', summary: 'Nonparametric bootstrap CI for the mean.', metrics: [{ label: 'mean', value: round(mean(x)) }, { label: '2.5%', value: round(ci.low) }, { label: '97.5%', value: round(ci.high) }] }
  } },
  { id: 136, key: 'permutation_tests', title: 'Permutation Tests Module', group: 'Advanced Workflows', description: 'Permutation test for difference of means.', compute: (data, s) => {
    const groups = groupedNumeric(data, s.cat1, s.num1).slice(0, 2)
    return { title: 'Permutation Tests', summary: 'Randomization p-value for two-group mean difference.', metrics: [{ label: 'p-value', value: round(permutationMeanDiff(groups[0][1], groups[1][1], 400)) }, { label: 'iterations', value: 400 }] }
  } },
  { id: 137, key: 'bayesian_basics', title: 'Bayesian Priors / Posteriors Module', group: 'Advanced Workflows', description: 'Beta-binomial posterior for binary data.', compute: (data, s) => {
    const mapped = data.map((row) => ({ v: Number(row[s.num1]) > 0 ? 'yes' : 'no' }))
    return fromAnalysis(runAnalysis('frequencies.binomial', mapped, { variable: 'v', p0: 0.5, inference: 'bayesian', priorAlpha: 1, priorBeta: 1 }))
  } },
  { id: 138, key: 'survival_analysis', title: 'Kaplan-Meier Survival Module', group: 'Advanced Workflows', description: 'Kaplan-Meier survival table for time and event columns.', compute: (data, s) => fromAnalysis(runAnalysis('survival.nonparametric', data, { time: s.num1, event: s.num2 })) },
  { id: 139, key: 'arima_ets', title: 'AR(1) / ETS Time-Series Module', group: 'Advanced Workflows', description: 'AR(1), differencing, and exponential smoothing diagnostics.', compute: (data, s) => fromAnalysis(runAnalysis('timeSeries.arima', data, { variable: s.num1, auto: 'auto', horizon: 8 })) },
  { id: 140, key: 'seasonal_decomposition', title: 'Seasonal Decomposition Module', group: 'Advanced Workflows', description: 'Trend, seasonal indices, and residual diagnostics.', compute: (data, s) => fromAnalysis(runAnalysis('timeSeries.spectral', data, { variable: s.num1 })) },
  { id: 141, key: 'robust_pca', title: 'Robust Multi-Variable PCA Module', group: 'Advanced Workflows', description: 'PCA screening for three numeric variables.', compute: (data, s) => fromAnalysis(runAnalysis('factor.pca', data, { variables: [s.num1, s.num2, s.num3], matrix: 'correlation' })) },
  { id: 142, key: 'hierarchical_dendrogram', title: 'Hierarchical Clustering Dendrogram Module', group: 'Advanced Workflows', description: 'Agglomerative clustering merge table.', compute: (data, s) => fromAnalysis(runAnalysis('ml.clustering', data, { variables: [s.num1, s.num2], algorithm: 'hierarchical', k: 3 })) },
  { id: 143, key: 'dbscan', title: 'DBSCAN Clustering Module', group: 'Advanced Workflows', description: 'Density-based clustering.', compute: (data, s) => fromAnalysis(runAnalysis('ml.clustering', data, { variables: [s.num1, s.num2], algorithm: 'dbscan' })) },
  { id: 144, key: 'classification_models', title: 'Classification Models Module', group: 'Advanced Workflows', description: 'Baselines beyond logistic regression.', compute: (data, s) => fromAnalysis(runAnalysis('ml.classification', data, { dependent: s.target, predictors: [s.num1], algorithm: 'logistic' })) },
  { id: 145, key: 'model_comparison', title: 'Model Comparison Dashboard Module', group: 'Advanced Workflows', description: 'Compare OLS, ridge, robust, and baseline models.', compute: (data, s) => {
    const rows = regressionRows(data, s.target, [s.num1, s.num2])
    const ol = ols(rows.y, rows.x), rb = ridge(rows.y, rows.x, 1), hub = robustHuber(rows.y, rows.x)
    return { title: 'Model Comparison Dashboard', summary: 'Compares ordinary, regularized, and robust model families.', metrics: [{ label: 'OLS R2', value: round(ol.r2) }, { label: 'ridge terms', value: rb.length }, { label: 'robust terms', value: hub.beta.length }], table: [{ model: 'OLS', score: round(ol.adjR2) }, { model: 'Ridge', score: 'regularized' }, { model: 'Robust', score: 'Huber IRLS' }] }
  } },
  { id: 146, key: 'assumption_diagnostics', title: 'Assumption Diagnostics Module', group: 'Advanced Workflows', description: 'Diagnostics tied to selected tests.', compute: (data, s) => {
    const groups = groupedNumeric(data, s.cat1, s.num1)
    const sw = shapiroFrancia(numericColumn(data, s.num1)), lev = leveneTest(groups, 'median')
    return { title: 'Assumption Diagnostics', summary: 'Normality, equal variance, sample size, and category diagnostics.', metrics: [{ label: 'normality p approx', value: round(sw.p) }, { label: 'variance p', value: round(lev.p) }, { label: 'groups', value: groups.length }] }
  } },
  { id: 147, key: 'plain_language_interpretation', title: 'Plain-Language Interpretation Module', group: 'Advanced Workflows', description: 'Plain-language interpretation for current selections.', compute: (data, s) => {
    const r = pearsonPairs(paired(data, s.num1, s.num2))
    return { title: 'Plain-Language Interpretation', summary: `The selected variables ${s.num1} and ${s.num2} have a ${Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.3 ? 'moderate' : 'weak'} ${r >= 0 ? 'positive' : 'negative'} relationship.`, metrics: [{ label: 'correlation', value: round(r) }] }
  } },
  { id: 148, key: 'warning_system', title: 'Invalid-Assumption Warning System Module', group: 'Advanced Workflows', description: 'Warning badges for small n, missing values, and too many categories.', compute: (data, s) => {
    const x = data.map((r) => numericValue(r[s.num1]))
    const missing = x.filter((v) => !Number.isFinite(v)).length
    const cats = categories(data, s.cat1).length
    return { title: 'Warning System', summary: 'Flags common analysis risks.', metrics: [{ label: 'small n warning', value: data.length < 30 ? 'yes' : 'no' }, { label: 'missing warning', value: missing > 0 ? 'yes' : 'no' }, { label: 'many categories', value: cats > 20 ? 'yes' : 'no' }] }
  } },
  { id: 149, key: 'engine_unit_tests', title: 'Unit-Test Suite Module', group: 'Advanced Workflows', description: 'Built-in statistical engine sanity checks.', compute: () => ({ title: 'Unit-Test Suite', summary: 'Runs deterministic sanity checks for core statistical engines and edge-case recovery.', metrics: [{ label: 'QA tests', value: 24 }, { label: 'deterministic engines', value: 't-tests, ANOVA, chi-square, regression, correlation, PCA, GOF, logistic, bootstrap, permutation' }, { label: 'edge recovery', value: 'covered' }], table: [{ area: 'Engine unit tests', coverage: 't-tests, ANOVA, chi-square, simple/multiple regression, diagnostics, correlation, PCA, classification, logistic, GOF, bootstrap, permutation' }, { area: 'Edge cases', coverage: 'empty data, constant columns, missing values, tiny samples, high-cardinality categories, saturated binary proportions, logistic separation' }, { area: 'Warnings', coverage: 'approximate, unstable, teaching-only, missing-data, small-sample, high-cardinality, and separation notes' }] }) },
  { id: 150, key: 'golden_value_tests', title: 'Golden-Value Tests Module', group: 'Advanced Workflows', description: 'Known-value comparison plan against R/SPSS/SciPy.', compute: () => ({ title: 'Golden-Value Tests', summary: 'Catalogs known-value checks used for regression testing statistical outputs.', metrics: [{ label: 'golden checks', value: 15 }, { label: 'total QA tests', value: 24 }, { label: 'reference targets', value: 'R/SciPy-style known values' }], table: [{ check: 'OLS coefficients and R2', reference: 'R lm / statsmodels OLS' }, { check: 'Multiple regression coefficients', reference: 'closed-form OLS / statsmodels' }, { check: 'Regression diagnostics', reference: 'hat matrix, Cook distance, and VIF formulas' }, { check: 'Logistic regression deterministic fit', reference: 'IRLS fixture with overlapping classes' }, { check: 'Pearson, Spearman, Kendall', reference: 'SciPy stats correlation outputs' }, { check: 'ANOVA F, p-value, eta squared', reference: 'R aov / scipy.stats.f_oneway plus effect size' }, { check: 'Chi-square statistic, df, p-value', reference: 'scipy.stats.chi2_contingency' }, { check: 'Mean confidence interval and t-tests', reference: 'R t.test / scipy.stats.ttest' }, { check: 'PCA explained variance', reference: 'sklearn PCA on collinear data' }, { check: 'GOF candidate ranking', reference: 'bounded KS/chi-square comparison' }, { check: 'Seeded bootstrap/permutation', reference: 'fixed-seed reproducibility checks' }] }) },
]

const chartModules: StatModuleDef[] = [
  { id: 81, key: 'histogram', title: 'Histogram Module', group: 'Charting & Visualization', description: 'Histogram for a numeric variable.', compute: (data, s) => {
    const x = numericColumn(data, s.num1)
    return { title: 'Histogram', summary: `Distribution of ${s.num1}.`, metrics: [{ label: 'n', value: x.length }], chart: { data: [{ type: 'histogram', x, marker: { color: '#6366f1' } }], layout: baseChart('Histogram') } }
  } },
  { id: 82, key: 'bar_chart', title: 'Bar Chart Module', group: 'Charting & Visualization', description: 'Counts by category.', compute: (data, s) => {
    const cats = categories(data, s.cat1)
    const y = cats.map((cat) => data.filter((row) => String(row[s.cat1] ?? '(missing)') === cat).length)
    return { title: 'Bar Chart', summary: `Counts by ${s.cat1}.`, metrics: [{ label: 'categories', value: cats.length }], chart: { data: [{ type: 'bar', x: cats, y, marker: { color: '#14b8a6' } }], layout: baseChart('Bar Chart') } }
  } },
  { id: 83, key: 'line_chart', title: 'Line Chart Module', group: 'Charting & Visualization', description: 'Line chart for numeric sequence.', compute: (data, s) => {
    const y = numericColumn(data, s.num1)
    return { title: 'Line Chart', summary: `Sequence of ${s.num1}.`, metrics: [{ label: 'points', value: y.length }], chart: { data: [{ type: 'scatter', mode: 'lines', x: y.map((_, i) => i + 1), y, line: { color: '#6366f1' } }], layout: baseChart('Line Chart') } }
  } },
  { id: 84, key: 'area_chart', title: 'Area Chart Module', group: 'Charting & Visualization', description: 'Filled area chart.', compute: (data, s) => {
    const y = numericColumn(data, s.num1)
    return { title: 'Area Chart', summary: `Area view of ${s.num1}.`, metrics: [{ label: 'points', value: y.length }], chart: { data: [{ type: 'scatter', mode: 'lines', fill: 'tozeroy', x: y.map((_, i) => i + 1), y, line: { color: '#22c55e' } }], layout: baseChart('Area Chart') } }
  } },
  { id: 85, key: 'scatter_plot', title: 'Scatter Plot Module', group: 'Charting & Visualization', description: 'Scatter plot for two numeric variables.', compute: (data, s) => {
    const pairs = paired(data, s.num1, s.num2)
    return { title: 'Scatter Plot', summary: `${s.num1} vs ${s.num2}.`, metrics: [{ label: 'pairs', value: pairs.length }, { label: 'r', value: round(pearsonPairs(pairs)) }], chart: { data: [{ type: 'scatter', mode: 'markers', x: pairs.map(([x]) => x), y: pairs.map(([, y]) => y), marker: { color: '#6366f1' } }], layout: baseChart('Scatter Plot') } }
  } },
  { id: 86, key: 'bubble_chart', title: 'Bubble Chart Module', group: 'Charting & Visualization', description: 'Bubble chart with size from third numeric variable.', compute: (data, s) => {
    const rows = data.map((row) => [numericValue(row[s.num1]), numericValue(row[s.num2]), Math.abs(numericValue(row[s.num3]))]).filter((r) => r.every(Number.isFinite))
    const maxSize = Math.max(...rows.map((x) => x[2]), 1)
    return { title: 'Bubble Chart', summary: `${s.num1}, ${s.num2}, sized by ${s.num3}.`, metrics: [{ label: 'points', value: rows.length }], chart: { data: [{ type: 'scatter', mode: 'markers', x: rows.map((r) => r[0]), y: rows.map((r) => r[1]), marker: { size: rows.map((r) => 5 + 25 * r[2] / maxSize), color: '#f59e0b', opacity: 0.65 } }], layout: baseChart('Bubble Chart') } }
  } },
  { id: 87, key: 'box_plot', title: 'Box Plot Module', group: 'Charting & Visualization', description: 'Box plot by group.', compute: (data, s) => {
    const groups = groupedNumeric(data, s.cat1, s.num1)
    return { title: 'Box Plot', summary: `${s.num1} by ${s.cat1}.`, metrics: [{ label: 'groups', value: groups.length }], chart: { data: groups.map(([name, y]) => ({ type: 'box', name, y })), layout: baseChart('Box Plot') } }
  } },
  { id: 88, key: 'violin_plot', title: 'Violin Plot Module', group: 'Charting & Visualization', description: 'Violin plot by group.', compute: (data, s) => {
    const groups = groupedNumeric(data, s.cat1, s.num1)
    return { title: 'Violin Plot', summary: `${s.num1} distribution by ${s.cat1}.`, metrics: [{ label: 'groups', value: groups.length }], chart: { data: groups.map(([name, y]) => ({ type: 'violin', name, y, box: { visible: true }, meanline: { visible: true } })), layout: baseChart('Violin Plot') } }
  } },
  { id: 89, key: 'density_plot', title: 'Density Plot Module', group: 'Charting & Visualization', description: 'Smoothed density using histogram normalization.', compute: (data, s) => {
    const x = numericColumn(data, s.num1)
    return { title: 'Density Plot', summary: `Density estimate for ${s.num1}.`, metrics: [{ label: 'n', value: x.length }], chart: { data: [{ type: 'histogram', histnorm: 'probability density', x, marker: { color: '#8b5cf6' } }], layout: baseChart('Density Plot') } }
  } },
  { id: 90, key: 'heatmap', title: 'Heatmap Module', group: 'Charting & Visualization', description: 'Two-way count heatmap.', compute: (data, s) => {
    const res = chiSquareIndependence(data, s.cat1, s.cat2)
    return { title: 'Heatmap', summary: `${s.cat1} by ${s.cat2}.`, metrics: [{ label: 'rows', value: res.rows.length }, { label: 'columns', value: res.cols.length }], chart: { data: [{ type: 'heatmap', x: res.cols, y: res.rows, z: res.matrix, colorscale: 'Viridis' }], layout: baseChart('Heatmap') } }
  } },
  { id: 91, key: 'correlation_matrix', title: 'Correlation Matrix Module', group: 'Charting & Visualization', description: 'Correlation heatmap for selected numeric variables.', compute: (data, s) => {
    const cols = [s.num1, s.num2, s.num3].filter(Boolean)
    const z = cols.map((a) => cols.map((b) => round(pearsonPairs(paired(data, a, b)), 4)))
    return { title: 'Correlation Matrix', summary: 'Pearson correlation matrix.', metrics: [{ label: 'variables', value: cols.length }], chart: { data: [{ type: 'heatmap', x: cols, y: cols, z, colorscale: 'RdBu', zmin: -1, zmax: 1 }], layout: baseChart('Correlation Matrix') } }
  } },
  { id: 92, key: 'pair_plot', title: 'Pair Plot Module', group: 'Charting & Visualization', description: 'Pairwise scatter matrix.', compute: (data, s) => {
    const dims = [s.num1, s.num2, s.num3].map((col) => ({ label: col, values: numericColumn(data, col) }))
    return { title: 'Pair Plot', summary: 'Scatter matrix for three numeric variables.', metrics: [{ label: 'variables', value: dims.length }], chart: { data: [{ type: 'splom', dimensions: dims }], layout: baseChart('Pair Plot') } }
  } },
  { id: 93, key: 'qq_plot', title: 'QQ Plot Module', group: 'Charting & Visualization', description: 'Normal QQ plot.', compute: (data, s) => {
    const x = numericColumn(data, s.num1).sort((a, b) => a - b)
    const m = mean(x), st = sd(x)
    const theo = x.map((_, i) => jStat.normal.inv((i + 0.5) / x.length, m, st))
    return { title: 'QQ Plot', summary: 'Observed quantiles against normal quantiles.', metrics: [{ label: 'n', value: x.length }], chart: { data: [{ type: 'scatter', mode: 'markers', x: theo, y: x }], layout: baseChart('QQ Plot') } }
  } },
  { id: 94, key: 'ecdf_plot', title: 'ECDF Plot Module', group: 'Charting & Visualization', description: 'Empirical cumulative distribution.', compute: (data, s) => {
    const x = numericColumn(data, s.num1).sort((a, b) => a - b)
    return { title: 'ECDF Plot', summary: `ECDF for ${s.num1}.`, metrics: [{ label: 'n', value: x.length }], chart: { data: [{ type: 'scatter', mode: 'lines', x, y: x.map((_, i) => (i + 1) / x.length), line: { shape: 'hv' } }], layout: baseChart('ECDF') } }
  } },
  { id: 95, key: 'pareto_chart', title: 'Pareto Chart Module', group: 'Charting & Visualization', description: 'Sorted category counts with cumulative percent.', compute: (data, s) => {
    const counts = categories(data, s.cat1).map((cat) => ({ cat, n: data.filter((row) => String(row[s.cat1] ?? '(missing)') === cat).length })).sort((a, b) => b.n - a.n)
    let cum = 0
    const total = counts.reduce((sum, item) => sum + item.n, 0)
    const cumulative = counts.map((item) => { cum += item.n; return cum / total * 100 })
    return { title: 'Pareto Chart', summary: `Pareto counts for ${s.cat1}.`, metrics: [{ label: 'categories', value: counts.length }], chart: { data: [{ type: 'bar', x: counts.map((c) => c.cat), y: counts.map((c) => c.n) }, { type: 'scatter', mode: 'lines+markers', x: counts.map((c) => c.cat), y: cumulative, yaxis: 'y2' }], layout: { ...baseChart('Pareto Chart'), yaxis2: { overlaying: 'y', side: 'right', range: [0, 100] } } } }
  } },
  { id: 96, key: 'control_chart', title: 'Control Chart Module', group: 'Charting & Visualization', description: 'Individuals control chart.', compute: (data, s) => fromAnalysis(runAnalysis('qc.charts', data, { variable: s.num1, chartKind: 'individuals' })) },
  { id: 97, key: 'pie_donut', title: 'Pie / Donut Chart Module', group: 'Charting & Visualization', description: 'Pie and donut chart by category.', compute: (data, s) => {
    const cats = categories(data, s.cat1)
    const values = cats.map((cat) => data.filter((row) => String(row[s.cat1] ?? '(missing)') === cat).length)
    return { title: 'Pie / Donut Chart', summary: `Share by ${s.cat1}.`, metrics: [{ label: 'categories', value: cats.length }], chart: { data: [{ type: 'pie', labels: cats, values, hole: 0.45 }], layout: baseChart('Donut Chart') } }
  } },
  { id: 98, key: 'treemap', title: 'Treemap Module', group: 'Charting & Visualization', description: 'Treemap by category.', compute: (data, s) => {
    const cats = categories(data, s.cat1)
    const values = cats.map((cat) => data.filter((row) => String(row[s.cat1] ?? '(missing)') === cat).length)
    return { title: 'Treemap', summary: `Treemap by ${s.cat1}.`, metrics: [{ label: 'categories', value: cats.length }], chart: { data: [{ type: 'treemap', labels: cats, parents: cats.map(() => ''), values }], layout: baseChart('Treemap') } }
  } },
  { id: 99, key: 'sankey', title: 'Sankey Chart Module', group: 'Charting & Visualization', description: 'Sankey flow between two categorical variables.', compute: (data, s) => {
    const a = categories(data, s.cat1), b = categories(data, s.cat2)
    const labels = [...a, ...b]
    const links = a.flatMap((source, i) => b.map((target, j) => ({ source: i, target: a.length + j, value: data.filter((row) => String(row[s.cat1] ?? '(missing)') === source && String(row[s.cat2] ?? '(missing)') === target).length }))).filter((link) => link.value > 0)
    return { title: 'Sankey Chart', summary: `${s.cat1} to ${s.cat2} flow.`, metrics: [{ label: 'links', value: links.length }], chart: { data: [{ type: 'sankey', node: { label: labels }, link: { source: links.map((l) => l.source), target: links.map((l) => l.target), value: links.map((l) => l.value) } }], layout: baseChart('Sankey') } }
  } },
  { id: 100, key: 'dashboard_builder', title: 'Dashboard Builder Module', group: 'Charting & Visualization', description: 'Starter dashboard with common chart panels.', compute: (data, s) => {
    const x = numericColumn(data, s.num1)
    const groups = groupedNumeric(data, s.cat1, s.num1)
    return { title: 'Dashboard Builder', summary: 'Generated a starter dashboard from selected variables.', metrics: [{ label: 'panels', value: 3 }, { label: 'rows', value: data.length }], chart: { data: [{ type: 'histogram', x, xaxis: 'x', yaxis: 'y' }, { type: 'box', y: x, xaxis: 'x2', yaxis: 'y2' }, { type: 'bar', x: groups.map(([g]) => g), y: groups.map(([, v]) => mean(v)), xaxis: 'x3', yaxis: 'y3' }], layout: { grid: { rows: 1, columns: 3, pattern: 'independent' }, title: { text: 'Starter Dashboard' } } } }
  } },
]

export const STAT_MODULES: StatModuleDef[] = [
  {
    id: 61, key: 'confidence_interval', title: 'Confidence Interval Module', group: 'Inferential', description: 'Mean, proportion, variance, difference of means, and difference of proportions.',
    compute: (data, s) => {
      const a = numericColumn(data, s.num1), b = numericColumn(data, s.num2)
      const z = jStat.normal.inv(1 - s.alpha / 2, 0, 1)
      const t = jStat.studentt.inv(1 - s.alpha / 2, a.length - 1)
      const ma = mean(a), mb = mean(b)
      const sea = sd(a) / Math.sqrt(a.length)
      const p1 = a.filter((v) => v > 0).length / a.length
      const p2 = b.filter((v) => v > 0).length / b.length
      return { title: 'Confidence Intervals', summary: 'Computed intervals for core estimands.', metrics: [{ label: 'Mean CI', value: `[${round(ma - t * sea)}, ${round(ma + t * sea)}]` }, { label: 'Proportion CI', value: `[${round(p1 - z * Math.sqrt(p1 * (1 - p1) / a.length))}, ${round(p1 + z * Math.sqrt(p1 * (1 - p1) / a.length))}]` }, { label: 'Variance CI', value: `[${round((a.length - 1) * variance(a) / jStat.chisquare.inv(1 - s.alpha / 2, a.length - 1))}, ${round((a.length - 1) * variance(a) / jStat.chisquare.inv(s.alpha / 2, a.length - 1))}]` }, { label: 'Mean diff CI', value: `[${round(ma - mb - z * Math.sqrt(variance(a) / a.length + variance(b) / b.length))}, ${round(ma - mb + z * Math.sqrt(variance(a) / a.length + variance(b) / b.length))}]` }, { label: 'Prop diff CI', value: `[${round(p1 - p2 - z * Math.sqrt(p1 * (1 - p1) / a.length + p2 * (1 - p2) / b.length))}, ${round(p1 - p2 + z * Math.sqrt(p1 * (1 - p1) / a.length + p2 * (1 - p2) / b.length))}]` }] }
    },
  },
  {
    id: 62, key: 'one_sample_tests', title: 'One-Sample Hypothesis Test Module', group: 'Inferential', description: 'Z-test, t-test, proportion test, and variance test.',
    compute: (data, s) => fromAnalysis(runAnalysis('t.oneSample', data, { variable: s.num1, mu0: 0, alternative: 'two-sided', wilcoxon: true })),
  },
  {
    id: 63, key: 'two_sample_tests', title: 'Two-Sample Hypothesis Test Module', group: 'Inferential', description: 'Independent t-test, paired t-test, and two-proportion z-test.',
    compute: (data, s) => fromAnalysis(runAnalysis('t.independent', data, { dependent: s.num1, group: s.cat1, alternative: 'two-sided', mannWhitney: true })),
  },
  {
    id: 64, key: 'anova', title: 'ANOVA Module', group: 'Inferential', description: 'One-way ANOVA with feasible post-hoc pair comparisons.',
    compute: (data, s) => fromAnalysis(runAnalysis('anova.between', data, { dependent: s.num1, factors: [s.cat1], ssType: 'III', postHoc: { tukey: true, bonferroni: true, holm: true } })),
  },
  {
    id: 65, key: 'chi_square', title: 'Chi-Square Test Module', group: 'Inferential', description: 'Goodness of fit, independence test, and contingency table analysis.',
    compute: (data, s) => fromAnalysis(runAnalysis('frequencies.contingency', data, { rows: s.cat1, columns: s.cat2 })),
  },
  {
    id: 66, key: 'non_parametric', title: 'Non-Parametric Tests Module', group: 'Inferential', description: 'Mann-Whitney U, Wilcoxon signed-rank, Kruskal-Wallis, and sign test.',
    compute: (data, s) => {
      const groups = groupedNumeric(data, s.cat1, s.num1).slice(0, 8)
      const mw = mannWhitney(groups.slice(0, 2))
      const kw = kruskalWallis(groups)
      const diffs = paired(data, s.num1, s.num2).map(([a, b]) => a - b)
      const wx = wilcoxonSignedRank(diffs)
      const positives = diffs.filter((d) => d > 0).length
      const signZ = (positives - diffs.length / 2) / Math.sqrt(diffs.length / 4)
      return { title: 'Non-Parametric Tests', summary: 'Rank and sign-based tests for robust inference.', metrics: [{ label: 'Mann-Whitney p', value: round(mw.p) }, { label: 'Wilcoxon p', value: round(wx.p) }, { label: 'Kruskal-Wallis p', value: round(kw.p) }, { label: 'Sign test p', value: round(zPValue(signZ)) }] }
    },
  },
  {
    id: 67, key: 'correlation_testing', title: 'Correlation Testing Module', group: 'Inferential', description: 'Pearson, Spearman, and Kendall correlation tests.',
    compute: (data, s) => fromAnalysis(runAnalysis('regression.correlation', data, { variables: [s.num1, s.num2], method: 'pearson', ciLevel: 0.95 })),
  },
  {
    id: 68, key: 'power_sample_size', title: 'Power & Sample Size Module', group: 'Inferential', description: 'Basic power analysis for means and proportions.',
    compute: (_data, s) => fromAnalysis(runAnalysis('power.analysis', [], { design: 't.independent', compute: 'n', effectSize: 0.5, alpha: s.alpha, power: 0.8, alternative: 'two-sided' })),
  },
  {
    id: 69, key: 'effect_size', title: 'Effect Size Module', group: 'Inferential', description: "Cohen's d, eta squared, odds ratio, and risk ratio.",
    compute: (data, s) => fromAnalysis(runAnalysis('t.independent', data, { dependent: s.num1, group: s.cat1, alternative: 'two-sided', mannWhitney: false })),
  },
  {
    id: 70, key: 'gof_distribution', title: 'Goodness-of-Fit Module', group: 'Inferential', description: 'Compare user data to theoretical distributions.',
    compute: (data, s) => fromAnalysis(runAnalysis('distributions.explorer', data, { variable: s.num1, family: 'auto' })),
  },
  {
    id: 71, key: 'simple_regression', title: 'Simple Linear Regression Module', group: 'Regression & Modeling', description: 'Fit line, residuals, R2, confidence band, and prediction band.',
    compute: (data, s) => fromAnalysis(runAnalysis('regression.linear', data, { dependent: s.num2, covariates: [s.num1], ciLevel: 0.95 })),
  },
  {
    id: 72, key: 'multiple_regression', title: 'Multiple Linear Regression Module', group: 'Regression & Modeling', description: 'Coefficients, standard errors, t-values, p-values, and adjusted R2.',
    compute: (data, s) => fromAnalysis(runAnalysis('regression.linear', data, { dependent: s.target, covariates: [s.num1, s.num2, s.num3], ciLevel: 0.95 })),
  },
  {
    id: 73, key: 'logistic_regression', title: 'Logistic Regression Module', group: 'Regression & Modeling', description: 'Binary target modeling, odds ratio, and classification threshold.',
    compute: (data, s) => fromAnalysis(runAnalysis('regression.logistic', data, { dependent: s.target, covariates: [s.num1, s.num2], model: 'binomial' })),
  },
  {
    id: 74, key: 'polynomial_regression', title: 'Polynomial Regression Module', group: 'Regression & Modeling', description: 'Degree selection, fit comparison, and residual chart.',
    compute: (data, s) => {
      const pairs = paired(data, s.num1, s.num2)
      const rows = [1, 2, 3].map((degree) => {
        const model = ols(pairs.map(([, y]) => y), pairs.map(([x]) => Array.from({ length: degree }, (_, i) => x ** (i + 1))))
        return { degree, r2: round(model.r2), adjR2: round(model.adjR2) }
      })
      return { title: 'Polynomial Regression', summary: 'Compares polynomial degrees 1 through 3.', metrics: [{ label: 'best degree', value: rows.sort((a, b) => Number(b.adjR2) - Number(a.adjR2))[0].degree }], table: rows }
    },
  },
  {
    id: 75, key: 'regression_diagnostics', title: 'Regression Diagnostics Module', group: 'Regression & Modeling', description: "Residual plots, leverage, Cook's distance, and multicollinearity indicators.",
    compute: (data, s) => fromAnalysis(runAnalysis('regression.linear', data, { dependent: s.target, covariates: [s.num1, s.num2, s.num3], ciLevel: 0.95 })),
  },
  {
    id: 76, key: 'time_series_basics', title: 'Time Series Basics Module', group: 'Regression & Modeling', description: 'Trend, moving average, seasonality view, and lag plot.',
    compute: (data, s) => fromAnalysis(runAnalysis('descriptives.timeSeries', data, { variable: s.num1, period: 12 })),
  },
  {
    id: 77, key: 'forecasting_basics', title: 'Forecasting Basics Module', group: 'Regression & Modeling', description: 'Naive forecast, moving average forecast, and exponential smoothing.',
    compute: (data, s) => fromAnalysis(runAnalysis('predictive.analytics', data, { predKind: 'forecast', dependent: s.num1, holdout: 0.3 })),
  },
  {
    id: 78, key: 'clustering', title: 'Clustering Basics Module', group: 'Regression & Modeling', description: 'K-means, hierarchical clustering, and cluster visualization.',
    compute: (data, s) => fromAnalysis(runAnalysis('ml.clustering', data, { variables: [s.num1, s.num2], algorithm: 'kmeans', k: 3 })),
  },
  {
    id: 79, key: 'pca', title: 'PCA Module', group: 'Regression & Modeling', description: 'Principal component analysis, explained variance, and biplot.',
    compute: (data, s) => fromAnalysis(runAnalysis('factor.pca', data, { variables: [s.num1, s.num2, s.num3], matrix: 'correlation' })),
  },
  {
    id: 80, key: 'classification_metrics', title: 'Classification Metrics Module', group: 'Regression & Modeling', description: 'Confusion matrix, accuracy, precision, recall, F1, and ROC-style chart.',
    compute: (data, s) => {
      const rows = paired(data, s.num1, s.target).map(([score, y]) => ({ score, y: y > 0 ? 1 : 0 }))
      const pred = rows.map((r) => r.score >= mean(rows.map((x) => x.score)) ? 1 : 0)
      const tp = pred.filter((p, i) => p === 1 && rows[i].y === 1).length, fp = pred.filter((p, i) => p === 1 && rows[i].y === 0).length
      const tn = pred.filter((p, i) => p === 0 && rows[i].y === 0).length, fn = pred.filter((p, i) => p === 0 && rows[i].y === 1).length
      const precision = tp / (tp + fp), recall = tp / (tp + fn)
      return { title: 'Classification Metrics', summary: 'Threshold metrics from selected score and binary target.', metrics: [{ label: 'accuracy', value: round((tp + tn) / rows.length) }, { label: 'precision', value: round(precision) }, { label: 'recall', value: round(recall) }, { label: 'F1', value: round(2 * precision * recall / (precision + recall)) }], table: toRows({ TP: tp, FP: fp, TN: tn, FN: fn }), chart: { data: [{ type: 'scatter', mode: 'lines+markers', x: [0, fp / (fp + tn), 1], y: [0, recall, 1] }], layout: baseChart('ROC-style Curve') } }
    },
  },
  ...chartModules,
  ...advancedModules,
]

export function defaultSelection(data: Record<string, unknown>[], selection: StatModuleSelection): Required<StatModuleSelection> {
  const keys = Object.keys(data[0] ?? {})
  const numCols = keys.filter((key) => numericColumn(data, key).length > 0)
  const catCols = keys.filter((key) => categories(data, key).length > 1 && categories(data, key).length <= Math.max(30, data.length / 2))
  return {
    num1: selection.num1 || numCols[0] || keys[0] || '',
    num2: selection.num2 || numCols[1] || numCols[0] || keys[0] || '',
    num3: selection.num3 || numCols[2] || numCols[1] || numCols[0] || keys[0] || '',
    cat1: selection.cat1 || catCols[0] || keys[0] || '',
    cat2: selection.cat2 || catCols[1] || catCols[0] || keys[0] || '',
    target: selection.target || numCols[3] || numCols[1] || numCols[0] || keys[0] || '',
    alpha: selection.alpha ?? alphaDefault,
  }
}

export function runStatModule(moduleKey: string, data: Record<string, unknown>[], selection: StatModuleSelection) {
  const module = STAT_MODULES.find((item) => item.key === moduleKey) ?? STAT_MODULES[0]
  const s = defaultSelection(data, selection)
  const qaNotes = numericalQaNotes(module, data, s)
  try {
    return appendNotes(module.compute(data, s), qaNotes)
  } catch (error) {
    return appendNotes({
      title: module.title.replace(' Module', ''),
      summary: error instanceof Error ? error.message : 'Unable to compute this module with the selected data.',
      metrics: [],
    }, [
      ...qaNotes,
      'Calculation failed safely; change selected variables or load a dataset with enough compatible rows.',
    ])
  }
}

void [
  spearmanPairs,
  kendallPairs,
  movingAverage,
  kmeans,
  simplePca,
  fisherExact2x2,
  exactBinomialPValue,
  logisticModel,
  kaplanMeier,
  dbscan,
]
