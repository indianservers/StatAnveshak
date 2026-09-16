import { describe, expect, it } from 'vitest'
import { DISTRIBUTIONS } from './distributions'
import { DISTRIBUTION_LESSONS, getDistributionLesson } from './distributionLessons'

describe('distribution lessons', () => {
  it('covers every catalog distribution exactly once', () => {
    const lessonIds = Object.keys(DISTRIBUTION_LESSONS)
    const catalogIds = DISTRIBUTIONS.map((d) => d.id)
    expect(lessonIds.sort()).toEqual([...catalogIds].sort())
  })

  it('has a 3-4 sentence Learn explanation for every catalog distribution', () => {
    for (const dist of DISTRIBUTIONS) {
      const lesson = getDistributionLesson(dist.id)
      const sentences = (lesson.learn ?? '').split(/(?<=\.)\s+/).filter((part) => part.trim().length > 20)
      expect(lesson.learn, dist.id).toBeTruthy()
      expect(sentences.length, dist.id).toBeGreaterThanOrEqual(3)
      expect(sentences.length, dist.id).toBeLessThanOrEqual(5)
    }
  })

  it('has mockup sections for the core discrete and continuous pages', () => {
    for (const id of ['bernoulli', 'binomial', 'geometric', 'poisson', 'hypergeometric', 'continuous_uniform', 'normal', 'exponential', 'student_t', 'beta'] as const) {
      const lesson = getDistributionLesson(id)
      expect(lesson.steps).toHaveLength(4)
      expect(lesson.examples.length).toBeGreaterThanOrEqual(4)
      expect(lesson.practice.options).toHaveLength(4)
      expect(lesson.related).toHaveLength(3)
      expect(lesson.formulaLatex.length).toBeGreaterThan(5)
    }
  })
})
