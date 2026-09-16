import { describe, expect, it } from 'vitest'
import {
  CA_NEXT_STUDIO_SLUG,
  CA_STUDIO,
  CA_STUDIO_SLUG,
  KENDALL_VARIANT,
  WORKED,
  averageRanks,
  clampUnit,
  correlationMatrix,
  generateLinear,
  generatePreset,
  kendallBreakdown,
  kendallTauB,
  olsFit,
  partialCorrelation,
  partialFromResiduals,
  pearsonR,
  residualsOn,
  sampleCovariance,
  sampleSd,
  sampleVariance,
  SeededRng,
  spearmanRho,
  summarizePair,
  transformPoints,
} from './correlationAssociation'

describe('correlation & association math', () => {
  it('uses the canonical studio slug and eight labs', () => {
    expect(CA_STUDIO_SLUG).toBe('correlation-association')
    expect(CA_STUDIO.slug).toBe('correlation-association')
    expect(CA_STUDIO.labs.map((lab) => lab.slug)).toEqual([
      'scatter-plot-explorer',
      'covariance',
      'pearson-correlation',
      'spearman-rank-correlation',
      'kendall-tau',
      'correlation-matrix',
      'partial-correlation',
      'correlation-vs-causation',
    ])
    expect(CA_NEXT_STUDIO_SLUG).toBe('regression')
  })

  it('keeps a seeded generator deterministic', () => {
    const a = new SeededRng(42)
    const b = new SeededRng(42)
    expect([a.next(), a.normal(), a.int(1, 8)]).toEqual([b.next(), b.normal(), b.int(1, 8)])
  })

  it('uses sample covariance with n-1 and Pearson as cov/(sx sy)', () => {
    const x = WORKED.covariance.map((row) => row.x)
    const y = WORKED.covariance.map((row) => row.y)
    const n = x.length
    const mx = x.reduce((sum, value) => sum + value, 0) / n
    const my = y.reduce((sum, value) => sum + value, 0) / n
    const cov = x.reduce((sum, value, i) => sum + (value - mx) * (y[i] - my), 0) / (n - 1)
    expect(sampleCovariance(x, y)).toBeCloseTo(cov, 12)
    expect(pearsonR(x, y)).toBeCloseTo(cov / (sampleSd(x) * sampleSd(y)), 12)
  })

  it('returns undefined — not 0 — when a variable has zero variance', () => {
    expect(sampleVariance([4, 4, 4])).toBe(0)
    expect(pearsonR([1, 2, 3], [7, 7, 7])).toBeNaN()
    expect(spearmanRho([1, 1, 1], [2, 3, 4])).toBeNaN()
    expect(kendallTauB([1, 1, 1], [2, 3, 4])).toBeNaN()
    expect(partialCorrelation([1, 2, 3], [4, 5, 6], [8, 8, 8])).toBeNaN()
  })

  it('uses average ranks for ties: 2, 5, 5, 9 → 1, 2.5, 2.5, 4', () => {
    expect(averageRanks(WORKED.ranks)).toEqual([1, 2.5, 2.5, 4])
  })

  it('computes Spearman as Pearson of average ranks', () => {
    const x = [2, 5, 5, 9, 11]
    const y = [4, 7, 6, 10, 15]
    expect(spearmanRho(x, y)).toBeCloseTo(pearsonR(averageRanks(x), averageRanks(y)), 12)
  })

  it('labels Kendall as tau-b and handles ties without mixing variants', () => {
    const x = [1, 2, 2, 3]
    const y = [1, 2, 3, 3]
    const breakdown = kendallBreakdown(x, y)
    expect(breakdown.variant).toBe(KENDALL_VARIANT)
    expect(breakdown.variant).toBe('tau-b')
    expect(breakdown.concordant + breakdown.discordant + breakdown.tieX + breakdown.tieY + breakdown.tieBoth).toBe(6)
    expect(breakdown.tieX).toBe(1)
    expect(breakdown.tieY).toBe(1)
    expect(breakdown.tau).toBeCloseTo(kendallTauB(x, y), 12)
  })

  it('matches partial correlation from the formula and from residuals', () => {
    const points = generatePreset('confounded', 80, 11)
    const x = points.map((point) => point.x)
    const y = points.map((point) => point.y)
    const z = points.map((point) => point.z ?? 0)
    const formula = partialCorrelation(x, y, z)
    const residual = partialFromResiduals(x, y, z)
    expect(formula).toBeCloseTo(residual, 8)
    expect(Math.abs(pearsonR(x, y))).toBeGreaterThan(Math.abs(formula) + 0.15)
  })

  it('clamps only tiny floating-point overshoot onto [-1, 1]', () => {
    expect(clampUnit(1 + 1e-12)).toBe(1)
    expect(clampUnit(-1 - 1e-12)).toBe(-1)
    expect(clampUnit(1.2)).toBe(1.2)
    expect(clampUnit(Number.NaN)).toBeNaN()
  })

  it('is invariant to shift and positive scale, and flips sign under negative scale', () => {
    const points = generateLinear({ n: 40, r: 0.64, seed: 5 })
    const x = points.map((point) => point.x)
    const y = points.map((point) => point.y)
    const r = pearsonR(x, y)
    const shifted = transformPoints(points, { shiftX: 100, scaleX: 4, shiftY: -20, scaleY: 0.5 })
    expect(pearsonR(shifted.map((p) => p.x), shifted.map((p) => p.y))).toBeCloseTo(r, 10)
    const flipped = transformPoints(points, { scaleX: -3 })
    expect(pearsonR(flipped.map((p) => p.x), flipped.map((p) => p.y))).toBeCloseTo(-r, 10)
    const scaledCov = sampleCovariance(shifted.map((p) => p.x), shifted.map((p) => p.y))
    expect(Math.abs(scaledCov)).toBeGreaterThan(Math.abs(sampleCovariance(x, y)))
  })

  it('keeps a perfect increasing rank order at Spearman 1', () => {
    const x = WORKED.spearman.map((row) => row.x)
    const y = WORKED.spearman.map((row) => row.y)
    expect(spearmanRho(x, y)).toBeCloseTo(1, 12)
  })

  it('marks a constant column undefined in a correlation matrix', () => {
    const matrix = correlationMatrix(
      [
        { id: 'a', label: 'A', values: [1, 2, 3, 4] },
        { id: 'b', label: 'B', values: [7, 7, 7, 7] },
        { id: 'c', label: 'C', values: [2, 4, 6, 8] },
      ],
      'pearson',
    )
    expect(matrix.values[0][0]).toBe(1)
    expect(matrix.values[0][1]).toBeNaN()
    expect(matrix.values[0][2]).toBeCloseTo(1, 12)
    expect(matrix.ns[0][2]).toBe(4)
  })

  it('generates reproducible presets and a U-shape with Pearson near 0', () => {
    const a = generatePreset('u-shape', 50, 3)
    const b = generatePreset('u-shape', 50, 3)
    expect(a.map((point) => point.x)).toEqual(b.map((point) => point.x))
    const r = pearsonR(a.map((p) => p.x), a.map((p) => p.y))
    expect(Math.abs(r)).toBeLessThan(0.25)
    const mono = generatePreset('monotonic-nonlinear', 40, 8)
    expect(spearmanRho(mono.map((p) => p.x), mono.map((p) => p.y))).toBeGreaterThan(0.85)
    expect(Math.abs(pearsonR(mono.map((p) => p.x), mono.map((p) => p.y)))).toBeLessThan(
      spearmanRho(mono.map((p) => p.x), mono.map((p) => p.y)),
    )
  })

  it('fits a centered OLS line whose residuals have mean ~0', () => {
    const points = generateLinear({ n: 30, r: 0.7, seed: 9 })
    const x = points.map((p) => p.x)
    const y = points.map((p) => p.y)
    const fit = olsFit(x, y)
    expect(meanish(fit.residuals)).toBeCloseTo(0, 8)
    expect(meanish(residualsOn(x, y))).toBeCloseTo(0, 8)
    const stats = summarizePair(points)
    expect(stats.n).toBe(30)
    expect(stats.pearson).toBeCloseTo(pearsonR(x, y), 12)
  })
})

function meanish(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
