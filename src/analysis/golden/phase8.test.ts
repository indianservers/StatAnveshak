import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { recommendLearnStatsTree } from '../engines/frequentist/learnStats'
import { runAnalysis } from '../runAnalysis'
import { PHASE8_IMPLEMENTED } from './implemented'

describe('phase 8 Learn Stats', () => {
  it('uses the one-sample t engine for the p-value lab', () => {
    const rows = Array.from({ length: 12 }, () => ({ x: 5 }))
    const result = runAnalysis('learnStats.labs', rows, { lab: 'pvalue', variable: 'x', mu0: 5 })
    const test = result.tables.find((table) => table.id === 'test')
    expect(Number(test?.rows[0]?.[0])).toBeCloseTo(0, 8)
    expect(result.footnotes.join(' ')).toMatch(/t\.oneSample/)
  })

  it('puts CLT sample-mean scatter near σ/√n', () => {
    const result = runAnalysis('learnStats.labs', [], { lab: 'clt', n: 25, sigma: 2, seed: 1 })
    const sd = Number(result.tables[0]?.rows[0]?.[7])
    expect(sd).toBeCloseTo(2 / 5, 0)
  })

  it('maps the decision tree onto catalog IDs', () => {
    expect(recommendLearnStatsTree({ outcomeType: 'numeric', groups: 'two', paired: false }).analysisId).toBe('t.independent')
    expect(recommendLearnStatsTree({ outcomeType: 'numeric', groups: 'many' }).analysisId).toBe('anova.between')
    expect(recommendLearnStatsTree({ outcomeType: 'categorical', groups: 'one' }).analysisId).toBe('frequencies.binomial')
    const tree = runAnalysis('learnStats.labs', [], { lab: 'tree', outcomeType: 'numeric', groups: 'two', paired: false, predictors: 'none' })
    expect(tree.tables[0]?.rows[0]?.[0]).toBe('t.independent')
  })
})

describe('analysis catalog phase 8', () => {
  it('implements every catalog id across 35 JASP modules', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(ANALYSIS_CATALOG.every((item) => item.implemented)).toBe(true)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })
})
