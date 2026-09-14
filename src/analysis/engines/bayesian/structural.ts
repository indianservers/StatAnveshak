import type { AnalysisOptions, AnalysisResult } from '../../types'
import { lm } from '../frequentist/linalg'
import { mean, numericValues, round, sampleVariance } from '../frequentist/numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

/** Local-level + optional seasonal dummy Kalman (conjugate Gaussian). Not spike-and-slab BSTS WASM. */
export function runBsts(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const period = Math.max(0, Math.floor(Number(options.period ?? 0)))
  const h = Math.max(1, Math.floor(Number(options.horizon ?? 8)))
  const y = numericValues(rows, variable)
  if (y.length < 12) return empty('bsts.model', 'Bayesian Structural Time Series', 'Need at least 12 observations.')
  const qGrid = [0.01, 0.05, 0.1, 0.2, 0.5, 1]
  let bestQ = 0.1
  let bestLl = Number.NEGATIVE_INFINITY
  let lastMu = y[0]
  let lastV = sampleVariance(y)
  for (const q of qGrid) {
    let mu = y[0]
    let P = 1
    let ll = 0
    const resid: number[] = []
    for (let t = 0; t < y.length; t++) {
      const seas = period > 1 ? mean(y.filter((_, i) => i % period === t % period)) - mean(y) : 0
      P += q
      const S = P + 1
      const k = P / S
      const e = y[t] - seas - mu
      ll += -0.5 * (Math.log(2 * Math.PI * S) + (e * e) / S)
      mu += k * e
      P *= 1 - k
      resid.push(e)
    }
    if (ll > bestLl) {
      bestLl = ll
      bestQ = q
      lastMu = mu
      lastV = mean(resid.map((e) => e * e))
    }
  }
  const fc: number[] = []
  for (let s = 0; s < h; s++) {
    const t = y.length + s
    const seas = period > 1 ? mean(y.filter((_, i) => i % period === t % period)) - mean(y) : 0
    fc.push(lastMu + seas)
  }
  return {
    analysisId: 'bsts.model',
    title: 'Bayesian Structural Time Series',
    interpretation: `Local-level Gaussian state space on ${variable}. Signal-to-noise q = σ_η²/σ_ε² selected by Kalman likelihood (${bestQ}). Observation variance ≈ ${round(lastV)}. Next forecast ${round(fc[0])}.`,
    assumptions: ['Local level (plus optional seasonal dummy means). This is conjugate Kalman filtering, not Scott–Varian spike-and-slab BSTS or a WASM library.'],
    footnotes: ['Set period to the seasonal length (e.g. 12) to add seasonal means. Full MCMC BSTS remains a WASM swap.'],
    tables: [
      { id: 'hyp', title: 'State space', columns: ['q', 'log-likelihood', 'σ²'], rows: [[bestQ, round(bestLl), round(lastV)]] },
      { id: 'fc', title: 'Forecast', columns: ['h', 'ŷ'], rows: fc.map((v, i) => [i + 1, round(v)]) },
    ],
    plots: [{
      id: 'fc-plot',
      title: 'BSTS forecast',
      data: [
        { type: 'scatter', mode: 'lines', y, name: 'Observed' },
        { type: 'scatter', mode: 'lines', x: fc.map((_, i) => y.length + i), y: fc, name: 'Forecast' },
      ],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}

/** Additive Prophet-style trend + Fourier seasonality via OLS (no Stan). */
export function runProphet(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const period = Math.max(2, Math.floor(Number(options.period ?? 12)))
  const K = Math.max(1, Math.min(6, Math.floor(Number(options.fourier ?? 3))))
  const h = Math.max(1, Math.floor(Number(options.horizon ?? 8)))
  const y = numericValues(rows, variable)
  if (y.length < period + 4) return empty('prophet.forecast', 'Prophet', 'Need a series longer than one seasonal period.')
  const n = y.length
  const t = y.map((_, i) => i / Math.max(1, n - 1))
  const cp = 0.5
  const X = y.map((_, i) => {
    const row = [1, t[i], Math.max(0, t[i] - cp)]
    for (let k = 1; k <= K; k++) {
      row.push(Math.cos(2 * Math.PI * k * i / period))
      row.push(Math.sin(2 * Math.PI * k * i / period))
    }
    return row
  })
  const fit = lm(y, X)
  if (!fit) return empty('prophet.forecast', 'Prophet', 'Seasonal design was singular.')
  const fitted = fit.fitted
  const fc: number[] = []
  for (let s = 0; s < h; s++) {
    const i = n + s
    const ti = i / Math.max(1, n - 1)
    const row = [1, ti, Math.max(0, ti - cp)]
    for (let k = 1; k <= K; k++) {
      row.push(Math.cos(2 * Math.PI * k * i / period))
      row.push(Math.sin(2 * Math.PI * k * i / period))
    }
    fc.push(row.reduce((acc, x, j) => acc + x * fit.beta[j], 0))
  }
  const names = ['Intercept', 'Trend', 'Changepoint', ...Array.from({ length: K }, (_, k) => [`cos${k + 1}`, `sin${k + 1}`]).flat()]
  return {
    analysisId: 'prophet.forecast',
    title: 'Prophet',
    interpretation: `Additive Prophet-style model: linear trend, one changepoint at t = 0.5, and ${K} Fourier pairs with period ${period}. Next forecast ${round(fc[0])}.`,
    assumptions: ['Gaussian OLS on the additive design. This is the Taylor–Letham decomposition, not Stan MCMC (Facebook Prophet).'],
    footnotes: ['Uncertainty is residual σ from OLS, not the full posterior. WASM Prophet remains a later swap.'],
    tables: [
      { id: 'coef', title: 'Additive coefficients', columns: ['Term', 'Estimate'], rows: names.map((name, i) => [name, round(fit.beta[i])]) },
      { id: 'fc', title: 'Forecast', columns: ['h', 'ŷ'], rows: fc.map((v, i) => [i + 1, round(v)]) },
    ],
    plots: [{
      id: 'fit',
      title: 'Prophet fit',
      data: [
        { type: 'scatter', mode: 'lines', y, name: 'Observed' },
        { type: 'scatter', mode: 'lines', y: fitted, name: 'Fitted' },
        { type: 'scatter', mode: 'lines', x: fc.map((_, i) => n + i), y: fc, name: 'Forecast' },
      ],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}
