import type { AnalysisOptions, AnalysisResult } from '../../types'
import { buildDesign } from './design'
import { pTailChi, pTailT } from './dists'
import { glmFit, type GlmFamily } from './glm'
import { lm, solve } from './linalg'
import { asFiniteNumber, mean, round, sampleVariance } from './numeric'

export type LmmFit = {
  beta: number[]
  names: string[]
  se: number[]
  sigma2: number
  tau2: number
  icc: number
  blups: Array<{ group: string; u: number; n: number }>
  fitted: number[]
  resid: number[]
  logLik: number
  logLikOls: number
  n: number
  nGroups: number
}

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function groupIndex(labels: string[]): { ids: number[]; names: string[] } {
  const names: string[] = []
  const ids = labels.map((label) => {
    const i = names.indexOf(label)
    if (i >= 0) return i
    names.push(label)
    return names.length - 1
  })
  return { ids, names }
}

/** Random-intercept LMM via EM + GLS (Henderson / block-diagonal V). */
export function fitRandomIntercept(y: number[], X: number[][], groups: string[]): LmmFit | null {
  const n = y.length
  const p = X[0]?.length ?? 0
  if (n < p + 4) return null
  const { ids, names } = groupIndex(groups)
  const G = names.length
  if (G < 2) return null
  const ols = lm(y, X)
  if (!ols) return null
  let beta = ols.beta
  const counts = Array(G).fill(0)
  for (const g of ids) counts[g]++
  let sigma2 = Math.max(1e-8, ols.sse / Math.max(1, n - p))
  const groupMeans = names.map((_, g) => {
    let s = 0
    let c = 0
    for (let i = 0; i < n; i++) if (ids[i] === g) { s += y[i]; c++ }
    return s / Math.max(1, c)
  })
  let tau2 = Math.max(1e-8, sampleVariance(groupMeans) - sigma2 / mean(counts.filter((c) => c > 0)))
  if (!Number.isFinite(tau2) || tau2 < 0) tau2 = Math.max(1e-6, sampleVariance(groupMeans) * 0.5)

  for (let iter = 0; iter < 40; iter++) {
    const XtVX = Array.from({ length: p }, () => Array(p).fill(0))
    const Xty = Array(p).fill(0)
    for (let g = 0; g < G; g++) {
      const idx: number[] = []
      for (let i = 0; i < n; i++) if (ids[i] === g) idx.push(i)
      const ng = idx.length
      if (!ng) continue
      const lam = tau2 / (sigma2 + ng * tau2)
      const invs = 1 / sigma2
      for (const i of idx) {
        for (let a = 0; a < p; a++) {
          Xty[a] += invs * X[i][a] * y[i]
          for (let b = 0; b < p; b++) XtVX[a][b] += invs * X[i][a] * X[i][b]
        }
      }
      const xSum = Array(p).fill(0)
      let ySum = 0
      for (const i of idx) {
        ySum += y[i]
        for (let a = 0; a < p; a++) xSum[a] += X[i][a]
      }
      for (let a = 0; a < p; a++) {
        Xty[a] -= invs * lam * xSum[a] * ySum
        for (let b = 0; b < p; b++) XtVX[a][b] -= invs * lam * xSum[a] * xSum[b]
      }
    }
    const next = solve(XtVX, Xty)
    if (!next) break
    beta = next
    const u: number[] = []
    const resid: number[] = Array(n)
    let ssE = 0
    let ssU = 0
    for (let g = 0; g < G; g++) {
      const idx: number[] = []
      for (let i = 0; i < n; i++) if (ids[i] === g) idx.push(i)
      const ng = idx.length
      let meanR = 0
      for (const i of idx) {
        const xb = X[i].reduce((s, x, j) => s + x * beta[j], 0)
        meanR += y[i] - xb
      }
      meanR /= Math.max(1, ng)
      const ug = (ng * tau2 / (sigma2 + ng * tau2)) * meanR
      u[g] = ug
      const shrinkVar = tau2 * sigma2 / (sigma2 + ng * tau2)
      ssU += ug * ug + shrinkVar
      for (const i of idx) {
        const xb = X[i].reduce((s, x, j) => s + x * beta[j], 0)
        resid[i] = y[i] - xb - ug
        ssE += resid[i] * resid[i]
      }
    }
    const nextSigma = ssE / n
    const nextTau = ssU / G
    if (Math.abs(nextSigma - sigma2) + Math.abs(nextTau - tau2) < 1e-10) {
      sigma2 = Math.max(1e-10, nextSigma)
      tau2 = Math.max(0, nextTau)
      break
    }
    sigma2 = Math.max(1e-10, nextSigma)
    tau2 = Math.max(0, nextTau)
  }

  const fitted = y.map((_, i) => {
    const xb = X[i].reduce((s, x, j) => s + x * beta[j], 0)
    const g = ids[i]
    const ng = counts[g]
    let meanR = 0
    for (let k = 0; k < n; k++) if (ids[k] === g) {
      const xbk = X[k].reduce((s, x, j) => s + x * beta[j], 0)
      meanR += y[k] - xbk
    }
    meanR /= ng
    const ug = (ng * tau2 / (sigma2 + ng * tau2)) * meanR
    return xb + ug
  })
  const resid = y.map((yi, i) => yi - fitted[i])
  const blups = names.map((name, g) => {
    const ng = counts[g]
    let meanR = 0
    for (let i = 0; i < n; i++) if (ids[i] === g) {
      const xb = X[i].reduce((s, x, j) => s + x * beta[j], 0)
      meanR += y[i] - xb
    }
    meanR /= ng
    return { group: name, u: (ng * tau2 / (sigma2 + ng * tau2)) * meanR, n: ng }
  })

  let logDet = 0
  let quad = 0
  for (let g = 0; g < G; g++) {
    const ng = counts[g]
    const vg = sigma2 + ng * tau2
    logDet += (ng - 1) * Math.log(sigma2) + Math.log(vg)
    const idx: number[] = []
    for (let i = 0; i < n; i++) if (ids[i] === g) idx.push(i)
    const r = idx.map((i) => y[i] - X[i].reduce((s, x, j) => s + x * beta[j], 0))
    const sum = r.reduce((s, v) => s + v, 0)
    const ss = r.reduce((s, v) => s + v * v, 0)
    const lam = tau2 / vg
    quad += (ss - lam * sum * sum) / sigma2
  }
  const logLik = -0.5 * (n * Math.log(2 * Math.PI) + logDet + quad)
  const mse = ols.sse / n
  const logLikOls = -0.5 * n * (Math.log(2 * Math.PI * mse) + 1)

  const XtVX = Array.from({ length: p }, () => Array(p).fill(0))
  for (let g = 0; g < G; g++) {
    const idx: number[] = []
    for (let i = 0; i < n; i++) if (ids[i] === g) idx.push(i)
    const ng = idx.length
    const lam = tau2 / (sigma2 + ng * tau2)
    const invs = 1 / sigma2
    for (const i of idx) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) XtVX[a][b] += invs * X[i][a] * X[i][b]
    const xSum = Array(p).fill(0)
    for (const i of idx) for (let a = 0; a < p; a++) xSum[a] += X[i][a]
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) XtVX[a][b] -= invs * lam * xSum[a] * xSum[b]
  }
  const se: number[] = []
  for (let j = 0; j < p; j++) {
    const e = Array(p).fill(0)
    e[j] = 1
    const col = solve(XtVX.map((row) => [...row]), e)
    se.push(col ? Math.sqrt(Math.max(0, col[j])) : Number.NaN)
  }

  return {
    beta, names: [], se, sigma2, tau2, icc: tau2 / (tau2 + sigma2),
    blups, fitted, resid, logLik, logLikOls, n, nGroups: G,
  }
}

export function runLmm(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const cluster = String(options.cluster ?? '')
  const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
  if (!dependent || !cluster) return empty('mixed.lmm', 'Linear Mixed Models', 'Assign a numeric outcome and a clustering factor.')
  const design = buildDesign(rows, covariates, factors, Boolean(options.interact))
  const y = design.keep.map((row) => asFiniteNumber(row[dependent]))
  if (y.some((v) => v === null)) return empty('mixed.lmm', 'Linear Mixed Models', 'Outcome must be numeric on complete cases.')
  const yy = y as number[]
  const groups = design.keep.map((row) => String(row[cluster] ?? ''))
  const fit = fitRandomIntercept(yy, design.X, groups)
  if (!fit) return empty('mixed.lmm', 'Linear Mixed Models', 'Need at least two clusters and enough complete cases.')
  fit.names = design.names
  const lr = 2 * (fit.logLik - fit.logLikOls)
  const coefRows = design.names.map((name, i) => {
    const t = fit.se[i] > 0 ? fit.beta[i] / fit.se[i] : Number.NaN
    return [name, round(fit.beta[i]), round(fit.se[i]), round(t), round(pTailT(t, Math.max(2, fit.n - design.names.length - 1), 'two-sided'))]
  })
  return {
    analysisId: 'mixed.lmm',
    title: 'Linear Mixed Models',
    interpretation: `Random-intercept LMM on ${cluster} (${fit.nGroups} clusters, n = ${fit.n}). ICC = ${round(fit.icc)}, σ² = ${round(fit.sigma2)}, τ² = ${round(fit.tau2)}. LR vs OLS = ${round(lr)} on 1 df (p = ${round(pTailChi(Math.max(0, lr), 1))}).`,
    assumptions: ['Random intercepts are i.i.d. N(0, τ²), residuals N(0, σ²), independent of the intercepts. Random slopes use the same intercept engine with the slope absorbed in X; a full unstructured G waits for mixed-model WASM.'],
    footnotes: [
      'Fixed effects are GLS with the block-diagonal random-intercept covariance. Variance components are EM.',
      'This is not lme4 MCMC. Bayesian mode uses a BIC approximation of LMM vs OLS.',
    ],
    tables: [
      { id: 'vc', title: 'Variance components', columns: ['Component', 'Variance', 'ICC'], rows: [['Residual σ²', round(fit.sigma2), '—'], [`${cluster} τ²`, round(fit.tau2), round(fit.icc)]] },
      { id: 'coef', title: 'Fixed effects', columns: ['Term', 'Estimate', 'SE', 't', 'p'], rows: coefRows },
      { id: 'blup', title: 'Random intercepts (BLUP)', columns: ['Cluster', 'n', 'u'], rows: fit.blups.map((b) => [b.group, b.n, round(b.u)]) },
    ],
    plots: [
      { id: 'blup-plot', title: 'Cluster intercepts', data: [{ type: 'bar', x: fit.blups.map((b) => b.group), y: fit.blups.map((b) => b.u) }], layout: { margin: { t: 40, r: 16, b: 80, l: 48 } } },
      { id: 'resid', title: 'Pearson residuals vs fitted', data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y: fit.resid }], layout: { xaxis: { title: 'Fitted' }, yaxis: { title: 'Residual' }, margin: { t: 40, r: 16, b: 48, l: 56 } } },
    ],
  }
}

export function runGlmm(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const cluster = String(options.cluster ?? '')
  const family = String(options.family ?? 'binomial') as GlmFamily
  const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
  if (!dependent || !cluster) return empty('mixed.glmm', 'Generalized Linear Mixed Models', 'Assign an outcome and a clustering factor.')
  const design = buildDesign(rows, covariates, factors, false)
  const raw = design.keep.map((row) => row[dependent])
  let y: number[]
  if (family === 'binomial') {
    const labels = [...new Set(raw.map((v) => String(v)))]
    if (labels.length !== 2 && raw.some((v) => asFiniteNumber(v) === null)) {
      return empty('mixed.glmm', 'Generalized Linear Mixed Models', 'Binomial GLMM needs a two-level or 0/1 outcome.')
    }
    y = labels.length === 2 ? raw.map((v) => (String(v) === labels[1] ? 1 : 0)) : raw.map((v) => Number(asFiniteNumber(v)))
  } else {
    const nums = raw.map((v) => asFiniteNumber(v))
    if (nums.some((v) => v === null)) return empty('mixed.glmm', 'Generalized Linear Mixed Models', 'Outcome must be numeric.')
    y = nums as number[]
  }
  const glm = glmFit(y, design.X, family === 'gaussian' ? 'gaussian' : family)
  if (!glm) return empty('mixed.glmm', 'Generalized Linear Mixed Models', 'GLM start values failed.')
  const eta = glm.eta
  const mu = glm.fitted
  const z = y.map((yi, i) => {
    const m = mu[i]
    const d = family === 'binomial' ? m * (1 - m) : family === 'gaussian' ? 1 : Math.max(m, 1e-8)
    return eta[i] + (yi - m) / Math.max(d, 1e-8)
  })
  const w = mu.map((m) => {
    if (family === 'binomial') return Math.max(m * (1 - m), 1e-6)
    if (family === 'gaussian') return 1
    return Math.max(m, 1e-6)
  })
  const Xw = design.X.map((row, i) => row.map((x) => x * Math.sqrt(w[i])))
  const zw = z.map((zi, i) => zi * Math.sqrt(w[i]))
  const groups = design.keep.map((row) => String(row[cluster] ?? ''))
  const lmm = fitRandomIntercept(zw, Xw, groups)
  if (!lmm) return empty('mixed.glmm', 'Generalized Linear Mixed Models', 'PQL mixed step failed (need ≥2 clusters).')
  const lr = 2 * (lmm.logLik - lmm.logLikOls)
  return {
    analysisId: 'mixed.glmm',
    title: 'Generalized Linear Mixed Models',
    interpretation: `PQL ${family} GLMM with a random intercept on ${cluster}. Working ICC = ${round(lmm.icc)}. LR vs clustered-ignored GLM on the working scale = ${round(lr)}.`,
    assumptions: ['Penalized quasi-likelihood: a GLM working response is treated as Gaussian LMM. This matches Breslow–Clayton PQL, not adaptive Gauss–Hermite (lme4 nAGQ) or MCMC.'],
    footnotes: ['Bayesian mode uses BIC of the PQL LMM vs the GLM. Full GLMM WASM remains available as a later swap.'],
    tables: [
      { id: 'vc', title: 'Working-scale variances', columns: ['Component', 'Variance', 'ICC'], rows: [['Working σ²', round(lmm.sigma2), '—'], [`${cluster} τ²`, round(lmm.tau2), round(lmm.icc)]] },
      { id: 'coef', title: 'Fixed effects (PQL)', columns: ['Term', 'Estimate'], rows: design.names.map((name, i) => [name, round(lmm.beta[i])]) },
      { id: 'glm', title: 'GLM start (no clustering)', columns: ['Deviance', 'AIC', 'Converged'], rows: [[round(glm.deviance), round(glm.aic), glm.converged ? 'yes' : 'no']] },
    ],
    plots: [{
      id: 'fitted',
      title: 'Working fitted values',
      data: [{ type: 'histogram', x: lmm.fitted, nbinsx: 16 }],
      layout: { margin: { t: 40, r: 16, b: 48, l: 48 } },
    }],
  }
}
