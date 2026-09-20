import { describe, expect, it } from 'vitest'
import { homeSlot, parseHashKeys, parseTableSize, runHashing } from './hashingLab'

describe('hashing lab', () => {
  it('rejects non-integer keys instead of dropping them silently', () => {
    const parsed = parseHashKeys('12, abc, 44')
    expect(parsed.keys).toEqual([12, 44])
    expect(parsed.errors[0]).toMatch(/not an integer/)
  })

  it('uses division hashing for an arbitrary table size', () => {
    expect(homeSlot(23, 10, 'division')).toBe(3)
    expect(homeSlot(55, 7, 'division')).toBe(6)
  })

  it('records collisions under linear probing', () => {
    const result = runHashing([12, 22], 10, 'division', 'linear')
    expect(result.slots[2]?.keys).toEqual([12])
    expect(result.slots[3]?.keys).toEqual([22])
    expect(result.collisions).toBe(1)
    expect(result.steps[1]?.collision).toBe(true)
  })

  it('chains colliding keys in the same bucket', () => {
    const result = runHashing([12, 22], 10, 'division', 'chaining')
    expect(result.slots[2]?.keys).toEqual([12, 22])
    expect(result.collisions).toBe(1)
  })

  it('validates table size', () => {
    expect(parseTableSize('10').size).toBe(10)
    expect(parseTableSize('0').error).toMatch(/at least 2/)
    expect(parseTableSize('1.5').error).toMatch(/positive integer/)
  })
})
