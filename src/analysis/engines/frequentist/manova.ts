import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailF } from './dists'
import { inverse, jacobiEigen } from './linalg'
import { asFiniteNumber, mean, round } from './numeric'

function empty(message: string): AnalysisResult {
  return { analysisId: 'anova.manova', title: 'MANOVA', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function multiply(A: number[][], B: number[][]): number[][] {
  const n = A.length
  const m = B[0].length
  const k = B.length
  const C = Array.from({ length: n }, () => Array<number>(m).fill(0))
  for (let i = 0; i < n; i++) for (let t = 0; t < k; t++) for (let j = 0; j < m; j++) C[i][j] += A[i][t] * B[t][j]
  return C
}

export function runManova(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dvs = Array.isArray(options.dependents) ? options.dependents.map(String) : []
  const group = typeof options.group === 'string' ? options.group : ''
  if (dvs.length < 2 || !group) return empty('Assign at least two numeric outcomes and a grouping factor.')
  const Y: number[][] = []
  const g: string[] = []
  for (const row of rows) {
    const vals = dvs.map((d) => asFiniteNumber(row[d]))
    if (vals.some((v) => v === null)) continue
    Y.push(vals as number[])
    g.push(String(row[group] ?? '(missing)'))
  }
  const n = Y.length
  const p = dvs.length
  const levels = [...new Set(g)]
  const k = levels.length
  if (k < 2) return empty('The grouping factor needs at least two levels.')
  if (n <= k + p) return empty('Not enough complete cases relative to groups and outcomes.')

  const grand = Array.from({ length: p }, (_, j) => mean(Y.map((r) => r[j])))
  const E = Array.from({ length: p }, () => Array<number>(p).fill(0))
  const H = Array.from({ length: p }, () => Array<number>(p).fill(0))
  for (const level of levels) {
    const idx = g.map((v, i) => (v === level ? i : -1)).filter((i) => i >= 0)
    const m = idx.map((i) => Y[i])
    const mu = Array.from({ length: p }, (_, j) => mean(m.map((r) => r[j])))
    for (const row of m) {
      for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) E[i][j] += (row[i] - mu[i]) * (row[j] - mu[j])
    }
    const ng = m.length
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) H[i][j] += ng * (mu[i] - grand[i]) * (mu[j] - grand[j])
  }
  const Einv = inverse(E)
  if (!Einv) return empty('Within-group SSP matrix is singular (collinear outcomes or empty cells).')
  const EH = multiply(Einv, H)
  const sym = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (__, j) => (EH[i][j] + EH[j][i]) / 2))
  const { values } = jacobiEigen(sym)
  const lambdas = values.filter((v) => v > 1e-12)
  const s = Math.min(p, k - 1)
  const pillai = lambdas.reduce((sum, l) => sum + l / (1 + l), 0)
  const wilks = lambdas.reduce((prod, l) => prod / (1 + l), 1)
  const hotel = lambdas.reduce((sum, l) => sum + l, 0)
  const roy = Math.max(...lambdas, 0)

  const ve = n - k
  const h = k - 1
  const mstat = (Math.abs(p - h) - 1) / 2
  const N = (ve - p - 1) / 2

  const pillaiF = ((2 * N + s + 1) / (2 * mstat + s + 1)) * (pillai / Math.max(1e-12, s - pillai))
  const pillaiDf1 = s * (2 * mstat + s + 1)
  const pillaiDf2 = s * (2 * N + s + 1)

  const r = ve - (p - h + 1) / 2
  const u = (p * h - 2) / 4
  const t = p * p + h * h - 5 > 0 ? Math.sqrt((p * p * h * h - 4) / (p * p + h * h - 5)) : 1
  const wilksF = ((r * t - 2 * u) / (p * h)) * (1 - wilks ** (1 / t)) / wilks ** (1 / t)
  const wilksDf1 = p * h
  const wilksDf2 = r * t - 2 * u

  const hotelF = (2 * (s * N + 1) * hotel) / (s * s * (2 * mstat + s + 1))
  const hotelDf1 = s * (2 * mstat + s + 1)
  const hotelDf2 = 2 * (s * N + 1)

  const royF = ((ve - p + h) * roy) / p
  const royDf1 = p
  const royDf2 = ve - p + h

  const tests = [
    { name: 'Pillai', stat: pillai, F: pillaiF, df1: pillaiDf1, df2: pillaiDf2 },
    { name: 'Wilks', stat: wilks, F: wilksF, df1: wilksDf1, df2: wilksDf2 },
    { name: 'Hotelling–Lawley', stat: hotel, F: hotelF, df1: hotelDf1, df2: hotelDf2 },
    { name: 'Roy', stat: roy, F: royF, df1: royDf1, df2: royDf2 },
  ]

  return {
    analysisId: 'anova.manova',
    title: 'MANOVA',
    interpretation: `Multivariate test of ${group} across ${dvs.join(', ')}. Pillai = ${round(pillai)}, F ≈ ${round(pillaiF)}, p ≈ ${round(pTailF(pillaiF, pillaiDf1, pillaiDf2))}.`,
    assumptions: [
      'Outcomes are jointly normal within groups with a common covariance (Box M is not reported yet).',
      'Roy’s F is an upper-bound approximation on the largest root.',
    ],
    footnotes: [
      'Statistics are functions of the eigenvalues of E⁻¹H. Pillai, Wilks, and Hotelling–Lawley use the standard F approximations (Anderson / Rao).',
      'Univariate ANOVAs below are not multiplicity-adjusted.',
    ],
    tables: [
      {
        id: 'multi',
        title: 'Multivariate tests',
        columns: ['Test', 'Statistic', 'approx F', 'df1', 'df2', 'p'],
        rows: tests.map((t) => [t.name, round(t.stat), round(t.F), round(t.df1, 4), round(t.df2, 4), round(pTailF(t.F, t.df1, t.df2))]),
      },
      {
        id: 'eigen',
        title: 'Eigenvalues of E⁻¹H',
        columns: ['Root', 'λ', 'θ = λ/(1+λ)'],
        rows: lambdas.map((l, i) => [i + 1, round(l), round(l / (1 + l))]),
      },
    ],
    plots: [{
      id: 'means',
      title: 'Group mean profiles',
      data: levels.map((level) => {
        const m = Y.filter((_, i) => g[i] === level)
        return { type: 'scatter', mode: 'lines+markers', name: level, x: dvs, y: dvs.map((_, j) => mean(m.map((r) => r[j]))) }
      }),
      layout: { yaxis: { title: 'Mean' }, margin: { t: 40, r: 20, b: 60, l: 56 } },
    }],
  }
}
