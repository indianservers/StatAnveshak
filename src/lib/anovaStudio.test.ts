import { describe, expect, it } from 'vitest'
import {
  ANOVA_NEXT_STUDIO_SLUG,
  ANOVA_STUDIO,
  ANOVA_STUDIO_SLUG,
  WORKED_ONE_WAY,
  generateOneWay,
  generateRepeated,
  generateTwoWay,
  mean,
  oneWayAnova,
  postHocComparisons,
  repeatedMeasuresAnova,
  subjectCentered,
  twoWayAnova,
  varianceTest,
} from './anovaStudio'

describe('ANOVA studio catalog', () => {
  it('uses the canonical studio slug and six labs', () => {
    expect(ANOVA_STUDIO_SLUG).toBe('anova')
    expect(ANOVA_STUDIO.slug).toBe('anova')
    expect(ANOVA_STUDIO.labs.map((lab) => lab.slug)).toEqual([
      'one-way-anova',
      'anova-table',
      'post-hoc-comparisons',
      'two-way-anova',
      'repeated-measures-anova',
      'anova-assumptions',
    ])
    expect(ANOVA_NEXT_STUDIO_SLUG).toBe('time-series-basics')
  })
})

describe('one-way ANOVA', () => {
  it('splits SST = SSB + SSW and uses the textbook F ratio', () => {
    const result = oneWayAnova(WORKED_ONE_WAY)
    expect(result.sst).toBeCloseTo(result.ssb + result.ssw, 10)
    expect(result.dfB).toBe(2)
    expect(result.dfW).toBe(27)
    expect(result.dfT).toBe(29)
    expect(result.msb).toBeCloseTo(result.ssb / result.dfB, 12)
    expect(result.msw).toBeCloseTo(result.ssw / result.dfW, 12)
    expect(result.f).toBeCloseTo(result.msb / result.msw, 12)
    expect(result.eta2).toBeCloseTo(result.ssb / result.sst, 12)
    expect(result.p).toBeGreaterThan(0)
    expect(result.p).toBeLessThan(0.05)
  })

  it('builds SSB from n_j (ȳ_j − ȳ)² and SSW from within-group squares', () => {
    const result = oneWayAnova(WORKED_ONE_WAY)
    const grand = mean(WORKED_ONE_WAY.map((row) => row.y))
    let ssb = 0
    let ssw = 0
    for (const group of result.groups) {
      ssb += group.n * (group.mean - grand) ** 2
      ssw += group.values.reduce((sum, value) => sum + (value - group.mean) ** 2, 0)
    }
    expect(result.ssb).toBeCloseTo(ssb, 12)
    expect(result.ssw).toBeCloseTo(ssw, 12)
  })

  it('does not call equal means identical when F is non-significant', () => {
    const rows = generateOneWay({ preset: 'equal-means', k: 3, n: 16, seed: 3, withinSd: 8 })
    const result = oneWayAnova(rows)
    expect(result.significant).toBe(false)
    expect(result.p).toBeGreaterThan(0.05)
  })
})

describe('post-hoc comparisons', () => {
  it('labels Tukey HSD on equal n and Tukey–Kramer on unequal n', () => {
    const equal = postHocComparisons(oneWayAnova(WORKED_ONE_WAY), 'tukey')
    expect(equal.method === 'tukey-hsd' || equal.method === 'tukey-kramer').toBe(true)
    expect(equal.methodTitle.toLowerCase()).not.toContain('bonferroni')
    const unequal = postHocComparisons(oneWayAnova(generateOneWay({ preset: 'unequal-n', seed: 8 })), 'tukey')
    expect(unequal.method).toBe('tukey-kramer')
    expect(unequal.methodTitle).toBe('Tukey–Kramer')
  })

  it('never labels Holm as Tukey and keeps family-wise p in [0, 1]', () => {
    const holm = postHocComparisons(oneWayAnova(WORKED_ONE_WAY), 'holm')
    expect(holm.method).toBe('holm')
    expect(holm.methodTitle).toMatch(/Holm/)
    expect(holm.methodTitle.toLowerCase()).not.toContain('tukey')
    for (const pair of holm.pairs) {
      expect(pair.pAdj).toBeGreaterThanOrEqual(pair.pRaw - 1e-12)
      expect(pair.pAdj).toBeLessThanOrEqual(1)
    }
  })
})

describe('two-way ANOVA', () => {
  it('uses balanced SS and labels Type I/II/III as coincident', () => {
    const rows = generateTwoWay({ preset: 'interaction', seed: 5, nPerCell: 4 })
    const result = twoWayAnova(rows)
    expect(result.balanced).toBe(true)
    expect(result.ssType).toBe('balanced')
    expect(result.ssNote.toLowerCase()).toContain('coincide')
    const ssTerms = result.terms.reduce((sum, term) => sum + term.ss, 0) + result.error.ss
    expect(ssTerms).toBeCloseTo(result.sst, 6)
    expect(result.terms[2]?.partialEta2).toBeCloseTo(
      (result.terms[2]?.ss ?? 0) / ((result.terms[2]?.ss ?? 0) + result.error.ss),
      12,
    )
  })

  it('states Type I SS when cells are unbalanced', () => {
    const rows = generateTwoWay({ preset: 'no-interaction', seed: 9, nPerCell: 5, unbalanced: true })
    const result = twoWayAnova(rows)
    expect(result.balanced).toBe(false)
    expect(result.ssType).toBe('I')
    expect(result.ssNote.toLowerCase()).toContain('type i')
  })
})

describe('repeated measures ANOVA', () => {
  it('uses the subject error term instead of an independent one-way', () => {
    const rows = generateRepeated({ preset: 'rm-improvement', seed: 4, subjects: 10, conditions: 4 })
    const rm = repeatedMeasuresAnova(rows)
    const naive = oneWayAnova(rows)
    expect(rm.completeCases).toBe(true)
    expect(rm.dfCond).toBe(3)
    expect(rm.dfErr).toBe(27)
    expect(rm.ssCond + rm.ssSubj + rm.ssErr).toBeCloseTo(rm.sst, 8)
    expect(rm.f).not.toBeCloseTo(naive.f, 2)
    expect(rm.ssErr).toBeLessThan(naive.ssw)
  })

  it('treats two conditions as automatically spherical', () => {
    const rows = generateRepeated({ preset: 'rm-crossover', seed: 2, subjects: 8, conditions: 2 })
    const rm = repeatedMeasuresAnova(rows)
    expect(rm.sphericity.automatic).toBe(true)
    expect(rm.sphericity.note.toLowerCase()).toContain('automatic')
  })

  it('drops incomplete subjects and says so', () => {
    const rows = generateRepeated({ preset: 'rm-improvement', seed: 6, subjects: 6, conditions: 3 })
    rows.pop()
    const rm = repeatedMeasuresAnova(rows)
    expect(rm.dropped).toBe(1)
    expect(rm.completeCases).toBe(false)
    expect(rm.nSubjects).toBe(5)
  })

  it('removes subject baselines when scores are centered', () => {
    const rows = generateRepeated({ preset: 'rm-baseline', seed: 1, subjects: 8, conditions: 3 })
    const centered = subjectCentered(rows)
    const bySubject = new Map<string, number[]>()
    for (const row of centered) {
      const list = bySubject.get(row.subject ?? '') ?? []
      list.push(row.y)
      bySubject.set(row.subject ?? '', list)
    }
    for (const values of bySubject.values()) {
      expect(Math.abs(mean(values))).toBeLessThan(1e-10)
    }
  })
})

describe('variance tests', () => {
  it('implements Brown–Forsythe as ANOVA on |y − median_j|', () => {
    const rows = generateOneWay({ preset: 'unequal-var', seed: 12, n: 18 })
    const test = varianceTest(rows, 'brown-forsythe')
    expect(test.method).toBe('brown-forsythe')
    expect(test.title.toLowerCase()).toContain('median')
    expect(test.p).toBeGreaterThan(0)
    expect(test.p).toBeLessThan(1)
  })
})
