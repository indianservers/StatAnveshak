import type { AnalysisOptions, AnalysisResult } from '../../types'
import { mean, numericValues, pearson, round, sampleSd, sampleVariance } from './numeric'

export function seriesAcf(values: number[], maxLag: number): number[] {
  const centered = values.map((value) => value - mean(values))
  const denom = centered.reduce((sum, value) => sum + value * value, 0)
  const out: number[] = [1]
  for (let lag = 1; lag <= maxLag; lag++) {
    let num = 0
    for (let i = lag; i < values.length; i++) num += centered[i] * centered[i - lag]
    out.push(denom === 0 ? Number.NaN : num / denom)
  }
  return out
}

/** Durbin–Levinson PACF. */
export function seriesPacf(acfValues: number[]): number[] {
  const maxLag = acfValues.length - 1
  const phi: number[][] = Array.from({ length: maxLag + 1 }, () => Array(maxLag + 1).fill(0))
  const pac: number[] = [1]
  for (let k = 1; k <= maxLag; k++) {
    let num = acfValues[k]
    for (let j = 1; j < k; j++) num -= phi[k - 1][j] * acfValues[k - j]
    let den = 1
    for (let j = 1; j < k; j++) den -= phi[k - 1][j] * acfValues[j]
    phi[k][k] = den === 0 ? 0 : num / den
    for (let j = 1; j < k; j++) phi[k][j] = phi[k - 1][j] - phi[k][k] * phi[k - 1][k - j]
    pac.push(phi[k][k])
  }
  return pac
}

export function runTimeSeriesDescriptives(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const period = typeof options.period === 'number' && options.period >= 2 ? Math.floor(options.period) : 0
  const y = numericValues(rows, variable)
  if (!variable || y.length < 3) {
    return {
      analysisId: 'descriptives.timeSeries',
      title: 'Time Series Descriptives',
      interpretation: 'Assign a numeric series with at least 3 observations (row order is time if no timestamp is used).',
      assumptions: [],
      footnotes: [],
      tables: [],
      plots: [],
    }
  }

  const t = y.map((_, index) => index + 1)
  const slope = (() => {
    const r = pearson(t, y)
    return r * sampleSd(y) / sampleSd(t)
  })()
  const intercept = mean(y) - slope * mean(t)
  const fitted = t.map((ti) => intercept + slope * ti)
  const ssRes = y.reduce((sum, value, i) => sum + (value - fitted[i]) ** 2, 0)
  const ssTot = y.reduce((sum, value) => sum + (value - mean(y)) ** 2, 0)
  const r2 = ssTot === 0 ? Number.NaN : 1 - ssRes / ssTot
  const maxLag = Math.min(24, Math.max(1, Math.floor(y.length / 4)))
  const acfValues = seriesAcf(y, maxLag)
  const pacfValues = seriesPacf(acfValues)

  const seasonalRows: Array<Array<string | number>> = []
  if (period > 1) {
    const buckets = Array.from({ length: period }, () => [] as number[])
    y.forEach((value, index) => buckets[index % period].push(value))
    buckets.forEach((bucket, index) => {
      seasonalRows.push([index + 1, bucket.length, round(mean(bucket)), round(sampleSd(bucket))])
    })
  }

  const band = 1.96 / Math.sqrt(y.length)

  return {
    analysisId: 'descriptives.timeSeries',
    title: 'Time Series Descriptives',
    interpretation: `${variable}: n = ${y.length}, mean = ${round(mean(y))}, lag-1 autocorrelation = ${round(acfValues[1])}. Linear time trend R² = ${round(r2)}.`,
    assumptions: Math.abs(acfValues[1]) > 0.9 ? ['Lag-1 autocorrelation exceeds 0.9; the series is strongly persistent. Stationarity tests ship in a later phase.'] : [],
    footnotes: [
      'Row order is treated as equally spaced time.',
      'ACF uses the biased (1/n) denominator, matching the usual sample ACF.',
      'PACF uses the Durbin–Levinson recursion.',
      'Trend is an OLS line of the series on t = 1…n.',
    ],
    tables: [
      {
        id: 'ts-summary',
        title: 'Series summary',
        columns: ['Statistic', 'Value'],
        rows: [
          ['Valid', y.length],
          ['Mean', round(mean(y))],
          ['Std. Deviation', round(sampleSd(y))],
          ['Variance', round(sampleVariance(y))],
          ['Minimum', round(Math.min(...y))],
          ['Maximum', round(Math.max(...y))],
          ['First', round(y[0])],
          ['Last', round(y[y.length - 1])],
          ['Lag-1 ACF', round(acfValues[1])],
          ['Trend slope', round(slope)],
          ['Trend intercept', round(intercept)],
          ['Trend R²', round(r2)],
        ],
      },
      {
        id: 'acf',
        title: 'Autocorrelation',
        columns: ['Lag', 'ACF', 'PACF'],
        rows: acfValues.map((value, lag) => [lag, round(value), round(pacfValues[lag])]),
      },
      ...(period > 1 ? [{ id: 'seasonal', title: `Seasonal means (period ${period})`, columns: ['Season', 'n', 'Mean', 'Std. Deviation'], rows: seasonalRows }] : []),
    ],
    plots: [
      {
        id: 'series',
        title: `Series — ${variable}`,
        data: [
          { type: 'scatter', mode: 'lines', x: t, y, name: variable, line: { color: '#4f46e5' } },
          { type: 'scatter', mode: 'lines', x: t, y: fitted, name: 'Linear trend', line: { color: '#0f172a', dash: 'dash' } },
        ],
        layout: { xaxis: { title: 'Time index' }, yaxis: { title: variable }, margin: { t: 40, r: 16, b: 44, l: 56 }, legend: { orientation: 'h' } },
      },
      {
        id: 'acf-plot',
        title: 'ACF',
        data: [
          { type: 'bar', x: acfValues.map((_, lag) => lag), y: acfValues, name: 'ACF', marker: { color: '#4f46e5' } },
          { type: 'scatter', mode: 'lines', x: [0, maxLag], y: [band, band], line: { color: '#94a3b8', dash: 'dot' }, name: '±1.96/√n', showlegend: false },
          { type: 'scatter', mode: 'lines', x: [0, maxLag], y: [-band, -band], line: { color: '#94a3b8', dash: 'dot' }, name: 'lo', showlegend: false },
        ],
        layout: { xaxis: { title: 'Lag' }, yaxis: { title: 'ACF', range: [-1.05, 1.05] }, margin: { t: 40, r: 16, b: 44, l: 48 } },
      },
      {
        id: 'pacf-plot',
        title: 'PACF',
        data: [{ type: 'bar', x: pacfValues.map((_, lag) => lag), y: pacfValues, marker: { color: '#0f172a' } }],
        layout: { xaxis: { title: 'Lag' }, yaxis: { title: 'PACF', range: [-1.05, 1.05] }, margin: { t: 40, r: 16, b: 44, l: 48 } },
      },
    ],
  }
}
