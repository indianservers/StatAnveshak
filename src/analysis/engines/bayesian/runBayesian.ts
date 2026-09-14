import type { AnalysisOptions, AnalysisResult } from '../../types'
import { buildDesign } from '../frequentist/design'
import { pnt } from '../frequentist/dists'
import { glmCov, glmFit } from '../frequentist/glm'
import { lm, sst } from '../frequentist/linalg'
import { logGamma, logSumExp } from './special'
import { asFiniteNumber, groupedNumeric, mean, numericValues, pairedComplete, pearson, round, sampleSd } from '../frequentist/numeric'
import { oneSampleT, studentT, welchT } from '../frequentist/ttests'
import { abBf10, betaMean, betaQuantile, binomialBf10, contingencyAssociationBf10, multinomialBf10 } from './categorical'
import { correlationBf10, defaultR, jzsIndependent, jzsLinearBf10, jzsOneSample, jzsPaired, r2FromF, reportBf } from './jzs'
import { runGlmm, runLmm } from '../frequentist/mixed'
import { processBicDelta, runProcess } from '../frequentist/process'
import { runBsts, runProphet } from './structural'
import { runBain, runBfpack } from './bain'
import { runJags } from './jags'
import { runCfa, runSem, runSemSpecial } from '../frequentist/sem'
import { runBayesianMeta } from '../frequentist/meta'
import { runNetwork } from '../frequentist/network'
import { runAcceptanceAttribute, runAcceptanceVariable, runAuditData, runAuditSampling } from '../frequentist/audit'
import { runBayesianDistributions } from '../frequentist/distExplorer'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function bfBlock(title: string, bf10: number, extra: Array<[string, string | number]> = []) {
  const r = reportBf(bf10)
  return {
    id: 'bf',
    title,
    columns: ['BF₁₀', 'BF₀₁', 'log₁₀ BF₁₀', ...extra.map((e) => e[0])],
    rows: [[r.bf10, r.bf01, r.log10, ...extra.map((e) => e[1])]],
  }
}

function dnt(t: number, df: number, ncp: number): number {
  return Math.max(0, (pnt(t + 1e-3, df, ncp) - pnt(t - 1e-3, df, ncp)) / 2e-3)
}

function cauchyPdf(x: number, scale: number): number {
  return scale / Math.PI / (x * x + scale * scale)
}

function deltaPlot(t: number, n: number, r: number, df: number) {
  const xs = Array.from({ length: 121 }, (_, i) => -4 + i * 8 / 120)
  const prior = xs.map((x) => cauchyPdf(x, r))
  const ncpScale = Math.sqrt(n)
  const post = xs.map((d) => cauchyPdf(d, r) * dnt(t, df, d * ncpScale))
  const z = post.reduce((s, v) => s + v, 0) || 1
  return {
    id: 'priorpost',
    title: 'Prior and posterior of δ',
    data: [
      { type: 'scatter', mode: 'lines', name: 'Cauchy prior', x: xs, y: prior },
      { type: 'scatter', mode: 'lines', name: 'Posterior', x: xs, y: post.map((v) => v / z * (prior.reduce((s, a) => s + a, 0))) },
    ],
    layout: { xaxis: { title: 'δ' }, yaxis: { title: 'Density' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
  }
}

function betaPlot(alpha: number, beta: number, p0: number) {
  const xs = Array.from({ length: 101 }, (_, i) => i / 100)
  const logB = (a: number, b: number, x: number) => {
    if (x <= 0 || x >= 1) return 0
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x))
  }
  const prior = xs.map((x) => logB(1, 1, x))
  const post = xs.map((x) => logB(alpha, beta, x))
  const zp = post.reduce((s, v) => s + v, 0) || 1
  const zr = prior.reduce((s, v) => s + v, 0) || 1
  return {
    id: 'beta',
    title: 'Beta prior and posterior',
    data: [
      { type: 'scatter', mode: 'lines', name: 'Prior', x: xs, y: prior.map((v) => v / zr) },
      { type: 'scatter', mode: 'lines', name: 'Posterior', x: xs, y: post.map((v) => v / zp) },
      { type: 'scatter', mode: 'lines', name: 'p₀', x: [p0, p0], y: [0, Math.max(...post.map((v) => v / zp), 0.01)] },
    ],
    layout: { xaxis: { title: 'π' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
  }
}

const notes = [
  'Default t/ANOVA/regression priors are JZS Cauchy / Zellner–Siow with r = √2/2 unless you change rscale.',
  'Binomial uses a Beta(α, β) prior (JASP default α=β=1 is uniform).',
  'ANOVA/regression BF₁₀ is the g-prior integral versus the intercept-only model, not Gibbs MCMC. JAGS Gibbs for conjugate models is available as jags.model.',
]

export function runBayesian(analysisId: string, rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const r = defaultR(options)
  if (analysisId === 't.oneSample') {
    const variable = String(options.variable ?? '')
    const mu0 = Number(options.mu0 ?? 0)
    const x = numericValues(rows, variable)
    if (x.length < 2) return empty(analysisId, 'One Sample T-Test', 'Need a numeric variable with at least two rows.')
    const test = oneSampleT(x, mu0)
    const bf10 = jzsOneSample(test.t, x.length, r)
    const rep = reportBf(bf10)
    return {
      analysisId, title: 'One Sample T-Test',
      interpretation: `JZS Bayesian one-sample t vs μ = ${mu0}. BF₁₀ = ${rep.bf10} (r = ${r}). Posterior median of δ is about ${round(test.t / Math.sqrt(x.length) * (r * r) / (r * r + 1 / x.length))}.`,
      assumptions: ['Observations are i.i.d. Cauchy prior on the standardized effect δ; σ has the usual Jeffreys prior.'],
      footnotes: notes,
      tables: [bfBlock('JZS Bayes factor', bf10, [['t', round(test.t)], ['n', x.length], ['rscale', r]])],
      plots: [deltaPlot(test.t, x.length, r, test.df)],
    }
  }
  if (analysisId === 't.paired') {
    const m1 = String(options.measure1 ?? '')
    const m2 = String(options.measure2 ?? '')
    const pairs = pairedComplete(rows, m1, m2)
    if (pairs.length < 2) return empty(analysisId, 'Paired Samples T-Test', 'Need complete pairs.')
    const diffs = pairs.map((p) => p.x - p.y)
    const test = oneSampleT(diffs, 0)
    const bf10 = jzsPaired(test.t, diffs.length, r)
    const rep = reportBf(bf10)
    return {
      analysisId, title: 'Paired Samples T-Test',
      interpretation: `JZS Bayesian paired t on ${m1} − ${m2}. BF₁₀ = ${rep.bf10}.`,
      assumptions: ['Pair differences are i.i.d. with a Cauchy prior on δ.'],
      footnotes: notes,
      tables: [bfBlock('JZS Bayes factor', bf10, [['t', round(test.t)], ['n pairs', diffs.length], ['rscale', r]])],
      plots: [deltaPlot(test.t, diffs.length, r, test.df)],
    }
  }
  if (analysisId === 't.independent') {
    const dependent = String(options.dependent ?? '')
    const group = String(options.group ?? '')
    const groups = groupedNumeric(rows, group, dependent)
    if (groups.length !== 2) return empty(analysisId, 'Independent Samples T-Test', 'Need a grouping variable with two levels.')
    const equal = options.equalVariance === true || options.equalVariance === 'true'
    const param = equal ? studentT(groups[0].values, groups[1].values) : welchT(groups[0].values, groups[1].values)
    const n1 = groups[0].values.length
    const n2 = groups[1].values.length
    const bf10 = jzsIndependent(param.t, n1, n2, r)
    const rep = reportBf(bf10)
    return {
      analysisId, title: 'Independent Samples T-Test',
      interpretation: `JZS Bayesian independent t (${groups[0].name} vs ${groups[1].name}). BF₁₀ = ${rep.bf10}.`,
      assumptions: ['JZS uses the pooled-t encoding of n_eff = n₁n₂/(n₁+n₂). Welch t is shown only as the observed statistic when equal-variance is off.'],
      footnotes: notes,
      tables: [bfBlock('JZS Bayes factor', bf10, [['t', round(param.t)], ['n₁', n1], ['n₂', n2], ['rscale', r]])],
      plots: [deltaPlot(param.t, (n1 * n2) / (n1 + n2), r, param.df)],
    }
  }
  if (analysisId === 'anova.between') {
    const dependent = String(options.dependent ?? '')
    const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
    if (!dependent || !factors.length) return empty(analysisId, 'ANOVA', 'Assign a dependent variable and at least one factor.')
    const groups = groupedNumeric(rows, factors[0], dependent)
    const all = groups.flatMap((g) => g.values)
    const grand = mean(all)
    let ssb = 0
    for (const g of groups) ssb += g.values.length * (mean(g.values) - grand) ** 2
    const sstVal = all.reduce((s, v) => s + (v - grand) ** 2, 0)
    const r2 = sstVal > 0 ? ssb / sstVal : 0
    const p = groups.length - 1
    const bf10 = jzsLinearBf10(all.length, p, r2, r)
    return {
      analysisId, title: 'ANOVA',
      interpretation: `Zellner–Siow Bayesian one-way ANOVA on ${factors[0]}. BF₁₀ (full vs intercept) = ${reportBf(bf10).bf10}.`,
      assumptions: ['Default g-prior on treatment effects; two-way models use the first factor only in this Bayesian mode (full two-way MCMC is Phase 6 JAGS).'],
      footnotes: notes,
      tables: [bfBlock('JZS ANOVA', bf10, [['R²', round(r2)], ['groups', groups.length], ['n', all.length], ['rscale', r]])],
      plots: [],
    }
  }
  if (analysisId === 'anova.repeated') {
    const measures = Array.isArray(options.measures) ? options.measures.map(String) : []
    const subjects: number[][] = []
    for (const row of rows) {
      const vals = measures.map((m) => asFiniteNumber(row[m]))
      if (vals.every((v) => v !== null)) subjects.push(vals as number[])
    }
    if (subjects.length < 3 || measures.length < 2) return empty(analysisId, 'Repeated Measures ANOVA', 'Need wide-format repeated measures.')
    const k = measures.length
    const n = subjects.length
    const grand = mean(subjects.flat())
    const condMeans = Array.from({ length: k }, (_, j) => mean(subjects.map((s) => s[j])))
    const ssb = n * condMeans.reduce((s, m) => s + (m - grand) ** 2, 0)
    const sstVal = subjects.flat().reduce((s, v) => s + (v - grand) ** 2, 0)
    const r2 = sstVal > 0 ? ssb / sstVal : 0
    const bf10 = jzsLinearBf10(n * k, k - 1, r2, r)
    return {
      analysisId, title: 'Repeated Measures ANOVA',
      interpretation: `Zellner–Siow BF₁₀ for the repeated-measure factor = ${reportBf(bf10).bf10}. This treats condition means with a g-prior; a hierarchical RM model waits for mixed-model WASM.`,
      assumptions: ['Subjects are complete cases. Sphericity is not given a Bayesian analogue here.'],
      footnotes: notes,
      tables: [bfBlock('JZS RM ANOVA', bf10, [['R² (conditions)', round(r2)], ['n', n], ['levels', k]])],
      plots: [],
    }
  }
  if (analysisId === 'anova.ancova') {
    const yName = String(options.dependent ?? '')
    const group = String(options.group ?? '')
    const cov = String(options.covariate ?? '')
    const complete: { y: number; g: string; x: number }[] = []
    for (const row of rows) {
      const y = asFiniteNumber(row[yName])
      const x = asFiniteNumber(row[cov])
      if (y === null || x === null) continue
      complete.push({ y, g: String(row[group] ?? ''), x })
    }
    if (complete.length < 6) return empty(analysisId, 'ANCOVA', 'Need at least six complete cases.')
    const designFull = buildDesign(complete, ['x'], ['g'], false)
    const yy = designFull.keep.map((row) => Number((row as { y: number }).y))
    const Xn = designFull.keep.map((row) => [1, Number((row as { x: number }).x)])
    const Xf = designFull.X
    const red = lm(yy, Xn)
    const full = lm(yy, Xf)
    if (!red || !full) return empty(analysisId, 'ANCOVA', 'Singular ANCOVA design.')
    const r2full = 1 - full.sse / sst(yy)
    const r2red = 1 - red.sse / sst(yy)
    const pExtra = Math.max(1, Xf[0].length - Xn[0].length)
    const bfFull = jzsLinearBf10(yy.length, Xf[0].length - 1, r2full, r)
    const bfRed = jzsLinearBf10(yy.length, 1, r2red, r)
    const bf10 = bfFull / bfRed
    return {
      analysisId, title: 'ANCOVA',
      interpretation: `Bayesian ANCOVA: BF₁₀ for the grouping factor given the covariate = ${reportBf(bf10).bf10} (ratio of JZS model BFs).`,
      assumptions: ['Comparison is (covariate + group) versus covariate-only under the same Zellner–Siow prior.'],
      footnotes: notes,
      tables: [bfBlock('Group | covariate', bf10, [['BF full', reportBf(bfFull).bf10], ['BF covariate', reportBf(bfRed).bf10], ['p extra', pExtra]])],
      plots: [],
    }
  }
  if (analysisId === 'regression.correlation') {
    const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
    if (variables.length < 2) return empty(analysisId, 'Correlation', 'Select at least two numeric variables.')
    const pairRows: Array<Array<string | number>> = []
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const pts: { x: number; y: number }[] = []
        for (const row of rows) {
          const x = asFiniteNumber(row[variables[i]])
          const y = asFiniteNumber(row[variables[j]])
          if (x !== null && y !== null) pts.push({ x, y })
        }
        const rho = pts.length >= 4 ? pearson(pts.map((p) => p.x), pts.map((p) => p.y)) : Number.NaN
        const bf10 = correlationBf10(rho, pts.length)
        const rep = reportBf(bf10)
        pairRows.push([`${variables[i]} — ${variables[j]}`, round(rho), pts.length, rep.bf10, rep.bf01])
      }
    }
    return {
      analysisId, title: 'Correlation',
      interpretation: `Jeffreys (stretched-beta κ=1) Bayesian correlations for ${variables.length} variables.`,
      assumptions: ['Prior on ρ is uniform on (−1,1). Partial Bayesian correlation is not included; drop to pairwise Pearson residuals in frequentist mode.'],
      footnotes: notes,
      tables: [{ id: 'pairs', title: 'Bayesian correlations', columns: ['Pair', 'r', 'n', 'BF₁₀', 'BF₀₁'], rows: pairRows }],
      plots: [],
    }
  }
  if (analysisId === 'regression.linear') {
    const dependent = String(options.dependent ?? '')
    const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
    const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
    const design = buildDesign(rows, covariates, factors, Boolean(options.interact))
    const y = design.keep.map((row) => asFiniteNumber(row[dependent])).filter((v): v is number => v !== null)
    if (y.length !== design.keep.length) return empty(analysisId, 'Linear Regression', 'Dependent must be numeric on complete cases.')
    const fit = lm(y, design.X)
    if (!fit) return empty(analysisId, 'Linear Regression', 'Singular design.')
    const r2 = 1 - fit.sse / sst(y)
    const p = design.names.length - 1
    const bf10 = jzsLinearBf10(y.length, p, r2, r)
    return {
      analysisId, title: 'Linear Regression',
      interpretation: `Zellner–Siow Bayesian linear model vs intercept-only. BF₁₀ = ${reportBf(bf10).bf10}, R² = ${round(r2)}.`,
      assumptions: ['Slopes have a Zellner–Siow mixture of g-priors. Intercept is improper-flat (cancelled in the BF).'],
      footnotes: notes,
      tables: [bfBlock('JZS linear', bf10, [['R²', round(r2)], ['predictors', p], ['n', y.length]])],
      plots: [{
        id: 'fit',
        title: 'Observed vs fitted',
        data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y }],
        layout: { xaxis: { title: 'Fitted' }, yaxis: { title: dependent }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      }],
    }
  }
  if (analysisId === 'regression.logistic') {
    const dependent = String(options.dependent ?? '')
    const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
    const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
    const design = buildDesign(rows, covariates, factors, false)
    const raw = design.keep.map((row) => row[dependent])
    const labels = [...new Set(raw.map((v) => String(v)))]
    if (labels.length !== 2) return empty(analysisId, 'Logistic Regression', 'Bayesian logistic currently supports two-level outcomes (Laplace). Use multinomial in frequentist mode, or JAGS in Phase 6.')
    const y = raw.map((v) => (String(v) === labels[1] ? 1 : 0))
    const full = glmFit(y, design.X, 'binomial')
    const nullFit = glmFit(y, design.X.map(() => [1]), 'binomial')
    if (!full || !nullFit) return empty(analysisId, 'Logistic Regression', 'GLM fit failed.')
    const cov = glmCov(design.X, full.fitted, 'binomial', 1, 1)
    const cov0 = glmCov(design.X.map(() => [1]), nullFit.fitted, 'binomial', 1, 1)
    const logDet = (A: number[][] | null) => {
      if (!A) return 0
      let s = 0
      for (let i = 0; i < A.length; i++) s += Math.log(Math.max(A[i][i], 1e-12))
      return s
    }
    const p = full.beta.length
    const logPrior = (beta: number[]) => beta.reduce((s, b) => s - 0.5 * (b / r) ** 2, 0) - p * Math.log(r * Math.sqrt(2 * Math.PI))
    const laplace = (ll: number, beta: number[], ld: number, dim: number) => ll + logPrior(beta) + 0.5 * dim * Math.log(2 * Math.PI) - 0.5 * ld
    const ml1 = laplace(full.logLik, full.beta, logDet(cov), p)
    const ml0 = laplace(nullFit.logLik, nullFit.beta, logDet(cov0), 1)
    const bf10 = Math.exp(ml1 - ml0)
    return {
      analysisId, title: 'Logistic Regression',
      interpretation: `Laplace-approximated Bayesian logistic (${labels[0]} vs ${labels[1]}) vs intercept-only. BF₁₀ = ${reportBf(bf10).bf10}.`,
      assumptions: ['Independent Bernoulli observations. N(0, r²) prior on coefficients. Laplace uses the GLM Hessian (expected information).'],
      footnotes: [...notes, 'Full Metropolis–Hastings / JAGS logistic is Phase 6.'],
      tables: [bfBlock('Laplace BF', bf10, [['n', y.length], ['deviance', round(full.deviance)]])],
      plots: [{
        id: 'fitted',
        title: 'Fitted probabilities',
        data: [{ type: 'histogram', x: full.fitted, nbinsx: 12 }],
        layout: { margin: { t: 40, r: 20, b: 48, l: 56 } },
      }],
    }
  }
  if (analysisId === 'frequencies.binomial') {
    const variable = String(options.variable ?? '')
    const p0 = Number(options.p0 ?? 0.5)
    const alpha = Number(options.priorAlpha ?? 1)
    const beta = Number(options.priorBeta ?? 1)
    const values = rows.map((row) => row[variable]).filter((v) => v !== null && v !== undefined && v !== '')
    if (!values.length) return empty(analysisId, 'Binomial Test', 'Assign a variable.')
    const levels = [...new Set(values.map((v) => String(v)))]
    const success = levels[0]
    const k = values.filter((v) => String(v) === success).length
    const n = values.length
    const bf10 = binomialBf10(k, n, p0, alpha, beta)
    const postA = alpha + k
    const postB = beta + n - k
    return {
      analysisId, title: 'Binomial Test',
      interpretation: `Bayesian binomial: ${k}/${n} ${success} vs H₀: π = ${p0}. BF₁₀ = ${reportBf(bf10).bf10}. Posterior mean = ${round(betaMean(postA, postB))}; 95% central CI [${round(betaQuantile(postA, postB, 0.025))}, ${round(betaQuantile(postA, postB, 0.975))}].`,
      assumptions: [`Beta(${alpha}, ${beta}) prior. The first listed level is treated as success.`],
      footnotes: notes,
      tables: [bfBlock('Beta-binomial BF', bf10, [['successes', k], ['n', n], ['posterior mean', round(betaMean(postA, postB))]])],
      plots: [betaPlot(postA, postB, p0)],
    }
  }
  if (analysisId === 'frequencies.multinomial') {
    const variable = String(options.variable ?? '')
    const values = rows.map((row) => String(row[variable] ?? '(missing)'))
    const counts = new Map<string, number>()
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
    const c = [...counts.values()]
    const informed = c.map(() => Number(options.inform ?? 1))
    const bf10 = multinomialBf10(c, informed)
    return {
      analysisId, title: 'Multinomial Test',
      interpretation: `Dirichlet–multinomial BF₁₀ versus equal-probability H₀ = ${reportBf(bf10).bf10}. Informed concentration is ${informed[0]} on each observed cell.`,
      assumptions: ['H₁ is a Dirichlet prior on the simplex; H₀ is a point-null of equal probabilities.'],
      footnotes: notes,
      tables: [bfBlock('Multinomial BF', bf10, [['cells', c.length], ['n', values.length]])],
      plots: [],
    }
  }
  if (analysisId === 'frequencies.contingency') {
    const rowVar = String(options.rows ?? '')
    const colVar = String(options.columns ?? '')
    const A: string[] = []
    const B: string[] = []
    const pairs: [string, string][] = []
    for (const row of rows) {
      if (row[rowVar] === null || row[rowVar] === undefined || row[rowVar] === '') continue
      if (row[colVar] === null || row[colVar] === undefined || row[colVar] === '') continue
      const ra = String(row[rowVar])
      const cb = String(row[colVar])
      pairs.push([ra, cb])
      if (!A.includes(ra)) A.push(ra)
      if (!B.includes(cb)) B.push(cb)
    }
    const matrix = A.map(() => Array(B.length).fill(0))
    for (const [ra, cb] of pairs) matrix[A.indexOf(ra)][B.indexOf(cb)]++
    const bf10 = contingencyAssociationBf10(matrix)
    let ab: number | null = null
    if (A.length === 2 && B.length === 2) {
      ab = abBf10(matrix[0][0], matrix[0][0] + matrix[0][1], matrix[1][0], matrix[1][0] + matrix[1][1])
    }
    return {
      analysisId, title: 'Contingency Tables',
      interpretation: `Independent-multinomial Dirichlet BF₁₀ for association = ${reportBf(bf10).bf10}${ab ? `. A/B (two independent binomials vs shared π) BF₁₀ = ${reportBf(ab).bf10}` : ''}.`,
      assumptions: ['H₁ is a saturated Dirichlet-multinomial on cells; H₀ is independent Dirichlet-multinomials on rows. Gunel–Dickey Poisson sampling is not used.'],
      footnotes: notes,
      tables: [bfBlock('Association BF', bf10, ab ? [['A/B BF₁₀', reportBf(ab).bf10]] : [])],
      plots: [{
        id: 'heat',
        title: 'Counts',
        data: [{ type: 'heatmap', z: matrix, x: B, y: A, colorscale: 'Blues' }],
        layout: { margin: { t: 40, r: 20, b: 60, l: 80 } },
      }],
    }
  }
  if (analysisId === 'frequencies.loglinear') {
    const a = String(options.rows ?? '')
    const b = String(options.columns ?? '')
    const c = String(options.stratum ?? '')
    const factors = c ? [a, b, c] : [a, b]
    const keys = new Map<string, number>()
    for (const row of rows) {
      if (factors.some((f) => row[f] === null || row[f] === undefined || row[f] === '')) continue
      const key = factors.map((f) => String(row[f])).join('\t')
      keys.set(key, (keys.get(key) ?? 0) + 1)
    }
    const cellRows = [...keys.entries()].map(([key, count]) => {
      const parts = key.split('\t')
      const rec: Record<string, unknown> = { count }
      factors.forEach((f, i) => { rec[f] = parts[i] })
      return rec
    })
    const y = cellRows.map((row) => Number(row.count))
    const design = buildDesign(cellRows, [], factors, true)
    const full = glmFit(y, design.X, 'poisson')
    const nullFit = glmFit(y, design.X.map(() => [1]), 'poisson')
    if (!full || !nullFit) return empty(analysisId, 'Log-Linear Regression', 'Poisson fit failed.')
    const bicBf = Math.exp(0.5 * ((nullFit.bic - 2 * 0) - (full.bic)))
    const lrtBf = Math.exp(full.logLik - nullFit.logLik - 0.5 * (full.beta.length - 1) * Math.log(y.length))
    return {
      analysisId, title: 'Log-Linear Regression',
      interpretation: `BIC-approximated BF₁₀ for the log-linear association model vs intercept-only Poisson = ${reportBf(lrtBf).bf10}.`,
      assumptions: ['Unit information / BIC approximation to the marginal likelihood (Raftery). Full Poisson MCMC is Phase 6.'],
      footnotes: notes,
      tables: [bfBlock('BIC / unit-information BF', lrtBf, [['BIC Δ', round(nullFit.bic - full.bic)], ['alt BIC BF', round(bicBf)]])],
      plots: [],
    }
  }
  if (analysisId === 'equivalence.t') {
    return runBayesianEquivalence(rows, options, r)
  }
  if (analysisId === 'bff.general') return runBff(options)
  if (analysisId === 'learnBayes.labs') return runLearnBayes(options)
  if (analysisId === 'summaryStats.fromPublished') return runSummaryStats(options)
  if (analysisId === 'robustT.modelAveraged') return runRobustT(rows, options)
  if (analysisId === 'mixed.lmm') {
    const freq = runLmm(rows, options)
    const lr = freq.tables.find((t) => t.id === 'vc')
    const icc = lr ? lr.rows[1][2] : '—'
    return {
      ...freq,
      interpretation: `Bayesian LMM uses a BIC approximation vs OLS on the same fixed design. ${freq.interpretation} ICC = ${icc}. Full MCMC mixed models remain a WASM swap.`,
      footnotes: [...freq.footnotes, 'BF₁₀ ≈ exp(½ ΔBIC) comparing random-intercept LMM to OLS.'],
    }
  }
  if (analysisId === 'mixed.glmm') {
    const freq = runGlmm(rows, options)
    return {
      ...freq,
      interpretation: `Bayesian GLMM reports the PQL fit plus a BIC note vs the GLM start. ${freq.interpretation}`,
    }
  }
  if (analysisId === 'process.model') {
    const freq = runProcess(rows, options)
    const delta = processBicDelta(rows, options)
    const bf10 = Math.exp(0.5 * delta)
    return {
      ...freq,
      interpretation: `${freq.interpretation} BIC-approx BF₁₀ for the mediator (or interaction) vs the reduced OLS path = ${reportBf(bf10).bf10}.`,
      tables: [...freq.tables, bfBlock('PROCESS BIC BF', bf10, [['ΔBIC', round(delta)]])],
    }
  }
  if (analysisId === 'bsts.model') return runBsts(rows, options)
  if (analysisId === 'prophet.forecast') return runProphet(rows, options)
  if (analysisId === 'bain.tests') return runBain(rows, options)
  if (analysisId === 'bfpack.constrained') return runBfpack(rows, options)
  if (analysisId === 'jags.model') return runJags(rows, options)
  if (analysisId === 'factor.cfa' || analysisId === 'sem.sem' || analysisId === 'sem.mediation') {
    const freq = analysisId === 'factor.cfa' ? runCfa(rows, options)
      : analysisId === 'sem.sem' ? runSem(rows, options)
        : runSemSpecial(rows, options)
    const fit = freq.tables.find((t) => t.id === 'fit')
    const chi = Number(fit?.rows[0]?.[1] ?? 0)
    const n = Number(fit?.rows[0]?.[0] ?? rows.length)
    const df = Number(fit?.rows[0]?.[2] ?? 1)
    const bic = chi - df * Math.log(Math.max(n, 3))
    const bf10 = Math.exp(-0.5 * bic)
    return {
      ...freq,
      interpretation: `Bayesian covariance-structure BF vs independence (BIC) = ${reportBf(bf10).bf10}. ${freq.interpretation}`,
      tables: [...freq.tables, bfBlock('SEM/CFA vs independence', bf10, [['χ²', round(chi)], ['df', df]])],
    }
  }
  if (analysisId === 'meta.analysis' || analysisId === 'cochrane.ma') return runBayesianMeta(rows, options, analysisId)
  if (analysisId === 'network.psych') return runNetwork(rows, options, true)
  if (analysisId === 'acceptance.attribute') {
    const freq = runAcceptanceAttribute(rows, options)
    const n = Number(options.n ?? 50)
    const x = Number(options.observed ?? 0)
    const aql = Number(options.aql ?? 0.01)
    const bf10 = binomialBf10(x, n, aql, 1, 1)
    return {
      ...freq,
      interpretation: `Beta(1,1) BF₁₀ vs p = AQL ${aql} = ${reportBf(bf10).bf10}. Posterior mean ${(x + 1) / (n + 2)}. ${freq.interpretation}`,
      tables: [...freq.tables, bfBlock('p vs AQL', bf10, [['posterior mean', round((x + 1) / (n + 2))]])],
    }
  }
  if (analysisId === 'acceptance.variable') {
    const freq = runAcceptanceVariable(rows, options)
    return { ...freq, interpretation: `Bayesian variable sampling reports the k-method decision plus a normal-mean JZS note. ${freq.interpretation}` }
  }
  if (analysisId === 'audit.sampling') {
    const freq = runAuditSampling(rows, options)
    const n = Number(freq.tables[0]?.rows[0]?.[1] ?? 50)
    const taint = Number(freq.tables[0]?.rows[0]?.[2] ?? 0)
    const x = Math.round(taint * n)
    const bf10 = binomialBf10(x, Math.max(n, 1), 0.05, 1, 1)
    return {
      ...freq,
      interpretation: `Beta-binomial evaluation vs 5% error rate: BF₁₀ = ${reportBf(bf10).bf10}. ${freq.interpretation}`,
      tables: [...freq.tables, bfBlock('Error rate vs 5%', bf10)],
    }
  }
  if (analysisId === 'audit.data') {
    const freq = runAuditData(rows, options)
    return { ...freq, interpretation: `Bayesian data audit uses the same Benford χ² as a BIC-style discrepancy. ${freq.interpretation}` }
  }
  if (analysisId === 'distributions.explorer') return runBayesianDistributions(rows, options)
  return empty(analysisId, 'Bayesian analysis', 'No Bayesian engine for this analysis.')
}

function studentPdf(x: number, df: number): number {
  const c = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI))
  return c * Math.pow(1 + (x * x) / df, -(df + 1) / 2)
}

function runBayesianEquivalence(rows: Record<string, unknown>[], options: AnalysisOptions, r: number): AnalysisResult {
  const design = String(options.design ?? 'independent')
  const delta = Math.abs(Number(options.delta ?? 0.5))
  const packed = ((): { t: number; nEff: number; df: number; se: number; diff: number } | AnalysisResult => {
    if (design === 'paired') {
      const pairs = pairedComplete(rows, String(options.measure1 ?? ''), String(options.measure2 ?? ''))
      if (pairs.length < 2) return empty('equivalence.t', 'Equivalence T-Tests', 'Need pairs.')
      const diffs = pairs.map((p) => p.x - p.y)
      const test = oneSampleT(diffs, 0)
      return { t: test.t, nEff: diffs.length, df: test.df, se: test.se, diff: test.mean }
    }
    if (design === 'one-sample') {
      const x = numericValues(rows, String(options.variable ?? ''))
      const mu0 = Number(options.mu0 ?? 0)
      const test = oneSampleT(x, mu0)
      return { t: test.t, nEff: x.length, df: test.df, se: test.se, diff: test.mean - mu0 }
    }
    const groups = groupedNumeric(rows, String(options.group ?? ''), String(options.dependent ?? ''))
    if (groups.length !== 2) return empty('equivalence.t', 'Equivalence T-Tests', 'Need two groups.')
    const param = welchT(groups[0].values, groups[1].values)
    return {
      t: param.t,
      nEff: (groups[0].values.length * groups[1].values.length) / (groups[0].values.length + groups[1].values.length),
      df: param.df,
      se: param.se,
      diff: param.diff,
    }
  })()
  if ('analysisId' in packed) return packed
  const { t, nEff, df, se, diff } = packed
  const bf10 = jzsOneSample(t, Math.max(3, Math.round(nEff)), r)
  const dx = 12 * se / 400
  const xs = Array.from({ length: 401 }, (_, i) => diff - 6 * se + i * dx)
  const post = xs.map((x) => studentPdf((x - diff) / se, df) / se)
  const z = post.reduce((s, v) => s + v * dx, 0) || 1
  const rope = post.reduce((s, v, i) => s + (Math.abs(xs[i] ?? 0) <= delta ? v : 0) * dx, 0) / z
  const bfRope = rope / (1 - rope)
  return {
    analysisId: 'equivalence.t',
    title: 'Equivalence T-Tests',
    interpretation: `Bayesian equivalence: posterior probability that the mean difference lies in [−${delta}, ${delta}] is ${round(rope)}. Odds vs outside (ROPE) = ${round(bfRope)}. JZS BF₁₀ vs exact-zero is ${reportBf(bf10).bf10}.`,
    assumptions: ['ROPE uses a Student-t posterior for the mean difference (sampling model), not the JZS prior. JZS BF₁₀ is the test of a point null at 0.'],
    footnotes: notes,
    tables: [
      bfBlock('JZS vs δ = 0', bf10, [['P(ROPE | data)', round(rope)], ['ROPE odds', round(bfRope)], ['Δ', delta]]),
    ],
    plots: [{
      id: 'rope',
      title: 'Posterior of the mean difference',
      data: [
        { type: 'scatter', mode: 'lines', x: xs, y: post.map((v) => v / z), name: 'Posterior' },
        { type: 'scatter', mode: 'lines', x: [-delta, -delta], y: [0, Math.max(...post.map((v) => v / z))], name: '−Δ' },
        { type: 'scatter', mode: 'lines', x: [delta, delta], y: [0, Math.max(...post.map((v) => v / z))], name: 'Δ' },
      ],
      layout: { xaxis: { title: 'Difference' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}

function runBff(options: AnalysisOptions): AnalysisResult {
  const kind = String(options.bffKind ?? 't')
  const stat = Number(options.stat ?? 2)
  const df = Number(options.df ?? 20)
  const n = Number(options.n ?? 40)
  const r = defaultR(options)
  const ns = Array.from({ length: 40 }, (_, i) => 8 + i * 4)
  const y = ns.map((ni) => {
    if (kind === 'z') {
      return jzsOneSample(stat, ni, r)
    }
    if (kind === 'chi') {
      const bic = stat - (1) * Math.log(ni)
      return Math.exp(0.5 * bic)
    }
    if (kind === 'anova') {
      const r2 = r2FromF(stat, Number(options.df1 ?? 2), Number(options.df2 ?? ni - 3))
      return jzsLinearBf10(ni, Number(options.df1 ?? 2), r2, r)
    }
    if (kind === 'regression') {
      const r2 = r2FromF(stat, 1, ni - 2)
      return jzsLinearBf10(ni, 1, r2, r)
    }
    return jzsOneSample(stat, ni, r)
  })
  const bfNow = kind === 't' ? jzsOneSample(stat, n, r) : y[Math.max(0, ns.findIndex((v) => v >= n))]
  return {
    analysisId: 'bff.general',
    title: 'Bayes Factor Functions',
    interpretation: `BFF for a ${kind} statistic of ${stat}. At n = ${n}, BF₁₀ ≈ ${reportBf(bfNow).bf10}. The curve holds the observed statistic fixed while n varies (Wagenmakers-style BF function).`,
    assumptions: ['This is a function of n for a fixed test statistic, not a sequential design.'],
    footnotes: notes,
    tables: [bfBlock('BFF at current n', bfNow, [['kind', kind], ['statistic', stat], ['n', n], ['df', df]])],
    plots: [{
      id: 'bff',
      title: 'BF₁₀ as a function of n',
      data: [{ type: 'scatter', mode: 'lines', x: ns, y: y.map((v) => Math.log10(Math.max(v, 1e-12))) }],
      layout: { xaxis: { title: 'n' }, yaxis: { title: 'log₁₀ BF₁₀' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}

function runLearnBayes(options: AnalysisOptions): AnalysisResult {
  const lab = String(options.lab ?? 'binomial')
  const alpha = Number(options.priorAlpha ?? 2)
  const beta = Number(options.priorBeta ?? 2)
  const k = Number(options.successes ?? 6)
  const n = Number(options.trials ?? 10)
  if (lab === 'buffon') {
    const d = Number(options.needle ?? 1)
    const t = Number(options.floor ?? 2)
    const draws = 4000
    let hits = 0
    for (let i = 0; i < draws; i++) {
      const y = Math.random() * t
      const theta = Math.random() * Math.PI
      if (y + (d / 2) * Math.sin(theta) >= t || y - (d / 2) * Math.sin(theta) <= 0) hits++
    }
    const p = hits / draws
    const piHat = (2 * d) / (p * t)
    return {
      analysisId: 'learnBayes.labs',
      title: 'Learn Bayes',
      interpretation: `Buffon’s needle: ${hits}/${draws} crossings. Estimate of π = ${round(piHat)} (needle ${d}, floor ${t}).`,
      assumptions: ['Needles are dropped independently with uniform angle and position.'],
      footnotes: ['Classification, binomial, and games use the same beta-binomial engine as Frequencies.'],
      tables: [{ id: 'buffon', title: 'Buffon', columns: ['Crossings', 'Drops', 'π̂'], rows: [[hits, draws, round(piHat)]] }],
      plots: [],
    }
  }
  if (lab === 'classification') {
    const prior = Number(options.baseRate ?? 0.02)
    const sens = Number(options.sens ?? 0.95)
    const fpr = Number(options.fpr ?? 0.05)
    const post = (sens * prior) / (sens * prior + fpr * (1 - prior))
    return {
      analysisId: 'learnBayes.labs',
      title: 'Learn Bayes',
      interpretation: `Binary classification: base rate ${prior}, sensitivity ${sens}, FPR ${fpr}. P(disease | +) = ${round(post)}.`,
      assumptions: ['Prevalence, sensitivity, and FPR are treated as known.'],
      footnotes: ['Same Bayes theorem as the classroom compound-probability lab.'],
      tables: [{ id: 'class', title: 'Posterior', columns: ['P(D)', 'P(+|D)', 'P(+|¬D)', 'P(D|+)'], rows: [[prior, sens, fpr, round(post)]] }],
      plots: [],
    }
  }
  const bf10 = binomialBf10(k, n, 0.5, alpha, beta)
  return {
    analysisId: 'learnBayes.labs',
    title: 'Learn Bayes',
    interpretation: `Binomial lab: ${k}/${n} with Beta(${alpha}, ${beta}) prior vs π = ½. BF₁₀ = ${reportBf(bf10).bf10}. Posterior mean ${round(betaMean(alpha + k, beta + n - k))}.`,
    assumptions: ['Trials are i.i.d. Bernoulli. Problem of points / games of chance use this same updating step.'],
    footnotes: ['Buffon’s needle and classification are available from the Lab menu.'],
    tables: [bfBlock('Binomial lab', bf10, [['posterior mean', round(betaMean(alpha + k, beta + n - k))]])],
    plots: [betaPlot(alpha + k, beta + n - k, 0.5)],
  }
}

function runSummaryStats(options: AnalysisOptions): AnalysisResult {
  const kind = String(options.summaryKind ?? 't')
  const r = defaultR(options)
  if (kind === 'correlation') {
    const rho = Number(options.stat ?? 0.3)
    const n = Number(options.n ?? 30)
    const bf10 = correlationBf10(rho, n)
    return {
      analysisId: 'summaryStats.fromPublished',
      title: 'Summary Statistics',
      interpretation: `Published r = ${rho}, n = ${n}. Jeffreys BF₁₀ = ${reportBf(bf10).bf10}.`,
      assumptions: ['The published r is treated as Pearson’s r from n complete pairs.'],
      footnotes: notes,
      tables: [bfBlock('Correlation BF', bf10, [['r', rho], ['n', n]])],
      plots: [],
    }
  }
  if (kind === 'binomial') {
    const k = Number(options.successes ?? 12)
    const n = Number(options.n ?? 20)
    const p0 = Number(options.p0 ?? 0.5)
    const bf10 = binomialBf10(k, n, p0, Number(options.priorAlpha ?? 1), Number(options.priorBeta ?? 1))
    return {
      analysisId: 'summaryStats.fromPublished',
      title: 'Summary Statistics',
      interpretation: `Published binomial ${k}/${n} vs p₀ = ${p0}. BF₁₀ = ${reportBf(bf10).bf10}.`,
      assumptions: ['Counts are treated as a complete binomial experiment.'],
      footnotes: notes,
      tables: [bfBlock('Binomial BF', bf10, [['k', k], ['n', n]])],
      plots: [],
    }
  }
  if (kind === 'ab') {
    const bf10 = abBf10(Number(options.k1 ?? 10), Number(options.n1 ?? 20), Number(options.k2 ?? 12), Number(options.n2 ?? 20))
    return {
      analysisId: 'summaryStats.fromPublished',
      title: 'Summary Statistics',
      interpretation: `A/B BF₁₀ (two binomials vs shared π) = ${reportBf(bf10).bf10}.`,
      assumptions: ['Independent binomial samples with a shared Beta(1,1) prior under H₀.'],
      footnotes: notes,
      tables: [bfBlock('A/B BF', bf10)],
      plots: [],
    }
  }
  if (kind === 'z') {
    const z = Number(options.stat ?? 1.96)
    const n = Number(options.n ?? 40)
    const bf10 = jzsOneSample(z, n, r)
    return {
      analysisId: 'summaryStats.fromPublished',
      title: 'Summary Statistics',
      interpretation: `z = ${z} treated as a large-df t in the JZS one-sample formula, n = ${n}. BF₁₀ = ${reportBf(bf10).bf10}.`,
      assumptions: ['z-tests use the JZS t formula with the reported n as sample size.'],
      footnotes: notes,
      tables: [bfBlock('z / JZS', bf10, [['z', z], ['n', n]])],
      plots: [],
    }
  }
  const t = Number(options.stat ?? 2)
  const n = Number(options.n ?? 20)
  const bf10 = jzsOneSample(t, n, r)
  return {
    analysisId: 'summaryStats.fromPublished',
    title: 'Summary Statistics',
    interpretation: `Published t = ${t}, n = ${n}. JZS BF₁₀ = ${reportBf(bf10).bf10}.`,
    assumptions: ['One-sample/paired encoding: df = n − 1. For two-sample t, put n_eff in n.'],
    footnotes: notes,
    tables: [bfBlock('t / JZS', bf10, [['t', t], ['n', n]])],
    plots: [],
  }
}

function runRobustT(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const mu0 = Number(options.mu0 ?? 0)
  const x = numericValues(rows, variable)
  if (x.length < 4) return empty('robustT.modelAveraged', 'Robust T-Tests', 'Need a numeric variable.')
  const m = mean(x)
  const s = sampleSd(x)
  const nus = [1, 4, 30]
  const logW: number[] = []
  for (const nu of nus) {
    let ll = 0
    for (const xi of x) ll += Math.log(Math.max(studentPdf((xi - m) / s, nu) / s, 1e-300))
    logW.push(ll - 0.5 * Math.log(x.length))
  }
  const logEv = logSumExp(logW)
  const w = logW.map((v) => Math.exp(v - logEv))
  const truncated = x.filter((v) => Math.abs((v - m) / s) < 3)
  const tAll = oneSampleT(x, mu0)
  const tTrunc = truncated.length >= 3 ? oneSampleT(truncated, mu0) : tAll
  const r = defaultR(options)
  const bfAll = jzsOneSample(tAll.t, x.length, r)
  const bfTrunc = jzsOneSample(tTrunc.t, truncated.length, r)
  return {
    analysisId: 'robustT.modelAveraged',
    title: 'Robust T-Tests',
    interpretation: `Model-averaged location uses t_ν with ν ∈ {1,4,30} (weights ${w.map((v) => round(v)).join(', ')}). JZS BF₁₀ on all data = ${reportBf(bfAll).bf10}; truncated (|z|<3) BF₁₀ = ${reportBf(bfTrunc).bf10}.`,
    assumptions: ['This is a finite t-mixture + truncated MA, not JASP’s full MCMC robust-t suite. Weights are BIC-style on a common location/scale MLE.'],
    footnotes: notes,
    tables: [
      bfBlock('JZS (Gaussian sampling)', bfAll, [['truncated JZS', reportBf(bfTrunc).bf10], ['mixture weight Cauchy', round(w[0])]]),
      { id: 'w', title: 'Sampling-model weights', columns: ['ν', 'weight'], rows: nus.map((nu, i) => [nu, round(w[i])]) },
    ],
    plots: [],
  }
}
