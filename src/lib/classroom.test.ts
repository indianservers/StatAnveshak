import { describe, expect, it } from 'vitest'
import {
  assignmentPath,
  buildLabReplay,
  defaultLabParams,
  parseLabReplay,
  paramsFromSearch,
  PRACTICE_ITEMS,
} from './classroom'

describe('classroom replay', () => {
  it('round-trips assignment params for Bayes', () => {
    const params = { prior: 0.02, sens: 0.95, fpr: 0.05 }
    const path = assignmentPath('compound', params, { practiceId: 'base-rate-trap' })
    expect(path).toContain('/learn/compound?')
    expect(path).toContain('prior=0.02')
    expect(path).toContain('practice=base-rate-trap')
    const search = new URLSearchParams(path.split('?')[1])
    expect(paramsFromSearch('compound', search).prior).toBe(0.02)
  })

  it('parses replay JSON and rejects other payloads', () => {
    const replay = buildLabReplay({ chapterId: 'chance', params: { p: 0.8 } })
    const parsed = parseLabReplay(JSON.stringify(replay))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.replay.params.p).toBe(0.8)
    expect(parseLabReplay('{"kind":"nope"}').ok).toBe(false)
  })

  it('has one practice item per chapter', () => {
    expect(PRACTICE_ITEMS).toHaveLength(6)
    expect(defaultLabParams('bayesian')).toEqual({ alpha: 2, beta: 6 })
  })
})
