import { describe, expect, it } from 'vitest'
import { DISTRIBUTIONS } from './distributions'
import {
  DISTRIBUTION_EXPERIENCES,
  EMPIRICAL_PRESETS,
  getDistributionExperience,
} from './distributionExperiences'

const HOSTED_KINDS = [
  'token-trial', 'discrete-pmf', 'waiting-sequence', 'without-replacement',
  'poisson-timeline', 'zero-inflation', 'interval-area', 'bell-rule', 'z-score',
  'log-transform', 'memoryless', 'sum-of-waits', 'bayesian-beta',
  'chi-square-squares', 'tail-compare', 'variance-ratio', 'weibull-lifetime',
  'pareto-share', 'cauchy-mean', 'logistic-threshold', 'skew-slider',
  'laplace-loss', 'extreme-value', 'first-passage', 'stretched-beta',
  'mixture', 'multinomial', 'dirichlet-simplex', 'empirical-fit',
] as const

const REQUIRED_IDS = [
  'bernoulli', 'binomial', 'geometric', 'negative_binomial', 'hypergeometric',
  'poisson', 'discrete_uniform', 'zip', 'zinb',
  'continuous_uniform', 'normal', 'standard_normal', 'lognormal', 'exponential',
  'gamma', 'beta', 'chi_square', 'student_t', 'f', 'weibull', 'pareto', 'cauchy',
  'logistic', 'skew_normal', 'laplace', 'gumbel', 'inverse_gaussian',
  'stretched_beta', 'mixture_normal',
  'multinomial', 'dirichlet',
  'empirical',
] as const

describe('distribution experiences', () => {
  it('defines a unique lab for every catalog id', () => {
    const catalog = DISTRIBUTIONS.map((d) => d.id).sort()
    const configured = Object.keys(DISTRIBUTION_EXPERIENCES).sort()
    expect(configured).toEqual(catalog)
    expect(catalog).toEqual([...REQUIRED_IDS].sort())
  })

  it('maps every experiment kind to a hosted lab', () => {
    const used = new Set(Object.values(DISTRIBUTION_EXPERIENCES).map((row) => row.experiment))
    expect([...used].sort()).toEqual([...HOSTED_KINDS].sort())
    for (const id of REQUIRED_IDS) {
      expect(HOSTED_KINDS.includes(getDistributionExperience(id).experiment), id).toBe(true)
    }
  })

  it('keeps unique scenarios so labs do not feel cloned', () => {
    const titles = Object.values(DISTRIBUTION_EXPERIENCES).map((row) => row.scenarioTitle)
    expect(new Set(titles).size).toBe(titles.length)
    const goals = Object.values(DISTRIBUTION_EXPERIENCES).map((row) => row.learningGoal)
    expect(new Set(goals).size).toBe(goals.length)
  })

  it('points comparison cards at real catalog ids', () => {
    const catalog = new Set(DISTRIBUTIONS.map((d) => d.id))
    for (const row of Object.values(DISTRIBUTION_EXPERIENCES)) {
      expect(row.comparisonIds.length, row.id).toBeGreaterThan(0)
      for (const id of row.comparisonIds) {
        expect(catalog.has(id), `${row.id} -> ${id}`).toBe(true)
        expect(id, row.id).not.toBe(row.id)
      }
    }
  })

  it('loads the experiment host so every kind has a real component', async () => {
    const { EXPERIMENT_KINDS, ExperimentHost } = await import('../components/distributions/labs/ExperimentHost')
    expect(ExperimentHost).toBeTypeOf('function')
    expect([...EXPERIMENT_KINDS].sort()).toEqual([...HOSTED_KINDS].sort())
  })

  it('loads the experiment host so every kind has a real component', async () => {
    const { EXPERIMENT_KINDS, ExperimentHost } = await import('../components/distributions/labs/ExperimentHost')
    expect(ExperimentHost).toBeTypeOf('function')
    expect([...EXPERIMENT_KINDS].sort()).toEqual([...HOSTED_KINDS].sort())
  })

  it('does not silently reuse one generic experiment for every family', () => {
    expect(new Set(Object.values(DISTRIBUTION_EXPERIENCES).map((row) => row.experiment)).size).toBeGreaterThanOrEqual(20)
    expect(DISTRIBUTION_EXPERIENCES.bernoulli.experiment).toBe('token-trial')
    expect(DISTRIBUTION_EXPERIENCES.standard_normal.experiment).toBe('z-score')
    expect(DISTRIBUTION_EXPERIENCES.dirichlet.experiment).toBe('dirichlet-simplex')
    expect(DISTRIBUTION_EXPERIENCES.empirical.experiment).toBe('empirical-fit')
    expect(DISTRIBUTION_EXPERIENCES.cauchy.experiment).toBe('cauchy-mean')
    expect(Object.keys(EMPIRICAL_PRESETS)).toEqual(expect.arrayContaining(['exams', 'salaries', 'rainfall', 'claims']))
  })
})
