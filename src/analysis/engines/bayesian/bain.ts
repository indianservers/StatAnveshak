import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pnorm, pt } from '../frequentist/dists'
import { groupedNumeric, mean, numericValues, pearson, round, sampleSd, sampleVariance } from '../frequentist/numeric'
import { lm, sst } from '../frequentist/linalg'
import { oneSampleT } from '../frequentist/ttests'
import { jzsLinearBf10, jzsOneSample, reportBf } from './jzs'
import { runCfa } from '../frequentist/sem'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function orderBf(probInRegion: number, priorMass: number): number {
  const p = Math.min(1 - 1e-12, Math.max(1e-12, probInRegion))
  const q = Math.min(1 - 1e-12, Math.max(1e-12, priorMass))
  return (p / (1 - p)) / (q / (1 - q))
}

function equalityBfT(t: number, n: number): number {
  return 1 / Math.max(jzsOneSample(t, n, 0.707), 1e-12)
}

export function runBain(rows: Record<string, unknown>[], options: AnalysisOptions, analysisId = 'bain.tests'): AnalysisResult {
  const family = String(options.family ?? 't')
  const hyp = String(options.hypothesis ?? 'greater')
  const title = analysisId === 'bfpack.constrained' ? 'BFpack' : 'Bain'
  const notes = [
    'Order constraints use the fraction of an unconstrained Student/normal posterior in the region (encompassing prior). Equality constraints use a JZS/BIC Savage–Dickey factor.',
    analysisId === 'bain.tests'
      ? 'This is Hoijtink-style encompassing BF, not the full Bain Fortran approximate-adjusted-fractional-Bayes-factor engine.'
      : 'This is a constrained-hypothesis layer on the same t/ANOVA/regression/correlation/variance engines, not the BFpack R package.',
  ]
  if (family === 't') {
    const variable = String(options.variable ?? '')
    const mu0 = Number(options.mu0 ?? 0)
    const x = numericValues(rows, variable)
    if (x.length < 3) return empty(analysisId, title, 'Need a numeric variable.')
    const test = oneSampleT(x, mu0)
    const pGreater = pt(test.t, test.df)
    if (hyp === 'equal') {
      const bf01 = equalityBfT(test.t, x.length)
      return {
        analysisId,
        title,
        interpretation: `Equality H: μ = ${mu0}. BF₀₁ (JZS Savage–Dickey) = ${reportBf(1 / bf01).bf01}.`,
        assumptions: ['Cauchy prior on δ as in JZS t.'],
        footnotes: notes,
        tables: [{ id: 'bf', title: 'Informative hypothesis', columns: ['H', 'BF₀u', 't', 'n'], rows: [[`μ = ${mu0}`, round(bf01), round(test.t), x.length]] }],
        plots: [],
      }
    }
    const pH = hyp === 'less' ? 1 - pGreater : pGreater
    const bfHu = orderBf(pH, 0.5)
    return {
      analysisId,
      title,
      interpretation: `Order H: μ ${hyp === 'less' ? '<' : '>'} ${mu0}. Encompassing BF_{Hu} = ${round(bfHu)} (posterior mass in H = ${round(pH)}).`,
      assumptions: ['Unconstrained posterior is Student-t for the mean; prior mass of the order hypothesis is ½.'],
      footnotes: notes,
      tables: [{ id: 'bf', title: 'Informative hypothesis', columns: ['H', 'BF_Hu', 'P(H|data)', 't', 'n'], rows: [[`μ ${hyp === 'less' ? '<' : '>'} ${mu0}`, round(bfHu), round(pH), round(test.t), x.length]] }],
      plots: [],
    }
  }
  if (family === 'anova') {
    const dependent = String(options.dependent ?? '')
    const group = String(options.group ?? '')
    const groups = groupedNumeric(rows, group, dependent)
    if (groups.length < 2) return empty(analysisId, title, 'Need a grouping factor with at least two levels.')
    const all = groups.flatMap((g) => g.values)
    const grand = mean(all)
    let ssb = 0
    for (const g of groups) ssb += g.values.length * (mean(g.values) - grand) ** 2
    const r2 = sst(all) > 0 ? ssb / sst(all) : 0
    const bf10 = jzsLinearBf10(all.length, groups.length - 1, r2, 0.5)
    const means = groups.map((g) => mean(g.values))
    const ses = groups.map((g) => (sampleSd(g.values) || 1) / Math.sqrt(g.values.length))
    let pOrder = 1
    for (let i = 1; i < means.length; i++) {
      const z = (means[i]! - means[i - 1]!) / Math.hypot(ses[i]!, ses[i - 1]!)
      pOrder *= pnorm(z)
    }
    const bfOrder = orderBf(pOrder, 1 / factorial(groups.length))
    return {
      analysisId,
      title,
      interpretation: `ANOVA informative hypotheses: equality-of-means BF₁₀ (vs intercept) = ${reportBf(bf10).bf10}; ordered means BF_{Hu} = ${round(bfOrder)}.`,
      assumptions: ['Order uses independent normal approximations to group means. Equality uses the Zellner–Siow g-prior ANOVA BF.'],
      footnotes: notes,
      tables: [
        { id: 'bf', title: 'ANOVA hypotheses', columns: ['H', 'BF'], rows: [['means unequal vs intercept', round(bf10)], ['μ1 < μ2 < …', round(bfOrder)]] },
      ],
      plots: [],
    }
  }
  if (family === 'regression') {
    const yName = String(options.dependent ?? '')
    const preds = Array.isArray(options.predictors) ? options.predictors.map(String) : []
    if (!yName || preds.length < 1) return empty(analysisId, title, 'Assign a dependent variable and predictors.')
    const pack: number[][] = []
    for (const row of rows) {
      const y = Number(row[yName])
      const x = preds.map((p) => Number(row[p]))
      if ([y, ...x].every(Number.isFinite)) pack.push([y, ...x])
    }
    if (pack.length < preds.length + 4) return empty(analysisId, title, 'Not enough complete cases.')
    const y = pack.map((r) => r[0]!)
    const X = pack.map((r) => [1, ...r.slice(1)])
    const fit = lm(y, X)
    if (!fit) return empty(analysisId, title, 'OLS failed.')
    const r2 = 1 - fit.sse / sst(y)
    const bf10 = jzsLinearBf10(y.length, preds.length, r2, 0.354)
    const b1 = fit.beta[1] ?? 0
    const se1 = Math.sqrt((fit.sse / (y.length - fit.beta.length)) / pack.reduce((s, r) => s + (r[1]! - mean(pack.map((z) => z[1]!))) ** 2, 0) || 1)
    const pPos = 1 - pnorm(-b1 / (se1 || 1))
    const bfB = orderBf(pPos, 0.5)
    return {
      analysisId,
      title,
      interpretation: `Regression: Zellner–Siow BF₁₀ vs intercept = ${reportBf(bf10).bf10}. Order H: β₁ > 0 has BF_{Hu} = ${round(bfB)}.`,
      assumptions: ['Slope order uses a normal approximation to β̂₁.'],
      footnotes: notes,
      tables: [{ id: 'bf', title: 'Regression hypotheses', columns: ['H', 'BF'], rows: [['predictors vs intercept', round(bf10)], ['β₁ > 0', round(bfB)]] }],
      plots: [],
    }
  }
  if (family === 'correlation') {
    const a = String(options.x ?? '')
    const b = String(options.y ?? '')
    const xs: number[] = []
    const ys: number[] = []
    for (const row of rows) {
      const xv = Number(row[a])
      const yv = Number(row[b])
      if (Number.isFinite(xv) && Number.isFinite(yv)) {
        xs.push(xv)
        ys.push(yv)
      }
    }
    if (xs.length < 5) return empty(analysisId, title, 'Need paired numeric columns.')
    const r = pearson(xs, ys)
    const z = Math.atanh(Math.max(-0.999, Math.min(0.999, r))) * Math.sqrt(xs.length - 3)
    const pPos = 1 - pnorm(-z)
    return {
      analysisId,
      title,
      interpretation: `Correlation order H: ρ > 0. Fisher-z encompassing BF_{Hu} = ${round(orderBf(pPos, 0.5))} (r = ${round(r)}).`,
      assumptions: ['Fisher z with a flat prior on the sign of ρ.'],
      footnotes: notes,
      tables: [{ id: 'bf', title: 'Correlation', columns: ['r', 'BF_Hu'], rows: [[round(r), round(orderBf(pPos, 0.5))]] }],
      plots: [],
    }
  }
  if (family === 'variances') {
    const dependent = String(options.dependent ?? '')
    const group = String(options.group ?? '')
    const groups = groupedNumeric(rows, group, dependent)
    if (groups.length !== 2) return empty(analysisId, title, 'Variance hypotheses need two groups.')
    const v1 = sampleVariance(groups[0]!.values)
    const v2 = sampleVariance(groups[1]!.values)
    const f = v1 / (v2 || 1e-12)
    const pH = v1 > v2 ? 0.5 + 0.5 * Math.tanh(Math.log(f)) : 0.5 - 0.5 * Math.tanh(Math.abs(Math.log(f)))
    return {
      analysisId,
      title,
      interpretation: `Variance order σ₁² ${v1 >= v2 ? '>' : '<'} σ₂². Encompassing BF_{Hu} ≈ ${round(orderBf(Math.max(pH, 1 - pH), 0.5))} (F = ${round(f)}).`,
      assumptions: ['Uses a logistic map of log F as a stand-in for the F posterior mass; not an exact inverse-gamma BF.'],
      footnotes: notes,
      tables: [{ id: 'bf', title: 'Variances', columns: ['F', 'BF_Hu'], rows: [[round(f), round(orderBf(Math.max(pH, 1 - pH), 0.5))]] }],
      plots: [],
    }
  }
  const cfa = runCfa(rows, options)
  const chi = Number(cfa.tables.find((t) => t.id === 'fit')?.rows[0]?.[1] ?? 0)
  const df = Number(cfa.tables.find((t) => t.id === 'fit')?.rows[0]?.[2] ?? 1)
  const n = Number(cfa.tables.find((t) => t.id === 'fit')?.rows[0]?.[0] ?? rows.length)
  const bicDelta = chi - df * Math.log(Math.max(n, 3))
  const bf10 = Math.exp(-0.5 * bicDelta)
  return {
    ...cfa,
    analysisId,
    title,
    interpretation: `SEM/CFA informative hypothesis vs independence: BIC BF₁₀ = ${reportBf(bf10).bf10}. ${cfa.interpretation}`,
    footnotes: [...cfa.footnotes, ...notes],
    tables: [...cfa.tables, { id: 'bf', title: 'SEM vs independence', columns: ['BF₁₀'], rows: [[round(bf10)]] }],
  }
}

function factorial(k: number): number {
  let v = 1
  for (let i = 2; i <= k; i++) v *= i
  return v
}

export function runBfpack(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  return runBain(rows, options, 'bfpack.constrained')
}
