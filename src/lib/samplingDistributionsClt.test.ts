import { describe, expect, it } from 'vitest'
import {
  SamplingDistributionEngine,
  bootstrapResample,
  buildHistogram,
  createPopulation,
  createRng,
  downsamplePath,
  finitePopulationCorrection,
  fpcIsMaterial,
  meanOf,
  medianOf,
  normalApproxOk,
  percentileInterval,
  runningMeans,
  sampleStatistic,
  seVsN,
  simulateSampling,
  theoreticalSE,
} from './samplingDistributionsClt'

describe('SamplingDistributionEngine', () => {
  it('is reproducible for the same seed', () => {
    const a = new SamplingDistributionEngine({ seed: 42 })
    const b = new SamplingDistributionEngine({ seed: 42 })
    const popA = a.createPopulation({ kind: 'normal', mu: 50, sigma: 10 })
    const popB = b.createPopulation({ kind: 'normal', mu: 50, sigma: 10 })
    const sampleA = a.drawSample(popA, 8)
    const sampleB = b.drawSample(popB, 8)
    expect(sampleA).toEqual(sampleB)
    expect(a.statistic(sampleA, 'mean')).toBeCloseTo(b.statistic(sampleB, 'mean'), 12)
  })

  it('matches theoretical mean and SE for a normal parent', () => {
    const engine = new SamplingDistributionEngine({ seed: 7 })
    const population = createPopulation({ kind: 'normal', mu: 70, sigma: 12 }, createRng(3))
    const result = engine.simulate({
      population,
      n: 36,
      R: 4000,
      statistic: 'mean',
      seed: 11,
      keepStatistics: false,
    })
    expect(result.empiricalMean).toBeCloseTo(70, 0)
    expect(result.theoreticalSE).toBeCloseTo(12 / 6, 10)
    expect(result.empiricalSd).toBeGreaterThan(1.6)
    expect(result.empiricalSd).toBeLessThan(2.6)
    expect(Math.abs(result.bias)).toBeLessThan(0.25)
    expect(result.histogram.reduce((sum, bin) => sum + bin.count, 0)).toBe(4000)
  })

  it('applies the finite population correction when n/N is material and sampling without replacement', () => {
    const N = 80
    const n = 20
    const sigma = 10
    const withFpc = theoreticalSE({ sigma, n, N, replacement: false, kind: 'mean' })
    const without = theoreticalSE({ sigma, n, N, replacement: true, kind: 'mean' })
    expect(fpcIsMaterial(n, N)).toBe(true)
    expect(finitePopulationCorrection(n, N)).toBeCloseTo(Math.sqrt((N - n) / (N - 1)), 12)
    expect(withFpc).toBeCloseTo((sigma / Math.sqrt(n)) * finitePopulationCorrection(n, N), 12)
    expect(withFpc).toBeLessThan(without)

    const rng = createRng(19)
    const population = createPopulation({ kind: 'normal', mu: 0, sigma, size: N }, rng)
    const result = simulateSampling({
      population,
      n,
      R: 2500,
      statistic: 'mean',
      seed: 23,
      replacement: false,
    })
    expect(result.usedFpc).toBe(true)
    expect(result.theoreticalSE).toBeCloseTo(
      theoreticalSE({ sigma: population.sd, n, N: population.size, replacement: false, kind: 'mean' }),
      10,
    )
    expect(result.theoreticalSE).toBeLessThan(theoreticalSE({ sigma: population.sd, n, kind: 'mean' }))
    expect(result.lastSample).toHaveLength(n)
    expect(new Set(result.lastSample).size).toBe(n)
  })

  it('uses p̂ = X/n and SE = √[p(1-p)/n] for a binary population', () => {
    const population = createPopulation({ kind: 'bernoulli', p: 0.4, size: 1000 }, createRng(5))
    expect(population.mean).toBeCloseTo(0.4, 10)
    expect(population.sd).toBeCloseTo(Math.sqrt(0.4 * 0.6), 10)
    const sample = [1, 0, 1, 1, 0]
    expect(sampleStatistic(sample, 'proportion')).toBeCloseTo(0.6, 12)
    const se = theoreticalSE({ n: 100, kind: 'proportion', p: 0.4 })
    expect(se).toBeCloseTo(Math.sqrt((0.4 * 0.6) / 100), 12)
    expect(normalApproxOk(100, 0.4)).toBe(true)
    expect(normalApproxOk(20, 0.08)).toBe(false)
  })

  it('does not treat doubling n as halving SE', () => {
    const curve = seVsN(10, [5, 20, 50, 200])
    expect(curve[0]?.se).toBeCloseTo(10 / Math.sqrt(5), 10)
    expect(curve[3]?.se).toBeCloseTo(10 / Math.sqrt(200), 10)
    const n10 = 12 / Math.sqrt(10)
    const n20 = 12 / Math.sqrt(20)
    const n40 = 12 / Math.sqrt(40)
    expect(n20 / n10).toBeCloseTo(1 / Math.sqrt(2), 10)
    expect(n20 / n10).not.toBeCloseTo(0.5, 2)
    expect(n40 / n10).toBeCloseTo(0.5, 10)
  })

  it('keeps LLN running means distinct from a sampling-distribution histogram', () => {
    const rng = createRng(31)
    const draws = Array.from({ length: 400 }, () => (rng() < 0.5 ? 1 : 0))
    const path = runningMeans(draws)
    expect(path).toHaveLength(400)
    expect(path[0]).toBe(draws[0])
    expect(path[path.length - 1]).toBeCloseTo(meanOf(draws), 12)
    expect(Math.abs((path[path.length - 1] ?? 1) - 0.5)).toBeLessThan(0.12)
    const compact = downsamplePath(path, 40)
    expect(compact.length).toBeLessThanOrEqual(40)
  })

  it('resamples with replacement so bootstrap draws can repeat values', () => {
    const sample = [2, 4, 6, 8, 10]
    const rng = createRng(99)
    const seenRepeat = Array.from({ length: 40 }, () => bootstrapResample(sample, rng)).some(
      (draw) => new Set(draw).size < draw.length,
    )
    expect(seenRepeat).toBe(true)
    const engine = new SamplingDistributionEngine({ seed: 4 })
    const boot = engine.bootstrap(sample, 800, 'mean', 4)
    expect(boot.R).toBe(800)
    expect(boot.empiricalMean).toBeCloseTo(meanOf(sample), 0)
    const [lo, hi] = percentileInterval(boot.statistics, 0.95)
    expect(lo).toBeLessThan(meanOf(sample))
    expect(hi).toBeGreaterThan(meanOf(sample))
  })

  it('computes median statistics and histogram bins without exploding memory for large R', () => {
    const population = createPopulation({ kind: 'uniform', min: 0, max: 10 }, createRng(2))
    const result = simulateSampling({
      population,
      n: 9,
      R: 10000,
      statistic: 'median',
      seed: 8,
      keepStatistics: false,
    })
    expect(result.statistics.length).toBeLessThanOrEqual(400)
    expect(result.histogram).toHaveLength(28)
    expect(result.histogram.reduce((sum, bin) => sum + bin.count, 0)).toBe(10000)
    expect(medianOf([1, 3, 8])).toBe(3)
    expect(buildHistogram([1, 1, 2], 2, [1, 3])[0]?.count).toBeGreaterThan(0)
  })
})
