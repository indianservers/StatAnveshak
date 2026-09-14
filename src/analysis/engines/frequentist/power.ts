import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pnf, pnorm, pnt, qnorm, qt } from './dists'
import { round } from './numeric'

function powerT(ncp: number, df: number, alpha: number, alternative: 'two-sided' | 'greater' | 'less'): number {
  if (alternative === 'greater') return 1 - pnt(qt(1 - alpha, df), df, ncp)
  if (alternative === 'less') return pnt(qt(alpha, df), df, ncp)
  const crit = qt(1 - alpha / 2, df)
  return 1 - pnt(crit, df, ncp) + pnt(-crit, df, ncp)
}

function ncpIndependent(d: number, nPer: number): number {
  return d * Math.sqrt(nPer / 2)
}

function ncpPaired(d: number, n: number): number {
  return d * Math.sqrt(n)
}

function solveN(powerFn: (n: number) => number, target: number, lo: number, hi: number): number {
  let a = lo
  let b = hi
  while (powerFn(b) < target && b < 1e6) b *= 2
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2
    if (powerFn(m) < target) a = m
    else b = m
  }
  return Math.ceil(b - 1e-9)
}

export function runPowerAnalysis(_rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const design = String(options.design ?? 't.independent')
  const compute = String(options.compute ?? 'n')
  const effect = Number(options.effectSize ?? 0.5)
  const alpha = Number(options.alpha ?? 0.05)
  const powerWanted = Number(options.power ?? 0.8)
  const nGiven = Number(options.n ?? 64)
  const groups = Math.max(2, Math.round(Number(options.groups ?? 3)))
  const predictors = Math.max(1, Math.round(Number(options.predictors ?? 1)))
  const alternative = options.alternative === 'greater' || options.alternative === 'less' ? options.alternative : 'two-sided'

  let nResult = nGiven
  let powerResult: number
  let note: string

  const powerOfN = (n: number): number => {
    if (design === 't.independent') {
      const df = 2 * n - 2
      return powerT(ncpIndependent(effect, n), df, alpha, alternative)
    }
    if (design === 't.paired' || design === 't.oneSample') {
      const df = n - 1
      return powerT(ncpPaired(effect, n), df, alpha, alternative)
    }
    if (design === 'anova') {
      const N = n * groups
      const df1 = groups - 1
      const df2 = N - groups
      const ncp = effect * effect * N
      const crit = (() => {
        let hi = 1
        while (pnf(hi, df1, df2, 0) < 1 - alpha) hi *= 2
        let lo = 0
        for (let i = 0; i < 50; i++) {
          const mid = (lo + hi) / 2
          if (pnf(mid, df1, df2, 0) < 1 - alpha) lo = mid
          else hi = mid
        }
        return (lo + hi) / 2
      })()
      return 1 - pnf(crit, df1, df2, ncp)
    }
    if (design === 'proportions') {
      const h = effect
      const ncp = h * Math.sqrt(n / 2)
      const zc = alternative === 'two-sided' ? qnorm(1 - alpha / 2) : qnorm(1 - alpha)
      if (alternative === 'greater') return 1 - pnorm(zc - ncp)
      if (alternative === 'less') return pnorm(-zc - ncp)
      return 1 - pnorm(zc - ncp) + pnorm(-zc - ncp)
    }
    if (design === 'correlation') {
      const r = Math.min(0.999, Math.max(-0.999, effect))
      const z = 0.5 * Math.log((1 + r) / (1 - r))
      const se = 1 / Math.sqrt(Math.max(3, n) - 3)
      const ncp = z / se
      const zc = alternative === 'two-sided' ? qnorm(1 - alpha / 2) : qnorm(1 - alpha)
      if (alternative === 'greater') return 1 - pnorm(zc - ncp)
      if (alternative === 'less') return pnorm(-zc - ncp)
      return 1 - pnorm(zc - ncp) + pnorm(-zc - ncp)
    }
    const f2 = effect
    const u = predictors
    const v = Math.max(1, n - predictors - 1)
    const ncp = f2 * n
    const critF = (() => {
      let hi = 1
      while (pnf(hi, u, v, 0) < 1 - alpha) hi *= 2
      let lo = 0
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2
        if (pnf(mid, u, v, 0) < 1 - alpha) lo = mid
        else hi = mid
      }
      return (lo + hi) / 2
    })()
    return 1 - pnf(critF, u, v, ncp)
  }

  if (design === 't.independent') note = 'n is per group; effect size is Cohen’s d. Power uses the noncentral t with df = 2n−2.'
  else if (design === 't.paired') note = 'n is the number of pairs; effect size is Cohen’s dz. Power uses the noncentral t.'
  else if (design === 't.oneSample') note = 'n is the sample size; effect size is Cohen’s d vs the test value.'
  else if (design === 'anova') note = 'n is per group; effect size is Cohen’s f. Noncentrality λ = f²N with N = n×groups.'
  else if (design === 'proportions') note = 'n is per group; effect size is Cohen’s h. Normal approximation to two-sample proportion power.'
  else if (design === 'correlation') note = 'Effect size is ρ; Fisher z with SE = 1/√(n−3).'
  else note = 'n is total sample size; effect size is f². Noncentral F with u predictors and v = n−u−1.'

  if (compute === 'power') {
    nResult = Math.max(2, Math.round(nGiven))
    powerResult = powerOfN(nResult)
  } else {
    const lo = design === 'anova' ? 3 : 3
    nResult = solveN(powerOfN, powerWanted, lo, 20)
    powerResult = powerOfN(nResult)
  }

  const curveN = Array.from({ length: 40 }, (_, i) => Math.max(3, Math.round(nResult * (0.25 + i * 0.08))))
  const uniqueN = [...new Set(curveN)].sort((a, b) => a - b)
  const curveP = uniqueN.map(powerOfN)

  return {
    analysisId: 'power.analysis',
    title: 'Power Analysis',
    interpretation: compute === 'power'
      ? `At n = ${nResult}${design === 't.independent' || design === 'anova' || design === 'proportions' ? ' per group' : ''}, estimated power is ${round(powerResult, 4)} (α = ${alpha}, effect = ${effect}).`
      : `For power ${powerWanted} at α = ${alpha} and effect ${effect}, required n is ${nResult}${design === 't.independent' || design === 'anova' || design === 'proportions' ? ' per group' : ''}. Achieved power ${round(powerResult, 4)}.`,
    assumptions: [note],
    footnotes: [
      'Two-sample t n for d = 0.5, α = 0.05 two-sided, 80% power is about 64 per group (noncentral t, equal n).',
      'No dataset is required; this analysis is fully determined by the options.',
    ],
    tables: [{
      id: 'result',
      title: 'Power result',
      columns: ['Design', 'Compute', 'Effect size', 'α', 'n', 'Power'],
      rows: [[design, compute === 'power' ? 'power given n' : 'n given power', effect, alpha, nResult, round(powerResult, 4)]],
    }],
    plots: [{
      id: 'curve',
      title: 'Power vs n',
      data: [{ type: 'scatter', mode: 'lines+markers', x: uniqueN, y: curveP, name: 'power' }],
      layout: { xaxis: { title: design === 't.independent' || design === 'anova' || design === 'proportions' ? 'n per group' : 'n' }, yaxis: { title: 'Power', range: [0, 1] }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}
