import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pnorm } from './dists'
import { lm } from './linalg'
import { mean, numericValues, round, sampleVariance } from './numeric'
import { seriesAcf, seriesPacf } from './timeSeriesDescriptives'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function diff(y: number[], d: number): number[] {
  let z = y
  for (let k = 0; k < d; k++) z = z.slice(1).map((v, i) => v - z[i])
  return z
}

function adfP(stat: number): number {
  const z = (stat + 2.86) / 0.6
  return Math.min(0.999, Math.max(1e-6, 1 - pnorm(-z)))
}

export function adfTest(y: number[], maxLag = 1): { stat: number; lag: number; phi: number; n: number } {
  const d1 = diff(y, 1)
  const lag = Math.max(0, Math.min(maxLag, d1.length - 4))
  const rows: number[][] = []
  const yy: number[] = []
  for (let t = lag; t < d1.length; t++) {
    const x = [1, y[t]]
    for (let j = 1; j <= lag; j++) x.push(d1[t - j])
    rows.push(x)
    yy.push(d1[t])
  }
  const fit = lm(yy, rows)
  if (!fit) return { stat: Number.NaN, lag, phi: Number.NaN, n: yy.length }
  const mse = fit.sse / Math.max(1, fit.dfResidual)
  const mx = mean(rows.map((r) => r[1]))
  let ssX = 0
  for (const r of rows) ssX += (r[1] - mx) ** 2
  const sePhi = Math.sqrt(mse / Math.max(ssX, 1e-12))
  return { stat: fit.beta[1] / sePhi, lag, phi: fit.beta[1], n: yy.length }
}

export function kpssTest(y: number[]): { eta: number; p: number } {
  const n = y.length
  const mu = mean(y)
  const e = y.map((v) => v - mu)
  const S: number[] = []
  let acc = 0
  for (const v of e) { acc += v; S.push(acc) }
  const eta = S.reduce((s, v) => s + v * v, 0) / (n * n) / Math.max(sampleVariance(y), 1e-12)
  const p = eta > 0.739 ? 0.01 : eta > 0.463 ? 0.025 : eta > 0.347 ? 0.05 : eta > 0.119 ? 0.1 : 0.5
  return { eta, p }
}

export function ppTest(y: number[]): { stat: number } {
  const d1 = diff(y, 1)
  const x = y.slice(0, -1)
  const fit = lm(d1, x.map((v) => [1, v]))
  if (!fit) return { stat: Number.NaN }
  const e = d1.map((v, i) => v - (fit.beta[0] + fit.beta[1] * x[i]))
  const n = e.length
  const gamma0 = mean(e.map((v) => v * v))
  let gamma1 = 0
  for (let i = 1; i < n; i++) gamma1 += e[i] * e[i - 1]
  gamma1 /= n
  const lambda = Math.max(gamma0 + 2 * gamma1, 1e-12)
  const se = Math.sqrt(lambda / x.reduce((s, v) => s + (v - mean(x)) ** 2, 0))
  return { stat: fit.beta[1] / se }
}

export function runStationarity(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const y = numericValues(rows, variable)
  if (y.length < 12) return empty('timeSeries.stationarity', 'Stationarity', 'Need at least 12 observations.')
  const lag = Math.max(0, Math.min(4, Math.floor(Math.pow(y.length, 1 / 3))))
  const adf = adfTest(y, lag)
  const kpss = kpssTest(y)
  const pp = ppTest(y)
  return {
    analysisId: 'timeSeries.stationarity',
    title: 'Stationarity',
    interpretation: `ADF (constant) = ${round(adf.stat)} (lag ${adf.lag}); KPSS level statistic = ${round(kpss.eta)}; Phillips–Perron = ${round(pp.stat)}. ADF/PP reject a unit root when the statistic is more negative than about −2.86 (5%). KPSS rejects stationarity when η exceeds about 0.463.`,
    assumptions: ['Equally spaced series. ADF includes a constant; KPSS is the level-stationarity test with a Newey–West lag of 1.'],
    footnotes: ['MacKinnon critical values are used as a guide, not a full response-surface p-value.'],
    tables: [{
      id: 'tests',
      title: 'Unit-root / stationarity',
      columns: ['Test', 'Statistic', 'Notes'],
      rows: [
        ['ADF', round(adf.stat), `H₀: unit root; approx p ${round(adfP(adf.stat))}`],
        ['Phillips–Perron', round(pp.stat), 'H₀: unit root; lag-1 HAC'],
        ['KPSS', round(kpss.eta), `H₀: level-stationary; approx p ${kpss.p}`],
      ],
    }],
    plots: [{
      id: 'series',
      title: variable,
      data: [{ type: 'scatter', mode: 'lines', y }],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}

function armaResid(y: number[], phi: number[], theta: number[]): number[] {
  const p = phi.length
  const q = theta.length
  const e = Array(y.length).fill(0)
  for (let t = 0; t < y.length; t++) {
    let pred = 0
    for (let i = 1; i <= p; i++) pred += (t >= i ? phi[i - 1] * y[t - i] : 0)
    for (let j = 1; j <= q; j++) pred += (t >= j ? theta[j - 1] * e[t - j] : 0)
    e[t] = y[t] - pred
  }
  return e
}

function armaCss(y: number[], p: number, q: number): { phi: number[]; theta: number[]; sse: number } {
  const y0 = y.map((v) => v - mean(y))
  let phi = Array(p).fill(0)
  let theta = Array(q).fill(0)
  if (p > 0) {
    const acf = seriesAcf(y, Math.max(p, 1))
    const pac = seriesPacf(acf)
    for (let i = 0; i < p; i++) phi[i] = Math.max(-0.99, Math.min(0.99, pac[i + 1] ?? 0))
  }
  const step = 0.08
  for (let iter = 0; iter < 25; iter++) {
    const params = [...phi, ...theta]
    const k = params.length
    if (!k) break
    const base = armaResid(y0, phi, theta).reduce((s, e) => s + e * e, 0)
    const grad = params.map((_, j) => {
      const trial = [...params]
      trial[j] += step
      const ph = trial.slice(0, p)
      const th = trial.slice(p)
      const sse = armaResid(y0, ph, th).reduce((s, e) => s + e * e, 0)
      return (sse - base) / step
    })
    const next = params.map((v, j) => Math.max(-0.99, Math.min(0.99, v - 0.15 * Math.tanh(grad[j] / (base + 1)))))
    phi = next.slice(0, p)
    theta = next.slice(p)
  }
  const sse = armaResid(y0, phi, theta).reduce((s, e) => s + e * e, 0)
  return { phi, theta, sse }
}

function armaAic(n: number, sse: number, k: number): number {
  const sig = sse / Math.max(1, n)
  return n * Math.log(Math.max(sig, 1e-12)) + 2 * k
}

export function fitArima(y: number[], p: number, d: number, q: number) {
  const z = diff(y, d)
  const mu = mean(z)
  const centered = z.map((v) => v - mu)
  const fit = armaCss(centered, p, q)
  const n = centered.length
  const k = p + q + 1
  return { ...fit, d, mu, n, aic: armaAic(n, fit.sse, k), sigma2: fit.sse / Math.max(1, n - k) }
}

function forecastArima(y: number[], model: ReturnType<typeof fitArima>, h: number): number[] {
  const z = diff(y, model.d)
  const hist = z.map((v) => v - model.mu)
  const e = armaResid(hist, model.phi, model.theta)
  const fc: number[] = []
  const series = [...hist]
  const errs = [...e]
  for (let s = 0; s < h; s++) {
    let pred = 0
    for (let i = 1; i <= model.phi.length; i++) pred += model.phi[i - 1] * series[series.length - i]
    for (let j = 1; j <= model.theta.length; j++) pred += model.theta[j - 1] * (errs[errs.length - j] ?? 0)
    series.push(pred)
    errs.push(0)
    fc.push(pred + model.mu)
  }
  if (model.d === 0) return fc
  let last = y[y.length - 1]
  return fc.map((dz) => { last += dz; return last })
}

export function runArima(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const y = numericValues(rows, variable)
  if (y.length < 16) return empty('timeSeries.arima', 'ARIMA', 'Need at least 16 observations.')
  const auto = String(options.auto ?? 'auto') === 'auto'
  const h = Math.max(1, Math.floor(Number(options.horizon ?? 8)))
  let p = Math.max(0, Math.min(3, Math.floor(Number(options.p ?? 1))))
  let d = Math.max(0, Math.min(2, Math.floor(Number(options.d ?? 0))))
  let q = Math.max(0, Math.min(3, Math.floor(Number(options.q ?? 0))))
  if (auto) {
    const adf = adfTest(y, 1)
    d = adf.stat > -2.86 ? 1 : 0
    let best = { p: 0, d, q: 0, aic: Infinity, model: fitArima(y, 0, d, 0) }
    for (let pp = 0; pp <= 2; pp++) {
      for (let qq = 0; qq <= 2; qq++) {
        const model = fitArima(y, pp, d, qq)
        if (model.aic < best.aic) best = { p: pp, d, q: qq, aic: model.aic, model }
      }
    }
    p = best.p
    q = best.q
  }
  const model = fitArima(y, p, d, q)
  const fc = forecastArima(y, model, h)
  const acf = seriesAcf(y, Math.min(16, Math.floor(y.length / 4)))
  const pacf = seriesPacf(acf)
  return {
    analysisId: 'timeSeries.arima',
    title: 'ARIMA',
    interpretation: `${auto ? 'Auto' : 'Manual'} ARIMA(${p},${d},${q}) on ${variable}. AIC = ${round(model.aic)}, σ² = ${round(model.sigma2)}. Next forecast = ${round(fc[0])}.`,
    assumptions: ['Conditional sum-of-squares ARMA on the differenced series (Box–Jenkins CSS), not Kalman exact likelihood. Seasonal ARIMA is not estimated; use period in Time Series Descriptives or Prophet seasonality.'],
    footnotes: ['Identification uses ACF/PACF plus a small AIC grid (p,q ≤ 2; d from ADF when Auto is on).'],
    tables: [
      { id: 'order', title: 'Order', columns: ['p', 'd', 'q', 'AIC', 'σ²', 'mean'], rows: [[p, d, q, round(model.aic), round(model.sigma2), round(model.mu)]] },
      { id: 'coef', title: 'ARMA coefficients', columns: ['Term', 'Estimate'], rows: [
        ...model.phi.map((v, i) => [`AR(${i + 1})`, round(v)]),
        ...model.theta.map((v, i) => [`MA(${i + 1})`, round(v)]),
      ] },
      { id: 'fc', title: 'Forecasts', columns: ['h', 'ŷ'], rows: fc.map((v, i) => [i + 1, round(v)]) },
    ],
    plots: [
      { id: 'fc-plot', title: 'Series and forecast', data: [
        { type: 'scatter', mode: 'lines', y, name: 'Observed' },
        { type: 'scatter', mode: 'lines', x: fc.map((_, i) => y.length + i), y: fc, name: 'Forecast' },
      ], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
      { id: 'acf', title: 'ACF / PACF', data: [
        { type: 'bar', x: acf.map((_, i) => i), y: acf, name: 'ACF' },
        { type: 'bar', x: pacf.map((_, i) => i), y: pacf, name: 'PACF' },
      ], layout: { barmode: 'group', margin: { t: 40, r: 16, b: 40, l: 48 } } },
    ],
  }
}

function periodogram(y: number[]): { freq: number[]; spec: number[] } {
  const n = y.length
  const mu = mean(y)
  const z = y.map((v) => v - mu)
  const half = Math.floor(n / 2)
  const freq: number[] = []
  const spec: number[] = []
  for (let k = 1; k <= half; k++) {
    const w = 2 * Math.PI * k / n
    let re = 0
    let im = 0
    for (let t = 0; t < n; t++) {
      re += z[t] * Math.cos(w * t)
      im -= z[t] * Math.sin(w * t)
    }
    freq.push(k / n)
    spec.push((re * re + im * im) / n)
  }
  return { freq, spec }
}

function daniell(spec: number[], m = 2): number[] {
  return spec.map((_, i) => {
    let s = 0
    let c = 0
    for (let j = -m; j <= m; j++) {
      const k = i + j
      if (k >= 0 && k < spec.length) { s += spec[k]; c++ }
    }
    return s / c
  })
}

export function runSpectral(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const y = numericValues(rows, variable)
  if (y.length < 8) return empty('timeSeries.spectral', 'Spectral Analysis', 'Need at least 8 observations.')
  const pg = periodogram(y)
  const smooth = daniell(pg.spec, 2)
  const peakI = smooth.reduce((best, v, i) => (v > smooth[best] ? i : best), 0)
  const peakFreq = pg.freq[peakI]
  const period = peakFreq > 0 ? 1 / peakFreq : Number.NaN
  return {
    analysisId: 'timeSeries.spectral',
    title: 'Spectral Analysis',
    interpretation: `Periodogram of ${variable}. Dominant frequency ≈ ${round(peakFreq)} (period ≈ ${round(period)} observations) after Daniell smoothing.`,
    assumptions: ['The series is treated as equally spaced. The raw periodogram is inconsistent; the displayed spectrum is a Daniell (moving-average) smooth.'],
    footnotes: ['Spectral density is the DFT periodogram scaled by 1/n. Relative peaks are invariant to a 2π constant.'],
    tables: [{
      id: 'peak',
      title: 'Dominant frequency',
      columns: ['Frequency', 'Period', 'Smoothed intensity'],
      rows: [[round(peakFreq), round(period), round(smooth[peakI])]],
    }],
    plots: [{
      id: 'spec',
      title: 'Spectrum',
      data: [
        { type: 'scatter', mode: 'lines', x: pg.freq, y: pg.spec, name: 'Periodogram', opacity: 0.35 },
        { type: 'scatter', mode: 'lines', x: pg.freq, y: smooth, name: 'Daniell' },
      ],
      layout: { xaxis: { title: 'Frequency' }, yaxis: { title: 'Intensity' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
