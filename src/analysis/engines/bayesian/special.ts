/** Lanczos log-Γ, Gauss–Legendre on (0,∞), and ₂F₁. */

const LANCZOS = [0.99999999999980993, 676.5203683668361, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]

export function logGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  z -= 1
  let x = LANCZOS[0]
  for (let i = 1; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i)
  const t = z + 7.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

export function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

export function logChoose(n: number, k: number): number {
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
}

export function hyper2f1(a: number, b: number, c: number, z: number): number {
  if (Math.abs(z) >= 0.999) z = Math.sign(z) * 0.999
  let term = 1
  let sum = 1
  for (let k = 0; k < 250; k++) {
    term *= ((a + k) * (b + k) * z) / ((c + k) * (k + 1))
    sum += term
    if (Math.abs(term) < 1e-15 * Math.abs(sum)) break
  }
  return sum
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

/** ∫_0^∞ f(g) dg with g = u/(1−u), u ∈ (0,1). f should be ordinary (not log). */
export function integratePositive(f: (g: number) => number): number {
  let sum = 0
  for (let i = 0; i < GL16_X.length; i++) {
    const u = GL16_X[i]
    const g = u / (1 - u)
    const jac = 1 / (1 - u) ** 2
    const v = f(g)
    if (Number.isFinite(v)) sum += GL16_W[i] * v * jac
  }
  return sum
}

export function logSumExp(values: number[]): number {
  const m = Math.max(...values)
  if (!Number.isFinite(m)) return Number.NEGATIVE_INFINITY
  return m + Math.log(values.reduce((s, v) => s + Math.exp(v - m), 0))
}

export function fmtBf(bf: number): number {
  if (!Number.isFinite(bf) || bf <= 0) return Number.NaN
  return Number(bf.toPrecision(6))
}

export function defaultR(options: { rscale?: unknown }): number {
  const r = Number(options.rscale ?? 0.707)
  return Number.isFinite(r) && r > 0 ? r : 0.707
}
