import jStatRaw from 'jstat'
import { logBeta, logGamma } from '../analysis/engines/bayesian/special'
import { STATISTICS_STUDIOS, labPath, studioPath, type Studio } from './statisticsStudios'

type JStatLike = {
  beta: { pdf: (x: number, a: number, b: number) => number; cdf: (x: number, a: number, b: number) => number; inv: (p: number, a: number, b: number) => number }
  gamma: { pdf: (x: number, shape: number, scale: number) => number; cdf: (x: number, shape: number, scale: number) => number; inv: (p: number, shape: number, scale: number) => number }
  normal: { pdf: (x: number, mu: number, sd: number) => number; cdf: (x: number, mu: number, sd: number) => number; inv: (p: number, mu: number, sd: number) => number }
  poisson: { pdf: (k: number, lambda: number) => number; cdf: (k: number, lambda: number) => number }
  binomial: { pdf: (k: number, n: number, p: number) => number; cdf: (k: number, n: number, p: number) => number }
}

const jStat = jStatRaw as unknown as JStatLike

export const BAYES_STUDIO_SLUG = 'bayesian-statistics'
export const BAYES_PROGRESS_KEY = 'anveshak-bayesian-statistics'
export const BAYES_NEXT_STUDIO_SLUG = 'correlation-association'
export const BAYES_EPS = 1e-12
export const LOG_ZERO = -1e12

/**
 * Gamma parameterization used in this studio: shape–rate.
 *   λ ~ Gamma(α, β) with rate β
 *   mean = α / β, variance = α / β²
 * The Distributions studio uses shape–scale θ = 1/β (jStat.gamma).
 * Conjugate Poisson update with exposure t: Gamma(α + Σx, β + t).
 */
export const GAMMA_PARAMETERIZATION = 'shape-rate' as const

export type BayesTab = 'learn' | 'explore' | 'practice' | 'quiz'
export type BayesProgress = { completed: string[] }
export type DensityPoint = { x: number; y: number }
export type CredibleLevel = 0.5 | 0.8 | 0.9 | 0.95 | 0.99
export type IntervalKind = 'equal-tailed' | 'hpd'
export type CredibleInterval = { lo: number; hi: number; mass: number; kind: IntervalKind; width: number }
export type PosteriorSummary = { mean: number; median: number; map: number; variance: number; sd: number }
export type CurveRole = 'prior' | 'likelihood' | 'posterior' | 'predictive'

export const BAYES_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === BAYES_STUDIO_SLUG) as Studio
export const BAYES_NEXT_STUDIO = STATISTICS_STUDIOS.find((studio) => studio.slug === BAYES_NEXT_STUDIO_SLUG) as Studio

export const BAYES_HOME_COPY: Record<string, { blurb: string; tryThis: string; chips: string[] }> = {
  'bayesian-foundations': {
    blurb: 'Learn Bayes’ theorem: prior, likelihood, and posterior.',
    tryThis: 'Give the coin a strong prior that disagrees with the data. Watch the posterior compromise.',
    chips: ['Prior', 'Likelihood', 'Posterior'],
  },
  'beta-binomial': {
    blurb: 'Update a binomial proportion with a Beta prior.',
    tryThis: 'Add successes one at a time. Concentration α+β is prior strength, not a literal sample size.',
    chips: ['Beta prior', 'Binomial data', 'Conjugacy'],
  },
  'gamma-poisson': {
    blurb: 'Model count data with a Gamma prior and Poisson likelihood.',
    tryThis: 'Raise exposure and watch the posterior tighten around the observed rate.',
    chips: ['Gamma prior', 'Poisson counts', 'Shape–rate'],
  },
  'normal-normal': {
    blurb: 'Update a mean with known variance using precision weights.',
    tryThis: 'Shrink the prior SD. The posterior mean leans toward μ₀ even when n is moderate.',
    chips: ['Normal prior', 'Known σ', 'Precision'],
  },
  'conjugate-priors': {
    blurb: 'Explore common conjugate prior–likelihood pairs.',
    tryThis: 'Switch pairs. Conjugacy is a convenience, not the definition of Bayes.',
    chips: ['Closed form', 'Families', 'MCMC when needed'],
  },
  'map-vs-mle': {
    blurb: 'Compare the posterior mode with the likelihood maximum.',
    tryThis: 'Weaken the prior or grow n. MAP slides toward the MLE.',
    chips: ['MAP', 'MLE', 'Regularization'],
  },
  'credible-intervals': {
    blurb: 'Read an interval of posterior mass and say what it means.',
    tryThis: 'Compare a 95% equal-tailed interval with the HPD on a skewed Beta.',
    chips: ['Equal-tailed', 'HPD', 'Posterior mass'],
  },
  'bayesian-prediction': {
    blurb: 'Predict a new observation while carrying parameter uncertainty.',
    tryThis: 'Simulate 1, then 1,000 future datasets: draw θ from the posterior, then x | θ.',
    chips: ['Posterior', 'Posterior predictive', 'New data'],
  },
  'bayesian-vs-frequentist': {
    blurb: 'Compare Bayesian and frequentist readings of the same proportion.',
    tryThis: 'Keep p̂ fixed. A credible interval talks about θ; a CI talks about the procedure.',
    chips: ['Interpretation', 'Same data', 'Different claims'],
  },
  'mcmc-intuition': {
    blurb: 'Walk a Metropolis–Hastings chain on a posterior you cannot integrate.',
    tryThis: 'Use a tiny step, then a huge step. Acceptance rate and mixing both change.',
    chips: ['Proposal', 'Accept / reject', 'Trace'],
  },
}

export const CREDIBLE_LEVELS: CredibleLevel[] = [0.5, 0.8, 0.9, 0.95, 0.99]

export const BETA_PRESETS = {
  uniform: { label: 'Uniform Beta(1, 1)', alpha: 1, beta: 1 },
  uShaped: { label: 'U-shaped Beta(0.5, 0.5)', alpha: 0.5, beta: 0.5 },
  weak: { label: 'Weak Beta(2, 2)', alpha: 2, beta: 2 },
  strong: { label: 'Strong Beta(20, 20)', alpha: 20, beta: 20 },
  optimistic: { label: 'Optimistic Beta(8, 2)', alpha: 8, beta: 2 },
  pessimistic: { label: 'Pessimistic Beta(2, 8)', alpha: 2, beta: 8 },
} as const

export type Rng = () => number

export class SeededRng {
  private state: number

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(min: number, max: number): number {
    if (max < min) return min
    return min + Math.floor(this.next() * (max - min + 1))
  }

  normal(mean = 0, sd = 1): number {
    const u = Math.max(this.next(), Number.EPSILON)
    const v = this.next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}

export function createRng(seed = 20260916): Rng {
  const rng = new SeededRng(seed)
  return () => rng.next()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatNum(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(digits)).toString()
}

export function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNum(value * 100, digits)}%`
}

export function linspace(min: number, max: number, count: number): number[] {
  if (count <= 1) return [min]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => min + i * step)
}

export function trapz(xs: number[], ys: number[]): number {
  let sum = 0
  for (let i = 1; i < xs.length; i++) {
    sum += 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1])
  }
  return sum
}

export function logSumExp(values: number[]): number {
  const m = Math.max(...values)
  if (!Number.isFinite(m)) return Number.NEGATIVE_INFINITY
  return m + Math.log(values.reduce((sum, value) => sum + Math.exp(value - m), 0))
}

function safeLog(value: number): number {
  if (value <= 0) return LOG_ZERO
  return Math.log(value)
}

export function logBetaPdf(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1 || alpha <= 0 || beta <= 0) return LOG_ZERO
  return (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta(alpha, beta)
}

export function betaPdf(x: number, alpha: number, beta: number): number {
  const logp = logBetaPdf(x, alpha, beta)
  return logp <= LOG_ZERO / 2 ? 0 : Math.exp(logp)
}

export function betaMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta)
}

export function betaVariance(alpha: number, beta: number): number {
  const s = alpha + beta
  return (alpha * beta) / (s * s * (s + 1))
}

/** Posterior mode. Interior only when α>1 and β>1; otherwise a boundary. Flat Beta(1,1) has no unique mode. */
export function betaMap(alpha: number, beta: number): number {
  if (alpha <= 0 || beta <= 0) return Number.NaN
  if (alpha > 1 && beta > 1) return (alpha - 1) / (alpha + beta - 2)
  if (alpha === 1 && beta === 1) return Number.NaN
  if (alpha <= 1 && beta > 1) return 0
  if (beta <= 1 && alpha > 1) return 1
  return Number.NaN
}

export function betaMedian(alpha: number, beta: number): number {
  return jStat.beta.inv(0.5, alpha, beta)
}

export function betaQuantile(p: number, alpha: number, beta: number): number {
  return jStat.beta.inv(clamp(p, BAYES_EPS, 1 - BAYES_EPS), alpha, beta)
}

export function betaCdf(x: number, alpha: number, beta: number): number {
  return jStat.beta.cdf(clamp(x, 0, 1), alpha, beta)
}

export function summarizeBeta(alpha: number, beta: number): PosteriorSummary {
  const variance = betaVariance(alpha, beta)
  return {
    mean: betaMean(alpha, beta),
    median: betaMedian(alpha, beta),
    map: betaMap(alpha, beta),
    variance,
    sd: Math.sqrt(variance),
  }
}

export function updateBetaBinomial(alpha: number, beta: number, successes: number, trials: number) {
  const x = clamp(successes, 0, trials)
  return { alpha: alpha + x, beta: beta + (trials - x), successes: x, trials }
}

export function logBinomialLikelihood(p: number, trials: number, successes: number): number {
  if (p <= 0 || p >= 1) {
    if (p === 0) return successes === 0 ? 0 : LOG_ZERO
    if (p === 1) return successes === trials ? 0 : LOG_ZERO
    return LOG_ZERO
  }
  return (
    logGamma(trials + 1) -
    logGamma(successes + 1) -
    logGamma(trials - successes + 1) +
    successes * Math.log(p) +
    (trials - successes) * Math.log(1 - p)
  )
}

export function binomialLikelihood(p: number, trials: number, successes: number): number {
  const logp = logBinomialLikelihood(p, trials, successes)
  return logp <= LOG_ZERO / 2 ? 0 : Math.exp(logp)
}

export function binomialMle(successes: number, trials: number): number {
  if (trials <= 0) return Number.NaN
  return clamp(successes / trials, 0, 1)
}

/**
 * MAP for a Beta(α, β) prior and Binomial(n, k) likelihood.
 * Interior formula (α+x−1)/(α+β+n−2) only when the posterior is unimodal inside (0,1).
 */
export function binomialMap(alpha: number, beta: number, successes: number, trials: number): number {
  const post = updateBetaBinomial(alpha, beta, successes, trials)
  return betaMap(post.alpha, post.beta)
}

/** Shape–rate Gamma log-density. mean = α/β. */
export function logGammaPdfRate(x: number, shape: number, rate: number): number {
  if (x <= 0 || shape <= 0 || rate <= 0) return LOG_ZERO
  return shape * Math.log(rate) - logGamma(shape) + (shape - 1) * Math.log(x) + -rate * x
}

export function gammaPdfRate(x: number, shape: number, rate: number): number {
  const logp = logGammaPdfRate(x, shape, rate)
  return logp <= LOG_ZERO / 2 ? 0 : Math.exp(logp)
}

export function gammaMeanRate(shape: number, rate: number): number {
  return shape / rate
}

export function gammaVarianceRate(shape: number, rate: number): number {
  return shape / (rate * rate)
}

export function gammaMapRate(shape: number, rate: number): number {
  if (shape < 1) return 0
  return (shape - 1) / rate
}

export function gammaQuantileRate(p: number, shape: number, rate: number): number {
  return jStat.gamma.inv(clamp(p, BAYES_EPS, 1 - BAYES_EPS), shape, 1 / rate)
}

export function gammaCdfRate(x: number, shape: number, rate: number): number {
  return jStat.gamma.cdf(Math.max(0, x), shape, 1 / rate)
}

export function summarizeGammaRate(shape: number, rate: number): PosteriorSummary {
  const variance = gammaVarianceRate(shape, rate)
  return {
    mean: gammaMeanRate(shape, rate),
    median: gammaQuantileRate(0.5, shape, rate),
    map: gammaMapRate(shape, rate),
    variance,
    sd: Math.sqrt(variance),
  }
}

export function updateGammaPoisson(shape: number, rate: number, count: number, exposure = 1) {
  return { shape: shape + count, rate: rate + exposure, count, exposure }
}

export function logPoissonLikelihood(lambda: number, count: number, exposure = 1): number {
  const mean = lambda * exposure
  if (mean <= 0) return count === 0 ? 0 : LOG_ZERO
  return count * Math.log(mean) - mean - logGamma(count + 1)
}

export function poissonMle(count: number, exposure = 1): number {
  if (exposure <= 0) return Number.NaN
  return count / exposure
}

export function poissonMap(shape: number, rate: number, count: number, exposure = 1): number {
  const post = updateGammaPoisson(shape, rate, count, exposure)
  return gammaMapRate(post.shape, post.rate)
}

export function logNormalPdf(x: number, mean: number, sd: number): number {
  if (sd <= 0) return LOG_ZERO
  const z = (x - mean) / sd
  return -0.5 * Math.log(2 * Math.PI) - Math.log(sd) - 0.5 * z * z
}

export function normalPdf(x: number, mean: number, sd: number): number {
  return jStat.normal.pdf(x, mean, sd)
}

export function normalQuantile(p: number, mean: number, sd: number): number {
  return jStat.normal.inv(clamp(p, BAYES_EPS, 1 - BAYES_EPS), mean, sd)
}

export function summarizeNormal(mean: number, sd: number): PosteriorSummary {
  return { mean, median: mean, map: mean, variance: sd * sd, sd }
}

/** Known-σ Normal–Normal update. Prior μ ~ N(μ0, τ0²). Precision λ = 1/variance. */
export function updateNormalNormal(mu0: number, tau0: number, xbar: number, n: number, sigma: number) {
  const priorPrec = 1 / (tau0 * tau0)
  const dataPrec = n / (sigma * sigma)
  const postPrec = priorPrec + dataPrec
  const mu = (priorPrec * mu0 + dataPrec * xbar) / postPrec
  const sd = Math.sqrt(1 / postPrec)
  return {
    mu,
    sd,
    priorPrec,
    dataPrec,
    postPrec,
    priorWeight: priorPrec / postPrec,
    dataWeight: dataPrec / postPrec,
  }
}

export function equalTailedInterval(invCdf: (p: number) => number, mass: number): CredibleInterval {
  const alpha = (1 - mass) / 2
  const lo = invCdf(alpha)
  const hi = invCdf(1 - alpha)
  return { lo, hi, mass, kind: 'equal-tailed', width: hi - lo }
}

/** HPD for a unimodal continuous density: shortest interval of the given posterior mass. */
export function hpdInterval(invCdf: (p: number) => number, mass: number, steps = 400): CredibleInterval {
  const tail = 1 - mass
  let bestLo = invCdf(0)
  let bestHi = invCdf(mass)
  let bestWidth = bestHi - bestLo
  for (let i = 0; i <= steps; i++) {
    const a = (tail * i) / steps
    const lo = invCdf(a)
    const hi = invCdf(a + mass)
    const width = hi - lo
    if (width < bestWidth) {
      bestWidth = width
      bestLo = lo
      bestHi = hi
    }
  }
  return { lo: bestLo, hi: bestHi, mass, kind: 'hpd', width: bestWidth }
}

export function betaInterval(alpha: number, beta: number, mass: number, kind: IntervalKind): CredibleInterval {
  const inv = (p: number) => betaQuantile(p, alpha, beta)
  return kind === 'hpd' ? hpdInterval(inv, mass) : equalTailedInterval(inv, mass)
}

export function gammaInterval(shape: number, rate: number, mass: number, kind: IntervalKind): CredibleInterval {
  const inv = (p: number) => gammaQuantileRate(p, shape, rate)
  return kind === 'hpd' ? hpdInterval(inv, mass) : equalTailedInterval(inv, mass)
}

export function normalInterval(mean: number, sd: number, mass: number, kind: IntervalKind): CredibleInterval {
  const inv = (p: number) => normalQuantile(p, mean, sd)
  return kind === 'hpd' ? hpdInterval(inv, mass) : equalTailedInterval(inv, mass)
}

export function curveFromLog(
  xs: number[],
  logY: (x: number) => number,
  normalize = true,
): DensityPoint[] {
  const logs = xs.map(logY)
  const maxLog = Math.max(...logs)
  const raw = logs.map((value) => (value <= LOG_ZERO / 2 ? 0 : Math.exp(value - maxLog)))
  if (!normalize) return xs.map((x, i) => ({ x, y: raw[i] }))
  const z = trapz(xs, raw) || 1
  return xs.map((x, i) => ({ x, y: raw[i] / z }))
}

export function multiplyLogCurves(xs: number[], logA: (x: number) => number, logB: (x: number) => number): DensityPoint[] {
  return curveFromLog(xs, (x) => logA(x) + logB(x), true)
}

export function histogram(values: number[], bins = 24, min?: number, max?: number): Array<{ x0: number; x1: number; mid: number; count: number }> {
  if (values.length === 0) return []
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const span = hi - lo || 1
  const width = span / bins
  const counts = Array.from({ length: bins }, (_, i) => ({
    x0: lo + i * width,
    x1: lo + (i + 1) * width,
    mid: lo + (i + 0.5) * width,
    count: 0,
  }))
  for (const value of values) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((value - lo) / width)))
    counts[idx].count += 1
  }
  return counts
}

function gammaSampleRate(shape: number, rate: number, rng: SeededRng): number {
  const scale = 1 / rate
  if (shape < 1) {
    const u = Math.max(rng.next(), Number.EPSILON)
    return gammaSampleRate(shape + 1, rate, rng) * u ** (1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x = rng.normal()
    let v = 1 + c * x
    if (v <= 0) continue
    v = v * v * v
    const u = rng.next()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale
  }
}

export function sampleBeta(alpha: number, beta: number, rng: SeededRng): number {
  const a = gammaSampleRate(alpha, 1, rng)
  const b = gammaSampleRate(beta, 1, rng)
  return a / (a + b)
}

export function sampleGammaRate(shape: number, rate: number, rng: SeededRng): number {
  return gammaSampleRate(shape, rate, rng)
}

export function samplePoisson(lambda: number, rng: SeededRng): number {
  if (lambda <= 0) return 0
  if (lambda < 30) {
    const limit = Math.exp(-lambda)
    let k = 0
    let p = 1
    do {
      k += 1
      p *= rng.next()
    } while (p > limit)
    return k - 1
  }
  const c = 0.767 - 3.36 / lambda
  const beta = Math.PI / Math.sqrt(3 * lambda)
  const alpha = beta * lambda
  const k = Math.log(c) - lambda - Math.log(beta)
  for (;;) {
    const u = rng.next()
    const x = (alpha - Math.log((1 - u) / u)) / beta
    const n = Math.floor(x + 0.5)
    if (n < 0) continue
    const v = rng.next()
    const y = alpha - beta * x
    if (y + Math.log(v / (1 + Math.exp(y)) ** 2) <= k + n * Math.log(lambda) - logGamma(n + 1)) return n
  }
}

export function sampleBinomial(trials: number, p: number, rng: SeededRng): number {
  let k = 0
  for (let i = 0; i < trials; i++) if (rng.next() < p) k += 1
  return k
}

/** Draw θ from the posterior, then x_new | θ. This is the posterior predictive, not a parameter histogram. */
export function posteriorPredictiveBinomial(alpha: number, beta: number, nNew: number, draws: number, rng: SeededRng): number[] {
  return Array.from({ length: draws }, () => sampleBinomial(nNew, sampleBeta(alpha, beta, rng), rng))
}

export function posteriorPredictivePoisson(shape: number, rate: number, exposure: number, draws: number, rng: SeededRng): number[] {
  return Array.from({ length: draws }, () => samplePoisson(sampleGammaRate(shape, rate, rng) * exposure, rng))
}

export function posteriorPredictiveNormal(mu: number, tau: number, sigma: number, draws: number, rng: SeededRng): number[] {
  return Array.from({ length: draws }, () => {
    const theta = rng.normal(mu, tau)
    return rng.normal(theta, sigma)
  })
}

export function betaBinomialPredictivePmf(alpha: number, beta: number, nNew: number): DensityPoint[] {
  return Array.from({ length: nNew + 1 }, (_, k) => ({
    x: k,
    y: Math.exp(
      logGamma(nNew + 1) -
        logGamma(k + 1) -
        logGamma(nNew - k + 1) +
        logBeta(alpha + k, beta + nNew - k) -
        logBeta(alpha, beta),
    ),
  }))
}

export type MhStep = {
  current: number
  proposed: number
  accepted: boolean
  logTargetCurrent: number
  logTargetProposed: number
  logAlpha: number
}

export type MhRun = {
  samples: number[]
  trace: number[]
  accepted: number
  rejected: number
  acceptanceRate: number
  steps: MhStep[]
}

export function metropolisHastingsStep(current: number, logTarget: (x: number) => number, step: number, rng: SeededRng): MhStep {
  const proposed = current + rng.normal(0, step)
  const logTargetCurrent = logTarget(current)
  const logTargetProposed = logTarget(proposed)
  const logAlpha = logTargetProposed - logTargetCurrent
  const accepted = Math.log(Math.max(rng.next(), Number.EPSILON)) < logAlpha
  return { current, proposed, accepted, logTargetCurrent, logTargetProposed, logAlpha }
}

export function runMetropolisHastings(args: {
  logTarget: (x: number) => number
  start: number
  step: number
  draws: number
  rng: SeededRng
  burn?: number
  recordSteps?: boolean
}): MhRun {
  const burn = args.burn ?? 0
  let current = args.start
  let accepted = 0
  let rejected = 0
  const samples: number[] = []
  const trace: number[] = []
  const steps: MhStep[] = []
  const total = args.draws + burn
  for (let i = 0; i < total; i++) {
    const step = metropolisHastingsStep(current, args.logTarget, args.step, args.rng)
    if (args.recordSteps && i < 400) steps.push(step)
    if (step.accepted) {
      current = step.proposed
      accepted += 1
    } else {
      rejected += 1
    }
    if (i >= burn) {
      samples.push(current)
      trace.push(current)
    }
  }
  return {
    samples,
    trace,
    accepted,
    rejected,
    acceptanceRate: accepted / Math.max(1, accepted + rejected),
    steps,
  }
}

export function frequentistWaldInterval(successes: number, trials: number, mass: number): { lo: number; hi: number; phat: number; se: number } {
  const phat = binomialMle(successes, trials)
  const z = normalQuantile((1 + mass) / 2, 0, 1)
  const se = Math.sqrt((phat * (1 - phat)) / Math.max(trials, 1))
  return { lo: clamp(phat - z * se, 0, 1), hi: clamp(phat + z * se, 0, 1), phat, se }
}

export class BayesianEngine {
  readonly rng: SeededRng

  constructor(seed = 20260916) {
    this.rng = new SeededRng(seed)
  }

  logPrior(x: number, logDensity: (value: number) => number): number {
    return logDensity(x)
  }

  logLikelihood(x: number, logLike: (value: number) => number): number {
    return logLike(x)
  }

  logPosterior(x: number, logPriorFn: (value: number) => number, logLikeFn: (value: number) => number): number {
    return logPriorFn(x) + logLikeFn(x)
  }

  posteriorCurve(xs: number[], logPriorFn: (value: number) => number, logLikeFn: (value: number) => number): DensityPoint[] {
    return multiplyLogCurves(xs, logPriorFn, logLikeFn)
  }

  updateBetaBinomial(alpha: number, beta: number, successes: number, trials: number) {
    return updateBetaBinomial(alpha, beta, successes, trials)
  }

  updateGammaPoisson(shape: number, rate: number, count: number, exposure = 1) {
    return updateGammaPoisson(shape, rate, count, exposure)
  }

  updateNormalNormal(mu0: number, tau0: number, xbar: number, n: number, sigma: number) {
    return updateNormalNormal(mu0, tau0, xbar, n, sigma)
  }

  summarizeBeta(alpha: number, beta: number): PosteriorSummary {
    return summarizeBeta(alpha, beta)
  }

  summarizeGamma(shape: number, rate: number): PosteriorSummary {
    return summarizeGammaRate(shape, rate)
  }

  summarizeNormal(mean: number, sd: number): PosteriorSummary {
    return summarizeNormal(mean, sd)
  }

  intervalBeta(alpha: number, beta: number, mass: number, kind: IntervalKind = 'equal-tailed'): CredibleInterval {
    return betaInterval(alpha, beta, mass, kind)
  }

  intervalGamma(shape: number, rate: number, mass: number, kind: IntervalKind = 'equal-tailed'): CredibleInterval {
    return gammaInterval(shape, rate, mass, kind)
  }

  predictBinomial(alpha: number, beta: number, nNew: number, draws: number): number[] {
    return posteriorPredictiveBinomial(alpha, beta, nNew, draws, this.rng)
  }

  predictPoisson(shape: number, rate: number, exposure: number, draws: number): number[] {
    return posteriorPredictivePoisson(shape, rate, exposure, draws, this.rng)
  }

  mapVsMle(alpha: number, beta: number, successes: number, trials: number) {
    return {
      mle: binomialMle(successes, trials),
      map: binomialMap(alpha, beta, successes, trials),
      posterior: updateBetaBinomial(alpha, beta, successes, trials),
    }
  }

  metropolis(logTarget: (x: number) => number, start: number, step: number, draws: number, burn = 0): MhRun {
    return runMetropolisHastings({ logTarget, start, step, draws, rng: this.rng, burn, recordSteps: true })
  }
}

export function bayesStudioPath(): string {
  return studioPath(BAYES_STUDIO)
}

export function bayesLabPath(slug: string): string {
  return labPath(BAYES_STUDIO_SLUG, slug)
}

export function bayesNextStudioPath(): string {
  return studioPath(BAYES_NEXT_STUDIO)
}

export function loadBayesProgress(): BayesProgress {
  try {
    const raw = localStorage.getItem(BAYES_PROGRESS_KEY)
    if (!raw) return { completed: [] }
    const parsed = JSON.parse(raw) as BayesProgress
    return { completed: Array.isArray(parsed.completed) ? parsed.completed.filter((item) => typeof item === 'string') : [] }
  } catch {
    return { completed: [] }
  }
}

export function markBayesLabComplete(slug: string): void {
  const progress = loadBayesProgress()
  if (progress.completed.includes(slug)) return
  progress.completed.push(slug)
  localStorage.setItem(BAYES_PROGRESS_KEY, JSON.stringify(progress))
}

export function nextIncompleteBayesLab(completed: string[]) {
  return BAYES_STUDIO.labs.find((lab) => !completed.includes(lab.slug)) ?? BAYES_STUDIO.labs[0]
}
