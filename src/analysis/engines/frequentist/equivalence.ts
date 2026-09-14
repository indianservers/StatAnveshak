import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailT, qt } from './dists'
import { groupedNumeric, numericValues, pairedComplete, round } from './numeric'
import { asAlternative, oneSampleT, studentT, welchT } from './ttests'

function empty(message: string): AnalysisResult {
  return { analysisId: 'equivalence.t', title: 'Equivalence T-Tests', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

export function runEquivalenceT(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const design = String(options.design ?? 'independent')
  const delta = Math.abs(Number(options.delta ?? 0.5))
  const alpha = Number(options.alpha ?? 0.05)
  const alternative = asAlternative('two-sided')
  void alternative

  let diff: number
  let se: number
  let df: number
  let label: string
  if (design === 'paired') {
    const m1 = String(options.measure1 ?? '')
    const m2 = String(options.measure2 ?? '')
    const pairs = pairedComplete(rows, m1, m2)
    if (pairs.length < 2) return empty('Need at least two complete pairs.')
    const diffs = pairs.map((p) => p.x - p.y)
    const t = oneSampleT(diffs, 0)
    diff = t.mean
    se = t.se
    df = t.df
    label = `${m1} − ${m2}`
  } else if (design === 'one-sample') {
    const variable = String(options.variable ?? '')
    const mu0 = Number(options.mu0 ?? 0)
    const x = numericValues(rows, variable)
    if (x.length < 2) return empty('Need at least two observations.')
    const t = oneSampleT(x, mu0)
    diff = t.mean - mu0
    se = t.se
    df = t.df
    label = `${variable} − ${mu0}`
  } else {
    const dependent = String(options.dependent ?? '')
    const group = String(options.group ?? '')
    const groups = groupedNumeric(rows, group, dependent)
    if (groups.length !== 2) return empty('Independent TOST needs a grouping variable with two levels.')
    const welch = options.equalVariance !== true && options.equalVariance !== 'true'
    const t = welch ? welchT(groups[0].values, groups[1].values) : studentT(groups[0].values, groups[1].values)
    diff = t.diff
    se = t.se
    df = t.df
    label = `${groups[0].name} − ${groups[1].name}`
  }

  const tLower = (diff - (-delta)) / se
  const tUpper = (delta - diff) / se
  const pLower = pTailT(tLower, df, 'greater')
  const pUpper = pTailT(tUpper, df, 'greater')
  const pTost = Math.max(pLower, pUpper)
  const equiv = pTost < alpha
  const crit = qt(1 - alpha, df)
  const ciLo = diff - crit * se
  const ciHi = diff + crit * se
  const ciInside = ciLo > -delta && ciHi < delta

  return {
    analysisId: 'equivalence.t',
    title: 'Equivalence T-Tests',
    interpretation: equiv
      ? `TOST rejects both one-sided nulls at α = ${alpha}: the ${alpha * 100}% CI for ${label} lies inside [−${delta}, ${delta}]. Combined p = ${round(pTost)}.`
      : `TOST does not establish equivalence at α = ${alpha}. Combined p = ${round(pTost)}. The ${round((1 - 2 * alpha) * 100, 1)}% TOST CI is [${round(ciLo)}, ${round(ciHi)}] vs bounds [−${delta}, ${delta}].`,
    assumptions: [
      'TOST uses two one-sided t-tests: H0: δ ≤ −Δ and H0: δ ≥ Δ. Equivalence is concluded only if both are rejected at α.',
      'The (1 − 2α) CI is the Schuirmann/Westlake interval; it lying inside [−Δ, Δ] is equivalent to both one-sided tests at α.',
    ],
    footnotes: [
      `Equivalence bounds are ±${delta} on the mean-difference scale (not Cohen’s d).`,
      'Bayesian equivalence tests arrive in Phase 4.',
    ],
    tables: [{
      id: 'tost',
      title: 'TOST',
      columns: ['Test', 't', 'df', 'p', 'Decision'],
      rows: [
        ['Lower (δ > −Δ)', round(tLower), round(df, 4), round(pLower), pLower < alpha ? 'reject' : 'retain'],
        ['Upper (δ < Δ)', round(tUpper), round(df, 4), round(pUpper), pUpper < alpha ? 'reject' : 'retain'],
        ['Combined TOST', '—', round(df, 4), round(pTost), equiv ? 'equivalent' : 'not equivalent'],
      ],
    }, {
      id: 'ci',
      title: `CI vs bounds (α = ${alpha})`,
      columns: ['Estimate', 'SE', `CI low`, `CI high`, '−Δ', '+Δ', 'CI inside bounds'],
      rows: [[round(diff), round(se), round(ciLo), round(ciHi), -delta, delta, ciInside ? 'yes' : 'no']],
    }],
    plots: [{
      id: 'bounds',
      title: 'Estimate and equivalence bounds',
      data: [
        { type: 'scatter', mode: 'markers', x: [diff], y: [0], name: 'estimate', error_x: { type: 'data', array: [crit * se], visible: true } },
        { type: 'scatter', mode: 'markers', x: [-delta, delta], y: [0, 0], name: 'bounds', marker: { symbol: 'line-ns-open', size: 18, color: '#be123c' } },
      ],
      layout: { xaxis: { title: label }, yaxis: { visible: false }, margin: { t: 40, r: 20, b: 48, l: 40 } },
    }],
  }
}
