import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailChi } from './dists'
import { covOrCor } from './factor'
import { inverse, jacobiEigen, lm } from './linalg'
import { asFiniteNumber, mean, round, sampleSd } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function completeMatrix(rows: Record<string, unknown>[], columns: string[]): number[][] {
  const out: number[][] = []
  for (const row of rows) {
    const vals = columns.map((col) => asFiniteNumber(row[col]))
    if (vals.every((v) => v !== null)) out.push(vals as number[])
  }
  return out
}

function logDet(A: number[][]): number {
  const eig = jacobiEigen(A)
  return eig.values.reduce((s, v) => s + Math.log(Math.max(v, 1e-12)), 0)
}

function traceProd(S: number[][], iSigma: number[][]): number {
  let t = 0
  for (let i = 0; i < S.length; i++) for (let j = 0; j < S.length; j++) t += S[i][j] * iSigma[j][i]
  return t
}

export function mlDiscrepancy(S: number[][], Sigma: number[][]): number {
  const inv = inverse(Sigma)
  if (!inv) return Number.POSITIVE_INFINITY
  const p = S.length
  return logDet(Sigma) + traceProd(S, inv) - logDet(S) - p
}

function impliedCfa(lambda: number[][], theta: number[]): number[][] {
  const p = lambda.length
  const k = lambda[0]?.length ?? 0
  const Sigma = Array.from({ length: p }, () => Array(p).fill(0))
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let s = i === j ? theta[i] : 0
      for (let f = 0; f < k; f++) s += (lambda[i]?.[f] ?? 0) * (lambda[j]?.[f] ?? 0)
      Sigma[i][j] = s
    }
  }
  return Sigma
}

function splitFactors(p: number, k: number): number[][] {
  const assign = Array.from({ length: p }, (_, i) => Math.min(k - 1, Math.floor((i * k) / p)))
  return Array.from({ length: p }, (_, i) => Array.from({ length: k }, (__, f) => (assign[i] === f ? 0.7 : 0)))
}

export function fitCfa(S: number[][], k: number): { lambda: number[][]; theta: number[]; F: number; npar: number } {
  const p = S.length
  const eig = jacobiEigen(S)
  const simple = splitFactors(p, k)
  const lambda = Array.from({ length: p }, (_, i) =>
    Array.from({ length: k }, (__, f) => {
      const fromEig = (eig.vectors[i]?.[f] ?? 0) * Math.sqrt(Math.max(eig.values[f] ?? 0.1, 0.1))
      return simple[i]?.[f] !== 0 ? Math.max(0.2, Math.abs(fromEig)) * Math.sign(fromEig || 1) : 0
    }),
  )
  const theta = Array.from({ length: p }, (_, i) => Math.max(0.05, (S[i]?.[i] ?? 1) - lambda[i].reduce((s, l) => s + l * l, 0)))
  const mask = lambda.map((row) => row.map((v) => (Math.abs(v) > 1e-8 ? 1 : 0)))
  for (let iter = 0; iter < 80; iter++) {
    const Sigma = impliedCfa(lambda, theta)
    const F0 = mlDiscrepancy(S, Sigma)
    let improved = false
    const step = 0.05
    for (let i = 0; i < p; i++) {
      for (let f = 0; f < k; f++) {
        if (!mask[i]?.[f]) continue
        const trial = lambda.map((row) => [...row])
        trial[i]![f] += step
        const Fp = mlDiscrepancy(S, impliedCfa(trial, theta))
        trial[i]![f] -= 2 * step
        const Fm = mlDiscrepancy(S, impliedCfa(trial, theta))
        const g = (Fp - Fm) / (2 * step)
        if (Number.isFinite(g) && Math.abs(g) > 1e-8) {
          lambda[i]![f] = Math.max(-2, Math.min(2, lambda[i]![f] - 0.2 * Math.tanh(g)))
          improved = true
        }
      }
      const t0 = theta[i] ?? 0.5
      theta[i] = Math.max(0.02, t0 + step)
      const Fp = mlDiscrepancy(S, impliedCfa(lambda, theta))
      theta[i] = Math.max(0.02, t0 - step)
      const Fm = mlDiscrepancy(S, impliedCfa(lambda, theta))
      const g = (Fp - Fm) / (2 * step)
      theta[i] = Math.max(0.02, t0 - 0.15 * Math.tanh(g || 0))
      if (mlDiscrepancy(S, impliedCfa(lambda, theta)) < F0 - 1e-10) improved = true
    }
    if (!improved) break
  }
  const npar = mask.flat().filter(Boolean).length + p
  return { lambda, theta, F: mlDiscrepancy(S, impliedCfa(lambda, theta)), npar }
}

function cfaResult(id: string, title: string, names: string[], n: number, fit: ReturnType<typeof fitCfa>, k: number): AnalysisResult {
  const p = names.length
  const df = (p * (p + 1)) / 2 - fit.npar
  const chi = Math.max(0, (n - 1) * fit.F)
  const pval = df > 0 ? pTailChi(chi, df) : 1
  const loadings = names.map((name, i) => [name, ...fit.lambda[i].map((v) => round(v)), round(fit.theta[i] ?? 0)])
  return {
    analysisId: id,
    title,
    interpretation: `${k}-factor CFA (congeneric ML). χ² = ${round(chi)} on ${Math.max(0, df)} df (p = ${round(pval)}). F_ML = ${round(fit.F)}.`,
    assumptions: ['Multivariate normal indicators. Factors are standardized and orthogonal. Loadings follow simple structure (each item on one factor).'],
    footnotes: ['This is covariance-structure ML, not lavaan WASM. χ² is the likelihood-ratio versus the saturated covariance.'],
    tables: [
      { id: 'fit', title: 'Model fit', columns: ['n', 'χ²', 'df', 'p', 'F_ML'], rows: [[n, round(chi), Math.max(0, df), round(pval), round(fit.F)]] },
      { id: 'load', title: 'Loadings and uniqueness', columns: ['Item', ...Array.from({ length: k }, (_, f) => `F${f + 1}`), 'θ'], rows: loadings },
    ],
    plots: [{
      id: 'load-plot',
      title: 'Loadings',
      data: fit.lambda[0].map((_, f) => ({ type: 'bar', name: `F${f + 1}`, x: names, y: fit.lambda.map((row) => row[f]) })),
      layout: { barmode: 'group', margin: { t: 40, r: 16, b: 80, l: 48 } },
    }],
  }
}

export function runCfa(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  const k = Math.max(1, Math.min(4, Math.floor(Number(options.nFactors ?? 1))))
  if (variables.length < 3) return empty('factor.cfa', 'Confirmatory Factor Analysis', 'Need at least three numeric indicators.')
  const X = completeMatrix(rows, variables)
  if (X.length < variables.length + 4) return empty('factor.cfa', 'Confirmatory Factor Analysis', 'Not enough complete cases.')
  const mus = variables.map((_, j) => mean(X.map((r) => r[j] ?? 0)))
  const sds = variables.map((_, j) => sampleSd(X.map((r) => r[j] ?? 0)) || 1)
  const Z = X.map((row) => row.map((v, j) => (v - mus[j]) / sds[j]))
  const S = covOrCor(Z)
  return cfaResult('factor.cfa', 'Confirmatory Factor Analysis', variables, X.length, fitCfa(S, k), k)
}

export function runSem(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const endogenous = String(options.endogenous ?? '')
  const predictors = Array.isArray(options.predictors) ? options.predictors.map(String) : []
  const latents = Array.isArray(options.variables) ? options.variables.map(String) : []
  if (latents.length >= 3 && !endogenous) {
    const cfa = runCfa(rows, { ...options, nFactors: options.nFactors ?? 1 })
    return { ...cfa, analysisId: 'sem.sem', title: 'Structural Equation Modeling' }
  }
  if (!endogenous || predictors.length < 1) {
    return empty('sem.sem', 'Structural Equation Modeling', 'Assign indicators for CFA, or an endogenous outcome plus predictors for an observed-variable path model.')
  }
  const names = [endogenous, ...predictors]
  const X = completeMatrix(rows, names)
  if (X.length < names.length + 5) return empty('sem.sem', 'Structural Equation Modeling', 'Not enough complete cases.')
  const y = X.map((row) => row[0] ?? 0)
  const P = X.map((row) => [1, ...row.slice(1)])
  const fit = lm(y, P)
  if (!fit) return empty('sem.sem', 'Structural Equation Modeling', 'Path model is singular.')
  const mus = names.map((_, j) => mean(X.map((r) => r[j] ?? 0)))
  const sds = names.map((_, j) => sampleSd(X.map((r) => r[j] ?? 0)) || 1)
  const Z = X.map((row) => row.map((v, j) => (v - mus[j]) / sds[j]))
  const S = covOrCor(Z)
  const p = names.length
  const r2 = 1 - fit.sse / y.reduce((s, yi) => s + (yi - mean(y)) ** 2, 0)
  const ind = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (__, j) => (i === j ? (S[i]?.[i] ?? 1) : 0)))
  const Find = mlDiscrepancy(S, ind)
  const chiInd = (X.length - 1) * Find
  const dfInd = (p * (p - 1)) / 2
  return {
    analysisId: 'sem.sem',
    title: 'Structural Equation Modeling',
    interpretation: `Recursive observed-variable path model for ${endogenous}. R² = ${round(r2)}. Independence-model χ² = ${round(chiInd)} on ${dfInd} df.`,
    assumptions: ['Recursive paths, multivariate normal residuals. A latent measurement model is used when you assign Indicators and leave Endogenous empty.'],
    footnotes: ['Just-identified recursive SEM coincides with OLS. Overidentified latent models use the CFA engine.'],
    tables: [
      { id: 'path', title: 'Paths', columns: ['From', 'To', 'Estimate'], rows: predictors.map((name, i) => [name, endogenous, round(fit.beta[i + 1] ?? 0)]) },
      { id: 'fit', title: 'Fit vs independence', columns: ['R²', 'χ²_ind', 'df'], rows: [[round(r2), round(chiInd), dfInd]] },
    ],
    plots: [{
      id: 'fit-plot',
      title: 'Observed vs fitted',
      data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y }],
      layout: { xaxis: { title: 'Fitted' }, yaxis: { title: endogenous }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runPls(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yNames = Array.isArray(options.endogenousItems) ? options.endogenousItems.map(String) : []
  const xNames = Array.isArray(options.exogenousItems) ? options.exogenousItems.map(String) : []
  const yName = String(options.endogenous ?? '')
  const xVars = Array.isArray(options.predictors) ? options.predictors.map(String) : []
  const xBlock = xNames.length ? xNames : xVars
  const yBlock = yNames.length ? yNames : (yName ? [yName] : [])
  if (xBlock.length < 1 || yBlock.length < 1) return empty('sem.pls', 'Partial Least Squares SEM', 'Assign exogenous and endogenous item blocks.')
  const names = [...xBlock, ...yBlock]
  const X = completeMatrix(rows, names)
  if (X.length < 8) return empty('sem.pls', 'Partial Least Squares SEM', 'Need complete cases.')
  const n = X.length
  const zscore = (col: number[]) => {
    const m = mean(col)
    const s = sampleSd(col) || 1
    return col.map((v) => (v - m) / s)
  }
  const Xb = xBlock.map((_, j) => zscore(X.map((row) => row[j] ?? 0)))
  const Yb = yBlock.map((_, j) => zscore(X.map((row) => row[xBlock.length + j] ?? 0)))
  let wx = Xb.map(() => 1 / Math.sqrt(Xb.length))
  let wy = Yb.map(() => 1 / Math.sqrt(Yb.length))
  let lvX = Array(n).fill(0) as number[]
  let lvY = Array(n).fill(0) as number[]
  for (let iter = 0; iter < 40; iter++) {
    lvX = Array.from({ length: n }, (_, i) => Xb.reduce((s, col, j) => s + (wx[j] ?? 0) * (col[i] ?? 0), 0))
    lvY = Array.from({ length: n }, (_, i) => Yb.reduce((s, col, j) => s + (wy[j] ?? 0) * (col[i] ?? 0), 0))
    const sx = sampleSd(lvX) || 1
    const sy = sampleSd(lvY) || 1
    lvX = lvX.map((v) => v / sx)
    lvY = lvY.map((v) => v / sy)
    wx = Xb.map((col) => mean(col.map((v, i) => v * (lvY[i] ?? 0))))
    wy = Yb.map((col) => mean(col.map((v, i) => v * (lvX[i] ?? 0))))
    const nx = Math.hypot(...wx) || 1
    const ny = Math.hypot(...wy) || 1
    wx = wx.map((v) => v / nx)
    wy = wy.map((v) => v / ny)
  }
  const path = mean(lvX.map((v, i) => v * (lvY[i] ?? 0)))
  return {
    analysisId: 'sem.pls',
    title: 'Partial Least Squares SEM',
    interpretation: `Mode-A PLS: one exogenous and one endogenous composite. Inner path = ${round(path)} (standardized).`,
    assumptions: ['Wold Mode A (correlation weights). Composites are standardized. This is Lohmöller PLS, not covariance-based lavaan.'],
    footnotes: ['Bootstrap SEs are omitted; the path is the latent correlation after outer estimation.'],
    tables: [
      { id: 'path', title: 'Inner model', columns: ['From', 'To', 'Path'], rows: [['LV_X', 'LV_Y', round(path)]] },
      {
        id: 'outer',
        title: 'Outer weights',
        columns: ['Item', 'Block', 'Weight'],
        rows: [
          ...xBlock.map((name, i) => [name, 'Exogenous', round(wx[i] ?? 0)]),
          ...yBlock.map((name, i) => [name, 'Endogenous', round(wy[i] ?? 0)]),
        ],
      },
    ],
    plots: [{
      id: 'lv',
      title: 'Latent scores',
      data: [{ type: 'scatter', mode: 'markers', x: lvX, y: lvY }],
      layout: { xaxis: { title: 'LV_X' }, yaxis: { title: 'LV_Y' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runSemSpecial(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const kind = String(options.semKind ?? 'mediation')
  if (kind === 'growth') {
    const measures = Array.isArray(options.measures) ? options.measures.map(String) : []
    if (measures.length < 3) return empty('sem.mediation', 'Mediation Analysis', 'Latent growth needs at least three repeated measures.')
    const X = completeMatrix(rows, measures)
    if (X.length < 8) return empty('sem.mediation', 'Mediation Analysis', 'Need complete growth cases.')
    const mus = measures.map((_, j) => mean(X.map((r) => r[j] ?? 0)))
    const Z = X.map((row) => row.map((v, j) => v - mus[j]))
    const S = covOrCor(Z)
    const p = measures.length
    const times = measures.map((_, i) => i)
    const lambda = times.map((t) => [1, t])
    const theta = Array(p).fill(0.5) as number[]
    let F = mlDiscrepancy(S, impliedCfa(lambda, theta))
    for (let iter = 0; iter < 40; iter++) {
      for (let i = 0; i < p; i++) {
        const t0 = theta[i] ?? 0.5
        theta[i] = Math.max(0.02, t0 + 0.05)
        const Fp = mlDiscrepancy(S, impliedCfa(lambda, theta))
        theta[i] = Math.max(0.02, t0 - 0.05)
        const Fm = mlDiscrepancy(S, impliedCfa(lambda, theta))
        theta[i] = Math.max(0.02, t0 - 0.2 * Math.tanh((Fp - Fm) / 0.1))
      }
      F = mlDiscrepancy(S, impliedCfa(lambda, theta))
    }
    const chi = (X.length - 1) * F
    return {
      analysisId: 'sem.mediation',
      title: 'Mediation Analysis',
      interpretation: `Latent growth (intercept + linear slope) on ${p} occasions. χ² = ${round(chi)}. Unique variances are free; loadings are fixed to 1 and 0…${p - 1}.`,
      assumptions: ['Linear growth, independent unique residuals, complete wide-format cases.'],
      footnotes: ['MIMIC and MNLFA are available from the Model menu. This is covariance ML, not lavaan growth().'],
      tables: [
        { id: 'growth', title: 'Growth uniqueness', columns: ['Occasion', 'Time score', 'θ'], rows: measures.map((m, i) => [m, i, round(theta[i] ?? 0)]) },
        { id: 'fit', title: 'Fit', columns: ['n', 'χ²', 'F_ML'], rows: [[X.length, round(chi), round(F)]] },
      ],
      plots: [{
        id: 'means',
        title: 'Occasion means',
        data: [{ type: 'scatter', mode: 'lines+markers', x: times, y: measures.map((_, j) => mean(X.map((r) => r[j] ?? 0))) }],
        layout: { xaxis: { title: 'Time' }, margin: { t: 40, r: 16, b: 48, l: 48 } },
      }],
    }
  }
  if (kind === 'mimic' || kind === 'mnlfa') {
    const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
    const cov = String(options.covariate ?? '')
    if (variables.length < 3 || !cov) return empty('sem.mediation', 'Mediation Analysis', 'MIMIC / MNLFA need indicators plus a covariate.')
    const cfa = runCfa(rows, { variables, nFactors: 1 })
    const scores = completeMatrix(rows, [...variables, cov])
    if (scores.length < 8) return { ...cfa, analysisId: 'sem.mediation', title: 'Mediation Analysis' }
    const lambda = (cfa.tables.find((t) => t.id === 'load')?.rows ?? []).map((row) => Number(row[1]))
    const lv = scores.map((row) => {
      const items = row.slice(0, variables.length)
      const w = lambda.map((l, i) => (Number.isFinite(l) ? l : 1) * (items[i] ?? 0))
      return w.reduce((s, v) => s + v, 0)
    })
    const x = scores.map((row) => row[variables.length] ?? 0)
    const fit = lm(lv, x.map((v) => [1, v]))
    const slope = fit?.beta[1] ?? Number.NaN
    const note = kind === 'mnlfa'
      ? `MNLFA-style: factor scores on ${cov} (loading invariance is not freely estimated per level; this is a MIMIC slope as a first check).`
      : `MIMIC: the covariate ${cov} predicts the factor (slope ${round(slope)}).`
    return {
      ...cfa,
      analysisId: 'sem.mediation',
      title: 'Mediation Analysis',
      interpretation: `${note} ${cfa.interpretation}`,
      tables: [...cfa.tables, { id: 'mimic', title: 'Covariate → factor', columns: ['Covariate', 'Slope'], rows: [[cov, round(slope)]] }],
    }
  }
  const x = String(options.x ?? '')
  const m = String(options.m ?? '')
  const y = String(options.y ?? '')
  if (!x || !m || !y) return empty('sem.mediation', 'Mediation Analysis', 'Model 4 mediation needs X, M, and Y.')
  const pack = completeMatrix(rows, [x, m, y])
  if (pack.length < 8) return empty('sem.mediation', 'Mediation Analysis', 'Need complete X, M, Y.')
  const Xv = pack.map((r) => r[0] ?? 0)
  const Mv = pack.map((r) => r[1] ?? 0)
  const Yv = pack.map((r) => r[2] ?? 0)
  const a = lm(Mv, Xv.map((v) => [1, v]))
  const b = lm(Yv, pack.map((r) => [1, r[0] ?? 0, r[1] ?? 0]))
  if (!a || !b) return empty('sem.mediation', 'Mediation Analysis', 'Path OLS failed.')
  const ab = a.beta[1] * b.beta[2]
  const mus = [mean(Xv), mean(Mv), mean(Yv)]
  const sds = [sampleSd(Xv) || 1, sampleSd(Mv) || 1, sampleSd(Yv) || 1]
  const Z = pack.map((row) => row.map((v, j) => (v - mus[j]) / sds[j]))
  const S = covOrCor(Z)
  const ind = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  const chiInd = (pack.length - 1) * mlDiscrepancy(S, ind)
  return {
    analysisId: 'sem.mediation',
    title: 'Mediation Analysis',
    interpretation: `Observed-variable mediation: a = ${round(a.beta[1])}, b = ${round(b.beta[2])}, ab = ${round(ab)}, c′ = ${round(b.beta[1])}. Independence χ² = ${round(chiInd)} on 3 df.`,
    assumptions: ['Recursive OLS paths, no latent measurement error. Use PROCESS for Hayes index of moderated mediation.'],
    footnotes: ['SEM mediation reports the same paths as PROCESS model 4 plus a saturated-vs-independence covariance fit.'],
    tables: [
      { id: 'paths', title: 'Paths', columns: ['Path', 'Estimate'], rows: [['a (X→M)', round(a.beta[1])], ['b (M→Y)', round(b.beta[2])], ['c′ (X→Y)', round(b.beta[1])], ['ab', round(ab)]] },
    ],
    plots: [{
      id: 'med',
      title: 'M vs X',
      data: [{ type: 'scatter', mode: 'markers', x: Xv, y: Mv }],
      layout: { xaxis: { title: x }, yaxis: { title: m }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
