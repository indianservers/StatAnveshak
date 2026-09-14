import type { AnalysisOptions, AnalysisResult } from '../../types'
import { glmFit } from './glm'
import { lm } from './linalg'
import { asFiniteNumber, mean, round } from './numeric'

function empty(message: string): AnalysisResult {
  return { analysisId: 'predictive.analytics', title: 'Predictive Analytics', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function splitIndex(n: number, frac: number): number {
  return Math.max(4, Math.min(n - 4, Math.floor(n * (1 - frac))))
}

function auc(y: number[], p: number[]): number {
  const pairs: { y: number; p: number }[] = y.map((yi, i) => ({ y: yi, p: p[i] }))
  const pos = pairs.filter((r) => r.y === 1)
  const neg = pairs.filter((r) => r.y === 0)
  if (!pos.length || !neg.length) return Number.NaN
  let u = 0
  for (const a of pos) for (const b of neg) {
    if (a.p > b.p) u += 1
    else if (a.p === b.p) u += 0.5
  }
  return u / (pos.length * neg.length)
}

export function runPredictive(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const kind = String(options.predKind ?? 'linear')
  const yName = String(options.dependent ?? options.variable ?? '')
  const cov = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const hold = Math.min(0.5, Math.max(0.15, Number(options.holdout ?? 0.3)))
  if (!yName) return empty('Assign an outcome.')
  if (kind === 'forecast') {
    const y: number[] = []
    for (const row of rows) {
      const v = asFiniteNumber(row[yName])
      if (v !== null) y.push(v)
    }
    if (y.length < 12) return empty('Need a series of at least 12 points.')
    const cut = splitIndex(y.length, hold)
    const train = y.slice(0, cut)
    const test = y.slice(cut)
    let s = train[0]
    let b = train[1] - train[0]
    const alpha = 0.3
    const beta = 0.1
    for (let t = 1; t < train.length; t++) {
      const prev = s
      s = alpha * train[t] + (1 - alpha) * (s + b)
      b = beta * (s - prev) + (1 - beta) * b
    }
    const fc = test.map((_, i) => s + (i + 1) * b)
    const rmse = Math.sqrt(mean(test.map((v, i) => (v - fc[i]) ** 2)))
    const mae = mean(test.map((v, i) => Math.abs(v - fc[i])))
    return {
      analysisId: 'predictive.analytics',
      title: 'Predictive Analytics',
      interpretation: `Holt linear holdout on ${yName}: test n = ${test.length}, RMSE = ${round(rmse)}, MAE = ${round(mae)}.`,
      assumptions: ['Row order is time. Holt additive trend with α = 0.3, β = 0.1. This is the series workflow in JASP Predictive Analytics, not a black-box ML stack.'],
      footnotes: ['Linear and logistic holdout modes share this analysis ID.'],
      tables: [{ id: 'fc', title: 'Holdout accuracy', columns: ['RMSE', 'MAE', 'Train n', 'Test n'], rows: [[round(rmse), round(mae), train.length, test.length]] }],
      plots: [{
        id: 'fc-plot',
        title: 'Holt holdout',
        data: [
          { type: 'scatter', mode: 'lines', y, name: 'Observed' },
          { type: 'scatter', mode: 'lines', x: test.map((_, i) => cut + i), y: fc, name: 'Forecast' },
        ],
        layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
      }],
    }
  }

  if (!cov.length) return empty('Assign at least one predictor.')
  const complete: { y: number; x: number[] }[] = []
  for (const row of rows) {
    const yv = asFiniteNumber(row[yName])
    const xv = cov.map((c) => asFiniteNumber(row[c]))
    if (yv === null || xv.some((v) => v === null)) continue
    complete.push({ y: yv, x: xv as number[] })
  }
  if (complete.length < 12) return empty('Need at least 12 complete cases.')
  const cut = splitIndex(complete.length, hold)
  const train = complete.slice(0, cut)
  const test = complete.slice(cut)
  const Xtr = train.map((r) => [1, ...r.x])
  const Xte = test.map((r) => [1, ...r.x])

  if (kind === 'logistic') {
    const labels = [...new Set(complete.map((r) => r.y))]
    const y01 = (v: number) => (labels.length === 2 ? (v === labels[1] ? 1 : 0) : v > 0 ? 1 : 0)
    const ytr = train.map((r) => y01(r.y))
    const yte = test.map((r) => y01(r.y))
    const fit = glmFit(ytr, Xtr, 'binomial')
    if (!fit) return empty('Logistic fit failed.')
    const pred = Xte.map((row) => {
      const eta = row.reduce((s, x, j) => s + x * fit.beta[j], 0)
      return 1 / (1 + Math.exp(-Math.min(20, Math.max(-20, eta))))
    })
    const cls = pred.map((p) => (p >= 0.5 ? 1 : 0))
    const acc = mean(cls.map((c, i) => (c === yte[i] ? 1 : 0)))
    const a = auc(yte, pred)
    return {
      analysisId: 'predictive.analytics',
      title: 'Predictive Analytics',
      interpretation: `Logistic holdout: accuracy = ${round(acc)}, AUC = ${round(a)}, test n = ${test.length}.`,
      assumptions: ['First 70% of rows (or 1 − holdout) are training. No random shuffle, so sort the file if you need a random split.'],
      footnotes: ['Threshold 0.5. AUC is the Mann–Whitney ranking of predicted probabilities.'],
      tables: [{ id: 'cls', title: 'Classification holdout', columns: ['Accuracy', 'AUC', 'Train n', 'Test n'], rows: [[round(acc), round(a), train.length, test.length]] }],
      plots: [{ id: 'p', title: 'Predicted P(y=1)', data: [{ type: 'histogram', x: pred, nbinsx: 12 }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } }],
    }
  }

  const fit = lm(train.map((r) => r.y), Xtr)
  if (!fit) return empty('Linear fit failed.')
  const pred = Xte.map((row) => row.reduce((s, x, j) => s + x * fit.beta[j], 0))
  const yte = test.map((r) => r.y)
  const rmse = Math.sqrt(mean(yte.map((v, i) => (v - pred[i]) ** 2)))
  const mae = mean(yte.map((v, i) => Math.abs(v - pred[i])))
  const sst = yte.reduce((s, v) => s + (v - mean(yte)) ** 2, 0)
  const r2 = 1 - yte.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0) / Math.max(sst, 1e-12)
  return {
    analysisId: 'predictive.analytics',
    title: 'Predictive Analytics',
    interpretation: `Linear holdout: RMSE = ${round(rmse)}, MAE = ${round(mae)}, R² = ${round(r2)}, test n = ${test.length}.`,
    assumptions: ['Row-order train/test split. Predictors are numeric. This is JASP-style predictive scoring of a linear model, not boosting/trees (Phase 7).'],
    footnotes: ['Coefficients are estimated on the training slice only.'],
    tables: [
      { id: 'acc', title: 'Holdout accuracy', columns: ['RMSE', 'MAE', 'R²', 'Train n', 'Test n'], rows: [[round(rmse), round(mae), round(r2), train.length, test.length]] },
      { id: 'coef', title: 'Training coefficients', columns: ['Term', 'Estimate'], rows: ['(Intercept)', ...cov].map((name, i) => [name, round(fit.beta[i])]) },
    ],
    plots: [{
      id: 'pred',
      title: 'Predicted vs observed (test)',
      data: [{ type: 'scatter', mode: 'markers', x: yte, y: pred }],
      layout: { xaxis: { title: 'Observed' }, yaxis: { title: 'Predicted' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
