import jStatRaw from 'jstat'

type JStatDists = {
  studentt: { cdf: (x: number, df: number) => number; inv: (p: number, df: number) => number }
  centralF: { cdf: (x: number, d1: number, d2: number) => number; inv: (p: number, d1: number, d2: number) => number }
  chisquare: { cdf: (x: number, df: number) => number; inv: (p: number, df: number) => number }
}

const jStat = jStatRaw as unknown as JStatDists

/** Inverse normal via Acklam’s approximation. */
export function qnorm(p: number): number {
  if (p <= 0) return Number.NEGATIVE_INFINITY
  if (p >= 1) return Number.POSITIVE_INFINITY
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577459334652e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
  const plow = 0.02425
  const phigh = 1 - plow
  let q: number
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  q = p - 0.5
  const r = q * q
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

export function pnorm(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.39894228 * Math.exp(-z * z / 2)
  const p = d * t * (0.31938174 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return z > 0 ? 1 - p : p
}

export function pt(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return Number.NaN
  return jStat.studentt.cdf(t, df)
}

export function pTailT(t: number, df: number, alternative: 'two-sided' | 'greater' | 'less'): number {
  if (alternative === 'greater') return 1 - pt(t, df)
  if (alternative === 'less') return pt(t, df)
  return 2 * Math.min(pt(t, df), 1 - pt(t, df))
}

export function pf(f: number, df1: number, df2: number): number {
  if (f <= 0) return 0
  if (!Number.isFinite(f)) return 1
  if (df1 <= 0 || df2 <= 0) return Number.NaN
  return jStat.centralF.cdf(f, df1, df2)
}

export function pchisq(x: number, df: number): number {
  if (x <= 0) return 0
  if (!Number.isFinite(x)) return 1
  return jStat.chisquare.cdf(x, df)
}

export function qt(p: number, df: number): number {
  if (p <= 0) return Number.NEGATIVE_INFINITY
  if (p >= 1) return Number.POSITIVE_INFINITY
  return jStat.studentt.inv(p, df)
}

export function qf(p: number, df1: number, df2: number): number {
  if (p <= 0) return 0
  if (p >= 1) return Number.POSITIVE_INFINITY
  return jStat.centralF.inv(p, df1, df2)
}

export function qchisq(p: number, df: number): number {
  if (p <= 0) return 0
  if (p >= 1) return Number.POSITIVE_INFINITY
  return jStat.chisquare.inv(p, df)
}

const GL16_X = [
  0.005299532504366, 0.027712488467962, 0.067184398806085, 0.122297795822561,
  0.191061877798678, 0.270991611213455, 0.359198224610370, 0.452493745081181,
  0.547506254918819, 0.640801775389630, 0.729008388786545, 0.808938122201322,
  0.877702204177439, 0.932815601193915, 0.972287511532038, 0.994700467495634,
]
const GL16_W = [
  0.013576229705877, 0.031126761969324, 0.047579255841246, 0.062314485627766,
  0.074797124608322, 0.084578259697888, 0.091301707522462, 0.094725305227535,
  0.094725305227535, 0.091301707522462, 0.084578259697888, 0.074797124608322,
  0.062314485627766, 0.047579255841246, 0.031126761969324, 0.013576229705877,
]

/** Noncentral t CDF: E[Φ(t √(V/ν) − ncp)] with V ~ χ²_ν. */
export function pnt(t: number, df: number, ncp: number): number {
  if (ncp === 0) return pt(t, df)
  if (!Number.isFinite(t)) return t > 0 ? 1 : 0
  let sum = 0
  for (let i = 0; i < GL16_X.length; i++) {
    const u = GL16_X[i]
    const v = qchisq(u, df)
    sum += GL16_W[i] * pnorm(t * Math.sqrt(v / df) - ncp)
  }
  return Math.min(1, Math.max(0, sum))
}

/** Noncentral F via Poisson mixture of central F. */
export function pnf(x: number, df1: number, df2: number, ncp: number): number {
  if (x <= 0) return 0
  if (ncp <= 0) return pf(x, df1, df2)
  const lambda = ncp / 2
  let term = Math.exp(-lambda)
  let sum = term * pf(x * df1 / df1, df1, df2)
  for (let j = 1; j < 400; j++) {
    term *= lambda / j
    const d1 = df1 + 2 * j
    sum += term * pf((x * df1) / d1, d1, df2)
    if (term < 1e-14) break
  }
  return Math.min(1, Math.max(0, sum))
}

function normalRangeCdf(w: number, k: number): number {
  if (w <= 0) return 0
  let sum = 0
  for (let i = 0; i < GL16_X.length; i++) {
    const z = qnorm(GL16_X[i])
    const inner = pnorm(z) - pnorm(z - w)
    sum += GL16_W[i] * k * Math.pow(Math.max(inner, 0), k - 1)
  }
  return Math.min(1, Math.max(0, sum))
}

/**
 * Studentized range CDF P(Q ≤ q) for k means and ν error df (nranges = 1).
 * Integrates the range of k normals against S ~ √(χ²_ν / ν).
 */
export function ptukey(q: number, k: number, df: number): number {
  if (q <= 0) return 0
  if (k < 2) return 1
  if (df > 1e6) return normalRangeCdf(q, k)
  let sum = 0
  for (let i = 0; i < GL16_X.length; i++) {
    const u = GL16_X[i]
    const chi = qchisq(u, df)
    const s = Math.sqrt(chi / df)
    sum += GL16_W[i] * normalRangeCdf(q * s, k)
  }
  return Math.min(1, Math.max(0, sum))
}

export function pTailF(f: number, df1: number, df2: number): number {
  return 1 - pf(f, df1, df2)
}

export function pTailChi(x: number, df: number): number {
  return 1 - pchisq(x, df)
}
