import { describe, expect, it } from 'vitest'
import type { Dataset } from '../types'
import { hasNumericColumns, inspectDataset, validObservationCount } from './datasetGuard'

function dataset(overrides: Partial<Dataset> = {}): Dataset {
  return {
    id: 'ds_1',
    name: 'Demo',
    rows: 2,
    cols: 2,
    createdAt: 1,
    schema: [
      { name: 'score', type: 'numeric', nullable: false, unique: 2, missing: 0, missingPct: 0, sample: [1, 2] },
      { name: 'group', type: 'categorical', nullable: false, unique: 1, missing: 0, missingPct: 0, sample: ['A'] },
    ],
    sourceType: 'sample',
    data: [{ score: 1, group: 'A' }, { score: 2, group: 'A' }],
    ...overrides,
  }
}

describe('datasetGuard', () => {
  it('reports empty when nothing is loaded', () => {
    expect(inspectDataset(null).status).toBe('empty')
  })

  it('reports invalid when rows and columns are missing', () => {
    const result = inspectDataset(dataset({ schema: [], data: [], rows: 0, cols: 0 }))
    expect(result.status).toBe('invalid')
  })

  it('finds numeric columns and valid observations', () => {
    const current = dataset()
    expect(hasNumericColumns(current)).toBe(true)
    expect(validObservationCount(current, 'score')).toBe(2)
    expect(validObservationCount(current, 'missing')).toBe(0)
  })
})
