import { describe, expect, it } from 'vitest'
import {
  WORKED,
  allocateEqual,
  allocateProportional,
  biasedSample,
  createPopulation,
  designEffect,
  inclusionProbability,
  intraClassCorrelation,
  largestRemainder,
  mean,
  mse,
  pickClusters,
  proportionMoe,
  repeatStatistic,
  sampleClusters,
  sampleMean,
  sampleSrs,
  sampleStratified,
  SeededRng,
  stratifiedEstimate,
  systematicInterval,
  systematicPositions,
} from './samplingMethods'

describe('sampling methods math', () => {
  it('keeps a seeded generator deterministic', () => {
    const a = new SeededRng(42)
    const b = new SeededRng(42)
    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)])
  })

  it('builds a population whose mean matches the stored units', () => {
    const pop = createPopulation({ N: 200, seed: 7, clusterCount: 8 })
    expect(pop.N).toBe(200)
    expect(pop.units).toHaveLength(200)
    expect(pop.mu).toBeCloseTo(mean(pop.units.map((unit) => unit.value)), 10)
    expect(new Set(pop.units.map((unit) => unit.id)).size).toBe(200)
    expect(pop.groups.map((group) => group.id)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('draws an SRS without replacement with inclusion probability n/N', () => {
    const pop = createPopulation({ N: 200, seed: 11 })
    const rng = new SeededRng(3)
    const ids = sampleSrs(pop, 20, rng)
    expect(ids).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
    expect(ids.every((id) => id >= 1 && id <= 200)).toBe(true)
    expect(inclusionProbability(20, 200)).toBeCloseTo(0.1, 10)
  })

  it('matches the mockup stratified allocation of 60 from 120 / 100 / 80', () => {
    expect(allocateProportional(WORKED.stratified.Nh, WORKED.stratified.n)).toEqual([24, 20, 16])
    expect(allocateProportional(WORKED.company.Nh, WORKED.company.n)[0]).toBe(36)
    expect(allocateEqual(3, 60)).toEqual([20, 20, 20])
    expect(largestRemainder([1, 1, 1], 10)).toEqual([4, 3, 3])
  })

  it('computes the weighted stratified mean, not the raw sample mean', () => {
    const pop = createPopulation({ N: 300, seed: 5, groups: [
      { id: 'S1', label: 'S1', share: 120 / 300, mean: 50, sd: 1, respondP: 0.8, color: '#2563eb' },
      { id: 'S2', label: 'S2', share: 100 / 300, mean: 70, sd: 1, respondP: 0.8, color: '#7c3aed' },
      { id: 'S3', label: 'S3', share: 80 / 300, mean: 90, sd: 1, respondP: 0.8, color: '#059669' },
    ] })
    const allocation = { S1: 6, S2: 6, S3: 6 }
    const ids = sampleStratified(pop, allocation, new SeededRng(9))
    const est = stratifiedEstimate(pop, ids)
    expect(est.weights.S1).toBeCloseTo(0.4, 8)
    expect(est.weights.S2).toBeCloseTo(100 / 300, 8)
    expect(est.xbarSt).toBeCloseTo(0.4 * est.means.S1 + (100 / 300) * est.means.S2 + (80 / 300) * est.means.S3, 8)
    expect(est.xbarSt).not.toBeCloseTo(sampleMean(pop, ids), 6)
  })

  it('samples whole clusters in one-stage and a subset in two-stage', () => {
    const pop = createPopulation({ N: 160, seed: 2, clusterCount: 8 })
    const clusters = pickClusters(pop, 3, new SeededRng(4))
    expect(clusters).toHaveLength(3)
    const one = sampleClusters(pop, clusters, 1, 5, new SeededRng(8))
    expect(one.every((id) => clusters.includes(pop.units[id - 1].cluster))).toBe(true)
    expect(one.length).toBeGreaterThan(40)
    const two = sampleClusters(pop, clusters, 2, 5, new SeededRng(8))
    expect(two).toHaveLength(15)
    expect(designEffect(20, 0.2)).toBeCloseTo(4.8, 8)
    const rho = intraClassCorrelation(pop)
    expect(rho).toBeGreaterThan(-0.2)
    expect(rho).toBeLessThan(0.55)
  })

  it('walks an ordered frame at interval k after a random start', () => {
    expect(systematicInterval(20, 4)).toBe(5)
    expect(systematicPositions(20, 5, 3)).toEqual([3, 8, 13, 18])
    expect(systematicPositions(WORKED.systematic.N, WORKED.systematic.k, WORKED.systematic.start)[0]).toBe(7)
    expect(systematicPositions(500, 10, 7).at(-1)).toBe(497)
    expect(systematicPositions(500, 10, 7)).toHaveLength(50)
    expect(systematicPositions(WORKED.visitors.N, 10, WORKED.visitors.start)).toEqual(
      Array.from({ length: 30 }, (_, i) => 4 + i * 10),
    )
  })

  it('keeps mechanism bias after repeated draws', () => {
    const pop = createPopulation({ N: 240, seed: 21 })
    const summary = repeatStatistic(
      80,
      13,
      (rng) => sampleMean(pop, biasedSample(pop, 40, 'undercoverage', rng)),
      pop.mu,
    )
    expect(Math.abs(summary.bias)).toBeGreaterThan(1)
    expect(summary.mse).toBeCloseTo(summary.se ** 2 + summary.bias ** 2, 8)
    expect(summary.mse).toBeGreaterThan(summary.bias ** 2 * 0.5)
  })

  it('shrinks sampling error as n grows and keeps MSE = Var + Bias²', () => {
    expect(proportionMoe(WORKED.error.phat, WORKED.error.n)).toBeCloseTo(0.0476, 3)
    expect(mse(4, 3)).toBe(13)
    const pop = createPopulation({ N: 300, seed: 17 })
    const small = repeatStatistic(120, 4, (rng) => sampleMean(pop, sampleSrs(pop, 20, rng)), pop.mu)
    const large = repeatStatistic(120, 4, (rng) => sampleMean(pop, sampleSrs(pop, 80, rng)), pop.mu)
    expect(large.se).toBeLessThan(small.se)
    expect(Math.abs(small.bias)).toBeLessThan(1.5)
  })

  it('matches the SRS household inclusion probability from the mockup quiz', () => {
    expect(inclusionProbability(100, 1500)).toBeCloseTo(1 / 15, 10)
    expect(inclusionProbability(WORKED.srs.n, WORKED.srs.N)).toBeCloseTo(50 / 800, 10)
  })
})
