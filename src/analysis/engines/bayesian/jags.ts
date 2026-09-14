import type { AnalysisOptions, AnalysisResult } from '../../types'
import { lm } from '../frequentist/linalg'
import { asFiniteNumber, mean, numericValues, round, sampleSd } from '../frequentist/numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function lcg(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967296
  }
}

function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function rgamma(rng: () => number, shape: number, rate: number): number {
  if (shape < 1) return rgamma(rng, shape + 1, rate) * Math.pow(rng(), 1 / shape)
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    const x = randn(rng)
    const v = (1 + c * x) ** 3
    if (v <= 0) continue
    const u = rng()
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return (d * v) / rate
  }
}

function acfLag1(x: number[]): number {
  const m = mean(x)
  let n0 = 0
  let n1 = 0
  for (let i = 0; i < x.length; i++) n0 += (x[i]! - m) ** 2
  for (let i = 0; i < x.length - 1; i++) n1 += (x[i]! - m) * (x[i + 1]! - m)
  return n0 === 0 ? 0 : n1 / n0
}

export function rhatEss(chains: number[][]): { rhat: number; ess: number; mean: number } {
  const n = Math.min(...chains.map((c) => c.length))
  const split: number[][] = []
  for (const chain of chains) {
    const half = Math.floor(n / 2)
    split.push(chain.slice(0, half), chain.slice(n - half))
  }
  const means = split.map((c) => mean(c))
  const grand = mean(means)
  const W = mean(split.map((c) => {
    const mc = mean(c)
    return c.reduce((s, v) => s + (v - mc) ** 2, 0) / Math.max(c.length - 1, 1)
  }))
  const B = (split[0]!.length * split.reduce((s, _, i) => s + (means[i]! - grand) ** 2, 0)) / (split.length - 1)
  const varP = ((split[0]!.length - 1) / split[0]!.length) * W + B / split[0]!.length
  const rhat = Math.sqrt(Math.max(1, varP / (W || 1e-12)))
  const pooled = chains.flat()
  const rho = Math.max(0, acfLag1(pooled))
  const ess = pooled.length * (1 - rho) / (1 + rho)
  return { rhat, ess, mean: mean(pooled) }
}

function summarize(name: string, chains: number[][]) {
  const pooled = chains.flat().slice().sort((a, b) => a - b)
  const q = (p: number) => pooled[Math.min(pooled.length - 1, Math.floor(p * (pooled.length - 1)))]!
  const d = rhatEss(chains)
  return { name, mean: d.mean, q025: q(0.025), q50: q(0.5), q975: q(0.975), rhat: d.rhat, ess: d.ess, chains }
}

export function runJags(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const kind = String(options.jagsKind ?? 'normalMean')
  const nIter = Math.max(200, Math.min(4000, Math.floor(Number(options.nIter ?? 800))))
  const nChains = Math.max(2, Math.min(4, Math.floor(Number(options.nChains ?? 2))))
  const burn = Math.max(50, Math.min(Math.floor(nIter / 2), Math.floor(Number(options.burnin ?? 200))))
  const keep = nIter - burn
  const seed = Math.floor(Number(options.seed ?? 1))
  const notes = [
    'This is an in-browser Gibbs sampler for canonical conjugate models, not JAGS/rjags WASM. Trace, density, ACF, R̂, and ESS are computed on the saved draws.',
  ]
  if (kind === 'binomial') {
    const k = Number(options.successes ?? numericValues(rows, String(options.variable ?? '')).reduce((s, v) => s + (v > 0 ? 1 : 0), 0))
    const n = Number(options.trials ?? rows.length)
    const a0 = Number(options.priorAlpha ?? 1)
    const b0 = Number(options.priorBeta ?? 1)
    const chains: number[][] = []
    for (let c = 0; c < nChains; c++) {
      const rng = lcg(seed + 17 * (c + 1))
      const draws: number[] = []
      for (let t = 0; t < nIter; t++) {
        const ga = rgamma(rng, a0 + k, 1)
        const gb = rgamma(rng, b0 + n - k, 1)
        const p = ga / (ga + gb)
        if (t >= burn) draws.push(p)
      }
      chains.push(draws)
    }
    const s = summarize('p', chains)
    return pack('Binomial p ~ Beta', s, notes, nIter, nChains, burn, keep, `Beta(${a0}+${k}, ${b0}+${n - k}) Gibbs.`)
  }
  if (kind === 'regression') {
    const yName = String(options.dependent ?? '')
    const xName = String(options.predictor ?? '')
    const packXY: Array<[number, number]> = []
    for (const row of rows) {
      const y = asFiniteNumber(row[yName])
      const x = asFiniteNumber(row[xName])
      if (y !== null && x !== null) packXY.push([y, x])
    }
    if (packXY.length < 4) return empty('jags.model', 'JAGS', 'Need a numeric outcome and predictor.')
    const y = packXY.map((p) => p[0])
    const X = packXY.map((p) => [1, p[1]])
    const ols = lm(y, X)
    if (!ols) return empty('jags.model', 'JAGS', 'Design is singular.')
    const n = y.length
    const chainsB0: number[][] = []
    const chainsB1: number[][] = []
    const chainsS: number[][] = []
    for (let c = 0; c < nChains; c++) {
      const rng = lcg(seed + 31 * (c + 1))
      let b0 = ols.beta[0] ?? 0
      let b1 = ols.beta[1] ?? 0
      let s2 = ols.sse / Math.max(n - 2, 1)
      const d0: number[] = []
      const d1: number[] = []
      const ds: number[] = []
      for (let t = 0; t < nIter; t++) {
        const rss = y.reduce((s, yi, i) => s + (yi - b0 - b1 * X[i]![1]!) ** 2, 0)
        s2 = 1 / rgamma(rng, 0.001 + n / 2, 0.001 + rss / 2) || s2
        const mx = mean(packXY.map((p) => p[1]))
        const sxx = packXY.reduce((s, p) => s + (p[1] - mx) ** 2, 0) || 1
        const se1 = Math.sqrt(s2 / sxx)
        const se0 = Math.sqrt(s2 * (1 / n + mx * mx / sxx))
        b1 = (ols.beta[1] ?? 0) + se1 * randn(rng)
        b0 = (ols.beta[0] ?? 0) + se0 * randn(rng)
        if (t >= burn) {
          d0.push(b0)
          d1.push(b1)
          ds.push(Math.sqrt(s2))
        }
      }
      chainsB0.push(d0)
      chainsB1.push(d1)
      chainsS.push(ds)
    }
    const s0 = summarize('beta0', chainsB0)
    const s1 = summarize('beta1', chainsB1)
    const ss = summarize('sigma', chainsS)
    const trace = Array.from({ length: Math.min(keep, 400) }, (_, i) => i)
    return {
      analysisId: 'jags.model',
      title: 'JAGS',
      interpretation: `Conjugate Gibbs linear model: β₁ posterior mean ${round(s1.mean)} (R̂ ${round(s1.rhat)}, ESS ${round(s1.ess)}). Not JAGS WASM.`,
      assumptions: ['Gaussian errors, improper-ish InvGamma(0.001,0.001) on σ², independent normal draws around the OLS mean (exact conditional for intercept/slope).'],
      footnotes: notes,
      tables: [{
        id: 'mcmc',
        title: 'MCMC summaries',
        columns: ['Parameter', 'Mean', '2.5%', '50%', '97.5%', 'R̂', 'ESS'],
        rows: [s0, s1, ss].map((s) => [s.name, round(s.mean), round(s.q025), round(s.q50), round(s.q975), round(s.rhat), round(s.ess)]),
      }],
      plots: [
        { id: 'trace', title: 'Trace (β₁)', data: chainsB1.map((ch, i) => ({ type: 'scatter', mode: 'lines', name: `chain ${i + 1}`, x: trace, y: ch.slice(0, trace.length) })), layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
        { id: 'dens', title: 'Density (β₁)', data: [{ type: 'histogram', x: chainsB1.flat(), nbinsx: 30 }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
      ],
    }
  }
  const variable = String(options.variable ?? '')
  const x = numericValues(rows, variable)
  if (x.length < 2) return empty('jags.model', 'JAGS', 'Need a numeric variable (or binomial counts).')
  const n = x.length
  const m0 = mean(x)
  const s0 = sampleSd(x) || 1
  const chainsMu: number[][] = []
  const chainsS: number[][] = []
  for (let c = 0; c < nChains; c++) {
    const rng = lcg(seed + 13 * (c + 1))
    let mu = m0
    let s2 = s0 * s0
    const dmu: number[] = []
    const ds: number[] = []
    for (let t = 0; t < nIter; t++) {
      const rss = x.reduce((s, xi) => s + (xi - mu) ** 2, 0)
      s2 = 1 / rgamma(rng, 0.001 + n / 2, 0.001 + rss / 2) || s2
      const postPrec = n / s2 + 1e-6
      const postMean = (n / s2) * mean(x) / postPrec
      mu = postMean + Math.sqrt(1 / postPrec) * randn(rng)
      if (t >= burn) {
        dmu.push(mu)
        ds.push(Math.sqrt(s2))
      }
    }
    chainsMu.push(dmu)
    chainsS.push(ds)
  }
  const sm = summarize('mu', chainsMu)
  const ss = summarize('sigma', chainsS)
  const trace = Array.from({ length: Math.min(keep, 400) }, (_, i) => i)
  const pooled = chainsMu.flat()
  const lag = Array.from({ length: 20 }, (_, k) => k)
  const acf = lag.map((k) => {
    if (k === 0) return 1
    const a = pooled.slice(0, pooled.length - k)
    const b = pooled.slice(k)
    const ma = mean(a)
    const mb = mean(b)
    const num = a.reduce((s, v, i) => s + (v - ma) * (b[i]! - mb), 0)
    const den = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0))
    return den === 0 ? 0 : num / den
  })
  return pack('Normal mean', sm, notes, nIter, nChains, burn, keep, `Gibbs N(μ, σ²) on ${variable}.`, ss, {
    trace,
    chains: chainsMu,
    acf: lag.map((k, i) => [k, acf[i]!]),
  })
}

function pack(
  model: string,
  primary: ReturnType<typeof summarize>,
  notes: string[],
  nIter: number,
  nChains: number,
  burn: number,
  keep: number,
  extra: string,
  secondary?: ReturnType<typeof summarize>,
  extraPlots?: { trace: number[]; chains: number[][]; acf: number[][] },
): AnalysisResult {
  const rows = [primary, ...(secondary ? [secondary] : [])]
  return {
    analysisId: 'jags.model',
    title: 'JAGS',
    interpretation: `${model}: ${primary.name} mean ${round(primary.mean)} (R̂ ${round(primary.rhat)}, ESS ${round(primary.ess)}). ${extra} ${nChains} chains × ${keep} draws after ${burn} burn-in of ${nIter}.`,
    assumptions: ['Conjugate Gibbs; R̂ is the split-chain Gelman–Rubin statistic. ESS uses lag-1 autocorrelation.'],
    footnotes: notes,
    tables: [{
      id: 'mcmc',
      title: 'MCMC summaries',
      columns: ['Parameter', 'Mean', '2.5%', '50%', '97.5%', 'R̂', 'ESS'],
      rows: rows.map((s) => [s.name, round(s.mean), round(s.q025), round(s.q50), round(s.q975), round(s.rhat), round(s.ess)]),
    }],
    plots: extraPlots
      ? [
        { id: 'trace', title: `Trace (${primary.name})`, data: extraPlots.chains.map((ch, i) => ({ type: 'scatter', mode: 'lines', name: `chain ${i + 1}`, x: extraPlots.trace, y: ch.slice(0, extraPlots.trace.length) })), layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
        { id: 'dens', title: `Density (${primary.name})`, data: [{ type: 'histogram', x: extraPlots.chains.flat(), nbinsx: 30 }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
        { id: 'acf', title: 'ACF', data: [{ type: 'bar', x: extraPlots.acf.map((p) => p[0]), y: extraPlots.acf.map((p) => p[1]) }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
      ]
      : [
        { id: 'trace', title: `Trace (${primary.name})`, data: primary.chains.map((ch, i) => ({ type: 'scatter', mode: 'lines', name: `chain ${i + 1}`, x: Array.from({ length: Math.min(ch.length, 400) }, (_, t) => t), y: ch.slice(0, 400) })), layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
        { id: 'dens', title: `Density (${primary.name})`, data: [{ type: 'histogram', x: primary.chains.flat(), nbinsx: 30 }], layout: { margin: { t: 40, r: 16, b: 40, l: 48 } } },
      ],
  }
}
