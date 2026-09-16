import { describe, expect, it } from 'vitest'
import {
  BayesianEngine,
  BAYES_STUDIO,
  BAYES_STUDIO_SLUG,
  GAMMA_PARAMETERIZATION,
  SeededRng,
  betaInterval,
  betaMap,
  betaMean,
  betaPdf,
  betaVariance,
  binomialMap,
  binomialMle,
  curveFromLog,
  equalTailedInterval,
  frequentistWaldInterval,
  gammaMapRate,
  gammaMeanRate,
  gammaPdfRate,
  gammaVarianceRate,
  hpdInterval,
  logBetaPdf,
  logBinomialLikelihood,
  logGammaPdfRate,
  metropolisHastingsStep,
  multiplyLogCurves,
  posteriorPredictiveBinomial,
  posteriorPredictivePoisson,
  runMetropolisHastings,
  sampleBeta,
  summarizeBeta,
  updateBetaBinomial,
  updateGammaPoisson,
  updateNormalNormal,
} from './bayesianStatistics'

describe('Bayesian Statistics studio catalog', () => {
  it('uses the canonical studio slug and ten labs', () => {
    expect(BAYES_STUDIO_SLUG).toBe('bayesian-statistics')
    expect(BAYES_STUDIO.labs.map((lab) => lab.slug)).toEqual([
      'bayesian-foundations',
      'beta-binomial',
      'gamma-poisson',
      'normal-normal',
      'conjugate-priors',
      'map-vs-mle',
      'credible-intervals',
      'bayesian-prediction',
      'bayesian-vs-frequentist',
      'mcmc-intuition',
    ])
  })

  it('documents Gamma as shape-rate', () => {
    expect(GAMMA_PARAMETERIZATION).toBe('shape-rate')
  })
})

describe('seeded RNG', () => {
  it('is deterministic', () => {
    const a = new SeededRng(42)
    const b = new SeededRng(42)
    expect([a.next(), a.next(), a.normal(0, 1)]).toEqual([b.next(), b.next(), b.normal(0, 1)])
  })
})

describe('Beta–Binomial conjugacy', () => {
  it('updates Beta(α, β) to Beta(α+x, β+n−x)', () => {
    expect(updateBetaBinomial(2, 2, 14, 20)).toEqual({ alpha: 16, beta: 8, successes: 14, trials: 20 })
  })

  it('matches closed-form mean and variance', () => {
    const alpha = 16
    const beta = 8
    expect(betaMean(alpha, beta)).toBeCloseTo(16 / 24, 12)
    expect(betaVariance(alpha, beta)).toBeCloseTo((16 * 8) / (24 * 24 * 25), 12)
    expect(summarizeBeta(alpha, beta).sd).toBeCloseTo(Math.sqrt(betaVariance(alpha, beta)), 12)
  })

  it('uses the interior MAP only when the posterior is unimodal inside (0, 1)', () => {
    expect(betaMap(16, 8)).toBeCloseTo(15 / 22, 12)
    expect(binomialMap(2, 2, 14, 20)).toBeCloseTo((2 + 14 - 1) / (2 + 2 + 20 - 2), 12)
    expect(betaMap(1, 1)).toBeNaN()
    expect(betaMap(0.5, 3)).toBe(0)
    expect(betaMap(4, 0.4)).toBe(1)
    expect(binomialMle(14, 20)).toBeCloseTo(0.7, 12)
  })

  it('keeps log-space Beta and binomial likelihood finite on (0, 1)', () => {
    expect(logBetaPdf(0.5, 2, 2)).toBeGreaterThan(-20)
    expect(betaPdf(0.5, 2, 2)).toBeCloseTo(1.5, 8)
    expect(logBinomialLikelihood(0.7, 20, 14)).toBeGreaterThan(logBinomialLikelihood(0.2, 20, 14))
  })
})

describe('Gamma–Poisson conjugacy (shape-rate)', () => {
  it('updates Gamma(α, β) to Gamma(α+x, β+t)', () => {
    expect(updateGammaPoisson(2, 1, 5, 3)).toEqual({ shape: 7, rate: 4, count: 5, exposure: 3 })
    expect(gammaMeanRate(7, 4)).toBeCloseTo(1.75, 12)
    expect(gammaVarianceRate(7, 4)).toBeCloseTo(7 / 16, 12)
    expect(gammaMapRate(7, 4)).toBeCloseTo(6 / 4, 12)
  })

  it('evaluates the shape-rate density', () => {
    const x = 1.2
    const shape = 3
    const rate = 2
    const pdf = gammaPdfRate(x, shape, rate)
    expect(pdf).toBeGreaterThan(0)
    expect(logGammaPdfRate(x, shape, rate)).toBeCloseTo(Math.log(pdf), 8)
  })
})

describe('Normal–Normal precision weighting', () => {
  it('blends prior and data by precision', () => {
    const post = updateNormalNormal(0, 2, 4, 9, 3)
    const priorPrec = 1 / 4
    const dataPrec = 9 / 9
    expect(post.priorPrec).toBeCloseTo(priorPrec, 12)
    expect(post.dataPrec).toBeCloseTo(dataPrec, 12)
    expect(post.mu).toBeCloseTo((priorPrec * 0 + dataPrec * 4) / (priorPrec + dataPrec), 12)
    expect(post.dataWeight + post.priorWeight).toBeCloseTo(1, 12)
  })
})

describe('posterior from prior × likelihood', () => {
  it('normalizes log-space products to a density', () => {
    const xs = Array.from({ length: 201 }, (_, i) => i / 200)
    const prior = (p: number) => logBetaPdf(p, 2, 2)
    const like = (p: number) => logBinomialLikelihood(p, 20, 14)
    const post = multiplyLogCurves(xs, prior, like)
    const area = post.slice(1).reduce((sum, point, i) => sum + 0.5 * (point.y + post[i].y) * (point.x - post[i].x), 0)
    expect(area).toBeCloseTo(1, 2)
    const closed = updateBetaBinomial(2, 2, 14, 20)
    const peak = post.reduce((best, point) => (point.y > best.y ? point : best))
    expect(peak.x).toBeCloseTo(betaMap(closed.alpha, closed.beta), 1)
  })

  it('can rebuild a normalized prior curve', () => {
    const xs = Array.from({ length: 101 }, (_, i) => i / 100)
    const curve = curveFromLog(xs, (x) => logBetaPdf(x, 3, 5))
    const area = curve.slice(1).reduce((sum, point, i) => sum + 0.5 * (point.y + curve[i].y) * (point.x - curve[i].x), 0)
    expect(area).toBeCloseTo(1, 2)
  })
})

describe('credible intervals', () => {
  it('returns a 95% equal-tailed Beta interval inside (0, 1)', () => {
    const interval = betaInterval(16, 8, 0.95, 'equal-tailed')
    expect(interval.kind).toBe('equal-tailed')
    expect(interval.lo).toBeGreaterThan(0)
    expect(interval.hi).toBeLessThan(1)
    expect(interval.lo).toBeLessThan(betaMean(16, 8))
    expect(interval.hi).toBeGreaterThan(betaMean(16, 8))
  })

  it('makes the HPD no wider than the equal-tailed interval on a skewed Beta', () => {
    const eq = betaInterval(2, 10, 0.9, 'equal-tailed')
    const hpd = betaInterval(2, 10, 0.9, 'hpd')
    expect(hpd.width).toBeLessThanOrEqual(eq.width + 1e-6)
    expect(hpd.kind).toBe('hpd')
  })

  it('finds a shortest interval from an inverse CDF', () => {
    const inv = (p: number) => p
    const eq = equalTailedInterval(inv, 0.5)
    const hpd = hpdInterval(inv, 0.5)
    expect(eq.width).toBeCloseTo(0.5, 8)
    expect(hpd.width).toBeCloseTo(0.5, 8)
  })
})

describe('posterior predictive', () => {
  it('draws θ from the posterior and then x | θ', () => {
    const rng = new SeededRng(9)
    const draws = posteriorPredictiveBinomial(16, 8, 20, 400, rng)
    expect(draws).toHaveLength(400)
    expect(draws.every((value) => value >= 0 && value <= 20)).toBe(true)
    const mean = draws.reduce((sum, value) => sum + value, 0) / draws.length
    const expected = 20 * betaMean(16, 8)
    expect(mean).toBeGreaterThan(expected - 2)
    expect(mean).toBeLessThan(expected + 2)
  })

  it('predicts Poisson counts from a Gamma posterior, not from λ samples alone', () => {
    const rng = new SeededRng(5)
    const counts = posteriorPredictivePoisson(8, 2, 1, 300, rng)
    expect(counts.every((value) => Number.isInteger(value) && value >= 0)).toBe(true)
    const mean = counts.reduce((sum, value) => sum + value, 0) / counts.length
    expect(mean).toBeGreaterThan(2)
    expect(mean).toBeLessThan(6)
  })

  it('samples a Beta that stays in (0, 1)', () => {
    const rng = new SeededRng(3)
    const values = Array.from({ length: 80 }, () => sampleBeta(4, 6, rng))
    expect(values.every((value) => value > 0 && value < 1)).toBe(true)
  })
})

describe('MAP versus MLE', () => {
  it('lets a weak prior and lots of data pull MAP toward the MLE', () => {
    const weak = binomialMap(1.2, 1.2, 70, 100)
    const mle = binomialMle(70, 100)
    expect(Math.abs(weak - mle)).toBeLessThan(0.02)
  })

  it('lets a strong prior and little data keep MAP away from the MLE', () => {
    const map = binomialMap(20, 20, 8, 10)
    const mle = binomialMle(8, 10)
    expect(Math.abs(map - mle)).toBeGreaterThan(0.1)
  })
})

describe('Metropolis–Hastings', () => {
  it('accepts an uphill proposal and can reject a downhill one', () => {
    const logTarget = (x: number) => -0.5 * x * x
    const up = metropolisHastingsStep(2, logTarget, 0.0001, new SeededRng(1))
    expect(Number.isFinite(up.logAlpha)).toBe(true)
    const run = runMetropolisHastings({
      logTarget,
      start: 0,
      step: 0.8,
      draws: 800,
      rng: new SeededRng(11),
      burn: 80,
    })
    expect(run.samples).toHaveLength(800)
    expect(run.accepted + run.rejected).toBe(880)
    expect(run.acceptanceRate).toBeGreaterThan(0.1)
    expect(run.acceptanceRate).toBeLessThan(0.95)
    const mean = run.samples.reduce((sum, value) => sum + value, 0) / run.samples.length
    expect(Math.abs(mean)).toBeLessThan(0.25)
  })
})

describe('BayesianEngine facade', () => {
  it('exposes conjugate updates, summaries, prediction, and MH', () => {
    const engine = new BayesianEngine(17)
    const beta = engine.updateBetaBinomial(2, 5, 6, 10)
    expect(beta.alpha).toBe(8)
    expect(engine.summarizeBeta(8, 9).mean).toBeCloseTo(8 / 17, 12)
    expect(engine.intervalBeta(8, 9, 0.8).width).toBeGreaterThan(0)
    const preds = engine.predictBinomial(8, 9, 12, 40)
    expect(preds).toHaveLength(40)
    const mh = engine.metropolis((x) => logBetaPdf(x, 3, 5), 0.4, 0.08, 200, 20)
    expect(mh.samples.every((value) => value > 0 && value < 1)).toBe(true)
    const cmp = engine.mapVsMle(2, 2, 7, 10)
    expect(cmp.mle).toBe(0.7)
    expect(cmp.map).toBeCloseTo(binomialMap(2, 2, 7, 10), 12)
  })
})

describe('frequentist companion interval', () => {
  it('centers a Wald interval on the MLE', () => {
    const wald = frequentistWaldInterval(14, 20, 0.95)
    expect(wald.phat).toBeCloseTo(0.7, 12)
    expect(wald.lo).toBeLessThan(0.7)
    expect(wald.hi).toBeGreaterThan(0.7)
  })
})
