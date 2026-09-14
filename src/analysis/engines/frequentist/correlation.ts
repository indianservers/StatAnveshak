import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailT, pnorm, qnorm } from './dists'
import { lm } from './linalg'
import { asFiniteNumber, pearson, round } from './numeric'

function empty(message: string): AnalysisResult {
  return { analysisId: 'regression.correlation', title: 'Correlation', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function ranks(values: number[]): number[] {
  const order = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value)
  const out = Array<number>(values.length).fill(0)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j < order.length && order[j].value === order[i].value) j++
    const rank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) out[order[k].i] = rank
    i = j
  }
  return out
}

export function pearsonR(x: number[], y: number[]): number {
  return pearson(x, y)
}

export function spearmanR(x: number[], y: number[]): number {
  return pearson(ranks(x), ranks(y))
}

export function kendallTauB(x: number[], y: number[]): number {
  const n = x.length
  let conc = 0
  let disc = 0
  let tx = 0
  let ty = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Math.sign(x[i] - x[j])
      const dy = Math.sign(y[i] - y[j])
      if (dx === 0 && dy === 0) continue
      if (dx === 0) { ty++; continue }
      if (dy === 0) { tx++; continue }
      if (dx === dy) conc++
      else disc++
    }
  }
  const n0 = n * (n - 1) / 2
  const den = Math.sqrt((n0 - tx) * (n0 - ty))
  return den === 0 ? 0 : (conc - disc) / den
}

function pearsonP(r: number, n: number): number {
  if (n <= 2 || !Number.isFinite(r)) return Number.NaN
  if (Math.abs(r) >= 1) return 0
  const t = r * Math.sqrt((n - 2) / (1 - r * r))
  return pTailT(t, n - 2, 'two-sided')
}

function fisherZCi(r: number, n: number, alpha: number): [number, number] {
  if (n <= 3 || !Number.isFinite(r) || Math.abs(r) >= 1) return [r, r]
  const z = 0.5 * Math.log((1 + r) / (1 - r))
  const se = 1 / Math.sqrt(n - 3)
  const crit = qnorm(1 - alpha / 2)
  const tanh = (v: number) => Math.tanh(v)
  return [tanh(z - crit * se), tanh(z + crit * se)]
}

function pairs(rows: Record<string, unknown>[], a: string, b: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const row of rows) {
    const x = asFiniteNumber(row[a])
    const y = asFiniteNumber(row[b])
    if (x !== null && y !== null) out.push({ x, y })
  }
  return out
}

export function runCorrelation(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  const method = String(options.method ?? 'pearson')
  const controls = Array.isArray(options.controls) ? options.controls.map(String) : typeof options.controls === 'string' && options.controls ? [String(options.controls)] : []
  const alpha = 1 - Number(options.ciLevel ?? 0.95)
  if (variables.length < 2) return empty('Select at least two numeric variables.')

  const corr = (x: number[], y: number[]) => method === 'spearman' ? spearmanR(x, y) : method === 'kendall' ? kendallTauB(x, y) : pearsonR(x, y)
  const names = variables
  const R = names.map(() => Array<number>(names.length).fill(Number.NaN))
  const P = names.map(() => Array<number>(names.length).fill(Number.NaN))
  const N = names.map(() => Array<number>(names.length).fill(0))

  for (let i = 0; i < names.length; i++) {
    R[i][i] = 1
    P[i][i] = 0
    for (let j = i + 1; j < names.length; j++) {
      let x: number[] = []
      let y: number[] = []
      if (controls.length) {
        const complete: { x: number; y: number; z: number[] }[] = []
        for (const row of rows) {
          const xv = asFiniteNumber(row[names[i]])
          const yv = asFiniteNumber(row[names[j]])
          const z = controls.map((c) => asFiniteNumber(row[c]))
          if (xv !== null && yv !== null && z.every((v) => v !== null)) complete.push({ x: xv, y: yv, z: z as number[] })
        }
        if (complete.length > controls.length + 3) {
          const Z = complete.map((r) => [1, ...r.z])
          const fx = lm(complete.map((r) => r.x), Z)
          const fy = lm(complete.map((r) => r.y), Z)
          if (fx && fy) {
            x = complete.map((r, k) => r.x - fx.fitted[k])
            y = complete.map((r, k) => r.y - fy.fitted[k])
          }
        }
      } else {
        const pts = pairs(rows, names[i], names[j])
        x = pts.map((p) => p.x)
        y = pts.map((p) => p.y)
      }
      const r = x.length >= 3 ? corr(x, y) : Number.NaN
      const n = x.length
      R[i][j] = R[j][i] = r
      P[i][j] = P[j][i] = method === 'kendall'
        ? 2 * Math.min(pnorm(-Math.abs(r) * Math.sqrt((9 * n * (n - 1)) / (2 * (2 * n + 5)))), 0.5)
        : pearsonP(r, n - controls.length)
      N[i][j] = N[j][i] = n
    }
  }

  const pairRows: Array<Array<string | number>> = []
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const r = R[i][j]
      const [lo, hi] = method === 'pearson' && !controls.length ? fisherZCi(r, N[i][j], alpha) : [Number.NaN, Number.NaN]
      pairRows.push([`${names[i]} — ${names[j]}`, round(r), N[i][j], round(P[i][j]), Number.isFinite(lo) ? round(lo) : '—', Number.isFinite(hi) ? round(hi) : '—'])
    }
  }

  return {
    analysisId: 'regression.correlation',
    title: 'Correlation',
    interpretation: `${method[0].toUpperCase()}${method.slice(1)} correlations for ${names.length} variables${controls.length ? ` controlling for ${controls.join(', ')}` : ''}.`,
    assumptions: [
      method === 'pearson' ? 'Pearson assumes linear association and (for p-values) bivariate normality.' : method === 'spearman' ? 'Spearman is Pearson on ranks (monotonic association).' : 'Kendall’s τ-b accounts for ties; p-values use a normal approximation.',
      controls.length ? 'Partial correlations are correlations of residuals after OLS adjustment for the control set.' : 'Listwise deletion is used per pair.',
    ],
    footnotes: [
      'Confidence intervals use Fisher z for Pearson pairs without controls.',
      'Bayesian correlation arrives in Phase 4.',
    ],
    tables: [
      { id: 'pairs', title: 'Pairwise correlations', columns: ['Pair', 'r', 'n', 'p', 'CI low', 'CI high'], rows: pairRows },
      { id: 'matrix', title: 'Correlation matrix', columns: ['', ...names], rows: names.map((name, i) => [name, ...R[i].map((v) => round(v))]) },
    ],
    plots: [{
      id: 'heat',
      title: 'Correlation heatmap',
      data: [{ type: 'heatmap', z: R, x: names, y: names, colorscale: 'RdBu', zmin: -1, zmax: 1, reversescale: true }],
      layout: { margin: { t: 40, r: 20, b: 80, l: 80 } },
    }],
  }
}
