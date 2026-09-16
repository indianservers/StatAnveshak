export type StudioCategoryId = 'foundations' | 'inference' | 'modeling' | 'advanced'

export type StudioLevel = 'intro' | 'core' | 'advanced'

export type StudioIconId =
  | 'dice'
  | 'randomVariables'
  | 'descriptive'
  | 'sampling'
  | 'clt'
  | 'interval'
  | 'hypothesis'
  | 'bayes'
  | 'correlation'
  | 'regression'
  | 'anova'
  | 'timeSeries'
  | 'ranks'
  | 'survival'
  | 'multivariate'
  | 'simulation'
  | 'quality'
  | 'distributions'

export type StudioAccent =
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'lime'

export type StudioLab = {
  slug: string
  title: string
  summary: string
  concepts: string[]
  level: StudioLevel
}

export type Studio = {
  slug: string
  title: string
  shortTitle: string
  category: StudioCategoryId
  tagline: string
  summary: string
  icon: StudioIconId
  accent: StudioAccent
  labs: StudioLab[]
}

export type StudioCategory = {
  id: StudioCategoryId
  title: string
  blurb: string
}

export const STUDIOS_ROOT = '/statistics'

export const STUDIO_CATEGORIES: StudioCategory[] = [
  { id: 'foundations', title: 'Foundations', blurb: 'Build your core understanding of probability and data.' },
  { id: 'inference', title: 'Inference', blurb: 'Learn how to make conclusions from data.' },
  { id: 'modeling', title: 'Modeling & Prediction', blurb: 'Find patterns, make predictions, and quantify relationships.' },
  { id: 'advanced', title: 'Advanced & Applied', blurb: 'Explore specialized topics and real-world applications.' },
]

/**
 * The Distributions Studio is an existing, fully built page. It is surfaced here as a
 * featured entry only — `path` points at the live implementation and no landing page or
 * lab routes are generated for it.
 */
export const FEATURED_STUDIO = {
  slug: 'distributions',
  title: 'Distributions Studio',
  path: '/distributions',
  tagline: 'Explore the most important probability distributions with interactive visuals and real data examples.',
  labCount: 6,
  conceptCount: 20,
  highlight: 'Interactive simulations',
  icon: 'distributions' as StudioIconId,
}

export const STATISTICS_STUDIOS: Studio[] = [
  {
    slug: 'probability-foundations',
    title: 'Probability Foundations',
    shortTitle: 'Probability',
    category: 'foundations',
    tagline: 'Build intuition from events to conditional probability.',
    summary:
      'Start from outcomes and events, then build up the rules that let you combine, restrict, and update probabilities.',
    icon: 'dice',
    accent: 'rose',
    labs: [
      {
        slug: 'sample-space-events',
        title: 'Sample Space & Events',
        summary: 'List every outcome of an experiment and group those outcomes into events.',
        concepts: ['outcomes', 'simple events', 'compound events', 'sample space'],
        level: 'intro',
      },
      {
        slug: 'set-operations',
        title: 'Set Operations in Probability',
        summary: 'Combine events using union, intersection, complement, and difference.',
        concepts: ['union', 'intersection', 'complement', 'difference', 'De Morgan’s laws'],
        level: 'intro',
      },
      {
        slug: 'probability-rules',
        title: 'Probability Rules',
        summary: 'Apply the addition, multiplication, and complement rules to compound events.',
        concepts: ['addition rule', 'multiplication rule', 'complement rule', 'inclusion-exclusion'],
        level: 'intro',
      },
      {
        slug: 'conditional-probability',
        title: 'Conditional Probability',
        summary: 'Shrink the sample space to what you already know, then re-read the probability.',
        concepts: ['conditional probability', 'dependent events', 'restricted sample space'],
        level: 'core',
      },
      {
        slug: 'independence',
        title: 'Independence',
        summary: 'Check when knowing one event tells you nothing new about another.',
        concepts: ['independent events', 'mutually exclusive events', 'exhaustive events'],
        level: 'core',
      },
      {
        slug: 'bayes-theorem',
        title: 'Bayes’ Theorem',
        summary: 'Reverse a conditional probability using prior, likelihood, and evidence.',
        concepts: ['prior', 'likelihood', 'posterior', 'Bayes updating'],
        level: 'core',
      },
      {
        slug: 'law-of-total-probability',
        title: 'Law of Total Probability',
        summary: 'Split a probability across a partition of the sample space and recombine it.',
        concepts: ['partition', 'exhaustive events', 'weighted average'],
        level: 'core',
      },
      {
        slug: 'counting-techniques',
        title: 'Counting Techniques',
        summary: 'Count arrangements and selections before you assign any probability.',
        concepts: ['permutations', 'combinations', 'factorial'],
        level: 'core',
      },
      {
        slug: 'probability-tree-venn',
        title: 'Probability Tree & Venn',
        summary: 'Draw the same problem two ways: branching paths and overlapping areas.',
        concepts: ['tree diagrams', 'Venn probability', 'branch multiplication'],
        level: 'intro',
      },
    ],
  },
  {
    slug: 'random-variables',
    title: 'Random Variables',
    shortTitle: 'Random variables',
    category: 'foundations',
    tagline: 'From discrete outcomes to continuous random variables.',
    summary:
      'Turn outcomes into numbers, then describe those numbers with mass, density, moments, and joint behaviour.',
    icon: 'randomVariables',
    accent: 'indigo',
    labs: [
      {
        slug: 'discrete-random-variables',
        title: 'Discrete Random Variables',
        summary: 'Assign probability mass across a countable set of values.',
        concepts: ['support', 'PMF', 'discrete outcomes'],
        level: 'intro',
      },
      {
        slug: 'continuous-random-variables',
        title: 'Continuous Random Variables',
        summary: 'Move from bars to density, where area — not height — is probability.',
        concepts: ['PDF', 'density', 'area under the curve'],
        level: 'core',
      },
      {
        slug: 'cdf-quantiles',
        title: 'CDF & Quantiles',
        summary: 'Read cumulative probability, then invert it to recover quantiles.',
        concepts: ['CDF', 'quantiles', 'percentiles'],
        level: 'core',
      },
      {
        slug: 'expectation-moments',
        title: 'Expectation & Moments',
        summary: 'Compute the long-run average and the higher moments taken around it.',
        concepts: ['expectation', 'moments', 'linearity of expectation'],
        level: 'core',
      },
      {
        slug: 'variance-standard-deviation',
        title: 'Variance & Standard Deviation',
        summary: 'Measure how far a random variable typically sits from its expected value.',
        concepts: ['variance', 'standard deviation', 'spread'],
        level: 'core',
      },
      {
        slug: 'skewness-kurtosis',
        title: 'Skewness & Kurtosis',
        summary: 'Describe asymmetry and tail weight beyond center and spread.',
        concepts: ['skewness', 'kurtosis', 'tail behaviour'],
        level: 'advanced',
      },
      {
        slug: 'transformations',
        title: 'Transformations of Random Variables',
        summary: 'See what happens to a distribution when you shift, scale, or reshape it.',
        concepts: ['transformations', 'change of variable', 'shift and scale'],
        level: 'advanced',
      },
      {
        slug: 'joint-marginal-conditional',
        title: 'Joint, Marginal & Conditional Distributions',
        summary: 'Hold two variables at once, then collapse or condition to read one of them.',
        concepts: ['joint distributions', 'marginalization', 'conditional distributions'],
        level: 'advanced',
      },
      {
        slug: 'covariance-correlation',
        title: 'Covariance & Correlation',
        summary: 'Quantify how two random variables move together, and when they do not.',
        concepts: ['covariance', 'correlation', 'independence'],
        level: 'core',
      },
    ],
  },
  {
    slug: 'descriptive-statistics',
    title: 'Descriptive Statistics',
    shortTitle: 'Descriptives',
    category: 'foundations',
    tagline: 'Summarize and visualize data effectively.',
    summary:
      'Describe a dataset honestly: where it sits, how far it spreads, what shape it takes, and which points stand apart.',
    icon: 'descriptive',
    accent: 'emerald',
    labs: [
      {
        slug: 'measures-of-center',
        title: 'Measures of Center',
        summary: 'Compare mean, median, and mode, and see when they disagree.',
        concepts: ['mean', 'median', 'mode', 'weighted mean'],
        level: 'intro',
      },
      {
        slug: 'measures-of-spread',
        title: 'Measures of Spread',
        summary: 'Quantify variability with range, variance, and standard deviation.',
        concepts: ['range', 'variance', 'standard deviation', 'coefficient of variation'],
        level: 'intro',
      },
      {
        slug: 'position-measures',
        title: 'Position Measures',
        summary: 'Locate a single observation inside the whole distribution.',
        concepts: ['quartiles', 'percentiles', 'deciles', 'z-score'],
        level: 'core',
      },
      {
        slug: 'five-number-summary',
        title: 'Five-Number Summary',
        summary: 'Compress a distribution into minimum, quartiles, median, and maximum.',
        concepts: ['five-number summary', 'quartiles', 'IQR'],
        level: 'intro',
      },
      {
        slug: 'data-visualization-basics',
        title: 'Data Visualization Basics',
        summary: 'Choose the chart that matches the variable type and the question.',
        concepts: ['histogram', 'bar chart', 'frequency polygon', 'dot plots'],
        level: 'intro',
      },
      {
        slug: 'distribution-shape',
        title: 'Distribution Shape',
        summary: 'Read symmetry, modality, and tail weight straight off the picture.',
        concepts: ['skewness', 'kurtosis', 'modality'],
        level: 'core',
      },
      {
        slug: 'box-plot-outliers',
        title: 'Box Plot & Outliers',
        summary: 'Build the box, set the fences, and decide which points are unusual.',
        concepts: ['box plot', 'IQR', 'outliers', 'fences'],
        level: 'core',
      },
      {
        slug: 'frequency-tables',
        title: 'Frequency Tables',
        summary: 'Count categories and convert counts into relative and cumulative shares.',
        concepts: ['frequency', 'relative frequency', 'cumulative frequency'],
        level: 'intro',
      },
      {
        slug: 'ecdf-stem-and-leaf',
        title: 'ECDF & Stem-and-Leaf',
        summary: 'Read percentiles directly, and keep the raw digits visible while you do it.',
        concepts: ['ECDF', 'stem-and-leaf', 'percentile reading'],
        level: 'core',
      },
    ],
  },
  {
    slug: 'sampling-methods',
    title: 'Sampling Methods',
    shortTitle: 'Sampling',
    category: 'foundations',
    tagline: 'From populations to samples and sampling strategies.',
    summary:
      'Decide who gets measured. Compare sampling designs and see how each one succeeds or introduces bias.',
    icon: 'sampling',
    accent: 'sky',
    labs: [
      {
        slug: 'population-vs-sample',
        title: 'Population vs Sample',
        summary: 'Separate the quantity you want from the quantity you can actually compute.',
        concepts: ['population', 'sample', 'parameter', 'statistic'],
        level: 'intro',
      },
      {
        slug: 'simple-random-sampling',
        title: 'Simple Random Sampling',
        summary: 'Give every unit in the frame the same chance of selection.',
        concepts: ['random sampling', 'equal probability', 'sampling frame'],
        level: 'intro',
      },
      {
        slug: 'stratified-sampling',
        title: 'Stratified Sampling',
        summary: 'Split the population into homogeneous strata, then sample inside each one.',
        concepts: ['strata', 'proportional allocation', 'homogeneous groups'],
        level: 'core',
      },
      {
        slug: 'cluster-sampling',
        title: 'Cluster Sampling',
        summary: 'Sample whole groups when reaching individuals is impractical.',
        concepts: ['clusters', 'multi-stage sampling', 'cost efficiency'],
        level: 'core',
      },
      {
        slug: 'systematic-sampling',
        title: 'Systematic Sampling',
        summary: 'Walk an ordered frame at a fixed interval, and watch for hidden periodicity.',
        concepts: ['systematic interval', 'periodicity', 'ordered frame'],
        level: 'core',
      },
      {
        slug: 'sampling-bias',
        title: 'Sampling Bias',
        summary: 'See how a sample can be large and still systematically wrong.',
        concepts: ['undercoverage', 'convenience bias', 'response bias'],
        level: 'core',
      },
      {
        slug: 'sampling-vs-nonsampling-error',
        title: 'Sampling Error vs Non-Sampling Error',
        summary: 'Distinguish error that shrinks with sample size from error that does not.',
        concepts: ['sampling error', 'non-sampling error', 'measurement error'],
        level: 'core',
      },
    ],
  },
  {
    slug: 'sampling-distributions-clt',
    title: 'Sampling Distributions & CLT',
    shortTitle: 'Sampling & CLT',
    category: 'inference',
    tagline: 'See how samples lead to stable patterns.',
    summary:
      'Watch a statistic become a random variable of its own, and see why its distribution tightens and turns normal.',
    icon: 'clt',
    accent: 'violet',
    labs: [
      {
        slug: 'sampling-distribution-of-the-mean',
        title: 'Sampling Distribution of the Mean',
        summary: 'Draw many samples and collect their means into a distribution.',
        concepts: ['repeated sampling', 'sample mean', 'sampling distribution'],
        level: 'core',
      },
      {
        slug: 'sampling-distribution-of-a-proportion',
        title: 'Sampling Distribution of a Proportion',
        summary: 'Repeat the same idea for a sample proportion instead of a mean.',
        concepts: ['sample proportion', 'repeated sampling', 'normal approximation'],
        level: 'core',
      },
      {
        slug: 'standard-error',
        title: 'Standard Error',
        summary: 'Measure the spread of a statistic, not the spread of the data.',
        concepts: ['standard error', 'sample size effect', 'precision'],
        level: 'core',
      },
      {
        slug: 'central-limit-theorem',
        title: 'Central Limit Theorem',
        summary: 'Start from a skewed population and watch the mean still turn normal.',
        concepts: ['convergence', 'normal approximation', 'non-normal populations'],
        level: 'core',
      },
      {
        slug: 'law-of-large-numbers',
        title: 'Law of Large Numbers',
        summary: 'Track a running average as it settles toward the population value.',
        concepts: ['convergence', 'long-run average', 'stability'],
        level: 'intro',
      },
      {
        slug: 'sampling-distribution-comparison',
        title: 'Sampling Distribution Comparison',
        summary: 'Place several sample sizes side by side and compare shape and spread.',
        concepts: ['sample size effect', 'shape comparison', 'spread'],
        level: 'core',
      },
      {
        slug: 'bootstrap-intuition',
        title: 'Bootstrap Intuition',
        summary: 'Resample the sample itself when the theory is hard to write down.',
        concepts: ['bootstrap resampling', 'resampling distribution', 'empirical uncertainty'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'estimation',
    title: 'Estimation',
    shortTitle: 'Estimation',
    category: 'inference',
    tagline: 'Estimate population parameters with honest uncertainty.',
    summary:
      'Produce a single best guess, then attach an interval that reports how precise that guess really is.',
    icon: 'interval',
    accent: 'teal',
    labs: [
      {
        slug: 'point-estimation',
        title: 'Point Estimation',
        summary: 'Compute a single best guess for a population parameter.',
        concepts: ['estimator', 'point estimate', 'sampling variability'],
        level: 'intro',
      },
      {
        slug: 'estimator-quality',
        title: 'Estimator Quality',
        summary: 'Compare estimators on bias, consistency, efficiency, and mean squared error.',
        concepts: ['bias', 'consistency', 'efficiency', 'MSE'],
        level: 'advanced',
      },
      {
        slug: 'confidence-interval-mean',
        title: 'Confidence Intervals for Mean',
        summary: 'Build z and t intervals and read what the confidence level means.',
        concepts: ['confidence level', 'z interval', 't interval'],
        level: 'core',
      },
      {
        slug: 'confidence-interval-proportion',
        title: 'Confidence Intervals for Proportion',
        summary: 'Interval-estimate a rate, and see where the approximation strains.',
        concepts: ['proportion interval', 'confidence level', 'normal approximation'],
        level: 'core',
      },
      {
        slug: 'confidence-interval-difference-of-means',
        title: 'Confidence Intervals for Difference of Means',
        summary: 'Estimate a gap between two groups and check whether it spans zero.',
        concepts: ['difference of means', 'pooled vs Welch', 'interval width'],
        level: 'core',
      },
      {
        slug: 'confidence-interval-difference-of-proportions',
        title: 'Confidence Intervals for Difference of Proportions',
        summary: 'Compare two rates with an interval instead of a single number.',
        concepts: ['difference of proportions', 'risk difference', 'confidence level'],
        level: 'core',
      },
      {
        slug: 'confidence-interval-variance',
        title: 'Confidence Interval for Variance',
        summary: 'Interval-estimate spread itself, using an asymmetric chi-square interval.',
        concepts: ['variance interval', 'chi-square distribution', 'asymmetry'],
        level: 'advanced',
      },
      {
        slug: 'margin-of-error',
        title: 'Margin of Error',
        summary: 'Separate the half-width of an interval from the estimate at its center.',
        concepts: ['margin of error', 'interval width', 'confidence level'],
        level: 'intro',
      },
      {
        slug: 'sample-size-determination',
        title: 'Sample Size Determination',
        summary: 'Work backwards from a precision target to the sample size it requires.',
        concepts: ['required sample size', 'precision target', 'planning'],
        level: 'core',
      },
    ],
  },
  {
    slug: 'hypothesis-testing',
    title: 'Hypothesis Testing',
    shortTitle: 'Hypothesis testing',
    category: 'inference',
    tagline: 'Test ideas with simulation, not just intuition.',
    summary:
      'State a claim, measure how surprising the data would be if it were true, and decide with known error rates.',
    icon: 'hypothesis',
    accent: 'rose',
    labs: [
      {
        slug: 'hypothesis-basics',
        title: 'Hypothesis Basics',
        summary: 'Write the null and alternative, and pick one or two tails deliberately.',
        concepts: ['null hypothesis', 'alternative hypothesis', 'one-tailed test', 'two-tailed test'],
        level: 'intro',
      },
      {
        slug: 'test-statistic-p-value',
        title: 'Test Statistic & p-Value',
        summary: 'Convert data into one number, then locate it on the null distribution.',
        concepts: ['test statistic', 'p-value', 'rejection region'],
        level: 'core',
      },
      {
        slug: 'errors-and-power',
        title: 'Errors & Power',
        summary: 'Trade Type I against Type II error and watch power respond.',
        concepts: ['Type I error', 'Type II error', 'power', 'significance level'],
        level: 'core',
      },
      {
        slug: 'z-test',
        title: 'z-Test',
        summary: 'Test a mean or proportion when the standard error is treated as known.',
        concepts: ['standard normal', 'known variance', 'large sample'],
        level: 'core',
      },
      {
        slug: 'one-sample-t-test',
        title: 'One-Sample t-Test',
        summary: 'Compare one sample against a fixed reference value.',
        concepts: ['t distribution', 'reference value', 'degrees of freedom'],
        level: 'core',
      },
      {
        slug: 'two-sample-t-test',
        title: 'Two-Sample t-Test',
        summary: 'Compare two independent groups, with or without equal variances.',
        concepts: ['independent groups', 'Welch correction', 'equal variance'],
        level: 'core',
      },
      {
        slug: 'paired-t-test',
        title: 'Paired t-Test',
        summary: 'Use the design: test the within-pair differences directly.',
        concepts: ['paired design', 'within-subject differences', 'dependent samples'],
        level: 'core',
      },
      {
        slug: 'proportion-tests',
        title: 'Proportion Tests',
        summary: 'Test one rate against a target, or compare two rates.',
        concepts: ['one proportion', 'two proportions', 'normal approximation'],
        level: 'core',
      },
      {
        slug: 'chi-square-tests',
        title: 'Chi-Square Tests',
        summary: 'Compare observed counts against expected counts in a table.',
        concepts: ['goodness of fit', 'independence', 'expected counts'],
        level: 'core',
      },
      {
        slug: 'f-test',
        title: 'F-Test',
        summary: 'Compare two variances using a ratio, the same statistic ANOVA relies on.',
        concepts: ['variance ratio', 'F distribution', 'ANOVA link'],
        level: 'advanced',
      },
      {
        slug: 'effect-size',
        title: 'Effect Size',
        summary: 'Report how large the difference is, not only whether it is detectable.',
        concepts: ['effect size', 'Cohen’s d', 'practical significance'],
        level: 'core',
      },
      {
        slug: 'multiple-testing',
        title: 'Multiple Testing',
        summary: 'See false positives accumulate as the number of tests grows.',
        concepts: ['multiple comparisons', 'Bonferroni intuition', 'family-wise error'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'bayesian-statistics',
    title: 'Bayesian Statistics',
    shortTitle: 'Bayesian',
    category: 'inference',
    tagline: 'Use prior knowledge to update beliefs.',
    summary:
      'Carry a belief as a distribution, reweight it with data, and read conclusions straight from the posterior.',
    icon: 'bayes',
    accent: 'fuchsia',
    labs: [
      {
        slug: 'bayesian-foundations',
        title: 'Bayesian Foundations',
        summary: 'Connect prior, likelihood, and posterior in a single picture.',
        concepts: ['prior', 'likelihood', 'posterior'],
        level: 'intro',
      },
      {
        slug: 'beta-binomial',
        title: 'Beta-Binomial',
        summary: 'Update a belief about a rate after observing successes and failures.',
        concepts: ['beta prior', 'binomial likelihood', 'conjugacy'],
        level: 'core',
      },
      {
        slug: 'gamma-poisson',
        title: 'Gamma-Poisson',
        summary: 'Update a belief about an event rate from observed counts.',
        concepts: ['gamma prior', 'count data', 'conjugacy'],
        level: 'core',
      },
      {
        slug: 'normal-normal',
        title: 'Normal-Normal',
        summary: 'Blend a prior mean with a sample mean, weighted by precision.',
        concepts: ['normal prior', 'precision weighting', 'conjugacy'],
        level: 'core',
      },
      {
        slug: 'conjugate-priors',
        title: 'Conjugate Priors',
        summary: 'See why some prior-likelihood pairs keep the posterior in closed form.',
        concepts: ['conjugacy', 'closed-form posterior', 'prior families'],
        level: 'core',
      },
      {
        slug: 'map-vs-mle',
        title: 'MAP vs MLE',
        summary: 'Compare the posterior mode against the pure likelihood maximum.',
        concepts: ['MAP', 'MLE', 'regularization intuition'],
        level: 'advanced',
      },
      {
        slug: 'credible-intervals',
        title: 'Credible Intervals',
        summary: 'Take an interval directly from posterior mass and say what it means.',
        concepts: ['credible intervals', 'posterior mass', 'interpretation'],
        level: 'core',
      },
      {
        slug: 'bayesian-prediction',
        title: 'Bayesian Prediction',
        summary: 'Predict the next observation while carrying parameter uncertainty along.',
        concepts: ['posterior predictive', 'prediction uncertainty'],
        level: 'advanced',
      },
      {
        slug: 'bayesian-vs-frequentist',
        title: 'Bayesian vs Frequentist',
        summary: 'Put the two interpretations of probability side by side on one problem.',
        concepts: ['interpretation', 'probability statements', 'assumptions'],
        level: 'core',
      },
      {
        slug: 'mcmc-intuition',
        title: 'MCMC Intuition',
        summary: 'Sample from a posterior you cannot integrate, one step at a time.',
        concepts: ['posterior sampling', 'Markov chains', 'convergence'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'correlation-association',
    title: 'Correlation & Association',
    shortTitle: 'Correlation',
    category: 'modeling',
    tagline: 'Measure and visualize relationships.',
    summary:
      'Look at the scatter first, then put a number on the association — and keep causation a separate question.',
    icon: 'correlation',
    accent: 'cyan',
    labs: [
      {
        slug: 'scatter-plot-explorer',
        title: 'Scatter Plot Explorer',
        summary: 'Read direction, form, and strength before computing anything.',
        concepts: ['linear association', 'nonlinear association', 'scatter'],
        level: 'intro',
      },
      {
        slug: 'covariance',
        title: 'Covariance',
        summary: 'See how joint movement is measured, and why the units are awkward.',
        concepts: ['covariance', 'units', 'sign'],
        level: 'core',
      },
      {
        slug: 'pearson-correlation',
        title: 'Pearson Correlation',
        summary: 'Standardize covariance into a number between -1 and 1.',
        concepts: ['Pearson r', 'linear association', 'strength'],
        level: 'core',
      },
      {
        slug: 'spearman-rank-correlation',
        title: 'Spearman Rank Correlation',
        summary: 'Replace values with ranks to capture monotonic relationships.',
        concepts: ['Spearman rho', 'monotonic association', 'ranks'],
        level: 'core',
      },
      {
        slug: 'kendall-tau',
        title: 'Kendall Tau',
        summary: 'Count concordant and discordant pairs instead of squaring deviations.',
        concepts: ['Kendall tau', 'concordance', 'ties'],
        level: 'advanced',
      },
      {
        slug: 'correlation-matrix',
        title: 'Correlation Matrix',
        summary: 'Screen many pairs at once with a signed heatmap.',
        concepts: ['heatmaps', 'pairwise correlation', 'screening'],
        level: 'core',
      },
      {
        slug: 'partial-correlation',
        title: 'Partial Correlation',
        summary: 'Hold a third variable fixed and see what is left of the association.',
        concepts: ['partial correlation', 'controlling for', 'confounding'],
        level: 'advanced',
      },
      {
        slug: 'correlation-vs-causation',
        title: 'Correlation vs Causation',
        summary: 'Work through cases where a strong correlation explains nothing.',
        concepts: ['spurious correlation', 'confounding', 'causality'],
        level: 'intro',
      },
    ],
  },
  {
    slug: 'regression',
    title: 'Regression',
    shortTitle: 'Regression',
    category: 'modeling',
    tagline: 'Model relationships and make predictions.',
    summary:
      'Fit a line, read the coefficients, check the residuals, and only then trust the prediction.',
    icon: 'regression',
    accent: 'blue',
    labs: [
      {
        slug: 'simple-linear-regression',
        title: 'Simple Linear Regression',
        summary: 'Fit one straight line and interpret slope and intercept.',
        concepts: ['slope', 'intercept', 'fitted line'],
        level: 'core',
      },
      {
        slug: 'least-squares',
        title: 'Least Squares',
        summary: 'Drag a line and watch the sum of squared residuals shrink to its minimum.',
        concepts: ['SSE', 'minimization', 'residuals'],
        level: 'core',
      },
      {
        slug: 'prediction',
        title: 'Prediction',
        summary: 'Use the fitted equation, and mark where extrapolation begins.',
        concepts: ['prediction', 'extrapolation', 'fitted values'],
        level: 'core',
      },
      {
        slug: 'residual-analysis',
        title: 'Residual Analysis',
        summary: 'Read residual plots for curvature, spread, and unusual points.',
        concepts: ['residuals', 'patterns', 'assumption checks'],
        level: 'core',
      },
      {
        slug: 'goodness-of-fit',
        title: 'Goodness of Fit',
        summary: 'Interpret R² and adjusted R² without over-claiming.',
        concepts: ['R²', 'adjusted R²', 'explained variance'],
        level: 'core',
      },
      {
        slug: 'confidence-prediction-intervals',
        title: 'Confidence & Prediction Intervals',
        summary: 'Separate uncertainty about the mean response from uncertainty about one case.',
        concepts: ['confidence interval', 'prediction interval', 'uncertainty bands'],
        level: 'advanced',
      },
      {
        slug: 'multiple-regression',
        title: 'Multiple Regression',
        summary: 'Read each coefficient as an association adjusted for the others.',
        concepts: ['multiple predictors', 'adjusted association', 'collinearity'],
        level: 'core',
      },
      {
        slug: 'polynomial-regression',
        title: 'Polynomial Regression',
        summary: 'Add curvature, and watch where extra flexibility becomes overfitting.',
        concepts: ['polynomial terms', 'curvature', 'overfitting'],
        level: 'advanced',
      },
      {
        slug: 'categorical-predictors',
        title: 'Categorical Predictors',
        summary: 'Encode groups as dummy variables against a reference level.',
        concepts: ['dummy variables', 'reference level', 'group effects'],
        level: 'core',
      },
      {
        slug: 'interaction-effects',
        title: 'Interaction Effects',
        summary: 'Let one predictor change the slope of another.',
        concepts: ['interactions', 'moderation', 'slope differences'],
        level: 'advanced',
      },
      {
        slug: 'logistic-regression-basics',
        title: 'Logistic Regression Basics',
        summary: 'Model a binary outcome on the log-odds scale and read it back as probability.',
        concepts: ['sigmoid', 'logit', 'odds'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'anova',
    title: 'ANOVA',
    shortTitle: 'ANOVA',
    category: 'modeling',
    tagline: 'Compare groups and understand variation.',
    summary:
      'Split total variation into between-group and within-group parts, then test whether the split is surprising.',
    icon: 'anova',
    accent: 'orange',
    labs: [
      {
        slug: 'one-way-anova',
        title: 'One-Way ANOVA',
        summary: 'Test whether three or more group means differ.',
        concepts: ['between-group variation', 'within-group variation', 'F-statistic'],
        level: 'core',
      },
      {
        slug: 'anova-table',
        title: 'ANOVA Table',
        summary: 'Trace sums of squares, degrees of freedom, and mean squares to the F ratio.',
        concepts: ['sums of squares', 'degrees of freedom', 'mean squares'],
        level: 'core',
      },
      {
        slug: 'post-hoc-comparisons',
        title: 'Post-Hoc Comparisons',
        summary: 'Locate which pairs differ once the overall test is significant.',
        concepts: ['multiple comparisons', 'pairwise contrasts', 'adjusted p-values'],
        level: 'core',
      },
      {
        slug: 'two-way-anova',
        title: 'Two-Way ANOVA',
        summary: 'Separate two factors and the interaction between them.',
        concepts: ['main effects', 'interactions', 'factorial design'],
        level: 'advanced',
      },
      {
        slug: 'repeated-measures-anova',
        title: 'Repeated Measures ANOVA',
        summary: 'Handle the same subjects measured under several conditions.',
        concepts: ['repeated measures', 'within-subject design', 'sphericity'],
        level: 'advanced',
      },
      {
        slug: 'anova-assumptions',
        title: 'ANOVA Assumptions',
        summary: 'Check normality, equal variance, and independence before trusting F.',
        concepts: ['normality', 'equal variance', 'independence'],
        level: 'core',
      },
    ],
  },
  {
    slug: 'time-series-basics',
    title: 'Time Series Basics',
    shortTitle: 'Time series',
    category: 'modeling',
    tagline: 'Explore trends, seasonality, and time dependence.',
    summary:
      'Treat order as information: decompose a series, measure its memory, and check whether it is stable.',
    icon: 'timeSeries',
    accent: 'amber',
    labs: [
      {
        slug: 'time-plot',
        title: 'Time Plot',
        summary: 'Plot the series in order and read it before modelling anything.',
        concepts: ['time-indexed data', 'sequence', 'visual inspection'],
        level: 'intro',
      },
      {
        slug: 'trend',
        title: 'Trend',
        summary: 'Separate long-run direction from short-run movement.',
        concepts: ['trend', 'long-run direction', 'detrending'],
        level: 'intro',
      },
      {
        slug: 'seasonality',
        title: 'Seasonality',
        summary: 'Find repeating patterns tied to a fixed period.',
        concepts: ['seasonality', 'periodic pattern', 'seasonal index'],
        level: 'core',
      },
      {
        slug: 'moving-average',
        title: 'Moving Average',
        summary: 'Smooth the series and see what the window size hides.',
        concepts: ['moving averages', 'smoothing', 'window size'],
        level: 'core',
      },
      {
        slug: 'autocorrelation',
        title: 'Autocorrelation',
        summary: 'Correlate the series with its own past.',
        concepts: ['lag', 'autocorrelation', 'serial dependence'],
        level: 'core',
      },
      {
        slug: 'acf-pacf',
        title: 'ACF & PACF',
        summary: 'Read lag structure from two complementary correlation plots.',
        concepts: ['ACF', 'PACF', 'lag structure'],
        level: 'advanced',
      },
      {
        slug: 'stationarity',
        title: 'Stationarity',
        summary: 'Check whether mean and variance stay put, and difference when they do not.',
        concepts: ['stationary process', 'differencing', 'constant mean'],
        level: 'advanced',
      },
      {
        slug: 'white-noise-random-walk',
        title: 'White Noise & Random Walk',
        summary: 'Compare a series with no memory against one that never forgets.',
        concepts: ['white noise', 'random walk', 'unpredictability'],
        level: 'core',
      },
      {
        slug: 'ar-ma-arima-intuition',
        title: 'AR / MA / ARIMA Intuition',
        summary: 'Build up from autoregression and moving-average terms to ARIMA.',
        concepts: ['autoregression', 'moving-average process', 'ARIMA'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'nonparametric-statistics',
    title: 'Nonparametric Statistics',
    shortTitle: 'Nonparametric',
    category: 'advanced',
    tagline: 'Methods beyond traditional parametric assumptions.',
    summary:
      'Work with ranks, signs, and reshuffling when the shape of the distribution cannot be assumed.',
    icon: 'ranks',
    accent: 'lime',
    labs: [
      {
        slug: 'sign-test',
        title: 'Sign Test',
        summary: 'Test a median using only the direction of each difference.',
        concepts: ['median test', 'binary comparison', 'distribution-free'],
        level: 'core',
      },
      {
        slug: 'wilcoxon-signed-rank',
        title: 'Wilcoxon Signed-Rank',
        summary: 'Use both the sign and the magnitude rank of paired differences.',
        concepts: ['paired ranks', 'signed ranks', 'median difference'],
        level: 'core',
      },
      {
        slug: 'mann-whitney-u',
        title: 'Mann–Whitney U',
        summary: 'Compare two independent groups by pooled ranks.',
        concepts: ['rank sum', 'two independent groups', 'stochastic dominance'],
        level: 'core',
      },
      {
        slug: 'kruskal-wallis',
        title: 'Kruskal–Wallis',
        summary: 'Extend the rank comparison to three or more groups.',
        concepts: ['rank ANOVA', 'three or more groups', 'H statistic'],
        level: 'core',
      },
      {
        slug: 'permutation-test',
        title: 'Permutation Test',
        summary: 'Shuffle the labels to build the null distribution from the data itself.',
        concepts: ['label shuffling', 'exact reference', 'null distribution'],
        level: 'advanced',
      },
      {
        slug: 'bootstrap-test',
        title: 'Bootstrap Test',
        summary: 'Resample with replacement to test without a formula.',
        concepts: ['resampling', 'empirical null', 'confidence from data'],
        level: 'advanced',
      },
      {
        slug: 'rank-based-methods',
        title: 'Rank-Based Methods',
        summary: 'See what ranks buy you in robustness and what they cost in information.',
        concepts: ['ranks', 'robustness', 'ties'],
        level: 'core',
      },
    ],
  },
  {
    slug: 'reliability-survival',
    title: 'Reliability & Survival',
    shortTitle: 'Reliability',
    category: 'advanced',
    tagline: 'Model time to events and reliability.',
    summary:
      'Analyse how long things last when some observations are still running at the end of the study.',
    icon: 'survival',
    accent: 'rose',
    labs: [
      {
        slug: 'survival-function',
        title: 'Survival Function',
        summary: 'Track the probability of surviving past each point in time.',
        concepts: ['survival probability', 'time to event', 'S(t)'],
        level: 'core',
      },
      {
        slug: 'hazard-function',
        title: 'Hazard Function',
        summary: 'Measure instantaneous risk among those still at risk.',
        concepts: ['instantaneous risk', 'hazard rate', 'at-risk set'],
        level: 'advanced',
      },
      {
        slug: 'censoring',
        title: 'Censoring',
        summary: 'Use partial information from subjects whose event never occurred.',
        concepts: ['right censoring', 'incomplete follow-up', 'at-risk set'],
        level: 'core',
      },
      {
        slug: 'kaplan-meier',
        title: 'Kaplan–Meier',
        summary: 'Build the product-limit estimator step by step.',
        concepts: ['product-limit estimator', 'step curve', 'risk table'],
        level: 'core',
      },
      {
        slug: 'median-survival',
        title: 'Median Survival',
        summary: 'Read the time at which survival probability crosses one half.',
        concepts: ['median survival time', '50% threshold', 'curve reading'],
        level: 'core',
      },
      {
        slug: 'reliability-function',
        title: 'Reliability Function',
        summary: 'Apply the same mathematics to component and system reliability.',
        concepts: ['reliability', 'failure probability', 'components'],
        level: 'core',
      },
      {
        slug: 'mean-time-to-failure',
        title: 'Mean Time to Failure',
        summary: 'Recover expected lifetime from the area under the survival curve.',
        concepts: ['MTTF', 'expected lifetime', 'area under survival'],
        level: 'advanced',
      },
      {
        slug: 'hazard-comparison',
        title: 'Hazard Comparison',
        summary: 'Compare two groups of curves and interpret a hazard ratio.',
        concepts: ['group comparison', 'log-rank intuition', 'hazard ratio'],
        level: 'advanced',
      },
      {
        slug: 'weibull-reliability',
        title: 'Weibull Reliability',
        summary: 'Use shape and scale to model early failure, random failure, and wear-out.',
        concepts: ['Weibull shape', 'scale', 'wear-out vs early failure'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'multivariate-statistics',
    title: 'Multivariate Statistics',
    shortTitle: 'Multivariate',
    category: 'advanced',
    tagline: 'Work with multiple variables together.',
    summary:
      'Move from single variables to vectors and matrices, where distance and direction carry the meaning.',
    icon: 'multivariate',
    accent: 'violet',
    labs: [
      {
        slug: 'mean-vector-covariance-matrix',
        title: 'Mean Vector & Covariance Matrix',
        summary: 'Summarize several variables at once with a vector and a matrix.',
        concepts: ['mean vector', 'covariance matrix', 'multivariate summary'],
        level: 'core',
      },
      {
        slug: 'correlation-matrix',
        title: 'Correlation Matrix',
        summary: 'Standardize the covariance matrix to compare pairs on one scale.',
        concepts: ['standardized covariance', 'pairwise structure'],
        level: 'core',
      },
      {
        slug: 'bivariate-normal',
        title: 'Bivariate Normal',
        summary: 'See how correlation tilts and stretches a joint density.',
        concepts: ['joint density', 'contours', 'correlation shape'],
        level: 'advanced',
      },
      {
        slug: 'mahalanobis-distance',
        title: 'Mahalanobis Distance',
        summary: 'Measure distance in a way that respects the covariance structure.',
        concepts: ['scaled distance', 'covariance-aware', 'outlier score'],
        level: 'advanced',
      },
      {
        slug: 'confidence-ellipse',
        title: 'Confidence Ellipse',
        summary: 'Draw joint uncertainty for two parameters at once.',
        concepts: ['ellipse', 'joint uncertainty', 'axes'],
        level: 'advanced',
      },
      {
        slug: 'multivariate-outliers',
        title: 'Multivariate Outliers',
        summary: 'Find points that look ordinary one variable at a time but not together.',
        concepts: ['multivariate outliers', 'leverage', 'distance cutoff'],
        level: 'advanced',
      },
      {
        slug: 'principal-component-analysis',
        title: 'Principal Component Analysis',
        summary: 'Rotate to the directions that carry the most variance.',
        concepts: ['PCA', 'explained variance', 'loadings'],
        level: 'advanced',
      },
      {
        slug: 'eigenvalues-eigenvectors',
        title: 'Eigenvalues & Eigenvectors',
        summary: 'Connect the algebra of eigen-decomposition to the picture of the cloud.',
        concepts: ['eigenvalues', 'eigenvectors', 'principal directions'],
        level: 'advanced',
      },
    ],
  },
  {
    slug: 'statistical-simulation',
    title: 'Statistical Simulation',
    shortTitle: 'Simulation',
    category: 'advanced',
    tagline: 'Use simulation to understand and experiment.',
    summary:
      'Answer questions by generating data instead of deriving formulas, and watch estimates converge.',
    icon: 'simulation',
    accent: 'indigo',
    labs: [
      {
        slug: 'random-number-generation',
        title: 'Random Number Generation',
        summary: 'See how a seed produces a reproducible stream of pseudo-random draws.',
        concepts: ['pseudo-random', 'seed', 'uniform draws'],
        level: 'intro',
      },
      {
        slug: 'coin-dice-simulation',
        title: 'Coin & Dice Simulation',
        summary: 'Run thousands of trials and compare empirical frequency to theory.',
        concepts: ['repeated trials', 'empirical frequency', 'convergence'],
        level: 'intro',
      },
      {
        slug: 'monte-carlo',
        title: 'Monte Carlo',
        summary: 'Estimate a quantity by sampling, and quantify the simulation error.',
        concepts: ['Monte Carlo', 'estimation by sampling', 'simulation error'],
        level: 'core',
      },
      {
        slug: 'sampling-experiment',
        title: 'Sampling Experiment',
        summary: 'Design a repeated-sampling study and observe the variability it produces.',
        concepts: ['repeated samples', 'sampling variability', 'design'],
        level: 'core',
      },
      {
        slug: 'clt-simulation',
        title: 'CLT Simulation',
        summary: 'Generate sample means from any population and watch normality appear.',
        concepts: ['sample means', 'normal approximation', 'sample size effect'],
        level: 'core',
      },
      {
        slug: 'bootstrap-simulation',
        title: 'Bootstrap Simulation',
        summary: 'Resample with replacement to build a percentile interval.',
        concepts: ['resampling', 'bootstrap distribution', 'percentile interval'],
        level: 'advanced',
      },
      {
        slug: 'permutation-simulation',
        title: 'Permutation Simulation',
        summary: 'Shuffle group labels repeatedly to construct an exact null distribution.',
        concepts: ['label shuffling', 'null distribution', 'exact p-value'],
        level: 'advanced',
      },
      {
        slug: 'law-of-large-numbers-simulation',
        title: 'Law of Large Numbers Simulation',
        summary: 'Watch a running average stabilize as the trial count grows.',
        concepts: ['long-run average', 'convergence', 'stability'],
        level: 'intro',
      },
    ],
  },
  {
    slug: 'quality-decision-making',
    title: 'Statistical Quality & Decision Making',
    shortTitle: 'Quality & decisions',
    category: 'advanced',
    tagline: 'Make better decisions with data.',
    summary:
      'Apply statistics where a decision follows: monitoring a process, running a test, reading a diagnostic.',
    icon: 'quality',
    accent: 'teal',
    labs: [
      {
        slug: 'quality-control-charts',
        title: 'Quality Control Charts',
        summary: 'Monitor a process over time and flag special-cause variation.',
        concepts: ['control limits', 'process monitoring', 'special cause'],
        level: 'core',
      },
      {
        slug: 'process-capability',
        title: 'Process Capability',
        summary: 'Compare natural process spread against the specification you must hit.',
        concepts: ['tolerance', 'capability index', 'specification limits'],
        level: 'core',
      },
      {
        slug: 'decision-thresholds',
        title: 'Decision Thresholds',
        summary: 'Move a cutoff and trade false positives against false negatives.',
        concepts: ['false positives', 'false negatives', 'decision costs'],
        level: 'core',
      },
      {
        slug: 'ab-testing',
        title: 'A/B Testing',
        summary: 'Randomize into groups and compare conversion honestly.',
        concepts: ['experimental groups', 'conversion testing', 'randomization'],
        level: 'core',
      },
      {
        slug: 'diagnostic-testing',
        title: 'Diagnostic Testing',
        summary: 'Separate test accuracy from the probability that a positive is real.',
        concepts: ['sensitivity', 'specificity', 'PPV', 'NPV'],
        level: 'core',
      },
    ],
  },
]

const STUDIO_BY_SLUG = new Map(STATISTICS_STUDIOS.map((studio) => [studio.slug, studio]))

export function getStudio(slug: string | undefined): Studio | undefined {
  return slug ? STUDIO_BY_SLUG.get(slug) : undefined
}

export function getLab(studioSlug: string | undefined, labSlug: string | undefined) {
  const studio = getStudio(studioSlug)
  if (!studio || !labSlug) return undefined
  const lab = studio.labs.find((item) => item.slug === labSlug)
  return lab ? { studio, lab } : undefined
}

export function studiosByCategory(category: StudioCategoryId): Studio[] {
  return STATISTICS_STUDIOS.filter((studio) => studio.category === category)
}

export function studioPath(studio: Pick<Studio, 'slug'>): string {
  return `${STUDIOS_ROOT}/${studio.slug}`
}

export function labPath(studioSlug: string, labSlug: string): string {
  return `${STUDIOS_ROOT}/${studioSlug}/${labSlug}`
}

export function conceptCount(studio: Studio): number {
  return new Set(studio.labs.flatMap((lab) => lab.concepts)).size
}

/** Studios that share a category, excluding the current one. */
export function relatedStudios(studio: Studio, limit = 3): Studio[] {
  const sameCategory = studiosByCategory(studio.category).filter((item) => item.slug !== studio.slug)
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)
  const others = STATISTICS_STUDIOS.filter(
    (item) => item.category !== studio.category && item.slug !== studio.slug,
  )
  return [...sameCategory, ...others].slice(0, limit)
}

export type LearningSearchHit = {
  kind: 'studio' | 'lab' | 'concept'
  label: string
  context: string
  path: string
}

/**
 * Searches studios, labs, and concept tags. Scoped to the learning config only so it can be
 * merged into an existing search surface without touching dataset or column search.
 */
export function searchLearning(query: string, limit = 20): LearningSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const hits: LearningSearchHit[] = []
  const seen = new Set<string>()

  const push = (hit: LearningSearchHit) => {
    const key = `${hit.kind}:${hit.path}:${hit.label}`
    if (seen.has(key)) return
    seen.add(key)
    hits.push(hit)
  }

  if (FEATURED_STUDIO.title.toLowerCase().includes(q) || 'distributions'.includes(q)) {
    push({ kind: 'studio', label: FEATURED_STUDIO.title, context: 'Studio', path: FEATURED_STUDIO.path })
  }

  for (const studio of STATISTICS_STUDIOS) {
    if (studio.title.toLowerCase().includes(q) || studio.tagline.toLowerCase().includes(q)) {
      push({ kind: 'studio', label: studio.title, context: 'Studio', path: studioPath(studio) })
    }
    for (const lab of studio.labs) {
      if (lab.title.toLowerCase().includes(q) || lab.summary.toLowerCase().includes(q)) {
        push({ kind: 'lab', label: lab.title, context: studio.title, path: labPath(studio.slug, lab.slug) })
      }
      for (const concept of lab.concepts) {
        if (concept.toLowerCase().includes(q)) {
          push({
            kind: 'concept',
            label: concept,
            context: `${studio.title} · ${lab.title}`,
            path: labPath(studio.slug, lab.slug),
          })
        }
      }
    }
  }

  return hits.slice(0, limit)
}

export const TOTAL_STUDIO_COUNT = STATISTICS_STUDIOS.length + 1
export const TOTAL_LAB_COUNT =
  STATISTICS_STUDIOS.reduce((sum, studio) => sum + studio.labs.length, 0) + FEATURED_STUDIO.labCount
