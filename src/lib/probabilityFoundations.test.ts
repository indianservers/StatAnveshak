import { describe, expect, it } from 'vitest'
import {
  bayesPositivePredictive,
  combination,
  factorial,
  independenceGap,
  isApproximatelyIndependent,
  permutation,
  probabilityOf,
  renormalizePartition,
  totalProbability,
} from './probabilityFoundations'

describe('probability foundations math', () => {
  it('computes factorial, permutations, and combinations', () => {
    expect(factorial(0)).toBe(1)
    expect(factorial(5)).toBe(120)
    expect(permutation(7, 3)).toBe(210)
    expect(permutation(6, 4)).toBe(360)
    expect(combination(10, 3)).toBe(120)
    expect(combination(5, 0)).toBe(1)
    expect(permutation(3, 4)).toBe(0)
  })

  it('recovers the medical-test posterior from the mockup defaults', () => {
    expect(bayesPositivePredictive(0.01, 0.95, 0.05)).toBeCloseTo(0.161, 3)
  })

  it('adds hospital path contributions for the law of total probability', () => {
    expect(
      totalProbability([
        { weight: 0.5, conditional: 0.1 },
        { weight: 0.3, conditional: 0.2 },
        { weight: 0.2, conditional: 0.4 },
      ]),
    ).toBeCloseTo(0.19, 8)
  })

  it('keeps a partition summing to 1 when a weight changes', () => {
    const next = renormalizePartition([0.5, 0.3, 0.2], 0, 0.6)
    expect(next.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8)
    expect(next[0]).toBeCloseTo(0.6, 8)
  })

  it('classifies independent die faces and classical event probability', () => {
    expect(probabilityOf([1, 2, 3, 4, 5, 6], [2, 4, 6])).toBeCloseTo(0.5, 8)
    expect(independenceGap(1 / 6, 1 / 6, 1 / 36)).toBeCloseTo(0, 8)
    expect(isApproximatelyIndependent(1 / 6, 1 / 6, 1 / 36)).toBe(true)
    expect(isApproximatelyIndependent(0.5, 0.5, 0)).toBe(false)
  })
})
