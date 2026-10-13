import { describe, expect, it } from 'vitest'
import { DEFAULT_DIST_UI, normalizeDistUI } from './distributionUI'

describe('persisted distribution appearance', () => {
  it('recovers from missing or malformed preferences', () => {
    for (const value of [null, undefined, 'broken', 42, { palette: 'unknown', speed: 'rapid', density: 'tiny', readable: 'yes' }]) expect(normalizeDistUI(value)).toEqual(DEFAULT_DIST_UI)
  })
  it('preserves supported choices and ignores unexpected fields', () => {
    expect(normalizeDistUI({ palette: 'sunset', density: 'compact', speed: 'slow', animate: false, grid: false, legend: false, readable: true, contrast: true, script: 'ignored' })).toEqual({ palette: 'sunset', density: 'compact', speed: 'slow', animate: false, grid: false, legend: false, readable: true, contrast: true })
  })
})
