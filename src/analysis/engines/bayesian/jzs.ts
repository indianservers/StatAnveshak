import { pnorm } from '../frequentist/dists'
import { defaultR, fmtBf, hyper2f1, integratePositive, logGamma } from './special'

const LOG_SQRT_2PI = 0.5 * Math.log(2 * Math.PI)

/** Inverse-gamma(1/2, r²/2) density of the JZS g-prior. */
function zsDensity(g: number, r: number): number {
  if (g <= 0) return 0
  return (r / Math.sqrt(2 * Math.PI)) * Math.exp(-((r * r) / (2 * g))) / Math.pow(g, 1.5)
}

/**
 * Rouder et al. (2009) JZS Bayes factor BF₁₀ from a t statistic.
 * nEff is n (one-sample/paired) or n1 n2 / (n1+n2) (two-sample).
 */
export function jzsTBf10(t: number, df: number, nEff: number, r = 0.707): number {
  if (!Number.isFinite(t) || df <= 0 || nEff <= 1) return Number.NaN
  const t2 = t * t
  const nu = df
  const nullDens = Math.pow(1 + t2 / nu, -(nu + 1) / 2)
  const marg = integratePositive((g) => {
    const scale = Math.sqrt(1 + nEff * g)
    const alt = Math.pow(1 + t2 / (nu * (1 + nEff * g)), -(nu + 1) / 2) / scale
    return alt * zsDensity(g, r)
  })
  const bf = marg / nullDens
  return Number.isFinite(bf) && bf > 0 ? bf : Number.NaN
}

export function jzsOneSample(t: number, n: number, r = 0.707): number {
  return jzsTBf10(t, n - 1, n, r)
}

export function jzsPaired(t: number, nPairs: number, r = 0.707): number {
  return jzsOneSample(t, nPairs, r)
}

export function jzsIndependent(t: number, n1: number, n2: number, r = 0.707): number {
  const nEff = (n1 * n2) / (n1 + n2)
  return jzsTBf10(t, n1 + n2 - 2, nEff, r)
}

/**
 * Zellner–Siow g-prior BF₁₀ for a linear model vs intercept-only
 * (Liang et al. 2008; Rouder et al. 2012). p = number of slopes.
 */
export function jzsLinearBf10(n: number, p: number, r2: number, r = 0.707): number {
  if (n <= p + 1 || p < 1 || !(r2 >= 0) || r2 >= 1) {
    if (r2 >= 0.999999 && p >= 1 && n > p + 1) return Number.POSITIVE_INFINITY
    return Number.NaN
  }
  const ss = 1 - r2
  const marg = integratePositive((g) => {
    const like = Math.pow(1 + g, (n - p - 1) / 2) * Math.pow(1 + g * ss, -(n - 1) / 2) * Math.pow(ss, (n - 1) / 2)
    return like * zsDensity(g, r)
  })
  return Number.isFinite(marg) && marg > 0 ? marg : Number.NaN
}

export function r2FromF(f: number, df1: number, df2: number): number {
  if (!(f >= 0) || df1 <= 0 || df2 <= 0) return Number.NaN
  return (df1 * f) / (df1 * f + df2)
}

/**
 * Jeffreys / stretched-beta(κ=1) correlation BF₁₀ (Ly, Verhagen & Wagenmakers).
 * Uniform prior on ρ is the κ=1 stretched beta.
 */
export function correlationBf10(rho: number, n: number): number {
  if (n <= 3 || !Number.isFinite(rho)) return Number.NaN
  const r = Math.min(0.999999, Math.max(-0.999999, rho))
  const r2 = r * r
  const a = (n - 1) / 2
  const hyp = hyper2f1(a, a, n / 2 + 0.5, r2)
  const pref = Math.sqrt(Math.PI) * Math.exp(logGamma((n + 2) / 2) - logGamma((n + 1) / 2) - LOG_SQRT_2PI)
  const bf01 = pref * Math.pow(1 - r2, (n - 2) / 2) * hyp
  const bf10 = 1 / bf01
  return Number.isFinite(bf10) && bf10 > 0 ? bf10 : Number.NaN
}

export function posteriorMedianDelta(t: number, n: number, r: number): number {
  const se = 1 / Math.sqrt(n)
  return t * se * (r * r) / (r * r + 1 / n)
}

export function cauchyCdf(x: number, scale: number): number {
  return 0.5 + Math.atan(x / scale) / Math.PI
}

export function reportBf(bf10: number) {
  const bf = fmtBf(bf10)
  const bf01 = fmtBf(1 / bf10)
  const log10 = Number.isFinite(bf10) && bf10 > 0 ? Math.log10(bf10) : Number.NaN
  const error = !Number.isFinite(bf10) || bf10 <= 0
    ? '—'
    : bf10 > 10
      ? Math.round(pnorm(Math.sqrt(2 * Math.log(bf10))) * 1e6) / 1e6
      : 1 / (1 + bf10)
  return { bf10: bf, bf01, log10: Number.isFinite(log10) ? Number(log10.toPrecision(6)) : Number.NaN, error }
}

export { defaultR }
