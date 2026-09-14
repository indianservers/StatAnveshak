import { pnorm, pearson, qnorm } from './numeric'

/**
 * Shapiro–Wilk W and p-value after Royston, Applied Statistics AS R94 (1995).
 * Valid for 3 ≤ n ≤ 5000.
 */
export function shapiroWilk(sample: number[]): { w: number; p: number } {
  const x = [...sample].sort((a, b) => a - b)
  const n = x.length
  if (n < 3 || n > 5000) return { w: Number.NaN, p: Number.NaN }
  if (x[n - 1] - x[0] < 1e-19) return { w: 1, p: 1 }

  const weights = shapiroWeights(n)
  const r = pearson(x, weights)
  const w = Math.min(1, Math.max(0, r * r))
  const w1 = 1 - w

  if (n === 3) {
    const pi6 = 6 / Math.PI
    const stqr = Math.asin(Math.sqrt(3 / 4))
    return { w, p: Math.max(0, pi6 * (Math.asin(Math.sqrt(w)) - stqr)) }
  }

  let y = Math.log(Math.max(w1, 1e-16))
  let m: number
  let s: number
  if (n <= 11) {
    const gamma = poly(G, n)
    if (y >= gamma) return { w, p: 0 }
    y = -Math.log(gamma - y)
    m = poly(C3, n)
    s = Math.exp(poly(C4, n))
  } else {
    const u = Math.log(n)
    m = poly(C5, u)
    s = Math.exp(poly(C6, u))
  }
  return { w, p: 1 - pnorm((y - m) / s) }
}

function shapiroWeights(n: number): number[] {
  const nn2 = Math.floor(n / 2)
  const a = new Array<number>(nn2 + 1).fill(0)
  if (n === 3) {
    a[1] = Math.SQRT1_2
  } else {
    const an25 = n + 0.25
    let summ2 = 0
    for (let i = 1; i <= nn2; i++) {
      a[i] = qnorm((i - 0.375) / an25)
      summ2 += a[i] * a[i]
    }
    summ2 *= 2
    const ssumm2 = Math.sqrt(summ2)
    const rsn = 1 / Math.sqrt(n)
    const a1 = poly(C1, rsn) - a[1] / ssumm2
    let i1 = 2
    let fac: number
    if (n > 5) {
      i1 = 3
      const a2 = -a[2] / ssumm2 + poly(C2, rsn)
      fac = Math.sqrt((summ2 - 2 * a[1] * a[1] - 2 * a[2] * a[2]) / (1 - 2 * a1 * a1 - 2 * a2 * a2))
      a[2] = a2
    } else {
      fac = Math.sqrt((summ2 - 2 * a[1] * a[1]) / (1 - 2 * a1 * a1))
    }
    a[1] = a1
    for (let i = i1; i <= nn2; i++) a[i] /= -fac
  }

  const weights = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    const j = n - 1 - i
    if (i === j) weights[i] = 0
    else weights[i] = Math.sign(i - j) * a[1 + Math.min(i, j)]
  }
  return weights
}

const G = [-2.273, 0.459]
const C1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056]
const C2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633]
const C3 = [0.544, -0.39978, 0.025054, -6.714e-4]
const C4 = [1.3822, -0.77857, 0.062767, -0.0020322]
const C5 = [-1.5861, -0.31082, -0.083751, 0.0038915]
const C6 = [-0.4803, -0.082676, 0.0030302]

function poly(cc: number[], x: number): number {
  const nord = cc.length
  let ret = cc[0]
  if (nord > 1) {
    let p = x * cc[nord - 1]
    for (let j = nord - 2; j > 0; j--) p = (p + cc[j]) * x
    ret += p
  }
  return ret
}
