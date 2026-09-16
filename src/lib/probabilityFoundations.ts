import { STATISTICS_STUDIOS, labPath, studioPath, type Studio, type StudioLab } from './statisticsStudios'

export const PF_STUDIO_SLUG = 'probability-foundations'
export const PF_STORAGE_KEY = 'anveshak-probability-foundations'

export type PfTab = 'learn' | 'explore' | 'practice' | 'quiz'

export type PfProgress = {
  completed: string[]
}

export const PF_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === PF_STUDIO_SLUG) as Studio

export const PF_HOME_COPY: Record<string, { blurb: string; tryThis: string }> = {
  'sample-space-events': {
    blurb: 'Explore sample space, events, and how to describe outcomes.',
    tryThis: 'Roll the die and watch which events contain the result.',
  },
  'set-operations': {
    blurb: 'Learn unions, intersections, complements, and set relationships in probability.',
    tryThis: 'Switch the highlighted operation and watch the Venn regions move.',
  },
  'probability-rules': {
    blurb: 'Build a strong foundation with the key rules of probability.',
    tryThis: 'Change P(A) and watch the complement update instantly.',
  },
  'conditional-probability': {
    blurb: 'Understand how new information changes probability.',
    tryThis: 'Condition on a color and see the sample space shrink.',
  },
  independence: {
    blurb: 'Explore independent events and what independence really means.',
    tryThis: 'Run the two-dice simulation and compare P(A ∩ B) with P(A)P(B).',
  },
  'bayes-theorem': {
    blurb: 'Update probabilities with new evidence.',
    tryThis: 'Lower the prevalence and watch the posterior collapse.',
  },
  'law-of-total-probability': {
    blurb: 'See how to combine probabilities across cases.',
    tryThis: 'Reweight the hospitals and watch each path contribute to P(A).',
  },
  'counting-techniques': {
    blurb: 'Use permutations, combinations, and the counting principle.',
    tryThis: 'Toggle permutations versus combinations for the same n and r.',
  },
  'probability-tree-venn': {
    blurb: 'Bring it together with tree diagrams and Venn diagrams.',
    tryThis: 'Follow a path on the tree, then switch to the matching Venn view.',
  },
}

export function loadPfProgress(): PfProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(PF_STORAGE_KEY) ?? '{}') as Partial<PfProgress>
    return { completed: Array.isArray(raw.completed) ? raw.completed.filter((slug) => typeof slug === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function savePfProgress(progress: PfProgress): void {
  localStorage.setItem(PF_STORAGE_KEY, JSON.stringify({ completed: [...new Set(progress.completed)] }))
}

export function markPfLabComplete(labSlug: string): PfProgress {
  const next = loadPfProgress()
  if (!next.completed.includes(labSlug)) next.completed.push(labSlug)
  savePfProgress(next)
  return next
}

export function pfStudioPath(): string {
  return studioPath(PF_STUDIO)
}

export function pfLabPath(labSlug: string): string {
  return labPath(PF_STUDIO_SLUG, labSlug)
}

export function nextIncompleteLab(completed: string[]): StudioLab {
  return PF_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? PF_STUDIO.labs[0]
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function formatProb(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

export function formatPct(value: number, digits = 1): string {
  return `${(clamp01(value) * 100).toFixed(digits)}%`
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) return Number.NaN
  if (n > 170) return Number.POSITIVE_INFINITY
  let result = 1
  for (let i = 2; i <= n; i += 1) result *= i
  return result
}

export function permutation(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return 0
  let result = 1
  for (let i = 0; i < r; i += 1) result *= n - i
  return result
}

export function combination(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return 0
  const k = Math.min(r, n - r)
  let result = 1
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i
  return Math.round(result)
}

export function bayesPositivePredictive(prior: number, sensitivity: number, falsePositive: number): number {
  const p = clamp01(prior)
  const sens = clamp01(sensitivity)
  const fpr = clamp01(falsePositive)
  const evidence = sens * p + fpr * (1 - p)
  if (evidence <= 0) return 0
  return (sens * p) / evidence
}

export function totalProbability(parts: ReadonlyArray<{ weight: number; conditional: number }>): number {
  return parts.reduce((sum, part) => sum + clamp01(part.weight) * clamp01(part.conditional), 0)
}

export function renormalizePartition(values: number[], index: number, nextValue: number): number[] {
  const copy = values.map((value) => Math.max(0.01, value))
  const clamped = Math.min(0.98, Math.max(0.01, nextValue))
  copy[index] = clamped
  const rest = 1 - clamped
  const others = copy.map((value, i) => (i === index ? 0 : value))
  const otherSum = others.reduce((sum, value) => sum + value, 0)
  return copy.map((value, i) => {
    if (i === index) return clamped
    if (otherSum <= 0) return rest / Math.max(1, copy.length - 1)
    return (value / otherSum) * rest
  })
}

export function setFromPredicate<T>(space: readonly T[], predicate: (value: T) => boolean): T[] {
  return space.filter(predicate)
}

export function probabilityOf<T>(space: readonly T[], event: readonly T[]): number {
  if (space.length === 0) return 0
  const members = new Set(event)
  return space.filter((item) => members.has(item)).length / space.length
}

export function dieFaces(): readonly number[] {
  return [1, 2, 3, 4, 5, 6]
}

export function isEven(n: number): boolean {
  return n % 2 === 0
}

export function isPrimeDie(n: number): boolean {
  return n === 2 || n === 3 || n === 5
}

export function independenceGap(pA: number, pB: number, pBoth: number): number {
  return pBoth - pA * pB
}

export function isApproximatelyIndependent(pA: number, pB: number, pBoth: number, tolerance = 0.01): boolean {
  return Math.abs(independenceGap(pA, pB, pBoth)) <= tolerance
}

export function twoCoinOutcomes(): ReadonlyArray<{ path: 'HH' | 'HT' | 'TH' | 'TT'; p: number }> {
  return [
    { path: 'HH', p: 0.25 },
    { path: 'HT', p: 0.25 },
    { path: 'TH', p: 0.25 },
    { path: 'TT', p: 0.25 },
  ]
}
