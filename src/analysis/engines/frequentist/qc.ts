import type { AnalysisOptions, AnalysisResult } from '../../types'
import { lm } from './linalg'
import { asFiniteNumber, mean, round, sampleSd, sampleVariance } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function col(rows: Record<string, unknown>[], name: string): number[] {
  return rows.map((r) => asFiniteNumber(r[name])).filter((v): v is number => v !== null)
}

export function processCapability(x: number[], lsl: number, usl: number, target?: number) {
  const m = mean(x)
  const s = sampleSd(x)
  const cp = (usl - lsl) / (6 * (s || 1e-12))
  const cpu = (usl - m) / (3 * (s || 1e-12))
  const cpl = (m - lsl) / (3 * (s || 1e-12))
  const cpk = Math.min(cpu, cpl)
  const t = target ?? (lsl + usl) / 2
  const cpm = (usl - lsl) / (6 * Math.sqrt((s || 0) ** 2 + (m - t) ** 2))
  return { mean: m, sd: s, cp, cpk, cpu, cpl, pp: cp, cpm, target: t }
}

export function runQcMsa(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const kind = String(options.msaKind ?? 'type1')
  const yName = String(options.measurement ?? '')
  const y = col(rows, yName)
  if (y.length < 5) return empty('qc.msa', 'Measurement Systems Analysis', 'Need a measurement column.')
  const ref = Number(options.reference ?? mean(y))
  const tol = Number(options.tolerance ?? 6 * (sampleSd(y) || 1))
  if (kind === 'type1' || kind === 'testretest') {
    const s = sampleSd(y)
    const cg = (0.2 * tol) / (6 * (s || 1e-12))
    const bias = mean(y) - ref
    return {
      analysisId: 'qc.msa',
      title: 'Measurement Systems Analysis',
      interpretation: `Type 1 / test–retest: bias = ${round(bias)}, Cg = ${round(cg)} (20% of tolerance / 6σ_ms).`,
      assumptions: ['Repeat measurements of one reference. Cg uses the 20% conventional fraction of tolerance.'],
      footnotes: ['Type 2–4 gauge R&R uses part and operator factors when assigned.'],
      tables: [{ id: 't1', title: 'Type 1', columns: ['n', 'Mean', 'SD', 'Bias', 'Cg', 'Tolerance'], rows: [[y.length, round(mean(y)), round(s), round(bias), round(cg), round(tol)]] }],
      plots: [{ id: 'run', title: 'Run chart', data: [{ type: 'scatter', mode: 'lines+markers', y }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } }],
    }
  }
  const part = String(options.part ?? '')
  const op = String(options.operator ?? '')
  const groups = new Map<string, number[]>()
  for (const row of rows) {
    const yi = asFiniteNumber(row[yName])
    if (yi === null) continue
    const key = `${String(row[part] ?? '')}\t${String(row[op] ?? '')}`
    const g = groups.get(key) ?? []
    g.push(yi)
    groups.set(key, g)
  }
  const cellMeans = [...groups.values()].map((g) => mean(g))
  const within = [...groups.values()].flatMap((g) => {
    const m = mean(g)
    return g.map((v) => (v - m) ** 2)
  })
  const mse = within.reduce((s, v) => s + v, 0) / Math.max(y.length - groups.size, 1)
  const sigmaRepeat = Math.sqrt(Math.max(mse, 0))
  const nbar = mean([...groups.values()].map((g) => g.length))
  const sigmaRepro = Math.sqrt(Math.max(sampleVariance(cellMeans) - mse / (nbar || 1), 0))
  const sigmaGRR = Math.hypot(sigmaRepeat, sigmaRepro)
  const ndc = Math.max(1, Math.sqrt(2) * ((sampleSd(y) || 1) / (sigmaGRR || 1e-12)))
  const agree = String(options.standard ?? '')
  let attr: number | string = '—'
  if (agree) {
    let match = 0
    let n = 0
    for (const row of rows) {
      if (row[yName] === undefined || row[agree] === undefined) continue
      n += 1
      if (String(row[yName]) === String(row[agree])) match += 1
    }
    attr = n ? round(match / n) : '—'
  }
  return {
    analysisId: 'qc.msa',
    title: 'Measurement Systems Analysis',
    interpretation: `Gauge R&R: σ_repeat = ${round(sigmaRepeat)}, σ_repro = ${round(sigmaRepro)}, GRR = ${round(sigmaGRR)}, ndc ≈ ${round(ndc)}.`,
    assumptions: ['Crossed part × operator ANOVA approximation using cell means.'],
    footnotes: ['Attribute agreement is the fraction matching a standard column when provided.'],
    tables: [{
      id: 'grr',
      title: 'Gauge R&R',
      columns: ['σ_repeat', 'σ_repro', 'GRR', 'ndc', 'Attr. agreement'],
      rows: [[round(sigmaRepeat), round(sigmaRepro), round(sigmaGRR), round(ndc), attr]],
    }],
    plots: [{ id: 'cells', title: 'Cell means', data: [{ type: 'bar', y: cellMeans }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } }],
  }
}

export function runQcCharts(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = String(options.variable ?? '')
  const y = col(rows, yName)
  if (y.length < 6) return empty('qc.charts', 'Control Charts', 'Need a numeric series.')
  const kind = String(options.chartKind ?? 'individuals')
  const m = mean(y)
  const s = sampleSd(y)
  const mr = y.slice(1).map((v, i) => Math.abs(v - y[i]!))
  const mrBar = mean(mr.length ? mr : [s])
  const d2 = 1.128
  let center = m
  let ucl = m + 3 * (mrBar / d2)
  let lcl = m - 3 * (mrBar / d2)
  let series = y
  let title = 'I-MR individuals'
  if (kind === 'xbar' || kind === 'subgroup') {
    const g = Math.max(2, Math.floor(Number(options.subgroup ?? 5)))
    const means: number[] = []
    for (let i = 0; i + g <= y.length; i += g) means.push(mean(y.slice(i, i + g)))
    series = means
    const a2 = 0.577
    const rBar = mean(means.map((_, i) => {
      const sl = y.slice(i * g, i * g + g)
      return Math.max(...sl) - Math.min(...sl)
    }))
    center = mean(means)
    ucl = center + a2 * rBar
    lcl = center - a2 * rBar
    title = 'X̄ chart'
  }
  if (kind === 'p' || kind === 'attributes') {
    const n = Number(options.sampleSize ?? 50)
    const p = y.map((v) => v / n)
    series = p
    center = mean(p)
    const se = Math.sqrt(center * (1 - center) / n)
    ucl = center + 3 * se
    lcl = Math.max(0, center - 3 * se)
    title = 'p chart'
  }
  if (kind === 'ewma') {
    const lam = 0.2
    const z: number[] = []
    let prev = m
    for (const v of y) {
      prev = lam * v + (1 - lam) * prev
      z.push(prev)
    }
    series = z
    const se = s * Math.sqrt(lam / (2 - lam))
    ucl = m + 3 * se
    lcl = m - 3 * se
    title = 'EWMA'
  }
  if (kind === 'cusum') {
    const k = 0.5 * s
    let pos = 0
    const c: number[] = []
    for (const v of y) {
      pos = Math.max(0, pos + (v - m) - k)
      c.push(pos)
    }
    series = c
    center = 0
    ucl = 5 * s
    lcl = 0
    title = 'CUSUM+'
  }
  if (kind === 'g' || kind === 'rare') {
    const gaps: number[] = []
    let last = -1
    y.forEach((v, i) => {
      if (v > 0) {
        if (last >= 0) gaps.push(i - last)
        last = i
      }
    })
    series = gaps.length ? gaps : y
    center = mean(series)
    ucl = center + 3 * Math.sqrt(Math.max(center, 0))
    lcl = 0
    title = 'g-chart (rare events)'
  }
  const beyond = series.filter((v) => v > ucl || v < lcl).length
  return {
    analysisId: 'qc.charts',
    title: 'Control Charts',
    interpretation: `${title}: center ${round(center)}, LCL ${round(lcl)}, UCL ${round(ucl)}. Points beyond limits: ${beyond}.`,
    assumptions: ['I-MR uses moving-range d2 = 1.128. X̄ uses A2 ≈ 0.577 for n=5. EWMA λ = 0.2. CUSUM k = 0.5σ.'],
    footnotes: ['Western Electric runs rules are not applied; only 3σ limits are drawn.'],
    tables: [{ id: 'lim', title: 'Limits', columns: ['Center', 'LCL', 'UCL', 'Beyond'], rows: [[round(center), round(lcl), round(ucl), beyond]] }],
    plots: [{
      id: 'cc',
      title,
      data: [
        { type: 'scatter', mode: 'lines+markers', y: series, name: 'series' },
        { type: 'scatter', mode: 'lines', y: series.map(() => ucl), name: 'UCL' },
        { type: 'scatter', mode: 'lines', y: series.map(() => center), name: 'CL' },
        { type: 'scatter', mode: 'lines', y: series.map(() => lcl), name: 'LCL' },
      ],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}

export function runQcCapability(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const y = col(rows, String(options.variable ?? ''))
  if (y.length < 5) return empty('qc.capability', 'Process Capability', 'Need a numeric process column.')
  const lsl = Number(options.lsl ?? mean(y) - 3 * sampleSd(y))
  const usl = Number(options.usl ?? mean(y) + 3 * sampleSd(y))
  const cap = processCapability(y, lsl, usl, Number(options.target ?? (lsl + usl) / 2))
  return {
    analysisId: 'qc.capability',
    title: 'Process Capability',
    interpretation: `Cp = ${round(cap.cp)}, Cpk = ${round(cap.cpk)}, Cpm = ${round(cap.cpm)}. Mean ${round(cap.mean)} vs specs [${round(lsl)}, ${round(usl)}].`,
    assumptions: ['Normal process, independent observations. Pp equals Cp when the same overall s is used.'],
    footnotes: ['Z_bench = 3 Cpk under normality.'],
    tables: [{
      id: 'cap',
      title: 'Capability',
      columns: ['Mean', 'SD', 'Cp', 'Cpk', 'Cpl', 'Cpu', 'Cpm'],
      rows: [[round(cap.mean), round(cap.sd), round(cap.cp), round(cap.cpk), round(cap.cpl), round(cap.cpu), round(cap.cpm)]],
    }],
    plots: [{
      id: 'hist',
      title: 'Process vs specs',
      data: [{ type: 'histogram', x: y, nbinsx: 20 }],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}

export function runQcDoe(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = String(options.response ?? '')
  const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
  const kind = String(options.doeKind ?? 'factorial')
  if (!yName || factors.length < 1) return empty('qc.doe', 'Design of Experiments', 'Assign a response and at least one factor.')
  const pack: number[][] = []
  const y: number[] = []
  for (const row of rows) {
    const yi = asFiniteNumber(row[yName])
    const xs = factors.map((f) => asFiniteNumber(row[f]))
    if (yi === null || xs.some((v) => v === null)) continue
    y.push(yi)
    pack.push(xs as number[])
  }
  if (y.length < factors.length + 3) return empty('qc.doe', 'Design of Experiments', 'Need complete experimental runs.')
  const mus = factors.map((_, j) => mean(pack.map((r) => r[j]!)))
  const rng = factors.map((_, j) => {
    const vals = pack.map((r) => r[j]!)
    return (Math.max(...vals) - Math.min(...vals)) / 2 || 1
  })
  const coded = pack.map((row) => row.map((v, j) => (v - mus[j]!) / rng[j]!))
  const X = coded.map((row) => {
    const base = [1, ...row]
    if (kind === 'rsm') return [...base, ...row.map((v) => v * v), ...(row.length > 1 ? [row[0]! * row[1]!] : [])]
    if (row.length >= 2) return [...base, row[0]! * row[1]!]
    return base
  })
  const names = kind === 'rsm'
    ? ['Intercept', ...factors, ...factors.map((f) => `${f}²`), ...(factors.length > 1 ? [`${factors[0]}:${factors[1]}`] : [])]
    : ['Intercept', ...factors, ...(factors.length > 1 ? [`${factors[0]}:${factors[1]}`] : [])]
  const fit = lm(y, X)
  if (!fit) return empty('qc.doe', 'Design of Experiments', 'Singular design matrix.')
  const r2 = 1 - fit.sse / y.reduce((s, yi) => s + (yi - mean(y)) ** 2, 0)
  return {
    analysisId: 'qc.doe',
    title: 'Design of Experiments',
    interpretation: `${kind === 'rsm' ? 'Response-surface (linear + squares + 2-way)' : '2-level factorial'} OLS. R² = ${round(r2)}.`,
    assumptions: ['Factors are coded from observed min/max to roughly ±1. This analyzes an existing worksheet; it does not generate a design grid.'],
    footnotes: ['Main-effect plots use coded slopes.'],
    tables: [{ id: 'coef', title: 'Effects', columns: ['Term', 'Estimate'], rows: names.map((n, i) => [n, round(fit.beta[i] ?? 0)]) }],
    plots: [{
      id: 'fit',
      title: 'Observed vs fitted',
      data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y }],
      layout: { margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
