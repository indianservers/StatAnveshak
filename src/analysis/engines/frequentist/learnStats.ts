import type { AnalysisOptions, AnalysisResult } from '../../types'
import { runDescriptiveStatistics } from './descriptives'
import { runBinomial } from './frequencies'
import { round } from './numeric'
import { runPowerAnalysis } from './power'
import { runIndependentT, runOneSampleT } from './ttests'

export type LearnStatsLab =
  | 'normal'
  | 'binomial'
  | 'clt'
  | 'se'
  | 'descriptives'
  | 'variability'
  | 'pvalue'
  | 'ci'
  | 'effect'
  | 'tree'

export type LearnStatsRecommendation = {
  analysisId: string
  title: string
  reason: string
}

export function recommendLearnStatsTree(options: {
  outcomeType?: string
  groups?: string
  paired?: boolean | string
  predictors?: string
}): LearnStatsRecommendation {
  const outcome = String(options.outcomeType ?? 'numeric')
  const groups = String(options.groups ?? 'two')
  const paired = options.paired === true || options.paired === 'true'
  const predictors = String(options.predictors ?? 'none')
  if (predictors === 'many' && outcome === 'categorical') {
    return { analysisId: 'regression.logistic', title: 'Logistic Regression', reason: 'A categorical outcome with several predictors is a GLM classification problem. Open logistic (or multinomial) regression.' }
  }
  if (predictors === 'many' || predictors === 'one') {
    return { analysisId: 'regression.linear', title: 'Linear Regression', reason: 'A numeric outcome with predictors is estimated by OLS. Open linear regression; switch to GLM if the mean is not Gaussian.' }
  }
  if (outcome === 'categorical') {
    if (groups === 'one') {
      return { analysisId: 'frequencies.binomial', title: 'Binomial Test', reason: 'One categorical sample is a proportion. Use the binomial test (exact / mid-p / Wilson).' }
    }
    return { analysisId: 'frequencies.contingency', title: 'Contingency Tables', reason: 'Two or more categorical groups are compared with a contingency table (χ², LR, Fisher).' }
  }
  if (groups === 'one') {
    return { analysisId: 't.oneSample', title: 'One Sample T-Test', reason: 'One numeric sample versus a test value is a one-sample t-test (Wilcoxon if the raincloud is skewed).' }
  }
  if (groups === 'two' && paired) {
    return { analysisId: 't.paired', title: 'Paired Samples T-Test', reason: 'Two numeric measures on the same units are a paired t-test on the differences.' }
  }
  if (groups === 'two') {
    return { analysisId: 't.independent', title: 'Independent Samples T-Test', reason: 'Two independent numeric groups are a Welch t-test by default (Mann–Whitney if ranks are safer).' }
  }
  return { analysisId: 'anova.between', title: 'ANOVA', reason: 'Three or more numeric groups are an ANOVA; follow up with Tukey / Games–Howell, not a stack of t-tests.' }
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6D2B79F5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(rng: () => number, mu: number, sigma: number) {
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function wrap(labTitle: string, engine: AnalysisResult, extra: string[]): AnalysisResult {
  return {
    ...engine,
    analysisId: 'learnStats.labs',
    title: `Learn Stats — ${labTitle}`,
    footnotes: [...engine.footnotes, `Tables and plots are from ${engine.analysisId}.`, ...extra],
  }
}

function demoRows(n: number, rng: () => number, mu: number, sigma: number, column = 'x') {
  return Array.from({ length: n }, () => ({ [column]: gauss(rng, mu, sigma) }))
}

function columnFromOptions(rows: Record<string, unknown>[], options: AnalysisOptions, fallback: string) {
  const named = String(options.variable ?? '')
  if (named && rows.some((row) => row[named] !== undefined)) return named
  return fallback
}

export function runLearnStats(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const lab = String(options.lab ?? 'normal') as LearnStatsLab
  const n = Math.max(8, Math.floor(Number(options.n ?? 40)))
  const mu = Number(options.mu ?? 0)
  const sigma = Math.max(1e-6, Number(options.sigma ?? 1))
  const p = Math.min(1, Math.max(0, Number(options.p ?? 0.5)))
  const mu0 = Number(options.mu0 ?? 0)
  const seed = Math.floor(Number(options.seed ?? 1))
  const rng = mulberry32(seed)
  const extras = ['Learn Stats is a teaching shell. The numbers are the same engines as Descriptives, T-Tests, Frequencies, and Power.']

  if (lab === 'tree') {
    const rec = recommendLearnStatsTree(options)
    return {
      analysisId: 'learnStats.labs',
      title: 'Learn Stats — Decision tree',
      interpretation: `Open ${rec.title} (${rec.analysisId}). ${rec.reason}`,
      assumptions: ['The tree is a design map, not a substitute for assumption checks on the chosen analysis.'],
      footnotes: extras,
      tables: [{
        id: 'tree',
        title: 'Recommended analysis',
        columns: ['analysisId', 'Title', 'Reason'],
        rows: [[rec.analysisId, rec.title, rec.reason]],
      }],
      plots: [],
    }
  }

  if (lab === 'binomial') {
    const generated = Array.from({ length: n }, () => ({ y: rng() < p ? 'success' : 'fail' }))
    const source = rows.length >= 8 && String(options.variable ?? '') ? rows : generated
    const variable = columnFromOptions(source, options, 'y')
    return wrap('Binomial', runBinomial(source, { ...options, variable, success: 'success', p0: p }), extras)
  }

  if (lab === 'effect') {
    const generated = Array.from({ length: n }, (_, i) => ({
      y: gauss(rng, i < n / 2 ? mu : mu + Number(options.effectSize ?? 0.8) * sigma, sigma),
      g: i < n / 2 ? 'A' : 'B',
    }))
    return wrap(
      'Effect sizes',
      runIndependentT(generated, { dependent: 'y', group: 'g', equalVariance: false }),
      ['Cohen’s d is the independent-samples engine, not a second formula.'],
    )
  }

  if (lab === 'clt') {
    const reps = 80
    const parent = Array.from({ length: reps * n }, () => -Math.log(Math.max(1e-12, 1 - rng())) * sigma)
    const means: Record<string, unknown>[] = []
    for (let i = 0; i < reps; i++) {
      let s = 0
      for (let j = 0; j < n; j++) s += parent[i * n + j] ?? 0
      means.push({ sampleMean: s / n })
    }
    const desc = runDescriptiveStatistics(means, { variables: ['sampleMean'], ciLevel: 0.95 })
    const seTheory = sigma / Math.sqrt(n)
    return wrap('Central limit theorem', desc, [
      `Parent is exponential with mean ${round(sigma)}. Theoretical SE of the mean is σ/√n = ${round(seTheory)}.`,
      extras[0] ?? '',
    ])
  }

  const generated = demoRows(n, rng, mu, sigma)
  const source = rows.length >= 8 && String(options.variable ?? '') ? rows : generated
  const variable = columnFromOptions(source, options, 'x')

  if (lab === 'pvalue') {
    return wrap('p-values', runOneSampleT(source, { variable, mu0, alternative: 'two-sided' }), extras)
  }

  if (lab === 'ci' || lab === 'normal' || lab === 'descriptives' || lab === 'se') {
    const desc = runDescriptiveStatistics(source, { variables: [variable], ciLevel: Number(options.ciLevel ?? 0.95) })
    const title = lab === 'ci' ? 'Confidence intervals' : lab === 'se' ? 'Standard error' : lab === 'normal' ? 'Normal samples' : 'Descriptive statistics'
    const note = lab === 'se'
      ? 'Std. Error in the table is s/√n from the descriptives engine.'
      : lab === 'ci'
        ? 'The mean CI uses the same t critical value as Descriptive Statistics.'
        : 'This draw is N(μ, σ²) unless you assigned a data column.'
    return wrap(title, desc, [note])
  }

  if (lab === 'variability') {
    const small = demoRows(Math.max(8, Math.floor(n / 4)), rng, mu, sigma)
    const large = demoRows(n, rng, mu, sigma)
    const a = runDescriptiveStatistics(small, { variables: ['x'], ciLevel: 0.95 })
    const b = runDescriptiveStatistics(large, { variables: ['x'], ciLevel: 0.95 })
    return {
      analysisId: 'learnStats.labs',
      title: 'Learn Stats — Sample variability',
      interpretation: `The same population, two sample sizes. Smaller n has a larger standard error. Compare the Std. Error columns.`,
      assumptions: ['Both samples are i.i.d. draws from the same N(μ, σ²) generator.'],
      footnotes: extras,
      tables: [
        { ...a.tables[0]!, id: 'small', title: `n = ${small.length}` },
        { ...b.tables[0]!, id: 'large', title: `n = ${large.length}` },
      ],
      plots: [...a.plots, ...b.plots],
    }
  }

  const power = runPowerAnalysis([], {
    design: 't.oneSample',
    compute: 'power',
    effectSize: Number(options.effectSize ?? 0.5),
    n,
    alpha: 0.05,
  })
  return wrap('Power reminder', power, extras)
}
