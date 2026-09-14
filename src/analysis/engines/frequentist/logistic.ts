import type { AnalysisOptions, AnalysisResult } from '../../types'
import { buildDesign } from './design'
import { pnorm, pTailChi } from './dists'
import { estimateNbTheta, glmCov, glmFit, type GlmFamily } from './glm'
import { solve } from './linalg'
import { asFiniteNumber, round } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function encodeBinary(values: unknown[]): { y: number[]; labels: string[] } | null {
  const labels = [...new Set(values.map((v) => String(v)))]
  if (labels.length !== 2) return null
  return { y: values.map((v) => (String(v) === labels[1] ? 1 : 0)), labels }
}

function softmax(eta: number[]): number[] {
  const m = Math.max(...eta)
  const e = eta.map((v) => Math.exp(v - m))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / s)
}

function multinomialFit(yIndex: number[], X: number[][], k: number): number[][] | null {
  const n = yIndex.length
  const p = X[0].length
  const k1 = k - 1
  const beta = Array.from({ length: k1 }, () => Array(p).fill(0))
  for (let iter = 0; iter < 25; iter++) {
    const scores = Array(k1 * p).fill(0)
    const hess = Array.from({ length: k1 * p }, () => Array(k1 * p).fill(0))
    for (let i = 0; i < n; i++) {
      const eta = beta.map((b) => b.reduce((s, bj, j) => s + bj * X[i][j], 0))
      const pi = softmax([...eta, 0])
      for (let c = 0; c < k1; c++) {
        const yc = yIndex[i] === c ? 1 : 0
        const gc = yc - pi[c]
        for (let j = 0; j < p; j++) scores[c * p + j] += gc * X[i][j]
        for (let d = 0; d < k1; d++) {
          const w = pi[c] * ((c === d ? 1 : 0) - pi[d])
          for (let j = 0; j < p; j++) {
            for (let m = 0; m < p; m++) hess[c * p + j][d * p + m] += w * X[i][j] * X[i][m]
          }
        }
      }
    }
    const step = solve(hess, scores)
    if (!step) return null
    for (let c = 0; c < k1; c++) for (let j = 0; j < p; j++) beta[c][j] += step[c * p + j]
    if (Math.max(...step.map(Math.abs)) < 1e-6) break
  }
  return beta
}

function expit(z: number): number {
  if (z > 20) return 1
  if (z < -20) return 0
  return 1 / (1 + Math.exp(-z))
}

function ordinalPo(yIndex: number[], X: number[][], k: number): { cuts: number[]; beta: number[] } | null {
  const n = yIndex.length
  const p = X[0].length
  const q = k - 1
  const cuts = Array.from({ length: q }, (_, i) => Math.log((i + 1) / (q - i)))
  const beta = Array(p).fill(0)
  for (let iter = 0; iter < 40; iter++) {
    const dim = q + p
    const score = Array(dim).fill(0)
    const hess = Array.from({ length: dim }, () => Array(dim).fill(0))
    for (let i = 0; i < n; i++) {
      const xb = beta.reduce((s, b, j) => s + b * X[i][j], 0)
      const yi = yIndex[i]
      const F = [0, ...cuts.map((c) => expit(c - xb)), 1]
      const pi = Math.max(1e-12, F[yi + 1] - F[yi])
      const dF = cuts.map((c) => {
        const m = expit(c - xb)
        return m * (1 - m)
      })
      const dpiCuts = Array(q).fill(0)
      const dpiBeta = Array(p).fill(0)
      for (let t = 0; t < q; t++) {
        if (t === yi) dpiCuts[t] += dF[t]
        if (t === yi - 1) dpiCuts[t] -= dF[t]
      }
      const dFsum = (yi < q ? dF[yi] : 0) - (yi > 0 ? dF[yi - 1] : 0)
      for (let j = 0; j < p; j++) dpiBeta[j] = -dFsum * X[i][j]
      const gCuts = dpiCuts.map((d) => d / pi)
      const gBeta = dpiBeta.map((d) => d / pi)
      for (let t = 0; t < q; t++) score[t] += gCuts[t]
      for (let j = 0; j < p; j++) score[q + j] += gBeta[j]
      for (let a = 0; a < dim; a++) {
        const ga = a < q ? gCuts[a] : gBeta[a - q]
        for (let b = 0; b < dim; b++) {
          const gb = b < q ? gCuts[b] : gBeta[b - q]
          hess[a][b] -= ga * gb
        }
      }
    }
    const step = solve(hess.map((row) => row.map((v) => -v)), score)
    if (!step) return { cuts, beta }
    for (let t = 0; t < q; t++) cuts[t] += step[t]
    for (let j = 0; j < p; j++) beta[j] += step[q + j]
    for (let t = 1; t < q; t++) if (cuts[t] < cuts[t - 1]) cuts[t] = cuts[t - 1] + 0.05
    if (Math.max(...step.map(Math.abs)) < 1e-6) break
  }
  return { cuts, beta }
}

export function runLogistic(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
  let model = String(options.model ?? 'binomial')
  if (!dependent) return empty('regression.logistic', 'Logistic Regression', 'Assign a dependent variable.')
  if (!covariates.length && !factors.length) return empty('regression.logistic', 'Logistic Regression', 'Assign at least one predictor.')
  const design = buildDesign(rows, covariates, factors, false)
  const raw = design.keep.map((row) => row[dependent])
  const unique = [...new Set(raw.map((v) => String(v)))]
  if (model === 'binomial' && unique.length > 2) model = 'multinomial'

  if (model === 'multinomial') {
    const labels = unique
    if (labels.length < 3) return empty('regression.logistic', 'Logistic Regression', 'Multinomial needs at least three outcome levels.')
    const yIndex = raw.map((v) => labels.indexOf(String(v)))
    const beta = multinomialFit(yIndex, design.X, labels.length)
    if (!beta) return empty('regression.logistic', 'Logistic Regression', 'Multinomial Newton step failed (singular Hessian).')
    return {
      analysisId: 'regression.logistic',
      title: 'Logistic Regression',
      interpretation: `Multinomial logit for ${dependent} with ${labels.length} classes (reference ${labels[labels.length - 1]}), n = ${design.keep.length}.`,
      assumptions: ['Independence of irrelevant alternatives is assumed. The last listed level is the reference class.'],
      footnotes: ['Coefficients are log-odds versus the reference class. Bayesian logistic arrives in Phase 4.'],
      tables: [{
        id: 'coef',
        title: 'Multinomial coefficients',
        columns: ['Class vs reference', 'Term', 'Estimate'],
        rows: beta.flatMap((b, c) => b.map((est, j) => [labels[c], design.names[j], round(est)])),
      }],
      plots: [],
    }
  }

  if (model === 'ordinal') {
    const labels = [...unique].sort((a, b) => {
      const na = Number(a)
      const nb = Number(b)
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
      return a.localeCompare(b)
    })
    if (labels.length < 3) return empty('regression.logistic', 'Logistic Regression', 'Ordinal models need at least three ordered levels.')
    const yIndex = raw.map((v) => labels.indexOf(String(v)))
    const po = ordinalPo(yIndex, design.X, labels.length)
    if (!po) return empty('regression.logistic', 'Logistic Regression', 'Proportional-odds fit failed.')
    return {
      analysisId: 'regression.logistic',
      title: 'Logistic Regression',
      interpretation: `Proportional-odds (cumulative logit) model for ${dependent} with order ${labels.join(' < ')}, n = ${design.keep.length}.`,
      assumptions: ['The proportional-odds assumption is imposed (common slopes). Level order is numeric if possible, otherwise alphabetical.'],
      footnotes: ['θ_j are thresholds on the latent logit; β are common location coefficients.', 'Bayesian ordinal models arrive in Phase 4.'],
      tables: [
        { id: 'cuts', title: 'Thresholds', columns: ['Cut', 'Estimate'], rows: po.cuts.map((c, i) => [`θ${i + 1} (${labels[i]} | ${labels[i + 1]})`, round(c)]) },
        { id: 'coef', title: 'Location coefficients', columns: ['Term', 'Estimate'], rows: design.names.map((name, i) => [name, round(po.beta[i])]) },
      ],
      plots: [],
    }
  }

  let encoded = encodeBinary(raw)
  if (!encoded) {
    const nums = raw.map((v) => asFiniteNumber(v))
    if (nums.every((v) => v !== null)) encoded = { y: (nums as number[]).map((v) => (v > 0 ? 1 : 0)), labels: ['≤0', '>0'] }
  }
  if (!encoded) return empty('regression.logistic', 'Logistic Regression', 'Binomial logistic needs a two-level outcome (or 0/1 numeric).')
  const fit = glmFit(encoded.y, design.X, 'binomial')
  if (!fit) return empty('regression.logistic', 'Logistic Regression', 'Binomial GLM did not converge.')
  const cov = glmCov(design.X, fit.fitted, 'binomial', 1, 1)
  const se = cov ? cov.map((row, i) => Math.sqrt(Math.max(row[i], 0))) : fit.beta.map(() => Number.NaN)
  const nullFit = glmFit(encoded.y, design.X.map(() => [1]), 'binomial')
  const lrt = nullFit ? 2 * (fit.logLik - nullFit.logLik) : Number.NaN
  return {
    analysisId: 'regression.logistic',
    title: 'Logistic Regression',
    interpretation: `Binomial logit for ${dependent} (${encoded.labels[0]} = 0, ${encoded.labels[1]} = 1), n = ${encoded.y.length}. AIC = ${round(fit.aic)}. LRT vs intercept-only χ² = ${round(lrt)}, p = ${round(pTailChi(lrt, Math.max(1, fit.beta.length - 1)))}.`,
    assumptions: [
      fit.converged ? `IRLS converged in ${fit.iterations} iterations.` : 'IRLS did not fully converge; interpret coefficients cautiously.',
      'Observations are independent; the logit of the mean is linear in the predictors.',
    ],
    footnotes: ['Odds ratios are exp(β). Wald p-values use the observed information.', 'Bayesian logistic arrives in Phase 4.'],
    tables: [
      { id: 'fit', title: 'Fit', columns: ['n', 'Deviance', 'Null deviance', 'AIC', 'BIC', 'Converged'], rows: [[encoded.y.length, round(fit.deviance), round(fit.nullDev), round(fit.aic), round(fit.bic), fit.converged ? 'yes' : 'no']] },
      {
        id: 'coef',
        title: 'Coefficients',
        columns: ['Term', 'Estimate', 'SE', 'z', 'p', 'Odds ratio'],
        rows: fit.beta.map((b, i) => {
          const z = se[i] ? b / se[i] : Number.NaN
          return [design.names[i], round(b), round(se[i]), round(z), round(2 * (1 - pnorm(Math.abs(z)))), round(Math.exp(b))]
        }),
      },
    ],
    plots: [{
      id: 'fitted',
      title: 'Fitted probabilities',
      data: [{ type: 'histogram', x: fit.fitted, nbinsx: 12 }],
      layout: { xaxis: { title: `P(${encoded.labels[1]})` }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}

export function runGlm(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
  const family = String(options.family ?? 'gaussian') as GlmFamily
  if (!dependent) return empty('regression.glm', 'Generalized Linear Model', 'Assign a dependent variable.')
  if (!covariates.length && !factors.length) return empty('regression.glm', 'Generalized Linear Model', 'Assign at least one predictor.')
  const design = buildDesign(rows, covariates, factors, false)
  let y: Array<number | null> = design.keep.map((row) => asFiniteNumber(row[dependent]))
  if (family === 'binomial') {
    const enc = encodeBinary(design.keep.map((row) => row[dependent]))
    if (enc) y = enc.y
  }
  if (y.some((v) => v === null) || y.length !== design.keep.length) {
    return empty('regression.glm', 'Generalized Linear Model', 'Dependent must be numeric (or two-level for binomial) on complete cases.')
  }
  const yy = y as number[]
  const theta = family === 'negbin' ? estimateNbTheta(yy) : 1
  const fit = glmFit(yy, design.X, family, theta)
  if (!fit) return empty('regression.glm', 'Generalized Linear Model', 'GLM fit failed (singular or too few rows).')
  const cov = glmCov(design.X, fit.fitted, family, fit.phi, theta)
  const se = cov ? cov.map((row, i) => Math.sqrt(Math.max(row[i], 0))) : fit.beta.map(() => Number.NaN)
  return {
    analysisId: 'regression.glm',
    title: 'Generalized Linear Model',
    interpretation: `${family} GLM for ${dependent}, n = ${yy.length}. Deviance = ${round(fit.deviance)}, AIC = ${round(fit.aic)}. Canonical identity/logit/log links are used.`,
    assumptions: [
      fit.converged ? `IRLS converged in ${fit.iterations} iterations.` : 'IRLS did not fully converge.',
      family === 'negbin' ? `Negative-binomial θ (moment) = ${round(theta)}.` : `Dispersion φ = ${round(fit.phi)}.`,
    ],
    footnotes: [
      'Gaussian uses OLS. Binomial uses logit; Poisson, gamma, inverse-Gaussian, and NB use the log link.',
      'Wald tests use the expected information scaled by φ for quasi families.',
    ],
    tables: [
      { id: 'fit', title: 'Fit', columns: ['Family', 'n', 'Deviance', 'Null deviance', 'φ', 'AIC', 'BIC'], rows: [[family, yy.length, round(fit.deviance), round(fit.nullDev), round(fit.phi), round(fit.aic), round(fit.bic)]] },
      {
        id: 'coef',
        title: 'Coefficients',
        columns: ['Term', 'Estimate', 'SE', 'z', 'p'],
        rows: fit.beta.map((b, i) => {
          const z = se[i] ? b / se[i] : Number.NaN
          return [design.names[i], round(b), round(se[i]), round(z), round(2 * (1 - pnorm(Math.abs(z))))]
        }),
      },
    ],
    plots: [{
      id: 'resid',
      title: 'Response residuals vs fitted',
      data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y: yy.map((yi, i) => yi - fit.fitted[i]) }],
      layout: { xaxis: { title: 'Fitted μ' }, yaxis: { title: 'y − μ' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}
