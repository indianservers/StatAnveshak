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
  { path: '/explore/summary', title: 'Summary Statistics', category: 'Explore', description: 'Compute descriptive statistics and profile numeric/categorical variables.', keywords: ['summary statistics', 'descriptive statistics'], priority: 0.8 },
  { path: '/explore/charts', title: 'Charts', category: 'Explore', description: 'Create exploratory charts including histograms, bars, scatterplots, and boxplots.', keywords: ['statistics charts', 'data visualization'], priority: 0.8 },
  { path: '/explore/correlation', title: 'Correlation', category: 'Explore', description: 'Analyze correlation patterns between numeric variables.', keywords: ['correlation', 'Pearson correlation'], priority: 0.8 },
  { path: '/explore/frequency', title: 'Frequency Tables', category: 'Explore', description: 'Build frequency tables and categorical summaries.', keywords: ['frequency table', 'categorical data'], priority: 0.7 },
  { path: '/distributions', title: 'Distribution Explorer', category: 'Analysis', description: 'Explore probability distributions, parameters, simulations, and goodness-of-fit.', keywords: ['probability distributions', 'normal distribution', 'simulation'], priority: 0.9 },
  { path: '/inference', title: 'Inference Tests', category: 'Analysis', description: 'Run hypothesis tests and confidence intervals with assumption warnings.', keywords: ['hypothesis testing', 'confidence interval', 't-test'], priority: 0.9 },
  { path: '/regression', title: 'Regression', category: 'Analysis', description: 'Fit and interpret regression models for statistical learning.', keywords: ['regression', 'linear model', 'prediction'], priority: 0.8 },
  { path: '/advanced', title: 'Advanced Analysis', category: 'Analysis', description: 'Advanced statistics, model diagnostics, workflows, and report-ready outputs.', keywords: ['advanced statistics', 'model diagnostics'], priority: 0.7 },
  { path: '/stat-modules', title: 'Stat Modules', category: 'Analysis', description: 'Large library of statistical modules for inference, modeling, visualization, and workflows.', keywords: ['statistics modules', 'statistical analysis'], priority: 0.9 },
  { path: '/syllabus', title: 'Syllabus Modules', category: 'Learning', description: 'Syllabus-aligned probability, inference, modeling, data quality, and reporting modules.', keywords: ['statistics syllabus', 'probability learning'], priority: 0.9 },
  { path: '/modules', title: 'Computer Science Modules', category: 'Learning', description: 'Interactive computer science modules for algorithms, security, and data structures.', keywords: ['computer science modules', 'algorithms learning'], priority: 0.6 },
  { path: '/learn', title: 'Core Statistics Learning Studio', category: 'Learning', description: 'Statistics learning studio with theorem modules, labs, quizzes, and practice.', keywords: ['learn statistics', 'statistics practice', 'probability lab'], priority: 1 },
  { path: '/professional-learning', title: 'Professional Learning and Practice', category: 'Learning', description: 'Professional statistics learning paths, practice bank, decision wizard, assumptions, templates, and notebooks.', keywords: ['professional statistics training', 'practice questions', 'statistical decision wizard'], priority: 1 },
  { path: '/solver', title: 'Statistics Solver', category: 'Learning', description: 'Step-by-step statistics solver for standard deviation, correlation, regression, and index numbers.', keywords: ['statistics solver', 'step by step statistics'], priority: 0.9 },
  { path: '/dashboard', title: 'Dashboard', category: 'Output', description: 'Dataset dashboard with KPIs, charts, and summary panels.', keywords: ['statistics dashboard', 'analytics dashboard'], priority: 0.7 },
  { path: '/reports', title: 'Export and Reports', category: 'Output', description: 'Export reports as HTML, Markdown, Word-compatible documents, and data files.', keywords: ['statistics report', 'export analysis'], priority: 0.8 },
  { path: '/documentation', title: 'Documentation', category: 'Documentation', description: 'Documentation page with links and details for every StatAnveshak tool and module area.', keywords: ['StatAnveshak documentation', 'statistics tool docs'], priority: 0.8 },
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
