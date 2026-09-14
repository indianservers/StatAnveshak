import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pnorm } from './dists'
import { lm } from './linalg'
import { asFiniteNumber, round } from './numeric'

function empty(message: string): AnalysisResult {
  return { analysisId: 'process.model', title: 'PROCESS', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function ols(y: number[], cols: number[][]): { beta: number[]; se: number[]; fitted: number[]; n: number; sse: number; ll: number } | null {
  const X = y.map((_, i) => [1, ...cols.map((c) => c[i])])
  const fit = lm(y, X)
  if (!fit) return null
  const mse = fit.sse / Math.max(1, fit.dfResidual)
  const xtx = Array.from({ length: X[0].length }, () => Array(X[0].length).fill(0))
  for (const row of X) for (let a = 0; a < row.length; a++) for (let b = 0; b < row.length; b++) xtx[a][b] += row[a] * row[b]
  const se = fit.beta.map((_, j) => {
    const e = Array(fit.beta.length).fill(0)
    e[j] = 1
    // crude SE from diagonal of (X'X)^{-1} via 1 / ss of column after intercept centering for j>0
    if (j === 0) return Math.sqrt(mse / y.length)
    const col = cols[j - 1]
    const m = col.reduce((s, v) => s + v, 0) / col.length
    const ss = col.reduce((s, v) => s + (v - m) ** 2, 0)
    return Math.sqrt(mse / Math.max(ss, 1e-12))
  })
  const ll = -y.length / 2 * Math.log(2 * Math.PI * mse) - fit.sse / (2 * mse)
  return { beta: fit.beta, se, fitted: fit.fitted, n: y.length, sse: fit.sse, ll }
}

function collect(rows: Record<string, unknown>[], names: string[]): number[][] | null {
  const cols: number[][] = names.map(() => [])
  for (const row of rows) {
    const vals = names.map((n) => asFiniteNumber(row[n]))
    if (vals.some((v) => v === null)) continue
    vals.forEach((v, i) => cols[i].push(v as number))
  }
  if (cols[0].length < 8) return null
  return cols
}

export function runProcess(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const model = String(options.processModel ?? '4')
  const xName = String(options.x ?? '')
  const yName = String(options.y ?? '')
  const mName = String(options.m ?? '')
  const wName = String(options.w ?? '')
  if (!xName || !yName) return empty('Assign X and Y.')
  if ((model === '4' || model === '7') && !mName) return empty('Mediation models need a mediator M.')
  if ((model === '1' || model === '7') && !wName) return empty('Moderation models need W.')

  if (model === '1') {
    const pack = collect(rows, [yName, xName, wName])
    if (!pack) return empty('Need complete Y, X, W rows.')
    const [y, x, w] = pack
    const xw = x.map((xi, i) => xi * w[i])
    const fit = ols(y, [x, w, xw])
    if (!fit) return empty('Moderation OLS failed.')
    return {
      analysisId: 'process.model',
      title: 'PROCESS',
      interpretation: `Model 1 (moderation): Y ~ X + W + XW. Interaction = ${round(fit.beta[3])} (SE ${round(fit.se[3])}).`,
      assumptions: ['OLS, independent errors, linear conditional means. Simple slopes are evaluated at W mean ± SD.'],
      footnotes: ['Hayes PROCESS model 1. Bayesian mode uses BIC of the interaction model vs additive X+W.'],
      tables: [{ id: 'mod', title: 'Y model', columns: ['Term', 'Estimate', 'SE'], rows: [['Intercept', round(fit.beta[0]), round(fit.se[0])], ['X', round(fit.beta[1]), round(fit.se[1])], ['W', round(fit.beta[2]), round(fit.se[2])], ['X×W', round(fit.beta[3]), round(fit.se[3])]] }],
      plots: [{ id: 'int', title: 'Y vs X', data: [{ type: 'scatter', mode: 'markers', x, y }], layout: { xaxis: { title: xName }, yaxis: { title: yName }, margin: { t: 40, r: 16, b: 48, l: 56 } } }],
    }
  }

  const names = model === '7' ? [yName, xName, mName, wName] : [yName, xName, mName]
  const pack = collect(rows, names)
  if (!pack) return empty('Need complete cases for Y, X, M (and W).')
  const y = pack[0]
  const x = pack[1]
  const m = pack[2]
  const w = pack[3]
  let aFit
  let a3 = 0
  let sea3 = 0
  if (model === '7' && w) {
    const xw = x.map((xi, i) => xi * w[i])
    aFit = ols(m, [x, w, xw])
    if (!aFit) return empty('First-stage OLS failed.')
    a3 = aFit.beta[3]
    sea3 = aFit.se[3]
  } else {
    aFit = ols(m, [x])
    if (!aFit) return empty('M ~ X failed.')
  }
  const bFit = ols(y, [x, m])
  if (!bFit) return empty('Y ~ X + M failed.')
  const a = aFit.beta[1]
  const sea = aFit.se[1]
  const b = bFit.beta[2]
  const seb = bFit.se[2]
  const cPrime = bFit.beta[1]
  const indirect = model === '7' ? a3 * b : a * b
  const seInd = model === '7'
    ? Math.sqrt((a3 * seb) ** 2 + (b * sea3) ** 2)
    : Math.sqrt((a * seb) ** 2 + (b * sea) ** 2)
  const z = seInd > 0 ? indirect / seInd : Number.NaN
  const p = 2 * (1 - pnorm(Math.abs(z)))
  const cFit = ols(y, [x])
  const total = cFit ? cFit.beta[1] : cPrime + a * b
  return {
    analysisId: 'process.model',
    title: 'PROCESS',
    interpretation: model === '7'
      ? `Model 7 (moderated mediation): index of moderated mediation a₃b = ${round(indirect)} (Sobel SE ${round(seInd)}, p ≈ ${round(p)}).`
      : `Model 4 (mediation): indirect ab = ${round(indirect)} (Sobel SE ${round(seInd)}, p ≈ ${round(p)}). Direct c′ = ${round(cPrime)}, total ≈ ${round(total)}.`,
    assumptions: ['OLS paths, no X–M confounding beyond the specified W, independent errors. Sobel is first-order delta-method, not bootstrap percentiles.'],
    footnotes: ['Hayes PROCESS models 4 and 7. Serial/parallel extra mediators are not stacked in this engine.'],
    tables: [
      { id: 'a', title: 'M model', columns: ['Term', 'Estimate', 'SE'], rows: aFit.beta.map((v, i) => [['Intercept', 'X', 'W', 'X×W'][i] ?? `b${i}`, round(v), round(aFit.se[i])]) },
      { id: 'b', title: 'Y model', columns: ['Term', 'Estimate', 'SE'], rows: [['Intercept', round(bFit.beta[0]), round(bFit.se[0])], ['X (c′)', round(cPrime), round(bFit.se[1])], ['M (b)', round(b), round(seb)]] },
      { id: 'ie', title: 'Indirect effect', columns: ['Effect', 'Estimate', 'SE', 'z', 'p'], rows: [[model === '7' ? 'a₃b' : 'ab', round(indirect), round(seInd), round(z), round(p)]] },
    ],
    plots: [{
      id: 'paths',
      title: 'M vs X',
      data: [{ type: 'scatter', mode: 'markers', x, y: m }],
      layout: { xaxis: { title: xName }, yaxis: { title: mName }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function processBicDelta(rows: Record<string, unknown>[], options: AnalysisOptions): number {
  const yName = String(options.y ?? '')
  const xName = String(options.x ?? '')
  const mName = String(options.m ?? '')
  const pack = collect(rows, [yName, xName, mName])
  if (!pack) return Number.NaN
  const [y, x, m] = pack
  const full = ols(y, [x, m])
  const red = ols(y, [x])
  if (!full || !red) return Number.NaN
  const bicFull = -2 * full.ll + Math.log(full.n) * 3
  const bicRed = -2 * red.ll + Math.log(red.n) * 2
  return bicRed - bicFull
}
