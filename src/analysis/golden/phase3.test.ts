import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { binomialExactP } from '../engines/frequentist/frequencies'
import { cronbachAlpha } from '../engines/frequentist/reliability'
import { runAnalysis } from '../runAnalysis'

import { PHASE8_IMPLEMENTED } from './implemented'

describe('phase 3 regression', () => {
  it('gives Pearson r = 1 for identical series', () => {
    const rows = [1, 2, 3, 4, 5].map((x) => ({ x, y: x }))
    const result = runAnalysis('regression.correlation', rows, { variables: ['x', 'y'], method: 'pearson', ciLevel: 0.95 })
    const r = Number(result.tables.find((t) => t.id === 'pairs')?.rows[0][1])
    expect(r).toBeCloseTo(1, 10)
  })

  it('fits y = 1 + 2x with R² = 1', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 1 + 2 * x }))
    const result = runAnalysis('regression.linear', rows, { dependent: 'y', covariates: ['x'], ciLevel: 0.95 })
    const fit = result.tables.find((t) => t.title === 'Model fit')
    expect(Number(fit?.rows[0][1])).toBeCloseTo(1, 10)
    const coef = result.tables.find((t) => t.id === 'coef')
    expect(Number(coef?.rows[0][1])).toBeCloseTo(1, 8)
    expect(Number(coef?.rows[1][1])).toBeCloseTo(2, 8)
  })

  it('fits a Gaussian GLM that matches the linear slope', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 1 + 2 * x }))
    const result = runAnalysis('regression.glm', rows, { dependent: 'y', covariates: ['x'], family: 'gaussian' })
    const intercept = Number(result.tables.find((t) => t.id === 'coef')?.rows[0][1])
    const slope = Number(result.tables.find((t) => t.id === 'coef')?.rows[1][1])
    expect(intercept).toBeCloseTo(1, 6)
    expect(slope).toBeCloseTo(2, 6)
  })
})

describe('phase 3 frequencies', () => {
  it('gives exact binomial p = 1 for 5/10 vs p₀ = 0.5', () => {
    expect(binomialExactP(5, 10, 0.5)).toBeCloseTo(1, 10)
    const rows = [...Array(5).fill({ v: 'yes' }), ...Array(5).fill({ v: 'no' })]
    const result = runAnalysis('frequencies.binomial', rows, { variable: 'v', p0: 0.5 })
    expect(Number(result.tables[0].rows[0][4])).toBeCloseTo(1, 8)
  })

  it('gives Pearson χ² = 0 on a balanced 2×2', () => {
    const rows = [
      ...Array(10).fill({ a: 'A', b: 'X' }),
      ...Array(10).fill({ a: 'A', b: 'Y' }),
      ...Array(10).fill({ a: 'B', b: 'X' }),
      ...Array(10).fill({ a: 'B', b: 'Y' }),
    ]
    const result = runAnalysis('frequencies.contingency', rows, { rows: 'a', columns: 'b' })
    expect(Number(result.tables[0].rows[0][0])).toBeCloseTo(0, 10)
  })
})

describe('phase 3 reliability and factor', () => {
  it('gives Cronbach α = 1 on identical items', () => {
    const X = [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4], [5, 5, 5]]
    expect(cronbachAlpha(X)).toBeCloseTo(1, 10)
    const rows = X.map((row) => ({ a: row[0], b: row[1], c: row[2] }))
    const result = runAnalysis('reliability.unidimensional', rows, { variables: ['a', 'b', 'c'] })
    expect(Number(result.tables[0].rows[0][1])).toBeCloseTo(1, 8)
  })

  it('runs PCA without throwing and returns eigenvalues', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ a: i, b: i + 0.1, c: 20 - i }))
    const result = runAnalysis('factor.pca', rows, { variables: ['a', 'b', 'c'], matrix: 'correlation' })
    expect(result.tables.find((t) => t.id === 'eigen')?.rows.length).toBe(3)
  })
})

describe('analysis catalog phase 3', () => {
  it('marks phase 3 engines implemented without duplicating IDs', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })
})
