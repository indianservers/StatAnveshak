# Stat Modules Audit and 3-Phase Implementation Plan

## Goal

Make every Stat Module feel like its own teaching and working page: compact navigation, clear theory, correct inputs, module-specific visuals, and interactive tools that help a learner understand the method while working on the loaded dataset.

## Phase 1 - Navigation, Layout, and Audit Foundation

Status: Implemented.

Implemented files:
- `src/pages/StatModulesPage.tsx`
- `src/index.css`
- `docs/stat-modules-3-phase-plan.md`

Scope:
- Add a properly constrained scrollbar to the Stat Modules menu list.
- Keep module search, favorites, and recent modules accessible while the full module catalog scrolls.
- Reduce the sticky module header height so more screen space goes to inputs, results, charts, and tables.
- Add this audit plan and use it as the implementation checklist.
- Keep the existing compute engine intact.

Acceptance:
- `/stat-modules` menu scrolls independently.
- Header is compact and does not dominate the working area.
- All 90 modules are inventoried.
- The next phase has a clear module-specific target list.

## Phase 2 - Module-Specific Learning and Interactive Workbench

Status: Implemented.

Implemented files:
- `src/lib/statModuleProfiles.ts`
- `src/pages/StatModulesPage.tsx`
- `docs/stat-modules-3-phase-plan.md`

Scope:
- Add a module profile layer keyed by `module.key`.
- For each module, show module-specific theory:
  - What question this module answers.
  - When to use it.
  - Required data shape.
  - Assumptions.
  - How to read the result.
  - Common mistakes.
- Replace the single generic explanation box with a module-specific theory card.
- Add module-specific input presets and clearer labels.
- Add interactive controls where appropriate:
  - Hypothesis modules: null value, alternative direction, alpha slider, decision meter.
  - Regression modules: predictor/target builder, residual diagnostics toggles.
  - Chart modules: bin count, chart orientation, aggregation, color/group controls.
  - Advanced workflows: scenario controls, preview builders, validation toggles.

Acceptance:
- Each module has a tailored explanation and input guidance.
- Users can understand what the module does without reading generic statistical text.
- Existing results remain compatible with current exports.

## Phase 3 - Visual Components, Charts, and Deep Module Pages

Status: Implemented.

Implemented files:
- `src/pages/StatModulesPage.tsx`
- `docs/stat-modules-3-phase-plan.md`

Scope:
- Build module-specific visual components instead of only relying on `result.chart`.
- Add secondary charts and diagnostic panels:
  - Distribution overlays, confidence interval diagrams, p-value shading.
  - Residual plots, fitted vs actual, coefficient forest plots.
  - Group comparison plots, rank plots, post-hoc comparison maps.
  - ROC/threshold explorer, cluster maps, PCA biplot, survival curve.
  - Workflow modules with editable previews, audit trails, report builders, dashboard layout previews.
- Add visual QA with desktop and mobile screenshots.
- Add focused tests for module profile mapping and result rendering.

Acceptance:
- High-value modules have more than one visual where useful.

## New 4-Phase Module-Specific Depth Plan

Status: Phase 1 in progress.

Phase 1 - Core Statistics Labs:
- Modules 61-80.
- Build the registry pattern for module-specific depth.
- Add tailored lab identity, visual focus, controls, result cards, and interpretation prompts for inferential and modeling modules.
- Prioritize hypothesis tests, ANOVA, chi-square, correlation, regression, time series, clustering, PCA, and classification metrics.

Phase 2 - Charting and Visualization Labs:
- Modules 81-100.
- Add chart-specific editors and visual explainers: histogram bin/density lab, bar percent/count mode, scatter diagnostics, box/violin spread labs, heatmap cell inspector, correlation matrix, pair plot, QQ, ECDF, Pareto, control chart, Sankey, and dashboard builder.

Phase 3 - Advanced Statistical and Data Workflow Labs:
- Modules 101-125.
- Add advanced inference/model/data preparation depth: two-way/repeated ANOVA, ANCOVA/MANOVA, post-hoc tests, exact tests, normality/variance/residual diagnostics, robust/regularized/stepwise models, ROC/CV, imputation, formula columns, joins, and reshape previews.

Phase 4 - Reporting, Automation, Model Governance, and QA Labs:
- Modules 126-150.
- Add report builder, export packages, script/session/notebook workflows, chart/dashboard templates, weighted/bootstrap/permutation/Bayesian/survival/time-series/PCA/clustering/classification/model-comparison labs, assumption warnings, plain-language interpretation, and engine/golden tests.
- Advanced workflow modules stop looking like placeholder metadata pages.
- Each module page has useful theory, interactive controls, result interpretation, and visual feedback.

## Full Module Inventory

### Inferential

| ID | Key | Module | Module-specific upgrade |
| --- | --- | --- | --- |
| 61 | `confidence_interval` | Confidence Interval | CI interval ruler, mean/proportion/variance selector, alpha slider, plain reading of interval width. |
| 62 | `one_sample_tests` | One-Sample Hypothesis Test | Null value control, alternative direction, p-value curve shading, reject/fail decision card. |
| 63 | `two_sample_tests` | Two-Sample Hypothesis Test | Independent vs paired toggle, group mean difference plot, effect direction explainer. |
| 64 | `anova` | ANOVA | Group box/violin view, F-ratio diagram, post-hoc comparison table and chart. |
| 65 | `chi_square` | Chi-Square Test | Contingency heatmap, expected vs observed cells, contribution-to-chi-square chart. |
| 66 | `non_parametric` | Non-Parametric Tests | Rank strip, group rank distribution, test chooser based on design. |
| 67 | `correlation_testing` | Correlation Testing | Scatter with trend, rank scatter toggle, correlation strength guide. |
| 68 | `power_sample_size` | Power and Sample Size | Interactive power curve, sample-size slider, detectable-effect calculator. |
| 69 | `effect_size` | Effect Size | Cohen d overlap visual, eta squared gauge, odds/risk ratio mini table. |
| 70 | `gof_distribution` | Goodness-of-Fit | Distribution ranking table, histogram overlay, Q-Q/ECDF fit comparison. |

### Regression and Modeling

| ID | Key | Module | Module-specific upgrade |
| --- | --- | --- | --- |
| 71 | `simple_regression` | Simple Linear Regression | Fit line with confidence band, residual plot, slope interpretation card. |
| 72 | `multiple_regression` | Multiple Linear Regression | Coefficient forest plot, predictor contribution cards, residual diagnostics tabs. |
| 73 | `logistic_regression` | Logistic Regression | Probability curve, threshold slider, odds-ratio interpretation. |
| 74 | `polynomial_regression` | Polynomial Regression | Degree selector, fit comparison chart, overfit warning. |
| 75 | `regression_diagnostics` | Regression Diagnostics | Residual vs fitted, leverage, Cook distance, VIF warning panel. |
| 76 | `time_series_basics` | Time Series Basics | Trend, moving average, lag plot, seasonal cue panel. |
| 77 | `forecasting_basics` | Forecasting Basics | Forecast overlay, method comparison, error metric cards. |
| 78 | `clustering` | Clustering Basics | K slider, cluster scatter, centroid cards. |
| 79 | `pca` | PCA | Explained variance bars, score plot, loading/biplot teaching panel. |
| 80 | `classification_metrics` | Classification Metrics | Confusion matrix, ROC, threshold explorer, precision-recall cards. |

### Charting and Visualization

| ID | Key | Module | Module-specific upgrade |
| --- | --- | --- | --- |
| 81 | `histogram` | Histogram | Bin slider, density overlay, outlier markers. |
| 82 | `bar_chart` | Bar Chart | Sort/order toggle, percent/count mode, top-N control. |
| 83 | `line_chart` | Line Chart | Smoothing toggle, point markers, range selector. |
| 84 | `area_chart` | Area Chart | Stacked/filled mode, baseline explanation. |
| 85 | `scatter_plot` | Scatter Plot | Trendline toggle, color/group selector, point opacity. |
| 86 | `bubble_chart` | Bubble Chart | Bubble scale control, size legend, tooltip fields. |
| 87 | `box_plot` | Box Plot | Outlier display, group ordering, quartile explanation. |
| 88 | `violin_plot` | Violin Plot | Box overlay toggle, bandwidth explanation. |
| 89 | `density_plot` | Density Plot | Bandwidth slider, histogram overlay. |
| 90 | `heatmap` | Heatmap | Count/percent mode, cell labels, color scale chooser. |
| 91 | `correlation_matrix` | Correlation Matrix | Variable picker, threshold highlighting, matrix interpretation. |
| 92 | `pair_plot` | Pair Plot | Matrix layout, variable subset selector. |
| 93 | `qq_plot` | QQ Plot | Reference line, tail deviation callouts. |
| 94 | `ecdf_plot` | ECDF Plot | Percentile reader, group ECDF overlay. |
| 95 | `pareto_chart` | Pareto Chart | 80/20 marker, cumulative percent callouts. |
| 96 | `control_chart` | Control Chart | Centerline, UCL/LCL, rule violation markers. |
| 97 | `pie_donut` | Pie / Donut Chart | Donut toggle, label mode, small-slice grouping. |
| 98 | `treemap` | Treemap | Grouping depth, value labels. |
| 99 | `sankey` | Sankey Chart | Source/target selector, flow table. |
| 100 | `dashboard_builder` | Dashboard Builder | Interactive preview grid, panel presets. |

### Advanced Workflows

| ID | Key | Module | Module-specific upgrade |
| --- | --- | --- | --- |
| 101 | `two_way_anova_interaction` | Two-Way ANOVA with Interaction | Interaction plot, main effects panel, two-factor cell means. |
| 102 | `repeated_measures_anova` | Repeated-Measures ANOVA | Subject profile lines, within-subject contrast table. |
| 103 | `ancova` | ANCOVA | Adjusted means plot, covariate slope visual. |
| 104 | `manova` | MANOVA Screening | Multi-outcome summary, outcome mini charts. |
| 105 | `tukey_hsd` | Tukey-Style Post-Hoc | Pairwise difference plot, significant-pair highlighting. |
| 106 | `multiple_testing_corrections` | Bonferroni / Holm Correction | P-value ladder, correction threshold visual. |
| 107 | `fisher_exact` | Fisher's Exact Test | 2x2 table builder, exact-probability explanation. |
| 108 | `mcnemar` | McNemar's Test | Paired change matrix, discordant-pair focus. |
| 109 | `exact_binomial` | Exact Binomial Test | Binomial PMF with observed tail shading. |
| 110 | `shapiro_wilk` | Shapiro-Francia Normality | Q-Q plot, normality score explanation. |
| 111 | `levene_brown_forsythe` | Levene / Brown-Forsythe Variance | Group spread plot, mean/median center toggle. |
| 112 | `durbin_watson` | Durbin-Watson | Residual sequence and lag residual scatter. |
| 113 | `breusch_pagan` | Breusch-Pagan | Residual spread vs fitted, heteroscedasticity guide. |
| 114 | `robust_regression` | Robust Regression | OLS vs robust line, weight/outlier panel. |
| 115 | `ridge_lasso` | Ridge / Lasso Regression | Lambda slider, coefficient shrinkage path. |
| 116 | `stepwise_selection` | Stepwise Model Selection | Step table, adjusted R2 progression. |
| 117 | `logistic_se_pvalues` | Logistic Regression SE / p-values | Wald interval forest plot, odds-ratio chart. |
| 118 | `roc_auc` | ROC AUC | ROC curve, threshold explorer, AUC shading. |
| 119 | `train_test_cv` | Train/Test Split and Cross-Validation | Split visual, fold cards, error comparison. |
| 120 | `missing_imputation` | Missing-Data Imputation | Missingness heatmap, method preview table. |
| 121 | `transformation_history` | Transformation History / Audit Trail | Timeline view, reproducibility badge. |
| 122 | `undo_redo_cleaning` | Undo/Redo Cleaning Operations | Command stack visual, undo/redo simulator. |
| 123 | `formula_columns` | Formula-Based Computed Columns | Formula preview, computed-column histogram. |
| 124 | `merge_join_append` | Dataset Merge / Join / Append | Join key diagnostics, join outcome diagram. |
| 125 | `reshape_wide_long` | Wide-to-Long / Long-to-Wide Reshaping | Before/after table preview. |
| 126 | `report_builder` | Complete Report Builder | Report outline builder, section preview. |
| 127 | `export_pdf_html_docx` | Export PDF / HTML / Word-Compatible Report | Export checklist, format preview cards. |
| 128 | `script_export` | Reproducible Analysis Script Export | Script preview with copy/download. |
| 129 | `saved_sessions` | Saved Analysis Sessions | Session card preview and restore metadata. |
| 130 | `project_notebook` | Project Notebook / Analysis History | Notebook timeline entry preview. |
| 131 | `chart_editor` | Chart Editor | Live title/axis/color control preview. |
| 132 | `dashboard_layout_builder` | Dashboard Layout Builder | Resizable grid mockup. |
| 133 | `chart_templates` | Chart Templates / Presets | Template gallery with preview thumbnails. |
| 134 | `weighted_statistics` | Weighted Statistics / Survey Weights | Weighted vs unweighted comparison chart. |
| 135 | `bootstrap_ci` | Bootstrapping | Bootstrap distribution, CI percentile markers. |
| 136 | `permutation_tests` | Permutation Tests | Shuffle distribution, observed statistic marker. |
| 137 | `bayesian_basics` | Bayesian Priors / Posteriors | Prior/posterior beta curve overlay. |
| 138 | `survival_analysis` | Kaplan-Meier Survival | Survival step curve, risk table. |
| 139 | `arima_ets` | AR(1) / ETS Time-Series | Forecast line, residual autocorrelation. |
| 140 | `seasonal_decomposition` | Seasonal Decomposition | Trend/seasonal/residual stacked panels. |
| 141 | `robust_pca` | Robust Multi-Variable PCA | PCA score plot, robust outlier highlights. |
| 142 | `hierarchical_dendrogram` | Hierarchical Clustering Dendrogram | Dendrogram visual and merge table. |
| 143 | `dbscan` | DBSCAN Clustering | Epsilon/min-points controls, noise highlighting. |
| 144 | `classification_models` | Classification Models | Model cards, confusion matrix, threshold comparison. |
| 145 | `model_comparison` | Model Comparison Dashboard | Model leaderboard and metric radar/bars. |
| 146 | `assumption_diagnostics` | Assumption Diagnostics | Assumption checklist with linked diagnostics. |
| 147 | `plain_language_interpretation` | Plain-Language Interpretation | Guided interpretation builder. |
| 148 | `warning_system` | Invalid-Assumption Warning System | Warning rules dashboard. |
| 149 | `engine_unit_tests` | Unit-Test Suite | Test status grid and failure details. |
| 150 | `golden_value_tests` | Golden-Value Tests | Reference comparison table and tolerance badges. |
