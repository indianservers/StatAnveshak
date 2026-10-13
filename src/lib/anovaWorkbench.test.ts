import { describe, expect, it } from 'vitest'
import { anovaReport, anovaRowsCsv, groupMeanInterval, mapAnovaRows, omegaSquared, validateAnovaRows } from './anovaWorkbench'
import { oneWayAnova, WORKED_ONE_WAY } from './anovaStudio'

describe('ANOVA workbench data integrity', () => {
  it('excludes blanks, missing groups, infinities, booleans, and nonnumeric outcomes explicitly', () => {
    const data = [{ group: ' A ', y: '3' }, { group: 'B', y: 4 }, { group: null, y: 2 }, { group: 'A', y: '' }, { group: 'B', y: Infinity }, { group: 'A', y: true }, { group: 'B', y: 'no' }]
    const result = mapAnovaRows(data, 'group', 'y')
    expect(result.excluded).toBe(5)
    expect(result.rows.map((row) => [row.a, row.y])).toEqual([['A', 3], ['B', 4]])
  })
  it('rejects insufficient groups, singleton groups, duplicate IDs, and zero error variance', () => {
    expect(validateAnovaRows([{ id: '1', a: 'A', y: 3 }])).toMatch(/two groups/)
    expect(validateAnovaRows([{ id: '1', a: 'A', y: 3 }, { id: '2', a: 'B', y: 4 }])).toMatch(/two valid observations/)
    expect(validateAnovaRows([{ id: '1', a: 'A', y: 3 }, { id: '1', a: 'B', y: 4 }])).toMatch(/unique/)
    expect(validateAnovaRows([{ id: '1', a: 'A', y: 3 }, { id: '2', a: 'A', y: 3 }, { id: '3', a: 'B', y: 4 }, { id: '4', a: 'B', y: 4 }])).toMatch(/variance is zero/)
    expect(validateAnovaRows(WORKED_ONE_WAY)).toBeNull()
  })
  it('computes bias-adjusted effect sizes and known t confidence bounds', () => {
    const [lo, hi] = groupMeanInterval(10, 2, 10, 0.05)
    expect(lo).toBeCloseTo(8.5693, 3)
    expect(hi).toBeCloseTo(11.4307, 3)
    const result = oneWayAnova(WORKED_ONE_WAY)
    expect(omegaSquared(result)).toBeLessThan(result.eta2)
    expect(omegaSquared(result)).toBeGreaterThanOrEqual(0)
  })
  it('exports reproducible values with escaped CSV cells and a report', () => {
    expect(anovaRowsCsv([{ id: '1', a: '=SUM(1)', y: 2 }, { id: '2', a: 'A,"B"', y: -3 }])).toContain('"\'=SUM(1)"')
    expect(anovaRowsCsv([{ id: '2', a: 'A,"B"', y: -3 }])).toContain('"A,""B""","-3"')
    const report = anovaReport(oneWayAnova(WORKED_ONE_WAY, 0.01), 'Teaching methods')
    expect(report).toContain('alpha = 0.01')
    expect(report).toContain('99% mean CI')
    expect(report).toContain('omega squared')
  })
})
