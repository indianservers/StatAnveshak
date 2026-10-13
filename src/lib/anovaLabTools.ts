import Papa from 'papaparse'
import { pTailF, pTailT, ptukey, qt } from '../analysis/engines/frequentist/dists'
import { mean, oneWayAnova, quantile, sampleSd, type AnovaObservation, type RmResult } from './anovaStudio'
import { adjustP, seededRandom, shuffle } from './toolkit'

export type LabMapping = { a: string; y: string; b: string; subject: string }
export type Rejection = { row: number; reason: string }
const label = (v: unknown) => typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''
export function mapLabData(data: Record<string, unknown>[], mapping: LabMapping, slug: string) {
  const rows: AnovaObservation[] = [], rejected: Rejection[] = []
  data.forEach((r, i) => {
    const raw = r[mapping.y], y = typeof raw === 'number' || typeof raw === 'string' && raw.trim() ? Number(raw) : NaN
    const a = label(r[mapping.a]), b = label(r[mapping.b]), subject = label(r[mapping.subject])
    const reason = !a ? 'Missing group / condition' : !Number.isFinite(y) ? 'Missing or nonnumeric outcome' : slug === 'two-way-anova' && !b ? 'Missing factor B' : slug === 'repeated-measures-anova' && !subject ? 'Missing subject ID' : ''
    if (reason) rejected.push({ row: i + 2, reason })
    else rows.push({ id: `data-${i + 1}`, a, y, ...(slug === 'two-way-anova' ? { b } : {}), ...(slug === 'repeated-measures-anova' ? { subject, time: a } : {}) })
  })
  const emptyConditions = slug === 'repeated-measures-anova' ? [...new Set(data.map(r => label(r[mapping.a])).filter(Boolean))].filter(a => !rows.some(r => r.a === a)) : []
  return { rows, rejected, emptyConditions }
}
export function parseLabText(text: string) {
  const parsed = Papa.parse<Record<string, unknown>>(text.trim(), { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() })
  if (parsed.errors.length) throw new Error(`Data could not be read: ${parsed.errors[0].message}`)
  if (parsed.meta.renamedHeaders && Object.keys(parsed.meta.renamedHeaders).length) throw new Error('Use unique column headers; duplicate headers were detected.')
  if (!parsed.meta.fields?.length || !parsed.data.length) throw new Error('Include a header row and at least one observation.')
  if (new Set(parsed.meta.fields).size !== parsed.meta.fields.length || parsed.meta.fields.some(h => !h)) throw new Error('Use unique, nonempty column headers.')
  return { data: parsed.data, columns: parsed.meta.fields }
}
export function validateLabData(rows: AnovaObservation[], slug: string): string | null {
  if (rows.length < 4 || rows.length > 5000) return 'Use 4–5,000 observations.'
  if (new Set(rows.map(r => r.id)).size !== rows.length) return 'Observation IDs must be unique.'
  if (rows.some(r => !Number.isFinite(r.y) || !r.a.trim())) return 'Every row needs a group / condition and finite outcome.'
  const levels = [...new Set(rows.map(r => r.a))]
  if (levels.length < 2 || levels.length > 6) return 'Use 2–6 groups / conditions.'
  if (slug === 'two-way-anova') {
    if (rows.some(r => !r.b?.trim())) return 'Every row needs factor B.'
    const bs = [...new Set(rows.map(r => r.b))]
    if (bs.length < 2 || bs.length > 6) return 'Use 2–6 levels of factor B.'
    for (const a of levels) for (const b of bs) if (rows.filter(r => r.a === a && r.b === b).length < 2) return `Cell ${a} × ${b} needs at least two observations; empty cells are not supported.`
  } else if (slug === 'repeated-measures-anova') {
    if (rows.some(r => !r.subject?.trim())) return 'Every row needs a subject ID.'
    const keys = rows.map(r => JSON.stringify([r.subject, r.time ?? r.a]))
    if (new Set(keys).size !== keys.length) return 'Duplicate subject × condition measurements: resolve duplicates explicitly.'
    const subjects = [...new Set(rows.map(r => r.subject))]
    const complete = subjects.filter(s => levels.every(a => rows.some(r => r.subject === s && r.a === a)))
    if (complete.length < 3) return 'At least three complete subjects are required.'
    if (complete.length > 200) return 'Use at most 200 complete subjects for covariance diagnostics.'
  } else if (levels.some(a => rows.filter(r => r.a === a).length < 2)) return 'Every group needs at least two observations.'
  const cells = new Map<string, number[]>()
  rows.forEach(r => { const key = slug === 'two-way-anova' ? JSON.stringify([r.a, r.b]) : r.a; const vs = cells.get(key) ?? []; vs.push(r.y); cells.set(key, vs) })
  if (![...cells.values()].some(vs => sampleSd(vs) > 0)) return 'Within-group variation is zero; an error term cannot be estimated.'
  return null
}
export function transformLabRows(rows: AnovaObservation[], method: string, operand: number) {
  if (!Number.isFinite(operand)) throw new Error('Use a finite operand.')
  if (method === 'scale' && operand === 0) throw new Error('A zero multiplier removes all variation.')
  if (method === 'log' && rows.some(r => r.y <= 0)) throw new Error('Log requires strictly positive outcomes. No offset is silently added.')
  if (method === 'sqrt' && rows.some(r => r.y < 0)) throw new Error('Square root requires nonnegative outcomes.')
  const transformed = rows.map(r => ({ ...r, y: method === 'log' ? Math.log(r.y) : method === 'sqrt' ? Math.sqrt(r.y) : method === 'shift' ? r.y + operand : r.y * operand }))
  if (transformed.some(r => !Number.isFinite(r.y))) throw new Error('The transform produced a nonfinite outcome.')
  return transformed
}
export function welchAnova(rows: AnovaObservation[]) {
  const groups = oneWayAnova(rows).groups, k = groups.length
  if (k < 2 || groups.some(g => g.n < 2 || !(g.sd > 0))) return null
  const weights = groups.map(g => g.n / g.sd ** 2), total = weights.reduce((s, w) => s + w, 0)
  const weightedMean = groups.reduce((s, g, i) => s + weights[i] * g.mean, 0) / total
  const c = groups.reduce((s, g, i) => s + (1 - weights[i] / total) ** 2 / (g.n - 1), 0)
  const f = groups.reduce((s, g, i) => s + weights[i] * (g.mean - weightedMean) ** 2, 0) / ((k - 1) * (1 + 2 * (k - 2) * c / (k * k - 1)))
  const df1 = k - 1, df2 = (k * k - 1) / (3 * c)
  return { f, df1, df2, p: pTailF(f, df1, df2), weightedMean }
}
export function plannedContrast(rows: AnovaObservation[], weights: number[], alpha: number) {
  const r = oneWayAnova(rows, alpha)
  if (weights.length !== r.k || weights.some(w => !Number.isFinite(w)) || Math.abs(weights.reduce((s, w) => s + w, 0)) > 1e-8 || !weights.some(w => w !== 0)) throw new Error('Enter one finite weight per group, summing to zero, with at least one nonzero weight.')
  const estimate = r.groups.reduce((s, g, i) => s + weights[i] * g.mean, 0)
  const se = Math.sqrt(r.msw * r.groups.reduce((s, g, i) => s + weights[i] ** 2 / g.n, 0))
  if (!(se > 0)) throw new Error('The contrast has no estimable standard error.')
  const t = estimate / se, margin = qt(1 - alpha / 2, r.dfW) * se
  return { estimate, se, t, df: r.dfW, p: pTailT(t, r.dfW, 'two-sided'), low: estimate - margin, high: estimate + margin }
}
export function permutationAnova(rows: AnovaObservation[], iterations: number, seed: number) {
  if (validateLabData(rows, 'one-way-anova')) throw new Error('Use valid independent-group data.')
  const count = Math.floor(iterations)
  if (!Number.isFinite(seed) || count < 100 || count > 2000 || count * rows.length > 1_000_000) throw new Error('Use 100–2,000 shuffles and at most one million shuffled observations.')
  const observed = oneWayAnova(rows).f, rng = seededRandom(seed), values = rows.map(r => r.y)
  if (!Number.isFinite(observed)) throw new Error('The observed F is not estimable.')
  let extreme = 0
  for (let i = 0; i < count; i++) { const ys = shuffle(values, rng); if (oneWayAnova(rows.map((r, j) => ({ ...r, y: ys[j] }))).f >= observed - 1e-12) extreme++ }
  const p = (extreme + 1) / (count + 1)
  return { observed, p, iterations: count, mcse: Math.sqrt(p * (1 - p) / (count + 1)) }
}
export type LabPair = { a: string; b: string; diff: number; se: number; df: number; pRaw: number; pAdj: number; low: number; high: number; effect: number }
export function extendedPairs(rows: AnovaObservation[], method: 'bonferroni' | 'bh' | 'games-howell', alpha: number): LabPair[] {
  const r = oneWayAnova(rows, alpha), pairs: LabPair[] = []
  const m = r.k * (r.k - 1) / 2
  for (let i = 0; i < r.k; i++) for (let j = i + 1; j < r.k; j++) {
    const a = r.groups[i], b = r.groups[j], va = a.sd ** 2 / a.n, vb = b.sd ** 2 / b.n
    const diff = a.mean - b.mean, se = Math.sqrt(method === 'games-howell' ? va + vb : r.msw * (1 / a.n + 1 / b.n))
    const df = method === 'games-howell' ? (va + vb) ** 2 / (va ** 2 / (a.n - 1) + vb ** 2 / (b.n - 1)) : r.dfW
    const pRaw = se > 0 && df > 0 ? pTailT(diff / se, df, 'two-sided') : NaN
    let margin = qt(1 - alpha / (method === 'bonferroni' ? 2 * m : 2), df) * se
    let pAdj = method === 'bonferroni' ? Math.min(1, m * pRaw) : pRaw
    if (method === 'games-howell' && r.k > 2 && se > 0 && df > 0) {
      pAdj = Math.max(0, Math.min(1, 1 - ptukey(Math.abs(diff / se) * Math.SQRT2, r.k, df)))
      let lo = 0, hi = 100
      for (let z = 0; z < 45; z++) { const mid = (lo + hi) / 2; if (ptukey(mid, r.k, df) < 1 - alpha) lo = mid; else hi = mid }
      margin = (lo + hi) / 2 * se / Math.SQRT2
    }
    const pooled = Math.sqrt(((a.n - 1) * a.sd ** 2 + (b.n - 1) * b.sd ** 2) / (a.n + b.n - 2))
    pairs.push({ a: a.name, b: b.name, diff, se, df, pRaw, pAdj, low: diff - margin, high: diff + margin, effect: pooled > 0 ? diff / pooled * (1 - 3 / (4 * (a.n + b.n - 2) - 1)) : NaN })
  }
  if (method === 'bh' && pairs.every(p => Number.isFinite(p.pRaw))) adjustP(pairs.map(p => p.pRaw), 'bh').forEach((p, i) => { pairs[i].pAdj = p })
  return pairs
}
export function pairedComparisons(r: RmResult, alpha: number): LabPair[] {
  const pairs: LabPair[] = [], m = r.k * (r.k - 1) / 2
  for (let i = 0; i < r.k; i++) for (let j = i + 1; j < r.k; j++) {
    const ds = r.subjects.map(s => s.values[i] - s.values[j]), diff = mean(ds), sd = sampleSd(ds), se = sd / Math.sqrt(ds.length), df = ds.length - 1
    const pRaw = se > 0 ? pTailT(diff / se, df, 'two-sided') : diff === 0 ? 1 : 0
    const margin = qt(1 - alpha / (2 * m), df) * se
    pairs.push({ a: r.conditions[i], b: r.conditions[j], diff, se, df, pRaw, pAdj: pRaw, low: diff - margin, high: diff + margin, effect: sd > 0 ? diff / sd : NaN })
  }
  if (pairs.length) adjustP(pairs.map(p => p.pRaw), 'holm').forEach((p, i) => { pairs[i].pAdj = p })
  return pairs
}
export function correctedRepeated(r: RmResult, correction: string) {
  const eps = correction === 'gg' ? r.sphericity.epsGG : correction === 'hf' ? r.sphericity.epsHF : 1
  const epsilon = r.k === 2 ? 1 : eps
  if (epsilon === undefined || !Number.isFinite(epsilon) || !(epsilon > 0)) return null
  const df1 = r.dfCond * epsilon, df2 = r.dfErr * epsilon
  return { epsilon, df1, df2, f: r.f, p: Number.isFinite(r.f) ? pTailF(r.f, df1, df2) : NaN }
}
export function residualAudit(rows: AnovaObservation[]) {
  const r = oneWayAnova(rows)
  return rows.map(row => {
    const g = r.groups.find(g => g.name === row.a)!, residual = row.y - g.mean
    const studentized = r.msw > 0 ? residual / Math.sqrt(r.msw * (1 - 1 / g.n)) : NaN
    const q1 = quantile(g.values, .25), q3 = quantile(g.values, .75)
    return { ...row, residual, fitted: g.mean, studentized, outlier: row.y < q1 - 1.5 * (q3 - q1) || row.y > q3 + 1.5 * (q3 - q1) }
  })
}
export function labCsv(headers: string[], rows: unknown[][]) {
  const safe = (v: unknown) => typeof v === 'string' && /^[=+@\-\t\r]/.test(v) ? `'${v}` : v
  return Papa.unparse({ fields: headers.map(h => String(safe(h))), data: rows.map(r => r.map(safe)) })
}
export function labSession(text: string, slug: string) {
  const raw: unknown = JSON.parse(text)
  if (!raw || typeof raw !== 'object') throw new Error('Invalid session.')
  const s = raw as Record<string, unknown>
  if (s.version !== 1 || s.lab !== slug || !Array.isArray(s.rows) || typeof s.alpha !== 'number' || ![.01, .05, .1].includes(s.alpha)) throw new Error('Choose a version 1 session for this lab with a supported alpha.')
  if (s.rows.some(r => !r || typeof r !== 'object' || typeof r.id !== 'string' || typeof r.a !== 'string' || typeof r.y !== 'number' || r.b !== undefined && typeof r.b !== 'string' || r.subject !== undefined && typeof r.subject !== 'string' || r.time !== undefined && (typeof r.time !== 'string' || r.time !== r.a))) throw new Error('Session rows have invalid fields.')
  const rows = s.rows as AnovaObservation[], error = validateLabData(rows, slug)
  if (error) throw new Error(error)
  return { rows, alpha: s.alpha }
}
