import { describe, expect, it } from 'vitest'
import { DISTRIBUTION_BY_ID, DISTRIBUTIONS } from './distributions'
import { DISTRIBUTION_PRACTICE, getDistributionPractice } from './distributionPractice'

const near = (answer: string, value: number) => {
  const parsed = Number(answer)
  expect(Number.isFinite(parsed), `answer ${answer} should be numeric`).toBe(true)
  expect(parsed).toBeCloseTo(value, 3)
}

describe('distribution practice problems', () => {
  it('covers every catalog distribution with at least four problems', () => {
    const practiceIds = Object.keys(DISTRIBUTION_PRACTICE)
    const catalogIds = DISTRIBUTIONS.map((d) => d.id)
    expect(practiceIds.sort()).toEqual([...catalogIds].sort())
    for (const dist of DISTRIBUTIONS) {
      const problems = getDistributionPractice(dist.id)
      expect(problems.length, dist.id).toBeGreaterThanOrEqual(4)
      expect(problems.length, dist.id).toBeLessThanOrEqual(6)
    }
  })

  it('gives every problem a prompt, answer, and at least three steps', () => {
    for (const dist of DISTRIBUTIONS) {
      for (const problem of getDistributionPractice(dist.id)) {
        expect(problem.id, dist.id).toBeTruthy()
        expect(problem.prompt.length, problem.id).toBeGreaterThan(20)
        expect(problem.answer.length, problem.id).toBeGreaterThan(0)
        expect(problem.steps.length, problem.id).toBeGreaterThanOrEqual(3)
        expect(problem.steps.every((step) => step.trim().length > 8), problem.id).toBe(true)
      }
    }
  })

  it('matches Poisson, Binomial, and Normal catalog pdf/cdf values', () => {
    const poisson = DISTRIBUTION_BY_ID.poisson
    const binomial = DISTRIBUTION_BY_ID.binomial
    const normal = DISTRIBUTION_BY_ID.normal
    const problems = {
      poisson: Object.fromEntries(getDistributionPractice('poisson').map((row) => [row.id, row])),
      binomial: Object.fromEntries(getDistributionPractice('binomial').map((row) => [row.id, row])),
      normal: Object.fromEntries(getDistributionPractice('normal').map((row) => [row.id, row])),
    }

    near(problems.poisson['poisson-01']!.answer, poisson.pdf(2, { lambda: 3.2 }))
    near(problems.poisson['poisson-02']!.answer, poisson.cdf(1, { lambda: 3.2 }))
    near(problems.poisson['poisson-03']!.answer, 1 - poisson.cdf(4, { lambda: 3.2 }))
    near(problems.poisson['poisson-05']!.answer, poisson.pdf(0, { lambda: 1.6 }))

    near(problems.binomial['binomial-01']!.answer, binomial.pdf(3, { n: 12, p: 0.25 }))
    near(problems.binomial['binomial-02']!.answer, binomial.cdf(2, { n: 12, p: 0.25 }))
    near(problems.binomial['binomial-03']!.answer, 1 - binomial.cdf(3, { n: 12, p: 0.25 }))
    near(problems.binomial['binomial-05']!.answer, binomial.pdf(4, { n: 8, p: 0.5 }))

    near(problems.normal['normal-01']!.answer, normal.cdf(80, { mu: 72, sigma: 8 }))
    near(problems.normal['normal-02']!.answer, 1 - normal.cdf(60, { mu: 72, sigma: 8 }))
    near(problems.normal['normal-03']!.answer, normal.cdf(80, { mu: 72, sigma: 8 }) - normal.cdf(64, { mu: 72, sigma: 8 }))
    near(problems.normal['normal-05']!.answer, normal.cdf(70, { mu: 68, sigma: 5 }))

    const geometric = DISTRIBUTION_BY_ID.geometric
    const zip = DISTRIBUTION_BY_ID.zip
    const geo = Object.fromEntries(getDistributionPractice('geometric').map((row) => [row.id, row]))
    const zipProblems = Object.fromEntries(getDistributionPractice('zip').map((row) => [row.id, row]))
    near(geo['geometric-01']!.answer, geometric.pdf(4, { p: 0.2 }))
    near(geo['geometric-02']!.answer, geometric.cdf(3, { p: 0.2 }))
    near(zipProblems['zip-01']!.answer, zip.pdf(0, { lambda: 2.5, pi: 0.3 }))
    near(zipProblems['zip-02']!.answer, zip.pdf(2, { lambda: 2.5, pi: 0.3 }))
  })
})
