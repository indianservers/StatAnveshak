import jStatRaw from 'jstat'

const jStat = jStatRaw as unknown as { chisquare: { cdf: (x: number, df: number) => number } }

export type RankedValue = { value: number; rank: number; index: number }

export function averageRanks(values: number[]): RankedValue[] {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const result: RankedValue[] = Array(values.length)
  for (let start = 0; start < sorted.length;) {
    let end = start + 1
    while (end < sorted.length && sorted[end].value === sorted[start].value) end++
    const rank = (start + 1 + end) / 2
    for (let i = start; i < end; i++) result[sorted[i].index] = { ...sorted[i], rank }
    start = end
  }
  return result
}

export function median(values: number[]): number {
  if (!values.length) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function signTest(differences: number[]) {
  const usable = differences.filter((value) => value !== 0)
  const n = usable.length
  const plus = usable.filter((value) => value > 0).length
  let probability = 2 ** -n
  let lowerTail = probability
  for (let k = 1; k <= Math.min(plus, n - plus); k++) {
    probability *= (n - k + 1) / k
    lowerTail += probability
  }
  return { n, plus, minus: n - plus, ties: differences.length - n, p: Math.min(1, 2 * lowerTail) }
}

export function signedRankTest(differences: number[]) {
  const usable = differences.filter((value) => value !== 0)
  const ranked = averageRanks(usable.map(Math.abs))
  const signed = usable.map((difference, index) => ({ difference, rank: ranked[index].rank }))
  const plus = signed.filter((item) => item.difference > 0).reduce((sum, item) => sum + item.rank, 0)
  const total = signed.reduce((sum, item) => sum + item.rank, 0)
  const center = total / 2
  let extreme = 0
  const assignments = 2 ** signed.length
  for (let mask = 0; mask < assignments; mask++) {
    let sum = 0
    for (let i = 0; i < signed.length; i++) if (mask & (1 << i)) sum += signed[i].rank
    if (Math.abs(sum - center) >= Math.abs(plus - center) - 1e-9) extreme++
  }
  return { n: signed.length, signed, plus, minus: total - plus, ties: differences.length - signed.length,
    p: extreme / assignments, rankBiserial: total ? (2 * plus - total) / total : 0 }
}

function combinations(n: number, k: number, visit: (indices: number[]) => void) {
  const chosen: number[] = []
  function step(start: number) {
    if (chosen.length === k) { visit(chosen); return }
    for (let i = start; i <= n - (k - chosen.length); i++) {
      chosen.push(i)
      step(i + 1)
      chosen.pop()
    }
  }
  step(0)
}

export function mannWhitney(a: number[], b: number[]) {
  const n1 = a.length
  const n2 = b.length
  const ranked = averageRanks([...a, ...b])
  const rankSum = ranked.slice(0, n1).reduce((sum, item) => sum + item.rank, 0)
  const u = rankSum - n1 * (n1 + 1) / 2
  const center = n1 * n2 / 2
  let extreme = 0
  let total = 0
  combinations(n1 + n2, n1, (indices) => {
    const candidate = indices.reduce((sum, index) => sum + ranked[index].rank, 0) - n1 * (n1 + 1) / 2
    if (Math.abs(candidate - center) >= Math.abs(u - center) - 1e-9) extreme++
    total++
  })
  return { u, rankSum, p: extreme / total, probability: u / (n1 * n2), cliff: 2 * u / (n1 * n2) - 1,
    ranked, permutations: total }
}

export function kruskalWallis(groups: number[][]) {
  const sizes = groups.map((group) => group.length)
  const values = groups.flat()
  const n = values.length
  const ranked = averageRanks(values)
  let cursor = 0
  const rankSums = sizes.map((size) => {
    const sum = ranked.slice(cursor, cursor + size).reduce((total, item) => total + item.rank, 0)
    cursor += size
    return sum
  })
  const raw = 12 / (n * (n + 1)) * rankSums.reduce((sum, rankSum, i) => sum + rankSum ** 2 / sizes[i], 0) - 3 * (n + 1)
  const counts = new Map<number, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  const correction = 1 - [...counts.values()].reduce((sum, count) => sum + count ** 3 - count, 0) / (n ** 3 - n)
  const h = correction > 0 ? raw / correction : 0
  return { h, df: groups.length - 1, p: Math.max(0, Math.min(1, 1 - jStat.chisquare.cdf(h, groups.length - 1))),
    rankSums, meanRanks: rankSums.map((sum, i) => sum / sizes[i]), correction, ranked }
}

export function exactPermutation(a: number[], b: number[]) {
  const values = [...a, ...b]
  const n = a.length
  const observed = mean(a) - mean(b)
  const distribution: number[] = []
  combinations(values.length, n, (indices) => {
    const selected = new Set(indices)
    const groupA = values.filter((_, index) => selected.has(index))
    const groupB = values.filter((_, index) => !selected.has(index))
    distribution.push(mean(groupA) - mean(groupB))
  })
  const extreme = distribution.filter((value) => Math.abs(value) >= Math.abs(observed) - 1e-9).length
  const random = seededRandom(73)
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[distribution[i], distribution[j]] = [distribution[j], distribution[i]]
  }
  return { observed, distribution, p: extreme / distribution.length, extreme }
}

export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function bootstrapDifference(a: number[], b: number[], draws: number, seed: number) {
  const random = seededRandom(seed)
  const observed = mean(a) - mean(b)
  const pooled = mean([...a, ...b])
  const centeredA = a.map((value) => value - mean(a) + pooled)
  const centeredB = b.map((value) => value - mean(b) + pooled)
  const distribution: number[] = []
  const nullDistribution: number[] = []
  function sample(values: number[]) {
    let sum = 0
    for (let i = 0; i < values.length; i++) sum += values[Math.floor(random() * values.length)]
    return sum / values.length
  }
  for (let i = 0; i < draws; i++) {
    distribution.push(sample(a) - sample(b))
    nullDistribution.push(sample(centeredA) - sample(centeredB))
  }
  const sorted = [...distribution].sort((x, y) => x - y)
  const low = sorted[Math.floor(0.025 * (draws - 1))]
  const high = sorted[Math.ceil(0.975 * (draws - 1))]
  const extreme = nullDistribution.filter((value) => Math.abs(value) >= Math.abs(observed)).length
  return { observed, distribution, nullDistribution, low, high, p: (extreme + 1) / (draws + 1) }
}
