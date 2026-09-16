import { describe, expect, it } from 'vitest'
import {
  REG_NEXT_STUDIO_SLUG,
  REG_STUDIO,
  REG_STUDIO_SLUG,
  SeededRng,
  WORKED,
  candidateSse,
  confusionMatrix,
  dummyCode,
  generatePreset,
  groupSlopes,
  interpolationKind,
  logisticFit,
  meanAndPredictionIntervals,
  multipleOls,
  polynomialColumns,
  predictSimple,
  qrLeastSquares,
  residualPatternLabel,
  sigmoid,
  simpleOls,
  trainTestSplit,
  varianceInflation,
} from './regressionStudio'

describe('regression studio catalog', () => {
  it('uses the canonical studio slug and eleven labs', () => {
    expect(REG_STUDIO_SLUG).toBe('regression')
    expect(REG_STUDIO.slug).toBe('regression')
    expect(REG_STUDIO.labs.map((lab) => lab.slug)).toEqual([
      'simple-linear-regression',
      'least-squares',
      'prediction',
      'residual-analysis',
      'goodness-of-fit',
      'confidence-prediction-intervals',
      'multiple-regression',
      'polynomial-regression',
      'categorical-predictors',
      'interaction-effects',
      'logistic-regression-basics',
    ])
    expect(REG_NEXT_STUDIO_SLUG).toBe('anova')
  })
})

describe('simple OLS', () => {
  it('uses b1 = Σ(xi-x̄)(yi-ȳ) / Σ(xi-x̄)² and b0 = ȳ - b1 x̄', () => {
    const fit = simpleOls(WORKED.simpleX, WORKED.simpleY)
    const n = WORKED.simpleX.length
    const xbar = WORKED.simpleX.reduce((s, v) => s + v, 0) / n
    const ybar = WORKED.simpleY.reduce((s, v) => s + v, 0) / n
    const sxx = WORKED.simpleX.reduce((s, v) => s + (v - xbar) ** 2, 0)
    const sxy = WORKED.simpleX.reduce((s, v, i) => s + (v - xbar) * (WORKED.simpleY[i] - ybar), 0)
    expect(fit.b1).toBeCloseTo(sxy / sxx, 12)
    expect(fit.b0).toBeCloseTo(ybar - fit.b1 * xbar, 12)
  })

  it('splits SST = SSR + SSE and sets R² = 1 − SSE/SST', () => {
    const fit = simpleOls(WORKED.simpleX, WORKED.simpleY)
    expect(fit.sst).toBeCloseTo(fit.ssr + fit.sse, 10)
    expect(fit.r2).toBeCloseTo(1 - fit.sse / fit.sst, 12)
  })

  it('marks the intercept as out of range when X = 0 is outside the data', () => {
    const fit = simpleOls([2, 4, 6], [10, 14, 18])
    expect(fit.interceptOutOfRange).toBe(true)
    expect(simpleOls([-1, 0, 2], [1, 2, 5]).interceptOutOfRange).toBe(false)
  })

  it('makes any other line have a larger SSE than OLS', () => {
    const fit = simpleOls(WORKED.simpleX, WORKED.simpleY)
    const olsSse = candidateSse(WORKED.simpleX, WORKED.simpleY, fit.b0, fit.b1)
    const worse = candidateSse(WORKED.simpleX, WORKED.simpleY, fit.b0 + 1, fit.b1 - 0.4)
    expect(olsSse).toBeCloseTo(fit.sse, 12)
    expect(worse).toBeGreaterThan(olsSse + 1e-8)
  })
})

describe('intervals', () => {
  it('keeps the prediction interval strictly wider than the mean-response CI', () => {
    const fit = simpleOls(WORKED.simpleX, WORKED.simpleY)
    const atMean = meanAndPredictionIntervals(fit, fit.xbar, 0.95)
    const away = meanAndPredictionIntervals(fit, fit.xbar + 3, 0.95)
    expect(atMean.piWidth).toBeGreaterThan(atMean.ciWidth)
    expect(away.piWidth).toBeGreaterThan(away.ciWidth)
    expect(away.ciWidth).toBeGreaterThan(atMean.ciWidth)
    expect(away.piWidth).toBeGreaterThan(atMean.piWidth)
  })

  it('predicts ŷ = b0 + b1 x* and flags extrapolation outside the X range', () => {
    const fit = simpleOls(WORKED.simpleX, WORKED.simpleY)
    expect(predictSimple(fit, 5)).toBeCloseTo(fit.b0 + fit.b1 * 5, 12)
    expect(interpolationKind(5, WORKED.simpleX)).toBe('interpolation')
    expect(interpolationKind(20, WORKED.simpleX)).toBe('extrapolation')
  })
})

describe('multiple and polynomial via QR', () => {
  it('recovers known coefficients on a full-rank design', () => {
    const x1 = [1, 2, 3, 4, 5, 6, 7, 8]
    const x2 = [2, 1, 4, 3, 6, 5, 8, 7]
    const y = x1.map((v, i) => 3 + 2 * v + 4 * x2[i])
    const fit = multipleOls(y, [x1, x2], ['x1', 'x2'])
    expect(fit.deficient).toBe(false)
    expect(fit.beta[0]).toBeCloseTo(3, 8)
    expect(fit.beta[1]).toBeCloseTo(2, 8)
    expect(fit.beta[2]).toBeCloseTo(4, 8)
    expect(fit.r2).toBeCloseTo(1, 8)
  })

  it('handles a rank-deficient / collinear design without throwing', () => {
    const x1 = [1, 2, 3, 4, 5, 6]
    const x2 = x1.map((v) => 2 * v)
    const y = x1.map((v) => 5 + 3 * v)
    const fit = multipleOls(y, [x1, x2], ['x1', 'x2'])
    expect(fit.deficient).toBe(true)
    expect(fit.rank).toBeLessThan(3)
    expect(fit.fitted.every((value) => Number.isFinite(value))).toBe(true)
  })

  it('computes VIF = 1 / (1 − R_j²)', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8]
    const b = a.map((v) => v + 0.2)
    const vif = varianceInflation([a, b])
    const aux = multipleOls(a, [b], ['b'])
    expect(vif[0]).toBeCloseTo(1 / (1 - aux.r2), 8)
    expect(vif[0]).toBeGreaterThan(10)
  })

  it('fits a quadratic through polynomial columns', () => {
    const x = [1, 2, 3, 4, 5, 6]
    const y = x.map((v) => 2 + 3 * v + 0.5 * v * v)
    const poly = polynomialColumns(x, 2)
    const fit = multipleOls(y, poly.columns, poly.names)
    expect(fit.beta[0]).toBeCloseTo(2, 8)
    expect(fit.beta[1]).toBeCloseTo(3, 8)
    expect(fit.beta[2]).toBeCloseTo(0.5, 8)
  })
})

describe('categorical and interaction coding', () => {
  it('keeps fitted values equivalent when the reference level changes', () => {
    const x = [1, 2, 3, 4, 5, 6]
    const cat = ['Public', 'Public', 'Public', 'Private', 'Private', 'Private']
    const y = [40, 46, 50, 58, 64, 70]
    const a = dummyCode(cat, 'Public')
    const b = dummyCode(cat, 'Private')
    const fitA = multipleOls(y, [x, ...a.names.map((_, j) => a.matrix.map((row) => row[j]))], ['hours', ...a.names])
    const fitB = multipleOls(y, [x, ...b.names.map((_, j) => b.matrix.map((row) => row[j]))], ['hours', ...b.names])
    fitA.fitted.forEach((value, i) => expect(value).toBeCloseTo(fitB.fitted[i], 8))
    expect(a.names[0]).toContain('vs Public')
    expect(b.names[0]).toContain('vs Private')
  })

  it('reads slope_ref = β1 and slope_other = β1 + β3', () => {
    const slopes = groupSlopes([45.2, 4.1, 8.5, 3.8])
    expect(slopes.slopeRef).toBeCloseTo(4.1, 12)
    expect(slopes.slopeOther).toBeCloseTo(7.9, 12)
    expect(slopes.slopeGap).toBeCloseTo(3.8, 12)
  })
})

describe('logistic', () => {
  it('uses a stable sigmoid and OR = exp(β1)', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 12)
    expect(sigmoid(80)).toBe(1)
    expect(sigmoid(-80)).toBe(0)
    const x = [20, 30, 40, 50, 60, 70]
    const y = [0, 0, 0, 1, 1, 1]
    const fit = logisticFit(y, [x], ['age'])
    expect(fit.oddsRatio[1]).toBeCloseTo(Math.exp(fit.beta[1]), 12)
    expect(fit.probability.every((p) => p > 0 && p < 1)).toBe(true)
  })

  it('does not change fitted probabilities when the decision threshold moves', () => {
    const x = [22, 28, 35, 44, 55, 66, 72]
    const y = [0, 0, 0, 1, 1, 1, 1]
    const fit = logisticFit(y, [x], ['age'])
    const low = confusionMatrix(y, fit.probability, 0.3)
    const high = confusionMatrix(y, fit.probability, 0.7)
    expect(fit.probability).toEqual(fit.probability)
    expect(low.threshold).not.toBe(high.threshold)
    expect(low.tp + low.fn).toBe(high.tp + high.fn)
  })

  it('warns on complete separation', () => {
    const x = [1, 2, 3, 8, 9, 10]
    const y = [0, 0, 0, 1, 1, 1]
    const fit = logisticFit(y, [x], ['x'])
    expect(fit.separated).toBe(true)
  })
})

describe('generators and language', () => {
  it('keeps a seeded generator deterministic', () => {
    const a = new SeededRng(42)
    const b = new SeededRng(42)
    expect([a.next(), a.normal(), a.int(1, 8)]).toEqual([b.next(), b.normal(), b.int(1, 8)])
  })

  it('reproduces presets and a train/test split', () => {
    const first = generatePreset('study-exam', 30, 11, 7)
    const second = generatePreset('study-exam', 30, 11, 7)
    expect(first.map((p) => p.y)).toEqual(second.map((p) => p.y))
    const split = trainTestSplit(first, 3, 0.7)
    expect(split.train.length + split.test.length).toBe(first.length)
  })

  it('uses cautious residual language', () => {
    expect(residualPatternLabel('random')).toMatch(/consistent with/i)
    expect(residualPatternLabel('curve')).toMatch(/may indicate/i)
    expect(residualPatternLabel('funnel')).toMatch(/may indicate/i)
  })
})

describe('QR on a tiny system', () => {
  it('solves a 2-column least-squares problem', () => {
    const X = [
      [1, 1],
      [1, 2],
      [1, 3],
    ]
    const y = [2, 3, 4]
    const fit = qrLeastSquares(y, X)
    expect(fit.beta[0]).toBeCloseTo(1, 8)
    expect(fit.beta[1]).toBeCloseTo(1, 8)
  })
})
