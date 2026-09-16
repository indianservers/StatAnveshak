import { describe, expect, it } from 'vitest'
import {
  GLOSSARY_TERMS,
  glossarySlug,
  searchGlossary,
} from './glossary'

describe('statistics glossary', () => {
  it('has at least 200 unique terms with definitions and examples', () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(200)
    const slugs = GLOSSARY_TERMS.map((item) => item.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const item of GLOSSARY_TERMS) {
      expect(item.term.length).toBeGreaterThan(1)
      expect(item.definition.length).toBeGreaterThan(20)
      expect(item.example.length).toBeGreaterThan(8)
      expect(item.slug).toBe(glossarySlug(item.term))
    }
  })

  it('filters by search text and category', () => {
    const means = searchGlossary('sample mean')
    expect(means.some((item) => item.term === 'Estimator' || item.term === 'Standard Error of the Mean')).toBe(true)
    const onlyBayes = searchGlossary('', 'Bayesian')
    expect(onlyBayes.length).toBeGreaterThan(5)
    expect(onlyBayes.every((item) => item.category === 'Bayesian')).toBe(true)
  })
})
