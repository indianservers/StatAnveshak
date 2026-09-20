import { describe, expect, it } from 'vitest'
import { detectSchema } from './schema'
import { validObservationCount } from './datasetGuard'
import type { Dataset } from '../types'

describe('schema type detection', () => {
  it('keeps a mostly-numeric column numeric even with blanks', () => {
    const schema = detectSchema([
      { score: 1 },
      { score: '' },
      { score: 3 },
      { score: null },
      { score: 5 },
    ])
    expect(schema[0]?.type).toBe('numeric')
  })

  it('does not convert padded identifiers like 00123 into numeric variables', () => {
    const schema = detectSchema([
      { id: '00123' },
      { id: '00124' },
      { id: '00125' },
      { id: '00126' },
      { id: '00127' },
      { id: '00128' },
      { id: '00129' },
      { id: '00130' },
      { id: '00131' },
      { id: '00132' },
      { id: '00133' },
    ])
    expect(schema[0]?.type).toBe('id')
  })
})

describe('missing observations', () => {
  it('does not count null as a valid numeric observation', () => {
    const dataset: Dataset = {
      id: 'ds_missing',
      name: 'Missing',
      rows: 3,
      cols: 1,
      createdAt: 1,
      schema: [{ name: 'x', type: 'numeric', nullable: true, unique: 1, missing: 2, missingPct: 66, sample: [4, null] }],
      sourceType: 'sample',
      data: [{ x: 4 }, { x: null }, { x: '' }],
    }
    expect(validObservationCount(dataset, 'x')).toBe(1)
  })
})
