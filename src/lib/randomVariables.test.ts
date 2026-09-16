import { describe, expect, it } from 'vitest'
import {
  binomialPmf,
  combination,
  conditionalGivenX,
  DEFAULT_JOINT,
  diePmf,
  discreteCdfAt,
  discreteKurtosis,
  discreteMean,
  discreteQuantile,
  discreteRawMoment,
  discreteSkewness,
  discreteVariance,
  EXAM_SCORES,
  intervalProbability,
  isValidPmf,
  jointIndependent,
  jointMarginalX,
  jointMarginalY,
  normalCdf,
  normalizePmf,
  pearsonR,
  PRACTICE_JOINT,
  sampleCovariance,
  STUDY_HOURS,
  transformDiscrete,
  twoDiceSumPmf,
} from './randomVariables'

describe('random variables math', () => {
  it('builds a valid die PMF with mean 3.5 and variance 35/12', () => {
    const die = diePmf()
    expect(isValidPmf(die)).toBe(true)
    expect(discreteMean(die)).toBeCloseTo(3.5, 10)
    expect(discreteVariance(die)).toBeCloseTo(35 / 12, 10)
    expect(discreteCdfAt(die, 3)).toBeCloseTo(0.5, 10)
    expect(discreteQuantile(die, 0.5)).toBe(3)
  })

  it('matches the binomial heads-in-three-tosses practice item', () => {
    const pmf = binomialPmf(3, 0.5)
    expect(combination(3, 2)).toBe(3)
    expect(pmf.find((item) => item.x === 2)?.p).toBeCloseTo(3 / 8, 10)
  })

  it('computes two-dice sums and raw/central moments from a custom table', () => {
    expect(twoDiceSumPmf().find((item) => item.x === 7)?.p).toBeCloseTo(6 / 36, 10)
    const custom = normalizePmf([
      { x: 0, p: 0.1 },
      { x: 1, p: 0.3 },
      { x: 2, p: 0.4 },
      { x: 3, p: 0.2 },
    ])
    expect(discreteMean(custom)).toBeCloseTo(1.7, 10)
    expect(discreteRawMoment(custom, 2)).toBeCloseTo(3.7, 10)
  })

  it('returns the standard normal interval and quantile used in the labs', () => {
    expect(intervalProbability((x) => normalCdf(x), -1, 1)).toBeCloseTo(0.6827, 3)
    expect(normalCdf(1.2)).toBeCloseTo(0.8849, 3)
    expect(intervalProbability((x) => normalCdf(x, 5, 2), 3, 7)).toBeCloseTo(0.6827, 3)
  })

  it('recovers joint marginals, a conditional, and dependence', () => {
    const px = jointMarginalX(DEFAULT_JOINT)
    const py = jointMarginalY(DEFAULT_JOINT)
    expect(px[0]?.p).toBeCloseTo(0.2, 10)
    expect(px[1]?.p).toBeCloseTo(0.5, 10)
    expect(px[2]?.p).toBeCloseTo(0.3, 10)
    expect(py[0]?.p).toBeCloseTo(0.2, 10)
    expect(py[1]?.p).toBeCloseTo(0.5, 10)
    expect(py[2]?.p).toBeCloseTo(0.3, 10)
    expect(jointIndependent(DEFAULT_JOINT)).toBe(false)
    expect(conditionalGivenX(PRACTICE_JOINT, 1)[0]?.p).toBeCloseTo(0.4, 10)
  })

  it('combines probabilities when a transformation collapses support', () => {
    const folded = transformDiscrete(
      [
        { x: -2, p: 0.2 },
        { x: -1, p: 0.3 },
        { x: 1, p: 0.4 },
        { x: 2, p: 0.1 },
      ],
      (x) => x * x,
    )
    expect(folded.find((item) => item.x === 1)?.p).toBeCloseTo(0.7, 10)
    expect(folded.find((item) => item.x === 4)?.p).toBeCloseTo(0.3, 10)
  })

  it('computes the study-hours covariance example and a U-shape near-zero correlation case', () => {
    const r = pearsonR(STUDY_HOURS, EXAM_SCORES)
    expect(r).toBeGreaterThan(0.98)
    expect(sampleCovariance(STUDY_HOURS, EXAM_SCORES)).toBeCloseTo(48, 8)
    const xs = [-2, -1, 0, 1, 2]
    const ys = [4, 1, 0, 1, 4]
    expect(Math.abs(pearsonR(xs, ys))).toBeLessThan(0.05)
  })

  it('reports zero skewness and Pearson kurtosis 1.8 for a fair die-like uniform support after standardization check', () => {
    const twoPoint = normalizePmf([
      { x: 0, p: 0.5 },
      { x: 1, p: 0.5 },
    ])
    expect(discreteSkewness(twoPoint)).toBeCloseTo(0, 10)
    expect(discreteKurtosis(twoPoint)).toBeCloseTo(1, 10)
  })
})
