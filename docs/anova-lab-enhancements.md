# ANOVA: 25 enhancements in each of six labs

The six labs now share 17 data and learning improvements, plus eight specialized improvements each: 25 per lab, or 150 enhancement placements. Shared workflows are reused rather than implemented six different ways. All are connected to the lab's current observations and alpha, including its existing charts and result tables.

Open `http://127.0.0.1:3633/#/statistics/anova`. Choose a lab. Follow **Choose the design → Prepare the data → Check the model → Read the result → Explain and export**. Advanced calculations stay inside **Lab-specific calculations and experiments**, which opens at step four. Existing visual lessons remain available below the new tools.

## Improvements 1–17 in every lab

1. **Five-step guide:** design-specific advice gives beginners a short route from study question to explanation.
2. **Paste a table:** CSV and tab-separated data can be read directly, including quoted labels and numeric strings.
3. **Role-based mapping:** load CSV, TSV, Excel, or JSON, or map the active workspace dataset; use separate columns for the relevant factors, outcome, and subject ID. One-way retains its earlier importer as well.
4. **Downloadable lab template:** independent, factorial, or repeated-measures templates demonstrate the required data layout.
5. **Explicit invalid-row policy:** choose audited omission or reject the entire import; blanks and booleans never become zero outcomes.
6. **Exclusion audit:** show original file row numbers and reasons, with downloadable CSV; no silent invalid-row dropping.
7. **Edit labels and outcomes:** keyboard editing updates group/condition, factor B, subject IDs, and numeric outcomes as applicable; Enter or blur applies a value.
8. **Add observations:** append labeled observations with finite outcomes; valid-design checks protect the analysis.
9. **Delete observations:** remove a row explicitly; changes that destroy minimum replication or completeness are rejected.
10. **Undo and redo:** maintain up to 20 learning-data changes with observations, alpha, and provenance in each frame. One-way also retains its earlier full data history.
11. **Find observations:** search IDs, labels, subjects, and outcomes; zero-result feedback makes filtering clear.
12. **Organize the view:** sort by outcome or group and page through eight rows; sorting never changes collection order or pairing.
13. **Preview transformations:** inspect natural log, square root, shift, and scaling on a copy before applying; reject invalid domains, zero scaling, and nonfinite results.
14. **Restore initial example:** recover the initial lesson data through the same undoable workflow.
15. **Portable sessions:** export and restore versioned JSON with observations, lab, and alpha; reject wrong-lab, malformed, duplicate-ID, and invalid-design sessions.
16. **Data provenance and full exports:** download all observations and a record of source, alpha, exclusions, and validation.
17. **Descriptive precision:** selectable decimal precision, means, medians, SEs, ranges, and group counts. Repeated-measures descriptions are clearly distinguished from paired inference.

## One-Way ANOVA: improvements 18–25

18. **Welch comparison:** pooled and Welch ANOVA side by side, with precision-weighted mean and fractional denominator df; constant within-group variances leave Welch unavailable.
19. **Planned contrasts:** enter group-order weights summing to zero and obtain estimate, SE, t, df, p, and an individual confidence interval.
20. **Practical threshold:** compare the observed mean range with a user-defined meaningful difference, separate from significance.
21. **Omnibus permutation:** seeded label shuffling, a plus-one Monte Carlo p-value, iteration count, and Monte Carlo SE; explain the exchangeability assumption.
22. **Bootstrap mean intervals:** seeded group-wise percentile intervals at the selected alpha, explicitly individual rather than simultaneous intervals.
23. **Leave-one-out preview:** inspect changes to F, p, and eta squared without changing the original observations.
24. **Group contributions and weights:** inspect contributions to between-group SS and `n / variance` precision weights.
25. **Cohen's omnibus f:** calculate observed standardized separation, with a clear distinction from prospective power.

## ANOVA Table: improvements 18–25

18. **Group-level decomposition:** show each group's contributions to between- and within-group sums of squares.
19. **Observation worksheet:** show squared deviations from group and grand means, capped at 100 displayed rows.
20. **Integrity check:** verify SS and df identities and explain floating-point discrepancies.
21. **Weighted grand mean:** compare the observation-weighted grand mean with the unweighted mean of group means.
22. **Reconstruction practice:** choose a missing SS, MS, F, or df value, submit an answer, and receive formula-specific feedback with rounding tolerance.
23. **Invariance experiments:** shift or scale every outcome and watch SS change while F and p stay invariant; undo restores the earlier dataset.
24. **Epsilon squared:** calculate a bias-adjusted explained-variation estimate, truncated at zero and labeled separately from eta squared.
25. **Full decomposition export:** download observation-level squared deviations for all rows, not just the visible preview.

## Post-Hoc Comparisons: improvements 18–25

18. **Bonferroni method:** pooled t comparisons with family-adjusted p-values and simultaneous Bonferroni intervals.
19. **Benjamini–Hochberg method:** false discovery rate adjustment, labeled separately from family-wise control; individual intervals are identified as unadjusted.
20. **Games–Howell method:** pair-specific variances and Welch df with studentized-range inference for unequal-variance groups.
21. **Family exploration:** display control-group pairs, filter decisions, and sort by adjusted p or absolute difference without shrinking the tested family.
22. **Direction reversal:** reverse differences and interval endpoints consistently while preserving p-values.
23. **Hedges g:** display signed bias-adjusted pairwise standardized differences, unavailable for zero pooled SD.
24. **Practical uncertainty:** compare intervals with a meaningful-difference boundary; avoid labeling a descriptive negligible range as a formal equivalence test.
25. **Multiplicity lesson and family export:** illustrate independent-test false-positive accumulation and export the displayed family with raw/adjusted p, intervals, and effect sizes.

## Two-Way ANOVA: improvements 18–25

18. **Cell quality and precision:** show replicated cell counts, means, SDs, individual mean intervals, and imbalance ratio; reject empty or insufficiently replicated cells.
19. **Factor entry order:** compare A→B and B→A sequential SS and swap factor roles interactively; explain order dependence in unbalanced designs.
20. **Both simple-effects directions:** test A within B or B within A, even when interaction does not dominate; Holm-adjust across stratum tests.
21. **Marginal weighting comparison:** compare observed weighted marginals with equal-cell-weight descriptive marginals.
22. **Cell prediction:** select A and B levels for the fitted cell mean and an individual prediction interval under the full factorial pooled-error model.
23. **Factorial residuals:** inspect outcomes minus their A×B cell means, rather than incorrectly using one-way residuals.
24. **Term effect sizes and decisions:** show partial eta squared and decisions at the current alpha for both main effects and interaction.
25. **Cell report export:** download factor labels, cell counts, means, and SDs for the current design.

## Repeated-Measures ANOVA: improvements 18–25

18. **Actual sphericity corrections:** selectable uncorrected, Greenhouse–Geisser, and Huynh–Feldt df/p calculations; F stays unchanged and unavailable epsilon stays unavailable.
19. **Paired follow-ups:** subject-matched t comparisons with Holm p-values, Bonferroni simultaneous intervals, and paired dz; explain that the two adjustments can give different decisions.
20. **Subject completeness audit:** list missing conditions and included/dropped subjects; reject duplicate subject×condition measurements rather than silently taking the first row.
21. **Variation and effect-size decomposition:** compare condition, subject/baseline, and residual SS shares, generalized eta squared, and partial eta squared.
22. **Subject change explorer:** view first and last conditions and baseline changes for all or selected complete subjects; selection never alters inference.
23. **Within-subject correlations:** calculate the condition correlation matrix on the same complete cases used for inference.
24. **Condition-order experiment:** reverse displayed conditions while preserving subject matching and omnibus inference; changes in baseline interpretation are explained.
25. **Complete-case wide export:** download one row per included subject and one column per condition for inspection and reuse.

## ANOVA Assumptions: improvements 18–25

18. **Variance-test comparison:** Brown–Forsythe and Levene side by side; explain median versus mean centering and what their p-values test.
19. **Robust alternative comparison:** show pooled and Welch mean-test results alongside spread diagnostics.
20. **Group shape measures:** calculate moment skewness and excess kurtosis as descriptive measures, not fabricated normality-test p-values.
21. **Reviewable outlier flags:** show within-group IQR flags and internally studentized residuals; observations are never automatically removed.
22. **Influence preview:** inspect F, p, and effect-size changes when one observation is omitted in a separate calculation.
23. **Residual-versus-fitted plot:** view whether residual spread differs across fitted group means, with accessible point descriptions.
24. **Collection-order diagnostic:** descriptive lag-1 residual correlation, with an explicit warning that arbitrary file order cannot establish independence.
25. **Design advisor and review report:** independent, repeated, clustered, and unknown collection designs receive different advice; export that advice with diagnostics and flagged IDs.

## Statistical and data safeguards

- Labs accept 2–6 groups/conditions and up to 5,000 observations; factorial designs also need 2–6 B levels and at least two observations per cell.
- Repeated-measures covariance diagnostics accept 3–200 complete subjects. Incomplete subjects are audited and omitted at the subject level. No automatic imputation is performed.
- Sequential Type I SS is used for unbalanced factorial designs. The new controls do not claim Type II or III inference.
- Simple effects use a separate pooled variance for each stratum, rather than claiming a full-model shared error term.
- Resampling is explicit and seeded; permutation runs allow 100–2,000 shuffles and at most one million shuffled observations. Bootstrap draws retain the shared toolkit's bounds.
- Nonsignificance does not establish equality; statistical significance does not establish practical importance or causation.
- Session files restore observations and alpha. Temporary display filters, drafts, resampling output, and in-memory undo history are not restored.
- Provenance reports record changes applied through the learning-data tools; the older simulation controls retain their own labels and history.

Numerical references: [statsmodels Welch ANOVA](https://www.statsmodels.org/dev/generated/statsmodels.stats.oneway.anova_oneway.html), [Pingouin Games–Howell](https://pingouin-stats.org/generated/pingouin.pairwise_gameshowell.html), and [Pingouin repeated-measures ANOVA](https://pingouin-stats.org/generated/pingouin.rm_anova.html). Studentized-range probabilities use the application's existing numerical distribution implementation; the two-group Games–Howell case uses the exact corresponding Welch t calculation.

Implementation: `src/components/anova-studio/AnovaDataTools.tsx`, `AnovaDeepDive.tsx`, six existing lab components, and `src/lib/anovaLabTools.ts`. Validation: `src/lib/anovaLabTools.test.ts` and `tests/anova-lab-data.spec.ts`, alongside the existing ANOVA workbench and statistics regression suites.
