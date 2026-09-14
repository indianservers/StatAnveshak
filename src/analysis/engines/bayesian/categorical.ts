import { logBeta, logChoose, logGamma } from './special'

export function binomialBf10(k: number, n: number, p0: number, alpha = 1, beta = 1): number {
  if (n <= 0 || k < 0 || k > n) return Number.NaN
  const logH1 = logChoose(n, k) + logBeta(alpha + k, beta + n - k) - logBeta(alpha, beta)
  const logH0 = logChoose(n, k) + k * Math.log(p0) + (n - k) * Math.log(1 - p0)
  return Math.exp(logH1 - logH0)
}

export function betaMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta)
}

export function betaQuantile(alpha: number, beta: number, p: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const cdf = incompleteBeta(mid, alpha, beta)
    if (cdf < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const n = 80
  let sum = 0
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n
    const t = x * u
    sum += Math.exp((a - 1) * Math.log(t) + (b - 1) * Math.log(1 - t) - logBeta(a, b))
  }
  return Math.min(1, Math.max(0, (x / n) * sum))
}

export function logDirichletMultinomial(counts: number[], alpha: number[]): number {
  const n = counts.reduce((s, v) => s + v, 0)
  const a0 = alpha.reduce((s, v) => s + v, 0)
  let ll = logGamma(a0) - logGamma(a0 + n)
  for (let i = 0; i < counts.length; i++) ll += logGamma(alpha[i] + counts[i]) - logGamma(alpha[i])
  return ll
}

export function multinomialBf10(counts: number[], prior: number[], nullProb?: number[]): number {
  const n = counts.reduce((s, v) => s + v, 0)
  const k = counts.length
  const p0 = nullProb ?? counts.map(() => 1 / k)
  let logH0 = logGamma(n + 1)
  for (let i = 0; i < k; i++) logH0 -= logGamma(counts[i] + 1)
  for (let i = 0; i < k; i++) logH0 += counts[i] * Math.log(Math.max(p0[i], 1e-15))
  const logH1 = logDirichletMultinomial(counts, prior)
  return Math.exp(logH1 - logH0)
}

export function contingencyAssociationBf10(matrix: number[][]): number {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  if (rows < 2 || cols < 2) return Number.NaN
  const flat = matrix.flat()
  const ones = flat.map(() => 1)
  const logH1 = logDirichletMultinomial(flat, ones)
  let logH0 = 0
  for (const row of matrix) logH0 += logDirichletMultinomial(row, row.map(() => 1))
  return Math.exp(logH1 - logH0)
}

export function abBf10(k1: number, n1: number, k2: number, n2: number, alpha = 1, beta = 1): number {
  const logH1 = (logChoose(n1, k1) + logBeta(alpha + k1, beta + n1 - k1) - logBeta(alpha, beta))
    + (logChoose(n2, k2) + logBeta(alpha + k2, beta + n2 - k2) - logBeta(alpha, beta))
  const logH0 = logChoose(n1, k1) + logChoose(n2, k2) + logBeta(alpha + k1 + k2, beta + n1 + n2 - k1 - k2) - logBeta(alpha, beta)
  return Math.exp(logH1 - logH0)
}
