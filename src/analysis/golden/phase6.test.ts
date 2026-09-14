import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { derSimonianLaird } from '../engines/frequentist/meta'
import { runAnalysis } from '../runAnalysis'
import { PHASE8_IMPLEMENTED } from './implemented'

describe('phase 6 SEM / CFA', () => {
  it('fits a one-factor CFA on four congeneric items', () => {
    const rows = Array.from({ length: 40 }, (_, i) => {
      const z = (i % 10) - 4.5
      return { a: z + 0.05, b: z - 0.04, c: 0.95 * z + 0.1, d: 1.05 * z }
    })
    const result = runAnalysis('factor.cfa', rows, { variables: ['a', 'b', 'c', 'd'], nFactors: 1 })
    expect(result.tables.find((t) => t.id === 'fit')?.rows[0]?.[0]).toBe(40)
    const loads = result.tables.find((t) => t.id === 'load')?.rows ?? []
    expect(loads).toHaveLength(4)
    expect(loads.every((row) => Number.isFinite(Number(row[1])))).toBe(true)
  })
})

describe('phase 6 meta-analysis', () => {
  it('pools two identical studies to yi with τ² = 0', () => {
    const dl = derSimonianLaird([
      { yi: 0.4, sei: 0.2, label: 'A' },
      { yi: 0.4, sei: 0.2, label: 'B' },
    ])
    expect(dl.muFe).toBeCloseTo(0.4, 12)
    expect(dl.muRe).toBeCloseTo(0.4, 12)
    expect(dl.tau2).toBeCloseTo(0, 12)
    const rows = [
      { yi: 0.4, sei: 0.2, study: 'A' },
      { yi: 0.4, sei: 0.2, study: 'B' },
    ]
    const result = runAnalysis('meta.analysis', rows, { yi: 'yi', sei: 'sei', study: 'study' })
    expect(Number(result.tables.find((t) => t.id === 'pool')?.rows[0]?.[1])).toBeCloseTo(0.4, 8)
    expect(Number(result.tables.find((t) => t.id === 'het')?.rows[0]?.[3])).toBeCloseTo(0, 8)
  })
})

describe('phase 6 network', () => {
  it('puts the strongest edge on the correlated pair', () => {
    const rows = Array.from({ length: 30 }, (_, i) => {
      const x = i
      return { x, y: x + 0.01 * (i % 3), z: (i % 5) - 2 }
    })
    const result = runAnalysis('network.psych', rows, { variables: ['x', 'y', 'z'], rho: 0.05 })
    const top = result.tables.find((t) => t.id === 'edges')?.rows[0]
    expect(top?.slice(0, 2).sort()).toEqual(['x', 'y'])
    expect(Math.abs(Number(top?.[2]))).toBeGreaterThan(0.5)
  })
})

describe('phase 6 Bain', () => {
  it('favors μ > 0 for 1..5', () => {
    const rows = [1, 2, 3, 4, 5].map((v) => ({ v }))
    const result = runAnalysis('bain.tests', rows, { family: 't', variable: 'v', mu0: 0, hypothesis: 'greater' })
    expect(Number(result.tables.find((t) => t.id === 'bf')?.rows[0]?.[1])).toBeGreaterThan(1)
  })
})

describe('analysis catalog phase 6', () => {
  it('marks Phase 6 engines implemented without duplicating IDs', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })
})
