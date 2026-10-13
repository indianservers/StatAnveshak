import { describe, expect, it } from 'vitest'
import { correctedRepeated, extendedPairs, labCsv, labSession, mapLabData, pairedComparisons, parseLabText, permutationAnova, plannedContrast, residualAudit, transformLabRows, validateLabData, welchAnova } from './anovaLabTools'
import { generateRepeated, generateTwoWay, oneWayAnova, repeatedMeasuresAnova, type AnovaObservation } from './anovaStudio'
const rows: AnovaObservation[] = [1, 2, 3, 5, 7, 9].map((y, i) => ({ id: String(i), a: i < 3 ? 'A' : 'B', y }))
describe('ANOVA lab data and inference', () => {
  it('parses CSV and TSV without coercing missing outcomes into zero', () => {
    const p = parseLabText('group\tvalue\n A \t2\nB\t\nC\ttrue\nD\t4')
    const m = mapLabData(p.data, { a: 'group', y: 'value', b: '', subject: '' }, 'one-way-anova')
    expect(m.rows.map(r => [r.a, r.y])).toEqual([['A', 2], ['D', 4]])
    expect(m.rejected).toEqual([{ row: 3, reason: 'Missing or nonnumeric outcome' }, { row: 4, reason: 'Missing or nonnumeric outcome' }])
    expect(() => parseLabText('')).toThrow()
    expect(() => parseLabText('group,group\nA,1')).toThrow(/unique/)
  })
  it('audits missing factorial and subject identifiers', () => {
    const data = [{ a: 'A', b: '', y: true, subject: '' }, { a: 'A', b: '', y: 4, subject: '' }]
    expect(mapLabData(data, { a: 'a', b: 'b', y: 'y', subject: 'subject' }, 'two-way-anova').rejected[1].reason).toMatch(/factor B/)
    expect(mapLabData(data, { a: 'a', b: 'b', y: 'y', subject: 'subject' }, 'repeated-measures-anova').rejected[1].reason).toMatch(/subject/)
  })
  it('rejects empty factorial cells and duplicate repeated measurements', () => {
    const factorial = generateTwoWay({ preset: 'interaction', seed: 42, nPerCell: 3 })
    expect(validateLabData(factorial, 'two-way-anova')).toBeNull()
    expect(validateLabData(factorial.filter(r => !(r.a === factorial[0].a && r.b === factorial[0].b)), 'two-way-anova')).toMatch(/empty cells/)
    const rm = generateRepeated({ preset: 'rm-improvement', seed: 42, subjects: 6, conditions: 3 })
    expect(validateLabData([...rm, { ...rm[0], id: 'duplicate' }], 'repeated-measures-anova')).toMatch(/Duplicate subject/)
    expect(validateLabData(rm.slice(0, 3), 'repeated-measures-anova')).toMatch(/4–5,000|three complete/)
  })
  it('transforms copies with domain and zero-scale protection', () => {
    expect(transformLabRows(rows, 'log', 1)[0].y).toBe(0)
    expect(rows[0].y).toBe(1)
    expect(() => transformLabRows([{ ...rows[0], y: 0 }], 'log', 1)).toThrow(/strictly positive/)
    expect(() => transformLabRows(rows, 'scale', 0)).toThrow(/zero multiplier/)
    expect(() => transformLabRows([{ ...rows[0], y: -1 }], 'sqrt', 1)).toThrow(/nonnegative/)
    const original = oneWayAnova(rows), scaled = oneWayAnova(transformLabRows(rows, 'scale', 4)), shifted = oneWayAnova(transformLabRows(rows, 'shift', 100))
    expect(scaled.sst).toBeCloseTo(original.sst * 16)
    expect(scaled.f).toBeCloseTo(original.f)
    expect(shifted.f).toBeCloseTo(original.f)
  })
  it('matches Welch t squared and Satterthwaite df for two groups', () => {
    const w = welchAnova(rows)!
    expect(w.f).toBeCloseTo(15)
    expect(w.df1).toBe(1)
    expect(w.df2).toBeCloseTo(50 / 17)
    expect(w.p).toBeGreaterThan(0)
    expect(w.p).toBeLessThan(.05)
    expect(welchAnova(rows.map(r => ({ ...r, y: r.a === 'A' ? 1 : r.y })))).toBeNull()
  })
  it('calculates prespecified pooled contrasts with validated weights', () => {
    const c = plannedContrast(rows, [1, -1], .05)
    expect(c.estimate).toBe(-5)
    expect(c.se).toBeCloseTo(Math.sqrt(5 / 3))
    expect(c.low).toBeLessThan(c.estimate)
    expect(c.high).toBeGreaterThan(c.estimate)
    expect(() => plannedContrast(rows, [1, 1], .05)).toThrow(/summing to zero/)
    expect(() => plannedContrast(rows, [0, 0], .05)).toThrow()
  })
  it('reproduces seeded omnibus permutations and enforces the work budget', () => {
    expect(permutationAnova(rows, 100, 42)).toEqual(permutationAnova(rows, 100, 42))
    const p = permutationAnova(rows, 100, 42)
    expect(p.p).toBeGreaterThanOrEqual(1 / 101)
    expect(p.p).toBeLessThanOrEqual(1)
    expect(() => permutationAnova(rows, 99, 1)).toThrow(/100–2,000/)
  })
  it('uses Bonferroni intervals and BH p-values with the correct family', () => {
    const three = [...rows, ...[4, 8, 12].map((y, i) => ({ id: `C${i}`, a: 'C', y }))]
    const bonf = extendedPairs(three, 'bonferroni', .05), bh = extendedPairs(three, 'bh', .05)
    expect(bonf).toHaveLength(3)
    expect(bonf[0].pAdj).toBeCloseTo(Math.min(1, 3 * bonf[0].pRaw))
    expect(bonf[0].high - bonf[0].low).toBeGreaterThan(bh[0].high - bh[0].low)
    expect(bh.every(p => p.pAdj >= p.pRaw && p.pAdj <= 1)).toBe(true)
  })
  it('Games–Howell uses pair-specific variance, fractional df, and simultaneous intervals', () => {
    const pair = extendedPairs(rows, 'games-howell', .05)[0]
    expect(pair.diff).toBe(-5)
    expect(pair.se).toBeCloseTo(Math.sqrt(5 / 3))
    expect(pair.df).toBeCloseTo(50 / 17)
    expect(pair.pAdj).toBeCloseTo(welchAnova(rows)!.p, 4)
    expect(pair.low).toBeLessThan(pair.high)
    expect(pair.pAdj < .05).toBe(pair.high < 0)
  })
  it('corrects repeated-measures df while preserving F', () => {
    const rm = repeatedMeasuresAnova(generateRepeated({ preset: 'rm-improvement', seed: 14, conditions: 4, subjects: 12 }))
    const gg = correctedRepeated(rm, 'gg')!, none = correctedRepeated(rm, 'none')!
    expect(gg.f).toBe(rm.f)
    expect(gg.df1).toBeCloseTo(rm.dfCond * rm.sphericity.epsGG!)
    expect(gg.df2).toBeCloseTo(rm.dfErr * rm.sphericity.epsGG!)
    expect(gg.p).toBeGreaterThanOrEqual(none.p - 1e-10)
    expect(correctedRepeated({ ...rm, sphericity: { automatic: false, note: 'Unavailable' } }, 'gg')).toBeNull()
    expect(correctedRepeated({ ...rm, k: 2 }, 'hf')!.epsilon).toBe(1)
  })
  it('paired comparisons use subjects rather than independent samples', () => {
    const long = [10, 20, 30, 40].flatMap((y, i) => [{ id: `b${i}`, subject: String(i), a: 'Before', time: 'Before', y }, { id: `a${i}`, subject: String(i), a: 'After', time: 'After', y: y + i + 1 }])
    const r = repeatedMeasuresAnova(long), p = pairedComparisons(r, .05)[0]
    expect(p.diff).toBe(-2.5)
    expect(p.df).toBe(3)
    expect(p.se).toBeCloseTo(Math.sqrt(5 / 3) / 2)
    expect(p.effect).toBeCloseTo(-2.5 / Math.sqrt(5 / 3))
    expect(p.pAdj).toBe(p.pRaw)
  })
  it('complete-case analysis lists and drops incomplete subjects', () => {
    const long = generateRepeated({ preset: 'rm-improvement', seed: 42, subjects: 6, conditions: 3 })
    const r = repeatedMeasuresAnova(long.slice(1))
    expect(r.dropped).toBe(1)
    expect(r.nSubjects).toBe(5)
    expect(validateLabData(long.slice(1), 'repeated-measures-anova')).toBeNull()
    const empty = mapLabData([{ subject: 's1', condition: 'Before', value: 2 }, { subject: 's1', condition: 'After', value: '' }], { a: 'condition', subject: 'subject', y: 'value', b: '' }, 'repeated-measures-anova')
    expect(empty.emptyConditions).toEqual(['After'])
  })
  it('reviews IQR and studentized residuals without removing observations', () => {
    const audit = residualAudit(rows)
    expect(audit).toHaveLength(rows.length)
    expect(audit[0].residual).toBe(-1)
    expect(audit[0].studentized).toBeCloseTo(-1 / Math.sqrt(2.5 * (1 - 1 / 3)))
  })
  it('roundtrips lab sessions and rejects wrong labs, unsupported alpha, and duplicate IDs', () => {
    const session = { version: 1, lab: 'one-way-anova', alpha: .05, rows }
    expect(labSession(JSON.stringify(session), 'one-way-anova')).toEqual({ rows, alpha: .05 })
    expect(() => labSession(JSON.stringify(session), 'two-way-anova')).toThrow(/this lab/)
    expect(() => labSession(JSON.stringify({ ...session, alpha: .3 }), 'one-way-anova')).toThrow(/supported alpha/)
    expect(() => labSession(JSON.stringify({ ...session, rows: [...rows, rows[0]] }), 'one-way-anova')).toThrow(/unique/)
    expect(labCsv(['group', 'value'], [['=HYPERLINK(1)', -2]])).toContain("'=HYPERLINK")
    expect(labCsv(['=HYPERLINK(1)', 'value'], [['A', 2]])).toContain("'=HYPERLINK")
  })
})
