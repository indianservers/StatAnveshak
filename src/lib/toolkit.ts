import { qt } from '../analysis/engines/frequentist/dists'
import { inverse, lm, multiply, multiplyVec, transpose } from '../analysis/engines/frequentist/linalg'
export type ToolRow = Record<string, unknown>
export const isMissing = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')
export const numberValue = (v: unknown): number | null => isMissing(v) || typeof v === 'boolean' || typeof v === 'object' || !Number.isFinite(Number(v)) ? null : Number(v)
export const valuesFor = (rows: ToolRow[], col: string) => rows.map(r => numberValue(r[col])).filter((n): n is number => n !== null)
export const average = (a: number[]) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN
export const variance = (a: number[]) => { const mean = average(a); return a.length > 1 ? a.reduce((s, x) => s + (x - mean) ** 2, 0) / (a.length - 1) : NaN }
export function quantile(a: number[], p: number) { const s = [...a].sort((x, y) => x - y); const k = (s.length - 1) * p; return s[Math.floor(k)] + (s[Math.ceil(k)] - s[Math.floor(k)]) * (k % 1) }
export function seededRandom(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export function shuffle<T>(a: T[], random: () => number) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
export function meanInterval(a: number[], level = .95) { if (a.length < 2 || !(level > 0 && level < 1)) throw new Error('Need at least two observations and a confidence level between 0 and 1.'); const mean = average(a), se = Math.sqrt(variance(a) / a.length), margin = qt((1 + level) / 2, a.length - 1) * se; return { n: a.length, mean, se, low: mean - margin, high: mean + margin } }
export function bootstrapMean(a: number[], iterations = 1000, seed = 42, level = .95) {
  if (a.length < 2) throw new Error('Bootstrap requires at least two finite observations.')
  if (!Number.isFinite(iterations) || !Number.isFinite(seed) || !(level > 0 && level < 1) || a.some(v => !Number.isFinite(v))) throw new Error('Check finite resampling inputs and confidence level.')
  const count = Math.max(100, Math.min(5000, Math.floor(iterations))), rng = seededRandom(seed)
  if (a.length * count > 5_000_000) throw new Error('This run exceeds five million resampled observations. Reduce the iterations or select a smaller dataset.')
  const means = Array.from({ length: count }, () => average(Array.from({ length: a.length }, () => a[Math.floor(rng() * a.length)])))
  return { mean: average(a), low: quantile(means, (1 - level) / 2), high: quantile(means, (1 + level) / 2), means, iterations: count }
}
export function permutationMean(a: number[], b: number[], iterations = 1000, seed = 42) {
  if (a.length < 2 || b.length < 2) throw new Error('Select two groups with at least two complete observations each.')
  if (![iterations, seed, ...a, ...b].every(Number.isFinite)) throw new Error('Permutation inputs must be finite.')
  const observed = average(a) - average(b), pooled = [...a, ...b], rng = seededRandom(seed)
  const count = Math.max(100, Math.min(5000, Math.floor(iterations)))
  if (pooled.length * count > 5_000_000) throw new Error('This run exceeds five million shuffled observations. Reduce the iterations or dataset size.')
  const differences = Array.from({ length: count }, () => { const s = shuffle(pooled, rng); return average(s.slice(0, a.length)) - average(s.slice(a.length)) })
  return { observed, p: (1 + differences.filter(d => Math.abs(d) >= Math.abs(observed) - 1e-12).length) / (count + 1), differences, iterations: count }
}
export function effectSize(a: number[], b: number[]) { if (a.length < 2 || b.length < 2) throw new Error('Need two groups with at least two observations.'); const df = a.length + b.length - 2, sd = Math.sqrt(((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / df); if (!sd) throw new Error('Effect size is undefined when pooled variation is zero.'); const d = (average(a) - average(b)) / sd; return { d, g: d * (1 - 3 / (4 * df - 1)), pooledSD: sd } }
export function adjustP(p: number[], method: 'holm' | 'bh') {
  if (!p.length || p.some(v => !Number.isFinite(v) || v < 0 || v > 1)) throw new Error('Enter p-values between 0 and 1.')
  const sorted = p.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v), out = [...p]
  if (method === 'holm') { let last = 0; sorted.forEach((r, j) => { last = Math.max(last, Math.min(1, r.v * (p.length - j))); out[r.i] = last }) }
  else { let last = 1; for (let j = p.length - 1; j >= 0; j--) { last = Math.min(last, sorted[j].v * p.length / (j + 1)); out[sorted[j].i] = last } }
  return out
}
export function missingProfile(rows: ToolRow[], cols: string[]) {
  const counts = cols.map(c => [c, rows.filter(r => isMissing(r[c])).length, rows.length ? rows.filter(r => isMissing(r[c])).length / rows.length * 100 : 0] as const)
  const patterns = new Map<string, number>(); rows.forEach(r => { const key = cols.filter(c => isMissing(r[c])).join(', ') || 'Complete'; patterns.set(key, (patterns.get(key) ?? 0) + 1) })
  return { counts, patterns: [...patterns].sort((a, b) => b[1] - a[1]) }
}
export function duplicateIndices(rows: ToolRow[], cols: string[]) { if (!cols.length) throw new Error('Choose at least one duplicate key column.'); const seen = new Set<string>(), indices: number[] = []; rows.forEach((r, i) => { const k = JSON.stringify(cols.map(c => r[c] ?? null)); if (seen.has(k)) indices.push(i); else seen.add(k) }); return indices }
export function outlierIndices(rows: ToolRow[], col: string, method = 'iqr', threshold = 1.5) {
  if (!Number.isFinite(threshold) || threshold <= 0) throw new Error('Use a positive outlier threshold.')
  const a = valuesFor(rows, col); if (a.length < 3) throw new Error('Need at least three finite values for outlier review.')
  const med = quantile(a, .5), mad = quantile(a.map(v => Math.abs(v - med)), .5), mean = average(a), sd = Math.sqrt(variance(a)), q1 = quantile(a, .25), q3 = quantile(a, .75)
  return rows.flatMap((r, i) => { const v = numberValue(r[col]); if (v === null) return []; const flag = method === 'z' ? sd > 0 && Math.abs((v - mean) / sd) > threshold : method === 'mad' ? mad > 0 && Math.abs(.67448975 * (v - med) / mad) > threshold : v < q1 - threshold * (q3 - q1) || v > q3 + threshold * (q3 - q1); return flag ? [i] : [] })
}
export type PrepConfig = { column: string; output: string; method: string; group: string; other: string; constant: number; mapping: string; minimum: number; maximum: number; required: boolean; expected: string; threshold: number; keys: string[]; categoryOrder?: string }
export function parseCategoryOrder(text = '[]'): string[] { const raw: unknown = JSON.parse(text); if (!Array.isArray(raw) || raw.some(v => typeof v !== 'string') || new Set(raw).size !== raw.length) throw new Error('Category order must be a JSON array of unique strings.'); return raw as string[] }
export function prepareRows(rows: ToolRow[], feature: string, config: PrepConfig) {
  const { column, output, method, group, other, constant } = config
  if (!rows.length) throw new Error('Load a dataset first.')
  if (!(column in rows[0]) && !['duplicates'].includes(feature)) throw new Error('Choose an existing column.')
  const a = valuesFor(rows, column)
  if (['transform', 'scale', 'dates'].includes(feature) && (!output.trim() || Object.hasOwn(rows[0], output))) throw new Error('Choose a new, non-empty output column name.')
  if (['__proto__', 'constructor', 'prototype'].includes(output)) throw new Error('Choose a different column name.')
  if (feature === 'duplicates') { const remove = new Set(duplicateIndices(rows, config.keys)); return rows.filter((_, i) => !remove.has(i)).map(r => ({ ...r })) }
  if (feature === 'outliers') { const remove = new Set(outlierIndices(rows, column, method, config.threshold)); return rows.filter((_, i) => !remove.has(i)).map(r => ({ ...r })) }
  let mapping: Record<string, unknown> = {}
  if (feature === 'recode') { const parsed: unknown = JSON.parse(config.mapping); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Mapping must be a JSON object.'); mapping = parsed as Record<string, unknown>; if (Object.values(mapping).some(v => v !== null && typeof v === 'object')) throw new Error('Use scalar replacement values.'); parseCategoryOrder(config.categoryOrder) }
  if (feature === 'impute' && method !== 'constant' && !a.length) throw new Error('No finite values are available to calculate an imputation.')
  const mean = average(a), median = quantile(a, .5), sd = Math.sqrt(variance(a)), lo = a.reduce((m, v) => Math.min(m, v), Infinity), hi = a.reduce((m, v) => Math.max(m, v), -Infinity)
  const groupMeans = new Map<unknown, number>()
  if (feature === 'impute' && method === 'group') { if (!group) throw new Error('Choose an imputation group.'); const groups = new Map<unknown, number[]>(); rows.forEach(r => { const v = numberValue(r[column]); if (v !== null && !isMissing(r[group])) { const bucket = groups.get(r[group]) ?? []; bucket.push(v); groups.set(r[group], bucket) } }); groups.forEach((values, key) => groupMeans.set(key, average(values))) }
  if (['impute', 'transform'].includes(feature) && !Number.isFinite(constant)) throw new Error('Use a finite constant operand.')
  if (feature === 'scale' && (method === 'z' ? !(sd > 0) : !(hi > lo))) throw new Error('Cannot scale a constant column or fewer than two finite observations.')
  return rows.map(r => {
    const copy = { ...r }, v = numberValue(r[column])
    if (feature === 'impute' && isMissing(r[column])) {
      if (method === 'group' && !groupMeans.has(r[group])) throw new Error('A group has no observed values; choose another imputation method.')
      copy[column] = method === 'constant' ? constant : method === 'median' ? median : method === 'group' ? groupMeans.get(r[group])! : mean
    }
    if (feature === 'recode' && Object.hasOwn(mapping, String(r[column]))) copy[column] = mapping[String(r[column])]
    if (feature === 'scale') copy[output] = v === null ? null : method === 'z' ? (v - mean) / sd : (v - lo) / (hi - lo)
    if (feature === 'transform') {
      const b = other ? numberValue(r[other]) : constant
      const result = v === null || b === null ? NaN : method === 'add' ? v + b : method === 'subtract' ? v - b : method === 'multiply' ? v * b : method === 'divide' ? v / b : method === 'log' ? Math.log(v) : method === 'sqrt' ? Math.sqrt(v) : v * v
      copy[output] = Number.isFinite(result) ? result : null
    }
    if (feature === 'dates') {
      const t = isMissing(r[column]) ? NaN : Date.parse(String(r[column])), d = new Date(t), t2 = isMissing(r[other]) ? NaN : Date.parse(String(r[other]))
      copy[output] = !Number.isFinite(t) ? null : method === 'year' ? d.getUTCFullYear() : method === 'month' ? d.getUTCMonth() + 1 : method === 'weekday' ? d.getUTCDay() : method === 'days' ? Number.isFinite(t2) ? (t - t2) / 86400000 : null : d.toISOString().slice(0, 10)
    }
    return copy
  })
}
export function validationRows(rows: ToolRow[], config: PrepConfig) { return rows.flatMap((r, i) => { const v = r[config.column], n = numberValue(v), issues: string[] = []; if (isMissing(v)) { if (config.required) issues.push('Required value missing') } else if (config.expected === 'numeric') { if (n === null) issues.push('Not a finite number'); else if (n < config.minimum || n > config.maximum) issues.push('Outside allowed range') } else if (config.expected === 'date' && !Number.isFinite(Date.parse(String(v)))) issues.push('Invalid date'); return issues.map(issue => [i + 1, String(v ?? ''), issue]) }) }
export function compareDatasets(a: ToolRow[], b: ToolRow[], key: string) {
  if (!key || duplicateIndices(a, [key]).length || duplicateIndices(b, [key]).length || [...a, ...b].some(r => isMissing(r[key]))) throw new Error('Comparison requires a unique, non-missing key in both datasets.')
  const map = new Map(b.map(r => [JSON.stringify(r[key]), r])), changes: (string | number)[][] = []
  a.forEach(r => { const k = JSON.stringify(r[key]), other = map.get(k); if (!other) changes.push([String(r[key]), 'Removed', '', '']); else { new Set([...Object.keys(r), ...Object.keys(other)]).forEach(c => { if (JSON.stringify(r[c]) !== JSON.stringify(other[c])) changes.push([String(r[key]), c, String(r[c] ?? ''), String(other[c] ?? '')]) }); map.delete(k) } }); map.forEach(r => changes.push([String(r[key]), 'Added', '', ''])); return changes
}
export function datasetFingerprint(rows: ToolRow[]) { let hash = 2166136261; const text = JSON.stringify(rows); for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619); return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}` }
export function regressionData(rows: ToolRow[], y: string, predictors: string[]) { if (!predictors.length || predictors.includes(y)) throw new Error('Select predictors distinct from the outcome.'); const cases = rows.flatMap(r => { const yy = numberValue(r[y]), xx = predictors.map(c => numberValue(r[c])); return yy === null || xx.some(v => v === null) ? [] : [{ y: yy, x: [1, ...xx as number[]] }] }); if (cases.length <= predictors.length + 2) throw new Error('Not enough complete cases for this model.'); return cases }
export function linearFitSummary(rows: ToolRow[], y: string, predictors: string[]) {
  const cases = regressionData(rows, y, predictors), fit = lm(cases.map(r => r.y), cases.map(r => r.x))
  if (!fit) throw new Error('The model is singular.')
  const n = cases.length, p = fit.beta.length, mean = average(cases.map(r => r.y)), sst = cases.reduce((s, r) => s + (r.y - mean) ** 2, 0), rSquared = sst > 0 ? 1 - fit.sse / sst : NaN
  const deviance = fit.sse > 0 ? n * (Math.log(2 * Math.PI) + 1 + Math.log(fit.sse / n)) : NaN
  return { n, rSquared, adjustedRSquared: 1 - (1 - rSquared) * (n - 1) / fit.dfResidual, aic: deviance + 2 * (p + 1), bic: deviance + Math.log(n) * (p + 1) }
}
export function crossValidate(rows: ToolRow[], y: string, predictors: string[], folds: number, repeats: number, seed: number) {
  const cases = regressionData(rows, y, predictors), k = Math.floor(folds), times = Math.floor(repeats)
  if (![folds, repeats, seed].every(Number.isFinite) || !Number.isInteger(folds) || !Number.isInteger(repeats) || k < 2 || k > Math.min(10, cases.length) || times < 1 || times > 10) throw new Error('Use integer 2–10 folds (no more than the complete cases) and 1–10 repeats, with a finite seed.')
  const rng = seededRandom(seed), results: number[][] = []
  for (let r = 0; r < times; r++) { const order = shuffle(cases, rng); for (let f = 0; f < k; f++) { const train = order.filter((_, i) => i % k !== f), test = order.filter((_, i) => i % k === f); const fit = lm(train.map(t => t.y), train.map(t => t.x)); if (!fit || fit.dfResidual <= 0) throw new Error('A training fold is singular or too small; reduce folds or predictors.'); const errors = test.map(t => t.y - t.x.reduce((s, v, j) => s + v * fit.beta[j], 0)); results.push([r + 1, f + 1, test.length, Math.sqrt(average(errors.map(e => e * e))), average(errors.map(Math.abs))]) } }
  return { results, rmse: Math.sqrt(results.reduce((s, r) => s + r[2] * r[3] ** 2, 0) / results.reduce((s, r) => s + r[2], 0)), complete: cases.length }
}
export function predictLinear(rows: ToolRow[], y: string, predictors: string[], inputs: number[], level = .95) {
  const cases = regressionData(rows, y, predictors), X = cases.map(t => t.x), fit = lm(cases.map(t => t.y), X)
  if (!fit || inputs.length !== predictors.length || inputs.some(v => !Number.isFinite(v))) throw new Error('The model is singular or prediction inputs are invalid.')
  const covariance = inverse(multiply(transpose(X), X)); if (!covariance) throw new Error('Cannot estimate prediction uncertainty.')
  const x = [1, ...inputs], leverage = x.reduce((s, v, i) => s + v * multiplyVec(covariance, x)[i], 0), value = x.reduce((s, v, i) => s + v * fit.beta[i], 0), margin = qt((1 + level) / 2, fit.dfResidual) * Math.sqrt(fit.sse / fit.dfResidual * (1 + leverage))
  return { value, low: value - margin, high: value + margin, coefficients: fit.beta }
}
export function decompose(a: number[], period: number) {
  const p = Math.floor(period); if (p < 2 || a.length < p * 2) throw new Error('Choose a period of at least two with at least two full seasons.')
  // A symmetric moving average; even periods use half weights on the two endpoints.
  const half = Math.floor(p / 2), trend = a.map((_, i) => i < half || i + half >= a.length ? null : p % 2 ? average(a.slice(i - half, i + half + 1)) : (a[i - half] / 2 + a[i + half] / 2 + a.slice(i - half + 1, i + half).reduce((s, v) => s + v, 0)) / p)
  const seasonal = Array.from({ length: p }, (_, phase) => average(a.flatMap((v, i) => i % p === phase && trend[i] !== null ? [v - trend[i]!] : [])))
  const center = average(seasonal), season = a.map((_, i) => seasonal[i % p] - center)
  return a.map((v, i) => [i + 1, v, trend[i], season[i], trend[i] === null ? null : v - trend[i]! - season[i]])
}
export function forecastCompare(a: number[], holdout: number, period: number) {
  const h = Math.floor(holdout), p = Math.floor(period); if (h < 1 || a.length - h < Math.max(3, p) || p < 1) throw new Error('Leave at least one season and three training observations before the holdout.')
  const train = a.slice(0, -h), test = a.slice(-h), last = train.at(-1)!, slope = (last - train[0]) / (train.length - 1)
  return ['Naïve', 'Drift', 'Seasonal naïve'].map((name, method) => { const predicted = test.map((_, i) => method === 0 ? last : method === 1 ? last + slope * (i + 1) : train[train.length - p + i % p]); const errors = test.map((v, i) => v - predicted[i]); return { name, predicted, rmse: Math.sqrt(average(errors.map(e => e * e))), mae: average(errors.map(Math.abs)) } })
}
export function simulateSampling(n: number, trials: number, mean: number, sd: number, bias: number, seed: number) {
  if (![n, trials, mean, sd, bias, seed].every(Number.isFinite) || !Number.isInteger(n) || !Number.isInteger(trials) || n < 2 || n > 500 || trials < 100 || trials > 2000 || !(sd > 0)) throw new Error('Use integer sample size 2–500, integer trials 100–2000, positive population SD, and finite settings.')
  const rng = seededRandom(seed), normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng())
  const samples = Array.from({ length: Math.floor(trials) }, () => Array.from({ length: Math.floor(n) }, () => mean + bias + sd * normal()))
  const intervals = samples.map(s => meanInterval(s)), means = intervals.map(i => i.mean), covered = intervals.filter(i => i.low <= mean && i.high >= mean).length / trials, rejected = intervals.filter(i => i.low > 0 || i.high < 0).length / trials
  return { means, coverage: covered, rejectionRate: rejected, average: average(means), standardError: Math.sqrt(variance(means)), theoreticalSE: sd / Math.sqrt(n) }
}
