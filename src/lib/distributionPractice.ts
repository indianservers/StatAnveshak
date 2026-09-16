import type { DistributionId } from './distributions'

export type PracticeProblem = {
  id: string
  prompt: string
  answer: string
  steps: string[]
}

const P = (id: string, prompt: string, answer: string, steps: string[]): PracticeProblem => ({
  id,
  prompt,
  answer,
  steps,
})

export const DISTRIBUTION_PRACTICE: Record<DistributionId, PracticeProblem[]> = {
  bernoulli: [
    P('bernoulli-01', 'A café steam wand is graded Pass or Fail after one morning check. Historically 35% of checks pass. Let X = 1 for Pass and X = 0 for Fail. Find P(X = 1).', '0.35', [
      'Identify the model: one yes/no check is X ~ Bernoulli(p = 0.35).',
      'Bernoulli PMF: P(X = 1) = p and P(X = 0) = 1 − p.',
      'Substitute p = 0.35: P(X = 1) = 0.35.',
      'Final answer: 0.35.',
    ]),
    P('bernoulli-02', 'Using the same steam-wand check with p = 0.35, find P(X = 0), the probability the wand fails the morning check.', '0.65', [
      'Identify X ~ Bernoulli(p = 0.35).',
      'Use P(X = 0) = 1 − p.',
      '1 − 0.35 = 0.65.',
      'Final answer: 0.65.',
    ]),
    P('bernoulli-03', 'For that Bernoulli(0.35) check, what is E[X], the long-run pass rate?', '0.35', [
      'Identify X ~ Bernoulli(p = 0.35).',
      'Mean formula: E[X] = p.',
      'E[X] = 0.35.',
      'Final answer: 0.35.',
    ]),
    P('bernoulli-04', 'For the Bernoulli(0.35) steam-wand check, compute Var(X).', '0.2275', [
      'Identify X ~ Bernoulli(p = 0.35).',
      'Variance formula: Var(X) = p(1 − p).',
      '0.35 × 0.65 = 0.2275.',
      'Final answer: 0.2275.',
    ]),
    P('bernoulli-05', 'A night-shift lock sensor reports “armed” with probability 0.82 on a single trial. Find P(armed) if X ~ Bernoulli(0.82) and armed means X = 1.', '0.82', [
      'Identify X ~ Bernoulli(p = 0.82).',
      'P(X = 1) = p.',
      'Substitute p = 0.82.',
      'Final answer: 0.82.',
    ]),
  ],

  binomial: [
    P('binomial-01', 'Twelve independent weekend stalls each have a 25% chance of selling out of mango pickle. Let X be the number that sell out. Find P(X = 3).', '0.2581', [
      'Identify X ~ Binomial(n = 12, p = 0.25).',
      'PMF: P(X = k) = C(n, k) p^k (1 − p)^{n−k}.',
      'P(X = 3) = C(12, 3) (0.25)^3 (0.75)^9.',
      'C(12, 3) = 220, (0.25)^3 = 0.015625, (0.75)^9 ≈ 0.0750847, so 220 × 0.015625 × 0.0750847 ≈ 0.2581.',
      'Final answer: 0.2581.',
    ]),
    P('binomial-02', 'For those 12 stalls with p = 0.25, find P(X ≤ 2).', '0.3907', [
      'Identify X ~ Binomial(n = 12, p = 0.25).',
      'Left-tail: P(X ≤ 2) = P(0) + P(1) + P(2) using the binomial PMF.',
      'Equivalently evaluate the catalog CDF F(2).',
      'F(2) = 0.3907.',
      'Final answer: 0.3907.',
    ]),
    P('binomial-03', 'For the same 12 stalls, find P(X ≥ 4).', '0.3512', [
      'Identify X ~ Binomial(n = 12, p = 0.25).',
      'Right-tail: P(X ≥ 4) = 1 − P(X ≤ 3) = 1 − F(3).',
      'F(3) ≈ 0.6488, so 1 − 0.6488 = 0.3512.',
      'Final answer: 0.3512.',
    ]),
    P('binomial-04', 'For X ~ Binomial(12, 0.25), find E[X] and Var(X). Report the variance.', '2.25', [
      'Identify X ~ Binomial(n = 12, p = 0.25).',
      'E[X] = np = 12 × 0.25 = 3.',
      'Var(X) = np(1 − p) = 12 × 0.25 × 0.75 = 2.25.',
      'Final answer: 2.25.',
    ]),
    P('binomial-05', 'Eight seed packets each germinate independently with probability 1/2. Find P(exactly 4 packets germinate).', '0.2734', [
      'Identify X ~ Binomial(n = 8, p = 0.5).',
      'P(X = 4) = C(8, 4) (0.5)^8.',
      'C(8, 4) = 70 and (0.5)^8 = 1/256, so 70/256 = 0.2734375.',
      'Final answer: 0.2734.',
    ]),
  ],

  geometric: [
    P('geometric-01', 'A kiosk printer jams with probability 0.20 on each independent ticket. Let X be the trial number of the first jam (X starts at 1). Find P(X = 4).', '0.1024', [
      'Identify X ~ Geometric(p = 0.20), trial of first success (jam).',
      'PMF: P(X = k) = (1 − p)^{k−1} p.',
      'P(X = 4) = (0.80)^3 (0.20).',
      '(0.80)^3 = 0.512, then 0.512 × 0.20 = 0.1024.',
      'Final answer: 0.1024.',
    ]),
    P('geometric-02', 'With the same jam probability 0.20, find P(X ≤ 3).', '0.488', [
      'Identify X ~ Geometric(p = 0.20), support k = 1, 2, ….',
      'CDF: F(k) = 1 − (1 − p)^{floor(k)}.',
      'F(3) = 1 − (0.80)^3 = 1 − 0.512 = 0.488.',
      'Final answer: 0.488.',
    ]),
    P('geometric-03', 'Still with p = 0.20, find P(X ≥ 5) (first jam on trial 5 or later).', '0.4096', [
      'Identify X ~ Geometric(p = 0.20).',
      'P(X ≥ 5) = 1 − P(X ≤ 4) = 1 − F(4).',
      'F(4) = 1 − (0.80)^4 = 1 − 0.4096 = 0.5904.',
      '1 − 0.5904 = 0.4096, which is also (0.80)^4.',
      'Final answer: 0.4096.',
    ]),
    P('geometric-04', 'For X ~ Geometric(p = 0.20) as the trial of first jam, find E[X].', '5', [
      'Identify X ~ Geometric(p = 0.20), first-success trial numbering.',
      'Mean formula: E[X] = 1/p.',
      '1 / 0.20 = 5.',
      'Final answer: 5.',
    ]),
    P('geometric-05', 'A loyalty stamp succeeds on a tap with probability 0.45. Find the probability the first success is on the first tap, P(X = 1).', '0.45', [
      'Identify X ~ Geometric(p = 0.45).',
      'P(X = 1) = (1 − p)^0 p = p.',
      'P(X = 1) = 0.45.',
      'Final answer: 0.45.',
    ]),
  ],

  negative_binomial: [
    P('nb-01', 'A CI pipeline needs 4 green builds. Each independent run is green with probability 0.50. Let X be the number of failed runs before the 4th green. Find P(X = 3).', '0.1563', [
      'Identify X ~ NegativeBinomial(r = 4, p = 0.50), failures before r successes.',
      'PMF: P(X = k) = C(k + r − 1, k) (1 − p)^k p^r.',
      'P(X = 3) = C(6, 3) (0.50)^3 (0.50)^4 = 20 × (0.50)^7.',
      '20 / 128 = 0.15625.',
      'Final answer: 0.1563.',
    ]),
    P('nb-02', 'For the same pipeline (r = 4, p = 0.50), find P(X ≤ 2).', '0.3438', [
      'Identify X ~ NegativeBinomial(r = 4, p = 0.50).',
      'P(X ≤ 2) = P(0) + P(1) + P(2).',
      'P(0) = (0.50)^4 = 0.0625; P(1) = C(4, 1)(0.50)^5 = 0.125; P(2) = C(5, 2)(0.50)^6 = 0.15625.',
      '0.0625 + 0.125 + 0.15625 = 0.34375.',
      'Final answer: 0.3438.',
    ]),
    P('nb-03', 'For X ~ NB(r = 4, p = 0.50) counting failures before 4 greens, find E[X].', '4', [
      'Identify X ~ NegativeBinomial(r = 4, p = 0.50).',
      'Mean of failures-before-r-successes: E[X] = r(1 − p)/p.',
      '4 × 0.50 / 0.50 = 4.',
      'Final answer: 4.',
    ]),
    P('nb-04', 'For that same NB(4, 0.50) failure count, find Var(X).', '8', [
      'Identify X ~ NegativeBinomial(r = 4, p = 0.50).',
      'Var(X) = r(1 − p)/p^2.',
      '4 × 0.50 / 0.25 = 8.',
      'Final answer: 8.',
    ]),
    P('nb-05', 'A bakery needs 3 acceptable loaves. Each loaf is acceptable with probability 0.60. Find P(X = 0): no rejects before the 3rd acceptable loaf.', '0.216', [
      'Identify X ~ NegativeBinomial(r = 3, p = 0.60).',
      'P(X = 0) = p^r = (0.60)^3.',
      '0.60 × 0.60 × 0.60 = 0.216.',
      'Final answer: 0.216.',
    ]),
  ],

  hypergeometric: [
    P('hyp-01', 'A crate holds 40 jars, 12 of them saffron. A cook grabs 8 jars at random without replacement. Let X be the number of saffron jars in the handful. Find P(X = 3).', '0.2811', [
      'Identify X ~ Hypergeometric(N = 40, K = 12, n = 8).',
      'PMF: P(X = k) = C(K, k) C(N − K, n − k) / C(N, n).',
      'P(X = 3) = C(12, 3) C(28, 5) / C(40, 8).',
      'C(12, 3) = 220, C(28, 5) = 98,280, C(40, 8) = 76,904,685, so 220 × 98,280 / 76,904,685 ≈ 0.2811.',
      'Final answer: 0.2811.',
    ]),
    P('hyp-02', 'Using the same crate (N = 40, K = 12, n = 8), find P(X ≤ 1).', '0.2252', [
      'Identify X ~ Hypergeometric(N = 40, K = 12, n = 8).',
      'P(X ≤ 1) = P(0) + P(1) = F(1).',
      'Evaluate the hypergeometric CDF at 1.',
      'F(1) ≈ 0.2252.',
      'Final answer: 0.2252.',
    ]),
    P('hyp-03', 'For that handful of 8 jars, find E[X].', '2.4', [
      'Identify X ~ Hypergeometric(N = 40, K = 12, n = 8).',
      'E[X] = nK/N.',
      '8 × 12 / 40 = 96 / 40 = 2.4.',
      'Final answer: 2.4.',
    ]),
    P('hyp-04', 'For the same hypergeometric draw, find Var(X).', '1.378', [
      'Identify X ~ Hypergeometric(N = 40, K = 12, n = 8).',
      'Var(X) = n(K/N)(1 − K/N)(N − n)/(N − 1).',
      '8 × 0.30 × 0.70 × 32 / 39 = 1.68 × 32 / 39 = 53.76 / 39 = 1.37846…',
      'Final answer: 1.378.',
    ]),
    P('hyp-05', 'A seed box has 20 packets, 6 of them millet. Five packets are drawn without replacement. Find P(exactly 2 millet packets).', '0.3522', [
      'Identify X ~ Hypergeometric(N = 20, K = 6, n = 5).',
      'P(X = 2) = C(6, 2) C(14, 3) / C(20, 5).',
      'C(6, 2) = 15, C(14, 3) = 364, C(20, 5) = 15,504.',
      '15 × 364 / 15,504 = 5,460 / 15,504 ≈ 0.3522.',
      'Final answer: 0.3522.',
    ]),
  ],

  poisson: [
    P('poisson-01', 'A neighborhood feeder gets sparrow visits at rate λ = 3.2 per 10-minute window. Let X be the count in one window. Find P(X = 2).', '0.2087', [
      'Identify X ~ Poisson(λ = 3.2).',
      'PMF: P(X = k) = e^{−λ} λ^k / k!.',
      'P(X = 2) = e^{−3.2} (3.2)^2 / 2.',
      'e^{−3.2} ≈ 0.0407622, (3.2)^2 = 10.24, so 0.0407622 × 10.24 / 2 ≈ 0.2087.',
      'Final answer: 0.2087.',
    ]),
    P('poisson-02', 'For the same feeder (λ = 3.2), find P(X ≤ 1).', '0.1712', [
      'Identify X ~ Poisson(λ = 3.2).',
      'P(X ≤ 1) = P(0) + P(1) = e^{−3.2}(1 + 3.2).',
      'e^{−3.2} ≈ 0.0407622, 1 + 3.2 = 4.2, so 0.0407622 × 4.2 ≈ 0.1712.',
      'Final answer: 0.1712.',
    ]),
    P('poisson-03', 'Still with λ = 3.2 visits per window, find P(X ≥ 5).', '0.2194', [
      'Identify X ~ Poisson(λ = 3.2).',
      'P(X ≥ 5) = 1 − P(X ≤ 4) = 1 − F(4).',
      'The Poisson CDF gives F(4) ≈ 0.7806.',
      '1 − 0.7806 = 0.2194.',
      'Final answer: 0.2194.',
    ]),
    P('poisson-04', 'For X ~ Poisson(3.2), what is E[X]? (Also equal to Var(X).)', '3.2', [
      'Identify X ~ Poisson(λ = 3.2).',
      'For a Poisson count, E[X] = Var(X) = λ.',
      'E[X] = 3.2.',
      'Final answer: 3.2.',
    ]),
    P('poisson-05', 'A quiet helpdesk averages 1.6 tickets per hour. Find the probability of a silent hour, P(X = 0).', '0.2019', [
      'Identify X ~ Poisson(λ = 1.6).',
      'P(X = 0) = e^{−λ} = e^{−1.6}.',
      'e^{−1.6} ≈ 0.2019.',
      'Final answer: 0.2019.',
    ]),
  ],

  discrete_uniform: [
    P('du-01', 'A board-game spinner is fair on the integers 1 through 8. Find P(X = 5).', '0.125', [
      'Identify X ~ DiscreteUniform(a = 1, b = 8).',
      'PMF: P(X = k) = 1/(b − a + 1) for k = a, …, b.',
      'There are 8 faces, so P(X = 5) = 1/8 = 0.125.',
      'Final answer: 0.125.',
    ]),
    P('du-02', 'For that 1–8 spinner, find P(X ≤ 3).', '0.375', [
      'Identify X ~ DiscreteUniform(1, 8).',
      'P(X ≤ 3) = 3/8 because 1, 2, 3 are equally likely.',
      '3/8 = 0.375.',
      'Final answer: 0.375.',
    ]),
    P('du-03', 'For the 1–8 spinner, find E[X].', '4.5', [
      'Identify X ~ DiscreteUniform(a = 1, b = 8).',
      'E[X] = (a + b)/2.',
      '(1 + 8)/2 = 4.5.',
      'Final answer: 4.5.',
    ]),
    P('du-04', 'For the 1–8 spinner, find Var(X).', '5.25', [
      'Identify X ~ DiscreteUniform(a = 1, b = 8).',
      'Var(X) = ((b − a + 1)^2 − 1)/12.',
      '(8^2 − 1)/12 = 63/12 = 5.25.',
      'Final answer: 5.25.',
    ]),
    P('du-05', 'On the 1–8 spinner, find P(X ≥ 7).', '0.25', [
      'Identify X ~ DiscreteUniform(1, 8).',
      'X ≥ 7 means {7, 8}, two of eight faces.',
      '2/8 = 0.25.',
      'Final answer: 0.25.',
    ]),
  ],

  continuous_uniform: [
    P('cu-01', 'A campus shuttle is equally likely to arrive anywhere in a 2-to-8 minute window. Let X be the wait in minutes. Find P(X ≤ 5).', '0.5', [
      'Identify X ~ Uniform(a = 2, b = 8).',
      'CDF on [a, b]: F(x) = (x − a)/(b − a).',
      'F(5) = (5 − 2)/(8 − 2) = 3/6 = 0.5.',
      'Final answer: 0.5.',
    ]),
    P('cu-02', 'For that Uniform(2, 8) wait, find P(3 < X < 6).', '0.5', [
      'Identify X ~ Uniform(2, 8).',
      'P(3 < X < 6) = F(6) − F(3) = (6 − 2)/6 − (3 − 2)/6.',
      '4/6 − 1/6 = 3/6 = 0.5.',
      'Final answer: 0.5.',
    ]),
    P('cu-03', 'For X ~ Uniform(2, 8), find E[X].', '5', [
      'Identify X ~ Uniform(a = 2, b = 8).',
      'E[X] = (a + b)/2.',
      '(2 + 8)/2 = 5.',
      'Final answer: 5.',
    ]),
    P('cu-04', 'For X ~ Uniform(2, 8), find Var(X).', '3', [
      'Identify X ~ Uniform(a = 2, b = 8).',
      'Var(X) = (b − a)^2 / 12.',
      '6^2 / 12 = 36/12 = 3.',
      'Final answer: 3.',
    ]),
    P('cu-05', 'For the Uniform(2, 8) shuttle wait, find P(X > 7).', '0.1667', [
      'Identify X ~ Uniform(2, 8).',
      'P(X > 7) = 1 − F(7) = 1 − (7 − 2)/6.',
      '1 − 5/6 = 1/6 ≈ 0.1667.',
      'Final answer: 0.1667.',
    ]),
  ],

  normal: [
    P('normal-01', 'Weekday commute times are modeled as X ~ Normal(μ = 72 min, σ = 8 min). Find P(X ≤ 80).', '0.8413', [
      'Identify X ~ Normal(μ = 72, σ = 8).',
      'Standardize: z = (80 − 72)/8 = 1.00.',
      'P(X ≤ 80) = Φ(1.00).',
      'Φ(1.00) ≈ 0.8413.',
      'Final answer: 0.8413.',
    ]),
    P('normal-02', 'For the same commute X ~ Normal(72, 8), find P(X ≥ 60).', '0.9332', [
      'Identify X ~ Normal(μ = 72, σ = 8).',
      'z = (60 − 72)/8 = −1.50.',
      'P(X ≥ 60) = 1 − Φ(−1.50) = Φ(1.50).',
      'Φ(1.50) ≈ 0.9332.',
      'Final answer: 0.9332.',
    ]),
    P('normal-03', 'For X ~ Normal(72, 8), find P(64 < X < 80).', '0.6827', [
      'Identify X ~ Normal(μ = 72, σ = 8).',
      'z_lo = (64 − 72)/8 = −1, z_hi = (80 − 72)/8 = 1.',
      'P(−1 < Z < 1) = Φ(1) − Φ(−1).',
      '0.8413 − 0.1587 = 0.6827 (the 68% one-sd rule).',
      'Final answer: 0.6827.',
    ]),
    P('normal-04', 'A loaf baked under Normal(μ = 72 g over target, σ = 8 g) weighs 84 g over target. Find its z-score.', '1.5', [
      'Identify X ~ Normal(μ = 72, σ = 8).',
      'z = (x − μ)/σ.',
      'z = (84 − 72)/8 = 12/8 = 1.5.',
      'Final answer: 1.5.',
    ]),
    P('normal-05', 'Lab pipettes are Normal(μ = 68 μL, σ = 5 μL). Find P(X ≤ 70).', '0.6554', [
      'Identify X ~ Normal(μ = 68, σ = 5).',
      'z = (70 − 68)/5 = 0.40.',
      'P(X ≤ 70) = Φ(0.40) ≈ 0.6554.',
      'Final answer: 0.6554.',
    ]),
  ],

  standard_normal: [
    P('sn-01', 'Let Z ~ StandardNormal (mean 0, sd 1). Find P(Z ≤ 1.25).', '0.8944', [
      'Identify Z ~ N(0, 1).',
      'P(Z ≤ 1.25) = Φ(1.25).',
      'From the standard normal CDF, Φ(1.25) ≈ 0.8944.',
      'Final answer: 0.8944.',
    ]),
    P('sn-02', 'For Z ~ N(0, 1), find P(Z ≥ −0.80).', '0.7881', [
      'Identify Z ~ N(0, 1).',
      'P(Z ≥ −0.80) = 1 − Φ(−0.80) = Φ(0.80).',
      'Φ(0.80) ≈ 0.7881.',
      'Final answer: 0.7881.',
    ]),
    P('sn-03', 'For Z ~ N(0, 1), find P(−1.5 < Z < 1.5).', '0.8664', [
      'Identify Z ~ N(0, 1).',
      'P(−1.5 < Z < 1.5) = Φ(1.5) − Φ(−1.5) = 2Φ(1.5) − 1.',
      'Φ(1.5) ≈ 0.9332, so 2 × 0.9332 − 1 = 0.8664.',
      'Final answer: 0.8664.',
    ]),
    P('sn-04', 'A quiz score of 58 comes from a class with mean 50 and sd 4. Convert to a standard normal z-score.', '2', [
      'The z-score is z = (x − μ)/σ for comparison with Z ~ N(0, 1).',
      'z = (58 − 50)/4 = 8/4 = 2.',
      'This score is 2 standard deviations above the mean.',
      'Final answer: 2.',
    ]),
    P('sn-05', 'For Z ~ N(0, 1), find P(|Z| > 2).', '0.0455', [
      'Identify Z ~ N(0, 1).',
      'P(|Z| > 2) = 1 − [Φ(2) − Φ(−2)] = 2(1 − Φ(2)).',
      'Φ(2) ≈ 0.97725, so 2 × 0.02275 = 0.0455.',
      'Final answer: 0.0455.',
    ]),
  ],

  lognormal: [
    P('ln-01', 'App cold-start times (seconds) follow X ~ Lognormal(μ = 0.4, σ = 0.5), so ln X ~ N(0.4, 0.5). Find P(X ≤ 2).', '0.7212', [
      'Identify X ~ Lognormal(μ = 0.4, σ = 0.5).',
      'CDF: F(x) = Φ((ln x − μ)/σ) for x > 0.',
      'ln 2 ≈ 0.6931, z = (0.6931 − 0.4)/0.5 = 0.5863.',
      'Φ(0.5863) ≈ 0.7212.',
      'Final answer: 0.7212.',
    ]),
    P('ln-02', 'For the same cold-start model, find P(X > 1).', '0.7881', [
      'Identify X ~ Lognormal(μ = 0.4, σ = 0.5).',
      'P(X > 1) = 1 − Φ((ln 1 − 0.4)/0.5) = 1 − Φ(−0.80).',
      '1 − Φ(−0.80) = Φ(0.80) ≈ 0.7881.',
      'Final answer: 0.7881.',
    ]),
    P('ln-03', 'For X ~ Lognormal(μ = 0.4, σ = 0.5), find E[X].', '1.690', [
      'Identify X ~ Lognormal(μ = 0.4, σ = 0.5).',
      'E[X] = exp(μ + σ^2/2).',
      'σ^2/2 = 0.25/2 = 0.125, so exp(0.4 + 0.125) = exp(0.525) ≈ 1.690.',
      'Final answer: 1.690.',
    ]),
    P('ln-04', 'For that lognormal start-time model, find Var(X).', '0.8116', [
      'Identify X ~ Lognormal(μ = 0.4, σ = 0.5).',
      'Var(X) = (e^{σ^2} − 1) exp(2μ + σ^2).',
      'e^{0.25} − 1 ≈ 0.2840, exp(0.80 + 0.25) = exp(1.05) ≈ 2.858, product ≈ 0.8116.',
      'Final answer: 0.8116.',
    ]),
    P('ln-05', 'For X ~ Lognormal(0.4, 0.5), find P(0.8 < X < 2.5).', '0.7428', [
      'Identify X ~ Lognormal(μ = 0.4, σ = 0.5).',
      'P(0.8 < X < 2.5) = F(2.5) − F(0.8).',
      'z_hi = (ln 2.5 − 0.4)/0.5 ≈ 1.0326, z_lo = (ln 0.8 − 0.4)/0.5 ≈ −1.2463.',
      'Φ(1.0326) − Φ(−1.2463) ≈ 0.7428.',
      'Final answer: 0.7428.',
    ]),
  ],

  exponential: [
    P('exp-01', 'A shared power bank fails at rate λ = 0.40 per hour of use (memoryless waits). Find P(X ≤ 2 hours).', '0.5507', [
      'Identify X ~ Exponential(λ = 0.40), rate parameterization.',
      'CDF: F(x) = 1 − e^{−λx} for x ≥ 0.',
      'F(2) = 1 − e^{−0.80}.',
      'e^{−0.80} ≈ 0.4493, so 1 − 0.4493 = 0.5507.',
      'Final answer: 0.5507.',
    ]),
    P('exp-02', 'For the same power bank, find P(X > 3).', '0.3012', [
      'Identify X ~ Exponential(λ = 0.40).',
      'Survival: P(X > x) = e^{−λx}.',
      'P(X > 3) = e^{−1.20} ≈ 0.3012.',
      'Final answer: 0.3012.',
    ]),
    P('exp-03', 'For X ~ Exponential(λ = 0.40), find E[X] in hours.', '2.5', [
      'Identify X ~ Exponential(rate λ = 0.40).',
      'E[X] = 1/λ.',
      '1 / 0.40 = 2.5.',
      'Final answer: 2.5.',
    ]),
    P('exp-04', 'For that exponential lifetime, find Var(X).', '6.25', [
      'Identify X ~ Exponential(λ = 0.40).',
      'Var(X) = 1/λ^2.',
      '1 / 0.16 = 6.25.',
      'Final answer: 6.25.',
    ]),
    P('exp-05', 'For X ~ Exponential(0.40), find P(1 < X < 4).', '0.4684', [
      'Identify X ~ Exponential(λ = 0.40).',
      'P(1 < X < 4) = F(4) − F(1) = e^{−0.40} − e^{−1.60}.',
      'e^{−0.40} ≈ 0.6703, e^{−1.60} ≈ 0.2019, difference ≈ 0.4684.',
      'Final answer: 0.4684.',
    ]),
  ],

  gamma: [
    P('gamma-01', 'Three independent Exponential(rate 0.5) charger waits add up to X ~ Gamma(shape α = 3, scale θ = 2). Find P(X ≤ 4).', '0.3233', [
      'Identify X ~ Gamma(α = 3, θ = 2) (shape-scale).',
      'Use the gamma CDF F(4) = P(α, x/θ) = P(3, 2).',
      'Equivalently, X is Erlang-3 with rate 1/2, F(4) ≈ 0.3233.',
      'Final answer: 0.3233.',
    ]),
    P('gamma-02', 'For X ~ Gamma(3, 2), find P(X > 8).', '0.2381', [
      'Identify X ~ Gamma(shape 3, scale 2).',
      'P(X > 8) = 1 − F(8).',
      'The gamma CDF gives F(8) ≈ 0.7619.',
      '1 − 0.7619 = 0.2381.',
      'Final answer: 0.2381.',
    ]),
    P('gamma-03', 'For X ~ Gamma(α = 3, θ = 2), find E[X].', '6', [
      'Identify X ~ Gamma(shape α = 3, scale θ = 2).',
      'E[X] = αθ.',
      '3 × 2 = 6.',
      'Final answer: 6.',
    ]),
    P('gamma-04', 'For that gamma wait, find Var(X).', '12', [
      'Identify X ~ Gamma(α = 3, θ = 2).',
      'Var(X) = αθ^2.',
      '3 × 4 = 12.',
      'Final answer: 12.',
    ]),
    P('gamma-05', 'For X ~ Gamma(3, 2), find P(2 < X < 6).', '0.4965', [
      'Identify X ~ Gamma(shape 3, scale 2).',
      'P(2 < X < 6) = F(6) − F(2).',
      'Catalog CDF difference ≈ 0.4965.',
      'Final answer: 0.4965.',
    ]),
  ],

  beta: [
    P('beta-01', 'A survey completion rate is modeled as X ~ Beta(α = 3, β = 5) on (0, 1). Find P(X ≤ 0.40).', '0.5801', [
      'Identify X ~ Beta(α = 3, β = 5).',
      'CDF: F(x) = I_x(α, β), the regularized incomplete beta.',
      'F(0.40) = I_{0.40}(3, 5) ≈ 0.5801.',
      'Final answer: 0.5801.',
    ]),
    P('beta-02', 'For the same completion rate, find P(X > 0.60).', '0.09626', [
      'Identify X ~ Beta(3, 5).',
      'P(X > 0.60) = 1 − I_{0.60}(3, 5).',
      'I_{0.60}(3, 5) ≈ 0.9037, so 1 − 0.9037 = 0.09626.',
      'Final answer: 0.09626.',
    ]),
    P('beta-03', 'For X ~ Beta(3, 5), find E[X].', '0.375', [
      'Identify X ~ Beta(α = 3, β = 5).',
      'E[X] = α/(α + β).',
      '3 / 8 = 0.375.',
      'Final answer: 0.375.',
    ]),
    P('beta-04', 'For X ~ Beta(3, 5), find Var(X).', '0.02604', [
      'Identify X ~ Beta(α = 3, β = 5).',
      'Var(X) = αβ / [(α + β)^2 (α + β + 1)].',
      '15 / (64 × 9) = 15/576 = 0.0260417…',
      'Final answer: 0.02604.',
    ]),
    P('beta-05', 'For X ~ Beta(3, 5), find P(0.20 < X < 0.50).', '0.6254', [
      'Identify X ~ Beta(3, 5).',
      'P(0.20 < X < 0.50) = F(0.50) − F(0.20).',
      'Incomplete-beta difference ≈ 0.6254.',
      'Final answer: 0.6254.',
    ]),
  ],

  chi_square: [
    P('chi-01', 'A goodness-of-fit statistic is modeled as X ~ ChiSquare(df = 6). Find P(X ≤ 8).', '0.7619', [
      'Identify X ~ χ^2(df = 6).',
      'This is Gamma(shape 3, scale 2), so use the chi-square CDF F(8; 6).',
      'F(8) ≈ 0.7619.',
      'Final answer: 0.7619.',
    ]),
    P('chi-02', 'For X ~ χ^2(6), find P(X > 10).', '0.1247', [
      'Identify X ~ χ^2(df = 6).',
      'P(X > 10) = 1 − F(10).',
      'F(10) ≈ 0.8753, so 1 − 0.8753 = 0.1247.',
      'Final answer: 0.1247.',
    ]),
    P('chi-03', 'For X ~ χ^2(6), find E[X].', '6', [
      'Identify X ~ χ^2(df = 6).',
      'E[X] = df.',
      'E[X] = 6.',
      'Final answer: 6.',
    ]),
    P('chi-04', 'For X ~ χ^2(6), find Var(X).', '12', [
      'Identify X ~ χ^2(df = 6).',
      'Var(X) = 2 × df.',
      '2 × 6 = 12.',
      'Final answer: 12.',
    ]),
    P('chi-05', 'For X ~ χ^2(6), find P(3 < X < 9).', '0.6353', [
      'Identify X ~ χ^2(df = 6).',
      'P(3 < X < 9) = F(9) − F(3).',
      'CDF difference ≈ 0.6353.',
      'Final answer: 0.6353.',
    ]),
  ],

  student_t: [
    P('t-01', 'A small-sample t statistic has df = 8. Find P(T ≤ 1.50).', '0.9140', [
      'Identify T ~ Student-t(df = 8).',
      'Evaluate the t CDF at 1.50.',
      'F(1.50) ≈ 0.9140.',
      'Final answer: 0.9140.',
    ]),
    P('t-02', 'For T ~ t_8, find P(T ≥ 2).', '0.04026', [
      'Identify T ~ Student-t(df = 8).',
      'P(T ≥ 2) = 1 − F(2).',
      'F(2) ≈ 0.9597, so 1 − 0.9597 = 0.04026.',
      'Final answer: 0.04026.',
    ]),
    P('t-03', 'For T ~ t_8, find P(|T| < 1).', '0.6534', [
      'Identify T ~ Student-t(df = 8), symmetric about 0.',
      'P(|T| < 1) = F(1) − F(−1) = 2F(1) − 1.',
      '2 × 0.8267 − 1 ≈ 0.6534.',
      'Final answer: 0.6534.',
    ]),
    P('t-04', 'For T ~ t_8 (df > 2), find Var(T).', '1.333', [
      'Identify T ~ Student-t(df = 8).',
      'For df > 2, Var(T) = df/(df − 2).',
      '8 / 6 = 4/3 ≈ 1.333.',
      'Final answer: 1.333.',
    ]),
    P('t-05', 'For T ~ t_8, find P(T > 0).', '0.5', [
      'Identify T ~ Student-t(df = 8).',
      'The t density is symmetric about 0 when df > 0.',
      'P(T > 0) = 0.5.',
      'Final answer: 0.5.',
    ]),
  ],

  f: [
    P('f-01', 'An ANOVA variance ratio is modeled as F ~ F(df1 = 5, df2 = 12). Find P(F ≤ 2).', '0.8491', [
      'Identify F ~ F(5, 12).',
      'Use the F CDF (incomplete beta form) at x = 2.',
      'F_{5,12}(2) ≈ 0.8491.',
      'Final answer: 0.8491.',
    ]),
    P('f-02', 'For F ~ F(5, 12), find P(F > 3).', '0.05520', [
      'Identify F ~ F(5, 12).',
      'P(F > 3) = 1 − F_{5,12}(3).',
      'F_{5,12}(3) ≈ 0.9448, so 1 − 0.9448 = 0.05520.',
      'Final answer: 0.05520.',
    ]),
    P('f-03', 'For F ~ F(5, 12), find E[F].', '1.2', [
      'Identify F ~ F(df1 = 5, df2 = 12).',
      'For df2 > 2, E[F] = df2/(df2 − 2).',
      '12 / 10 = 1.2.',
      'Final answer: 1.2.',
    ]),
    P('f-04', 'For F ~ F(5, 12), find P(F < 1).', '0.5418', [
      'Identify F ~ F(5, 12).',
      'Evaluate the F CDF at 1.',
      'F_{5,12}(1) ≈ 0.5418.',
      'Final answer: 0.5418.',
    ]),
    P('f-05', 'For F ~ F(5, 12) (df2 > 4), find Var(F).', '1.08', [
      'Identify F ~ F(df1 = 5, df2 = 12).',
      'Var(F) = 2 df2^2 (df1 + df2 − 2) / [df1 (df2 − 2)^2 (df2 − 4)].',
      '2 × 144 × 15 / (5 × 100 × 8) = 4320 / 4000 = 1.08.',
      'Final answer: 1.08.',
    ]),
  ],

  weibull: [
    P('wei-01', 'A rooftop inverter lifetime (years) follows Weibull(scale λ = 4, shape k = 2). Find P(X ≤ 3).', '0.4302', [
      'Identify X ~ Weibull(λ = 4, k = 2).',
      'CDF: F(x) = 1 − exp(−(x/λ)^k).',
      'F(3) = 1 − exp(−(3/4)^2) = 1 − exp(−0.5625).',
      'exp(−0.5625) ≈ 0.5698, so 1 − 0.5698 = 0.4302.',
      'Final answer: 0.4302.',
    ]),
    P('wei-02', 'For that inverter, find P(X > 5).', '0.2096', [
      'Identify X ~ Weibull(λ = 4, k = 2).',
      'P(X > 5) = exp(−(5/4)^2) = exp(−1.5625).',
      'exp(−1.5625) ≈ 0.2096.',
      'Final answer: 0.2096.',
    ]),
    P('wei-03', 'For X ~ Weibull(λ = 4, k = 2), find E[X].', '3.545', [
      'Identify X ~ Weibull(scale 4, shape 2).',
      'E[X] = λ Γ(1 + 1/k) = 4 Γ(1.5).',
      'Γ(1.5) = √π / 2 ≈ 0.886227, so 4 × 0.886227 ≈ 3.545.',
      'Final answer: 3.545.',
    ]),
    P('wei-04', 'For the same Weibull lifetime, find the 6-year survival probability P(X > 6).', '0.1054', [
      'Identify X ~ Weibull(λ = 4, k = 2).',
      'P(X > 6) = exp(−(6/4)^2) = exp(−2.25).',
      'exp(−2.25) ≈ 0.1054.',
      'Final answer: 0.1054.',
    ]),
    P('wei-05', 'For X ~ Weibull(4, 2), find P(X > 2).', '0.7788', [
      'Identify X ~ Weibull(λ = 4, k = 2).',
      'P(X > 2) = exp(−(2/4)^2) = exp(−0.25).',
      'exp(−0.25) ≈ 0.7788.',
      'Final answer: 0.7788.',
    ]),
  ],

  pareto: [
    P('par-01', 'Weekend ride fares (after a ₹2 minimum) follow Pareto(xm = 2, α = 3). Find P(X ≤ 4).', '0.875', [
      'Identify X ~ Pareto(xm = 2, α = 3), support x ≥ 2.',
      'CDF: F(x) = 1 − (xm/x)^α.',
      'F(4) = 1 − (2/4)^3 = 1 − 1/8 = 0.875.',
      'Final answer: 0.875.',
    ]),
    P('par-02', 'For those fares, find P(X > 6).', '0.03704', [
      'Identify X ~ Pareto(xm = 2, α = 3).',
      'P(X > x) = (xm/x)^α.',
      'P(X > 6) = (2/6)^3 = 8/216 = 1/27 ≈ 0.03704.',
      'Final answer: 0.03704.',
    ]),
    P('par-03', 'For X ~ Pareto(2, 3), find E[X].', '3', [
      'Identify X ~ Pareto(xm = 2, α = 3).',
      'For α > 1, E[X] = α xm / (α − 1).',
      '3 × 2 / 2 = 3.',
      'Final answer: 3.',
    ]),
    P('par-04', 'For X ~ Pareto(2, 3), find Var(X).', '3', [
      'Identify X ~ Pareto(xm = 2, α = 3).',
      'For α > 2, Var(X) = xm^2 α / [(α − 1)^2 (α − 2)].',
      '4 × 3 / (4 × 1) = 12/4 = 3.',
      'Final answer: 3.',
    ]),
    P('par-05', 'For X ~ Pareto(2, 3), find P(X > 3).', '0.2963', [
      'Identify X ~ Pareto(xm = 2, α = 3).',
      'P(X > 3) = (2/3)^3 = 8/27.',
      '8/27 ≈ 0.2963.',
      'Final answer: 0.2963.',
    ]),
  ],

  cauchy: [
    P('cau-01', 'A resonance peak is modeled as X ~ Cauchy(x0 = 2, γ = 1). The mean does not exist; use the CDF. Find P(X ≤ 3).', '0.75', [
      'Identify X ~ Cauchy(x0 = 2, γ = 1). Do not use a mean.',
      'CDF: F(x) = 1/π arctan((x − x0)/γ) + 1/2.',
      'F(3) = 1/π arctan(1) + 1/2 = 1/4 + 1/2 = 0.75.',
      'Final answer: 0.75.',
    ]),
    P('cau-02', 'For the same Cauchy peak, find P(X > 4).', '0.1476', [
      'Identify X ~ Cauchy(x0 = 2, γ = 1).',
      'P(X > 4) = 1 − [1/π arctan(2) + 1/2].',
      'arctan(2) ≈ 1.1071, 1.1071/π ≈ 0.3524, so F(4) ≈ 0.8524.',
      '1 − 0.8524 = 0.1476.',
      'Final answer: 0.1476.',
    ]),
    P('cau-03', 'For X ~ Cauchy(x0 = 2, γ = 1), what is the median?', '2', [
      'Identify X ~ Cauchy(x0 = 2, γ = 1).',
      'The Cauchy median equals the location x0 because F(x0) = 1/2.',
      'Median = 2.',
      'Final answer: 2.',
    ]),
    P('cau-04', 'For X ~ Cauchy(2, 1), find P(0 < X < 4).', '0.7048', [
      'Identify X ~ Cauchy(x0 = 2, γ = 1).',
      'P(0 < X < 4) = F(4) − F(0).',
      'F(4) ≈ 0.8524, F(0) = 1/π arctan(−2) + 1/2 ≈ 0.1476.',
      '0.8524 − 0.1476 = 0.7048.',
      'Final answer: 0.7048.',
    ]),
    P('cau-05', 'For X ~ Cauchy(2, 1), find P(|X − 2| < 1).', '0.5', [
      'Identify X ~ Cauchy(x0 = 2, γ = 1).',
      'P(1 < X < 3) = F(3) − F(1).',
      'F(3) = 0.75 and F(1) = 0.25 (symmetric one scale unit from x0).',
      '0.75 − 0.25 = 0.50.',
      'Final answer: 0.5.',
    ]),
  ],

  logistic: [
    P('log-01', 'A growth-curve score follows X ~ Logistic(μ = 10, s = 2). Find P(X ≤ 12).', '0.7311', [
      'Identify X ~ Logistic(μ = 10, s = 2).',
      'CDF: F(x) = 1 / (1 + exp(−(x − μ)/s)).',
      'F(12) = 1 / (1 + e^{−1}) = 1 / (1 + 0.367879) ≈ 0.7311.',
      'Final answer: 0.7311.',
    ]),
    P('log-02', 'For the same logistic score, find P(X > 8).', '0.7311', [
      'Identify X ~ Logistic(μ = 10, s = 2).',
      'P(X > 8) = 1 − F(8) = 1 − 1/(1 + e^{1}).',
      'F(8) = 1/(1 + e) ≈ 0.2689, so 1 − 0.2689 = 0.7311 (symmetric about 10).',
      'Final answer: 0.7311.',
    ]),
    P('log-03', 'For X ~ Logistic(10, 2), find E[X].', '10', [
      'Identify X ~ Logistic(μ = 10, s = 2).',
      'The mean equals the location μ.',
      'E[X] = 10.',
      'Final answer: 10.',
    ]),
    P('log-04', 'For X ~ Logistic(10, 2), find Var(X).', '13.16', [
      'Identify X ~ Logistic(μ = 10, s = 2).',
      'Var(X) = π^2 s^2 / 3.',
      'π^2 × 4 / 3 ≈ 9.8696 × 4 / 3 ≈ 13.16.',
      'Final answer: 13.16.',
    ]),
    P('log-05', 'For X ~ Logistic(10, 2), find P(6 < X < 14).', '0.7616', [
      'Identify X ~ Logistic(μ = 10, s = 2).',
      'P(6 < X < 14) = F(14) − F(6).',
      'F(14) = 1/(1+e^{−2}) ≈ 0.8808, F(6) = 1/(1+e^2) ≈ 0.1192.',
      '0.8808 − 0.1192 = 0.7616.',
      'Final answer: 0.7616.',
    ]),
  ],

  skew_normal: [
    P('skn-01', 'Finish times (minutes) use the catalog skew-normal X with ξ = 50, ω = 8, α = 2. The page CDF is the normal approximation Φ((x − ξ)/ω). Find P(X ≤ 54).', '0.6915', [
      'Identify X ~ SkewNormal(ξ = 50, ω = 8, α = 2).',
      'Catalog CDF: F(x) = Φ((x − ξ)/ω).',
      'z = (54 − 50)/8 = 0.50.',
      'Φ(0.50) ≈ 0.6915.',
      'Final answer: 0.6915.',
    ]),
    P('skn-02', 'Using that same catalog CDF, find P(X > 46).', '0.6915', [
      'Identify X ~ SkewNormal(ξ = 50, ω = 8, α = 2).',
      'P(X > 46) = 1 − Φ((46 − 50)/8) = 1 − Φ(−0.50).',
      '1 − Φ(−0.50) = Φ(0.50) ≈ 0.6915.',
      'Final answer: 0.6915.',
    ]),
    P('skn-03', 'For the catalog skew-normal, find P(X < 50).', '0.5', [
      'Identify X ~ SkewNormal(ξ = 50, ω = 8, α = 2).',
      'Catalog F(50) = Φ(0) because (50 − 50)/8 = 0.',
      'Φ(0) = 0.5.',
      'Final answer: 0.5.',
    ]),
    P('skn-04', 'At the location ξ = 50, evaluate the skew-normal PDF f(50) with ω = 8, α = 2.', '0.04987', [
      'Identify X ~ SkewNormal(ξ = 50, ω = 8, α = 2).',
      'PDF: f(x) = (2/ω) φ(z) Φ(α z) with z = (x − ξ)/ω.',
      'At x = 50, z = 0, so f(50) = (2/8) φ(0) Φ(0) = 0.25 × 0.39894 × 0.5.',
      '0.25 × 0.19947 ≈ 0.04987.',
      'Final answer: 0.04987.',
    ]),
    P('skn-05', 'Using the catalog CDF, find P(42 < X < 58).', '0.6827', [
      'Identify X ~ SkewNormal(ξ = 50, ω = 8, α = 2).',
      'z_lo = (42 − 50)/8 = −1, z_hi = (58 − 50)/8 = 1.',
      'Φ(1) − Φ(−1) ≈ 0.6827.',
      'Final answer: 0.6827.',
    ]),
  ],

  laplace: [
    P('lap-01', 'A GPS easting error (meters) follows X ~ Laplace(μ = 0, b = 2). Find P(X ≤ 1).', '0.6967', [
      'Identify X ~ Laplace(μ = 0, b = 2).',
      'For x ≥ μ, F(x) = 1 − (1/2) exp(−(x − μ)/b).',
      'F(1) = 1 − 0.5 e^{−0.5}.',
      'e^{−0.5} ≈ 0.60653, so 1 − 0.30327 = 0.6967.',
      'Final answer: 0.6967.',
    ]),
    P('lap-02', 'For the same GPS error, find P(X > 3).', '0.1116', [
      'Identify X ~ Laplace(μ = 0, b = 2).',
      'For x > 0, P(X > x) = (1/2) exp(−x/b).',
      'P(X > 3) = 0.5 e^{−1.5} ≈ 0.5 × 0.22313 = 0.1116.',
      'Final answer: 0.1116.',
    ]),
    P('lap-03', 'For X ~ Laplace(0, 2), find E[X].', '0', [
      'Identify X ~ Laplace(μ = 0, b = 2).',
      'The mean equals the location μ (also the median).',
      'E[X] = 0.',
      'Final answer: 0.',
    ]),
    P('lap-04', 'For X ~ Laplace(0, 2), find Var(X).', '8', [
      'Identify X ~ Laplace(μ = 0, b = 2).',
      'Var(X) = 2 b^2.',
      '2 × 4 = 8.',
      'Final answer: 8.',
    ]),
    P('lap-05', 'For X ~ Laplace(0, 2), find P(−2 < X < 2).', '0.6321', [
      'Identify X ~ Laplace(μ = 0, b = 2).',
      'By symmetry, P(|X| < 2) = 1 − exp(−2/2) = 1 − e^{−1}.',
      '1 − 0.367879 = 0.6321.',
      'Final answer: 0.6321.',
    ]),
  ],

  gumbel: [
    P('gum-01', 'Annual max daily rainfall (mm) is modeled as X ~ Gumbel(μ = 20, β = 4). Find P(X ≤ 24).', '0.6922', [
      'Identify X ~ Gumbel(μ = 20, β = 4) (maxima).',
      'CDF: F(x) = exp(−exp(−(x − μ)/β)).',
      'F(24) = exp(−exp(−1)) = exp(−0.367879) ≈ 0.6922.',
      'Final answer: 0.6922.',
    ]),
    P('gum-02', 'For that annual maximum, find P(X > 30).', '0.07881', [
      'Identify X ~ Gumbel(μ = 20, β = 4).',
      'P(X > 30) = 1 − exp(−exp(−(30 − 20)/4)) = 1 − exp(−e^{−2.5}).',
      'e^{−2.5} ≈ 0.08208, exp(−0.08208) ≈ 0.9212, so 1 − 0.9212 = 0.07881.',
      'Final answer: 0.07881.',
    ]),
    P('gum-03', 'For X ~ Gumbel(20, 4), find E[X] using Euler’s constant γ ≈ 0.57721.', '22.31', [
      'Identify X ~ Gumbel(μ = 20, β = 4).',
      'E[X] = μ + γ β.',
      '20 + 0.57721 × 4 = 20 + 2.30884 = 22.31.',
      'Final answer: 22.31.',
    ]),
    P('gum-04', 'For X ~ Gumbel(20, 4), find Var(X).', '26.32', [
      'Identify X ~ Gumbel(μ = 20, β = 4).',
      'Var(X) = (π^2 / 6) β^2.',
      '(π^2 / 6) × 16 ≈ 1.64493 × 16 ≈ 26.32.',
      'Final answer: 26.32.',
    ]),
    P('gum-05', 'For X ~ Gumbel(20, 4), find the median.', '21.47', [
      'Identify X ~ Gumbel(μ = 20, β = 4).',
      'Quantile: F^{−1}(q) = μ − β ln(−ln q).',
      'Median: 20 − 4 ln(−ln 0.5) = 20 − 4 ln(ln 2).',
      'ln(0.693147) ≈ −0.36651, so −4 × (−0.36651) = 1.466 and 20 + 1.466 = 21.47.',
      'Final answer: 21.47.',
    ]),
  ],

  inverse_gaussian: [
    P('ig-01', 'A first-passage delivery time (hours) follows InverseGaussian(μ = 2, λ = 8). Find P(X ≤ 2).', '0.5944', [
      'Identify X ~ InverseGaussian(μ = 2, λ = 8).',
      'Wald CDF: F(x) = Φ(√(λ/x)(x/μ − 1)) + e^{2λ/μ} Φ(−√(λ/x)(x/μ + 1)).',
      'At x = 2 = μ: first term Φ(0) = 0.5; second term e^{8} Φ(−√4 · 2) = e^8 Φ(−4).',
      'e^8 Φ(−4) ≈ 2981 × 3.17e−5 ≈ 0.0944, so F(2) ≈ 0.50 + 0.0944 = 0.5944.',
      'Final answer: 0.5944.',
    ]),
    P('ig-02', 'For that delivery time, find P(X > 3).', '0.1407', [
      'Identify X ~ InverseGaussian(μ = 2, λ = 8).',
      'P(X > 3) = 1 − F(3) using the Wald CDF.',
      'F(3) ≈ 0.8593, so 1 − 0.8593 = 0.1407.',
      'Final answer: 0.1407.',
    ]),
    P('ig-03', 'For X ~ InverseGaussian(μ = 2, λ = 8), find E[X].', '2', [
      'Identify X ~ InverseGaussian(μ = 2, λ = 8).',
      'E[X] = μ.',
      'E[X] = 2.',
      'Final answer: 2.',
    ]),
    P('ig-04', 'For X ~ InverseGaussian(2, 8), find Var(X).', '1', [
      'Identify X ~ InverseGaussian(μ = 2, λ = 8).',
      'Var(X) = μ^3 / λ.',
      '8 / 8 = 1.',
      'Final answer: 1.',
    ]),
    P('ig-05', 'For X ~ InverseGaussian(2, 8), find P(X < 1).', '0.1116', [
      'Identify X ~ InverseGaussian(μ = 2, λ = 8).',
      'Evaluate the Wald CDF at x = 1.',
      'F(1) ≈ 0.1116.',
      'Final answer: 0.1116.',
    ]),
  ],

  stretched_beta: [
    P('sb-01', 'A rubric score lives on 10 to 20 and is a stretched Beta(α = 2, β = 3): Y = 10 + 10X, X ~ Beta(2, 3). Find P(Y ≤ 14).', '0.5248', [
      'Identify Y ~ StretchedBeta(a = 10, b = 20, α = 2, β = 3).',
      'Standardize: z = (14 − 10)/(20 − 10) = 0.40, so P(Y ≤ 14) = I_{0.40}(2, 3).',
      'I_{0.40}(2, 3) ≈ 0.5248.',
      'Final answer: 0.5248.',
    ]),
    P('sb-02', 'For that rubric score, find P(Y > 16).', '0.1792', [
      'Identify Y ~ StretchedBeta(10, 20, 2, 3).',
      'z = (16 − 10)/10 = 0.60, so P(Y > 16) = 1 − I_{0.60}(2, 3).',
      'I_{0.60}(2, 3) ≈ 0.8208, hence 0.1792.',
      'Final answer: 0.1792.',
    ]),
    P('sb-03', 'For Y ~ StretchedBeta(10, 20, 2, 3), find E[Y].', '14', [
      'Identify Y = 10 + 10X with X ~ Beta(2, 3).',
      'E[Y] = a + (b − a) α/(α + β).',
      '10 + 10 × 2/5 = 10 + 4 = 14.',
      'Final answer: 14.',
    ]),
    P('sb-04', 'For that stretched beta score, find Var(Y).', '4', [
      'Identify Y = a + (b − a)X, X ~ Beta(2, 3).',
      'Var(Y) = (b − a)^2 αβ / [(α + β)^2 (α + β + 1)].',
      '100 × 6 / (25 × 6) = 600/150 = 4.',
      'Final answer: 4.',
    ]),
    P('sb-05', 'For Y ~ StretchedBeta(10, 20, 2, 3), find P(12 < Y < 18).', '0.792', [
      'Identify Y ~ StretchedBeta(10, 20, 2, 3).',
      'P(12 < Y < 18) = I_{0.80}(2, 3) − I_{0.20}(2, 3).',
      'Catalog CDF difference ≈ 0.792.',
      'Final answer: 0.792.',
    ]),
  ],

  mixture_normal: [
    P('mix-01', 'Cycle times mix two shifts: 40% from N(40, 6^2) and 60% from N(70, 6^2). Find P(X ≤ 50).', '0.3811', [
      'Identify X ~ MixtureNormal(μ1 = 40, μ2 = 70, s = 6, π = 0.40).',
      'CDF: F(x) = π Φ((x − μ1)/s) + (1 − π) Φ((x − μ2)/s).',
      'F(50) = 0.40 Φ(10/6) + 0.60 Φ(−20/6) = 0.40 Φ(1.667) + 0.60 Φ(−3.333).',
      '0.40 × 0.9522 + 0.60 × 0.000429 ≈ 0.3811.',
      'Final answer: 0.3811.',
    ]),
    P('mix-02', 'For the same two-shift mixture, find P(X > 65).', '0.4786', [
      'Identify X ~ MixtureNormal(40, 70, s = 6, π = 0.40).',
      'P(X > 65) = 1 − [0.40 Φ((65 − 40)/6) + 0.60 Φ((65 − 70)/6)].',
      '0.40 Φ(4.167) + 0.60 Φ(−0.833) ≈ 0.40 × 1 + 0.60 × 0.2023 = 0.5214.',
      '1 − 0.5214 = 0.4786.',
      'Final answer: 0.4786.',
    ]),
    P('mix-03', 'For that mixture, find E[X].', '58', [
      'Identify X ~ MixtureNormal(μ1 = 40, μ2 = 70, π = 0.40).',
      'E[X] = π μ1 + (1 − π) μ2.',
      '0.40 × 40 + 0.60 × 70 = 16 + 42 = 58.',
      'Final answer: 58.',
    ]),
    P('mix-04', 'For the two-shift mixture, find P(X < 40).', '0.2000', [
      'Identify X ~ MixtureNormal(40, 70, s = 6, π = 0.40).',
      'F(40) = 0.40 Φ(0) + 0.60 Φ(−5) = 0.40 × 0.5 + 0.60 × ≈0.',
      '0.20 + a negligible left tail ≈ 0.2000.',
      'Final answer: 0.2000.',
    ]),
    P('mix-05', 'For the same mixture, find P(45 < X < 60).', '0.1094', [
      'Identify X ~ MixtureNormal(40, 70, s = 6, π = 0.40).',
      'P(45 < X < 60) = F(60) − F(45).',
      'Mixture CDF difference ≈ 0.1094 (the gap between the two peaks).',
      'Final answer: 0.1094.',
    ]),
  ],

  zip: [
    P('zip-01', 'Daily shop returns are zero-inflated Poisson with λ = 2.5 and extra-zero weight π = 0.30 (closed-day zeros). Find P(X = 0).', '0.3575', [
      'Identify X ~ ZIP(λ = 2.5, π = 0.30).',
      'P(X = 0) = π + (1 − π) e^{−λ}.',
      'e^{−2.5} ≈ 0.08208, so 0.30 + 0.70 × 0.08208 = 0.30 + 0.05746 = 0.3575.',
      'Final answer: 0.3575.',
    ]),
    P('zip-02', 'For that ZIP returns model, find P(X = 2).', '0.1796', [
      'Identify X ~ ZIP(λ = 2.5, π = 0.30).',
      'For k > 0, P(X = k) = (1 − π) e^{−λ} λ^k / k!.',
      'Poisson P(2) = e^{−2.5} (2.5)^2 / 2 ≈ 0.2565, then 0.70 × 0.2565 ≈ 0.1796.',
      'Final answer: 0.1796.',
    ]),
    P('zip-03', 'For X ~ ZIP(2.5, 0.30), find P(X ≤ 1).', '0.5011', [
      'Identify X ~ ZIP(λ = 2.5, π = 0.30).',
      'P(X ≤ 1) = P(0) + P(1).',
      'P(1) = 0.70 × e^{−2.5} × 2.5 ≈ 0.1436, plus P(0) ≈ 0.3575 gives 0.5011.',
      'Final answer: 0.5011.',
    ]),
    P('zip-04', 'For X ~ ZIP(λ = 2.5, π = 0.30), find E[X].', '1.75', [
      'Identify X ~ ZIP(λ = 2.5, π = 0.30).',
      'E[X] = (1 − π) λ.',
      '0.70 × 2.5 = 1.75.',
      'Final answer: 1.75.',
    ]),
    P('zip-05', 'For that ZIP count, find Var(X).', '3.063', [
      'Identify X ~ ZIP(λ = 2.5, π = 0.30).',
      'Var(X) = (1 − π) λ (1 + π λ).',
      '0.70 × 2.5 × (1 + 0.75) = 1.75 × 1.75 = 3.0625.',
      'Final answer: 3.063.',
    ]),
  ],

  zinb: [
    P('zinb-01', 'Clinic no-shows are zero-inflated NB with r = 3, p = 0.40, π = 0.25. Find P(X = 0).', '0.298', [
      'Identify X ~ ZINB(r = 3, p = 0.40, π = 0.25), NB as failures before r successes.',
      'P(X = 0) = π + (1 − π) p^r.',
      'p^r = (0.40)^3 = 0.064, so 0.25 + 0.75 × 0.064 = 0.25 + 0.048 = 0.298.',
      'Final answer: 0.298.',
    ]),
    P('zinb-02', 'For that ZINB no-show model, find P(X = 2).', '0.1037', [
      'Identify X ~ ZINB(r = 3, p = 0.40, π = 0.25).',
      'For k > 0, P(X = k) = (1 − π) C(k + r − 1, k) (1 − p)^k p^r.',
      'NB P(2) = C(4, 2) (0.60)^2 (0.40)^3 = 6 × 0.36 × 0.064 = 0.13824.',
      '0.75 × 0.13824 = 0.10368.',
      'Final answer: 0.1037.',
    ]),
    P('zinb-03', 'For X ~ ZINB(3, 0.40, 0.25), find P(X ≤ 1).', '0.3844', [
      'Identify X ~ ZINB(r = 3, p = 0.40, π = 0.25).',
      'F(1) = π + (1 − π) F_NB(1).',
      'Catalog evaluation gives F(1) = 0.3844.',
      'Final answer: 0.3844.',
    ]),
    P('zinb-04', 'For X ~ ZINB(r = 3, p = 0.40, π = 0.25), find E[X].', '3.375', [
      'Identify X ~ ZINB(r = 3, p = 0.40, π = 0.25).',
      'E[X] = (1 − π) r(1 − p)/p.',
      'NB mean = 3 × 0.60 / 0.40 = 4.5, then 0.75 × 4.5 = 3.375.',
      'Final answer: 3.375.',
    ]),
    P('zinb-05', 'For that ZINB count, find P(X ≥ 3).', '0.5119', [
      'Identify X ~ ZINB(r = 3, p = 0.40, π = 0.25).',
      'P(X ≥ 3) = 1 − F(2).',
      '1 − F(2) ≈ 0.5119.',
      'Final answer: 0.5119.',
    ]),
  ],

  multinomial: [
    P('mul-01', 'A kiosk sells 10 independent snacks into three flavors with probabilities 0.30, 0.50, 0.20. Let X1 be the mint count. Find P(X1 = 3).', '0.2668', [
      'Identify (X1, X2, X3) ~ Multinomial(n = 10, p = (0.30, 0.50, 0.20)).',
      'The mint margin is X1 ~ Binomial(10, 0.30).',
      'P(X1 = 3) = C(10, 3) (0.30)^3 (0.70)^7.',
      '120 × 0.027 × 0.0823543 ≈ 0.2668.',
      'Final answer: 0.2668.',
    ]),
    P('mul-02', 'For that 10-snack multinomial, find E[X1], the expected mint count.', '3', [
      'Identify Multinomial(n = 10, p1 = 0.30).',
      'E[Xi] = n pi.',
      'E[X1] = 10 × 0.30 = 3.',
      'Final answer: 3.',
    ]),
    P('mul-03', 'For the same kiosk, find Var(X1).', '2.1', [
      'Identify X1 ~ Binomial(10, 0.30) as a multinomial margin.',
      'Var(Xi) = n pi (1 − pi).',
      '10 × 0.30 × 0.70 = 2.1.',
      'Final answer: 2.1.',
    ]),
    P('mul-04', 'For X1 ~ Binomial(10, 0.30) (mint margin), find P(X1 ≤ 2).', '0.3828', [
      'Identify X1 ~ Binomial(n = 10, p = 0.30).',
      'P(X1 ≤ 2) = F(2).',
      'Binomial CDF F(2) ≈ 0.3828.',
      'Final answer: 0.3828.',
    ]),
    P('mul-05', 'Ten snacks, p = (0.30, 0.50, 0.20). Find the joint probability of counts (3, 5, 2).', '0.08505', [
      'Identify Multinomial(n = 10, p = (0.30, 0.50, 0.20)).',
      'P(X = x) = n! / (x1! x2! x3!) p1^{x1} p2^{x2} p3^{x3}.',
      '10! / (3! 5! 2!) = 2520, then 2520 × (0.30)^3 (0.50)^5 (0.20)^2.',
      '2520 × 0.027 × 0.03125 × 0.04 = 0.08505.',
      'Final answer: 0.08505.',
    ]),
  ],

  dirichlet: [
    P('dir-01', 'A three-way budget share follows Dirichlet(α = (2, 3, 5)). Find E[X1].', '0.2', [
      'Identify (X1, X2, X3) ~ Dirichlet(2, 3, 5).',
      'E[Xi] = αi / α0 with α0 = 2 + 3 + 5 = 10.',
      'E[X1] = 2/10 = 0.20.',
      'Final answer: 0.2.',
    ]),
    P('dir-02', 'For that Dirichlet budget, find E[X3].', '0.5', [
      'Identify Dirichlet(2, 3, 5), α0 = 10.',
      'E[X3] = 5/10 = 0.50.',
      'X3 is the largest mean share.',
      'Final answer: 0.5.',
    ]),
    P('dir-03', 'For Dirichlet(2, 3, 5), find Var(X1).', '0.01455', [
      'Identify Dirichlet(2, 3, 5), α0 = 10.',
      'Var(Xi) = αi (α0 − αi) / [α0^2 (α0 + 1)].',
      '2 × 8 / (100 × 11) = 16/1100 ≈ 0.01455.',
      'Final answer: 0.01455.',
    ]),
    P('dir-04', 'The X1 margin is Beta(2, 8). Find P(X1 ≤ 0.30).', '0.8040', [
      'Identify X1 ~ Beta(α1 = 2, α2 + α3 = 8).',
      'P(X1 ≤ 0.30) = I_{0.30}(2, 8).',
      'Incomplete beta ≈ 0.8040.',
      'Final answer: 0.8040.',
    ]),
    P('dir-05', 'For that same X1 ~ Beta(2, 8) margin, find P(X1 > 0.40).', '0.07054', [
      'Identify X1 ~ Beta(2, 8).',
      'P(X1 > 0.40) = 1 − I_{0.40}(2, 8).',
      '1 − 0.92946 ≈ 0.07054.',
      'Final answer: 0.07054.',
    ]),
  ],

  empirical: [
    P('emp-01', 'Seven quiz scores are listed: 12, 15, 15, 18, 21, 24, 30. Find the sample mean.', '19.29', [
      'Use the listed sample as the empirical distribution (no parametric family).',
      'Mean = (sum of values) / n.',
      '12 + 15 + 15 + 18 + 21 + 24 + 30 = 135, n = 7, so 135/7 ≈ 19.2857.',
      'Final answer: 19.29.',
    ]),
    P('emp-02', 'For the scores 12, 15, 15, 18, 21, 24, 30, find the median.', '18', [
      'Sort the seven values: 12, 15, 15, 18, 21, 24, 30.',
      'For odd n, the median is the middle (4th) observation.',
      'The 4th value is 18.',
      'Final answer: 18.',
    ]),
    P('emp-03', 'Using those seven scores, find the empirical F_n(18) = P̂(X ≤ 18).', '0.5714', [
      'Empirical CDF: F_n(x) = (number of observations ≤ x) / n.',
      'Values ≤ 18: 12, 15, 15, 18 — four of seven.',
      '4/7 ≈ 0.5714.',
      'Final answer: 0.5714.',
    ]),
    P('emp-04', 'For the same list, what proportion of scores is strictly greater than 20?', '0.4286', [
      'Count observations > 20: 21, 24, 30 — three scores.',
      'Proportion = 3/7.',
      '3/7 ≈ 0.4286.',
      'Final answer: 0.4286.',
    ]),
    P('emp-05', 'For those seven scores, find the empirical P̂(X ≥ 15).', '0.8571', [
      'Count observations ≥ 15: all except 12 — six scores.',
      '6/7 ≈ 0.8571.',
      'The empirical probability is the relative frequency.',
      'Final answer: 0.8571.',
    ]),
  ],
}

export function getDistributionPractice(id: DistributionId): PracticeProblem[] {
  return DISTRIBUTION_PRACTICE[id] ?? []
}

