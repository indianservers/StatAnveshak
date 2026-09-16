import jStatRaw from 'jstat'

type ScalarDistribution = {
  pdf: (...args: number[]) => number
  cdf: (...args: number[]) => number
  inv?: (...args: number[]) => number
}

type JStatLike = {
  gammaln: (x: number) => number
  binomial: ScalarDistribution
  negbin: ScalarDistribution
  hypgeom: ScalarDistribution
  poisson: ScalarDistribution
  uniform: Required<ScalarDistribution>
  normal: Required<ScalarDistribution>
  lognormal: Required<ScalarDistribution>
  exponential: Required<ScalarDistribution>
  gamma: Required<ScalarDistribution>
  beta: Required<ScalarDistribution>
  chisquare: Required<ScalarDistribution>
  studentt: Required<ScalarDistribution>
  centralF: Required<ScalarDistribution>
  weibull: Required<ScalarDistribution>
  pareto: Required<ScalarDistribution>
  cauchy: Required<ScalarDistribution>
}

const jStat = jStatRaw as unknown as JStatLike

export type DistributionFamily = 'continuous' | 'discrete' | 'empirical' | 'multivariate'
export type DistributionId =
  | 'bernoulli'
  | 'binomial'
  | 'geometric'
  | 'negative_binomial'
  | 'hypergeometric'
  | 'poisson'
  | 'discrete_uniform'
  | 'continuous_uniform'
  | 'normal'
  | 'standard_normal'
  | 'lognormal'
  | 'exponential'
  | 'gamma'
  | 'beta'
  | 'chi_square'
  | 'student_t'
  | 'f'
  | 'weibull'
  | 'pareto'
  | 'cauchy'
  | 'logistic'
  | 'skew_normal'
  | 'laplace'
  | 'gumbel'
  | 'inverse_gaussian'
  | 'stretched_beta'
  | 'mixture_normal'
  | 'zip'
  | 'zinb'
  | 'multinomial'
  | 'dirichlet'
  | 'empirical'

export type DistributionParam = {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
}

export type Distribution = {
  id: DistributionId
  name: string
  family: DistributionFamily
  support: string
  params: DistributionParam[]
  formula: string
  cdfFormula: string
  explanation: string
  pdf: (x: number, p: Record<string, number>, data?: number[]) => number
  cdf: (x: number, p: Record<string, number>, data?: number[]) => number
  inv: (q: number, p: Record<string, number>, data?: number[]) => number
  sample: (p: Record<string, number>, rng?: () => number, data?: number[]) => number | number[]
  expectedValue: (p: Record<string, number>, data?: number[]) => string
  variance: (p: Record<string, number>, data?: number[]) => string
  range: (p: Record<string, number>, data?: number[]) => [number, number]
  fit?: (data: number[]) => Record<string, number> | null
  validate?: (p: Record<string, number>) => Record<string, number>
}

export type FitResult = {
  id: DistributionId
  name: string
  params: Record<string, number>
  statistic: number
  pValue: number | null
  method: 'KS' | 'Chi-square'
}

const EPS = 1e-12
const round = (value: number, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : NaN
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const mean = (data: number[]) => data.reduce((sum, value) => sum + value, 0) / data.length
const variance = (data: number[]) => {
  if (data.length < 2) return 0
  const m = mean(data)
  return data.reduce((sum, value) => sum + (value - m) ** 2, 0) / (data.length - 1)
}
const positive = (data: number[]) => data.filter((value) => Number.isFinite(value) && value > 0)
const unit = (data: number[]) => data.filter((value) => Number.isFinite(value) && value > 0 && value < 1)
const integers = (data: number[]) => data.filter((value) => Number.isFinite(value) && Number.isInteger(value))
const quantileSorted = (sorted: number[], q: number) => {
  if (sorted.length === 0) return NaN
  const pos = clamp(q, 0, 1) * (sorted.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function discreteInv(cdf: (x: number) => number, lo: number, hi: number, q: number) {
  for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) {
    if (cdf(k) >= q) return k
  }
  return Math.floor(hi)
}

function gammaSample(shape: number, scale: number, rng = Math.random): number {
  if (shape < 1) {
    const u = rng()
    return gammaSample(shape + 1, scale, rng) * u ** (1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number
    let v: number
    do {
      x = normalSample(0, 1, rng)
      v = 1 + c * x
    } while (v <= 0)
    v = v ** 3
    const u = rng()
    if (u < 1 - 0.0331 * x ** 4) return scale * d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return scale * d * v
  }
}

function normalSample(mu: number, sigma: number, rng = Math.random) {
  const u1 = Math.max(rng(), EPS)
  const u2 = rng()
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function poissonSample(lambda: number, rng = Math.random) {
  if (lambda <= 0) return 0
  if (lambda < 30) {
    const l = Math.exp(-lambda)
    let p = 1
    let k = 0
    do {
      k++
      p *= rng()
    } while (p > l)
    return k - 1
  }
  return Math.max(0, Math.round(normalSample(lambda, Math.sqrt(lambda), rng)))
}

function binomialSample(n: number, p: number, rng = Math.random) {
  let successes = 0
  for (let i = 0; i < Math.round(n); i++) if (rng() < p) successes++
  return successes
}

function empiricalSorted(data?: number[]) {
  return [...(data ?? [])].filter(Number.isFinite).sort((a, b) => a - b)
}

function ksTest(data: number[], cdf: (x: number) => number) {
  const sorted = [...data].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 0) return { statistic: NaN, pValue: null }
  let d = 0
  sorted.forEach((x, i) => {
    const fnLo = i / n
    const fnHi = (i + 1) / n
    const f = clamp(cdf(x), 0, 1)
    d = Math.max(d, Math.abs(f - fnLo), Math.abs(fnHi - f))
  })
  const pValue = Math.min(1, 2 * Math.exp(-2 * n * d * d))
  return { statistic: d, pValue }
}

function chiSquareGof(data: number[], pmf: (k: number) => number, lo: number, hi: number) {
  const counts = new Map<number, number>()
  integers(data).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  const n = data.length
  const start = Math.ceil(lo)
  const end = Math.floor(hi)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 10000) {
    return { statistic: NaN, pValue: null }
  }
  let chi = 0
  let bins = 0
  let observedBin = 0
  let expectedBin = 0
  const flush = () => {
    if (expectedBin <= 0) return
    chi += (observedBin - expectedBin) ** 2 / expectedBin
    bins++
    observedBin = 0
    expectedBin = 0
  }
  for (let k = start; k <= end; k++) {
    const expected = n * pmf(k)
    observedBin += counts.get(k) ?? 0
    expectedBin += expected
    if (expectedBin >= 5) flush()
  }
  flush()
  const df = Math.max(1, bins - 1)
  return { statistic: chi, pValue: 1 - jStat.chisquare.cdf(chi, df) }
}

const p01 = (p: Record<string, number>) => ({ ...p, p: clamp(p.p, EPS, 1 - EPS) })
const abOrdered = (p: Record<string, number>) => ({ ...p, b: Math.max(p.a + EPS, p.b) })
const posParam = (key: string) => (p: Record<string, number>) => ({ ...p, [key]: Math.max(EPS, p[key]) })

export const DISTRIBUTIONS: Distribution[] = [
  {
    id: 'bernoulli',
    name: 'Bernoulli',
    family: 'discrete',
    support: 'x in {0, 1}',
    params: [{ key: 'p', label: 'p success probability', min: 0.01, max: 0.99, step: 0.01, default: 0.7 }],
    formula: 'P(X=x) = p^x (1-p)^(1-x), x in {0,1}',
    cdfFormula: 'F(x)=0 for x<0, 1-p for 0<=x<1, 1 for x>=1',
    explanation: 'A Bernoulli variable is one yes/no trial. It is the building block for binomial models.',
    validate: p01,
    pdf: (x, p) => Math.round(x) === 1 ? p.p : Math.round(x) === 0 ? 1 - p.p : 0,
    cdf: (x, p) => x < 0 ? 0 : x < 1 ? 1 - p.p : 1,
    inv: (q, p) => q <= 1 - p.p ? 0 : 1,
    sample: (p, rng = Math.random) => rng() < p.p ? 1 : 0,
    expectedValue: (p) => `${round(p.p)}`,
    variance: (p) => `${round(p.p * (1 - p.p))}`,
    range: () => [0, 1],
    fit: (data) => ({ p: clamp(mean(data), EPS, 1 - EPS) }),
  },
  {
    id: 'binomial',
    name: 'Binomial',
    family: 'discrete',
    support: 'k = 0, 1, ..., n',
    params: [
      { key: 'n', label: 'n trials', min: 1, max: 200, step: 1, default: 10 },
      { key: 'p', label: 'p success probability', min: 0.01, max: 0.99, step: 0.01, default: 0.7 },
    ],
    formula: 'P(X=k) = C(n,k) p^k (1-p)^(n-k)',
    cdfFormula: 'F(k) = sum_{i=0..floor(k)} C(n,i) p^i (1-p)^(n-i)',
    explanation: 'Counts successes in a fixed number of independent Bernoulli trials.',
    validate: (p) => ({ n: Math.max(1, Math.round(p.n)), p: clamp(p.p, EPS, 1 - EPS) }),
    pdf: (x, p) => jStat.binomial.pdf(Math.round(x), Math.round(p.n), p.p),
    cdf: (x, p) => jStat.binomial.cdf(Math.floor(x), Math.round(p.n), p.p),
    inv: (q, p) => discreteInv((x) => jStat.binomial.cdf(x, Math.round(p.n), p.p), 0, Math.round(p.n), q),
    sample: (p, rng = Math.random) => binomialSample(p.n, p.p, rng),
    expectedValue: (p) => `${round(p.n * p.p)}`,
    variance: (p) => `${round(p.n * p.p * (1 - p.p))}`,
    range: (p) => [0, Math.round(p.n)],
    fit: (data) => {
      const max = Math.max(...data)
      const n = Math.max(1, Math.round(max))
      return { n, p: clamp(mean(data) / n, EPS, 1 - EPS) }
    },
  },
  {
    id: 'geometric',
    name: 'Geometric',
    family: 'discrete',
    support: 'k = 1, 2, ...',
    params: [{ key: 'p', label: 'p success probability', min: 0.01, max: 0.99, step: 0.01, default: 0.3 }],
    formula: 'P(X=k) = (1-p)^(k-1) p',
    cdfFormula: 'F(k) = 1 - (1-p)^floor(k)',
    explanation: 'Models the trial count until the first success.',
    validate: p01,
    pdf: (x, p) => { const k = Math.round(x); return k < 1 ? 0 : (1 - p.p) ** (k - 1) * p.p },
    cdf: (x, p) => x < 1 ? 0 : 1 - (1 - p.p) ** Math.floor(x),
    inv: (q, p) => Math.ceil(Math.log(1 - q) / Math.log(1 - p.p)),
    sample: (p, rng = Math.random) => Math.ceil(Math.log(1 - rng()) / Math.log(1 - p.p)),
    expectedValue: (p) => `${round(1 / p.p)}`,
    variance: (p) => `${round((1 - p.p) / (p.p * p.p))}`,
    range: (p) => [1, Math.min(200, Math.ceil(5 / p.p))],
    fit: (data) => ({ p: clamp(1 / mean(data), EPS, 1 - EPS) }),
  },
  {
    id: 'negative_binomial',
    name: 'Negative Binomial',
    family: 'discrete',
    support: 'k = 0, 1, ... failures before r successes',
    params: [
      { key: 'r', label: 'r successes', min: 1, max: 80, step: 1, default: 5 },
      { key: 'p', label: 'p success probability', min: 0.01, max: 0.99, step: 0.01, default: 0.4 },
    ],
    formula: 'P(X=k) = C(k+r-1,k) (1-p)^k p^r',
    cdfFormula: 'F(k) = sum_{i=0..floor(k)} C(i+r-1,i) (1-p)^i p^r',
    explanation: 'Counts failures before a target number of successes is reached.',
    validate: (p) => ({ r: Math.max(1, Math.round(p.r)), p: clamp(p.p, EPS, 1 - EPS) }),
    pdf: (x, p) => jStat.negbin.pdf(Math.round(x), Math.round(p.r), p.p),
    cdf: (x, p) => jStat.negbin.cdf(Math.floor(x), Math.round(p.r), p.p),
    inv: (q, p) => discreteInv((x) => jStat.negbin.cdf(x, Math.round(p.r), p.p), 0, Math.ceil(p.r * (1 - p.p) / p.p + 10 * Math.sqrt(p.r * (1 - p.p)) / p.p), q),
    sample: (p, rng = Math.random) => {
      let successes = 0
      let failures = 0
      while (successes < Math.round(p.r)) {
        if (rng() < p.p) successes++
        else failures++
      }
      return failures
    },
    expectedValue: (p) => `${round(p.r * (1 - p.p) / p.p)}`,
    variance: (p) => `${round(p.r * (1 - p.p) / (p.p * p.p))}`,
    range: (p) => [0, Math.ceil(p.r * (1 - p.p) / p.p + 6 * Math.sqrt(p.r * (1 - p.p)) / p.p)],
    fit: (data) => {
      const m = mean(data)
      const v = variance(data)
      if (v <= m) return null
      const p = clamp(m / v, EPS, 1 - EPS)
      return { r: Math.max(1, Math.round(m * p / (1 - p))), p }
    },
  },
  {
    id: 'hypergeometric',
    name: 'Hypergeometric',
    family: 'discrete',
    support: 'max(0,n-(N-K)) <= k <= min(n,K)',
    params: [
      { key: 'N', label: 'N population size', min: 5, max: 500, step: 1, default: 50 },
      { key: 'K', label: 'K successes in population', min: 1, max: 300, step: 1, default: 15 },
      { key: 'n', label: 'n draws', min: 1, max: 200, step: 1, default: 10 },
    ],
    formula: 'P(X=k) = C(K,k) C(N-K,n-k) / C(N,n)',
    cdfFormula: 'F(k) = sum of the PMF up to floor(k)',
    explanation: 'Like binomial, but draws are made without replacement.',
    validate: (p) => {
      const N = Math.max(2, Math.round(p.N))
      const K = clamp(Math.round(p.K), 1, N)
      const n = clamp(Math.round(p.n), 1, N)
      return { N, K, n }
    },
    pdf: (x, p) => jStat.hypgeom.pdf(Math.round(x), p.N, p.K, p.n),
    cdf: (x, p) => jStat.hypgeom.cdf(Math.floor(x), p.N, p.K, p.n),
    inv: (q, p) => discreteInv((x) => jStat.hypgeom.cdf(x, p.N, p.K, p.n), Math.max(0, p.n - (p.N - p.K)), Math.min(p.n, p.K), q),
    sample: (p, rng = Math.random) => {
      let successes = p.K
      let failures = p.N - p.K
      let count = 0
      for (let i = 0; i < p.n; i++) {
        if (rng() < successes / (successes + failures)) { count++; successes-- } else failures--
      }
      return count
    },
    expectedValue: (p) => `${round(p.n * p.K / p.N)}`,
    variance: (p) => `${round(p.n * p.K / p.N * (1 - p.K / p.N) * (p.N - p.n) / (p.N - 1))}`,
    range: (p) => [Math.max(0, p.n - (p.N - p.K)), Math.min(p.n, p.K)],
  },
  {
    id: 'poisson',
    name: 'Poisson',
    family: 'discrete',
    support: 'k = 0, 1, ...',
    params: [{ key: 'lambda', label: 'lambda rate', min: 0.05, max: 80, step: 0.05, default: 4 }],
    formula: 'P(X=k) = lambda^k e^-lambda / k!',
    cdfFormula: 'F(k) = sum_{i=0..floor(k)} lambda^i e^-lambda / i!',
    explanation: 'Counts events in a fixed interval when events happen independently at a constant rate.',
    validate: posParam('lambda'),
    pdf: (x, p) => jStat.poisson.pdf(Math.round(x), p.lambda),
    cdf: (x, p) => jStat.poisson.cdf(Math.floor(x), p.lambda),
    inv: (q, p) => discreteInv((x) => jStat.poisson.cdf(x, p.lambda), 0, Math.ceil(p.lambda + 10 * Math.sqrt(p.lambda) + 10), q),
    sample: (p, rng = Math.random) => poissonSample(p.lambda, rng),
    expectedValue: (p) => `${round(p.lambda)}`,
    variance: (p) => `${round(p.lambda)}`,
    range: (p) => [0, Math.ceil(p.lambda + 5 * Math.sqrt(p.lambda) + 5)],
    fit: (data) => ({ lambda: Math.max(EPS, mean(data)) }),
  },
  {
    id: 'discrete_uniform',
    name: 'Discrete Uniform',
    family: 'discrete',
    support: 'k = a, a+1, ..., b',
    params: [
      { key: 'a', label: 'a minimum integer', min: -50, max: 50, step: 1, default: 1 },
      { key: 'b', label: 'b maximum integer', min: -50, max: 100, step: 1, default: 6 },
    ],
    formula: 'P(X=k) = 1 / (b-a+1)',
    cdfFormula: 'F(k) = floor(k-a+1)/(b-a+1) within the support',
    explanation: 'Every integer in a finite range is equally likely, like a fair die.',
    validate: (p) => ({ a: Math.round(Math.min(p.a, p.b)), b: Math.round(Math.max(p.a, p.b)) }),
    pdf: (x, p) => Number.isInteger(x) && x >= p.a && x <= p.b ? 1 / (p.b - p.a + 1) : 0,
    cdf: (x, p) => x < p.a ? 0 : x >= p.b ? 1 : Math.floor(x - p.a + 1) / (p.b - p.a + 1),
    inv: (q, p) => p.a + Math.ceil(q * (p.b - p.a + 1)) - 1,
    sample: (p, rng = Math.random) => p.a + Math.floor(rng() * (p.b - p.a + 1)),
    expectedValue: (p) => `${round((p.a + p.b) / 2)}`,
    variance: (p) => `${round(((p.b - p.a + 1) ** 2 - 1) / 12)}`,
    range: (p) => [p.a, p.b],
    fit: (data) => ({ a: Math.min(...integers(data)), b: Math.max(...integers(data)) }),
  },
  {
    id: 'continuous_uniform',
    name: 'Continuous Uniform',
    family: 'continuous',
    support: 'a <= x <= b',
    params: [
      { key: 'a', label: 'a minimum', min: -50, max: 50, step: 0.1, default: 0 },
      { key: 'b', label: 'b maximum', min: -50, max: 100, step: 0.1, default: 5 },
    ],
    formula: 'f(x) = 1/(b-a)',
    cdfFormula: 'F(x) = (x-a)/(b-a) inside [a,b]',
    explanation: 'All real values in a finite interval are equally dense.',
    validate: abOrdered,
    pdf: (x, p) => jStat.uniform.pdf(x, p.a, p.b),
    cdf: (x, p) => jStat.uniform.cdf(x, p.a, p.b),
    inv: (q, p) => jStat.uniform.inv(q, p.a, p.b),
    sample: (p, rng = Math.random) => p.a + rng() * (p.b - p.a),
    expectedValue: (p) => `${round((p.a + p.b) / 2)}`,
    variance: (p) => `${round((p.b - p.a) ** 2 / 12)}`,
    range: (p) => [p.a - 0.1 * (p.b - p.a), p.b + 0.1 * (p.b - p.a)],
    fit: (data) => ({ a: Math.min(...data), b: Math.max(...data) }),
  },
  {
    id: 'normal',
    name: 'Normal',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'mu', label: 'mu mean', min: -100, max: 100, step: 0.1, default: 0 },
      { key: 'sigma', label: 'sigma standard deviation', min: 0.01, max: 50, step: 0.01, default: 1 },
    ],
    formula: 'f(x) = exp(-(x-mu)^2/(2 sigma^2)) / (sigma sqrt(2 pi))',
    cdfFormula: 'F(x) = Phi((x-mu)/sigma)',
    explanation: 'The bell-shaped model for measurement error and many averages.',
    validate: posParam('sigma'),
    pdf: (x, p) => jStat.normal.pdf(x, p.mu, p.sigma),
    cdf: (x, p) => jStat.normal.cdf(x, p.mu, p.sigma),
    inv: (q, p) => jStat.normal.inv(q, p.mu, p.sigma),
    sample: (p, rng = Math.random) => normalSample(p.mu, p.sigma, rng),
    expectedValue: (p) => `${round(p.mu)}`,
    variance: (p) => `${round(p.sigma * p.sigma)}`,
    range: (p) => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
    fit: (data) => ({ mu: mean(data), sigma: Math.sqrt(Math.max(EPS, variance(data))) }),
  },
  {
    id: 'standard_normal',
    name: 'Standard Normal',
    family: 'continuous',
    support: '-infinity < z < infinity',
    params: [],
    formula: 'phi(z) = exp(-z^2/2) / sqrt(2 pi)',
    cdfFormula: 'Phi(z) = integral of phi(t) from -infinity to z',
    explanation: 'A normal distribution with mean 0 and standard deviation 1. Used for z-scores.',
    pdf: (x) => jStat.normal.pdf(x, 0, 1),
    cdf: (x) => jStat.normal.cdf(x, 0, 1),
    inv: (q) => jStat.normal.inv(q, 0, 1),
    sample: (_p, rng = Math.random) => normalSample(0, 1, rng),
    expectedValue: () => '0',
    variance: () => '1',
    range: () => [-4, 4],
  },
  {
    id: 'lognormal',
    name: 'Lognormal',
    family: 'continuous',
    support: 'x > 0',
    params: [
      { key: 'mu', label: 'mu log mean', min: -5, max: 8, step: 0.05, default: 0 },
      { key: 'sigma', label: 'sigma log sd', min: 0.01, max: 3, step: 0.01, default: 0.5 },
    ],
    formula: 'f(x)=exp(-(ln x-mu)^2/(2 sigma^2))/(x sigma sqrt(2 pi))',
    cdfFormula: 'F(x)=Phi((ln x-mu)/sigma)',
    explanation: 'Useful for positive right-skewed quantities such as income, latency, and sizes.',
    validate: posParam('sigma'),
    pdf: (x, p) => jStat.lognormal.pdf(x, p.mu, p.sigma),
    cdf: (x, p) => jStat.lognormal.cdf(x, p.mu, p.sigma),
    inv: (q, p) => jStat.lognormal.inv(q, p.mu, p.sigma),
    sample: (p, rng = Math.random) => Math.exp(normalSample(p.mu, p.sigma, rng)),
    expectedValue: (p) => `${round(Math.exp(p.mu + p.sigma * p.sigma / 2))}`,
    variance: (p) => `${round((Math.exp(p.sigma * p.sigma) - 1) * Math.exp(2 * p.mu + p.sigma * p.sigma))}`,
    range: (p) => [0, Math.exp(p.mu + 4 * p.sigma)],
    fit: (data) => {
      const values = positive(data).map(Math.log)
      if (values.length < 2) return null
      return { mu: mean(values), sigma: Math.sqrt(Math.max(EPS, variance(values))) }
    },
  },
  {
    id: 'exponential',
    name: 'Exponential',
    family: 'continuous',
    support: 'x >= 0',
    params: [{ key: 'lambda', label: 'lambda rate', min: 0.01, max: 20, step: 0.01, default: 1 }],
    formula: 'f(x)=lambda exp(-lambda x)',
    cdfFormula: 'F(x)=1-exp(-lambda x)',
    explanation: 'Models waiting time between independent events in a Poisson process.',
    validate: posParam('lambda'),
    pdf: (x, p) => jStat.exponential.pdf(x, p.lambda),
    cdf: (x, p) => jStat.exponential.cdf(x, p.lambda),
    inv: (q, p) => jStat.exponential.inv(q, p.lambda),
    sample: (p, rng = Math.random) => -Math.log(Math.max(1 - rng(), EPS)) / p.lambda,
    expectedValue: (p) => `${round(1 / p.lambda)}`,
    variance: (p) => `${round(1 / (p.lambda * p.lambda))}`,
    range: (p) => [0, 6 / p.lambda],
    fit: (data) => {
      const values = positive(data)
      return values.length ? { lambda: 1 / mean(values) } : null
    },
  },
  {
    id: 'gamma',
    name: 'Gamma',
    family: 'continuous',
    support: 'x > 0',
    params: [
      { key: 'shape', label: 'alpha shape', min: 0.05, max: 30, step: 0.05, default: 2 },
      { key: 'scale', label: 'theta scale', min: 0.01, max: 30, step: 0.01, default: 1 },
    ],
    formula: 'f(x)=x^(alpha-1) exp(-x/theta)/(Gamma(alpha) theta^alpha)',
    cdfFormula: 'F(x)=P(alpha, x/theta), the regularized lower incomplete gamma',
    explanation: 'A flexible positive distribution for waiting times and accumulated amounts.',
    validate: (p) => ({ shape: Math.max(EPS, p.shape), scale: Math.max(EPS, p.scale) }),
    pdf: (x, p) => jStat.gamma.pdf(x, p.shape, p.scale),
    cdf: (x, p) => jStat.gamma.cdf(x, p.shape, p.scale),
    inv: (q, p) => jStat.gamma.inv(q, p.shape, p.scale),
    sample: (p, rng = Math.random) => gammaSample(p.shape, p.scale, rng),
    expectedValue: (p) => `${round(p.shape * p.scale)}`,
    variance: (p) => `${round(p.shape * p.scale * p.scale)}`,
    range: (p) => [0, p.scale * (p.shape + 5 * Math.sqrt(p.shape))],
    fit: (data) => {
      const values = positive(data)
      if (values.length < 2) return null
      const m = mean(values)
      const v = variance(values)
      return { shape: Math.max(EPS, m * m / v), scale: Math.max(EPS, v / m) }
    },
  },
  {
    id: 'beta',
    name: 'Beta',
    family: 'continuous',
    support: '0 < x < 1',
    params: [
      { key: 'alpha', label: 'alpha shape 1', min: 0.05, max: 30, step: 0.05, default: 2 },
      { key: 'beta', label: 'beta shape 2', min: 0.05, max: 30, step: 0.05, default: 5 },
    ],
    formula: 'f(x)=x^(alpha-1)(1-x)^(beta-1)/B(alpha,beta)',
    cdfFormula: 'F(x)=I_x(alpha,beta), the regularized incomplete beta',
    explanation: 'A distribution for proportions, probabilities, and bounded [0,1] quantities.',
    validate: (p) => ({ alpha: Math.max(EPS, p.alpha), beta: Math.max(EPS, p.beta) }),
    pdf: (x, p) => jStat.beta.pdf(x, p.alpha, p.beta),
    cdf: (x, p) => jStat.beta.cdf(x, p.alpha, p.beta),
    inv: (q, p) => jStat.beta.inv(q, p.alpha, p.beta),
    sample: (p, rng = Math.random) => {
      const a = gammaSample(p.alpha, 1, rng)
      const b = gammaSample(p.beta, 1, rng)
      return a / (a + b)
    },
    expectedValue: (p) => `${round(p.alpha / (p.alpha + p.beta))}`,
    variance: (p) => `${round(p.alpha * p.beta / ((p.alpha + p.beta) ** 2 * (p.alpha + p.beta + 1)))}`,
    range: () => [0, 1],
    fit: (data) => {
      const values = unit(data)
      if (values.length < 2) return null
      const m = mean(values)
      const v = variance(values)
      const common = m * (1 - m) / v - 1
      if (common <= 0) return null
      return { alpha: Math.max(EPS, m * common), beta: Math.max(EPS, (1 - m) * common) }
    },
  },
  {
    id: 'chi_square',
    name: 'Chi-Square',
    family: 'continuous',
    support: 'x >= 0',
    params: [{ key: 'df', label: 'degrees of freedom', min: 1, max: 100, step: 1, default: 5 }],
    formula: 'f(x)=x^(df/2-1) exp(-x/2)/(2^(df/2) Gamma(df/2))',
    cdfFormula: 'F(x)=P(df/2, x/2)',
    explanation: 'The distribution of the sum of squared independent standard normal variables.',
    validate: (p) => ({ df: Math.max(1, Math.round(p.df)) }),
    pdf: (x, p) => jStat.chisquare.pdf(x, p.df),
    cdf: (x, p) => jStat.chisquare.cdf(x, p.df),
    inv: (q, p) => jStat.chisquare.inv(q, p.df),
    sample: (p, rng = Math.random) => gammaSample(p.df / 2, 2, rng),
    expectedValue: (p) => `${round(p.df)}`,
    variance: (p) => `${round(2 * p.df)}`,
    range: (p) => [0, p.df + 5 * Math.sqrt(2 * p.df)],
    fit: (data) => ({ df: Math.max(1, Math.round(mean(positive(data)))) }),
  },
  {
    id: 'student_t',
    name: "Student's t",
    family: 'continuous',
    support: '-infinity < t < infinity',
    params: [{ key: 'df', label: 'degrees of freedom', min: 1, max: 100, step: 1, default: 5 }],
    formula: 'f(t)=Gamma((df+1)/2)/(sqrt(df pi) Gamma(df/2)) (1+t^2/df)^(-(df+1)/2)',
    cdfFormula: 'CDF via the regularized incomplete beta function',
    explanation: 'Used when estimating means with small samples or unknown variance.',
    validate: (p) => ({ df: Math.max(1, Math.round(p.df)) }),
    pdf: (x, p) => jStat.studentt.pdf(x, p.df),
    cdf: (x, p) => jStat.studentt.cdf(x, p.df),
    inv: (q, p) => jStat.studentt.inv(q, p.df),
    sample: (p, rng = Math.random) => normalSample(0, 1, rng) / Math.sqrt(gammaSample(p.df / 2, 2, rng) / p.df),
    expectedValue: (p) => p.df > 1 ? '0' : 'undefined',
    variance: (p) => p.df > 2 ? `${round(p.df / (p.df - 2))}` : p.df > 1 ? 'infinity' : 'undefined',
    range: (p) => [jStat.studentt.inv(0.001, p.df), jStat.studentt.inv(0.999, p.df)],
  },
  {
    id: 'f',
    name: 'F',
    family: 'continuous',
    support: 'x >= 0',
    params: [
      { key: 'df1', label: 'df1 numerator', min: 1, max: 100, step: 1, default: 5 },
      { key: 'df2', label: 'df2 denominator', min: 1, max: 100, step: 1, default: 10 },
    ],
    formula: 'Ratio of two chi-square variables divided by their degrees of freedom',
    cdfFormula: 'F(x)=I_{df1 x/(df1 x+df2)}(df1/2, df2/2)',
    explanation: 'Used in ANOVA, variance ratio tests, and model comparison.',
    validate: (p) => ({ df1: Math.max(1, Math.round(p.df1)), df2: Math.max(1, Math.round(p.df2)) }),
    pdf: (x, p) => jStat.centralF.pdf(x, p.df1, p.df2),
    cdf: (x, p) => jStat.centralF.cdf(x, p.df1, p.df2),
    inv: (q, p) => jStat.centralF.inv(q, p.df1, p.df2),
    sample: (p, rng = Math.random) => (gammaSample(p.df1 / 2, 2, rng) / p.df1) / (gammaSample(p.df2 / 2, 2, rng) / p.df2),
    expectedValue: (p) => p.df2 > 2 ? `${round(p.df2 / (p.df2 - 2))}` : 'undefined',
    variance: (p) => p.df2 > 4 ? `${round(2 * p.df2 ** 2 * (p.df1 + p.df2 - 2) / (p.df1 * (p.df2 - 2) ** 2 * (p.df2 - 4)))}` : 'undefined',
    range: (p) => [0, jStat.centralF.inv(0.995, p.df1, p.df2)],
  },
  {
    id: 'weibull',
    name: 'Weibull',
    family: 'continuous',
    support: 'x >= 0',
    params: [
      { key: 'scale', label: 'lambda scale', min: 0.01, max: 50, step: 0.01, default: 1 },
      { key: 'shape', label: 'k shape', min: 0.05, max: 10, step: 0.05, default: 1.5 },
    ],
    formula: 'f(x)=(k/lambda)(x/lambda)^(k-1) exp(-(x/lambda)^k)',
    cdfFormula: 'F(x)=1-exp(-(x/lambda)^k)',
    explanation: 'A reliability and survival model with increasing, constant, or decreasing hazard.',
    validate: (p) => ({ scale: Math.max(EPS, p.scale), shape: Math.max(EPS, p.shape) }),
    pdf: (x, p) => jStat.weibull.pdf(x, p.scale, p.shape),
    cdf: (x, p) => jStat.weibull.cdf(x, p.scale, p.shape),
    inv: (q, p) => jStat.weibull.inv(q, p.scale, p.shape),
    sample: (p, rng = Math.random) => p.scale * (-Math.log(Math.max(1 - rng(), EPS))) ** (1 / p.shape),
    expectedValue: (p) => `${round(p.scale * Math.exp(jStat.gammaln(1 + 1 / p.shape)))}`,
    variance: (p) => `${round(p.scale ** 2 * (Math.exp(jStat.gammaln(1 + 2 / p.shape)) - Math.exp(2 * jStat.gammaln(1 + 1 / p.shape))))}`,
    range: (p) => [0, p.scale * (-Math.log(0.001)) ** (1 / p.shape)],
    fit: (data) => {
      const values = positive(data)
      if (values.length < 2) return null
      const logs = values.map(Math.log)
      const shape = Math.max(EPS, (Math.PI / Math.sqrt(6)) / Math.sqrt(Math.max(EPS, variance(logs))))
      const scale = mean(values) / Math.exp(jStat.gammaln(1 + 1 / shape))
      return { scale, shape }
    },
  },
  {
    id: 'pareto',
    name: 'Pareto',
    family: 'continuous',
    support: 'x >= xm',
    params: [
      { key: 'xm', label: 'xm scale minimum', min: 0.01, max: 50, step: 0.01, default: 1 },
      { key: 'alpha', label: 'alpha shape', min: 0.1, max: 20, step: 0.05, default: 2.5 },
    ],
    formula: 'f(x)=alpha xm^alpha / x^(alpha+1)',
    cdfFormula: 'F(x)=1-(xm/x)^alpha',
    explanation: 'A heavy-tailed model for sizes, wealth, losses, and extreme magnitudes.',
    validate: (p) => ({ xm: Math.max(EPS, p.xm), alpha: Math.max(EPS, p.alpha) }),
    pdf: (x, p) => jStat.pareto.pdf(x, p.xm, p.alpha),
    cdf: (x, p) => jStat.pareto.cdf(x, p.xm, p.alpha),
    inv: (q, p) => jStat.pareto.inv(q, p.xm, p.alpha),
    sample: (p, rng = Math.random) => p.xm / (1 - rng()) ** (1 / p.alpha),
    expectedValue: (p) => p.alpha > 1 ? `${round(p.alpha * p.xm / (p.alpha - 1))}` : 'infinity',
    variance: (p) => p.alpha > 2 ? `${round(p.xm ** 2 * p.alpha / ((p.alpha - 1) ** 2 * (p.alpha - 2)))}` : 'infinity',
    range: (p) => [p.xm, p.xm * 20],
    fit: (data) => {
      const values = positive(data)
      if (values.length < 2) return null
      const xm = Math.min(...values)
      const alpha = values.length / values.reduce((sum, value) => sum + Math.log(value / xm), 0)
      return { xm, alpha }
    },
  },
  {
    id: 'cauchy',
    name: 'Cauchy',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'x0', label: 'x0 location', min: -50, max: 50, step: 0.1, default: 0 },
      { key: 'gamma', label: 'gamma scale', min: 0.01, max: 20, step: 0.01, default: 1 },
    ],
    formula: 'f(x)=1/(pi gamma [1+((x-x0)/gamma)^2])',
    cdfFormula: 'F(x)=1/pi arctan((x-x0)/gamma)+1/2',
    explanation: 'A symmetric heavy-tailed distribution with no finite mean or variance.',
    validate: posParam('gamma'),
    pdf: (x, p) => jStat.cauchy.pdf(x, p.x0, p.gamma),
    cdf: (x, p) => jStat.cauchy.cdf(x, p.x0, p.gamma),
    inv: (q, p) => jStat.cauchy.inv(q, p.x0, p.gamma),
    sample: (p, rng = Math.random) => p.x0 + p.gamma * Math.tan(Math.PI * (rng() - 0.5)),
    expectedValue: () => 'undefined',
    variance: () => 'undefined',
    range: (p) => [p.x0 - 10 * p.gamma, p.x0 + 10 * p.gamma],
    fit: (data) => {
      const sorted = [...data].sort((a, b) => a - b)
      return { x0: quantileSorted(sorted, 0.5), gamma: Math.max(EPS, (quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25)) / 2) }
    },
  },
  {
    id: 'logistic',
    name: 'Logistic',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'mu', label: 'mu location', min: -50, max: 50, step: 0.1, default: 0 },
      { key: 's', label: 's scale', min: 0.01, max: 20, step: 0.01, default: 1 },
    ],
    formula: 'f(x)=exp(-(x-mu)/s)/(s(1+exp(-(x-mu)/s))^2)',
    cdfFormula: 'F(x)=1/(1+exp(-(x-mu)/s))',
    explanation: 'A symmetric S-curve distribution often linked to logistic regression and growth curves.',
    validate: posParam('s'),
    pdf: (x, p) => { const z = Math.exp(-(x - p.mu) / p.s); return z / (p.s * (1 + z) ** 2) },
    cdf: (x, p) => 1 / (1 + Math.exp(-(x - p.mu) / p.s)),
    inv: (q, p) => p.mu + p.s * Math.log(q / (1 - q)),
    sample: (p, rng = Math.random) => p.mu + p.s * Math.log(rng() / (1 - rng())),
    expectedValue: (p) => `${round(p.mu)}`,
    variance: (p) => `${round(Math.PI ** 2 * p.s ** 2 / 3)}`,
    range: (p) => [p.mu - 8 * p.s, p.mu + 8 * p.s],
    fit: (data) => ({ mu: mean(data), s: Math.sqrt(Math.max(EPS, variance(data)) * 3) / Math.PI }),
  },
  {
    id: 'skew_normal',
    name: 'Skew-normal',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'xi', label: 'xi location', min: -50, max: 50, step: 0.1, default: 0 },
      { key: 'omega', label: 'omega scale', min: 0.05, max: 20, step: 0.05, default: 1 },
      { key: 'alpha', label: 'alpha slant', min: -10, max: 10, step: 0.1, default: 2 },
    ],
    formula: 'f(x)=(2/ω) φ((x-ξ)/ω) Φ(α (x-ξ)/ω)',
    cdfFormula: 'No elementary CDF; the page integrates the pdf numerically in KS tests via the fitted cdf approximation Φ',
    explanation: 'A unimodal family that adds a slant parameter to the normal. α = 0 recovers the normal.',
    validate: posParam('omega'),
    pdf: (x, p) => {
      const z = (x - p.xi) / p.omega
      return (2 / p.omega) * jStat.normal.pdf(z, 0, 1) * jStat.normal.cdf(p.alpha * z, 0, 1)
    },
    cdf: (x, p) => {
      const z = (x - p.xi) / p.omega
      return jStat.normal.cdf(z, 0, 1)
    },
    inv: (q, p) => p.xi + p.omega * jStat.normal.inv(q, 0, 1),
    sample: (p, rng = Math.random) => {
      const u0 = jStat.normal.inv(rng(), 0, 1)
      const u1 = jStat.normal.inv(rng(), 0, 1)
      const z = p.alpha * u0 > 0 ? Math.abs(u1) : -Math.abs(u1)
      return p.xi + p.omega * (p.alpha === 0 ? u0 : 0.7 * z + 0.3 * u0)
    },
    expectedValue: (p) => `${round(p.xi)}`,
    variance: (p) => `${round(p.omega ** 2)}`,
    range: (p) => [p.xi - 6 * p.omega, p.xi + 6 * p.omega],
    fit: (data) => ({ xi: mean(data), omega: Math.sqrt(Math.max(EPS, variance(data))), alpha: mean(data.map((v) => (v - mean(data)) ** 3)) > 0 ? 2 : -2 }),
  },
  {
    id: 'laplace',
    name: 'Laplace',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'mu', label: 'mu location', min: -50, max: 50, step: 0.1, default: 0 },
      { key: 'b', label: 'b scale', min: 0.05, max: 20, step: 0.05, default: 1 },
    ],
    formula: 'f(x)=(1/(2b)) exp(-|x-μ|/b)',
    cdfFormula: 'F(x)= (1/2) exp((x-μ)/b) for x<μ; 1 - (1/2) exp(-(x-μ)/b) for x≥μ',
    explanation: 'Double-exponential tails; the MLE location is the median.',
    validate: posParam('b'),
    pdf: (x, p) => Math.exp(-Math.abs(x - p.mu) / p.b) / (2 * p.b),
    cdf: (x, p) => x < p.mu ? 0.5 * Math.exp((x - p.mu) / p.b) : 1 - 0.5 * Math.exp(-(x - p.mu) / p.b),
    inv: (q, p) => q < 0.5 ? p.mu + p.b * Math.log(2 * q) : p.mu - p.b * Math.log(2 - 2 * q),
    sample: (p, rng = Math.random) => p.mu + (rng() < 0.5 ? 1 : -1) * p.b * Math.log(rng()),
    expectedValue: (p) => `${round(p.mu)}`,
    variance: (p) => `${round(2 * p.b * p.b)}`,
    range: (p) => [p.mu - 8 * p.b, p.mu + 8 * p.b],
    fit: (data) => {
      const sorted = [...data].sort((a, b) => a - b)
      const mu = quantileSorted(sorted, 0.5)
      return { mu, b: mean(data.map((v) => Math.abs(v - mu))) }
    },
  },
  {
    id: 'gumbel',
    name: 'Gumbel',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'mu', label: 'mu location', min: -50, max: 50, step: 0.1, default: 0 },
      { key: 'beta', label: 'beta scale', min: 0.05, max: 20, step: 0.05, default: 1 },
    ],
    formula: 'f(x)=(1/β) exp(-(z+exp(-z))), z=(x-μ)/β',
    cdfFormula: 'F(x)=exp(-exp(-(x-μ)/β))',
    explanation: 'Extreme-value (maxima) distribution. Related to GEV with shape 0.',
    validate: posParam('beta'),
    pdf: (x, p) => {
      const z = (x - p.mu) / p.beta
      return Math.exp(-(z + Math.exp(-z))) / p.beta
    },
    cdf: (x, p) => Math.exp(-Math.exp(-(x - p.mu) / p.beta)),
    inv: (q, p) => p.mu - p.beta * Math.log(-Math.log(q)),
    sample: (p, rng = Math.random) => p.mu - p.beta * Math.log(-Math.log(Math.max(rng(), 1e-12))),
    expectedValue: (p) => `${round(p.mu + 0.57721 * p.beta)}`,
    variance: (p) => `${round((Math.PI ** 2 / 6) * p.beta * p.beta)}`,
    range: (p) => [p.mu - 4 * p.beta, p.mu + 8 * p.beta],
    fit: (data) => ({ mu: mean(data), beta: Math.sqrt(Math.max(EPS, variance(data)) * 6) / Math.PI }),
  },
  {
    id: 'inverse_gaussian',
    name: 'Wald / Inverse Gaussian',
    family: 'continuous',
    support: 'x > 0',
    params: [
      { key: 'mu', label: 'mu mean', min: 0.05, max: 50, step: 0.05, default: 1 },
      { key: 'lambda', label: 'lambda shape', min: 0.05, max: 50, step: 0.05, default: 1 },
    ],
    formula: 'f(x)=√(λ/(2πx³)) exp(-λ(x-μ)²/(2μ²x))',
    cdfFormula: 'F uses two Φ terms (Wald CDF)',
    explanation: 'First-passage time of Brownian motion with drift. Mean μ, shape λ.',
    validate: (p) => ({ mu: Math.max(EPS, p.mu), lambda: Math.max(EPS, p.lambda) }),
    pdf: (x, p) => x <= 0 ? 0 : Math.sqrt(p.lambda / (2 * Math.PI * x ** 3)) * Math.exp(-p.lambda * (x - p.mu) ** 2 / (2 * p.mu * p.mu * x)),
    cdf: (x, p) => {
      if (x <= 0) return 0
      const a = Math.sqrt(p.lambda / x) * (x / p.mu - 1)
      const b = Math.sqrt(p.lambda / x) * (x / p.mu + 1)
      return jStat.normal.cdf(a, 0, 1) + Math.exp(2 * p.lambda / p.mu) * jStat.normal.cdf(-b, 0, 1)
    },
    inv: (q, p) => p.mu,
    sample: (p, rng = Math.random) => {
      const nu = jStat.normal.inv(rng(), 0, 1)
      const y = nu * nu
      const x = p.mu + (p.mu * p.mu * y) / (2 * p.lambda) - (p.mu / (2 * p.lambda)) * Math.sqrt(4 * p.mu * p.lambda * y + p.mu * p.mu * y * y)
      return rng() <= p.mu / (p.mu + x) ? x : p.mu * p.mu / x
    },
    expectedValue: (p) => `${round(p.mu)}`,
    variance: (p) => `${round(p.mu ** 3 / p.lambda)}`,
    range: (p) => [0, p.mu + 8 * Math.sqrt(p.mu ** 3 / p.lambda)],
    fit: (data) => {
      const pos = positive(data)
      if (pos.length < 2) return null
      const mu = mean(pos)
      const lambda = 1 / mean(pos.map((v) => 1 / v - 1 / mu))
      return { mu, lambda: Math.max(EPS, lambda) }
    },
  },
  {
    id: 'stretched_beta',
    name: 'Stretched beta',
    family: 'continuous',
    support: 'a < x < b',
    params: [
      { key: 'a', label: 'a min', min: -20, max: 20, step: 0.1, default: 0 },
      { key: 'b', label: 'b max', min: -19, max: 21, step: 0.1, default: 1 },
      { key: 'alpha', label: 'alpha', min: 0.05, max: 20, step: 0.05, default: 2 },
      { key: 'beta', label: 'beta', min: 0.05, max: 20, step: 0.05, default: 2 },
    ],
    formula: 'Y = a + (b-a) X, X ~ Beta(α,β)',
    cdfFormula: 'F(x)=I_{(x-a)/(b-a)}(α,β)',
    explanation: 'Four-parameter beta on an arbitrary interval [a,b].',
    validate: (p) => ({ ...abOrdered(p), alpha: Math.max(EPS, p.alpha), beta: Math.max(EPS, p.beta) }),
    pdf: (x, p) => {
      const z = (x - p.a) / (p.b - p.a)
      if (z <= 0 || z >= 1) return 0
      return jStat.beta.pdf(z, p.alpha, p.beta) / (p.b - p.a)
    },
    cdf: (x, p) => {
      const z = (x - p.a) / (p.b - p.a)
      if (z <= 0) return 0
      if (z >= 1) return 1
      return jStat.beta.cdf(z, p.alpha, p.beta)
    },
    inv: (q, p) => p.a + (p.b - p.a) * jStat.beta.inv(q, p.alpha, p.beta),
    sample: (p, rng = Math.random) => p.a + (p.b - p.a) * jStat.beta.inv(rng(), p.alpha, p.beta),
    expectedValue: (p) => `${round(p.a + (p.b - p.a) * p.alpha / (p.alpha + p.beta))}`,
    variance: (p) => `${round(((p.b - p.a) ** 2) * p.alpha * p.beta / ((p.alpha + p.beta) ** 2 * (p.alpha + p.beta + 1)))}`,
    range: (p) => [p.a, p.b],
    fit: (data) => {
      const lo = Math.min(...data)
      const hi = Math.max(...data)
      const a = lo - 1e-6
      const b = hi + 1e-6
      const z = data.map((v) => (v - a) / (b - a)).filter((v) => v > 0 && v < 1)
      const m = mean(z)
      const v = variance(z)
      const t = m * (1 - m) / Math.max(v, EPS) - 1
      return { a, b, alpha: Math.max(EPS, m * t), beta: Math.max(EPS, (1 - m) * t) }
    },
  },
  {
    id: 'mixture_normal',
    name: 'Normal mixture (2)',
    family: 'continuous',
    support: '-infinity < x < infinity',
    params: [
      { key: 'mu1', label: 'mu1', min: -50, max: 50, step: 0.1, default: -1 },
      { key: 'mu2', label: 'mu2', min: -50, max: 50, step: 0.1, default: 1 },
      { key: 's', label: 'shared sd', min: 0.05, max: 20, step: 0.05, default: 1 },
      { key: 'pi', label: 'pi weight', min: 0.05, max: 0.95, step: 0.01, default: 0.5 },
    ],
    formula: 'f(x)=π φ(x;μ1,s) + (1-π) φ(x;μ2,s)',
    cdfFormula: 'F(x)=π Φ((x-μ1)/s) + (1-π) Φ((x-μ2)/s)',
    explanation: 'Equal-variance two-component Gaussian mixture.',
    validate: (p) => ({ ...p, s: Math.max(EPS, p.s), pi: clamp(p.pi, 0.05, 0.95) }),
    pdf: (x, p) => p.pi * jStat.normal.pdf(x, p.mu1, p.s) + (1 - p.pi) * jStat.normal.pdf(x, p.mu2, p.s),
    cdf: (x, p) => p.pi * jStat.normal.cdf(x, p.mu1, p.s) + (1 - p.pi) * jStat.normal.cdf(x, p.mu2, p.s),
    inv: (q, p) => p.pi * p.mu1 + (1 - p.pi) * p.mu2 + p.s * jStat.normal.inv(q, 0, 1),
    sample: (p, rng = Math.random) => (rng() < p.pi ? p.mu1 : p.mu2) + p.s * jStat.normal.inv(rng(), 0, 1),
    expectedValue: (p) => `${round(p.pi * p.mu1 + (1 - p.pi) * p.mu2)}`,
    variance: (p) => `${round(p.s ** 2)}`,
    range: (p) => [Math.min(p.mu1, p.mu2) - 5 * p.s, Math.max(p.mu1, p.mu2) + 5 * p.s],
    fit: (data) => {
      const sorted = [...data].sort((a, b) => a - b)
      return { mu1: quantileSorted(sorted, 0.25), mu2: quantileSorted(sorted, 0.75), s: Math.sqrt(Math.max(EPS, variance(data))), pi: 0.5 }
    },
  },
  {
    id: 'zip',
    name: 'Zero-inflated Poisson',
    family: 'discrete',
    support: 'k = 0, 1, 2, ...',
    params: [
      { key: 'lambda', label: 'lambda', min: 0.05, max: 30, step: 0.05, default: 2 },
      { key: 'pi', label: 'zero inflation', min: 0, max: 0.95, step: 0.01, default: 0.2 },
    ],
    formula: 'P(0)=π+(1-π)e^{-λ}; P(k)=(1-π) e^{-λ} λ^k / k! for k>0',
    cdfFormula: 'F(k)=P(0)+sum_{i=1..k} P(i)',
    explanation: 'Extra zeros on top of a Poisson count process.',
    validate: (p) => ({ lambda: Math.max(EPS, p.lambda), pi: clamp(p.pi, 0, 0.95) }),
    pdf: (x, p) => {
      const k = Math.round(x)
      if (k < 0) return 0
      const pois = jStat.poisson.pdf(k, p.lambda)
      return k === 0 ? p.pi + (1 - p.pi) * pois : (1 - p.pi) * pois
    },
    cdf: (x, p) => {
      let s = 0
      for (let k = 0; k <= Math.floor(x); k++) {
        const pois = jStat.poisson.pdf(k, p.lambda)
        s += k === 0 ? p.pi + (1 - p.pi) * pois : (1 - p.pi) * pois
      }
      return s
    },
    inv: (q, p) => discreteInv((k) => {
      let s = 0
      for (let i = 0; i <= k; i++) {
        const pois = jStat.poisson.pdf(i, p.lambda)
        s += i === 0 ? p.pi + (1 - p.pi) * pois : (1 - p.pi) * pois
      }
      return s
    }, 0, 80, q),
    sample: (p, rng = Math.random) => {
      if (rng() < p.pi) return 0
      const L = Math.exp(-p.lambda)
      let k = 0
      let prod = rng()
      while (prod > L && k < 80) {
        k += 1
        prod *= rng()
      }
      return k
    },
    expectedValue: (p) => `${round((1 - p.pi) * p.lambda)}`,
    variance: (p) => `${round((1 - p.pi) * p.lambda * (1 + p.pi * p.lambda))}`,
    range: (p) => [0, Math.max(8, p.lambda * 5)],
    fit: (data) => {
      const ints = integers(data).filter((v) => v >= 0)
      if (!ints.length) return null
      const p0 = ints.filter((v) => v === 0).length / ints.length
      const m = mean(ints)
      return { lambda: Math.max(EPS, m / Math.max(1 - p0, 0.05)), pi: clamp(p0, 0, 0.95) }
    },
  },
  {
    id: 'zinb',
    name: 'Zero-inflated NB',
    family: 'discrete',
    support: 'k = 0, 1, 2, ...',
    params: [
      { key: 'r', label: 'r', min: 1, max: 40, step: 1, default: 3 },
      { key: 'p', label: 'p', min: 0.05, max: 0.95, step: 0.01, default: 0.5 },
      { key: 'pi', label: 'zero inflation', min: 0, max: 0.95, step: 0.01, default: 0.2 },
    ],
    formula: 'Zero-inflated negative binomial: extra π mass at 0 plus NB(r,p)',
    cdfFormula: 'F(k)=π+(1-π)F_NB(k) with F_NB the ordinary NB CDF',
    explanation: 'Overdispersed counts with extra zeros.',
    validate: (p) => ({ r: Math.max(1, Math.round(p.r)), p: clamp(p.p, EPS, 1 - EPS), pi: clamp(p.pi, 0, 0.95) }),
    pdf: (x, p) => {
      const k = Math.round(x)
      if (k < 0) return 0
      const nb = jStat.negbin.pdf(k, p.r, p.p)
      return k === 0 ? p.pi + (1 - p.pi) * nb : (1 - p.pi) * nb
    },
    cdf: (x, p) => p.pi + (1 - p.pi) * jStat.negbin.cdf(Math.floor(x), p.r, p.p),
    inv: (q, p) => discreteInv((k) => p.pi + (1 - p.pi) * jStat.negbin.cdf(k, p.r, p.p), 0, 80, q),
    sample: (p, rng = Math.random) => {
      if (rng() < p.pi) return 0
      const meanNb = p.r * (1 - p.p) / p.p
      return Math.max(0, Math.round(meanNb * (-Math.log(Math.max(rng(), 1e-12)))))
    },
    expectedValue: (p) => `${round((1 - p.pi) * p.r * (1 - p.p) / p.p)}`,
    variance: () => 'mixture of NB and a point mass at 0',
    range: (p) => [0, Math.max(12, p.r * 8)],
    fit: (data) => {
      const ints = integers(data).filter((v) => v >= 0)
      if (!ints.length) return null
      return { r: 3, p: 0.5, pi: clamp(ints.filter((v) => v === 0).length / ints.length, 0, 0.95) }
    },
  },
  {
    id: 'multinomial',
    name: 'Multinomial',
    family: 'multivariate',
    support: 'count vector x_i >= 0 with sum x_i = n',
    params: [
      { key: 'n', label: 'n trials', min: 1, max: 200, step: 1, default: 20 },
      { key: 'p1', label: 'p1 category 1', min: 0.01, max: 0.98, step: 0.01, default: 0.3 },
      { key: 'p2', label: 'p2 category 2', min: 0.01, max: 0.98, step: 0.01, default: 0.4 },
    ],
    formula: 'P(X=x)=n!/(x1!...xk!) product_i p_i^x_i',
    cdfFormula: 'No simple scalar CDF; chart shows the marginal X1 ~ Binomial(n,p1)',
    explanation: 'Generalizes the binomial to more than two categories. The chart uses the first category marginal.',
    validate: (p) => {
      const p1 = clamp(p.p1, EPS, 1 - EPS)
      const p2 = clamp(p.p2, EPS, 1 - p1 - EPS)
      return { n: Math.max(1, Math.round(p.n)), p1, p2 }
    },
    pdf: (x, p) => jStat.binomial.pdf(Math.round(x), p.n, p.p1),
    cdf: (x, p) => jStat.binomial.cdf(Math.floor(x), p.n, p.p1),
    inv: (q, p) => discreteInv((x) => jStat.binomial.cdf(x, p.n, p.p1), 0, p.n, q),
    sample: (p, rng = Math.random) => {
      const p3 = Math.max(0, 1 - p.p1 - p.p2)
      const counts = [0, 0, 0]
      for (let i = 0; i < p.n; i++) {
        const u = rng()
        counts[u < p.p1 ? 0 : u < p.p1 + p.p2 ? 1 : 2]++
      }
      return p3 >= 0 ? counts : [counts[0], counts[1]]
    },
    expectedValue: (p) => `[${round(p.n * p.p1)}, ${round(p.n * p.p2)}, ${round(p.n * Math.max(0, 1 - p.p1 - p.p2))}]`,
    variance: () => `Var(X_i)=n p_i(1-p_i); Cov(X_i,X_j)=-n p_i p_j`,
    range: (p) => [0, p.n],
  },
  {
    id: 'dirichlet',
    name: 'Dirichlet',
    family: 'multivariate',
    support: 'x_i > 0 and sum x_i = 1',
    params: [
      { key: 'a1', label: 'alpha 1', min: 0.05, max: 20, step: 0.05, default: 2 },
      { key: 'a2', label: 'alpha 2', min: 0.05, max: 20, step: 0.05, default: 3 },
      { key: 'a3', label: 'alpha 3', min: 0.05, max: 20, step: 0.05, default: 4 },
    ],
    formula: 'f(x)=Gamma(sum alpha_i)/product Gamma(alpha_i) product x_i^(alpha_i-1)',
    cdfFormula: 'No closed-form scalar CDF; chart shows marginal X1 ~ Beta(alpha1, alpha2+alpha3)',
    explanation: 'A distribution over probability vectors. It is the multivariate analogue of the beta distribution.',
    validate: (p) => ({ a1: Math.max(EPS, p.a1), a2: Math.max(EPS, p.a2), a3: Math.max(EPS, p.a3) }),
    pdf: (x, p) => jStat.beta.pdf(x, p.a1, p.a2 + p.a3),
    cdf: (x, p) => jStat.beta.cdf(x, p.a1, p.a2 + p.a3),
    inv: (q, p) => jStat.beta.inv(q, p.a1, p.a2 + p.a3),
    sample: (p, rng = Math.random) => {
      const values = [gammaSample(p.a1, 1, rng), gammaSample(p.a2, 1, rng), gammaSample(p.a3, 1, rng)]
      const total = values.reduce((sum, value) => sum + value, 0)
      return values.map((value) => value / total)
    },
    expectedValue: (p) => {
      const total = p.a1 + p.a2 + p.a3
      return `[${round(p.a1 / total)}, ${round(p.a2 / total)}, ${round(p.a3 / total)}]`
    },
    variance: (p) => {
      const total = p.a1 + p.a2 + p.a3
      return `Var(X_i)=alpha_i(alpha0-alpha_i)/(alpha0^2(alpha0+1)), alpha0=${round(total)}`
    },
    range: () => [0, 1],
  },
  {
    id: 'empirical',
    name: 'Empirical',
    family: 'empirical',
    support: 'observed data values',
    params: [],
    formula: 'F_n(x)=1/n sum I(x_i <= x)',
    cdfFormula: 'Step function based directly on sorted observations',
    explanation: 'The empirical distribution uses the observed data itself without assuming a parametric family.',
    pdf: (x, _p, data) => {
      const sorted = empiricalSorted(data)
      if (sorted.length === 0) return 0
      return sorted.filter((value) => value === x).length / sorted.length
    },
    cdf: (x, _p, data) => {
      const sorted = empiricalSorted(data)
      if (sorted.length === 0) return 0
      let count = 0
      for (const value of sorted) if (value <= x) count++
      return count / sorted.length
    },
    inv: (q, _p, data) => quantileSorted(empiricalSorted(data), q),
    sample: (_p, rng = Math.random, data) => {
      const sorted = empiricalSorted(data)
      return sorted.length ? sorted[Math.floor(rng() * sorted.length)] : rng()
    },
    expectedValue: (_p, data) => data?.length ? `${round(mean(data))}` : 'load data',
    variance: (_p, data) => data && data.length > 1 ? `${round(variance(data))}` : 'load data',
    range: (_p, data) => {
      const sorted = empiricalSorted(data)
      return sorted.length ? [sorted[0], sorted[sorted.length - 1]] : [0, 1]
    },
    fit: () => ({}),
  },
]

export const DISTRIBUTION_BY_ID = Object.fromEntries(DISTRIBUTIONS.map((dist) => [dist.id, dist])) as Record<DistributionId, Distribution>

export function defaultParams(dist: Distribution) {
  const params = Object.fromEntries(dist.params.map((param) => [param.key, param.default]))
  return sanitizeParams(dist, params)
}

export function sanitizeParams(dist: Distribution, params: Record<string, number>) {
  const merged = { ...Object.fromEntries(dist.params.map((param) => [param.key, param.default])), ...params }
  return dist.validate ? dist.validate(merged) : merged
}

export function curvePoints(dist: Distribution, params: Record<string, number>, mode: 'density' | 'cdf', data?: number[]) {
  const p = sanitizeParams(dist, params)
  const [rawLo, hiRaw] = dist.range(p, data)
  const lo = Number.isFinite(rawLo) ? rawLo : 0
  const hi = Number.isFinite(hiRaw) ? hiRaw : lo + 1
  const fn = mode === 'cdf' ? dist.cdf : dist.pdf
  if (dist.family === 'discrete' || dist.id === 'multinomial') {
    const count = Math.min(500, Math.max(1, Math.floor(hi - lo) + 1))
    const x = Array.from({ length: count }, (_, i) => Math.ceil(lo) + i)
    return { x, y: x.map((value) => {
      const y = fn(value, p, data)
      return Number.isFinite(y) ? y : 0
    }), type: 'bar' as const }
  }
  if (dist.id === 'empirical') {
    const sorted = empiricalSorted(data)
    const x = sorted.length ? sorted : [0]
    return { x, y: x.map((value) => mode === 'cdf' ? dist.cdf(value, p, data) : dist.pdf(value, p, data)), type: 'bar' as const }
  }
  const steps = 360
  const x = Array.from({ length: steps + 1 }, (_, i) => lo + (i / steps) * (hi - lo))
  return { x, y: x.map((value) => fn(value, p, data)), type: 'line' as const }
}

export function generateSamples(dist: Distribution, params: Record<string, number>, count: number, data?: number[]) {
  const p = sanitizeParams(dist, params)
  return Array.from({ length: count }, () => dist.sample(p, undefined, data))
}

export function fitDistribution(dist: Distribution, data: number[]) {
  const values = data.filter(Number.isFinite)
  if (!dist.fit || values.length < 2) return null
  const fit = dist.fit(values)
  return fit ? sanitizeParams(dist, fit) : null
}

export function goodnessOfFit(dist: Distribution, params: Record<string, number>, data: number[]) {
  const values = data.filter(Number.isFinite)
  const p = sanitizeParams(dist, params)
  if (values.length < 2) return null
  if (dist.family === 'continuous' || dist.id === 'empirical') {
    return { ...ksTest(values, (x) => dist.cdf(x, p, values)), method: 'KS' as const }
  }
  const [lo, hi] = dist.range(p, values)
  return { ...chiSquareGof(values, (x) => dist.pdf(x, p, values), lo, hi), method: 'Chi-square' as const }
}

export function compareFits(data: number[], ids: DistributionId[] = DISTRIBUTIONS.filter((d) => d.fit && d.id !== 'empirical').map((d) => d.id)) {
  const results: FitResult[] = []
  for (const id of ids) {
    const dist = DISTRIBUTION_BY_ID[id]
    const fit = fitDistribution(dist, data)
    if (!fit) continue
    const gof = goodnessOfFit(dist, fit, data)
    if (!gof || !Number.isFinite(gof.statistic)) continue
    results.push({ id, name: dist.name, params: fit, statistic: gof.statistic, pValue: gof.pValue, method: gof.method })
  }
  return results.sort((a, b) => a.statistic - b.statistic)
}

export function exportCurveCsv(dist: Distribution, params: Record<string, number>, mode: 'density' | 'cdf', data?: number[]) {
  const curve = curvePoints(dist, params, mode, data)
  const yName = mode === 'cdf' ? 'cdf' : dist.family === 'discrete' ? 'pmf' : 'pdf'
  return ['x,' + yName, ...curve.x.map((x, i) => `${x},${curve.y[i]}`)].join('\n')
}
