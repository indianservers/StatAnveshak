import { inverse, multiply, multiplyVec, transpose, wls } from './linalg'

export type GlmFamily = 'gaussian' | 'binomial' | 'poisson' | 'gamma' | 'inverse.gaussian' | 'negbin'

export type GlmFit = {
  family: GlmFamily
  beta: number[]
  fitted: number[]
  eta: number[]
  phi: number
  dfResidual: number
  deviance: number
  nullDev: number
  aic: number
  bic: number
  logLik: number
  iterations: number
  converged: boolean
  theta?: number
}

function clampMu(mu: number, family: GlmFamily): number {
  if (family === 'binomial') return Math.min(1 - 1e-8, Math.max(1e-8, mu))
  return Math.max(1e-8, mu)
}

function variance(mu: number, family: GlmFamily, theta: number): number {
  const m = clampMu(mu, family)
  if (family === 'gaussian') return 1
  if (family === 'binomial') return m * (1 - m)
  if (family === 'poisson') return m
  if (family === 'gamma') return m * m
  if (family === 'inverse.gaussian') return m * m * m
  return m + (m * m) / Math.max(theta, 1e-6)
}

function link(mu: number, family: GlmFamily): number {
  const m = clampMu(mu, family)
  if (family === 'gaussian') return m
  if (family === 'binomial') return Math.log(m / (1 - m))
  return Math.log(m)
}

function invLink(eta: number, family: GlmFamily): number {
  if (family === 'gaussian') return eta
  if (family === 'binomial') return 1 / (1 + Math.exp(-Math.min(20, Math.max(-20, eta))))
  return Math.exp(Math.min(20, Math.max(-20, eta)))
}

function dmuDeta(mu: number, family: GlmFamily): number {
  const m = clampMu(mu, family)
  if (family === 'gaussian') return 1
  if (family === 'binomial') return m * (1 - m)
  return m
}

function logLik(y: number[], mu: number[], family: GlmFamily, phi: number, theta: number): number {
  let ll = 0
  for (let i = 0; i < y.length; i++) {
    const m = clampMu(mu[i], family)
    if (family === 'gaussian') {
      ll += -0.5 * (Math.log(2 * Math.PI * phi) + ((y[i] - m) ** 2) / phi)
    } else if (family === 'binomial') {
      ll += y[i] * Math.log(m) + (1 - y[i]) * Math.log(1 - m)
    } else if (family === 'poisson') {
      ll += y[i] * Math.log(m) - m
    } else if (family === 'gamma') {
      const nu = 1 / phi
      ll += nu * Math.log(nu * y[i] / m) - (nu * y[i]) / m
    } else if (family === 'inverse.gaussian') {
      ll += -0.5 * (Math.log(2 * Math.PI * phi * y[i] ** 3) + ((y[i] - m) ** 2) / (y[i] * m * m * phi))
    } else {
      ll += y[i] * Math.log(m) - (y[i] + theta) * Math.log(m + theta)
    }
  }
  return ll
}

function unitDev(y: number, mu: number, family: GlmFamily, theta: number): number {
  const m = clampMu(mu, family)
  if (family === 'gaussian') return (y - m) ** 2
  if (family === 'binomial') {
    const a = y === 0 ? 0 : 2 * y * Math.log(y / m)
    const b = y === 1 ? 0 : 2 * (1 - y) * Math.log((1 - y) / (1 - m))
    return a + b
  }
  if (family === 'poisson') return 2 * (y * Math.log(y / m || 1) - (y - m))
  if (family === 'gamma') return 2 * (-Math.log(y / m) + (y - m) / m)
  if (family === 'inverse.gaussian') return ((y - m) ** 2) / (y * m * m)
  return 2 * (y * Math.log(y / m || 1) - (y + theta) * Math.log((y + theta) / (m + theta)))
}

export function glmFit(y: number[], X: number[][], family: GlmFamily, theta = 1): GlmFit | null {
  const n = y.length
  const p = X[0]?.length ?? 0
  if (n < p) return null
  let mu = y.map((yi) => {
    if (family === 'binomial') return clampMu((yi + 0.5) / 2, family)
    return clampMu(Math.max(yi, 0.1), family)
  })
  if (family === 'gaussian') {
    const fit = wls(y, X, y.map(() => 1))
    if (!fit) return null
    const phi = fit.sse / Math.max(1, fit.dfResidual)
    const ll = logLik(y, fit.fitted, family, phi, theta)
    const nullMu = y.reduce((s, v) => s + v, 0) / n
    return {
      family, beta: fit.beta, fitted: fit.fitted, eta: fit.fitted, phi, dfResidual: fit.dfResidual,
      deviance: fit.sse, nullDev: y.reduce((s, yi) => s + (yi - nullMu) ** 2, 0),
      aic: -2 * ll + 2 * (p + 1), bic: -2 * ll + Math.log(n) * (p + 1), logLik: ll, iterations: 1, converged: true,
    }
  }

  let beta = Array(p).fill(0)
  let converged = false
  let iterations = 0
  let fitted = mu
  let eta = mu.map((m) => link(m, family))
  for (let iter = 0; iter < 40; iter++) {
    iterations = iter + 1
    const w = mu.map((m) => {
      const d = dmuDeta(m, family)
      return (d * d) / Math.max(variance(m, family, theta), 1e-12)
    })
    const z = mu.map((m, i) => eta[i] + (y[i] - m) / Math.max(dmuDeta(m, family), 1e-12))
    const step = wls(z, X, w)
    if (!step) break
    beta = step.beta
    eta = multiplyVec(X, beta)
    mu = eta.map((e) => clampMu(invLink(e, family), family))
    fitted = mu
    const delta = Math.sqrt(step.sse / n)
    if (delta < 1e-8 && iter > 2) { converged = true; break }
  }
  const deviance = y.reduce((s, yi, i) => s + unitDev(yi, mu[i], family, theta), 0)
  const ybar = y.reduce((s, v) => s + v, 0) / n
  const nullDev = y.reduce((s, yi) => s + unitDev(yi, ybar, family, theta), 0)
  const dfResidual = n - p
  const phi = family === 'binomial' || family === 'poisson' || family === 'negbin' ? 1 : deviance / Math.max(1, dfResidual)
  const ll = logLik(y, mu, family, phi, theta)
  const extra = family === 'gaussian' || family === 'gamma' || family === 'inverse.gaussian' ? 1 : 0
  return {
    family, beta, fitted, eta, phi, dfResidual, deviance, nullDev,
    aic: -2 * ll + 2 * (p + extra), bic: -2 * ll + Math.log(n) * (p + extra), logLik: ll,
    iterations: iterations, converged, theta: family === 'negbin' ? theta : undefined,
  }
}

export function glmCov(X: number[][], mu: number[], family: GlmFamily, phi: number, theta: number): number[][] | null {
  const w = mu.map((m) => {
    const d = dmuDeta(m, family)
    return (d * d) / Math.max(variance(m, family, theta), 1e-12)
  })
  const Xw = X.map((row, i) => row.map((x) => x * Math.sqrt(w[i])))
  const XtWX = multiply(transpose(Xw), Xw)
  const inv = inverse(XtWX)
  if (!inv) return null
  return inv.map((row) => row.map((v) => v * phi))
}

export function estimateNbTheta(y: number[]): number {
  const n = y.length
  const m = y.reduce((s, v) => s + v, 0) / n
  const v = y.reduce((s, yi) => s + (yi - m) ** 2, 0) / Math.max(1, n - 1)
  if (v <= m) return 1e6
  return (m * m) / (v - m)
}
