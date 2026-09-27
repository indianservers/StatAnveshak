import { describe, expect, it } from 'vitest'
import { averageRanks, bootstrapDifference, exactPermutation, kruskalWallis, mannWhitney, signTest, signedRankTest } from './nonparametricLabs'

describe('nonparametric lab calculations', () => {
  it('gives tied observations their average occupied rank', () => {
    expect(averageRanks([7, 2, 7, 4]).map((item) => item.rank)).toEqual([3.5, 1, 3.5, 2])
  })

  it('uses the exact two-sided binomial sign test and excludes zero differences', () => {
    expect(signTest([1, 2, 3, 4, 5, 0])).toMatchObject({ n: 5, plus: 5, ties: 1, p: 0.0625 })
    expect(signTest([1, -1, 0]).p).toBe(1)
  })

  it('enumerates exact signed-rank sign patterns', () => {
    const result = signedRankTest([1, 2, 3, 4])
    expect(result.plus).toBe(10)
    expect(result.p).toBe(0.125)
    expect(result.rankBiserial).toBe(1)
  })

  it('enumerates the conditional Mann–Whitney distribution', () => {
    const result = mannWhitney([1, 2, 3], [4, 5, 6])
    expect(result.u).toBe(0)
    expect(result.permutations).toBe(20)
    expect(result.p).toBe(0.1)
    expect(result.cliff).toBe(-1)
  })

  it('applies the Kruskal–Wallis tie correction', () => {
    const separated = kruskalWallis([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(separated.h).toBeCloseTo(7.2)
    expect(separated.p).toBeLessThan(0.05)
    const tied = kruskalWallis([[1, 1, 2], [2, 3, 3], [3, 4, 4]])
    expect(tied.correction).toBeLessThan(1)
    expect(tied.p).toBeGreaterThanOrEqual(0)
  })

  it('enumerates every permutation and keeps bootstrap runs reproducible', () => {
    const exact = exactPermutation([1, 2], [3, 4])
    expect(exact.distribution).toHaveLength(6)
    expect(exact.p).toBeCloseTo(1 / 3)
    const first = bootstrapDifference([1, 2, 3], [4, 5, 6], 200, 17)
    expect(first).toEqual(bootstrapDifference([1, 2, 3], [4, 5, 6], 200, 17))
    expect(first.low).toBeLessThan(first.high)
  })
})
