import { describe, expect, it } from 'vitest'
import { importDatasetFile } from './importDataset'

describe('local dataset import', () => {
  it('parses CSV and preserves missing numeric values', async () => {
    const dataset = await importDatasetFile(new File(['group,score\nA,10\nB,\n'], 'scores.csv'))
    expect(dataset.rows).toBe(2)
    expect(dataset.data[1].score).toBeNull()
    expect(dataset.schema.find((column) => column.name === 'score')?.missing).toBe(1)
  })
  it('keeps columns that appear later in a JSON array and normalizes column names', async () => {
    const dataset = await importDatasetFile(new File(['[{"group name":"A"},{"group name":"B","score":12}]'], 'scores.json'))
    expect(dataset.cols).toBe(2)
    expect(dataset.data[0]).toEqual({ group_name: 'A', score: null })
  })
  it('rejects malformed or empty files with actionable errors', async () => {
    await expect(importDatasetFile(new File(['{}'], 'scores.json'))).rejects.toThrow('array of row objects')
    await expect(importDatasetFile(new File(['[{}]'], 'scores.json'))).rejects.toThrow('no columns')
    await expect(importDatasetFile(new File(['group,score\nA,1,extra'], 'scores.csv'))).rejects.toThrow('Could not read')
    await expect(importDatasetFile(new File([''], 'scores.csv'))).rejects.toThrow()
  })
})
