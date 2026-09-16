import type { DistributionId } from './distributions'

export type ExperimentKind =
  | 'token-trial'
  | 'discrete-pmf'
  | 'waiting-sequence'
  | 'without-replacement'
  | 'poisson-timeline'
  | 'zero-inflation'
  | 'interval-area'
  | 'bell-rule'
  | 'z-score'
  | 'log-transform'
  | 'memoryless'
  | 'sum-of-waits'
  | 'bayesian-beta'
  | 'chi-square-squares'
  | 'tail-compare'
  | 'variance-ratio'
  | 'weibull-lifetime'
  | 'pareto-share'
  | 'cauchy-mean'
  | 'logistic-threshold'
  | 'skew-slider'
  | 'laplace-loss'
  | 'extreme-value'
  | 'first-passage'
  | 'stretched-beta'
  | 'mixture'
  | 'multinomial'
  | 'dirichlet-simplex'
  | 'empirical-fit'

export type SampleViz = 'tokens' | 'histogram' | 'events' | 'simplex' | 'sequence' | 'particles' | 'failures'

export type DistPreset = { id: string; label: string; params: Record<string, number> }

export type DistributionExperience = {
  id: DistributionId
  scenarioTitle: string
  scenarioDescription: string
  learningGoal: string
  datasetLabel: string
  datasetHint: string
  experiment: ExperimentKind
  sampleViz: SampleViz
  successLabel?: string
  failureLabel?: string
  categoryLabels?: string[]
  presets?: DistPreset[]
  insights: string[]
  comparisonIds: DistributionId[]
}

const E = (row: DistributionExperience) => row

export const DISTRIBUTION_EXPERIENCES: Record<DistributionId, DistributionExperience> = {
  bernoulli: E({
    id: 'bernoulli',
    scenarioTitle: 'Single product quality inspection',
    scenarioDescription: 'Each finished unit is independently graded Pass or Fail. One inspection is one Bernoulli trial.',
    learningGoal: 'See a single yes/no trial, then watch the empirical pass rate converge to p.',
    datasetLabel: 'Quality inspection log',
    datasetHint: 'Pass / Fail tokens from a production line.',
    experiment: 'token-trial',
    sampleViz: 'tokens',
    successLabel: 'Pass',
    failureLabel: 'Fail',
    insights: [
      'One trial, two outcomes. The mean is just p.',
      'Variance p(1−p) is largest when the line is fairest (p = 0.5).',
      'Repeating this trial is how binomial, geometric, and negative binomial models start.',
    ],
    comparisonIds: ['binomial', 'geometric'],
  }),
  binomial: E({
    id: 'binomial',
    scenarioTitle: 'Defective microchips in a batch of 20',
    scenarioDescription: 'Inspect n independent chips. Each is defective with probability p. X is the number of defectives.',
    learningGoal: 'Read a PMF from 0 to n and shade exact, left-tail, right-tail, or interval probabilities.',
    datasetLabel: 'Chip inspection batches',
    datasetHint: 'Counts of defectives per tray of n chips.',
    experiment: 'discrete-pmf',
    sampleViz: 'histogram',
    insights: [
      'n is fixed in advance. That is the difference from waiting-time models.',
      'Mean np and variance np(1−p).',
      'Large n and moderate p make a normal curve a useful overlay.',
    ],
    comparisonIds: ['bernoulli', 'poisson', 'hypergeometric'],
  }),
  geometric: E({
    id: 'geometric',
    scenarioTitle: 'Sales calls until the first sale',
    scenarioDescription: 'Each independent call succeeds with probability p. X is the call number of the first success.',
    learningGoal: 'Watch Fail → Fail → Success and connect that path to a decreasing PMF.',
    datasetLabel: 'First-sale call logs',
    datasetHint: 'Number of dials until the first conversion.',
    experiment: 'waiting-sequence',
    sampleViz: 'sequence',
    successLabel: 'Sale',
    failureLabel: 'No sale',
    insights: [
      'X counts trials until the FIRST success, starting at 1.',
      'Memoryless: past failures do not change p on the next call.',
      'Expected wait is 1/p.',
    ],
    comparisonIds: ['negative_binomial', 'bernoulli', 'exponential'],
  }),
  negative_binomial: E({
    id: 'negative_binomial',
    scenarioTitle: 'Calls until 5 successful sales',
    scenarioDescription: 'Keep calling until r conversions. X is the number of failures before that r-th success.',
    learningGoal: 'See the geometric as the r = 1 case, then watch extra spread when the stopping rule is r > 1.',
    datasetLabel: 'Quota call logs',
    datasetHint: 'Failures accumulated before r sales.',
    experiment: 'waiting-sequence',
    sampleViz: 'sequence',
    successLabel: 'Sale',
    failureLabel: 'No sale',
    insights: [
      'Stop at the r-th success, not the first.',
      'Variance exceeds a Poisson with the same mean when counts clump.',
      'Geometric is this model with r = 1 (on the trial-count scale).',
    ],
    comparisonIds: ['geometric', 'poisson', 'zinb'],
  }),
  hypergeometric: E({
    id: 'hypergeometric',
    scenarioTitle: 'Warehouse lot inspection without replacement',
    scenarioDescription: 'A finite batch of N units holds K defectives. Draw n units and do not put them back.',
    learningGoal: 'See the remaining mix change after every draw. Dependence is the point.',
    datasetLabel: 'Finite batch audit',
    datasetHint: 'Defectives found in samples drawn without replacement.',
    experiment: 'without-replacement',
    sampleViz: 'tokens',
    insights: [
      'WITHOUT REPLACEMENT: each draw changes the urn.',
      'Variance is smaller than a matching binomial (finite-population correction).',
      'If N is huge relative to n, a binomial approximation becomes reasonable.',
    ],
    comparisonIds: ['binomial', 'multinomial'],
  }),
  poisson: E({
    id: 'poisson',
    scenarioTitle: 'Café arrivals in a 10-minute window',
    scenarioDescription: 'Customers arrive independently at average rate λ per interval. X is the count in that window.',
    learningGoal: 'Scatter events on a timeline, then match the count to the Poisson PMF.',
    datasetLabel: 'Café arrival ticks',
    datasetHint: 'Counts per 10-minute slice.',
    experiment: 'poisson-timeline',
    sampleViz: 'events',
    presets: [
      { id: 'cafe', label: 'Café arrivals', params: { lambda: 4 } },
      { id: 'web', label: 'Website requests', params: { lambda: 12 } },
      { id: 'traffic', label: 'Traffic incidents', params: { lambda: 0.8 } },
      { id: 'tickets', label: 'Support tickets', params: { lambda: 3 } },
    ],
    insights: [
      'Mean equals variance: both are λ.',
      'A binomial with large n and tiny p looks Poisson with λ = np.',
      'Gaps between events are exponential.',
    ],
    comparisonIds: ['binomial', 'exponential', 'zip'],
  }),
  discrete_uniform: E({
    id: 'discrete_uniform',
    scenarioTitle: 'Fair die / random integer generator',
    scenarioDescription: 'Every integer from a through b is equally likely — a fair die when a = 1 and b = 6.',
    learningGoal: 'Roll repeatedly and watch empirical frequencies flatten toward 1/(b−a+1).',
    datasetLabel: 'Die rolls',
    datasetHint: 'Integer outcomes from a fair generator.',
    experiment: 'discrete-pmf',
    sampleViz: 'histogram',
    insights: [
      'All bars start at the same height. That is the model.',
      'The mean is the midpoint (a+b)/2.',
      'Uneven frequencies in a short run are sampling noise, not bias.',
    ],
    comparisonIds: ['continuous_uniform', 'bernoulli', 'multinomial'],
  }),
  zip: E({
    id: 'zip',
    scenarioTitle: 'Daily insurance claims with structural zeros',
    scenarioDescription: 'Some days cannot produce a claim at all. Other days follow a Poisson count process.',
    learningGoal: 'Separate a structural zero from a Poisson-generated zero, then compare ZIP with Poisson.',
    datasetLabel: 'Daily claim counts',
    datasetHint: 'Many exact zeros plus a thin tail of claims.',
    experiment: 'zero-inflation',
    sampleViz: 'histogram',
    insights: [
      'π is the chance the count process is switched off.',
      'A Poisson zero and a structural zero look the same in the data — the model keeps them distinct.',
      'Mean is (1−π)λ, smaller than a plain Poisson with the same λ.',
    ],
    comparisonIds: ['poisson', 'zinb', 'negative_binomial'],
  }),
  zinb: E({
    id: 'zinb',
    scenarioTitle: 'Hospital visits with extra zeros and clumping',
    scenarioDescription: 'Visit counts have more zeros than a Poisson allows, and the positive counts are overdispersed.',
    learningGoal: 'Compare Poisson, NB, ZIP, and ZINB on the same synthetic visit histogram.',
    datasetLabel: 'Visit counts',
    datasetHint: 'Excess zeros plus a heavy count tail.',
    experiment: 'zero-inflation',
    sampleViz: 'histogram',
    insights: [
      'ZIP handles extra zeros; ZINB also lets the positive counts spread out.',
      'If variance still exceeds the ZIP mean, move to ZINB.',
      'π is still the structural-zero switch.',
    ],
    comparisonIds: ['negative_binomial', 'zip', 'poisson'],
  }),
  continuous_uniform: E({
    id: 'continuous_uniform',
    scenarioTitle: 'Bus arriving anytime in the next 15 minutes',
    scenarioDescription: 'The arrival is equally likely anywhere on [a, b]. Probability is literally the width of the wait you mark.',
    learningGoal: 'Drag an interval on a flat density and see that probability equals area of a rectangle.',
    datasetLabel: 'Bus wait times',
    datasetHint: 'Continuous arrival times inside a known window.',
    experiment: 'interval-area',
    sampleViz: 'histogram',
    insights: [
      'The density is a rectangle of height 1/(b−a).',
      'P(c ≤ X ≤ d) = (d−c)/(b−a).',
      'The mean is the midpoint of the window.',
    ],
    comparisonIds: ['discrete_uniform', 'beta', 'exponential'],
  }),
  normal: E({
    id: 'normal',
    scenarioTitle: 'Adult heights / manufactured dimensions',
    scenarioDescription: 'Measurements cluster around a target μ with spread σ. The bell is the working model.',
    learningGoal: 'Move μ and σ, toggle the 68–95–99.7 rule, and overlay a sample histogram.',
    datasetLabel: 'Height sample',
    datasetHint: 'Adult stature in centimetres.',
    experiment: 'bell-rule',
    sampleViz: 'histogram',
    insights: [
      'μ slides the bell; σ stretches it.',
      '68 / 95 / 99.7 percent sit within 1 / 2 / 3 standard deviations.',
      'Averages of many independent pieces become more normal (CLT).',
    ],
    comparisonIds: ['standard_normal', 'student_t', 'skew_normal', 'cauchy'],
  }),
  standard_normal: E({
    id: 'standard_normal',
    scenarioTitle: 'Standardized exam results',
    scenarioDescription: 'A raw score becomes a z-score, then a tail probability on N(0, 1).',
    learningGoal: 'Convert raw → z → probability. This is not just another Normal page.',
    datasetLabel: 'Exam z-scores',
    datasetHint: 'Standardized test results.',
    experiment: 'z-score',
    sampleViz: 'histogram',
    insights: [
      'z = (x − μ)/σ puts every normal on the same axis.',
      'Left, right, between, and two-tail are all Φ arithmetic.',
      'x = μ + zσ returns to the original units.',
    ],
    comparisonIds: ['normal', 'student_t'],
  }),
  lognormal: E({
    id: 'lognormal',
    scenarioTitle: 'Customer spending / task completion time',
    scenarioDescription: 'Positive, right-skewed amounts whose logarithms look normal.',
    learningGoal: 'Toggle X-space versus ln(X)-space and watch the skew become a bell.',
    datasetLabel: 'Transaction amounts',
    datasetHint: 'Positive spend values with a long right tail.',
    experiment: 'log-transform',
    sampleViz: 'histogram',
    insights: [
      'If ln X is normal, X is lognormal.',
      'μ and σ live on the log scale, not the rupee/dollar scale.',
      'Means on X are pulled by the tail; medians stay closer to typical spend.',
    ],
    comparisonIds: ['normal', 'gamma', 'pareto'],
  }),
  exponential: E({
    id: 'exponential',
    scenarioTitle: 'Waiting time until the next server failure',
    scenarioDescription: 'Failures arrive as a memoryless process with rate λ. X is the wait from now.',
    learningGoal: 'Prove memoryless: after surviving 5 hours, the remaining wait still looks exponential.',
    datasetLabel: 'Time-to-failure logs',
    datasetHint: 'Hours until the next incident.',
    experiment: 'memoryless',
    sampleViz: 'events',
    insights: [
      'P(X > t) = e^{−λt}. The density starts high and decays.',
      'Memoryless: P(X > s+t | X > s) = P(X > t).',
      'This is the gap time of a Poisson process and the Weibull k = 1 case.',
    ],
    comparisonIds: ['gamma', 'weibull', 'poisson'],
  }),
  gamma: E({
    id: 'gamma',
    scenarioTitle: 'Total wait until the 5th event',
    scenarioDescription: 'Independent exponential waits add up. Their sum is gamma (Erlang when the shape is an integer).',
    learningGoal: 'Generate k exponential pieces and watch them stack into one gamma draw.',
    datasetLabel: 'Multi-event waits',
    datasetHint: 'Time until the k-th arrival.',
    experiment: 'sum-of-waits',
    sampleViz: 'histogram',
    insights: [
      'Integer shape k: T = E₁ + … + Eₖ with each Eᵢ exponential.',
      'Mean is shape × scale; variance is shape × scale².',
      'Chi-square is a gamma with scale 2.',
    ],
    comparisonIds: ['exponential', 'chi_square', 'weibull'],
  }),
  beta: E({
    id: 'beta',
    scenarioTitle: 'Unknown click-through probability',
    scenarioDescription: 'A CTR lives on (0, 1). Start with a Beta prior, watch successes and failures update the posterior.',
    learningGoal: 'Prior → data → posterior on the same [0, 1] axis.',
    datasetLabel: 'Ad click trials',
    datasetHint: 'Success / failure counts for a banner.',
    experiment: 'bayesian-beta',
    sampleViz: 'histogram',
    insights: [
      'Support is strictly (0, 1) — probabilities and proportions.',
      'Beta is conjugate for Bernoulli/binomial: posterior stays Beta.',
      'α and β tilt the curve toward 1 or 0.',
    ],
    comparisonIds: ['stretched_beta', 'dirichlet', 'binomial'],
  }),
  chi_square: E({
    id: 'chi_square',
    scenarioTitle: 'Sum of squared standard normals',
    scenarioDescription: 'Draw Z₁…Zₖ ~ N(0,1), square them, and add. That total is χ² with k degrees of freedom.',
    learningGoal: 'See each Z² tile accumulate, then read a right-tail rejection region.',
    datasetLabel: 'Squared residuals',
    datasetHint: 'Goodness-of-fit pieces and variance terms.',
    experiment: 'chi-square-squares',
    sampleViz: 'histogram',
    insights: [
      'χ²(ν) = Z₁² + … + Zν² for independent standard normals.',
      'Mean is ν; variance is 2ν. Small ν is very skewed.',
      't and F are built from chi-square pieces.',
    ],
    comparisonIds: ['gamma', 'student_t', 'f'],
  }),
  student_t: E({
    id: 'student_t',
    scenarioTitle: 'Mean from a small sample when σ is unknown',
    scenarioDescription: 'Replace σ with s and the standardized mean grows heavier tails than z.',
    learningGoal: 'Overlay t and N(0,1). Raise df and watch t approach the normal.',
    datasetLabel: 'Small-sample measurements',
    datasetHint: 'n ≈ 8 laboratory replicates.',
    experiment: 'tail-compare',
    sampleViz: 'histogram',
    insights: [
      'Heavier tails than normal — extreme t values are more plausible.',
      'As ν → ∞, t → N(0, 1).',
      'Variance exists only for ν > 2, which is why small-n intervals are wider.',
    ],
    comparisonIds: ['normal', 'cauchy', 'chi_square'],
  }),
  f: E({
    id: 'f',
    scenarioTitle: 'Two production lines, two sample variances',
    scenarioDescription: 'F is a scaled ratio of two chi-square variables — the ANOVA and equal-variance statistic.',
    learningGoal: 'Draw two samples, form s₁²/s₂², and place that ratio on the F curve.',
    datasetLabel: 'Line A vs line B spreads',
    datasetHint: 'Paired variance estimates from two processes.',
    experiment: 'variance-ratio',
    sampleViz: 'histogram',
    insights: [
      'Supported on (0, ∞) and right-skewed.',
      'df1 and df2 are numerator and denominator degrees of freedom.',
      'ANOVA model comparison uses this same family.',
    ],
    comparisonIds: ['chi_square', 'student_t'],
  }),
  weibull: E({
    id: 'weibull',
    scenarioTitle: 'Machine component lifetime',
    scenarioDescription: 'Shape k decides infant mortality, random failures, or wear-out. Scale stretches time.',
    learningGoal: 'Switch PDF / survival / hazard and run a failure-over-time animation.',
    datasetLabel: 'Lifetime hours',
    datasetHint: 'Time-to-failure for a fleet of parts.',
    experiment: 'weibull-lifetime',
    sampleViz: 'failures',
    presets: [
      { id: 'infant', label: 'Infant mortality (k < 1)', params: { shape: 0.6, scale: 8 } },
      { id: 'random', label: 'Random failures (k = 1)', params: { shape: 1, scale: 8 } },
      { id: 'wear', label: 'Wear-out (k > 1)', params: { shape: 2.4, scale: 8 } },
    ],
    insights: [
      'k < 1: falling hazard. k = 1: exponential. k > 1: wear-out.',
      'Survival is 1 − CDF. Hazard is f / S.',
      'Weibull is a workhorse reliability model.',
    ],
    comparisonIds: ['exponential', 'gamma', 'gumbel'],
  }),
  pareto: E({
    id: 'pareto',
    scenarioTitle: 'Wealth, claims, and heavy-tailed spend',
    scenarioDescription: 'Most values hug the minimum; a few huge ones dominate the total.',
    learningGoal: 'Use a cumulative-share slider (top 20%, 10%, …) — not just a curve shape.',
    datasetLabel: 'Claim severity / spend',
    datasetHint: 'Positive amounts with a power-law tail.',
    experiment: 'pareto-share',
    sampleViz: 'histogram',
    insights: [
      'Power-law tail: a few observations own most of the total.',
      'If α ≤ 1 the mean is infinite; if α ≤ 2 the variance is infinite.',
      'Averages can mislead — look at shares and quantiles.',
    ],
    comparisonIds: ['lognormal', 'weibull'],
  }),
  cauchy: E({
    id: 'cauchy',
    scenarioTitle: 'Ratio of two independent standard normals',
    scenarioDescription: 'The sample mean of Cauchy draws refuses to settle. A normal mean does.',
    learningGoal: 'Run paired running means: Normal stabilizes, Cauchy keeps jumping. No finite mean.',
    datasetLabel: 'Ratio samples',
    datasetHint: 'Z₁/Z₂ draws and a matching normal control.',
    experiment: 'cauchy-mean',
    sampleViz: 'histogram',
    insights: [
      'Tails are so heavy the mean and variance do not exist.',
      'The sample average is not a consistent estimator of location.',
      'Location is the median; do not quote a Cauchy mean.',
    ],
    comparisonIds: ['student_t', 'normal'],
  }),
  logistic: E({
    id: 'logistic',
    scenarioTitle: 'Latent score and a binary decision',
    scenarioDescription: 'A hidden score plus a threshold becomes a yes/no through the logistic CDF (sigmoid).',
    learningGoal: 'Drag the threshold and read P(Y = 1) — the logistic-regression link.',
    datasetLabel: 'Latent scores',
    datasetHint: 'Continuous scores mapped to approve / reject.',
    experiment: 'logistic-threshold',
    sampleViz: 'histogram',
    insights: [
      'PDF is a symmetric bell; CDF is the sigmoid.',
      'P(Y = 1 | score) = F(score) under a logistic error story.',
      'Slightly heavier tails than a matching normal.',
    ],
    comparisonIds: ['normal', 'student_t'],
  }),
  skew_normal: E({
    id: 'skew_normal',
    scenarioTitle: 'Measurements with a one-sided lean',
    scenarioDescription: 'Almost normal, but systematically skewed. α is the slant.',
    learningGoal: 'Drag α from left-skew through normal to right-skew against a Normal overlay.',
    datasetLabel: 'Asymmetric measurements',
    datasetHint: 'Process data with a consistent tail.',
    experiment: 'skew-slider',
    sampleViz: 'histogram',
    insights: [
      'α = 0 recovers the ordinary normal.',
      'Mean, median, and mode split apart when α ≠ 0.',
      'Use this before jumping to a fully different family.',
    ],
    comparisonIds: ['normal', 'mixture_normal'],
  }),
  laplace: E({
    id: 'laplace',
    scenarioTitle: 'Prediction residuals and L1 loss',
    scenarioDescription: 'Errors with a sharp peak and exponential tails. Laplace ↔ absolute error; Normal ↔ squared error.',
    learningGoal: 'Compare Laplace and Normal residuals and connect the peak to L1 versus L2.',
    datasetLabel: 'Model residuals',
    datasetHint: 'Signed prediction errors.',
    experiment: 'laplace-loss',
    sampleViz: 'histogram',
    insights: [
      'Sharp peak at the median; exponential tails.',
      'MLE location is the sample median (L1).',
      'Normal MLE location is the sample mean (L2).',
    ],
    comparisonIds: ['normal', 'student_t'],
  }),
  gumbel: E({
    id: 'gumbel',
    scenarioTitle: 'Annual maximum rainfall',
    scenarioDescription: 'Generate a year of daily values, keep the maximum, repeat. Block maxima follow Gumbel (GEV shape 0).',
    learningGoal: 'Build an empirical distribution of yearly maxima, then overlay the Gumbel curve.',
    datasetLabel: 'Yearly maxima',
    datasetHint: 'Block maxima of daily rainfall.',
    experiment: 'extreme-value',
    sampleViz: 'histogram',
    insights: [
      'This is an extreme-value distribution for maxima.',
      'Minima use a reflected Gumbel.',
      'Location and scale fit the typical size of the annual maximum.',
    ],
    comparisonIds: ['weibull', 'pareto'],
  }),
  inverse_gaussian: E({
    id: 'inverse_gaussian',
    scenarioTitle: 'First passage to a threshold',
    scenarioDescription: 'A particle drifts toward a barrier with noise. The hitting time is inverse Gaussian (Wald).',
    learningGoal: 'Watch particles hit the threshold and histogram the hitting times.',
    datasetLabel: 'Threshold response times',
    datasetHint: 'First-passage times with drift.',
    experiment: 'first-passage',
    sampleViz: 'particles',
    insights: [
      'Positive, right-skewed hitting times.',
      'μ is the typical passage time; λ concentrates paths around it.',
      'A cousin of gamma and lognormal for positive durations.',
    ],
    comparisonIds: ['gamma', 'lognormal'],
  }),
  stretched_beta: E({
    id: 'stretched_beta',
    scenarioTitle: 'Battery efficiency between 70% and 100%',
    scenarioDescription: 'A Beta(α, β) on (0, 1) is stretched onto [a, b]. Hard bounds, flexible shape.',
    learningGoal: 'See the unit beta and the stretched copy side by side.',
    datasetLabel: 'Bounded efficiency',
    datasetHint: 'Values confined to a physical interval.',
    experiment: 'stretched-beta',
    sampleViz: 'histogram',
    insights: [
      'Y = a + (b−a)X with X ~ Beta(α, β).',
      'No probability outside [a, b].',
      'Mean and variance scale with the length (b−a).',
    ],
    comparisonIds: ['beta'],
  }),
  mixture_normal: E({
    id: 'mixture_normal',
    scenarioTitle: 'Two customer segments in one histogram',
    scenarioDescription: 'Two normal subgroups with a shared sd and weight π. Move the means and watch unimodal → shoulder → bimodal.',
    learningGoal: 'See component curves, the mixture, and points coloured by latent group.',
    datasetLabel: 'Two-process measurements',
    datasetHint: 'A blend of two hidden populations.',
    experiment: 'mixture',
    sampleViz: 'histogram',
    insights: [
      'Far-apart means create two modes; overlap hides them.',
      'π is the mixing weight of component 1.',
      'A single normal cannot capture this shoulder or second peak.',
    ],
    comparisonIds: ['normal', 'skew_normal'],
  }),
  multinomial: E({
    id: 'multinomial',
    scenarioTitle: '100 customers choose a plan',
    scenarioDescription: 'Each customer independently picks Basic, Pro, or Enterprise. Counts share the same n.',
    learningGoal: 'Assign customers live and read the count vector. Bernoulli → binomial → multinomial.',
    datasetLabel: 'Plan choice counts',
    datasetHint: 'Category counts from n independent customers.',
    experiment: 'multinomial',
    sampleViz: 'tokens',
    categoryLabels: ['Basic', 'Pro', 'Enterprise'],
    insights: [
      'Each margin is binomial; counts are negatively dependent.',
      'p1 + p2 + p3 = 1.',
      'Dirichlet is the usual prior on those probabilities.',
    ],
    comparisonIds: ['binomial', 'dirichlet'],
  }),
  dirichlet: E({
    id: 'dirichlet',
    scenarioTitle: 'Uncertainty about market shares',
    scenarioDescription: 'Random probability vectors (p1, p2, p3) that sum to 1. The natural picture is a triangle, not a line.',
    learningGoal: 'Drop samples on a ternary simplex and change concentration with the α knobs.',
    datasetLabel: 'Share compositions',
    datasetHint: 'Points on the probability simplex.',
    experiment: 'dirichlet-simplex',
    sampleViz: 'simplex',
    presets: [
      { id: 'flat', label: 'α = (1,1,1)', params: { a1: 1, a2: 1, a3: 1 } },
      { id: 'center', label: 'Concentrated centre', params: { a1: 8, a2: 8, a3: 8 } },
      { id: 'corner', label: 'Corner-seeking', params: { a1: 0.3, a2: 0.3, a3: 0.3 } },
      { id: 'asymm', label: 'Asymmetric', params: { a1: 8, a2: 2, a3: 1 } },
    ],
    insights: [
      'A draw is a composition, not a scalar.',
      'Large equal α pack points in the centre; α < 1 push to corners.',
      'Conjugate prior for multinomial probabilities.',
    ],
    comparisonIds: ['beta', 'multinomial'],
  }),
  empirical: E({
    id: 'empirical',
    scenarioTitle: 'Let the observed sample speak',
    scenarioDescription: 'No named family. Switch among built-in samples and overlay candidate curves. Fit is descriptive, not a proof.',
    learningGoal: 'Compare histogram / ECDF against Normal, Lognormal, Gamma, and Weibull overlays.',
    datasetLabel: 'Observed sample',
    datasetHint: 'Pick a built-in series or think of a workbench column.',
    experiment: 'empirical-fit',
    sampleViz: 'histogram',
    insights: [
      'The eCDF puts mass 1/n on each observation.',
      'Overlays are visual candidates — confirm with a proper GOF test before claiming a fit.',
      'Workbench columns can replace these teaching samples later.',
    ],
    comparisonIds: ['normal', 'lognormal', 'gamma', 'weibull'],
  }),
}

export function getDistributionExperience(id: DistributionId): DistributionExperience {
  return DISTRIBUTION_EXPERIENCES[id]
}

export const EMPIRICAL_PRESETS: Record<string, { label: string; values: number[] }> = {
  exams: { label: 'Exam scores', values: [52, 58, 61, 63, 67, 70, 71, 72, 74, 75, 76, 78, 79, 81, 82, 84, 86, 88, 91, 94] },
  salaries: { label: 'Salaries (k)', values: [28, 31, 33, 36, 38, 41, 44, 47, 52, 58, 64, 71, 80, 95, 120, 155] },
  rainfall: { label: 'Rainfall (mm)', values: [0, 0, 0.4, 1.2, 2, 3.1, 4.8, 6, 8.2, 11, 14, 19, 27, 41] },
  latency: { label: 'Server latency (ms)', values: [40, 42, 45, 48, 51, 55, 61, 70, 88, 120, 180, 240] },
  tolerances: { label: 'Manufacturing (mm)', values: [9.92, 9.95, 9.97, 9.99, 10, 10.01, 10.02, 10.04, 10.06, 10.11] },
  claims: { label: 'Insurance claims', values: [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 5, 8, 14] },
  spend: { label: 'Customer spend', values: [12, 15, 18, 21, 24, 29, 36, 48, 70, 110, 180] },
  waits: { label: 'Hospital waits (min)', values: [8, 11, 13, 16, 19, 22, 28, 35, 47, 62] },
}
