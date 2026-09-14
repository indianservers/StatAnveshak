import type { AnalysisOptions, AnalysisResult } from '../../types'
import { glmFit, type GlmFamily } from './glm'
import { asFiniteNumber, gaussianKde, mean, numericValues, pearson, sampleSd } from './numeric'

function lmLine(xs: number[], ys: number[]) {
  const r = pearson(xs, ys)
  const slope = r * sampleSd(ys) / sampleSd(xs)
  const intercept = mean(ys) - slope * mean(xs)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  return {
    slope,
    intercept,
    r,
    lineX: [xMin, xMax],
    lineY: [intercept + slope * xMin, intercept + slope * xMax],
  }
}

export function runFlexplot(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const outcome = String(options.outcome ?? '')
  const predictor = typeof options.predictor === 'string' ? options.predictor : ''
  const split = typeof options.split === 'string' ? options.split : ''
  const y = numericValues(rows, outcome)

  if (!outcome || y.length < 2) {
    return {
      analysisId: 'descriptives.flexplot',
      title: 'Flexplot',
      interpretation: 'Assign a numeric outcome. Optionally add a predictor and a split (color) variable.',
      assumptions: [],
      footnotes: [],
      tables: [],
      plots: [],
    }
  }

  if (!predictor) {
    const min = Math.min(...y)
    const max = Math.max(...y)
    const grid = Array.from({ length: 80 }, (_, i) => min + (max - min) * i / 79)
    const density = gaussianKde(y, grid)
    return {
      analysisId: 'descriptives.flexplot',
      title: 'Flexplot',
      interpretation: `Univariate Flexplot of ${outcome}: histogram, kernel density, and boxplot.`,
      assumptions: [],
      footnotes: ['Univariate grammar: outcome only.', 'Density uses Silverman bandwidth.'],
      tables: [{
        id: 'flex-uni',
        title: 'Univariate summary',
        columns: ['n', 'Mean', 'Std. Deviation'],
        rows: [[y.length, Number(mean(y).toFixed(6)), Number(sampleSd(y).toFixed(6))]],
      }],
      plots: [{
        id: 'flex-uni-plot',
        title: `Flexplot — ${outcome}`,
        data: [
          { type: 'histogram', x: y, histnorm: 'probability density', name: 'Histogram', marker: { color: '#6366f1', opacity: 0.55 }, yaxis: 'y' },
          { type: 'scatter', mode: 'lines', x: grid, y: density, name: 'Density', line: { color: '#0f172a', width: 2 } },
          { type: 'box', x: y, name: 'Box', yaxis: 'y2', orientation: 'h', boxpoints: false, marker: { color: '#4338ca' } },
        ],
        layout: {
          yaxis: { title: 'Density' },
          yaxis2: { overlaying: 'y', side: 'right', showticklabels: false },
          xaxis: { title: outcome },
          margin: { t: 40, r: 24, b: 48, l: 52 },
          legend: { orientation: 'h' },
        },
      }],
    }
  }

  const pairs: Array<{ x: number; y: number; split: string }> = []
  for (const row of rows) {
    const xv = asFiniteNumber(row[predictor])
    const yv = asFiniteNumber(row[outcome])
    if (xv === null || yv === null) continue
    pairs.push({ x: xv, y: yv, split: split ? String(row[split] ?? '(missing)') : 'All' })
  }

  const predictorIsCategory = pairs.length > 0 && new Set(rows.map((row) => row[predictor])).size <= Math.min(24, Math.sqrt(rows.length) + 4) &&
    rows.some((row) => asFiniteNumber(row[predictor]) === null && row[predictor] !== null && row[predictor] !== '')

  if (predictorIsCategory) {
    const groups = new Map<string, number[]>()
    for (const row of rows) {
      const yv = asFiniteNumber(row[outcome])
      if (yv === null) continue
      const key = String(row[predictor] ?? '(missing)')
      const list = groups.get(key) ?? []
      list.push(yv)
      groups.set(key, list)
    }
    return {
      analysisId: 'descriptives.flexplot',
      title: 'Flexplot',
      interpretation: `Flexplot of numeric ${outcome} by ${predictor}.`,
      assumptions: [],
      footnotes: ['Bivariate grammar: numeric outcome, categorical predictor.', 'Boxes show Tukey hinges; points are jittered observations.'],
      tables: [{
        id: 'flex-cat',
        title: 'Group means',
        columns: ['Level', 'n', 'Mean'],
        rows: [...groups.entries()].map(([level, values]) => [level, values.length, Number(mean(values).toFixed(6))]),
      }],
      plots: [{
        id: 'flex-cat-plot',
        title: `${outcome} by ${predictor}`,
        data: [...groups.entries()].map(([level, values]) => ({
          type: 'box',
          name: level,
          y: values,
          boxpoints: 'all',
          jitter: 0.35,
          pointpos: -1.6,
          marker: { size: 6, opacity: 0.55 },
        })),
        layout: { yaxis: { title: outcome }, xaxis: { title: predictor }, margin: { t: 40, r: 16, b: 48, l: 56 }, boxmode: 'group' },
      }],
    }
  }

  const splits = [...new Set(pairs.map((item) => item.split))]
  const traces: Record<string, unknown>[] = []
  const tableRows: Array<Array<string | number>> = []
  splits.forEach((level) => {
    const subset = pairs.filter((item) => item.split === level)
    const xs = subset.map((item) => item.x)
    const ys = subset.map((item) => item.y)
    traces.push({ type: 'scatter', mode: 'markers', x: xs, y: ys, name: level, marker: { size: 8, opacity: 0.7 } })
    if (xs.length >= 2 && sampleSd(xs) > 0) {
      const overlay = String(options.overlay ?? 'linear')
      const xMin = Math.min(...xs)
      const xMax = Math.max(...xs)
      const grid = Array.from({ length: 40 }, (_, i) => xMin + (xMax - xMin) * i / 39)
      if (overlay === 'glm') {
        const family = String(options.glmFamily ?? 'gaussian') as GlmFamily
        const yFit = family === 'binomial' ? ys.map((v) => (v > 0 ? 1 : 0)) : ys
        const fit = glmFit(yFit, xs.map((x) => [1, x]), family)
        if (fit) {
          const lineY = grid.map((x) => {
            const eta = fit.beta[0] + fit.beta[1] * x
            if (family === 'binomial') return 1 / (1 + Math.exp(-eta))
            if (family === 'gaussian') return eta
            return Math.exp(Math.min(20, eta))
          })
          traces.push({ type: 'scatter', mode: 'lines', x: grid, y: lineY, name: `${level} GLM`, line: { width: 2 } })
          tableRows.push([level, subset.length, 'GLM', Number(fit.beta[1].toFixed(6)), Number(fit.beta[0].toFixed(6))])
        }
      } else if (overlay === 'mixed') {
        const gMean = mean(ys)
        const fit = lmLine(xs, ys)
        traces.push({ type: 'scatter', mode: 'lines', x: fit.lineX, y: [gMean + fit.slope * (fit.lineX[0] - mean(xs)), gMean + fit.slope * (fit.lineX[1] - mean(xs))], name: `${level} RI`, line: { width: 2 } })
        tableRows.push([level, subset.length, Number(fit.r.toFixed(6)), Number(fit.slope.toFixed(6)), Number(gMean.toFixed(6))])
      } else {
        const fit = lmLine(xs, ys)
        traces.push({ type: 'scatter', mode: 'lines', x: fit.lineX, y: fit.lineY, name: `${level} line`, line: { width: 2 }, showlegend: splits.length === 1 })
        tableRows.push([level, subset.length, Number(fit.r.toFixed(6)), Number(fit.slope.toFixed(6)), Number(fit.intercept.toFixed(6))])
      }
    }
  })

  return {
    analysisId: 'descriptives.flexplot',
    title: 'Flexplot',
    interpretation: `Bivariate Flexplot of ${outcome} vs ${predictor}${split ? `, colored by ${split}` : ''} with a ${String(options.overlay ?? 'linear')} overlay per panel.`,
    assumptions: pairs.length < 8 ? ['Small n: the overlay is only a visual guide.'] : [],
    footnotes: [
      'Bivariate grammar: numeric outcome and predictor; optional split maps to color.',
      'Overlays: OLS, GLM (gaussian/binomial/poisson), or mixed (common slope, split-specific intercept).',
    ],
    tables: [{
      id: 'flex-bi',
      title: 'Linear overlay',
      columns: ['Split', 'n', 'r', 'Slope', 'Intercept'],
      rows: tableRows,
    }],
    plots: [{
      id: 'flex-bi-plot',
      title: `${outcome} vs ${predictor}`,
      data: traces,
      layout: { xaxis: { title: predictor }, yaxis: { title: outcome }, margin: { t: 40, r: 16, b: 48, l: 56 }, legend: { orientation: 'h' } },
    }],
  }
}
