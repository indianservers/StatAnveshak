import { describe, expect, it } from 'vitest'
import {
  coefficientOfVariation,
  covariance,
  describeSeries,
  extractNumericSeries,
  formatStat,
  mean,
  parseNumberList,
  pearsonCorrelation,
  percentile,
  populationVariance,
  ranks,
  requirePositiveInteger,
  sampleVariance,
  significanceStatement,
  simpleLinearRegression,
  spearmanCorrelation,
  theoreticalSamplingMoments,
} from './statEngine'
import { validateDistributionParams } from './distributionValidation'
import { DISTRIBUTION_BY_ID } from './distributions'

describe('statEngine core', () => {
  it('computes mean([1,2,3]) = 2', () => {
    expect(mean([1, 2, 3])).toBe(2)
  })

  it('uses n for population variance and n-1 for sample variance', () => {
    expect(populationVariance([1, 2, 3])).toBeCloseTo(2 / 3, 12)
    expect(sampleVariance([1, 2, 3])).toBe(1)
  })

  it('does not treat missing values as zero', () => {
    const { values, missing } = extractNumericSeries(
      [{ x: 12 }, { x: null }, { x: '' }, { x: undefined }, { x: Number.NaN }, { x: 18 }],
      'x',
    )
    expect(values).toEqual([12, 18])
    expect(missing).toBe(4)
    expect(mean(values)).toBe(15)
  })

  it('parses comma and newline lists and reports invalid tokens', () => {
    const parsed = parseNumberList('12, 14\n15, eighteen, 18, 21')
    expect(parsed.values).toEqual([12, 14, 15, 18, 21])
    expect(parsed.issues).toEqual([{ token: 'eighteen', index: 3 }])
  })

  it('formats floating point for display without rounding intermediates', () => {
    expect(formatStat(0.1 + 0.2)).toBe('0.3')
    expect(formatStat(Number.NaN)).toBe('—')
    expect(formatStat(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('describes a series with sample vs population spread', () => {
    const sample = describeSeries([1, 2, 3], 0, 'sample')
    const population = describeSeries([1, 2, 3], 0, 'population')
    expect(sample.mean).toBe(2)
    expect(sample.variance).toBe(1)
    expect(population.variance).toBeCloseTo(2 / 3, 12)
    expect(sample.sd).not.toBe(population.sd)
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5)
    expect(coefficientOfVariation([10, 10, 10], 'population')).toBe(0)
  })

  it('rejects empty and singleton sample variance with a clear message', () => {
    expect(requirePositiveInteger(0, 'Sample size')).toBe('Sample size must be a positive integer.')
    expect(requirePositiveInteger(-3, 'Sample size')).toBe('Sample size must be a positive integer.')
    expect(requirePositiveInteger(7.2, 'Sample size')).toBe('Sample size must be a positive integer.')
    expect(describeSeries([], 0, 'sample').variance).toBeNaN()
    expect(describeSeries([4], 0, 'sample').variance).toBeNaN()
    expect(describeSeries([4], 0, 'population').variance).toBe(0)
  })
})

describe('correlation, covariance, regression', () => {
  it('returns Pearson r = 1 for a perfect line', () => {
    const result = pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.r).toBeCloseTo(1, 12)
      expect(result.n).toBe(4)
    }
  })

  it('keeps Spearman separate from Pearson', () => {
    const x = [1, 2, 3, 4, 5]
    const y = [1, 4, 9, 16, 25]
    const pearson = pearsonCorrelation(x, y)
    const spearman = spearmanCorrelation(x, y)
    expect(pearson.ok && spearman.ok).toBe(true)
    if (pearson.ok && spearman.ok) {
      expect(spearman.r).toBeCloseTo(1, 12)
      expect(pearson.r).toBeLessThan(1)
      expect(spearman.method).toBe('spearman')
      expect(ranks(y)).toEqual([1, 2, 3, 4, 5])
    }
  })

  it('uses pairwise complete observations for covariance', () => {
    const sample = covariance([1, 2, 3], [2, 4, 6], 'sample')
    const population = covariance([1, 2, 3], [2, 4, 6], 'population')
    expect(sample.ok && population.ok).toBe(true)
    if (sample.ok && population.ok) {
      expect(sample.covariance).toBe(2)
      expect(population.covariance).toBeCloseTo(4 / 3, 12)
    }
  })

  it('fits y = 1 + 2x and reports R² = 1', () => {
    const fit = simpleLinearRegression([1, 2, 3, 4], [3, 5, 7, 9])
    expect(fit.ok).toBe(true)
    if (fit.ok) {
      expect(fit.intercept).toBeCloseTo(1, 12)
      expect(fit.slope).toBeCloseTo(2, 12)
      expect(fit.r2).toBeCloseTo(1, 12)
      expect(fit.sse).toBeCloseTo(0, 12)
    }
  })

  it('handles constant x without returning NaN as a result', () => {
    const fit = simpleLinearRegression([5, 5, 5], [1, 2, 3])
    expect(fit.ok).toBe(false)
    if (!fit.ok) expect(fit.error).toMatch(/constant/i)
  })
})

describe('CLT theoretical moments', () => {
  it('uses SE = σ / √n for arbitrary n', () => {
    const n7 = theoreticalSamplingMoments(10, 16, 7)
    const n43 = theoreticalSamplingMoments(10, 16, 43)
    expect(n7.meanOfMean).toBe(10)
    expect(n7.se).toBeCloseTo(4 / Math.sqrt(7), 12)
    expect(n43.se).toBeCloseTo(4 / Math.sqrt(43), 12)
    expect(n43.varOfMean).toBeCloseTo(16 / 43, 12)
    expect(n43.se).toBeLessThan(n7.se)
  })
})

describe('inference language and distribution validation', () => {
  it('states significance without claiming proof', () => {
    const significant = significanceStatement(0.01, 0.05)
    const notSignificant = significanceStatement(0.2, 0.05)
    expect(significant).toMatch(/statistically significant/)
    expect(significant).not.toMatch(/proved/i)
    expect(notSignificant).toMatch(/not statistically significant/)
  })

  it('blocks invalid distribution parameters', () => {
    const normal = validateDistributionParams(DISTRIBUTION_BY_ID.normal, { mu: 0, sigma: 0 })
    expect(normal.ok).toBe(false)
    expect(normal.errors.sigma).toMatch(/greater than 0/)
    const binomial = validateDistributionParams(DISTRIBUTION_BY_ID.binomial, { n: 2.5, p: 1.4 })
    expect(binomial.ok).toBe(false)
    expect(binomial.errors.n).toMatch(/positive integer/)
    expect(binomial.errors.p).toMatch(/between 0 and 1/)
    const uniform = validateDistributionParams(DISTRIBUTION_BY_ID.continuous_uniform, { a: 4, b: 4 })
    expect(uniform.ok).toBe(false)
    expect(uniform.errors.b).toMatch(/greater than/)
  })
})
