import { labPath } from './statisticsStudios'

export type PathAudience = 'beginner' | 'data' | 'inference' | 'regression' | 'ml' | 'research'
export type PathDifficulty = 'intro' | 'core' | 'advanced'

export type LearningPathNode = {
  id: string
  title: string
  summary: string
  difficulty: PathDifficulty
  href: string
  prereqIds: string[]
}

export type LearningPath = {
  id: PathAudience
  title: string
  audience: string
  outcome: string
  nodes: LearningPathNode[]
}

export const LEARNING_PATH_FLOW: LearningPath[] = [
  {
    id: 'beginner',
    title: 'Beginner Path',
    audience: 'New to statistics',
    outcome: 'Describe data, then meet probability, sampling, and the CLT.',
    nodes: [
      { id: 'desc', title: 'Descriptive Statistics', summary: 'Center, spread, and shape of a sample.', difficulty: 'intro', href: '/statistics/descriptive-statistics', prereqIds: [] },
      { id: 'prob', title: 'Probability', summary: 'Outcomes, events, and the addition rules.', difficulty: 'intro', href: '/statistics/probability-foundations', prereqIds: ['desc'] },
      { id: 'rv', title: 'Random Variables', summary: 'From events to numeric chance.', difficulty: 'intro', href: '/statistics/random-variables', prereqIds: ['prob'] },
      { id: 'sample', title: 'Sampling', summary: 'How a sample is drawn from a population.', difficulty: 'intro', href: '/statistics/sampling-methods', prereqIds: ['desc'] },
      { id: 'clt', title: 'CLT', summary: 'Why sample means become more normal and tighter.', difficulty: 'core', href: labPath('sampling-distributions-clt', 'central-limit-theorem'), prereqIds: ['sample', 'rv'] },
      { id: 'est', title: 'Estimation', summary: 'Point estimates and confidence intervals.', difficulty: 'core', href: '/statistics/estimation', prereqIds: ['clt'] },
      { id: 'test', title: 'Hypothesis Testing', summary: 'Test statistics, p-values, and errors.', difficulty: 'core', href: '/statistics/hypothesis-testing', prereqIds: ['est'] },
      { id: 'reg', title: 'Regression', summary: 'A line that describes y from x.', difficulty: 'core', href: labPath('regression', 'simple-linear-regression'), prereqIds: ['desc'] },
      { id: 'adv', title: 'Advanced Analysis', summary: 'Studios for ANOVA, Bayes, and time series when you are ready.', difficulty: 'advanced', href: '/statistics', prereqIds: ['test'] },
    ],
  },
  {
    id: 'data',
    title: 'Data Analysis Path',
    audience: 'Analysts',
    outcome: 'Clean a table, summarize it, chart it, then model relationships.',
    nodes: [
      { id: 'upload', title: 'Import data', summary: 'CSV, Excel, or a teaching dataset.', difficulty: 'intro', href: '/data/upload', prereqIds: [] },
      { id: 'preview', title: 'Preview & types', summary: 'Confirm columns, missingness, and types.', difficulty: 'intro', href: '/data/preview', prereqIds: ['upload'] },
      { id: 'desc', title: 'Descriptives', summary: 'Means, spreads, and frequency tables.', difficulty: 'intro', href: '/analysis/descriptives.statistics', prereqIds: ['preview'] },
      { id: 'charts', title: 'Charts', summary: 'See shape before you model.', difficulty: 'intro', href: '/explore/charts', prereqIds: ['desc'] },
      { id: 'corr', title: 'Correlation', summary: 'Association between numeric pairs.', difficulty: 'core', href: '/analysis/regression.correlation', prereqIds: ['desc'] },
      { id: 'reg', title: 'Regression', summary: 'Fit and diagnose a linear model.', difficulty: 'core', href: '/analysis/regression.linear', prereqIds: ['corr'] },
      { id: 'report', title: 'Reports', summary: 'Export tables and figures.', difficulty: 'core', href: '/reports', prereqIds: ['reg'] },
    ],
  },
  {
    id: 'inference',
    title: 'Inference Path',
    audience: 'Tests and intervals',
    outcome: 'Go from sampling variability to intervals, tests, chi-square, and ANOVA.',
    nodes: [
      { id: 'sample', title: 'Sampling methods', summary: 'Bias, SRS, strata, and clusters.', difficulty: 'intro', href: '/statistics/sampling-methods', prereqIds: [] },
      { id: 'clt', title: 'Sampling distributions', summary: 'Means, proportions, and standard error.', difficulty: 'core', href: '/statistics/sampling-distributions-clt', prereqIds: ['sample'] },
      { id: 'ci', title: 'Confidence intervals', summary: 'A net thrown at a fixed unknown.', difficulty: 'core', href: '/statistics/estimation', prereqIds: ['clt'] },
      { id: 'ht', title: 'Hypothesis testing', summary: 'H0, HA, α, and p-values.', difficulty: 'core', href: '/statistics/hypothesis-testing', prereqIds: ['ci'] },
      { id: 'chi', title: 'Chi-square', summary: 'Association in categorical tables.', difficulty: 'core', href: labPath('hypothesis-testing', 'chi-square-tests'), prereqIds: ['ht'] },
      { id: 'anova', title: 'ANOVA', summary: 'Compare more than two group means.', difficulty: 'advanced', href: '/statistics/anova', prereqIds: ['ht'] },
    ],
  },
  {
    id: 'regression',
    title: 'Regression Path',
    audience: 'Relationships',
    outcome: 'Scatterplots → correlation → simple line → residuals → multiple regression.',
    nodes: [
      { id: 'scatter', title: 'Scatter plots', summary: 'See the cloud before the coefficient.', difficulty: 'intro', href: labPath('correlation-association', 'scatter-plot-explorer'), prereqIds: [] },
      { id: 'corr', title: 'Correlation', summary: 'Pearson, Spearman, and “not causation”.', difficulty: 'intro', href: '/statistics/correlation-association', prereqIds: ['scatter'] },
      { id: 'ols', title: 'Simple linear regression', summary: 'Slope, intercept, and fitted line.', difficulty: 'core', href: labPath('regression', 'simple-linear-regression'), prereqIds: ['corr'] },
      { id: 'resid', title: 'Residual analysis', summary: 'Pattern, fan-out, and unusual points.', difficulty: 'core', href: labPath('regression', 'residual-analysis'), prereqIds: ['ols'] },
      { id: 'multi', title: 'Multiple regression', summary: 'Adjusted associations.', difficulty: 'advanced', href: labPath('regression', 'multiple-regression'), prereqIds: ['resid'] },
      { id: 'logit', title: 'Logistic basics', summary: 'A binary outcome on the log-odds scale.', difficulty: 'advanced', href: labPath('regression', 'logistic-regression-basics'), prereqIds: ['multi'] },
    ],
  },
  {
    id: 'ml',
    title: 'Machine Learning Preparation',
    audience: 'Toward ML',
    outcome: 'Distributions, correlation, regression, then the ML analysis modules.',
    nodes: [
      { id: 'desc', title: 'Describe first', summary: 'Scale, missingness, and outliers.', difficulty: 'intro', href: '/statistics/descriptive-statistics', prereqIds: [] },
      { id: 'dist', title: 'Distributions', summary: 'Families you will meet as noise models.', difficulty: 'core', href: '/distributions', prereqIds: ['desc'] },
      { id: 'corr', title: 'Association', summary: 'Linear and rank association.', difficulty: 'core', href: '/statistics/correlation-association', prereqIds: ['desc'] },
      { id: 'reg', title: 'Regression studio', summary: 'The linear baseline every ML comparison needs.', difficulty: 'core', href: '/statistics/regression', prereqIds: ['corr'] },
      { id: 'mlreg', title: 'ML regression', summary: 'Trees, boosting, and regularized linear models.', difficulty: 'advanced', href: '/analysis/ml.regression', prereqIds: ['reg'] },
      { id: 'cluster', title: 'Clustering', summary: 'Unsupervised grouping.', difficulty: 'advanced', href: '/analysis/ml.clustering', prereqIds: ['desc'] },
    ],
  },
  {
    id: 'research',
    title: 'Research / Academic Path',
    audience: 'Papers and theses',
    outcome: 'Design, inference, effect size, reporting, and professional practice packs.',
    nodes: [
      { id: 'design', title: 'Sampling & design', summary: 'Who is in the sample, and why that matters.', difficulty: 'core', href: '/statistics/sampling-methods', prereqIds: [] },
      { id: 'infer', title: 'Inference studio', summary: 'Intervals and tests with assumptions named.', difficulty: 'core', href: '/statistics/hypothesis-testing', prereqIds: ['design'] },
      { id: 'anova', title: 'ANOVA', summary: 'Multi-group experiments.', difficulty: 'core', href: '/statistics/anova', prereqIds: ['infer'] },
      { id: 'reg', title: 'Regression', summary: 'Adjusted associations and residuals.', difficulty: 'core', href: '/statistics/regression', prereqIds: ['infer'] },
      { id: 'bayes', title: 'Bayesian concepts', summary: 'Priors, posteriors, and credible intervals.', difficulty: 'advanced', href: '/statistics/bayesian-statistics', prereqIds: ['infer'] },
      { id: 'pro', title: 'Professional learning', summary: 'Practice bank, templates, and classroom export.', difficulty: 'advanced', href: '/professional-learning', prereqIds: ['reg'] },
    ],
  },
]

export const LEARNING_PATH_BY_ID = Object.fromEntries(LEARNING_PATH_FLOW.map((path) => [path.id, path])) as Record<string, LearningPath>

export function learningPathHref(pathId: string): string {
  return `/learn/paths/${pathId}`
}
