import { COMPUTING_MODULES } from './computingModules'
import { DISTRIBUTIONS } from './distributions'
import { STAT_MODULES } from './statModules'
import { SYLLABUS_MODULES } from './syllabusModules'

export type SitePageMeta = {
  path: string
  title: string
  description: string
  category: string
  keywords: string[]
  priority?: number
}

export const CORE_SITE_PAGES: SitePageMeta[] = [
  { path: '/', title: 'StatAnveshak Home', category: 'Workspace', description: 'Browser-only statistics, data analytics, learning, practice, and reporting workbench.', keywords: ['statistics', 'data analytics', 'learning tool'], priority: 1 },
  { path: '/projects', title: 'Projects', category: 'Workspace', description: 'Manage local statistics projects, notes, and dataset collections.', keywords: ['statistics projects', 'local browser projects'], priority: 0.7 },
  { path: '/data/upload', title: 'Upload Data', category: 'Data', description: 'Upload CSV, Excel, JSON, or sample datasets for browser-only analysis.', keywords: ['CSV upload', 'Excel statistics', 'sample datasets'], priority: 0.9 },
  { path: '/data/preview', title: 'Data Preview', category: 'Data', description: 'Preview schema, column types, missing data, and dataset structure.', keywords: ['data preview', 'schema detection', 'missing data'], priority: 0.7 },
  { path: '/data/grid', title: 'Data Grid', category: 'Data', description: 'Editable spreadsheet-style data grid with filtering, paging, and export.', keywords: ['data grid', 'editable table', 'CSV export'], priority: 0.7 },
  { path: '/data/clean', title: 'Clean and Transform', category: 'Data', description: 'Clean, transform, and prepare datasets for statistical analysis.', keywords: ['data cleaning', 'data transformation', 'statistics preparation'], priority: 0.8 },
  { path: '/data/workbench', title: 'Statistics Workbench', category: 'Data', description: 'Guided statistics workbench for variable review, data quality, and analysis selection.', keywords: ['statistics workbench', 'analysis wizard'], priority: 0.8 },
  { path: '/data/query', title: 'Query Workbench', category: 'Data', description: 'Run local browser queries over loaded datasets.', keywords: ['query data', 'browser analytics'], priority: 0.6 },
  { path: '/explore/summary', title: 'Summary Statistics', category: 'Explore', description: 'Redirects to Descriptive Statistics in the Analysis workspace.', keywords: ['summary statistics', 'descriptive statistics'], priority: 0.6 },
  { path: '/analysis', title: 'Analysis Workspace', category: 'Analysis', description: 'JASP-catalog analysis workspace: all 35 modules, including Learn Stats labs on the shared engines.', keywords: ['JASP', 'Learn Stats', 'machine learning', 'quality control'], priority: 0.95 },
  { path: '/analysis/descriptives.statistics', title: 'Descriptive Statistics', category: 'Analysis', description: 'Full descriptive statistics with Shapiro–Wilk, CIs, skewness, and kurtosis.', keywords: ['descriptive statistics', 'Shapiro-Wilk'], priority: 0.9 },
  { path: '/analysis/descriptives.raincloud', title: 'Raincloud Plots', category: 'Analysis', description: 'Raincloud plots with density, box, and raw points.', keywords: ['raincloud plot'], priority: 0.8 },
  { path: '/analysis/descriptives.timeSeries', title: 'Time Series Descriptives', category: 'Analysis', description: 'Time-series summary, ACF, PACF, and trend.', keywords: ['time series', 'ACF', 'PACF'], priority: 0.8 },
  { path: '/analysis/descriptives.flexplot', title: 'Flexplot', category: 'Analysis', description: 'Univariate and bivariate Flexplot grammar.', keywords: ['flexplot', 'visualization'], priority: 0.8 },
  { path: '/explore/charts', title: 'Charts', category: 'Explore', description: 'Create exploratory charts including histograms, bars, scatterplots, and boxplots.', keywords: ['statistics charts', 'data visualization'], priority: 0.8 },
  { path: '/explore/correlation', title: 'Correlation', category: 'Explore', description: 'Redirects to Pearson/Spearman/Kendall correlation in the Analysis workspace.', keywords: ['correlation', 'Pearson correlation'], priority: 0.6 },
  { path: '/explore/frequency', title: 'Frequency Tables', category: 'Explore', description: 'Redirects to contingency tables in the Analysis workspace.', keywords: ['frequency table', 'categorical data'], priority: 0.6 },
  { path: '/distributions', title: 'Distribution Explorer', category: 'Analysis', description: 'Explore probability distributions, parameters, simulations, and goodness-of-fit.', keywords: ['probability distributions', 'normal distribution', 'simulation'], priority: 0.9 },
  { path: '/analysis/t.oneSample', title: 'One Sample T-Test', category: 'Analysis', description: 'One-sample t-test, Wilcoxon signed-rank, and raincloud display.', keywords: ['one-sample t-test', 'Wilcoxon'], priority: 0.85 },
  { path: '/analysis/t.independent', title: 'Independent Samples T-Test', category: 'Analysis', description: 'Student and Welch t-tests with Mann–Whitney and Levene.', keywords: ['independent t-test', 'Welch', 'Mann-Whitney'], priority: 0.85 },
  { path: '/analysis/anova.between', title: 'ANOVA', category: 'Analysis', description: 'Type I/II/III ANOVA with studentized-range Tukey and other post-hoc tests.', keywords: ['ANOVA', 'Tukey HSD'], priority: 0.85 },
  { path: '/analysis/power.analysis', title: 'Power Analysis', category: 'Analysis', description: 'Sample size and power for t, ANOVA, proportions, correlation, and regression.', keywords: ['power analysis', 'sample size'], priority: 0.8 },
  { path: '/inference', title: 'Inference Tests', category: 'Analysis', description: 'Sampling-distribution machine for sample means and CI coverage, with a door into t-test tables.', keywords: ['hypothesis testing', 'confidence interval', 't-test'], priority: 0.9 },
  { path: '/analysis/regression.correlation', title: 'Correlation', category: 'Analysis', description: 'Pearson, Spearman, Kendall, and partial correlations.', keywords: ['Pearson', 'Spearman', 'Kendall'], priority: 0.85 },
  { path: '/analysis/regression.linear', title: 'Linear Regression', category: 'Analysis', description: 'OLS with factors, interactions, and residual diagnostics.', keywords: ['linear regression', 'OLS'], priority: 0.85 },
  { path: '/analysis/frequencies.contingency', title: 'Contingency Tables', category: 'Analysis', description: 'Chi-square, likelihood ratio, Fisher, McNemar, and CMH.', keywords: ['chi-square', 'contingency table', 'Fisher'], priority: 0.85 },
  { path: '/analysis/bff.general', title: 'Bayes Factor Functions', category: 'Analysis', description: 'BF as a function of n for t, z, ANOVA, regression, and chi-square statistics.', keywords: ['Bayes factor', 'BFF'], priority: 0.75 },
  { path: '/analysis/learnBayes.labs', title: 'Learn Bayes', category: 'Analysis', description: 'Binomial updating, binary classification, and Buffon’s needle.', keywords: ['Learn Bayes', 'beta binomial'], priority: 0.8 },
  { path: '/analysis/learnStats.labs', title: 'Learn Stats', category: 'Analysis', description: 'CLT, SE, p-values, CIs, effect sizes, and the test decision tree on the shared engines.', keywords: ['Learn Stats', 'CLT', 'p-value', 'confidence interval'], priority: 0.85 },
  { path: '/analysis/summaryStats.fromPublished', title: 'Summary Statistics', category: 'Analysis', description: 'Bayesian t, z, correlation, binomial, and A/B tests from published summaries.', keywords: ['summary statistics', 'Bayes factor'], priority: 0.75 },
  { path: '/analysis/robustT.modelAveraged', title: 'Robust T-Tests', category: 'Analysis', description: 'Model-averaged t sampling models and truncated JZS.', keywords: ['robust t-test', 'Bayes factor'], priority: 0.7 },
  { path: '/analysis/mixed.lmm', title: 'Linear Mixed Models', category: 'Analysis', description: 'Random-intercept LMM with GLS fixed effects and BLUPs.', keywords: ['mixed models', 'LMM', 'ICC'], priority: 0.8 },
  { path: '/analysis/timeSeries.arima', title: 'ARIMA', category: 'Analysis', description: 'ARIMA identification, CSS estimation, and forecasts.', keywords: ['ARIMA', 'time series'], priority: 0.8 },
  { path: '/analysis/survival.nonparametric', title: 'Kaplan–Meier', category: 'Analysis', description: 'Kaplan–Meier, Greenwood SEs, log-rank, and Wilcoxon.', keywords: ['Kaplan-Meier', 'survival', 'log-rank'], priority: 0.8 },
  { path: '/analysis/process.model', title: 'PROCESS', category: 'Analysis', description: 'Hayes mediation, moderation, and moderated mediation.', keywords: ['PROCESS', 'mediation'], priority: 0.75 },
  { path: '/analysis/prophet.forecast', title: 'Prophet', category: 'Analysis', description: 'Additive trend plus Fourier seasonality.', keywords: ['Prophet', 'forecast'], priority: 0.7 },
  { path: '/analysis/factor.pca', title: 'Principal Component Analysis', category: 'Analysis', description: 'PCA loadings, scores, biplot, and parallel analysis.', keywords: ['PCA', 'parallel analysis'], priority: 0.8 },
  { path: '/analysis/factor.cfa', title: 'Confirmatory Factor Analysis', category: 'Analysis', description: 'Congeneric ML CFA with simple-structure loadings.', keywords: ['CFA', 'SEM'], priority: 0.8 },
  { path: '/analysis/sem.sem', title: 'Structural Equation Modeling', category: 'Analysis', description: 'CFA or recursive observed-variable path SEM.', keywords: ['SEM', 'path model'], priority: 0.8 },
  { path: '/analysis/meta.analysis', title: 'Meta-Analysis', category: 'Analysis', description: 'Fixed- and random-effects meta-analysis with funnel, PET-PEESE, and WAAP-WLS.', keywords: ['meta-analysis', 'DerSimonian-Laird'], priority: 0.8 },
  { path: '/analysis/network.psych', title: 'Network Analysis', category: 'Analysis', description: 'Ridge Gaussian graphical models and partial-correlation networks.', keywords: ['psychological network', 'partial correlation'], priority: 0.75 },
  { path: '/analysis/jags.model', title: 'JAGS', category: 'Analysis', description: 'In-browser Gibbs MCMC with R-hat and ESS for conjugate models.', keywords: ['JAGS', 'MCMC', 'Gibbs'], priority: 0.75 },
  { path: '/analysis/bain.tests', title: 'Bain', category: 'Analysis', description: 'Informative hypotheses for t, ANOVA, regression, and SEM.', keywords: ['Bain', 'Bayes factor'], priority: 0.7 },
  { path: '/analysis/ml.regression', title: 'ML Regression', category: 'Analysis', description: 'Boosting, trees, KNN, neural nets, forests, regularized linear, and SVM.', keywords: ['machine learning', 'regression'], priority: 0.8 },
  { path: '/analysis/ml.clustering', title: 'ML Clustering', category: 'Analysis', description: 'K-means, DBSCAN, hierarchical, GMM, and fuzzy clustering.', keywords: ['clustering', 'k-means', 'DBSCAN'], priority: 0.75 },
  { path: '/analysis/qc.charts', title: 'Control Charts', category: 'Analysis', description: 'Individuals, X-bar, p, EWMA, CUSUM, and rare-event charts.', keywords: ['control chart', 'SPC'], priority: 0.75 },
  { path: '/analysis/qc.capability', title: 'Process Capability', category: 'Analysis', description: 'Cp, Cpk, and Cpm versus specification limits.', keywords: ['process capability', 'Cpk'], priority: 0.7 },
  { path: '/analysis/audit.data', title: 'Data Auditing', category: 'Analysis', description: 'Benford, repeated values, and fairness gaps.', keywords: ['Benford', 'audit'], priority: 0.7 },
  { path: '/analysis/acceptance.attribute', title: 'Attribute Sampling', category: 'Analysis', description: 'Binomial OC curves and accept/reject lot plans.', keywords: ['acceptance sampling', 'AQL'], priority: 0.65 },
  { path: '/analysis/distributions.explorer', title: 'Distribution Families', category: 'Analysis', description: 'Compare named families including ZIP, Wald, skew-normal, and mixtures.', keywords: ['distributions', 'goodness of fit'], priority: 0.8 },
  { path: '/regression', title: 'Regression', category: 'Analysis', description: 'Redirects to Linear Regression in the Analysis workspace.', keywords: ['regression', 'linear model', 'prediction'], priority: 0.6 },
  { path: '/advanced', title: 'Advanced Analysis', category: 'Analysis', description: 'Advanced statistics, model diagnostics, workflows, and report-ready outputs.', keywords: ['advanced statistics', 'model diagnostics'], priority: 0.7 },
  { path: '/stat-modules', title: 'Stat Modules', category: 'Analysis', description: 'Large library of statistical modules for inference, modeling, visualization, and workflows.', keywords: ['statistics modules', 'statistical analysis'], priority: 0.9 },
  { path: '/syllabus', title: 'Syllabus Modules', category: 'Learning', description: 'Syllabus-aligned probability, inference, modeling, data quality, and reporting modules.', keywords: ['statistics syllabus', 'probability learning'], priority: 0.9 },
  { path: '/modules', title: 'Computer Science Modules', category: 'Learning', description: 'Interactive computer science modules for algorithms, security, and data structures.', keywords: ['computer science modules', 'algorithms learning'], priority: 0.6 },
  { path: '/learn', title: 'Core Statistics Learning Studio', category: 'Learning', description: 'Statistics learning studio with theorem modules, labs, quizzes, and practice.', keywords: ['learn statistics', 'statistics practice', 'probability lab'], priority: 1 },
  { path: '/classroom', title: 'Classroom', category: 'Learning', description: 'Assign a visual chapter, collect lab-replay JSON, and run practice items that reveal the picture.', keywords: ['classroom', 'lab replay', 'statistics assignment'], priority: 0.85 },
  { path: '/professional-learning', title: 'Professional Learning and Practice', category: 'Learning', description: 'Professional statistics learning paths, practice bank, decision wizard, assumptions, templates, and notebooks.', keywords: ['professional statistics training', 'practice questions', 'statistical decision wizard'], priority: 1 },
  { path: '/solver', title: 'Statistics Solver', category: 'Learning', description: 'Step-by-step statistics solver for standard deviation, correlation, regression, and index numbers.', keywords: ['statistics solver', 'step by step statistics'], priority: 0.9 },
  { path: '/dashboard', title: 'Dashboard', category: 'Output', description: 'Learner lesson wall of saved stages, or Analyze KPIs with links back into the matching labs.', keywords: ['statistics dashboard', 'lesson wall'], priority: 0.7 },
  { path: '/reports', title: 'Export and Reports', category: 'Output', description: 'Export reports plus stage PNG captures with a three-line teaching caption.', keywords: ['statistics report', 'export analysis', 'stage PNG'], priority: 0.8 },
  { path: '/documentation', title: 'Documentation', category: 'Documentation', description: 'Documentation page with links and details for every StatAnveshak tool and module area.', keywords: ['StatAnveshak documentation', 'statistics tool docs'], priority: 0.8 },
  { path: '/glossary', title: 'Statistics Glossary', category: 'Documentation', description: 'Searchable glossary of 200+ statistics terms with simple definitions and examples.', keywords: ['statistics glossary', 'statistics definitions', 'statistics examples'], priority: 0.85 },
  { path: '/docs', title: 'Documentation', category: 'Documentation', description: 'Documentation page with links and details for every StatAnveshak tool and module area.', keywords: ['StatAnveshak documentation', 'statistics tool docs'], priority: 0.8 },
  { path: '/sitemap', title: 'Sitemap', category: 'Documentation', description: 'Search-engine friendly sitemap of StatAnveshak pages and modules.', keywords: ['sitemap', 'statistics app pages'], priority: 0.6 },
  { path: '/settings', title: 'Settings', category: 'Workspace', description: 'Manage local browser storage, preferences, accessibility, and app settings.', keywords: ['settings', 'browser storage'], priority: 0.4 },
]

export const MODULE_SITE_PAGES: SitePageMeta[] = [
  ...STAT_MODULES.map((module) => ({
    path: `/stat-modules/${module.key}`,
    title: module.title,
    category: `Stat Modules - ${module.group}`,
    description: module.description,
    keywords: ['statistics module', module.group, module.title],
    priority: 0.65,
  })),
  ...SYLLABUS_MODULES.map((module) => ({
    path: `/syllabus/${module.key}`,
    title: module.title,
    category: `Syllabus - ${module.group}`,
    description: module.purpose,
    keywords: ['statistics syllabus', ...module.syllabusTags, ...module.concepts.slice(0, 3)],
    priority: 0.7,
  })),
  ...COMPUTING_MODULES.map((module) => ({
    path: `/modules/${module.key}`,
    title: module.title,
    category: `CS Modules - ${module.category}`,
    description: module.purpose,
    keywords: ['computer science learning', module.category, ...module.concepts.slice(0, 3)],
    priority: 0.45,
  })),
  ...DISTRIBUTIONS.map((dist) => ({
    path: `/distributions/${dist.id}`,
    title: `${dist.name} Distribution`,
    category: `Distributions - ${dist.family}`,
    description: dist.explanation,
    keywords: ['probability distribution', dist.name, dist.family, dist.support],
    priority: 0.6,
  })),
]

export const SITE_PAGES = [...CORE_SITE_PAGES, ...MODULE_SITE_PAGES]

export function findPageMeta(pathname: string) {
  return SITE_PAGES.find((page) => page.path === pathname)
    ?? (pathname.startsWith('/stat-modules/') ? CORE_SITE_PAGES.find((page) => page.path === '/stat-modules')
      : pathname.startsWith('/syllabus/') ? CORE_SITE_PAGES.find((page) => page.path === '/syllabus')
        : pathname.startsWith('/modules/') ? CORE_SITE_PAGES.find((page) => page.path === '/modules')
          : pathname.startsWith('/distributions/') ? CORE_SITE_PAGES.find((page) => page.path === '/distributions')
            : CORE_SITE_PAGES[0])
}
