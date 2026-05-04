import type { Dataset, SampleDataset } from '../types'
import { detectSchema } from './schema'

export function sampleToDataset(sample: SampleDataset): Dataset {
  const data = sample.data.map((row) => ({ ...row }))
  const schema = detectSchema(data)

  return {
    id: `sample_${sample.id}`,
    name: sample.name,
    rows: data.length,
    cols: schema.length,
    createdAt: Date.now(),
    schema,
    sourceType: 'sample',
    fileSize: JSON.stringify(data).length,
    schemaConfidence: Math.round((schema.filter((col) => col.type !== 'text' || col.unique < data.length).length / Math.max(schema.length, 1)) * 100),
    parseDetails: 'Built-in sample dataset',
    data,
  }
}
