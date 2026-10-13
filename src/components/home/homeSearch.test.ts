import { describe, expect, it } from 'vitest'
import { searchHome } from './homeSearchCatalog'

describe('home search', () => {
  it('ignores blank queries and matches case-insensitive multiword queries', () => {
    expect(searchHome('  ')).toEqual([])
    expect(searchHome(' NORMAL distribution ').length).toBeGreaterThan(0)
    expect(searchHome('zzzz-no-match')).toEqual([])
  })
  it('finds studios, labs, analyses, and data tools with distinct routes', () => {
    expect(searchHome('regression').map((entry) => entry.category)).toEqual(expect.arrayContaining(['Studio', 'Lab', 'Analysis']))
    expect(searchHome('upload')[0]).toMatchObject({ path: '/data/upload', analyze: true })
    const hits = searchHome('probability')
    expect(new Set(hits.map((entry) => entry.path)).size).toBe(hits.length)
  })
  it('finds common synonyms and punctuation safely', () => {
    expect(searchHome('bell curve')).toEqual(searchHome('normal'))
    expect(searchHome('import')).toEqual(searchHome('upload'))
    expect(searchHome('linear model')).toEqual(searchHome('regression'))
    expect(searchHome('[')).toEqual([])
  })
})

