import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { binomialBf10 } from '../engines/bayesian/categorical'
import { correlationBf10 } from '../engines/bayesian/jzs'
import { runAnalysis } from '../runAnalysis'
import { PHASE8_IMPLEMENTED } from './implemented'
const binomialClosed = 1 / 11 / (252 * (0.5 ** 10))

describe('phase 4 Bayes factors', () => {
  it('matches the Beta(1,1) binomial BF₁₀ for 5/10 vs p₀ = 0.5', () => {
    expect(binomialBf10(5, 10, 0.5, 1, 1)).toBeCloseTo(binomialClosed, 8)
    const rows = [...Array(5).fill({ v: 'yes' }), ...Array(5).fill({ v: 'no' })]
    const result = runAnalysis('frequencies.binomial', rows, {
      variable: 'v',
      p0: 0.5,
      inference: 'bayesian',
      priorAlpha: 1,
      priorBeta: 1,
    })
    expect(Number(result.tables.find((table) => table.id === 'bf')?.rows[0][0])).toBeCloseTo(binomialClosed, 4)
  })

  it('keeps the frequentist binomial path when inference is omitted', () => {
    const rows = [...Array(5).fill({ v: 'yes' }), ...Array(5).fill({ v: 'no' })]
    const result = runAnalysis('frequencies.binomial', rows, { variable: 'v', p0: 0.5 })
    expect(Number(result.tables[0].rows[0][4])).toBeCloseTo(1, 8)
    expect(result.tables[0].id).not.toBe('bf')
  })

  it('gives JZS BF₁₀ > 1 for one-sample t on 1..5 vs μ = 0', () => {
    const rows = [1, 2, 3, 4, 5].map((x) => ({ x }))
    const result = runAnalysis('t.oneSample', rows, { variable: 'x', mu0: 0, inference: 'bayesian' })
    expect(Number(result.tables.find((table) => table.id === 'bf')?.rows[0][0])).toBeGreaterThan(1)
  })

  it('gives a larger correlation BF₁₀ at r = 1 than at r = 0', () => {
    expect(correlationBf10(0, 20)).toBeLessThan(correlationBf10(0.99, 20))
    const independent = Array.from({ length: 20 }, (_, i) => ({ x: i, y: i % 2 }))
    const identical = Array.from({ length: 20 }, (_, i) => ({ x: i, y: i }))
    const bf0 = Number(runAnalysis('regression.correlation', independent, { variables: ['x', 'y'], inference: 'bayesian' }).tables[0].rows[0][3])
    const bf1 = Number(runAnalysis('regression.correlation', identical, { variables: ['x', 'y'], inference: 'bayesian' }).tables[0].rows[0][3])
    expect(bf1).toBeGreaterThan(bf0)
  })
})

describe('phase 4 standalone modules', () => {
  it('runs BFF, Learn Bayes, and published summaries without a dataset', () => {
    const bff = runAnalysis('bff.general', [], { bffKind: 't', stat: 2, n: 40, df: 20, rscale: 0.707 })
    expect(bff.tables[0].rows.length).toBe(1)
    expect(Number(bff.tables[0].rows[0][0])).toBeGreaterThan(0)
    const lab = runAnalysis('learnBayes.labs', [], {
      lab: 'binomial',
      priorAlpha: 1,
      priorBeta: 1,
      successes: 5,
      trials: 10,
    })
    expect(Number(lab.tables[0].rows[0][0])).toBeCloseTo(binomialClosed, 4)
    const published = runAnalysis('summaryStats.fromPublished', [], {
      summaryKind: 'binomial',
      successes: 5,
      n: 10,
      p0: 0.5,
    })
    expect(Number(published.tables[0].rows[0][0])).toBeCloseTo(binomialClosed, 4)
  })

  it('runs robust t on a numeric series', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((x) => ({ x }))
    const result = runAnalysis('robustT.modelAveraged', rows, { variable: 'x', mu0: 0, rscale: 0.707 })
    expect(result.tables.find((table) => table.id === 'bf')).toBeTruthy()
  })
})

describe('analysis catalog phase 4', () => {
  it('adds Bayesian twins and four Phase 4 modules without duplicating IDs', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
    for (const id of [
      't.oneSample', 'anova.between', 'regression.linear', 'frequencies.binomial', 'equivalence.t',
    ]) {
      expect(ANALYSIS_CATALOG.find((item) => item.id === id)?.bayesian).toBe(true)
    }
    expect(ANALYSIS_CATALOG.find((item) => item.id === 'anova.manova')?.bayesian).toBe(false)
  })
})
