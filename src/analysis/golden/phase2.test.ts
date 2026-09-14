import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { pTailT, pf } from '../engines/frequentist/dists'
import { runPowerAnalysis } from '../engines/frequentist/power'
import { oneSampleT, studentT } from '../engines/frequentist/ttests'
import { runAnalysis } from '../runAnalysis'
import { PHASE8_IMPLEMENTED } from './implemented'

describe('phase 2 t-tests', () => {
  it('matches R t.test(c(1,2,3,4,5), mu=0) within 1e-5', () => {
    const { t, df } = oneSampleT([1, 2, 3, 4, 5], 0)
    expect(t).toBeCloseTo(4.242640687, 6)
    expect(df).toBe(4)
    expect(pTailT(t, df, 'two-sided')).toBeCloseTo(1 - pf(t * t, 1, df), 8)
    expect(pTailT(t, df, 'two-sided')).toBeLessThan(0.02)
    expect(pTailT(t, df, 'two-sided')).toBeGreaterThan(0.01)
  })

  it('matches equal-variance two-sample t for 1:5 vs 2:6', () => {
    const { t, df } = studentT([1, 2, 3, 4, 5], [2, 3, 4, 5, 6])
    expect(t).toBeCloseTo(-1, 10)
    expect(df).toBe(8)
    expect(pTailT(t, df, 'two-sided')).toBeCloseTo(0.3465936, 5)
  })

  it('runs independent t through the dispatcher', () => {
    const rows = [
      ...[1, 2, 3, 4, 5].map((y) => ({ y, g: 'A' })),
      ...[2, 3, 4, 5, 6].map((y) => ({ y, g: 'B' })),
    ]
    const result = runAnalysis('t.independent', rows, { dependent: 'y', group: 'g', alternative: 'two-sided', equalVariance: true, mannWhitney: true })
    expect(result.tables.some((table) => table.id === 'test')).toBe(true)
    expect(String(result.tables.find((table) => table.id === 'test')?.rows[0][0])).toMatch(/-?1/)
  })
})

describe('phase 2 ANOVA', () => {
  it('matches one-way F for 1,2,3 vs 4,5,6', () => {
    const rows = [
      { y: 1, g: 'A' }, { y: 2, g: 'A' }, { y: 3, g: 'A' },
      { y: 4, g: 'B' }, { y: 5, g: 'B' }, { y: 6, g: 'B' },
    ]
    const result = runAnalysis('anova.between', rows, { dependent: 'y', factors: ['g'], ssType: 'III', postHoc: { tukey: true } })
    const f = Number(result.tables[0].rows[0][4])
    expect(f).toBeCloseTo(13.5, 8)
    expect(1 - pf(13.5, 1, 4)).toBeCloseTo(0.02131164, 4)
  })
})

describe('phase 2 TOST', () => {
  it('rejects equivalence when the mean is far from zero relative to Δ', () => {
    const rows = [1, 2, 3, 4, 5].map((x) => ({ x }))
    const result = runAnalysis('equivalence.t', rows, { design: 'one-sample', variable: 'x', mu0: 0, delta: 0.5, alpha: 0.05 })
    expect(result.interpretation.toLowerCase()).toMatch(/not establish equivalence|does not/)
  })

  it('establishes equivalence when all values sit well inside ±Δ', () => {
    const rows = [4.9, 5.0, 5.0, 5.1, 5.0, 4.95, 5.05, 5.0].map((x) => ({ x }))
    const result = runAnalysis('equivalence.t', rows, { design: 'one-sample', variable: 'x', mu0: 5, delta: 0.5, alpha: 0.05 })
    expect(result.tables.find((table) => table.id === 'tost')?.rows[2][4]).toBe('equivalent')
  })
})

describe('phase 2 power', () => {
  it('needs about 64 per group for d=0.5, 80% power, two-sided α=0.05', () => {
    const result = runPowerAnalysis([], { design: 't.independent', compute: 'n', effectSize: 0.5, alpha: 0.05, power: 0.8, alternative: 'two-sided' })
    const n = Number(result.tables[0].rows[0][4])
    expect(n).toBeGreaterThanOrEqual(63)
    expect(n).toBeLessThanOrEqual(65)
  })
})

describe('analysis catalog phase 2', () => {
  it('marks phase 2 engines implemented without duplicating IDs', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })
})
