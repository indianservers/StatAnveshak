import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { leadingDigit, binomCdf } from '../engines/frequentist/audit'
import { kmeans, ridgeLasso } from '../engines/frequentist/ml'
import { processCapability } from '../engines/frequentist/qc'
import { runAnalysis } from '../runAnalysis'
import { PHASE8_IMPLEMENTED } from './implemented'

describe('phase 7 ML', () => {
  it('recovers a linear y = 2x on noiseless data', () => {
    const rows = Array.from({ length: 20 }, (_, i) => {
      const x = i + 1
      return { y: 2 * x, x }
    })
    const result = runAnalysis('ml.regression', rows, { dependent: 'y', predictors: ['x'], algorithm: 'linear' })
    expect(Number(result.tables[0].rows[0][0])).toBeLessThan(1e-6)
  })

  it('separates two blobs with k-means k = 2', () => {
    const A = Array.from({ length: 12 }, () => [0, 0] as [number, number])
    const B = Array.from({ length: 12 }, () => [10, 10] as [number, number])
    const km = kmeans([...A, ...B], 2)
    expect(new Set(km.labels).size).toBe(2)
    const gap = Math.hypot(
      (km.centers[0]?.[0] ?? 0) - (km.centers[1]?.[0] ?? 0),
      (km.centers[0]?.[1] ?? 0) - (km.centers[1]?.[1] ?? 0),
    )
    expect(gap).toBeGreaterThan(5)
    const beta = ridgeLasso([2, 4, 6, 8, 10], [[1], [2], [3], [4], [5]], 0, false)
    expect(beta[1]).toBeCloseTo(2, 0)
  })
})

describe('phase 7 QC / sampling / audit', () => {
  it('gives Cp = 1 when USL-LSL = 6s', () => {
    const x = [9, 10, 11, 9, 10, 11, 9, 10, 11, 10]
    const cap = processCapability(x, meanLike(x) - 3 * sdLike(x), meanLike(x) + 3 * sdLike(x))
    expect(cap.cp).toBeCloseTo(1, 8)
    const rows = x.map((v) => ({ v }))
    const result = runAnalysis('qc.capability', rows, {
      variable: 'v',
      lsl: meanLike(x) - 3 * sdLike(x),
      usl: meanLike(x) + 3 * sdLike(x),
    })
    expect(Number(result.tables[0].rows[0][2])).toBeCloseTo(1, 5)
  })

  it('accepts a perfect attribute sample', () => {
    expect(binomCdf(50, 1, 0)).toBeCloseTo(1, 12)
    const result = runAnalysis('acceptance.attribute', [], { n: 50, c: 1, aql: 0.01, ltpd: 0.06, observed: 0 })
    expect(String(result.tables[0].rows[0][5])).toMatch(/Accept/)
  })

  it('reads leading digits and ranks Benford', () => {
    expect(leadingDigit(1234)).toBe(1)
    expect(leadingDigit(0.056)).toBe(5)
    const rows = [1, 10, 100, 1000, 2, 20, 3].map((a) => ({ a }))
    const result = runAnalysis('audit.data', rows, { amount: 'a' })
    expect(Number(result.tables.find((t) => t.id === 'benford')?.rows[0][1])).toBe(4)
  })
})

describe('analysis catalog phase 7', () => {
  it('marks Phase 7 engines implemented without duplicating IDs', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })
})

function meanLike(x: number[]) {
  return x.reduce((s, v) => s + v, 0) / x.length
}

function sdLike(x: number[]) {
  const m = meanLike(x)
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1))
}
