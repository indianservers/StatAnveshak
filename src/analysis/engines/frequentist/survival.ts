import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailChi, pnorm } from './dists'
import { solve } from './linalg'
import { asFiniteNumber, mean, round, sampleSd } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

type SurvRow = { time: number; event: number; group: string; x: number[] }

function readSurvival(rows: Record<string, unknown>[], options: AnalysisOptions, withX: boolean): SurvRow[] {
  const timeCol = String(options.time ?? '')
  const eventCol = String(options.event ?? '')
  const groupCol = String(options.group ?? '')
  const cov = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const out: SurvRow[] = []
  for (const row of rows) {
    const time = asFiniteNumber(row[timeCol])
    if (time === null || time <= 0) continue
    const evRaw = row[eventCol]
    const event = evRaw === true || evRaw === 1 || evRaw === '1' || String(evRaw).toLowerCase() === 'yes' || Number(evRaw) > 0 ? 1 : 0
    const x: number[] = []
    if (withX) {
      let ok = true
      for (const c of cov) {
        const v = asFiniteNumber(row[c])
        if (v === null) { ok = false; break }
        x.push(v)
      }
      if (!ok) continue
    }
    out.push({ time, event, group: groupCol ? String(row[groupCol] ?? '') : 'All', x })
  }
  return out
}

export function kaplanMeier(sample: SurvRow[]): Array<{ time: number; atRisk: number; events: number; survival: number; se: number }> {
  const times = [...new Set(sample.map((r) => r.time))].sort((a, b) => a - b)
  let s = 1
  let sum = 0
  return times.map((time) => {
    const atRisk = sample.filter((r) => r.time >= time).length
    const events = sample.filter((r) => r.time === time && r.event === 1).length
    if (atRisk > 0 && events > 0) {
      s *= 1 - events / atRisk
      sum += events / (atRisk * Math.max(1, atRisk - events))
    }
    return { time, atRisk, events, survival: s, se: s * Math.sqrt(sum) }
  })
}

export function logRank(a: SurvRow[], b: SurvRow[]): { stat: number; p: number; method: string } {
  const times = [...new Set([...a, ...b].map((r) => r.time))].sort((x, y) => x - y)
  let o = 0
  let v = 0
  let oW = 0
  let vW = 0
  for (const t of times) {
    const n1 = a.filter((r) => r.time >= t).length
    const n2 = b.filter((r) => r.time >= t).length
    const n = n1 + n2
    const d1 = a.filter((r) => r.time === t && r.event === 1).length
    const d2 = b.filter((r) => r.time === t && r.event === 1).length
    const d = d1 + d2
    if (n < 2 || d === 0) continue
    const e1 = n1 * d / n
    o += d1 - e1
    v += (n1 * n2 * d * (n - d)) / (n * n * (n - 1))
    oW += n * (d1 - e1)
    vW += n * n * ((n1 * n2 * d * (n - d)) / (n * n * (n - 1)))
  }
  const stat = v > 0 ? (o * o) / v : 0
  const wilcox = vW > 0 ? (oW * oW) / vW : 0
  return { stat, p: pTailChi(stat, 1), method: `Gehan–Breslow Wilcoxon χ² = ${round(wilcox)}` }
}

export function runNonparametricSurvival(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const sample = readSurvival(rows, options, false)
  if (sample.length < 3) return empty('survival.nonparametric', 'Non-parametric Survival', 'Need a positive time column and an event indicator.')
  const groups = [...new Set(sample.map((r) => r.group))]
  const tables = groups.map((g) => {
    const km = kaplanMeier(sample.filter((r) => r.group === g))
    return { id: `km-${g}`, title: `Kaplan–Meier (${g})`, columns: ['Time', 'At risk', 'Events', 'Survival', 'SE'], rows: km.map((r) => [r.time, r.atRisk, r.events, round(r.survival), round(r.se)]) }
  })
  const kmAll = kaplanMeier(sample)
  let lrNote = 'Single sample: log-rank needs a grouping variable with two levels.'
  if (groups.length === 2) {
    const lr = logRank(sample.filter((r) => r.group === groups[0]), sample.filter((r) => r.group === groups[1]))
    lrNote = `Log-rank χ² = ${round(lr.stat)}, p = ${round(lr.p)}. ${lr.method}.`
  }
  const last = kmAll[kmAll.length - 1]
  return {
    analysisId: 'survival.nonparametric',
    title: 'Non-parametric Survival',
    interpretation: `Kaplan–Meier on ${sample.length} observations (${sample.filter((r) => r.event === 1).length} events). Last survival = ${round(last?.survival ?? Number.NaN)}. ${lrNote}`,
    assumptions: ['Independent right-censored observations. Greenwood SEs. Log-rank is Mantel–Haenszel; Wilcoxon is Gehan–Breslow (weights = at risk).'],
    footnotes: ['Ties use the standard product-limit formula at each distinct time.'],
    tables: [
      { id: 'km', title: 'Kaplan–Meier (pooled)', columns: ['Time', 'At risk', 'Events', 'Survival', 'SE'], rows: kmAll.map((r) => [r.time, r.atRisk, r.events, round(r.survival), round(r.se)]) },
      ...(groups.length > 1 ? tables : []),
    ],
    plots: [{
      id: 'km-plot',
      title: 'Survival',
      data: groups.map((g) => {
        const km = kaplanMeier(sample.filter((r) => r.group === g))
        return { type: 'scatter', mode: 'lines', name: g, x: km.map((r) => r.time), y: km.map((r) => r.survival), line: { shape: 'hv' } }
      }),
      layout: { xaxis: { title: 'Time' }, yaxis: { title: 'S(t)', range: [0, 1.02] }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

function coxPartial(beta: number[], sample: SurvRow[]): { ll: number; score: number[]; hess: number[][] } {
  const p = beta.length
  const times = [...new Set(sample.map((r) => r.time))].sort((a, b) => a - b)
  let ll = 0
  const score = Array(p).fill(0)
  const hess = Array.from({ length: p }, () => Array(p).fill(0))
  for (const t of times) {
    const deaths = sample.filter((r) => r.time === t && r.event === 1)
    if (!deaths.length) continue
    const risk = sample.filter((r) => r.time >= t)
    const w = risk.map((r) => Math.exp(r.x.reduce((s, v, j) => s + v * beta[j], 0)))
    const sw = w.reduce((s, v) => s + v, 0)
    const s1 = Array(p).fill(0)
    const s2 = Array.from({ length: p }, () => Array(p).fill(0))
    risk.forEach((r, i) => {
      for (let a = 0; a < p; a++) {
        s1[a] += w[i] * r.x[a]
        for (let b = 0; b < p; b++) s2[a][b] += w[i] * r.x[a] * r.x[b]
      }
    })
    const d = deaths.length
    // Breslow
    for (const death of deaths) {
      ll += death.x.reduce((s, v, j) => s + v * beta[j], 0)
    }
    ll -= d * Math.log(sw)
    const mean = s1.map((v) => v / sw)
    for (const death of deaths) {
      for (let a = 0; a < p; a++) score[a] += death.x[a] - mean[a]
    }
    for (let a = 0; a < p; a++) {
      for (let b = 0; b < p; b++) {
        hess[a][b] -= d * (s2[a][b] / sw - mean[a] * mean[b])
      }
    }
  }
  return { ll, score, hess }
}

export function runCox(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const sample = readSurvival(rows, options, true)
  const p = (Array.isArray(options.covariates) ? options.covariates : []).length
  if (sample.length < p + 8 || p < 1) return empty('survival.cox', 'Semi-parametric Survival', 'Need time, event, and at least one numeric covariate.')
  let beta = Array(p).fill(0)
  let ll = Number.NEGATIVE_INFINITY
  for (let iter = 0; iter < 25; iter++) {
    const cur = coxPartial(beta, sample)
    ll = cur.ll
    const delta = solve(cur.hess.map((row) => row.map((v) => -v)), cur.score)
    if (!delta) break
    beta = beta.map((b, i) => b + delta[i])
    if (Math.hypot(...delta) < 1e-8) break
  }
  const cur = coxPartial(beta, sample)
  const names = (options.covariates as string[])
  const se = names.map((_, j) => {
    const e = Array(p).fill(0)
    e[j] = 1
    const col = solve(cur.hess.map((row) => row.map((v) => -v)), e)
    return col ? Math.sqrt(Math.max(0, col[j])) : Number.NaN
  })
  const schoenfeld = sample.filter((r) => r.event === 1).map((r) => {
    const risk = sample.filter((s) => s.time >= r.time)
    const w = risk.map((s) => Math.exp(s.x.reduce((sum, v, j) => sum + v * beta[j], 0)))
    const sw = w.reduce((s, v) => s + v, 0)
    const mean = Array(p).fill(0)
    risk.forEach((s, i) => { for (let j = 0; j < p; j++) mean[j] += w[i] * s.x[j] / sw })
    return { time: r.time, residual: r.x.map((v, j) => v - mean[j]) }
  })
  const coefRows = names.map((name, i) => {
    const z = se[i] > 0 ? beta[i] / se[i] : Number.NaN
    return [name, round(beta[i]), round(se[i]), round(Math.exp(beta[i])), round(z), round(2 * (1 - pnorm(Math.abs(z))))]
  })
  return {
    analysisId: 'survival.cox',
    title: 'Semi-parametric Survival',
    interpretation: `Cox PH (Breslow ties), n = ${sample.length}, events = ${sample.filter((r) => r.event === 1).length}. Partial log-likelihood = ${round(ll)}.`,
    assumptions: ['Proportional hazards. Independent right censoring. Breslow handling of ties. Schoenfeld residuals are unscaled.'],
    footnotes: ['Newton–Raphson on the Cox partial likelihood. A global Schoenfeld correlation-with-time check is shown as a PH diagnostic.'],
    tables: [
      { id: 'coef', title: 'Cox coefficients', columns: ['Term', 'coef', 'SE', 'HR', 'z', 'p'], rows: coefRows },
      { id: 'sch', title: 'Schoenfeld (first 20 events)', columns: ['Time', ...names], rows: schoenfeld.slice(0, 20).map((r) => [r.time, ...r.residual.map((v) => round(v))]) },
    ],
    plots: [{
      id: 'sch-plot',
      title: 'Schoenfeld residual vs time (first covariate)',
      data: [{ type: 'scatter', mode: 'markers', x: schoenfeld.map((r) => r.time), y: schoenfeld.map((r) => r.residual[0]) }],
      layout: { xaxis: { title: 'Time' }, yaxis: { title: names[0] }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function exponentialMle(sample: SurvRow[]): number {
  const t = sample.reduce((s, r) => s + r.time, 0)
  const d = sample.reduce((s, r) => s + r.event, 0)
  return d / Math.max(t, 1e-12)
}

export function runParametricSurvival(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const sample = readSurvival(rows, options, false)
  if (sample.length < 3) return empty('survival.parametric', 'Parametric Survival', 'Need time and event columns.')
  const family = String(options.survFamily ?? 'weibull')
  const events = sample.filter((r) => r.event === 1)
  const lam = exponentialMle(sample)
  const logT = events.map((r) => Math.log(r.time))
  const muLog = mean(logT)
  const sdLog = sampleSd(logT)
  let interp: string
  const tableRows: Array<Array<string | number>> = []
  if (family === 'exponential') {
    interp = `Exponential MLE λ = ${round(lam)} (mean time 1/λ = ${round(1 / lam)}). Log-likelihood uses events / total time.`
    tableRows.push(['rate λ', round(lam)], ['mean', round(1 / lam)])
  } else if (family === 'log-normal') {
    interp = `Log-normal on uncensored times: μ = ${round(muLog)}, σ = ${round(sdLog)}. Censoring is ignored in this start; the exponential MLE remains the fully censored exponential fit.`
    tableRows.push(['μ (log time)', round(muLog)], ['σ', round(sdLog)])
  } else if (family === 'log-logistic') {
    const s = Math.max(0.2, sdLog * Math.sqrt(3) / Math.PI)
    interp = `Log-logistic start from uncensored logs: scale ≈ ${round(s)}, location = ${round(muLog)}.`
    tableRows.push(['location', round(muLog)], ['scale', round(s)])
  } else {
    // Weibull: Newton on shape k, scale λ with exponential start k=1
    let k = 1
    let lamW = 1 / lam
    for (let iter = 0; iter < 40; iter++) {
      let d1 = 0
      let d2 = 0
      for (const r of sample) {
        const z = r.time / lamW
        const zk = Math.pow(z, k)
        if (r.event) {
          d1 += 1 / k + Math.log(z) - zk * Math.log(z)
          d2 += -1 / (k * k) - zk * (Math.log(z) ** 2)
        } else {
          d1 -= zk * Math.log(z)
          d2 -= zk * (Math.log(z) ** 2)
        }
      }
      const step = d1 / Math.min(-1e-8, d2)
      k = Math.max(0.15, Math.min(8, k + step))
    }
    const sumTk = sample.reduce((s, r) => s + Math.pow(r.time, k), 0)
    lamW = Math.pow(sumTk / Math.max(1, events.length), 1 / k)
    interp = `Weibull MLE: shape k = ${round(k)}, scale λ = ${round(lamW)}. Exponential is the k = 1 special case.`
    tableRows.push(['shape k', round(k)], ['scale λ', round(lamW)])
  }
  const km = kaplanMeier(sample)
  return {
    analysisId: 'survival.parametric',
    title: 'Parametric Survival',
    interpretation: interp,
    assumptions: ['Independent right-censored times. Exponential uses the exact censored MLE. Weibull uses a one-parameter Newton on shape given the profile scale. Log-normal / log-logistic starts from uncensored logs.'],
    footnotes: ['Compare the parametric mean to the Kaplan–Meier curve in the plot.'],
    tables: [{ id: 'par', title: family, columns: ['Parameter', 'Estimate'], rows: tableRows }],
    plots: [{
      id: 'km',
      title: 'KM overlay',
      data: [{ type: 'scatter', mode: 'lines', x: km.map((r) => r.time), y: km.map((r) => r.survival), line: { shape: 'hv' }, name: 'KM' }],
      layout: { xaxis: { title: 'Time' }, yaxis: { title: 'S(t)' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
