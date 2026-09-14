import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailChi } from './dists'
import { asFiniteNumber, mean, round } from './numeric'
import { logChoose } from '../bayesian/special'

export function binomCdf(n: number, k: number, p: number): number {
  if (p <= 0) return k >= 0 ? 1 : 0
  if (p >= 1) return k >= n ? 1 : 0
  let s = 0
  for (let i = 0; i <= k; i++) s += Math.exp(logChoose(n, i) + i * Math.log(p) + (n - i) * Math.log(1 - p))
  return Math.min(1, s)
}

export function runAcceptanceAttribute(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const n = Math.max(1, Math.floor(Number(options.n ?? 50)))
  const c = Math.max(0, Math.floor(Number(options.c ?? 1)))
  const aql = Number(options.aql ?? 0.01)
  const ltpd = Number(options.ltpd ?? 0.06)
  const defectsCol = String(options.defects ?? '')
  const lot = defectsCol ? rows.map((r) => asFiniteNumber(r[defectsCol])).filter((v): v is number => v !== null) : []
  const observed = lot.length ? lot[0]! : Number(options.observed ?? 0)
  const paAql = binomCdf(n, c, aql)
  const paLtpd = binomCdf(n, c, ltpd)
  const decision = observed <= c ? 'Accept lot' : 'Reject lot'
  const ps = Array.from({ length: 21 }, (_, i) => i / 200)
  const oc = ps.map((p) => binomCdf(n, c, p))
  return {
    analysisId: 'acceptance.attribute',
    title: 'Attribute Sampling',
    interpretation: `Plan n = ${n}, c = ${c}. P(accept | AQL ${aql}) = ${round(paAql)}; P(accept | LTPD ${ltpd}) = ${round(paLtpd)}. Observed defects ${observed}: ${decision}.`,
    assumptions: ['Binomial (or hypergeometric-with-replacement) i.i.d. defectives. Producer risk ≈ 1 − Pa(AQL); consumer risk ≈ Pa(LTPD).'],
    footnotes: ['Create/analyze uses the same OC curve. Bayesian mode puts a Beta prior on p and reports P(p > AQL | x).'],
    tables: [{
      id: 'plan',
      title: 'Plan',
      columns: ['n', 'c', 'Pa(AQL)', 'Pa(LTPD)', 'Observed', 'Decision'],
      rows: [[n, c, round(paAql), round(paLtpd), observed, decision]],
    }],
    plots: [{
      id: 'oc',
      title: 'OC curve',
      data: [{ type: 'scatter', mode: 'lines', x: ps, y: oc }],
      layout: { xaxis: { title: 'p' }, yaxis: { title: 'P(accept)' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runAcceptanceVariable(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = String(options.variable ?? '')
  const x = yName ? rows.map((r) => asFiniteNumber(r[yName])).filter((v): v is number => v !== null) : []
  const n = x.length || Math.max(2, Math.floor(Number(options.n ?? 20)))
  const usl = Number(options.usl ?? 10)
  const k = Number(options.k ?? 1.64)
  const m = x.length ? mean(x) : Number(options.mean ?? usl - k)
  const s = x.length > 1 ? Math.sqrt(x.reduce((a, v) => a + (v - m) ** 2, 0) / (x.length - 1)) : Number(options.sd ?? 1)
  const z = (usl - m) / ((s || 1e-12) / Math.sqrt(n))
  const accept = m + k * s <= usl
  return {
    analysisId: 'acceptance.variable',
    title: 'Variable Sampling',
    interpretation: `k-method (unknown σ): n = ${n}, k = ${k}. ${accept ? 'Accept' : 'Reject'} because x̄ + ks = ${round(m + k * s)} vs USL ${usl}.`,
    assumptions: ['Normal measurements, one-sided USL. Known-σ plans replace s with σ0 when you set SD in options and have no column.'],
    footnotes: ['This is the ANSI/ASQ Z1.9-style k comparison, not a full switching-score system.'],
    tables: [{
      id: 'plan',
      title: 'Variable plan',
      columns: ['n', 'x̄', 's', 'k', 'x̄+ks', 'USL', 'z vs USL', 'Decision'],
      rows: [[n, round(m), round(s), k, round(m + k * s), usl, round(z), accept ? 'Accept' : 'Reject']],
    }],
    plots: [{
      id: 'hist',
      title: 'Sample',
      data: [{ type: 'histogram', x: x.length ? x : [m], nbinsx: 12 }],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}

export function leadingDigit(x: number): number {
  const v = Math.abs(x)
  if (!Number.isFinite(v) || v === 0) return 0
  const exp = Math.floor(Math.log10(v))
  return Math.floor(v / 10 ** exp)
}

export function benfordExpected(d: number): number {
  return Math.log10(1 + 1 / d)
}

export function runAuditSampling(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const N = Math.max(1, Math.floor(Number(options.N ?? rows.length ?? 1000)))
  const p = Number(options.p ?? 0.05)
  const e = Number(options.precision ?? 0.02)
  const z = Number(options.z ?? 1.96)
  const n = Math.min(N, Math.ceil((N * z * z * p * (1 - p)) / ((N - 1) * e * e + z * z * p * (1 - p))))
  const book = String(options.bookValue ?? '')
  const audit = String(options.auditValue ?? '')
  let taint = 0
  let m = 0
  if (book && audit) {
    for (const row of rows) {
      const b = asFiniteNumber(row[book])
      const a = asFiniteNumber(row[audit])
      if (b === null || a === null || b === 0) continue
      m += 1
      taint += Math.abs(b - a) / Math.abs(b)
    }
  }
  const meanTaint = m ? taint / m : Number(options.observedRate ?? 0)
  const mle = meanTaint
  const se = Math.sqrt(Math.max(mle * (1 - mle), 0) / Math.max(m || n, 1))
  return {
    analysisId: 'audit.sampling',
    title: 'Audit Sampling',
    interpretation: `Planning n = ${n} from N = ${N} (p₀ = ${p}, precision ${e}). Mean taint ${round(mle)}; 95% Wald interval [${round(mle - z * se)}, ${round(mle + z * se)}].`,
    assumptions: ['Sample-size formula is the finite-population proportion plan. Evaluation uses mean taint of book vs audit amounts when both columns are assigned.'],
    footnotes: ['Bayesian evaluation uses a Beta(1,1) prior updated with n taints treated as Bernoulli.'],
    tables: [{
      id: 'plan',
      title: 'Plan and evaluation',
      columns: ['N', 'n', 'Mean taint', 'SE', 'z'],
      rows: [[N, n, round(mle), round(se), z]],
    }],
    plots: [],
  }
}

export function runAuditData(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const amount = String(options.amount ?? '')
  const group = String(options.group ?? '')
  const outcome = String(options.outcome ?? '')
  const x = amount ? rows.map((r) => asFiniteNumber(r[amount])).filter((v): v is number => v !== null && v !== 0) : []
  const counts = Array(9).fill(0)
  for (const v of x) {
    const d = leadingDigit(v)
    if (d >= 1 && d <= 9) counts[d - 1] += 1
  }
  const n = x.length
  let chi = 0
  if (n) {
    for (let d = 1; d <= 9; d++) {
      const exp = n * benfordExpected(d)
      chi += (counts[d - 1]! - exp) ** 2 / (exp || 1)
    }
  }
  const pBen = n ? pTailChi(chi, 8) : 1
  const seen = new Map<string, number>()
  for (const row of rows) {
    const key = amount ? String(row[amount]) : JSON.stringify(row)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  const repeats = [...seen.values()].filter((c) => c > 1).length
  let fairness = '—'
  if (group && outcome) {
    const cells = new Map<string, { pos: number; n: number }>()
    for (const row of rows) {
      const g = String(row[group] ?? '')
      const y = asFiniteNumber(row[outcome]) ?? (String(row[outcome]) === '1' ? 1 : 0)
      const c = cells.get(g) ?? { pos: 0, n: 0 }
      c.n += 1
      if (y > 0) c.pos += 1
      cells.set(g, c)
    }
    const rates = [...cells.values()].map((c) => c.pos / Math.max(c.n, 1))
    fairness = rates.length ? String(round(Math.max(...rates) - Math.min(...rates))) : '—'
  }
  return {
    analysisId: 'audit.data',
    title: 'Data Auditing',
    interpretation: `Benford first-digit χ² = ${round(chi)} (p = ${round(pBen)}) on ${n} amounts. Repeated values: ${repeats} keys. Fairness gap (max−min positive rate) = ${fairness}.`,
    assumptions: ['Benford applies to numbers spanning orders of magnitude. Fairness is demographic parity on a binary outcome, not equalized odds.'],
    footnotes: ['Repeated-value counts treat the amount (or whole row) as the key.'],
    tables: [
      { id: 'benford', title: 'First digits', columns: ['Digit', 'Observed', 'Expected'], rows: Array.from({ length: 9 }, (_, i) => [i + 1, counts[i]!, n ? round(n * benfordExpected(i + 1)) : 0]) },
      { id: 'other', title: 'Repeats and fairness', columns: ['Repeated keys', 'Fairness gap'], rows: [[repeats, fairness]] },
    ],
    plots: [{
      id: 'ben',
      title: 'Benford',
      data: [
        { type: 'bar', name: 'Observed', x: [1, 2, 3, 4, 5, 6, 7, 8, 9], y: counts },
        { type: 'scatter', mode: 'lines+markers', name: 'Benford', x: [1, 2, 3, 4, 5, 6, 7, 8, 9], y: Array.from({ length: 9 }, (_, i) => n * benfordExpected(i + 1)) },
      ],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}


