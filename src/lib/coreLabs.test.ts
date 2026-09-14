import { describe, expect, test } from 'vitest'
import { CORE_LABS, coreLabChapter, getCoreLab } from './coreLabs'

describe('core labs catalog', () => {
  test('ships the twelve Seeing Theory competitor labs', () => {
    expect(CORE_LABS).toHaveLength(12)
    expect(CORE_LABS.map((lab) => lab.id)).toEqual([
      'bayes',
      'clt',
      'lln',
      'sampling',
      'errors',
      'ci',
      'bootstrap',
      'permutation',
      'anova',
      'mle',
      'bayesian',
      'regression',
    ])
  })

  test('each lab maps onto a Learn chapter with its own title', () => {
    const clt = getCoreLab('clt')
    expect(coreLabChapter(clt).title).toBe('Central limit theorem')
    expect(coreLabChapter(clt).id).toBe('distributions')
  })
})
