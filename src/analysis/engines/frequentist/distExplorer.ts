import type { AnalysisOptions, AnalysisResult } from '../../types'
import { compareFits, DISTRIBUTION_BY_ID, DISTRIBUTIONS, type DistributionId } from '../../../lib/distributions'
import { asFiniteNumber, round } from './numeric'
import { binomialBf10 } from '../bayesian/categorical'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

export function runDistributions(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const family = String(options.family ?? 'auto') as DistributionId | 'auto'
  const x = rows.map((r) => asFiniteNumber(r[variable])).filter((v): v is number => v !== null)
  if (x.length < 8) return empty('distributions.explorer', 'Distribution Families', 'Need a numeric column with at least eight values.')
  const ids = (family === 'auto'
    ? DISTRIBUTIONS.filter((d) => d.fit && d.family !== 'multivariate' && d.id !== 'empirical').map((d) => d.id)
    : [family]) as DistributionId[]
  const results = compareFits(x, ids).slice(0, 12)
  const best = results[0]
  const dist = best ? DISTRIBUTION_BY_ID[best.id] : DISTRIBUTION_BY_ID.normal
  const xs = Array.from({ length: 80 }, (_, i) => Math.min(...x) + i * (Math.max(...x) - Math.min(...x)) / 79)
  const dens = xs.map((v) => dist.pdf(v, best?.params ?? { mu: 0, sigma: 1 }, x))
  return {
    analysisId: 'distributions.explorer',
    title: 'Distribution Families',
    interpretation: best
      ? `Best fit among ${results.length} families: ${best.name} (${best.method} = ${round(best.statistic)}, p = ${best.pValue === null ? '—' : round(best.pValue)}).`
      : 'No fitted family.',
    assumptions: ['KS for continuous families; chi-square for discrete. ZIP/ZINB/skew-normal/Wald/mixture/stretched-beta are included. Multivariate Dirichlet/multinomial are omitted from auto-rank.'],
    footnotes: ['The same catalog drives /distributions. Bayesian mode reports a Beta(1,1) BF only as a sanity check on P(X>median) vs 1/2, not a model-average over families.'],
    tables: [{
      id: 'fit',
      title: 'Goodness-of-fit ranking',
      columns: ['Rank', 'Family', 'Method', 'Statistic', 'p'],
      rows: results.map((r, i) => [i + 1, r.name, r.method, round(r.statistic), r.pValue === null ? '—' : round(r.pValue)]),
    }],
    plots: [{
      id: 'dens',
      title: best ? `${best.name} overlay` : 'Density',
      data: [
        { type: 'histogram', x, nbinsx: 20, histnorm: 'probability density', name: 'Data' },
        { type: 'scatter', mode: 'lines', x: xs, y: dens, name: dist.name },
      ],
      layout: { margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runBayesianDistributions(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const freq = runDistributions(rows, options)
  const variable = String(options.variable ?? '')
  const x = rows.map((r) => asFiniteNumber(r[variable])).filter((v): v is number => v !== null)
  const med = x.slice().sort((a, b) => a - b)[Math.floor(x.length / 2)] ?? 0
  const k = x.filter((v) => v > med).length
  const bf10 = binomialBf10(k, x.length, 0.5, 1, 1)
  return {
    ...freq,
    interpretation: `P(X > sample median) vs 1/2: BF₁₀ = ${round(bf10)}. ${freq.interpretation}`,
    tables: [...freq.tables, { id: 'bf', title: 'Sign BF vs 1/2', columns: ['k', 'n', 'BF₁₀'], rows: [[k, x.length, round(bf10)]] }],
  }
}
