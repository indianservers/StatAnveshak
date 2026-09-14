import type { AnalysisOptions, AnalysisResult } from '../../types'
import { buildDesign } from './design'
import { pTailChi, pnorm, qnorm } from './dists'
import { glmFit } from './glm'
import { round } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function logFact(n: number): number {
  let s = 0
  for (let i = 2; i <= n; i++) s += Math.log(i)
  return s
}

function binomPmf(k: number, n: number, p: number): number {
  return Math.exp(logFact(n) - logFact(k) - logFact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p))
}

export function binomialExactP(k: number, n: number, p0: number): number {
  const obs = binomPmf(k, n, p0)
  let p = 0
  for (let i = 0; i <= n; i++) {
    const pi = binomPmf(i, n, p0)
    if (pi <= obs + 1e-15) p += pi
  }
  return Math.min(1, p)
}

function binomialMidP(k: number, n: number, p0: number): number {
  return Math.min(1, binomialExactP(k, n, p0) - 0.5 * binomPmf(k, n, p0))
}

function wilson(k: number, n: number, z: number): [number, number] {
  const p = k / n
  const den = 1 + z * z / n
  const center = (p + z * z / (2 * n)) / den
  const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
  return [center - half, center + half]
}

export function runBinomial(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const success = String(options.success ?? '')
  const p0 = Number(options.p0 ?? 0.5)
  const alpha = Number(options.alpha ?? 0.05)
  if (!variable) return empty('frequencies.binomial', 'Binomial Test', 'Assign a variable.')
  const values = rows.map((row) => row[variable]).filter((v) => v !== null && v !== undefined && v !== '')
  const levels = [...new Set(values.map((v) => String(v)))]
  const s = success && levels.includes(success) ? success : levels[0]
  const k = values.filter((v) => String(v) === s).length
  const n = values.length
  const pHat = k / n
  const z = qnorm(1 - alpha / 2)
  const se = Math.sqrt(p0 * (1 - p0) / n)
  const waldZ = se > 0 ? (pHat - p0) / Math.sqrt(pHat * (1 - pHat) / n) : 0
  const waldP = 2 * (1 - pnorm(Math.abs(waldZ)))
  const exact = binomialExactP(k, n, p0)
  const mid = binomialMidP(k, n, p0)
  const [wLo, wHi] = wilson(k, n, z)
  const waldLo = pHat - z * Math.sqrt(pHat * (1 - pHat) / n)
  const waldHi = pHat + z * Math.sqrt(pHat * (1 - pHat) / n)
  return {
    analysisId: 'frequencies.binomial',
    title: 'Binomial Test',
    interpretation: `${k} / ${n} successes (${s}) vs p₀ = ${p0}. Exact two-sided p = ${round(exact)}; mid-p = ${round(mid)}; Wald p = ${round(waldP)}.`,
    assumptions: ['Trials are i.i.d. Bernoulli. If the variable has more than two levels, the selected success level is counted against all others.'],
    footnotes: ['Exact p-values sum binomial probabilities at most as large as the observed one (two-sided).', 'Wilson interval is recommended over Wald for p near 0 or 1.', 'Bayesian binomial arrives in Phase 4.'],
    tables: [{
      id: 'test',
      title: 'Binomial test',
      columns: ['Successes', 'n', 'p̂', 'p₀', 'Exact p', 'Mid-p', 'Wald p', 'Wald CI low', 'Wald CI high', 'Wilson CI low', 'Wilson CI high'],
      rows: [[k, n, round(pHat), p0, round(exact), round(mid), round(waldP), round(waldLo), round(waldHi), round(wLo), round(wHi)]],
    }],
    plots: [{
      id: 'bar',
      title: 'Observed proportion',
      data: [{ type: 'bar', x: [s, 'other'], y: [k, n - k] }],
      layout: { yaxis: { title: 'Count' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}

export function runMultinomial(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  if (!variable) return empty('frequencies.multinomial', 'Multinomial Test', 'Assign a categorical variable.')
  const values = rows.map((row) => String(row[variable] ?? '(missing)'))
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  const n = values.length
  const k = counts.size
  const expected = n / k
  let chi = 0
  let g2 = 0
  const tableRows: Array<Array<string | number>> = []
  for (const [level, o] of [...counts.entries()].sort()) {
    chi += (o - expected) ** 2 / expected
    g2 += o === 0 ? 0 : 2 * o * Math.log(o / expected)
    tableRows.push([level, o, round(expected), round(o / n)])
  }
  const df = k - 1
  return {
    analysisId: 'frequencies.multinomial',
    title: 'Multinomial Test',
    interpretation: `Equal-probability multinomial GOF for ${variable}: Pearson χ²(${df}) = ${round(chi)}, p = ${round(pTailChi(chi, df))}; G² = ${round(g2)}, p = ${round(pTailChi(g2, df))}.`,
    assumptions: ['Null probabilities are 1/k for each observed level. Empty unobserved levels are not included.'],
    footnotes: ['Bayesian informed multinomial arrives in Phase 4.'],
    tables: [
      { id: 'gof', title: 'Goodness of fit', columns: ['Pearson χ²', 'G²', 'df', 'Pearson p', 'G² p'], rows: [[round(chi), round(g2), df, round(pTailChi(chi, df)), round(pTailChi(g2, df))]] },
      { id: 'counts', title: 'Counts', columns: ['Level', 'Observed', 'Expected', 'Proportion'], rows: tableRows },
    ],
    plots: [{
      id: 'bar',
      title: 'Observed vs equal expected',
      data: [
        { type: 'bar', name: 'Observed', x: tableRows.map((r) => r[0]), y: tableRows.map((r) => r[1]) },
        { type: 'bar', name: 'Expected', x: tableRows.map((r) => r[0]), y: tableRows.map((r) => r[2]) },
      ],
      layout: { barmode: 'group', margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}

function crossTab(rows: Record<string, unknown>[], a: string, b: string) {
  const A: string[] = []
  const B: string[] = []
  const pairs: [string, string][] = []
  for (const row of rows) {
    if (row[a] === null || row[a] === undefined || row[a] === '') continue
    if (row[b] === null || row[b] === undefined || row[b] === '') continue
    const ra = String(row[a])
    const cb = String(row[b])
    pairs.push([ra, cb])
    if (!A.includes(ra)) A.push(ra)
    if (!B.includes(cb)) B.push(cb)
  }
  const matrix = A.map(() => Array(B.length).fill(0))
  for (const [ra, cb] of pairs) matrix[A.indexOf(ra)][B.indexOf(cb)]++
  return { A, B, matrix, n: pairs.length }
}

function fisher2x2(a: number, b: number, c: number, d: number): number {
  const n = a + b + c + d
  const r1 = a + b
  const c1 = a + c
  const lo = Math.max(0, r1 + c1 - n)
  const hi = Math.min(r1, c1)
  const pAt = (x: number) => Math.exp(logFact(r1) + logFact(n - r1) + logFact(c1) + logFact(n - c1) - logFact(n) - logFact(x) - logFact(r1 - x) - logFact(c1 - x) - logFact(n - r1 - c1 + x))
  const pObs = pAt(a)
  let p = 0
  for (let x = lo; x <= hi; x++) {
    const px = pAt(x)
    if (px <= pObs + 1e-15) p += px
  }
  return Math.min(1, p)
}

export function runContingency(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const rowVar = String(options.rows ?? '')
  const colVar = String(options.columns ?? '')
  const stratum = String(options.stratum ?? '')
  if (!rowVar || !colVar) return empty('frequencies.contingency', 'Contingency Tables', 'Assign row and column variables.')
  const { A, B, matrix, n } = crossTab(rows, rowVar, colVar)
  const rowSum = matrix.map((r) => r.reduce((s, v) => s + v, 0))
  const colSum = B.map((_, j) => matrix.reduce((s, r) => s + r[j], 0))
  let chi = 0
  let g2 = 0
  const expected = matrix.map((r, i) => r.map((_, j) => rowSum[i] * colSum[j] / n))
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B.length; j++) {
      const e = expected[i][j]
      if (e > 0) {
        chi += (matrix[i][j] - e) ** 2 / e
        if (matrix[i][j] > 0) g2 += 2 * matrix[i][j] * Math.log(matrix[i][j] / e)
      }
    }
  }
  const df = (A.length - 1) * (B.length - 1)
  const fisher = A.length === 2 && B.length === 2 ? fisher2x2(matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]) : Number.NaN
  let or = Number.NaN
  let rr = Number.NaN
  if (A.length === 2 && B.length === 2) {
    const a = matrix[0][0], b = matrix[0][1], c = matrix[1][0], d = matrix[1][1]
    or = (a * d) / Math.max(1e-12, b * c)
    rr = (a / Math.max(1, a + b)) / Math.max(1e-12, c / Math.max(1, c + d))
  }
  let mcnemar = Number.NaN
  if (A.length === 2 && B.length === 2) {
    const b = matrix[0][1]
    const c = matrix[1][0]
    mcnemar = (Math.abs(b - c) - 1) ** 2 / Math.max(1, b + c)
  }
  let cmh = Number.NaN
  if (stratum) {
    const strata = [...new Set(rows.map((r) => String(r[stratum] ?? '')))]
    let num = 0
    let den = 0
    for (const s of strata) {
      const slice = rows.filter((r) => String(r[stratum] ?? '') === s)
      const t = crossTab(slice, rowVar, colVar)
      if (t.A.length !== 2 || t.B.length !== 2) continue
      const a = t.matrix[0][0]
      const n1 = t.matrix[0][0] + t.matrix[0][1]
      const n2 = t.matrix[1][0] + t.matrix[1][1]
      const m1 = t.matrix[0][0] + t.matrix[1][0]
      const N = t.n
      num += a - n1 * m1 / N
      den += n1 * n2 * m1 * (N - m1) / (N * N * (N - 1))
    }
    cmh = den > 0 ? (Math.abs(num) - 0.5) ** 2 / den : Number.NaN
  }

  return {
    analysisId: 'frequencies.contingency',
    title: 'Contingency Tables',
    interpretation: `Independence of ${rowVar} and ${colVar}: Pearson χ²(${df}) = ${round(chi)}, p = ${round(pTailChi(chi, df))}; likelihood-ratio G² = ${round(g2)}, p = ${round(pTailChi(g2, df))}.`,
    assumptions: [
      expected.flat().some((e) => e < 5) ? 'Some expected counts are < 5; Fisher or exact methods are more trustworthy in 2×2 tables.' : 'Expected counts are adequate for the χ² approximation.',
    ],
    footnotes: [
      'McNemar uses the 2×2 off-diagonals (paired binary change) with continuity correction.',
      'CMH is computed when a stratum variable is assigned (2×2 within each stratum).',
      'Bayesian contingency tables arrive in Phase 4.',
    ],
    tables: [
      {
        id: 'tests',
        title: 'Tests',
        columns: ['Pearson χ²', 'df', 'p', 'G²', 'G² p', 'Fisher p', 'Odds ratio', 'Risk ratio', 'McNemar χ²', 'McNemar p', 'CMH χ²', 'CMH p'],
        rows: [[round(chi), df, round(pTailChi(chi, df)), round(g2), round(pTailChi(g2, df)), Number.isFinite(fisher) ? round(fisher) : '—', Number.isFinite(or) ? round(or) : '—', Number.isFinite(rr) ? round(rr) : '—', Number.isFinite(mcnemar) ? round(mcnemar) : '—', Number.isFinite(mcnemar) ? round(pTailChi(mcnemar, 1)) : '—', Number.isFinite(cmh) ? round(cmh) : '—', Number.isFinite(cmh) ? round(pTailChi(cmh, 1)) : '—']],
      },
      {
        id: 'table',
        title: 'Observed counts',
        columns: [rowVar, ...B, 'Total'],
        rows: [...matrix.map((r, i) => [A[i], ...r, rowSum[i]]), ['Total', ...colSum, n]],
      },
    ],
    plots: [{
      id: 'heat',
      title: 'Contingency heatmap',
      data: [{ type: 'heatmap', z: matrix, x: B, y: A, colorscale: 'Blues' }],
      layout: { margin: { t: 40, r: 20, b: 60, l: 80 } },
    }],
  }
}

export function runLogLinear(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const a = String(options.rows ?? '')
  const b = String(options.columns ?? '')
  const c = String(options.stratum ?? '')
  if (!a || !b) return empty('frequencies.loglinear', 'Log-Linear Regression', 'Assign at least two categorical factors.')
  const factors = c ? [a, b, c] : [a, b]
  const keys = new Map<string, number>()
  for (const row of rows) {
    if (factors.some((f) => row[f] === null || row[f] === undefined || row[f] === '')) continue
    const key = factors.map((f) => String(row[f])).join('\t')
    keys.set(key, (keys.get(key) ?? 0) + 1)
  }
  const cellRows = [...keys.entries()].map(([key, count]) => {
    const parts = key.split('\t')
    const rec: Record<string, unknown> = { count }
    factors.forEach((f, i) => { rec[f] = parts[i] })
    return rec
  })
  const y = cellRows.map((r) => Number(r.count))
  const design = buildDesign(cellRows, [], factors, true)
  const fit = glmFit(y, design.X, 'poisson')
  if (!fit) return empty('frequencies.loglinear', 'Log-Linear Regression', 'Poisson log-linear fit failed.')
  return {
    analysisId: 'frequencies.loglinear',
    title: 'Log-Linear Regression',
    interpretation: `Poisson log-linear model of the ${factors.join(' × ')} table, n_cells = ${y.length}. Deviance = ${round(fit.deviance)}, AIC = ${round(fit.aic)}.`,
    assumptions: ['Cell counts are independent Poisson (or multinomial equivalent under the closed-form constraint). Interaction of the first two factors is included when two factors are present; a third factor adds its main effect and two-way terms from the design builder.'],
    footnotes: ['This is a GLM with Poisson family and log link on aggregated cells.', 'Bayesian log-linear models arrive in Phase 4.'],
    tables: [
      { id: 'fit', title: 'Fit', columns: ['Cells', 'Deviance', 'df', 'AIC'], rows: [[y.length, round(fit.deviance), fit.dfResidual, round(fit.aic)]] },
      { id: 'coef', title: 'Coefficients (log expected count)', columns: ['Term', 'Estimate'], rows: design.names.map((name, i) => [name, round(fit.beta[i])]) },
    ],
    plots: [{
      id: 'obs',
      title: 'Observed vs fitted cell counts',
      data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y }],
      layout: { xaxis: { title: 'Fitted' }, yaxis: { title: 'Observed' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}
