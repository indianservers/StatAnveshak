import { describe, expect, it } from 'vitest'
import { adjustP, average, bootstrapMean, compareDatasets, crossValidate, datasetFingerprint, decompose, duplicateIndices, effectSize, forecastCompare, isMissing, meanInterval, missingProfile, numberValue, outlierIndices, permutationMean, predictLinear, prepareRows, simulateSampling, validationRows, variance, type PrepConfig } from './toolkit'
import { TOOL_FEATURES } from '../components/tools/toolCatalog'
import { linearFitSummary, parseCategoryOrder } from './toolkit'
const config: PrepConfig = { column: 'score', output: 'derived', method: 'mean', group: 'group', other: '', constant: 5, mapping: '{}', minimum: 0, maximum: 30, required: true, expected: 'numeric', threshold: 1.5, keys: ['score', 'group'] }
const rows = [{ id: 1, score: 10, group: 'A' }, { id: 2, score: 20, group: 'A' }, { id: 3, score: null, group: 'A' }, { id: 4, score: 30, group: 'B' }, { id: 5, score: null, group: 'B' }]
describe('Tools feature registry', () => {
  it('exposes exactly 50 unique, numbered features', () => { expect(TOOL_FEATURES).toHaveLength(50); expect(new Set(TOOL_FEATURES.map(f => f.id)).size).toBe(50); expect(TOOL_FEATURES.map(f => f.number)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1)) })
})
describe('data preparation', () => {
  it('distinguishes missing values from zero and booleans', () => { expect(isMissing('  ')).toBe(true); expect(numberValue('')).toBeNull(); expect(numberValue(false)).toBeNull(); expect(numberValue('0')).toBe(0); expect(missingProfile(rows, ['score']).counts[0]).toEqual(['score', 2, 40]) })
  it('fills missing scores globally and by group without changing the source', () => {
    const original = structuredClone(rows)
    expect(prepareRows(rows, 'impute', config)[2].score).toBe(20)
    expect(prepareRows(rows, 'impute', { ...config, method: 'group' }).map(r => r.score)).toEqual([10, 20, 15, 30, 30])
    expect(prepareRows(rows, 'impute', { ...config, method: 'constant', constant: 0 })[2].score).toBe(0)
    expect(rows).toEqual(original)
  })
  it('rejects group imputation when a group has no observed score', () => { expect(() => prepareRows([{ score: null, group: 'A' }, { score: 1, group: 'B' }], 'impute', { ...config, method: 'group' })).toThrow(/no observed/) })
  it('detects duplicate copies using selected keys', () => { const input = [...rows, { ...rows[0], id: 99 }]; expect(duplicateIndices(input, ['score', 'group'])).toEqual([5]); expect(prepareRows(input, 'duplicates', config)).toHaveLength(5); expect(() => duplicateIndices(input, [])).toThrow() })
  it('flags a clear outlier and validates missing/range violations', () => { const input = [1, 2, 3, 4, 5, 100].map(score => ({ score })); expect(outlierIndices(input, 'score')).toEqual([5]); expect(validationRows(rows, { ...config, maximum: 15 })).toHaveLength(4) })
  it('creates scaled and transformed values while rejecting overwrites', () => {
    const scaled = prepareRows(rows, 'scale', { ...config, method: 'minmax' }); expect(scaled.map(r => r.derived)).toEqual([0, .5, null, 1, null])
    const z = prepareRows(rows, 'scale', { ...config, method: 'z' }).flatMap(r => typeof r.derived === 'number' ? [r.derived] : []); expect(average(z)).toBeCloseTo(0); expect(variance(z)).toBeCloseTo(1)
    expect(prepareRows(rows, 'transform', { ...config, method: 'divide', constant: 0 })[0].derived).toBeNull()
    expect(() => prepareRows(rows, 'scale', { ...config, output: 'score', method: 'z' })).toThrow(/new/)
    expect(() => prepareRows([{ score: 1 }, { score: 1 }], 'scale', { ...config, method: 'z' })).toThrow(/constant/)
  })
  it('recodes explicit mappings and extracts UTC date parts', () => {
    expect(parseCategoryOrder('["B","A"]')).toEqual(['B', 'A'])
    expect(() => parseCategoryOrder('["A","A"]')).toThrow(/unique/)
    expect(prepareRows(rows, 'recode', { ...config, column: 'group', mapping: '{"A":"Combined"}' })[0].group).toBe('Combined')
    const dates = [{ date: '2026-10-03T00:00:00Z', earlier: '2026-10-01T00:00:00Z' }]
    expect(prepareRows(dates, 'dates', { ...config, column: 'date', method: 'month' })[0].derived).toBe(10)
    expect(prepareRows(dates, 'dates', { ...config, column: 'date', other: 'earlier', method: 'days' })[0].derived).toBe(2)
  })
  it('compares unique keys and rejects ambiguous datasets', () => { expect(compareDatasets([{ id: 1, score: 2 }], [{ id: 1, score: 3 }, { id: 2, score: 4 }], 'id')).toEqual([['1', 'score', '2', '3'], ['2', 'Added', '', '']]); expect(() => compareDatasets([{ id: 1 }, { id: 1 }], [], 'id')).toThrow(/unique/); expect(datasetFingerprint(rows)).toBe(datasetFingerprint(structuredClone(rows))); expect(datasetFingerprint(rows)).not.toBe(datasetFingerprint(rows.slice(1))) })
})
describe('statistical calculations', () => {
  it('computes a reference Student-t mean interval', () => { const ci = meanInterval([1, 2, 3, 4, 5]); expect(ci.mean).toBe(3); expect(ci.low).toBeCloseTo(1.0367568, 5); expect(ci.high).toBeCloseTo(4.9632432, 5) })
  it('uses reproducible bootstrap and permutation streams', () => { const a = [1, 2, 3, 4, 5], b = [10, 11, 12, 13, 14]; expect(bootstrapMean(a, 300, 42)).toEqual(bootstrapMean(a, 300, 42)); expect(bootstrapMean(a, 300, 43).means).not.toEqual(bootstrapMean(a, 300, 42).means); const p = permutationMean(a, b, 1000, 42); expect(p.p).toBeLessThan(.05); expect(p.p).toBeGreaterThan(0); expect(p.observed).toBe(-9) })
  it('reports signed standardized effect sizes', () => { const e = effectSize([1, 2, 3], [4, 5, 6]); expect(e.d).toBe(-3); expect(e.g).toBeCloseTo(-2.4); expect(effectSize([4, 5, 6], [1, 2, 3]).d).toBe(3); expect(() => effectSize([1, 1], [2, 2])).toThrow(/zero/) })
  it('matches known Holm and BH adjustments and original ordering', () => { expect(adjustP([.01, .04, .03, .2], 'holm')).toEqual([.04, .09, .09, .2]); const bh = adjustP([.01, .04, .03, .2], 'bh'); expect(bh[0]).toBeCloseTo(.04); expect(bh[1]).toBeCloseTo(.05333333); expect(bh[2]).toBeCloseTo(.05333333); expect(() => adjustP([1.2], 'bh')).toThrow() })
})
describe('model and simulation calculations', () => {
  const linear = Array.from({ length: 30 }, (_, i) => ({ x: i, z: Math.sin(i), y: 2 + 3 * i }))
  it('reproduces folds and estimates a known linear prediction', () => { const cv = crossValidate(linear, 'y', ['x'], 5, 2, 42); expect(cv.results).toHaveLength(10); expect(cv.rmse).toBeLessThan(1e-10); expect(cv).toEqual(crossValidate(linear, 'y', ['x'], 5, 2, 42)); const prediction = predictLinear(linear, 'y', ['x'], [10]); expect(prediction.value).toBeCloseTo(32); expect(prediction.low).toBeCloseTo(32); expect(() => crossValidate(linear, 'y', ['y'], 5, 2, 42)).toThrow(/distinct/) })
  it('keeps in-sample fit distinct from held-out error', () => { const noisy = linear.map((r, i) => ({ ...r, y: r.y + Math.sin(i) * 2 })); const fit = linearFitSummary(noisy, 'y', ['x']); expect(fit.rSquared).toBeGreaterThan(.99); expect(fit.aic).toBeGreaterThan(0); expect(fit.bic).toBeGreaterThan(fit.aic) })
  it('uses only the training prefix for forecast baselines', () => { const result = forecastCompare([1, 2, 3, 4, 5, 6, 7, 8], 2, 2); expect(result.find(r => r.name === 'Drift')?.rmse).toBeCloseTo(0); expect(result[0].predicted).toEqual([6, 6]); expect(result[2].predicted).toEqual([5, 6]) })
  it('reconstructs an additive seasonal series where trend is available', () => { const a = Array.from({ length: 24 }, (_, i) => 10 + i + [2, -2, 1, -1][i % 4]); const d = decompose(a, 4); d.forEach(r => { if (r[2] !== null) expect(r[2]! + r[3]! + r[4]!).toBeCloseTo(r[1]!) }); expect(d[0][2]).toBeNull(); expect(() => decompose(a, 30)).toThrow() })
  it('simulates expected uncertainty and exposes sampling bias', () => { const unbiased = simulateSampling(30, 1000, 0, 1, 0, 42); expect(unbiased.coverage).toBeGreaterThan(.9); expect(unbiased.coverage).toBeLessThan(.99); expect(unbiased.standardError).toBeCloseTo(1 / Math.sqrt(30), 1); expect(simulateSampling(30, 1000, 0, 1, 2, 42).coverage).toBeLessThan(.05); expect(() => simulateSampling(1, 100, 0, 1, 0, 42)).toThrow(); expect(() => simulateSampling(30, 100.5, 0, 1, 0, 42)).toThrow() })
})
