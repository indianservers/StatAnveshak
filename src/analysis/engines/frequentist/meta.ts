import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailChi, pnorm } from './dists'
import { lm } from './linalg'
import { asFiniteNumber, round } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

export type MaStudy = { yi: number; sei: number; label: string; a?: number; b?: number; c?: number; d?: number }

export function hedgesG(n1: number, m1: number, s1: number, n2: number, m2: number, s2: number): { yi: number; sei: number } {
  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2))
  const d = (m1 - m2) / (sp || 1)
  const j = 1 - 3 / (4 * (n1 + n2) - 9)
  const yi = j * d
  const sei = Math.sqrt((n1 + n2) / (n1 * n2) + (yi * yi) / (2 * (n1 + n2)))
  return { yi, sei }
}

export function logOr(a: number, b: number, c: number, d: number): { yi: number; sei: number } {
  const aa = a + 0.5
  const bb = b + 0.5
  const cc = c + 0.5
  const dd = d + 0.5
  const yi = Math.log((aa * dd) / (bb * cc))
  const sei = Math.sqrt(1 / aa + 1 / bb + 1 / cc + 1 / dd)
  return { yi, sei }
}

export function derSimonianLaird(studies: MaStudy[]): { muFe: number; muRe: number; tau2: number; seFe: number; seRe: number; Q: number } {
  const w = studies.map((s) => 1 / (s.sei * s.sei))
  const sw = w.reduce((s, v) => s + v, 0)
  const muFe = studies.reduce((s, st, i) => s + w[i]! * st.yi, 0) / sw
  const Q = studies.reduce((s, st, i) => s + w[i]! * (st.yi - muFe) ** 2, 0)
  const c = sw - w.reduce((s, v) => s + v * v, 0) / sw
  const k = studies.length
  const tau2 = Math.max(0, (Q - (k - 1)) / (c || 1))
  const wr = studies.map((st) => 1 / (st.sei * st.sei + tau2))
  const swr = wr.reduce((s, v) => s + v, 0)
  const muRe = studies.reduce((s, st, i) => s + wr[i]! * st.yi, 0) / swr
  return { muFe, muRe, tau2, seFe: Math.sqrt(1 / sw), seRe: Math.sqrt(1 / swr), Q }
}

function mhPeto(studies: MaStudy[]) {
  const usable = studies.filter((s) => s.a !== undefined)
  if (usable.length < 1) return null
  let num = 0
  let den = 0
  let oe = 0
  let v = 0
  for (const s of usable) {
    const a = (s.a ?? 0) + 0
    const b = s.b ?? 0
    const c = s.c ?? 0
    const d = s.d ?? 0
    const n = a + b + c + d
    if (n <= 0) continue
    num += (a * d) / n
    den += (b * c) / n
    const n1 = a + b
    const n2 = c + d
    const m1 = a + c
    const e = (n1 * m1) / n
    const vv = (n1 * n2 * m1 * (b + d)) / (n * n * (n - 1 || 1))
    oe += a - e
    v += vv
  }
  return {
    mh: den === 0 ? Number.POSITIVE_INFINITY : num / den,
    peto: Math.exp(oe / (v || 1e-12)),
  }
}

function collectStudies(rows: Record<string, unknown>[], options: AnalysisOptions): MaStudy[] {
  const yiCol = String(options.yi ?? '')
  const seiCol = String(options.sei ?? '')
  const labelCol = String(options.study ?? '')
  const studies: MaStudy[] = []
  if (yiCol && seiCol) {
    rows.forEach((row, i) => {
      const yi = asFiniteNumber(row[yiCol])
      const sei = asFiniteNumber(row[seiCol])
      if (yi === null || sei === null || sei <= 0) return
      studies.push({ yi, sei, label: labelCol ? String(row[labelCol] ?? i + 1) : String(i + 1) })
    })
    return studies
  }
  const n1 = String(options.n1 ?? '')
  const m1 = String(options.mean1 ?? '')
  const sd1 = String(options.sd1 ?? '')
  const n2 = String(options.n2 ?? '')
  const m2 = String(options.mean2 ?? '')
  const sd2 = String(options.sd2 ?? '')
  if (n1 && m1 && sd1 && n2 && m2 && sd2) {
    rows.forEach((row, i) => {
      const a = asFiniteNumber(row[n1])
      const b = asFiniteNumber(row[m1])
      const c = asFiniteNumber(row[sd1])
      const d = asFiniteNumber(row[n2])
      const e = asFiniteNumber(row[m2])
      const f = asFiniteNumber(row[sd2])
      if ([a, b, c, d, e, f].some((v) => v === null) || (a ?? 0) < 2 || (d ?? 0) < 2) return
      const g = hedgesG(a!, b!, c!, d!, e!, f!)
      studies.push({ ...g, label: String(i + 1) })
    })
    return studies
  }
  const a = String(options.events1 ?? '')
  const b = String(options.nonevents1 ?? '')
  const c = String(options.events2 ?? '')
  const d = String(options.nonevents2 ?? '')
  if (a && b && c && d) {
    rows.forEach((row, i) => {
      const aa = asFiniteNumber(row[a])
      const bb = asFiniteNumber(row[b])
      const cc = asFiniteNumber(row[c])
      const dd = asFiniteNumber(row[d])
      if ([aa, bb, cc, dd].some((v) => v === null)) return
      const lor = logOr(aa!, bb!, cc!, dd!)
      studies.push({ ...lor, a: aa!, b: bb!, c: cc!, d: dd!, label: String(i + 1) })
    })
  }
  return studies
}

export function runMeta(rows: Record<string, unknown>[], options: AnalysisOptions, analysisId = 'meta.analysis'): AnalysisResult {
  const title = analysisId === 'cochrane.ma' ? 'Cochrane Meta-Analyses' : 'Meta-Analysis'
  const studies = collectStudies(rows, options)
  if (studies.length < 2) return empty(analysisId, title, 'Need at least two studies with yi/sei, two-group means, or 2×2 counts.')
  const dl = derSimonianLaird(studies)
  const zFe = dl.muFe / dl.seFe
  const zRe = dl.muRe / dl.seRe
  const df = studies.length - 1
  const pQ = pTailChi(dl.Q, df)
  const i2 = Math.max(0, (dl.Q - df) / (dl.Q || 1))
  const mh = mhPeto(studies)
  const wls = lm(studies.map((s) => s.yi), studies.map((s) => [1, s.sei]))
  const peese = lm(studies.map((s) => s.yi), studies.map((s) => [1, s.sei * s.sei]))
  const medSe = [...studies.map((s) => s.sei)].sort((a, b) => a - b)[Math.floor(studies.length / 2)] ?? 0
  const adequate = studies.filter((s) => s.sei <= medSe)
  const waap = adequate.length >= 2 ? derSimonianLaird(adequate) : dl
  const xs = studies.map((s) => s.yi)
  const ys = studies.map((s) => 1 / s.sei)
  return {
    analysisId,
    title,
    interpretation: `Fixed-effect μ = ${round(dl.muFe)} (SE ${round(dl.seFe)}), random-effects (DL) μ = ${round(dl.muRe)} (τ² = ${round(dl.tau2)}). Heterogeneity Q = ${round(dl.Q)} on ${df} df (I² = ${round(100 * i2)}%). PET intercept ${round(wls?.beta[0] ?? Number.NaN)}; PEESE intercept ${round(peese?.beta[0] ?? Number.NaN)}; WAAP-WLS μ = ${round(waap.muFe)}.`,
    assumptions: ['Studies are independent. DL τ² is moment-based. PET/PEESE are weighted least squares of yi on SE / SE². Cochrane continuous and dichotomous analyses share this engine.'],
    footnotes: [
      'MH/Peto odds ratios appear when 2×2 counts are supplied. Bayesian MA uses a normal–normal posterior with τ fixed at the DL estimate (not MCMC). MA-SEM is the independence-vs-saturated BIC on the study-level covariance of (yi).',
    ],
    tables: [
      { id: 'pool', title: 'Pooled effects', columns: ['Model', 'μ', 'SE', 'z', 'p'], rows: [
        ['Fixed effect', round(dl.muFe), round(dl.seFe), round(zFe), round(2 * (1 - pnorm(Math.abs(zFe))))],
        ['Random effects (DL)', round(dl.muRe), round(dl.seRe), round(zRe), round(2 * (1 - pnorm(Math.abs(zRe))))],
        ['WAAP-WLS', round(waap.muFe), round(waap.seFe), round(waap.muFe / waap.seFe), round(2 * (1 - pnorm(Math.abs(waap.muFe / waap.seFe))))],
      ] },
      { id: 'het', title: 'Heterogeneity and bias', columns: ['Q', 'df', 'p', 'τ²', 'I²', 'PET', 'PEESE'], rows: [[round(dl.Q), df, round(pQ), round(dl.tau2), round(100 * i2), round(wls?.beta[0] ?? Number.NaN), round(peese?.beta[0] ?? Number.NaN)]] },
      ...(mh ? [{ id: 'or', title: 'Dichotomous (MH / Peto)', columns: ['MH OR', 'Peto OR'], rows: [[round(mh.mh), round(mh.peto)]] }] : []),
      { id: 'studies', title: 'Study effects', columns: ['Study', 'yi', 'sei'], rows: studies.map((s) => [s.label, round(s.yi), round(s.sei)]) },
    ],
    plots: [{
      id: 'funnel',
      title: 'Funnel (1/SE vs yi)',
      data: [
        { type: 'scatter', mode: 'markers', x: xs, y: ys, text: studies.map((s) => s.label) },
        { type: 'scatter', mode: 'lines', x: [dl.muFe, dl.muFe], y: [Math.min(...ys), Math.max(...ys)], name: 'FE' },
      ],
      layout: { xaxis: { title: 'yi' }, yaxis: { title: '1/SE' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runBayesianMeta(rows: Record<string, unknown>[], options: AnalysisOptions, analysisId = 'meta.analysis'): AnalysisResult {
  const freq = runMeta(rows, options, analysisId)
  const studies = collectStudies(rows, options)
  if (studies.length < 2) return freq
  const dl = derSimonianLaird(studies)
  const priorPrec = 1 / 100
  const likePrec = 1 / (dl.seRe * dl.seRe)
  const postPrec = priorPrec + likePrec
  const postMu = (priorPrec * 0 + likePrec * dl.muRe) / postPrec
  const postSe = Math.sqrt(1 / postPrec)
  const pPos = 1 - pnorm(-postMu / postSe)
  return {
    ...freq,
    interpretation: `Bayesian normal–normal MA (τ fixed at DL ${round(dl.tau2)}): posterior μ = ${round(postMu)} (SE ${round(postSe)}), P(μ>0) = ${round(pPos)}. ${freq.interpretation}`,
    footnotes: [...freq.footnotes, 'Prior μ ~ N(0, 10²). This is conjugate updating, not a full hierarchical MCMC selection model.'],
    tables: [
      ...freq.tables,
      { id: 'bayes', title: 'Posterior of μ', columns: ['mean', 'SE', 'P(μ>0)'], rows: [[round(postMu), round(postSe), round(pPos)]] },
    ],
  }
}
