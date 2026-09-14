import { describe, expect, it } from 'vitest'
import { describeNumeric } from '../engines/frequentist/descriptives'
import { sampleKurtosis, sampleSkewness, sampleVariance } from '../engines/frequentist/numeric'
import { seriesAcf, seriesPacf } from '../engines/frequentist/timeSeriesDescriptives'
import { shapiroWilk } from '../engines/frequentist/shapiroWilk'
import { runAnalysis } from '../runAnalysis'
import { ANALYSIS_CATALOG } from '../catalog'
import { PHASE8_IMPLEMENTED } from './implemented'

const five = [1, 2, 3, 4, 5]

describe('descriptives golden values', () => {
  const stats = describeNumeric(five, 0, 0.95)

  it('matches sample moments for 1..5', () => {
    expect(stats.valid).toBe(5)
    expect(stats.mean).toBe(3)
    expect(stats.variance).toBeCloseTo(2.5, 12)
    expect(stats.sd).toBeCloseTo(Math.sqrt(2.5), 12)
    expect(stats.se).toBeCloseTo(Math.sqrt(2.5 / 5), 12)
    expect(stats.median).toBe(3)
    expect(stats.q1).toBe(2)
    expect(stats.q3).toBe(4)
    expect(stats.iqr).toBe(2)
    expect(stats.min).toBe(1)
    expect(stats.max).toBe(5)
    expect(stats.range).toBe(4)
    expect(stats.sum).toBe(15)
    expect(stats.skew).toBeCloseTo(0, 12)
    expect(stats.kurtosis).toBeCloseTo(-1.2, 10)
    expect(sampleVariance(five)).toBe(2.5)
    expect(sampleSkewness(five)).toBeCloseTo(0, 12)
    expect(sampleKurtosis(five)).toBeCloseTo(-1.2, 10)
  })

  it('matches R shapiro.test(c(1,2,3,4,5)) within 1e-3', () => {
    const { w, p } = shapiroWilk(five)
    expect(w).toBeCloseTo(0.986762, 3)
    expect(p).toBeCloseTo(0.967174, 3)
  })

  it('rejects a heavily skewed sample at 5%', () => {
    const sample = [1, 1, 1, 1, 1, 1, 1, 25]
    const { w, p } = shapiroWilk(sample)
    expect(w).toBeLessThan(0.8)
    expect(p).toBeLessThan(0.05)
  })
})

describe('time-series ACF/PACF', () => {
  it('gives ACF1 = 1 for a linear series lag-0 and high lag-1 persistence', () => {
    const y = [1, 2, 3, 4, 5, 6, 7, 8]
    const acf = seriesAcf(y, 2)
    expect(acf[0]).toBeCloseTo(1, 12)
    expect(acf[1]).toBeGreaterThan(0.6)
  })

  it('gives PACF after lag 1 near 0 for an AR(1)-like linear trend after first lag', () => {
    const y = Array.from({ length: 40 }, (_, i) => 0.8 * i)
    const pac = seriesPacf(seriesAcf(y, 4))
    expect(Math.abs(pac[2])).toBeLessThan(Math.abs(pac[1]))
  })
})

describe('analysis catalog', () => {
  it('implements Phase 1–4 catalog engines and lists every JASP module', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })

  it('runs descriptive statistics without throwing', () => {
    const rows = five.map((score, i) => ({ score, group: i < 3 ? 'A' : 'B' }))
    const result = runAnalysis('descriptives.statistics', rows, { variables: ['score'], splitBy: 'group', ciLevel: 0.95 })
    expect(result.tables[0].rows).toHaveLength(2)
    expect(result.plots.length).toBeGreaterThan(0)
  })
})
