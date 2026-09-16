import { describe, expect, it } from 'vitest'
import {
  CENTER_DEFAULT,
  BOX_DEFAULT,
  ECDF_DEFAULT,
  FREQ_DEFAULT,
  TEST_SCORES_30,
  WORKED_CENTER,
  WORKED_FIVE,
  ecdfAt,
  fiveNumber,
  formatModes,
  parseNumbers,
  percentile,
  percentileRank,
  stemLeaf,
  summarize,
  tukeyBox,
  ungroupedFrequency,
  weightedMean,
} from './descriptiveStatistics'

describe('descriptive statistics math', () => {
  it('parses mixed separators and rejects invalid tokens', () => {
    const parsed = parseNumbers('4, 6 7; eight, 9.5, -2')
    expect(parsed.values).toEqual([4, 6, 7, 9.5, -2])
    expect(parsed.invalid).toEqual(['eight'])
  })

  it('matches the center-lab default mean, median, and mode', () => {
    const stats = summarize(CENTER_DEFAULT)
    expect(stats.n).toBe(10)
    expect(stats.mean).toBeCloseTo(7.8, 10)
    expect(stats.median).toBeCloseTo(8, 10)
    expect(stats.modes.values).toEqual([10])
    expect(stats.modes.frequency).toBe(3)
    expect(formatModes(stats.modes)).toBe('10')
  })

  it('uses R type-7 quantiles for the worked five-number example', () => {
    const summary = fiveNumber(WORKED_FIVE)
    expect(summary.min).toBe(5)
    expect(summary.median).toBeCloseTo(14.5, 10)
    expect(summary.q1).toBeCloseTo(9.75, 10)
    expect(summary.q3).toBeCloseTo(20.25, 10)
    expect(summary.max).toBe(28)
    expect(summary.iqr).toBeCloseTo(10.5, 10)
  })

  it('classifies Tukey outliers on the exam-score box-plot set', () => {
    const box = tukeyBox(BOX_DEFAULT)
    expect(box.median).toBeCloseTo(80, 10)
    expect(box.outliers).toEqual([120])
    expect(120).toBeGreaterThan(box.upperFence)
    expect(box.upperWhisker).toBeLessThan(120)
  })

  it('keeps percentiles consistent with type-7 on the 30-score set', () => {
    expect(percentile(TEST_SCORES_30, 25)).toBeCloseTo(59, 0)
    expect(percentile(TEST_SCORES_30, 50)).toBeCloseTo(72, 10)
    expect(percentile(TEST_SCORES_30, 75)).toBeCloseTo(85, 0)
    expect(percentile(TEST_SCORES_30, 80)).toBeCloseTo(88, 0)
    expect(percentileRank(TEST_SCORES_30, 72)).toBeCloseTo((16 / 30) * 100, 8)
  })

  it('computes ECDF jumps and a stem-and-leaf that preserves values', () => {
    const at36 = ecdfAt(ECDF_DEFAULT, 36)
    expect(at36.count).toBe(13)
    expect(at36.value).toBeCloseTo(13 / 20, 10)
    const rows = stemLeaf(ECDF_DEFAULT, 10)
    expect(rows[0]).toMatchObject({ stem: 1, leaves: [2, 5, 7, 9] })
    expect(rows.flatMap((row) => row.values).sort((a, b) => a - b)).toEqual([...ECDF_DEFAULT].sort((a, b) => a - b))
  })

  it('builds an ungrouped frequency table with relative and cumulative columns', () => {
    const rows = ungroupedFrequency(FREQ_DEFAULT)
    const total = rows.reduce((sum, row) => sum + row.frequency, 0)
    expect(total).toBe(FREQ_DEFAULT.length)
    expect(rows[rows.length - 1]?.cumulativeRelative).toBeCloseTo(1, 10)
  })

  it('computes a weighted mean and a bimodal mode pair', () => {
    expect(weightedMean([{ x: 80, w: 2 }, { x: 90, w: 3 }])).toBeCloseTo(86, 10)
    const stats = summarize(WORKED_CENTER)
    expect(stats.modes.values).toEqual([4, 9])
    expect(stats.mean).toBeCloseTo(47 / 7, 10)
    expect(stats.median).toBe(7)
  })
})
