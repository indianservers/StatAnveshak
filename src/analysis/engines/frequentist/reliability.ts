import type { AnalysisOptions, AnalysisResult } from '../../types'
import { jacobiEigen, lm } from './linalg'
import { asFiniteNumber, mean, pearson, round, sampleVariance } from './numeric'
import { covOrCor } from './factor'
import { pTailT, qnorm } from './dists'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function itemMatrix(rows: Record<string, unknown>[], columns: string[]): number[][] {
  const out: number[][] = []
  for (const row of rows) {
    const vals = columns.map((col) => asFiniteNumber(row[col]))
    if (vals.every((v) => v !== null)) out.push(vals as number[])
  }
  return out
}

export function cronbachAlpha(X: number[][]): number {
  const k = X[0].length
  const itemVar = Array.from({ length: k }, (_, j) => sampleVariance(X.map((row) => row[j])))
  const totals = X.map((row) => row.reduce((s, v) => s + v, 0))
  const totVar = sampleVariance(totals)
  return (k / (k - 1)) * (1 - itemVar.reduce((s, v) => s + v, 0) / totVar)
}

function omegaTotal(X: number[][]): number {
  const k = X[0].length
  const means = Array.from({ length: k }, (_, j) => mean(X.map((row) => row[j])))
  const sds = Array.from({ length: k }, (_, j) => Math.sqrt(sampleVariance(X.map((row) => row[j]))) || 1)
  const Z = X.map((row) => row.map((v, j) => (v - means[j]) / sds[j]))
  const R = covOrCor(Z)
  const eig = jacobiEigen(R)
  const lambda = Array.from({ length: k }, (_, i) => eig.vectors[i][0] * Math.sqrt(Math.max(eig.values[0], 0)))
  const sumL = lambda.reduce((s, v) => s + v, 0)
  const uniq = lambda.map((l, i) => Math.max(0, R[i][i] - l * l))
  return (sumL * sumL) / (sumL * sumL + uniq.reduce((s, v) => s + v, 0))
}

function guttmanL6(X: number[][]): number {
  const k = X[0].length
  const n = X.length
  const totals = X.map((row) => row.reduce((s, v) => s + v, 0))
  const totVar = sampleVariance(totals)
  let e = 0
  for (let j = 0; j < k; j++) {
    const y = X.map((row) => row[j])
    const Z = X.map((row) => [1, ...row.filter((_, i) => i !== j)])
    const fit = lm(y, Z)
    const r2 = fit ? 1 - fit.sse / ((n - 1) * sampleVariance(y)) : 0
    e += sampleVariance(y) * (1 - Math.max(0, Math.min(1, r2)))
  }
  return 1 - e / totVar
}

function splitHalf(X: number[][]): number {
  const odd = X.map((row) => row.filter((_, i) => i % 2 === 0).reduce((s, v) => s + v, 0))
  const even = X.map((row) => row.filter((_, i) => i % 2 === 1).reduce((s, v) => s + v, 0))
  const r = pearson(odd, even)
  return (2 * r) / (1 + r)
}

export function runUnidimensional(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  if (variables.length < 2) return empty('reliability.unidimensional', 'Unidimensional Reliability', 'Select at least two numeric items.')
  const X = itemMatrix(rows, variables)
  if (X.length < 3) return empty('reliability.unidimensional', 'Unidimensional Reliability', 'Need at least three complete cases.')
  const alpha = cronbachAlpha(X)
  const omega = omegaTotal(X)
  const l6 = guttmanL6(X)
  const sb = splitHalf(X)
  return {
    analysisId: 'reliability.unidimensional',
    title: 'Unidimensional Reliability',
    interpretation: `Cronbach’s α = ${round(alpha)}; McDonald’s ω (1-factor) = ${round(omega)}; Guttman λ₆ = ${round(l6)}; Spearman–Brown split-half = ${round(sb)}. n = ${X.length}, k = ${variables.length}.`,
    assumptions: ['Items are treated as a single scale. Alpha assumes tau-equivalence; omega uses a one-factor PCA loading approximation.'],
    footnotes: ['Bayesian reliability arrives in Phase 4.', 'SEM-based omega from CFA is Phase 6.'],
    tables: [{
      id: 'rel',
      title: 'Coefficients',
      columns: ['Coefficient', 'Estimate'],
      rows: [
        ['Cronbach α', round(alpha)],
        ['McDonald ω', round(omega)],
        ['Guttman λ₆', round(l6)],
        ['Spearman–Brown (odd/even)', round(sb)],
      ],
    }],
    plots: [{
      id: 'means',
      title: 'Item means',
      data: [{ type: 'bar', x: variables, y: variables.map((_, j) => mean(X.map((row) => row[j]))) }],
      layout: { yaxis: { title: 'Mean' }, margin: { t: 40, r: 20, b: 80, l: 56 } },
    }],
  }
}

function iccModels(X: number[][]) {
  const n = X.length
  const k = X[0].length
  const grand = mean(X.flat())
  const rowMeans = X.map((row) => mean(row))
  const colMeans = Array.from({ length: k }, (_, j) => mean(X.map((row) => row[j])))
  let ssr = 0
  let ssc = 0
  let sse = 0
  for (let i = 0; i < n; i++) {
    ssr += k * (rowMeans[i] - grand) ** 2
    for (let j = 0; j < k; j++) {
      sse += (X[i][j] - rowMeans[i] - colMeans[j] + grand) ** 2
    }
  }
  for (let j = 0; j < k; j++) ssc += n * (colMeans[j] - grand) ** 2
  const msr = ssr / (n - 1)
  const msc = ssc / (k - 1)
  const mse = sse / ((n - 1) * (k - 1))
  const msw = (ssc + sse) / (n * (k - 1))
  const icc1 = (msr - msw) / (msr + (k - 1) * msw)
  const icc21 = (msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n)
  const icc31 = (msr - mse) / (msr + (k - 1) * mse)
  const icc1k = (msr - msw) / msr
  const icc2k = (msr - mse) / (msr + (msc - mse) / n)
  const icc3k = (msr - mse) / msr
  return { icc1, icc21, icc31, icc1k, icc2k, icc3k, msr, msc, mse }
}

export function runIcc(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  if (variables.length < 2) return empty('reliability.icc', 'Intraclass Correlation', 'Select at least two rater/measure columns.')
  const X = itemMatrix(rows, variables)
  if (X.length < 3) return empty('reliability.icc', 'Intraclass Correlation', 'Need at least three subjects with complete ratings.')
  const icc = iccModels(X)
  return {
    analysisId: 'reliability.icc',
    title: 'Intraclass Correlation',
    interpretation: `Shrout–Fleiss / McGraw–Wong ICCs for ${X.length} subjects × ${variables.length} raters. Single-rater two-way random absolute ICC(2,1) = ${round(icc.icc21)}.`,
    assumptions: ['Columns are raters (or occasions); rows are subjects. Missing ratings are listwise-deleted.'],
    footnotes: ['ICC(1) is one-way random; ICC(2) two-way random (absolute); ICC(3) two-way mixed (consistency). k-forms are averages of k raters.'],
    tables: [{
      id: 'icc',
      title: 'ICC',
      columns: ['Form', 'Estimate'],
      rows: [
        ['ICC(1,1)', round(icc.icc1)],
        ['ICC(2,1)', round(icc.icc21)],
        ['ICC(3,1)', round(icc.icc31)],
        ['ICC(1,k)', round(icc.icc1k)],
        ['ICC(2,k)', round(icc.icc2k)],
        ['ICC(3,k)', round(icc.icc3k)],
      ],
    }],
    plots: [{
      id: 'raters',
      title: 'Rater means',
      data: [{ type: 'bar', x: variables, y: variables.map((_, j) => mean(X.map((row) => row[j]))) }],
      layout: { margin: { t: 40, r: 20, b: 80, l: 56 } },
    }],
  }
}

function cohenKappa(a: string[], b: string[]): number {
  const n = a.length
  const levels = [...new Set([...a, ...b])]
  const po = a.filter((v, i) => v === b[i]).length / n
  let pe = 0
  for (const level of levels) {
    pe += (a.filter((v) => v === level).length / n) * (b.filter((v) => v === level).length / n)
  }
  return (po - pe) / (1 - pe)
}

function fleissKappa(ratings: string[][]): number {
  const n = ratings.length
  const k = ratings[0].length
  const levels = [...new Set(ratings.flat())]
  const p = levels.map((level) => ratings.flat().filter((v) => v === level).length / (n * k))
  let Pbar = 0
  for (const row of ratings) {
    let s = 0
    for (const level of levels) {
      const c = row.filter((v) => v === level).length
      s += c * (c - 1)
    }
    Pbar += s / (k * (k - 1))
  }
  Pbar /= n
  const Pe = p.reduce((s, pi) => s + pi * pi, 0)
  return (Pbar - Pe) / (1 - Pe)
}

function krippInterval(X: number[][]): number {
  const m = X[0].length
  const values = X.flat()
  let Do = 0
  let pairs = 0
  for (const row of X) {
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        Do += (row[i] - row[j]) ** 2
        pairs++
      }
    }
  }
  Do /= pairs
  const De = sampleVariance(values) * 2
  return 1 - Do / De
}

export function runAgreement(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const raters = Array.isArray(options.raters) ? options.raters.map(String) : []
  if (raters.length < 2) return empty('reliability.agreement', 'Rater Agreement', 'Assign at least two rater columns.')
  const keep = rows.filter((row) => raters.every((r) => row[r] !== null && row[r] !== undefined && row[r] !== ''))
  if (keep.length < 3) return empty('reliability.agreement', 'Rater Agreement', 'Need complete ratings.')
  const cats = keep.map((row) => raters.map((r) => String(row[r])))
  const kappa2 = cohenKappa(cats.map((r) => r[0]), cats.map((r) => r[1]))
  const fleiss = fleissKappa(cats)
  const nums = itemMatrix(keep, raters)
  const kripp = nums.length ? krippInterval(nums) : Number.NaN
  return {
    analysisId: 'reliability.agreement',
    title: 'Rater Agreement',
    interpretation: `Cohen’s κ (first two raters) = ${round(kappa2)}; Fleiss’ κ = ${round(fleiss)}${Number.isFinite(kripp) ? `; Krippendorff’s α (interval) = ${round(kripp)}` : ''}. n = ${keep.length}.`,
    assumptions: ['Cohen’s κ uses the first two assigned rater columns. Fleiss uses all raters. Interval α requires numeric codes.'],
    footnotes: ['Chance-corrected agreement; interpret κ with prevalence in mind.'],
    tables: [{
      id: 'agr',
      title: 'Agreement',
      columns: ['Coefficient', 'Estimate'],
      rows: [
        ['Cohen κ (raters 1–2)', round(kappa2)],
        ['Fleiss κ', round(fleiss)],
        ['Krippendorff α (interval)', Number.isFinite(kripp) ? round(kripp) : '—'],
      ],
    }],
    plots: [],
  }
}

export function runBlandAltman(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const a = String(options.measure1 ?? '')
  const b = String(options.measure2 ?? '')
  if (!a || !b) return empty('reliability.blandAltman', 'Bland–Altman Plots', 'Assign two numeric measures.')
  const pairs: { x: number; y: number }[] = []
  for (const row of rows) {
    const x = asFiniteNumber(row[a])
    const y = asFiniteNumber(row[b])
    if (x !== null && y !== null) pairs.push({ x, y })
  }
  if (pairs.length < 3) return empty('reliability.blandAltman', 'Bland–Altman Plots', 'Need at least three complete pairs.')
  const avg = pairs.map((p) => (p.x + p.y) / 2)
  const diff = pairs.map((p) => p.x - p.y)
  const md = mean(diff)
  const sd = Math.sqrt(sampleVariance(diff))
  const z = qnorm(0.975)
  const loaLo = md - z * sd
  const loaHi = md + z * sd
  const seMean = sd / Math.sqrt(diff.length)
  const t = md / seMean
  return {
    analysisId: 'reliability.blandAltman',
    title: 'Bland–Altman Plots',
    interpretation: `Mean difference (${a} − ${b}) = ${round(md)}; 95% limits of agreement ${round(loaLo)} to ${round(loaHi)}. n = ${pairs.length}.`,
    assumptions: ['Differences are approximately homoscedastic across the measurement range. Limits use ±1.96 SD of the differences.'],
    footnotes: [`One-sample t vs 0 for the bias: t = ${round(t)}, p = ${round(pTailT(t, pairs.length - 1, 'two-sided'))}.`],
    tables: [{
      id: 'ba',
      title: 'Agreement',
      columns: ['n', 'Mean difference', 'SD(diff)', 'LoA low', 'LoA high'],
      rows: [[pairs.length, round(md), round(sd), round(loaLo), round(loaHi)]],
    }],
    plots: [{
      id: 'ba',
      title: 'Bland–Altman',
      data: [
        { type: 'scatter', mode: 'markers', x: avg, y: diff, name: 'Pairs' },
        { type: 'scatter', mode: 'lines', x: [Math.min(...avg), Math.max(...avg)], y: [md, md], name: 'Bias' },
        { type: 'scatter', mode: 'lines', x: [Math.min(...avg), Math.max(...avg)], y: [loaLo, loaLo], name: 'LoA' },
        { type: 'scatter', mode: 'lines', x: [Math.min(...avg), Math.max(...avg)], y: [loaHi, loaHi], name: 'LoA' },
      ],
      layout: { xaxis: { title: 'Average' }, yaxis: { title: `${a} − ${b}` }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}
