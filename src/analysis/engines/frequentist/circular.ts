import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailChi, pTailF } from './dists'
import { asFiniteNumber, round } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function toRad(values: number[], unit: string): number[] {
  if (unit === 'radians') return values
  return values.map((v) => (v * Math.PI) / 180)
}

export function circularStats(theta: number[]): { C: number; S: number; R: number; mu: number; sd: number; kappa: number } {
  const n = theta.length
  const C = theta.reduce((s, a) => s + Math.cos(a), 0) / n
  const S = theta.reduce((s, a) => s + Math.sin(a), 0) / n
  const R = Math.hypot(C, S)
  const mu = Math.atan2(S, C)
  const sd = Math.sqrt(Math.max(0, -2 * Math.log(Math.max(R, 1e-12))))
  const kappa = R < 0.53
    ? 2 * R + R * R * R + (5 * R ** 5) / 6
    : R < 0.85
      ? -0.4 + 1.39 * R + 0.43 / (1 - R)
      : 1 / (R * R * R - 4 * R * R + 3 * R)
  return { C, S, R, mu, sd, kappa }
}

function wrapPi(a: number): number {
  let x = a
  while (x <= -Math.PI) x += 2 * Math.PI
  while (x > Math.PI) x -= 2 * Math.PI
  return x
}

export function runCircularDescriptives(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const unit = String(options.angleUnit ?? 'degrees')
  const raw: number[] = []
  for (const row of rows) {
    const v = asFiniteNumber(row[variable])
    if (v !== null) raw.push(v)
  }
  if (raw.length < 3) return empty('circular.descriptives', 'Circular Descriptives', 'Assign an angle column.')
  const theta = toRad(raw, unit)
  const s = circularStats(theta)
  const muDisp = unit === 'degrees' ? (s.mu * 180) / Math.PI : s.mu
  const bins = Array(36).fill(0)
  for (const a of theta) {
    let u = a
    if (u < 0) u += 2 * Math.PI
    bins[Math.min(35, Math.floor((u / (2 * Math.PI)) * 36))]++
  }
  return {
    analysisId: 'circular.descriptives',
    title: 'Circular Descriptives',
    interpretation: `Mean direction = ${round(muDisp)} ${unit}, resultant length R = ${round(s.R)}, circular SD = ${round(s.sd)} rad, von Mises κ̂ = ${round(s.kappa)}.`,
    assumptions: ['Angles are i.i.d. on the circle. κ uses Banerjee–Dhillon–Ghosh–Sra approximations.'],
    footnotes: ['R = 1 means no circular dispersion; R = 0 is uniform on the circle.'],
    tables: [{
      id: 'circ',
      title: 'Circular location',
      columns: ['n', 'Mean direction', 'R', 'Circular SD (rad)', 'κ'],
      rows: [[raw.length, round(muDisp), round(s.R), round(s.sd), round(s.kappa)]],
    }],
    plots: [{
      id: 'rose',
      title: 'Rose (36 bins)',
      data: [{ type: 'barpolar', r: bins, theta: bins.map((_, i) => i * 10) }],
      layout: { polar: { radialaxis: { visible: true } }, margin: { t: 40, r: 16, b: 40, l: 16 } },
    }],
  }
}

export function runCircularTests(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const group = String(options.group ?? '')
  const unit = String(options.angleUnit ?? 'degrees')
  const mu0 = Number(options.mu0 ?? 0)
  const mu0Rad = unit === 'degrees' ? (mu0 * Math.PI) / 180 : mu0
  const items: { a: number; g: string }[] = []
  for (const row of rows) {
    const v = asFiniteNumber(row[variable])
    if (v === null) continue
    items.push({ a: toRad([v], unit)[0], g: group ? String(row[group] ?? '') : 'All' })
  }
  if (items.length < 5) return empty('circular.tests', 'Circular Hypothesis Tests', 'Need at least five angles.')
  const all = items.map((i) => i.a)
  const s = circularStats(all)
  const n = all.length
  const rayleigh = 2 * n * s.R * s.R
  const vTest = s.R * Math.cos(wrapPi(s.mu - mu0Rad))
  const vStat = Math.sqrt(2 * n) * vTest
  const groups = [...new Set(items.map((i) => i.g))]
  let ww = ''
  if (groups.length >= 2) {
    const stats = groups.map((g) => circularStats(items.filter((i) => i.g === g).map((i) => i.a)))
    const ns = groups.map((g) => items.filter((i) => i.g === g).length)
    const rBar = stats.reduce((acc, st, i) => acc + ns[i] * st.R, 0) / n
    const k = groups.length
    const F = ((n - k) * (k - 1) === 0) ? Number.NaN : ((n - k) / (k - 1)) * (rBar - s.R) / Math.max(1e-12, 1 - rBar)
    ww = `Watson–Williams F = ${round(F)} on (${k - 1}, ${n - k}) df, p ≈ ${round(pTailF(Math.max(0, F), k - 1, n - k))}.`
  }
  return {
    analysisId: 'circular.tests',
    title: 'Circular Hypothesis Tests',
    interpretation: `Rayleigh uniformity: 2nR² = ${round(rayleigh)}, p = ${round(pTailChi(rayleigh, 2))}. V-test vs μ₀ = ${round(mu0)}: z = ${round(vStat)}. ${ww}`,
    assumptions: ['Rayleigh is the score test of uniformity vs a von Mises alternative. The V-test is the specified-angle Rayleigh. Watson–Williams assumes similar concentration across groups.'],
    footnotes: ['Angles wrap on (−π, π]. Multi-sample needs a grouping column.'],
    tables: [{
      id: 'tests',
      title: 'Circular tests',
      columns: ['Test', 'Statistic', 'n', 'R'],
      rows: [
        ['Rayleigh 2nR²', round(rayleigh), n, round(s.R)],
        ['V-test z', round(vStat), n, round(s.R)],
      ],
    }],
    plots: [{
      id: 'unit',
      title: 'Unit circle',
      data: [{ type: 'scatter', mode: 'markers', x: all.map(Math.cos), y: all.map(Math.sin) }],
      layout: { xaxis: { scaleanchor: 'y', title: 'cos' }, yaxis: { title: 'sin' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
