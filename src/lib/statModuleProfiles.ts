import type { StatModuleDef, StatModuleSelection } from './statModules'

export type ModuleProfile = {
  question: string
  useWhen: string
  dataShape: string
  assumptions: string[]
  readResult: string[]
  commonMistakes: string[]
  workflow: string[]
  inputLabels: Partial<Record<keyof StatModuleSelection, string>>
  inputHints: string[]
  interactiveTools: string[]
}

export type ModuleLearningContent = {
  formulas: Array<{ label: string; expression: string; note: string }>
  workedExample: { title: string; setup: string; steps: string[]; takeaway: string }
  academicNotes: string[]
  misuseWarnings: string[]
  glossaryTerms: string[]
  citations: string[]
}

type ProfileSeed = Partial<ModuleProfile>

const baseLabels: ModuleProfile['inputLabels'] = {
  num1: 'Primary measure',
  num2: 'Comparison measure',
  num3: 'Third measure',
  target: 'Target outcome',
  cat1: 'Primary group',
  cat2: 'Second group',
  alpha: 'Alpha',
}

const groupDefaults: Record<StatModuleDef['group'], ModuleProfile> = {
  Inferential: {
    question: 'Is the observed pattern strong enough to treat as evidence, or could random sampling explain it?',
    useWhen: 'Use this when you need a statistical decision about means, proportions, groups, association, or distribution fit.',
    dataShape: 'Usually needs numeric measurements, categorical grouping variables, and enough valid rows for stable inference.',
    assumptions: ['Rows should represent independent observations.', 'Selected columns should match the test design.', 'Missing values are ignored by the calculation.'],
    readResult: ['Start with the p-value compared with alpha.', 'Use effect size or interval width to judge practical importance.', 'Check the chart and warnings before writing a conclusion.'],
    commonMistakes: ['Choosing a test before matching the data shape.', 'Treating p-value as effect size.', 'Ignoring small samples or sparse categories.'],
    workflow: ['Choose the outcome and grouping columns.', 'Check assumptions and warnings.', 'Read the p-value, interval, or effect size.', 'Write the conclusion in plain language.'],
    inputLabels: baseLabels,
    inputHints: ['Use a measured numeric outcome for the primary measure.', 'Use categories for groups or contingency tests.', 'Alpha controls the decision threshold.'],
    interactiveTools: ['Alpha slider', 'Decision guide', 'Assumption checklist'],
  },
  'Regression & Modeling': {
    question: 'How well do selected predictors explain or predict the target outcome?',
    useWhen: 'Use this when you want a relationship model, prediction model, diagnostic, clustering, or dimension-reduction view.',
    dataShape: 'Needs numeric predictors and usually a numeric or binary target, with rows representing comparable observations.',
    assumptions: ['Predictors should be meaningful for the target.', 'Outliers and missing values can strongly affect the model.', 'Model diagnostics should be checked before trusting coefficients.'],
    readResult: ['Read fit metrics first, then inspect coefficients or clusters.', 'Use diagnostics to find outliers, nonlinearity, or unstable predictors.', 'Prefer practical interpretation over metric chasing.'],
    commonMistakes: ['Reading correlation as causation.', 'Using too many predictors for too few rows.', 'Trusting a model without residual or validation checks.'],
    workflow: ['Select target and predictors.', 'Inspect fit and diagnostics.', 'Compare alternatives when available.', 'Translate coefficients or clusters into a clear data story.'],
    inputLabels: { ...baseLabels, num1: 'Predictor X1', num2: 'Predictor X2', num3: 'Predictor X3', target: 'Target Y' },
    inputHints: ['Target is the outcome to explain or predict.', 'Predictors should be numeric unless the module says otherwise.', 'Check residual and validation outputs when shown.'],
    interactiveTools: ['Predictor builder', 'Diagnostic toggles', 'Model comparison cards'],
  },
  'Charting & Visualization': {
    question: 'What shape, pattern, comparison, or relationship is visible in the selected data?',
    useWhen: 'Use this when you need a visual explanation before or alongside statistical testing.',
    dataShape: 'Chart modules use numeric columns for measurement and categorical columns for grouping, labels, or flows.',
    assumptions: ['Variables should be selected for the chart type.', 'Categories with too many levels may need filtering.', 'Outliers can dominate chart scale.'],
    readResult: ['Look for shape, spread, clusters, trend, and unusual points.', 'Use axes and legends before interpreting the pattern.', 'Connect the chart back to the statistical question.'],
    commonMistakes: ['Using a chart type that does not match the variable types.', 'Overplotting too many categories.', 'Reading visual pattern without checking scale.'],
    workflow: ['Pick the chart-specific variables.', 'Adjust chart settings when available.', 'Inspect the main pattern.', 'Export or use the chart as evidence for the next analysis.'],
    inputLabels: { ...baseLabels, num1: 'Value', num2: 'X / second value', num3: 'Size / third value', cat1: 'Category', cat2: 'Second category' },
    inputHints: ['Numeric fields drive position, size, or scale.', 'Categorical fields drive grouping, labels, or flows.', 'Use the chart to decide what analysis to run next.'],
    interactiveTools: ['Chart controls', 'Grouping selector', 'Exportable visual'],
  },
  'Advanced Workflows': {
    question: 'What deeper diagnostic, workflow, transformation, or modeling step should happen next?',
    useWhen: 'Use this for advanced designs, model diagnostics, reproducible workflows, cleaning previews, and report-building tasks.',
    dataShape: 'Requirements vary by module, but most use selected numeric fields, group fields, or current dataset metadata.',
    assumptions: ['The selected workflow should match the analysis stage.', 'Preview outputs may be planning aids rather than final inferential tests.', 'Advanced modules often need careful interpretation.'],
    readResult: ['Separate diagnostic warnings from final conclusions.', 'Use tables as checklists or audit records when the module is workflow-oriented.', 'Follow the module-specific next step before reporting.'],
    commonMistakes: ['Treating workflow metadata as final statistics.', 'Skipping assumptions because the module is advanced.', 'Using defaults without checking selected columns.'],
    workflow: ['Select the workflow inputs.', 'Review diagnostic or preview output.', 'Decide the next action.', 'Record or export the workflow result.'],
    inputLabels: baseLabels,
    inputHints: ['Use the selected fields as the workflow preview inputs.', 'Some modules are planning or audit tools, so tables may matter more than p-values.', 'Check the module guidance before interpreting.'],
    interactiveTools: ['Scenario controls', 'Preview builder', 'Validation checklist'],
  },
}

const profiles: Record<string, ProfileSeed> = {
  confidence_interval: {
    question: 'What range of plausible population values is supported by this sample?',
    useWhen: 'Use when an estimate needs uncertainty, such as a mean, proportion, variance, or group difference.',
    dataShape: 'Numeric 1 supplies the main sample; Numeric 2 supplies a comparison sample for difference intervals.',
    readResult: ['The interval gives plausible values, not guaranteed individual values.', 'A narrower interval means more precision.', 'If a mean-difference interval crosses zero, the direction is uncertain at this alpha.'],
    commonMistakes: ['Calling the interval the range of the raw data.', 'Ignoring interval width.', 'Changing alpha after seeing the result.'],
    interactiveTools: ['Alpha slider', 'Interval-width comparison', 'Estimator selector'],
  },
  one_sample_tests: {
    question: 'Does one sample differ from a fixed reference value?',
    dataShape: 'Use Numeric 1 as the sample. Positive values are treated as successes for the proportion test.',
    assumptions: ['The sample is independent.', 'The numeric outcome is roughly symmetric for t-style mean inference.', 'Binary coding should be intentional for proportion tests.'],
    readResult: ['p below alpha suggests evidence against the reference.', 'Compare z and t results when sample size is small.', 'Report the reference value used by the module.'],
    interactiveTools: ['Reference value control', 'Alternative direction toggle', 'P-value shading'],
  },
  two_sample_tests: {
    question: 'Do two samples or paired measurements differ?',
    dataShape: 'Numeric 1 and Numeric 2 provide two samples; paired rows are used for paired testing.',
    readResult: ['Welch p handles unequal variances better than pooled tests.', 'Paired tests ask whether within-row differences center on zero.', 'Two-proportion test treats positive values as successes.'],
    interactiveTools: ['Independent/paired mode switch', 'Mean difference plot', 'Effect direction card'],
  },
  anova: {
    question: 'Do three or more groups have different means?',
    dataShape: 'Numeric 1 is the outcome; Category 1 defines groups.',
    readResult: ['A significant F says at least one group mean differs.', 'Use post-hoc rows to locate likely group differences.', 'Eta squared describes practical size.'],
    interactiveTools: ['Group comparison plot', 'Post-hoc map', 'F-ratio explainer'],
  },
  chi_square: {
    question: 'Are two categorical variables associated?',
    dataShape: 'Category 1 and Category 2 form the contingency table.',
    readResult: ['Large observed-vs-expected gaps drive chi-square.', 'Sparse cells can make approximation unstable.', 'Inspect heatmap cells, not only the p-value.'],
    interactiveTools: ['Observed/expected toggle', 'Cell contribution heatmap', 'Sparse-cell warning'],
  },
  non_parametric: {
    question: 'Do groups or paired measurements differ when rank-based methods are safer?',
    dataShape: 'Numeric 1 is ranked by Category 1 groups; Numeric 1 and Numeric 2 support paired differences.',
    readResult: ['Rank tests compare ordering, not raw mean difference.', 'Use Kruskal-Wallis for more than two groups.', 'Use Wilcoxon/sign tests for paired rows.'],
    interactiveTools: ['Rank strip', 'Design chooser', 'Median-focused summary'],
  },
  correlation_testing: {
    question: 'How strongly do two variables move together?',
    dataShape: 'Numeric 1 and Numeric 2 form paired x-y observations.',
    readResult: ['Pearson reads linear association.', 'Spearman reads monotonic rank association.', 'Kendall is conservative and rank-based.'],
    interactiveTools: ['Correlation strength guide', 'Rank toggle', 'Trend overlay'],
  },
  power_sample_size: {
    question: 'How many observations are needed to detect a meaningful effect?',
    dataShape: 'Uses alpha and default target power; dataset rows are context rather than required measurements.',
    readResult: ['Larger effect sizes need fewer observations.', 'Smaller alpha needs more observations.', 'Power planning should happen before data collection.'],
    interactiveTools: ['Effect-size slider', 'Power curve', 'Sample-size calculator'],
  },
  effect_size: {
    question: 'How large is the observed effect in practical terms?',
    dataShape: 'Numeric 1 and Category 1 support mean effects; Category 1 and Category 2 support categorical effects.',
    readResult: ['Cohen d reads standardized group difference.', 'Eta squared reads explained group variance.', 'Odds and risk ratios read categorical contrast.'],
    interactiveTools: ['Effect magnitude gauge', 'Group overlap visual', 'Risk-ratio card'],
  },
  gof_distribution: {
    question: 'Which theoretical distribution best matches the selected numeric data?',
    dataShape: 'Numeric 1 should be the variable whose distribution you want to compare.',
    readResult: ['Lower statistic ranks better among compatible fits.', 'Check support and shape before trusting rank.', 'Use this with the Distributions page for deeper visual fitting.'],
    interactiveTools: ['Fit leaderboard', 'Histogram overlay', 'Q-Q comparison'],
  },
  simple_regression: {
    question: 'Can one predictor explain a numeric outcome with a straight line?',
    dataShape: 'Numeric 1 is X; Numeric 2 is Y.',
    readResult: ['Slope is the expected change in Y per one unit of X.', 'R2 is the share of Y variation explained by the line.', 'Residuals reveal where the line fails.'],
    interactiveTools: ['Fit-line overlay', 'Residual toggle', 'Slope interpretation card'],
  },
  multiple_regression: {
    question: 'How do several predictors jointly explain a target?',
    dataShape: 'Target Y is modeled from Numeric 1, Numeric 2, and Numeric 3.',
    readResult: ['Each coefficient is conditional on the other predictors.', 'Adjusted R2 is better than R2 for comparing predictor counts.', 'Watch for collinearity.'],
    interactiveTools: ['Coefficient table guide', 'Predictor contribution cards', 'Residual diagnostics'],
  },
  logistic_regression: {
    question: 'How do predictors change the probability of a binary outcome?',
    dataShape: 'Target should be binary-coded; Numeric 1 and Numeric 2 are predictors.',
    readResult: ['Odds ratios above 1 increase odds; below 1 decrease odds.', 'Accuracy depends on the threshold.', 'Use probability language, not linear-change language.'],
    interactiveTools: ['Threshold slider', 'Odds ratio card', 'Probability curve'],
  },
  polynomial_regression: {
    question: 'Does a curved relationship fit better than a straight line?',
    dataShape: 'Numeric 1 is X and Numeric 2 is Y.',
    readResult: ['Higher degree can fit bends but can overfit.', 'Adjusted R2 penalizes unnecessary complexity.', 'Inspect shape before accepting a higher degree.'],
    interactiveTools: ['Degree selector', 'Curve comparison', 'Overfit warning'],
  },
  regression_diagnostics: {
    question: 'Can the regression model be trusted?',
    dataShape: 'Target is modeled from Numeric 1-3.',
    readResult: ['Large Cook distance suggests influential rows.', 'High leverage points have unusual predictor values.', 'VIF highlights unstable predictors.'],
    interactiveTools: ['Residual plot', 'Influence scanner', 'VIF checklist'],
  },
  time_series_basics: {
    question: 'What trend and lag pattern exists over sequence order?',
    dataShape: 'Numeric 1 is treated as a time-ordered series in row order.',
    readResult: ['Moving average smooths noise.', 'Lag-1 correlation shows persistence.', 'Row order matters.'],
    interactiveTools: ['Moving average window', 'Lag plot', 'Trend marker'],
  },
  forecasting_basics: {
    question: 'How do simple forecast baselines behave on this series?',
    dataShape: 'Numeric 1 is a time-ordered series.',
    readResult: ['Compare naive, moving average, and smoothing visually.', 'MAE measures typical absolute error.', 'Simple baselines are sanity checks.'],
    interactiveTools: ['Smoothing slider', 'Forecast overlay', 'Error comparison'],
  },
  clustering: {
    question: 'Do observations form natural groups in two numeric dimensions?',
    dataShape: 'Numeric 1 and Numeric 2 define the point space.',
    readResult: ['Clusters are proximity groups, not automatically real categories.', 'Centroids summarize cluster centers.', 'Scale can change assignments.'],
    interactiveTools: ['K selector', 'Cluster scatter', 'Centroid cards'],
  },
  pca: {
    question: 'Can two or more variables be summarized by fewer dimensions?',
    dataShape: 'Numeric 1 and Numeric 2 provide the current PCA screen.',
    readResult: ['PC1 explained shows how much variation the first axis captures.', 'Scores show observations on the component axis.', 'Standardization may matter when scales differ.'],
    interactiveTools: ['Explained variance bars', 'Score plot', 'Loading guide'],
  },
  classification_metrics: {
    question: 'How well does a score classify a binary target?',
    dataShape: 'Numeric 1 is the score; Target is binary-coded.',
    readResult: ['Precision reads false-positive control.', 'Recall reads missed-positive control.', 'F1 balances precision and recall.'],
    interactiveTools: ['Threshold explorer', 'Confusion matrix', 'ROC guide'],
  },
}

const chartCopy: Record<string, ProfileSeed> = {
  histogram: { question: 'What is the shape and spread of one numeric variable?', dataShape: 'Numeric 1 supplies values for bins.', interactiveTools: ['Bin slider', 'Density overlay', 'Outlier markers'] },
  bar_chart: { question: 'How many rows fall in each category?', dataShape: 'Category 1 supplies bars.', interactiveTools: ['Sort toggle', 'Count/percent mode', 'Top-N control'] },
  line_chart: { question: 'How does a numeric value move over row order?', dataShape: 'Numeric 1 is plotted as a sequence.', interactiveTools: ['Smoothing toggle', 'Point markers', 'Range selector'] },
  area_chart: { question: 'How does accumulated magnitude change over row order?', dataShape: 'Numeric 1 supplies the filled sequence.', interactiveTools: ['Fill mode', 'Baseline guide', 'Range selector'] },
  scatter_plot: { question: 'What relationship appears between two numeric variables?', dataShape: 'Numeric 1 is X; Numeric 2 is Y.', interactiveTools: ['Trendline toggle', 'Opacity control', 'Group color selector'] },
  bubble_chart: { question: 'How do two numeric variables relate when a third controls size?', dataShape: 'Numeric 1 is X, Numeric 2 is Y, Numeric 3 is bubble size.', interactiveTools: ['Bubble scale', 'Size legend', 'Tooltip fields'] },
  box_plot: { question: 'How does numeric spread compare across groups?', dataShape: 'Numeric 1 is the value; Category 1 defines groups.', interactiveTools: ['Outlier toggle', 'Group sorting', 'Quartile explainer'] },
  violin_plot: { question: 'How does the full distribution shape compare across groups?', dataShape: 'Numeric 1 is the value; Category 1 defines groups.', interactiveTools: ['Box overlay', 'Bandwidth guide', 'Group sorting'] },
  density_plot: { question: 'What smooth distribution shape does the numeric variable have?', dataShape: 'Numeric 1 supplies the distribution.', interactiveTools: ['Bandwidth slider', 'Histogram overlay', 'Tail marker'] },
  heatmap: { question: 'Where are category combinations concentrated?', dataShape: 'Category 1 and Category 2 form heatmap cells.', interactiveTools: ['Count/percent mode', 'Cell labels', 'Color scale'] },
  correlation_matrix: { question: 'Which selected numeric variables move together?', dataShape: 'Numeric 1-3 form the current matrix.', interactiveTools: ['Threshold highlight', 'Variable subset', 'Strength legend'] },
  pair_plot: { question: 'What pairwise relationships appear among selected numeric variables?', dataShape: 'Numeric 1-3 form pairwise panels.', interactiveTools: ['Matrix selector', 'Point opacity', 'Diagonal histogram'] },
  qq_plot: { question: 'How close is a numeric variable to a normal distribution?', dataShape: 'Numeric 1 supplies ordered sample quantiles.', interactiveTools: ['Reference line', 'Tail callouts', 'Deviation guide'] },
  ecdf_plot: { question: 'What share of values falls at or below each threshold?', dataShape: 'Numeric 1 supplies sorted observations.', interactiveTools: ['Percentile reader', 'Threshold marker', 'Group overlay'] },
  pareto_chart: { question: 'Which categories dominate the total count?', dataShape: 'Category 1 supplies categories sorted by frequency.', interactiveTools: ['80/20 marker', 'Cumulative line', 'Top-N control'] },
  control_chart: { question: 'Is a process stable over row order?', dataShape: 'Numeric 1 is an ordered process measure.', interactiveTools: ['Control-limit markers', 'Rule badges', 'Centerline toggle'] },
  pie_donut: { question: 'What share does each category contribute?', dataShape: 'Category 1 supplies slices.', interactiveTools: ['Donut toggle', 'Label mode', 'Small-slice grouping'] },
  treemap: { question: 'How do categories compare as parts of a whole?', dataShape: 'Category 1 supplies rectangles sized by count.', interactiveTools: ['Label mode', 'Grouping depth', 'Color palette'] },
  sankey: { question: 'How do rows flow between two categorical states?', dataShape: 'Category 1 is source; Category 2 is target.', interactiveTools: ['Source/target selector', 'Flow labels', 'Minimum flow filter'] },
  dashboard_builder: { question: 'Which starter dashboard panels fit the selected dataset?', dataShape: 'Uses selected numeric and categorical fields to preview a dashboard layout.', interactiveTools: ['Panel presets', 'Layout preview', 'Dashboard checklist'] },
}

const advancedCopy: Record<string, ProfileSeed> = {
  two_way_anova_interaction: { question: 'Do two factors jointly affect a numeric outcome, and does one factor change the effect of the other?', dataShape: 'Numeric 1 is outcome; Category 1 and Category 2 are factors.', interactiveTools: ['Interaction plot', 'Cell means', 'Main-effect cards'] },
  repeated_measures_anova: { question: 'Do repeated measurements on the same row differ across conditions?', dataShape: 'Numeric 1-3 are repeated conditions for each subject row.', interactiveTools: ['Subject profile lines', 'Condition means', 'Within-row contrast'] },
  ancova: { question: 'Do groups differ after adjusting for a numeric covariate?', dataShape: 'Numeric 1 is outcome, Numeric 2 is covariate, Category 1 is group.', interactiveTools: ['Adjusted means', 'Covariate slope', 'Group comparison'] },
  manova: { question: 'Do groups differ across several outcomes considered together?', dataShape: 'Numeric 1-3 are outcomes; Category 1 defines groups.', interactiveTools: ['Outcome mini charts', 'Effect summary', 'Screening caveat'] },
  tukey_hsd: { question: 'Which group pairs differ after ANOVA?', dataShape: 'Numeric 1 is outcome; Category 1 defines groups.', interactiveTools: ['Pairwise map', 'Difference plot', 'Significance badges'] },
  multiple_testing_corrections: { question: 'Which p-values remain notable after correcting many tests?', dataShape: 'Pairwise group p-values are generated from Numeric 1 by Category 1.', interactiveTools: ['P-value ladder', 'Correction toggle', 'Threshold marker'] },
  fisher_exact: { question: 'Are two binary categorical variables associated when counts are small?', dataShape: 'Category 1 and Category 2 should each have two main levels.', interactiveTools: ['2x2 table focus', 'Exact probability note', 'Odds-ratio card'] },
  mcnemar: { question: 'Did paired binary outcomes change direction?', dataShape: 'Numeric 1 and Numeric 2 are paired binary-coded outcomes.', interactiveTools: ['Discordant-pair matrix', 'Before/after counts', 'Change direction card'] },
  exact_binomial: { question: 'Does the observed success count differ from a hypothesized probability?', dataShape: 'Positive values in Numeric 1 are successes.', interactiveTools: ['PMF tail shading', 'Success counter', 'Reference probability'] },
  shapiro_wilk: { question: 'Is a numeric variable plausibly normal?', dataShape: 'Numeric 1 supplies the sample.', interactiveTools: ['Q-Q plot', 'Histogram overlay', 'Tail deviation callouts'] },
  levene_brown_forsythe: { question: 'Do groups have similar variance?', dataShape: 'Numeric 1 is measured across Category 1 groups.', interactiveTools: ['Spread plot', 'Mean/median center toggle', 'Variance warning'] },
  durbin_watson: { question: 'Are regression residuals autocorrelated in sequence order?', dataShape: 'Numeric 1 predicts Numeric 2 in row order.', interactiveTools: ['Residual sequence', 'Lag residual scatter', 'DW scale'] },
  breusch_pagan: { question: 'Does residual variance change with predictors?', dataShape: 'Target is modeled from Numeric 1-3.', interactiveTools: ['Residual spread plot', 'Variance trend', 'Heteroscedasticity guide'] },
  robust_regression: { question: 'How does a regression change when outliers are downweighted?', dataShape: 'Target is modeled from Numeric 1 and Numeric 2.', interactiveTools: ['OLS vs robust line', 'Weight inspector', 'Outlier badges'] },
  ridge_lasso: { question: 'How do regularized models shrink unstable coefficients?', dataShape: 'Target is modeled from Numeric 1-3.', interactiveTools: ['Lambda slider', 'Coefficient shrinkage', 'Penalty comparison'] },
  stepwise_selection: { question: 'Which predictors enter a model by adjusted R2?', dataShape: 'Target is modeled from candidate predictors Numeric 1-3.', interactiveTools: ['Step timeline', 'Adjusted R2 progression', 'Candidate cards'] },
  logistic_se_pvalues: { question: 'Which logistic predictors have clear Wald evidence?', dataShape: 'Binary target with Numeric 1 and Numeric 2 predictors.', interactiveTools: ['Odds-ratio forest', 'Wald interval guide', 'Threshold summary'] },
  roc_auc: { question: 'How well does a score rank positives above negatives?', dataShape: 'Numeric 1 is score; Target is binary-coded.', interactiveTools: ['ROC curve', 'AUC shading', 'Threshold explorer'] },
  train_test_cv: { question: 'How well does the model generalize outside the training rows?', dataShape: 'Target is predicted by Numeric 1 and Numeric 2.', interactiveTools: ['Split visual', 'Fold cards', 'Error comparison'] },
  missing_imputation: { question: 'What replacement values would fill missing numeric data?', dataShape: 'Numeric 1 is scanned for missing and valid values.', interactiveTools: ['Missingness meter', 'Method preview', 'Before/after table'] },
  transformation_history: { question: 'What analysis choices should be recorded for reproducibility?', dataShape: 'Uses the current dataset, selected columns, and alpha.', interactiveTools: ['Audit timeline', 'Settings summary', 'Reproducibility badge'] },
  undo_redo_cleaning: { question: 'How would reversible cleaning operations be tracked?', dataShape: 'Uses workflow operation metadata rather than raw statistical columns.', interactiveTools: ['Command stack', 'Undo preview', 'Redo preview'] },
  formula_columns: { question: 'What computed column would selected numeric fields create?', dataShape: 'Numeric 1 and Numeric 2 are combined in a preview formula.', interactiveTools: ['Formula preview', 'Computed histogram', 'Row preview'] },
  merge_join_append: { question: 'Is a dataset ready for joining or appending?', dataShape: 'Category 1 is checked as a key-like field.', interactiveTools: ['Join diagram', 'Key uniqueness', 'Append estimate'] },
  reshape_wide_long: { question: 'How would selected wide columns look in long format?', dataShape: 'Numeric 1-3 are treated as measure columns.', interactiveTools: ['Before/after preview', 'Measure selector', 'Row count estimate'] },
  report_builder: { question: 'What sections should a complete analysis report contain?', dataShape: 'Uses the current dataset and module result metadata.', interactiveTools: ['Report outline', 'Section preview', 'Export readiness'] },
  export_pdf_html_docx: { question: 'Which export package is ready for the current analysis?', dataShape: 'Uses current report metadata and chart/table availability.', interactiveTools: ['Format checklist', 'Preview cards', 'Export route'] },
  script_export: { question: 'How can this analysis be reproduced as script steps?', dataShape: 'Uses selected module, columns, and alpha.', interactiveTools: ['Script preview', 'Copy command', 'Recipe checklist'] },
  saved_sessions: { question: 'What state is needed to restore this analysis later?', dataShape: 'Uses module, dataset, selected inputs, and timestamp metadata.', interactiveTools: ['Session card', 'Restore schema', 'State checklist'] },
  project_notebook: { question: 'What should be recorded in the project history?', dataShape: 'Uses current analysis context and timestamp.', interactiveTools: ['Notebook timeline', 'Entry preview', 'History tag'] },
  chart_editor: { question: 'How should chart titles, axes, and palette be edited?', dataShape: 'Uses selected variables as chart metadata.', interactiveTools: ['Title editor', 'Axis labels', 'Palette preview'] },
  dashboard_layout_builder: { question: 'How should analysis panels be arranged into a dashboard?', dataShape: 'Uses current output types to plan layout panels.', interactiveTools: ['Grid preview', 'Panel presets', 'Layout checklist'] },
  chart_templates: { question: 'Which reusable chart template fits this data story?', dataShape: 'Uses selected variables and chart intent.', interactiveTools: ['Template gallery', 'Preview thumbnails', 'Preset selector'] },
  weighted_statistics: { question: 'How do weights change the summary estimate?', dataShape: 'Numeric 1 is value; Numeric 2 supplies weights.', interactiveTools: ['Weighted vs unweighted chart', 'Weight diagnostics', 'Influence cards'] },
  bootstrap_ci: { question: 'What uncertainty appears when resampling the observed data?', dataShape: 'Numeric 1 supplies bootstrap resamples.', interactiveTools: ['Bootstrap distribution', 'CI markers', 'Iteration control'] },
  permutation_tests: { question: 'How unusual is the observed group difference under shuffled labels?', dataShape: 'Numeric 1 is outcome; Category 1 defines two groups.', interactiveTools: ['Shuffle distribution', 'Observed marker', 'Iteration control'] },
  bayesian_basics: { question: 'How do binary data update a beta prior?', dataShape: 'Positive values in Numeric 1 are successes.', interactiveTools: ['Prior/posterior overlay', 'Success-failure controls', 'Credible interval'] },
  survival_analysis: { question: 'How does survival probability change over time?', dataShape: 'Numeric 1 is time; Numeric 2 is event indicator.', interactiveTools: ['Survival step curve', 'Risk table', 'Censoring guide'] },
  arima_ets: { question: 'What simple autoregressive or smoothing structure appears in the series?', dataShape: 'Numeric 1 is a time-ordered series.', interactiveTools: ['Forecast overlay', 'Differencing preview', 'Residual check'] },
  seasonal_decomposition: { question: 'What trend, seasonal pattern, and residual remain in the series?', dataShape: 'Numeric 1 is a time-ordered seasonal sequence.', interactiveTools: ['Stacked components', 'Season length control', 'Residual panel'] },
  robust_pca: { question: 'Which observations stand out in a multi-variable PCA screen?', dataShape: 'Numeric 1-3 form the PCA screen.', interactiveTools: ['Score plot', 'Outlier highlights', 'Variance bars'] },
  hierarchical_dendrogram: { question: 'How would observations merge in hierarchical clustering?', dataShape: 'Numeric 1 and Numeric 2 define distances.', interactiveTools: ['Dendrogram', 'Merge table', 'Cut-height control'] },
  dbscan: { question: 'Which points are dense clusters and which are noise?', dataShape: 'Numeric 1 and Numeric 2 define point distance.', interactiveTools: ['Epsilon control', 'Min-points control', 'Noise highlighting'] },
  classification_models: { question: 'How do simple classification baselines compare?', dataShape: 'Target is binary-coded; Numeric fields act as scores or predictors.', interactiveTools: ['Model cards', 'Confusion matrix', 'Threshold comparison'] },
  model_comparison: { question: 'Which model performs best on the selected target?', dataShape: 'Target and selected numeric predictors define comparable models.', interactiveTools: ['Leaderboard', 'Metric bars', 'Model notes'] },
  assumption_diagnostics: { question: 'Which assumptions are risky for the selected analysis?', dataShape: 'Uses selected numeric and categorical fields plus row quality.', interactiveTools: ['Assumption checklist', 'Warning badges', 'Linked diagnostics'] },
  plain_language_interpretation: { question: 'How should the result be explained to a non-technical reader?', dataShape: 'Uses selected fields and current result context.', interactiveTools: ['Interpretation builder', 'Audience tone', 'Decision sentence'] },
  warning_system: { question: 'Which invalid-assumption warnings should be surfaced?', dataShape: 'Uses sample size, missingness, and category levels.', interactiveTools: ['Warning dashboard', 'Severity badges', 'Fix suggestions'] },
  engine_unit_tests: { question: 'Do core statistical calculations pass sanity checks?', dataShape: 'Uses built-in deterministic checks rather than selected columns.', interactiveTools: ['Test status grid', 'Failure details', 'Coverage checklist'] },
  golden_value_tests: { question: 'Do results match known reference values?', dataShape: 'Uses curated comparison targets for statistical engines.', interactiveTools: ['Reference table', 'Tolerance badges', 'Engine comparison'] },
}

function mergeProfile(module: StatModuleDef, seed: ProfileSeed): ModuleProfile {
  const base = groupDefaults[module.group]
  return {
    ...base,
    ...seed,
    inputLabels: { ...base.inputLabels, ...seed.inputLabels },
    assumptions: seed.assumptions ?? base.assumptions,
    readResult: seed.readResult ?? base.readResult,
    commonMistakes: seed.commonMistakes ?? base.commonMistakes,
    workflow: seed.workflow ?? base.workflow,
    inputHints: seed.inputHints ?? base.inputHints,
    interactiveTools: seed.interactiveTools ?? base.interactiveTools,
  }
}

export function getStatModuleProfile(module: StatModuleDef): ModuleProfile {
  const seed = profiles[module.key] ?? chartCopy[module.key] ?? advancedCopy[module.key] ?? {}
  return mergeProfile(module, seed)
}

export function getStatModuleLearningContent(module: StatModuleDef, profile = getStatModuleProfile(module)): ModuleLearningContent {
  const key = module.key
  const family = learningFamily(module)
  const base = familyLearning[family]
  const specific = specificLearning[key]
  return {
    formulas: specific?.formulas ?? base.formulas,
    workedExample: specific?.workedExample ?? workedExampleFor(module, profile, family),
    academicNotes: [...base.academicNotes, ...(specific?.academicNotes ?? [])].slice(0, 5),
    misuseWarnings: [...base.misuseWarnings, ...(specific?.misuseWarnings ?? [])].slice(0, 5),
    glossaryTerms: [...new Set([...(specific?.glossaryTerms ?? []), ...base.glossaryTerms])].slice(0, 8),
    citations: [...new Set([...(specific?.citations ?? []), ...base.citations])].slice(0, 4),
  }
}

type LearningFamily = 'inference' | 'regression' | 'classification' | 'visualization' | 'workflow' | 'time' | 'dimension' | 'resampling'

function learningFamily(module: StatModuleDef): LearningFamily {
  const text = `${module.key} ${module.title} ${module.description}`.toLowerCase()
  if (/bootstrap|permutation/.test(text)) return 'resampling'
  if (/pca|cluster|dimension|component|dendrogram|dbscan/.test(text)) return 'dimension'
  if (/time|forecast|arima|seasonal|survival|kaplan|durbin/.test(text)) return 'time'
  if (/logistic|classification|roc|auc|confusion|binary/.test(text)) return 'classification'
  if (/regression|model|coefficient|residual|ridge|lasso|ancova/.test(text)) return 'regression'
  if (/chart|plot|histogram|bar|pie|heatmap|sankey|treemap|dashboard/.test(text) || module.group === 'Charting & Visualization') return 'visualization'
  if (/report|export|script|session|notebook|join|reshape|formula|audit|cleaning|warning|unit|golden/.test(text)) return 'workflow'
  return 'inference'
}

const familyLearning: Record<LearningFamily, ModuleLearningContent> = {
  inference: {
    formulas: [
      { label: 'Test statistic', expression: 'statistic = observed signal / standard error', note: 'Most tests compare a standardized signal to a reference distribution.' },
      { label: 'Decision rule', expression: 'reject H0 when p-value < alpha', note: 'Alpha is the chosen false-positive risk threshold.' },
      { label: 'Confidence interval', expression: 'estimate +/- critical value x standard error', note: 'Intervals combine estimate size and uncertainty.' },
    ],
    workedExample: { title: 'Compare an observed result with alpha', setup: 'A class compares exam scores across groups and sets alpha = 0.05 before looking at results.', steps: ['Select the outcome and grouping columns.', 'Read the p-value against alpha.', 'Check effect size or interval width.', 'Write the conclusion with assumptions.'], takeaway: 'Inference is a decision plus uncertainty, not just a single p-value.' },
    academicNotes: ['Choose the test from the study design before reading results.', 'Independence is usually more important than exact normality.', 'Small samples and sparse cells can make reference distributions unreliable.'],
    misuseWarnings: ['Do not use p-values as effect sizes.', 'Do not change alpha after seeing the result.', 'Do not treat statistical significance as practical importance.'],
    glossaryTerms: ['p-value', 'alpha', 'confidence interval', 'effect size', 'standard error'],
    citations: ['Fisher (1925), Statistical Methods for Research Workers', 'Neyman and Pearson (1933), hypothesis testing framework'],
  },
  regression: {
    formulas: [
      { label: 'Linear model', expression: 'y = beta0 + beta1 x1 + ... + error', note: 'Coefficients describe adjusted association with the response.' },
      { label: 'Residual', expression: 'residual = observed y - fitted y', note: 'Residuals show where the model misses.' },
      { label: 'R-squared', expression: 'R2 = 1 - SSE / SST', note: 'R2 is the share of response variation explained by the model.' },
    ],
    workedExample: { title: 'Explain temperature from day number', setup: 'A weather dataset models temperature from day and then checks residuals for seasonality.', steps: ['Choose the response as Y and predictor as X.', 'Fit the model and read slope/R2.', 'Inspect residuals for pattern.', 'Use diagnostics before reporting.'], takeaway: 'A good regression explanation needs fit, coefficient meaning, and residual checks.' },
    academicNotes: ['OLS coefficients assume the model form is appropriate for the data-generating question.', 'Residual diagnostics help detect nonlinearity, heteroscedasticity, and influential observations.', 'Prediction claims need validation data or cross-validation.'],
    misuseWarnings: ['Do not read regression coefficients as causal effects without a causal design.', 'Do not ignore residual patterns just because R2 is high.', 'Do not use many predictors with too few rows.'],
    glossaryTerms: ['R2', 'adjusted R2', 'coefficient', 'residual', 'standard error', 'p-value'],
    citations: ['Draper and Smith (1998), Applied Regression Analysis', 'Kutner et al. (2005), Applied Linear Statistical Models'],
  },
  classification: {
    formulas: [
      { label: 'Logistic probability', expression: 'p = 1 / (1 + exp(-(beta0 + beta x)))', note: 'Logistic models predict probabilities between 0 and 1.' },
      { label: 'Odds ratio', expression: 'odds ratio = exp(beta)', note: 'Above 1 increases odds; below 1 decreases odds.' },
      { label: 'F1 score', expression: 'F1 = 2 x precision x recall / (precision + recall)', note: 'F1 balances false positives and false negatives.' },
    ],
    workedExample: { title: 'Predict pass/fail from a score', setup: 'A binary target marks pass/fail and a numeric score ranks likely positives.', steps: ['Check that the target has two classes.', 'Fit probabilities or score thresholds.', 'Read confusion matrix metrics.', 'Choose threshold based on error cost.'], takeaway: 'Classification quality depends on both ranking and threshold choice.' },
    academicNotes: ['Class imbalance can make accuracy misleading.', 'Thresholds should reflect the cost of false positives and false negatives.', 'AUC evaluates ranking, not calibrated probability.'],
    misuseWarnings: ['Do not report accuracy alone for imbalanced classes.', 'Do not use a non-binary target in logistic modules.', 'Do not assume the default 0.5 threshold is optimal.'],
    glossaryTerms: ['precision', 'recall', 'F1', 'ROC AUC', 'threshold', 'odds ratio'],
    citations: ['Hosmer, Lemeshow, and Sturdivant (2013), Applied Logistic Regression', 'Fawcett (2006), An introduction to ROC analysis'],
  },
  visualization: {
    formulas: [
      { label: 'Count', expression: 'count(level) = number of rows in level', note: 'Bar, pie, heatmap, and flow charts summarize counts.' },
      { label: 'Histogram density', expression: 'density approx count / (n x bin width)', note: 'Density rescales bars so area is comparable.' },
      { label: 'Visual encoding', expression: 'position, length, color, and area encode variables', note: 'Position and length are usually easier to compare than area.' },
    ],
    workedExample: { title: 'Inspect a variable before testing', setup: 'Before running a test, a histogram reveals skew and a boxplot reveals grouped outliers.', steps: ['Pick the chart that matches variable types.', 'Check scale, missingness, and outliers.', 'Use the pattern to choose the next test or model.', 'Export the visual with clear labels.'], takeaway: 'Charts prevent many statistical mistakes before formulas begin.' },
    academicNotes: ['Visual summaries are exploratory evidence and should be paired with appropriate statistics for claims.', 'Axis scale, bin width, and category ordering can change the story.', 'High-cardinality categories often need grouping or filtering.'],
    misuseWarnings: ['Do not use pie/area encodings when precise comparison matters.', 'Do not overinterpret patterns from very small samples.', 'Do not hide outliers without documenting the rule.'],
    glossaryTerms: ['histogram', 'density', 'outlier', 'correlation', 'distribution', 'quartile'],
    citations: ['Tukey (1977), Exploratory Data Analysis', 'Cleveland (1993), Visualizing Data'],
  },
  workflow: {
    formulas: [
      { label: 'Reproducible state', expression: 'result = f(dataset, module, variables, settings)', note: 'Workflow modules track enough state to repeat the analysis.' },
      { label: 'Audit record', expression: 'audit = action + inputs + timestamp + output summary', note: 'A useful audit trail explains what changed and why.' },
      { label: 'Readiness', expression: 'ready = valid inputs + documented assumptions + exportable output', note: 'Reporting needs both result and context.' },
    ],
    workedExample: { title: 'Turn an analysis into a reproducible report', setup: 'After selecting a module, the project records dataset, variables, settings, output, and caveats.', steps: ['Confirm selected inputs and assumptions.', 'Capture or save the run.', 'Export table/chart/report package.', 'Keep notes about limitations.'], takeaway: 'Professional analysis is the result plus a reproducible path to get it again.' },
    academicNotes: ['Workflow outputs may be metadata or planning aids, not inferential results.', 'Document transformations before interpreting final statistics.', 'Reports should include assumptions and known limitations.'],
    misuseWarnings: ['Do not treat audit metadata as a statistical finding.', 'Do not export a result without selected-variable context.', 'Do not skip validation because a workflow looks complete.'],
    glossaryTerms: ['reproducibility', 'assumption', 'metadata', 'validation', 'missing data'],
    citations: ['Peng (2011), Reproducible research in computational science', 'ASA (2016), Statement on p-values and statistical significance'],
  },
  time: {
    formulas: [
      { label: 'Lag-1 correlation', expression: 'corr(y_t, y_{t-1})', note: 'Measures persistence from one row/time step to the next.' },
      { label: 'Moving average', expression: 'MA_t = mean(y_{t-k+1}, ..., y_t)', note: 'Smooths short-term noise to reveal trend.' },
      { label: 'Survival step', expression: 'S(t) = product(1 - events_t / at-risk_t)', note: 'Kaplan-Meier survival updates at event times.' },
    ],
    workedExample: { title: 'Study a monthly series', setup: 'A monthly metric is smoothed to see trend, then checked for seasonal pattern and autocorrelation.', steps: ['Confirm row order or time column.', 'Plot the sequence and moving average.', 'Check lag or residual pattern.', 'Avoid future claims without validation.'], takeaway: 'Time modules depend on order; shuffled rows can destroy the meaning.' },
    academicNotes: ['Time-series observations are often autocorrelated, so independent-row assumptions may fail.', 'Seasonality and trend should be separated before interpreting residuals.', 'Forecasting baselines are teaching aids unless validated on held-out periods.'],
    misuseWarnings: ['Do not use unordered rows as a time series.', 'Do not extrapolate far beyond observed data without a validated model.', 'Do not ignore seasonality in residuals.'],
    glossaryTerms: ['trend', 'seasonality', 'autocorrelation', 'residual', 'forecast', 'censoring'],
    citations: ['Box, Jenkins, Reinsel, and Ljung (2015), Time Series Analysis', 'Kaplan and Meier (1958), nonparametric survival estimation'],
  },
  dimension: {
    formulas: [
      { label: 'Distance', expression: 'd(i,j) = sqrt(sum((x_i - x_j)^2))', note: 'Clustering modules group nearby observations.' },
      { label: 'Explained variance', expression: 'PC share = eigenvalue / sum(eigenvalues)', note: 'PCA reports how much variation each component captures.' },
      { label: 'Standardized score', expression: 'z = (x - mean) / sd', note: 'Scaling matters when variables use different units.' },
    ],
    workedExample: { title: 'Summarize several measurements', setup: 'Flower measurements are reduced to a PCA view, then clusters are inspected visually.', steps: ['Select comparable numeric variables.', 'Check whether scaling is needed.', 'Read explained variance or cluster separation.', 'Treat groups as exploratory until validated.'], takeaway: 'Dimension reduction helps exploration; it does not automatically prove real groups.' },
    academicNotes: ['PCA is sensitive to variable scale and outliers.', 'Cluster assignments depend on distance metric and tuning choices.', 'Interpret components from loadings and domain context.'],
    misuseWarnings: ['Do not interpret arbitrary cluster IDs as confirmed categories.', 'Do not mix incompatible units without considering standardization.', 'Do not overread low-variance components.'],
    glossaryTerms: ['PCA', 'loading', 'explained variance', 'cluster', 'distance', 'outlier'],
    citations: ['Jolliffe (2002), Principal Component Analysis', 'Kaufman and Rousseeuw (1990), Finding Groups in Data'],
  },
  resampling: {
    formulas: [
      { label: 'Bootstrap sample', expression: 'resample n rows with replacement', note: 'Bootstrap estimates sampling variation from observed data.' },
      { label: 'Permutation null', expression: 'shuffle labels, recompute statistic', note: 'Permutation tests build a null distribution by exchangeability.' },
      { label: 'Resampling p-value', expression: 'p = count(|stat*| >= |stat_obs|) / iterations', note: 'More iterations reduce Monte Carlo noise.' },
    ],
    workedExample: { title: 'Resample a group difference', setup: 'Two groups have different means; labels are shuffled to see whether that gap is unusual.', steps: ['Check groups are exchangeable under the null.', 'Compute the observed difference.', 'Resample or shuffle repeatedly.', 'Read interval or p-value with iteration caveat.'], takeaway: 'Resampling is intuitive, but it still depends on design assumptions.' },
    academicNotes: ['Bootstrap assumes the observed sample is representative of the population mechanism.', 'Permutation tests assume labels are exchangeable under the null.', 'Seeded calculations are reproducible but still approximate.'],
    misuseWarnings: ['Do not bootstrap tiny or highly biased samples as if they were representative.', 'Do not permute labels when exchangeability is not plausible.', 'Do not hide the iteration count.'],
    glossaryTerms: ['bootstrap', 'permutation test', 'confidence interval', 'p-value', 'standard error'],
    citations: ['Efron and Tibshirani (1993), An Introduction to the Bootstrap', 'Good (2005), Permutation, Parametric, and Bootstrap Tests'],
  },
}

const specificLearning: Record<string, Partial<ModuleLearningContent>> = {
  confidence_interval: {
    formulas: [
      { label: 'Mean CI', expression: 'xbar +/- t* x s / sqrt(n)', note: 'Use t critical values when population sigma is unknown.' },
      { label: 'Proportion CI', expression: 'p_hat +/- z* x sqrt(p_hat(1-p_hat)/n)', note: 'Works best when success/failure counts are not too small.' },
    ],
    glossaryTerms: ['confidence interval', 'margin of error', 'standard error', 'alpha'],
  },
  anova: {
    formulas: [
      { label: 'F ratio', expression: 'F = MS_between / MS_within', note: 'Large between-group variation relative to within-group variation increases F.' },
      { label: 'Eta squared', expression: 'eta2 = SS_between / SS_total', note: 'Measures share of variation explained by group membership.' },
    ],
    glossaryTerms: ['ANOVA', 'F statistic', 'eta squared', 'post-hoc test', 'p-value'],
  },
  chi_square: {
    formulas: [
      { label: 'Expected count', expression: 'E_ij = row_i total x column_j total / grand total', note: 'Expected counts come from the independence model.' },
      { label: 'Chi-square', expression: 'X2 = sum((O - E)^2 / E)', note: 'Cells with large observed-expected gaps drive the statistic.' },
    ],
    glossaryTerms: ['chi-square', 'expected count', 'degrees of freedom', 'p-value'],
  },
  simple_regression: {
    formulas: [
      { label: 'Fitted line', expression: 'y_hat = b0 + b1 x', note: 'The line estimates average Y at each X.' },
      { label: 'Slope', expression: 'b1 = cov(x,y) / var(x)', note: 'Slope is expected Y change for one-unit X increase.' },
      { label: 'Residual', expression: 'e = y - y_hat', note: 'Residuals reveal model misses and pattern.' },
    ],
    glossaryTerms: ['slope', 'intercept', 'R2', 'residual', 'confidence band'],
  },
  pca: {
    formulas: [
      { label: 'Component score', expression: 'score = X x loading', note: 'Scores place observations on the component axis.' },
      { label: 'Explained variance', expression: 'share_k = lambda_k / sum(lambda)', note: 'Higher share means the component captures more variation.' },
    ],
    glossaryTerms: ['PCA', 'loading', 'score', 'explained variance', 'scree plot'],
  },
}

function workedExampleFor(module: StatModuleDef, profile: ModuleProfile, family: LearningFamily): ModuleLearningContent['workedExample'] {
  const name = module.title.replace(' Module', '')
  if (familyLearning[family].workedExample) {
    return {
      ...familyLearning[family].workedExample,
      title: `${name}: ${familyLearning[family].workedExample.title}`,
      setup: profile.dataShape,
    }
  }
  return {
    title: `${name}: quick worked example`,
    setup: profile.dataShape,
    steps: profile.workflow,
    takeaway: profile.readResult[0] ?? 'Read the result together with assumptions and warnings.',
  }
}
