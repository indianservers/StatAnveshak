import * as ss from 'simple-statistics'
import type { HypothesisTestResult } from '../types'

// jStat is a CommonJS module; access via window or dynamic import workaround
// We'll use simple-statistics for basic distributions

// t-distribution CDF approximation (two-tailed p-value)
function tCDF(t: number, df: number): number {
  // Using regularized incomplete beta function approximation
  const x = df / (df + t * t)
  // Horner's method approximation for incomplete beta
  // For practical use, we use the fact that P(T>|t|) can be computed
  // Simple numerical integration or series expansion
  // Using Hill's algorithm
  const a = df / 2
  const b = 0.5
  return regularizedIncompleteBeta(x, a, b) // two-tailed
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a
  return front * betaCF(x, a, b)
}

function betaCF(x: number, a: number, b: number): number {
  const MAXIT = 200
  const EPS = 3e-7
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < 1e-30) d = 1e-30
  d = 1 / d
  let h = d
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + aa / c
    if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < 1e-30) d = 1e-30
    c = 1 + aa / c
    if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

function logGamma(x: number): number {
  const c = [76.180091729471, -86.505320329417, 24.014098240831,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) ser += c[j] / ++y
  return -tmp + Math.log(2.506628274631 * ser / x)
}

// Standard normal CDF
function normalCDF(z: number): number {
  return (1 + erf(z / Math.sqrt(2))) / 2
}

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const result = 1 - poly * Math.exp(-x * x)
  return x >= 0 ? result : -result
}

// Chi-square CDF using incomplete gamma
function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0
  return regularizedGamma(df / 2, x / 2)
}

function regularizedGamma(a: number, x: number): number {
  if (x < a + 1) return gammaSeriesExpansion(a, x)
  return 1 - gammaContinuedFraction(a, x)
}

function gammaSeriesExpansion(a: number, x: number): number {
  let ap = a
  let del = 1 / a
  let sum = del
  for (let i = 0; i < 100; i++) {
    ap++
    del *= x / ap
    sum += del
    if (Math.abs(del) < Math.abs(sum) * 3e-7) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
}

function gammaContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a
  let c = 1 / 1e-30
  let d = 1 / b
  let h = d
  for (let i = 1; i <= 100; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < 1e-30) d = 1e-30
    c = b + an / c
    if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 3e-7) break
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
}

// Invert tCDF: find t such that tCDF(t, df) = alpha (two-tailed p-value)
function tCritical(df: number, alpha: number): number {
  let lo = 0, hi = 200
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (tCDF(mid, df) > alpha) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ---- Public API ----

export function oneSampleTTest(
  data: number[],
  mu0: number,
  alpha = 0.05
): HypothesisTestResult {
  const n = data.length
  const mean = ss.mean(data)
  const s = ss.sampleStandardDeviation(data)
  const se = s / Math.sqrt(n)
  const t = (mean - mu0) / se
  const df = n - 1
  const pValue = tCDF(Math.abs(t), df)
  const critT = tCritical(df, alpha)
  const ci = critT * se
  return {
    testName: 'One-Sample t-Test',
    statistic: +t.toFixed(4),
    pValue: +pValue.toFixed(4),
    degreesOfFreedom: df,
    alpha,
    reject: pValue < alpha,
    interpretation: pValue < alpha
      ? `Reject H₀: sample mean (${mean.toFixed(2)}) differs significantly from ${mu0} at α=${alpha}`
      : `Fail to reject H₀: insufficient evidence that mean differs from ${mu0} at α=${alpha}`,
    ciLow: +(mean - ci).toFixed(4),
    ciHigh: +(mean + ci).toFixed(4),
  }
}

export function twoSampleTTest(
  data1: number[],
  data2: number[],
  alpha = 0.05
): HypothesisTestResult {
  const n1 = data1.length, n2 = data2.length
  const m1 = ss.mean(data1), m2 = ss.mean(data2)
  const s1 = ss.sampleStandardDeviation(data1)
  const s2 = ss.sampleStandardDeviation(data2)
  // Welch's t-test
  const se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2)
  const t = (m1 - m2) / se
  const df = Math.pow(s1 * s1 / n1 + s2 * s2 / n2, 2) /
    (Math.pow(s1 * s1 / n1, 2) / (n1 - 1) + Math.pow(s2 * s2 / n2, 2) / (n2 - 1))
  const pValue = tCDF(Math.abs(t), df)
  return {
    testName: "Two-Sample t-Test (Welch's)",
    statistic: +t.toFixed(4),
    pValue: +pValue.toFixed(4),
    degreesOfFreedom: +df.toFixed(1),
    alpha,
    reject: pValue < alpha,
    interpretation: pValue < alpha
      ? `Reject H₀: the two groups have significantly different means at α=${alpha} (Δ=${(m1 - m2).toFixed(3)})`
      : `Fail to reject H₀: insufficient evidence of a mean difference at α=${alpha}`,
  }
}

export function chiSquareGoodnessOfFit(
  observed: number[],
  expected: number[],
  alpha = 0.05
): HypothesisTestResult {
  const k = observed.length
  const chi2 = observed.reduce((sum, o, i) => sum + Math.pow(o - expected[i], 2) / expected[i], 0)
  const df = k - 1
  const pValue = 1 - chiSquareCDF(chi2, df)
  return {
    testName: 'Chi-Square Goodness of Fit',
    statistic: +chi2.toFixed(4),
    pValue: +pValue.toFixed(4),
    degreesOfFreedom: df,
    alpha,
    reject: pValue < alpha,
    interpretation: pValue < alpha
      ? `Reject H₀: observed distribution differs significantly from expected at α=${alpha}`
      : `Fail to reject H₀: no significant difference from expected distribution at α=${alpha}`,
  }
}

export function chiSquareIndependence(
  table: number[][],
  alpha = 0.05
): HypothesisTestResult {
  const rows = table.length
  const cols = table[0].length
  const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0))
  const colTotals = table[0].map((_, j) => table.reduce((a, r) => a + r[j], 0))
  const total = rowTotals.reduce((a, b) => a + b, 0)
  let chi2 = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / total
      chi2 += Math.pow(table[i][j] - expected, 2) / expected
    }
  }
  const df = (rows - 1) * (cols - 1)
  const pValue = 1 - chiSquareCDF(chi2, df)
  return {
    testName: 'Chi-Square Test of Independence',
    statistic: +chi2.toFixed(4),
    pValue: +pValue.toFixed(4),
    degreesOfFreedom: df,
    alpha,
    reject: pValue < alpha,
    interpretation: pValue < alpha
      ? `Reject H₀: the two variables are not independent at α=${alpha}`
      : `Fail to reject H₀: no significant association between variables at α=${alpha}`,
  }
}

export function confidenceIntervalMean(
  data: number[],
  alpha = 0.05
): { mean: number; ciLow: number; ciHigh: number; se: number; margin: number } {
  const n = data.length
  const mean = ss.mean(data)
  const s = ss.sampleStandardDeviation(data)
  const se = s / Math.sqrt(n)
  const tCrit = tCritical(n - 1, alpha)
  const margin = tCrit * se
  return {
    mean: +mean.toFixed(6),
    ciLow: +(mean - margin).toFixed(6),
    ciHigh: +(mean + margin).toFixed(6),
    se: +se.toFixed(6),
    margin: +margin.toFixed(6),
  }
}

export function zScore(value: number, mean: number, std: number): number {
  return std === 0 ? 0 : (value - mean) / std
}

export { normalCDF, chiSquareCDF }
