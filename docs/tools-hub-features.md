# Tools Hub: 50 implemented features

Open **Home → Analysis Tools → Open Tools Hub**, **Analysis → Tools Hub**, or `/#/tools`. The hub uses the active dataset and links to the full analysis workspace. Each feature has a shareable `?feature=` URL.

## Workspace

1. Tool search: search implemented analyses by title, description, and module.
2. Tool recommendations: suggest supported methods from selected numeric/categorical columns.
3. Guided analysis wizard: question → design → variables → run → interpretation.
4. Favorite tools: save and filter preferred analysis methods.
5. Recently used tools: revisit runs and resume saved settings.
6. Saved configurations: named analysis configurations, load and delete controls.
7. Analysis history: dataset identity, settings, timestamp, full tables, plots, and interpretation.
8. Compare analyses: up to three runs side by side, with a notice when data fingerprints differ.
9. Batch analysis: descriptive statistics across selected variables, optionally split by groups.
10. Workflow builder: reorder imputation, standardization, descriptives, bootstrap, and report stages; save stages and export the resulting report.

## Preparation

11. Missing-data explorer: per-column counts/percentages, co-occurring missing patterns, and a row-by-column heatmap.
12. Missing-value imputation: mean, median, group mean, and numeric constant; explain the uncertainty limitation of single imputation.
13. Duplicate detector: choose key columns, review duplicate copies, preview removal.
14. Outlier review: IQR, z-score, and robust MAD thresholds; review original row indices before removal.
15. Data validation rules: required values, numeric ranges, numeric/date types.
16. Column transformation builder: add, subtract, multiply, divide, natural log, square root, or square; choose a second column or constant operand.
17. Category recoding: explicit JSON mapping supports renaming and merging categories; unmapped values are preserved. Save an explicit category display order for Tools charts without changing row order.
18. Scaling and normalization: sample z-scores or min–max values in a new column.
19. Date/time extraction: UTC year/month/weekday/date, and elapsed days between two date columns.
20. Dataset comparison: changed values, added keys, and removed keys; requires unique non-missing record keys.

Preparation operations preview the results and save a **new dataset copy**. The source stays available in the dataset selector. Names that overwrite an existing column are rejected. Invalid arithmetic/date results become missing rather than Infinity/NaN.

## Statistics

21. Automatic assumption checks: complete sample count, missingness, distinct values, sample SD, IQR flags, and distribution plot; distinguish data checks from proof of assumptions.
22. Test-selection assistant: suggest a supported method from question and paired/independent design.
23. Effect sizes: signed pooled-SD Cohen’s d and approximate small-sample Hedges’ g.
24. Confidence intervals: compare Student-t and percentile-bootstrap mean intervals at a configurable level.
25. Power/sample-size planning: existing power engine for supported t, ANOVA, proportions, correlation, and regression designs.
26. Bootstrap analysis: seeded mean resampling, percentile interval, and bootstrap distribution.
27. Permutation tests: seeded independent-group label shuffling, two-sided mean-difference test, and plus-one Monte Carlo p-value.
28. Multiple-testing correction: raw, Holm FWER, and Benjamini–Hochberg FDR p-values in original order.
29. Nonparametric alternatives: independent permutation test or the existing paired Wilcoxon signed-rank analysis.
30. Sensitivity analysis: mean intervals for all observations versus IQR exclusions; source data is unchanged.

Resampling supports 100–5,000 iterations and a seed. Runs above five million resampled/shuffled observations ask for fewer iterations or a smaller dataset. Assumptions and method limitations are shown with results. These tools do not infer independence, causality, or the study design from a table.

## Models

31. Regression diagnostics: existing linear engine with residual, influence, and assumption diagnostics.
32. Model comparison: first-predictor versus full linear model, evaluated on identical complete cases and seeded folds, with separate in-sample R², adjusted R², AIC, and BIC.
33. Cross-validation: 2–10 shuffled folds, 1–10 repeats, seed, fold RMSE/MAE, and pooled test RMSE; no in-sample score presented as validation.
34. Prediction explorer: linear-model input controls and a 95% individual prediction interval, with extrapolation feedback.
35. Correlation explorer: existing Pearson, Spearman, Kendall, and partial-correlation engine.
36. Contingency tables: existing categorical association engine with configurable variables.
37. Time-series decomposition: additive centered moving-average trend, centered seasonal effects, and remainder; undefined trend endpoints remain missing.
38. Forecast comparison: naïve, drift, and seasonal-naïve baselines on the same chronological holdout, with RMSE and MAE.
39. Clustering explorer: existing configurable clustering engine and diagnostics.
40. Principal-component explorer: existing matrix, component, variance, score, loading, and biplot controls.

Series tools use dataset row order or sort a selected valid, unique time column. They require evenly spaced observations; missing series values must be addressed explicitly. Cross-validation is for independent rows rather than dependent time-series observations.

## Charts

41. Chart builder: scatter, row-order line, histogram, category-count bar; axes, title, grouping.
42. Linked selections: original row indices link two scatter plots; lasso/click and keyboard selection list.
43. Interactive annotations: label selected observations, with editable text and a clear action.
44. Accessible palettes: Okabe–Ito, high contrast, monochrome; distinct group marker symbols and bar patterns.
45. Publication export: SVG or PNG, dimension presets, custom dimensions, and PNG pixel scaling.

## Reports and teaching

46. Plain-language summaries: display each saved engine’s interpretation together with assumptions and caveats.
47. Report builder: select saved runs, add/save notes, preview, and export text or standalone printable HTML with rendered charts and tables.
48. Reproducible exports: JSON includes method options, seeds, timestamps, source dataset identity/fingerprint, tables, and plots; optionally include active dataset rows.
49. Teaching mode: reveal sample count, mean, sample variance, standard error, and Student-t interval step by step.
50. Simulation sandbox: seeded normal-population sampling with configurable sample size, trials, mean, SD, and selection bias; display mean distribution, coverage, empirical/theoretical SE, and null rejection rate.

## Persistence and validation

The hub retains the last 20 runs and up to 40 configurations locally. Runs also appear in the app’s general analysis history. Storage failures are reported while session results stay available. FNV-1a fingerprints detect routine data changes; they are not cryptographic provenance checks. Reproducibility requires matching data, settings, and method versions.

Validation covers 18 toolkit unit tests and desktop/mobile browser flows for all feature routes, prepared-copy persistence, resampling, workflow reports, saved settings, favorites, model evaluation, linked selections, annotations, SVG export, and reproducible bundles. Existing statistical engines retain their own golden-reference tests.

