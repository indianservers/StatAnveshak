import type { LearnChapterId } from './learnChapters'
import type { StatModuleDef } from './statModules'

export const WORKFLOW_ONLY_MODULE_KEYS = new Set([
  'undo_redo_cleaning',
  'report_builder',
  'export_pdf_html_docx',
  'script_export',
  'saved_sessions',
  'project_notebook',
  'chart_editor',
  'dashboard_layout_builder',
  'chart_templates',
  'transformation_history',
  'merge_join_append',
  'formula_columns',
  'reshape_wide_long',
  'engine_unit_tests',
  'golden_value_tests',
  'warning_system',
  'plain_language_interpretation',
])

export const TEACHING_APPROXIMATION_KEYS = new Set([
  'manova',
  'tukey_hsd',
  'shapiro_wilk',
  'ridge_lasso',
  'stepwise_selection',
  'gof_distribution',
  'logistic_regression',
  'forecasting_basics',
  'bootstrap_ci',
  'permutation_tests',
  'bayesian_basics',
  'missing_imputation',
  'seasonal_decomposition',
  'arima_ets',
  'robust_pca',
  'hierarchical_dendrogram',
  'dbscan',
  'classification_models',
  'multiple_testing_corrections',
])

export const STAT_MODULE_HERO: Partial<Record<string, LearnChapterId | 'sampling'>> = {
  confidence_interval: 'frequentist',
  one_sample_tests: 'sampling',
  bootstrap_ci: 'frequentist',
  permutation_tests: 'frequentist',
  bayesian_basics: 'bayesian',
  simple_regression: 'regression',
  multiple_regression: 'regression',
}

export const STAT_MODULE_PRESET_HREF: Partial<Record<string, string>> = {
  histogram: '/explore/charts',
  density_plot: '/explore/charts',
  box_plot: '/explore/charts',
  violin_plot: '/explore/charts',
  scatter_plot: '/analysis/regression.correlation',
  correlation_matrix: '/analysis/regression.correlation',
  correlation_testing: '/analysis/regression.correlation',
}

export function isWorkflowOnlyModule(key: string) {
  return WORKFLOW_ONLY_MODULE_KEYS.has(key)
}

export function isTeachingApproximation(key: string) {
  return TEACHING_APPROXIMATION_KEYS.has(key)
}

export function teachingGalleryModules(modules: StatModuleDef[]) {
  return modules.filter((module) => !isWorkflowOnlyModule(module.key))
}
