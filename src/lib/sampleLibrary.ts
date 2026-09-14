import { SAMPLE_DATASETS } from './sampleData'

let metaCache: SampleLibraryItem[] | null = null

export type SampleLibraryItem = {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  rows: number
  task: string
}

export function sampleLibraryMeta(): SampleLibraryItem[] {
  if (metaCache) return metaCache
  metaCache = SAMPLE_DATASETS.map((sample) => ({
    id: sample.id,
    name: sample.name,
    description: sample.description,
    category: sample.category,
    tags: sample.tags,
    rows: sample.data.length,
    task: sample.tags[0] ?? sample.category,
  }))
  return metaCache
}

export function findSampleById(id: string) {
  return SAMPLE_DATASETS.find((sample) => sample.id === id)
}
