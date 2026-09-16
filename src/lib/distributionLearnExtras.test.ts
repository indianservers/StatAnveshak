import { describe, expect, it } from 'vitest'
import { DISTRIBUTIONS } from './distributions'
import { DISTRIBUTION_LEARN_EXTRAS, getDistributionLearnExtras } from './distributionLearnExtras'

describe('distribution learn extras', () => {
  it('covers every catalog distribution exactly once', () => {
    const extraIds = Object.keys(DISTRIBUTION_LEARN_EXTRAS)
    const catalogIds = DISTRIBUTIONS.map((d) => d.id)
    expect(extraIds.sort()).toEqual([...catalogIds].sort())
  })

  it('gives every id at least 3 misconceptions, 4 FAQs, 2 assumptions, and 2 misuse notes', () => {
    for (const dist of DISTRIBUTIONS) {
      const extras = getDistributionLearnExtras(dist.id)
      expect(extras.misconceptions.length, `${dist.id} misconceptions`).toBeGreaterThanOrEqual(3)
      expect(extras.faqs.length, `${dist.id} faqs`).toBeGreaterThanOrEqual(4)
      expect(extras.assumptions.length, `${dist.id} assumptions`).toBeGreaterThanOrEqual(2)
      expect(extras.misuse.length, `${dist.id} misuse`).toBeGreaterThanOrEqual(2)
      for (const row of extras.misconceptions) {
        expect(row.myth.trim().length, `${dist.id} myth`).toBeGreaterThan(12)
        expect(row.truth.trim().length, `${dist.id} truth`).toBeGreaterThan(20)
      }
      for (const row of extras.faqs) {
        expect(row.q.trim().length, `${dist.id} faq q`).toBeGreaterThan(8)
        expect(row.a.trim().length, `${dist.id} faq a`).toBeGreaterThan(20)
      }
    }
  })

  it('uses a unique first misconception and first FAQ per distribution', () => {
    const firstMyths = DISTRIBUTIONS.map((d) => getDistributionLearnExtras(d.id).misconceptions[0]?.myth ?? '')
    const firstFaqs = DISTRIBUTIONS.map((d) => getDistributionLearnExtras(d.id).faqs[0]?.q ?? '')
    expect(new Set(firstMyths).size).toBe(DISTRIBUTIONS.length)
    expect(new Set(firstFaqs).size).toBe(DISTRIBUTIONS.length)
  })

  it('matches catalog conventions for geometric, NB, ZIP, ZINB, Cauchy, mixture, and multinomial', () => {
    const geometric = getDistributionLearnExtras('geometric')
    expect(geometric.misconceptions.some((row) => /0/.test(row.myth) && /1/.test(row.truth))).toBe(true)
    expect(geometric.faqs[0]?.a).toMatch(/At 1|starts at 1|trial number/i)

    const nb = getDistributionLearnExtras('negative_binomial')
    expect(nb.faqs.some((row) => /failure/i.test(row.a))).toBe(true)
    expect(nb.assumptions.some((row) => /failures/i.test(row))).toBe(true)

    const zip = getDistributionLearnExtras('zip')
    expect(zip.faqs.some((row) => /λ/.test(row.a) && /π/.test(row.a))).toBe(true)
    expect(zip.misconceptions.some((row) => /structural/i.test(row.truth) || /structural/i.test(row.myth))).toBe(true)

    const zinb = getDistributionLearnExtras('zinb')
    expect(zinb.faqs.some((row) => /r/.test(row.a) && /π/.test(row.a))).toBe(true)

    const cauchy = getDistributionLearnExtras('cauchy')
    expect(cauchy.misconceptions[0]?.myth).toMatch(/sample mean/i)
    expect(cauchy.misuse.some((row) => /undefined|mean/i.test(row))).toBe(true)

    const mixture = getDistributionLearnExtras('mixture_normal')
    expect(mixture.misconceptions.some((row) => /\bs\b/.test(row.truth))).toBe(true)

    const multi = getDistributionLearnExtras('multinomial')
    expect(multi.faqs.some((row) => /p3/.test(row.q) || /1 − p1 − p2/.test(row.a))).toBe(true)
  })
})
