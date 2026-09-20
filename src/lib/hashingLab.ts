export type HashMethod = 'division' | 'multiplication' | 'mid-square' | 'folding' | 'universal'
export type CollisionMethod = 'chaining' | 'linear' | 'quadratic' | 'double'

export type HashStep = {
  index: number
  key: number
  home: number
  slot: number
  collision: boolean
  note: string
}

export type HashSlot = {
  index: number
  keys: number[]
}

export type HashingResult = {
  tableSize: number
  hashMethod: HashMethod
  collisionMethod: CollisionMethod
  slots: HashSlot[]
  steps: HashStep[]
  collisions: number
  loadFactor: number
  overflow: number[]
}

export const HASH_METHODS: Array<{ id: HashMethod; label: string; formula: string; blurb: string }> = [
  { id: 'division', label: 'Division method', formula: 'h(k) = k mod m', blurb: 'Remainder when the key is divided by the table size.' },
  { id: 'multiplication', label: 'Multiplication method', formula: 'h(k) = ⌊m (kA mod 1)⌋', blurb: 'Uses the fractional part of k times the golden-ratio constant A.' },
  { id: 'mid-square', label: 'Mid-square', formula: 'middle digits of k², then mod m', blurb: 'Squares the key and takes digits from the middle.' },
  { id: 'folding', label: 'Folding', formula: 'sum of digit chunks, then mod m', blurb: 'Splits the key into parts, adds them, then reduces modulo m.' },
  { id: 'universal', label: 'Universal hashing', formula: 'h(k) = ((ak + b) mod p) mod m', blurb: 'A family of hashes. Changing a and b changes the mapping.' },
]

export const COLLISION_METHODS: Array<{ id: CollisionMethod; label: string; blurb: string }> = [
  { id: 'chaining', label: 'Separate chaining', blurb: 'Each slot holds a list. Colliding keys append to the same bucket.' },
  { id: 'linear', label: 'Linear probing', blurb: 'If the home slot is taken, try the next empty slot: (h + i) mod m.' },
  { id: 'quadratic', label: 'Quadratic probing', blurb: 'Probe with squares: (h + i²) mod m, which spreads collisions out.' },
  { id: 'double', label: 'Double hashing', blurb: 'Second hash sets the step: (h1 + i·h2) mod m.' },
]

/** Knuth's suggested multiplier: (√5 − 1) / 2 */
export const HASH_MULTIPLIER_A = (Math.sqrt(5) - 1) / 2

const UNIVERSAL_P = 104729

export type UniversalParams = { a: number; b: number; p?: number }

export function parseHashKeys(input: string): { keys: number[]; errors: string[] } {
  const errors: string[] = []
  const keys: number[] = []
  const parts = input.split(/[\s,;]+/).map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) {
    return { keys, errors: ['Enter at least one key, for example 12, 23, 44, 55.'] }
  }
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) {
      errors.push(`“${part}” is not an integer key.`)
      continue
    }
    const value = Number(part)
    if (!Number.isSafeInteger(value)) {
      errors.push(`“${part}” is too large to hash in this lab.`)
      continue
    }
    keys.push(Math.abs(value))
  }
  return { keys, errors }
}

export function parseTableSize(raw: string): { size: number | null; error: string | null } {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) {
    return { size: null, error: 'Table size must be a positive integer.' }
  }
  const size = Number(trimmed)
  if (size < 2) return { size: null, error: 'Table size must be at least 2.' }
  if (size > 101) return { size: null, error: 'Table size is capped at 101 so the visualization stays readable.' }
  return { size, error: null }
}

export function homeSlot(
  key: number,
  tableSize: number,
  method: HashMethod,
  universal: UniversalParams = { a: 31, b: 7 },
): number {
  const m = tableSize
  if (m < 1) return 0
  switch (method) {
    case 'division':
      return key % m
    case 'multiplication': {
      const frac = (key * HASH_MULTIPLIER_A) % 1
      return Math.floor(m * frac)
    }
    case 'mid-square': {
      const squared = (key * key).toString()
      const take = Math.max(1, Math.ceil(Math.log10(m)))
      const start = Math.max(0, Math.floor((squared.length - take) / 2))
      const middle = Number(squared.slice(start, start + take) || '0')
      return middle % m
    }
    case 'folding': {
      const digits = Math.abs(key).toString()
      const chunk = 2
      let sum = 0
      for (let i = 0; i < digits.length; i += chunk) {
        sum += Number(digits.slice(i, i + chunk))
      }
      return sum % m
    }
    case 'universal': {
      const p = universal.p && universal.p > m ? universal.p : UNIVERSAL_P
      const a = ((universal.a % (p - 1)) + (p - 1)) % (p - 1) || 1
      const b = ((universal.b % p) + p) % p
      return ((a * key + b) % p) % m
    }
  }
}

function secondHash(key: number, tableSize: number): number {
  if (tableSize <= 2) return 1
  return 1 + (key % (tableSize - 1))
}

function probeIndex(home: number, i: number, key: number, tableSize: number, method: CollisionMethod): number {
  if (method === 'linear') return (home + i) % tableSize
  if (method === 'quadratic') return (home + i * i) % tableSize
  if (method === 'double') return (home + i * secondHash(key, tableSize)) % tableSize
  return home
}

export function runHashing(
  keys: number[],
  tableSize: number,
  hashMethod: HashMethod,
  collisionMethod: CollisionMethod,
  universal: UniversalParams = { a: 31, b: 7 },
): HashingResult {
  const slots: HashSlot[] = Array.from({ length: tableSize }, (_, index) => ({ index, keys: [] }))
  const steps: HashStep[] = []
  const overflow: number[] = []
  let collisions = 0

  keys.forEach((key, index) => {
    const home = homeSlot(key, tableSize, hashMethod, universal)
    if (collisionMethod === 'chaining') {
      const collision = slots[home]!.keys.length > 0
      if (collision) collisions += 1
      slots[home]!.keys.push(key)
      steps.push({
        index: index + 1,
        key,
        home,
        slot: home,
        collision,
        note: collision
          ? `h(${key}) = ${home}. Slot ${home} already has ${slots[home]!.keys.slice(0, -1).join(', ')}, so ${key} is chained.`
          : `h(${key}) = ${home}. Placed in empty bucket ${home}.`,
      })
      return
    }

    let placed = false
    for (let i = 0; i < tableSize; i++) {
      const slot = probeIndex(home, i, key, tableSize, collisionMethod)
      if (slots[slot]!.keys.length === 0) {
        const collision = i > 0
        if (collision) collisions += 1
        slots[slot]!.keys.push(key)
        const probeLabel =
          collisionMethod === 'linear'
            ? `(${home} + ${i}) mod ${tableSize}`
            : collisionMethod === 'quadratic'
              ? `(${home} + ${i}²) mod ${tableSize}`
              : `(${home} + ${i}·h₂(${key})) mod ${tableSize}`
        steps.push({
          index: index + 1,
          key,
          home,
          slot,
          collision,
          note: collision
            ? `Collision at ${home}. Probe ${i}: ${probeLabel} = ${slot}. Placed ${key} in slot ${slot}.`
            : `h(${key}) = ${home}. Placed in empty slot ${home}.`,
        })
        placed = true
        break
      }
    }
    if (!placed) {
      collisions += 1
      overflow.push(key)
      steps.push({
        index: index + 1,
        key,
        home,
        slot: home,
        collision: true,
        note: `Table is full. ${key} could not be placed with ${collisionMethod} probing.`,
      })
    }
  })

  const occupied = slots.filter((slot) => slot.keys.length > 0).length
  return {
    tableSize,
    hashMethod,
    collisionMethod,
    slots,
    steps,
    collisions,
    loadFactor: keys.length / tableSize,
    overflow,
  }
}
