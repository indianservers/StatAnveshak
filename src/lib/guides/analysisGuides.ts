import { ANALYSIS_BY_ID } from '../../analysis/catalog'
import type { AnalysisOptions } from '../../analysis/types'
import { makeGuide, type GuideEntry } from './guideTypes'
import { STUDIO_GUIDE_ENTRIES } from './studioGuides'
import { BAYESIAN_VARIANTS } from './bayesianGuideVariants'

type MethodEntry = readonly [algorithm: string, interpretation: string, caution: string, example: string]
export const ANALYSIS_METHOD_ENTRIES: Record<string, MethodEntry> = {
  'descriptives.statistics': ['Count finite/missing values and calculate the requested sample summaries. | Compute mean uncertainty, quantiles, and shape measures using the selected variance convention.', 'Valid n and missing n identify each summary’s denominator; SD and SE have different meanings.', 'Shapiro–Wilk tests normality, not independence; large samples can detect negligible departures.', 'Compare mean, median, SD, and SE for a skewed income column.'],
  'descriptives.raincloud': ['Combine grouped empirical points, a Tukey box, and a density representation.', 'Raw points show sample sizes and unusual values; the density shows smoothed shape.', 'Density smoothing can conceal sparse observations or create apparent modes.', 'Compare two group densities while checking their actual raw-point counts.'],
  'descriptives.timeSeries': ['Preserve row order. | Compute series summaries, a linear trend, and lagged ACF/PACF; optionally summarize cycle positions.', 'Lag patterns concern temporal dependence; seasonal averages concern position within the specified period.', 'Missing rows and irregular spacing affect lag interpretation.', 'Analyze a complete monthly series with period 12.'],
  'descriptives.flexplot': ['Map outcome, predictor, and optional split to graphical marks. | Fit the selected OLS, GLM, or random-intercept overlay.', 'The overlay answers the selected conditional-mean model rather than a universal trend question.', 'A GLM family must match outcome support; grouped overlays do not establish causation.', 'Compare OLS and a binomial GLM overlay for a binary response.'],
  'visualModeling.flexplot': ['Construct the assigned outcome/predictor/split plot. | Estimate the selected linear, GLM, or mixed overlay on those roles.', 'The plotted overlay is conditional on its family and split assignment.', 'An inappropriate link or grouping structure changes the model being displayed.', 'Choose a split identifying repeated subjects for a random-intercept overlay.'],
  'anova.ancova': ['Build factor indicators and continuous covariates. | Compare outcome variation explained by the selected terms after covariate adjustment.', 'Adjusted factor differences are conditional on the covariate model.', 'Unequal covariate slopes or extrapolated covariate overlap can invalidate a common adjusted comparison.', 'Compare treatment scores adjusted for a baseline score.'],
  'anova.manova': ['Form within- and between-group multivariate sums-of-products matrices. | Evaluate the displayed multivariate test statistics for the outcome vector.', 'The omnibus tests concern joint outcomes rather than a collection of independent ANOVAs.', 'Singular covariance or too few cases per outcome dimension prevents reliable inference.', 'Compare groups jointly on speed and accuracy.'],
  'regression.logistic': ['Encode the selected binomial, multinomial, or ordinal response. | Fit its likelihood model and transform linear predictors into probabilities.', 'Odds ratios or class probabilities have meanings specific to the chosen model.', 'Separation, rare classes, and proportional-odds restrictions need model-specific review.', 'Choose binomial for a yes/no response and inspect predicted probabilities.'],
  'regression.glm': ['Select the response family and link. | Use iteratively reweighted fitting for the specified conditional mean and variance.', 'Coefficient interpretation depends on the link, such as log expected counts for Poisson.', 'Overdispersion and response support must be checked for the selected family.', 'Fit event count from exposure-related predictors using the Poisson family.'],
  'frequencies.binomial': ['Count successes and trials. | Compare with the specified null success probability using binomial inference.', 'The success level fixes which outcome the probability describes.', 'Trials must be independent with the modeled common probability.', 'Compare an observed pass rate with a benchmark probability .8.'],
  'frequencies.multinomial': ['Count category occurrences. | Compare observed counts with the specified expected proportions.', 'The omnibus result concerns the complete category probability vector.', 'Expected probabilities must be nonnegative and sum to 1.', 'Compare die-face counts with six equal probabilities.'],
  'frequencies.contingency': ['Cross-tabulate selected row and column categories. | Calculate independence-expected counts and the selected association summaries.', 'Residuals identify cells contributing to the overall association.', 'Sparse expected counts and dependent records need different inference.', 'Cross-tabulate assigned treatment and yes/no response.'],
  'frequencies.loglinear': ['Represent cell counts using the selected categorical terms. | Fit a log expected-count Poisson model and compare deviance.', 'Interaction terms describe departures from count independence.', 'Zero/sparse cells can impair estimation; structural zeros need a specified design.', 'Compare independent row/column effects with their interaction.'],
  'factor.efa': ['Extract common-factor loadings using principal-axis or the labeled approximate-ML method. | Apply the selected rotation and inspect uniqueness.', 'Loadings describe factor–indicator relationships; uniqueness is indicator variation not represented by common factors.', 'Approximate ML here must not be represented as a full external-package implementation.', 'Compare rotated loadings for a set of correlated questionnaire items.'],
  'reliability.unidimensional': ['Calculate internal-consistency summaries from item variances and covariance. | Inspect item-rest and item-deletion quantities.', 'Alpha measures covariance-based consistency; it does not prove a single latent construct.', 'Reverse-coded items must be consistently oriented before estimation.', 'Compare alpha before and after correcting a reverse-coded item.'],
  'reliability.icc': ['Partition subject and rater variation under the selected ICC model. | Apply the selected agreement/consistency and single/average-rating formula.', 'The ICC model and unit define the reliability estimand.', 'An average-rater ICC cannot be quoted as reliability of one rater.', 'Compare single-rating with average-rating reliability for the same raters.'],
  'reliability.agreement': ['Tabulate paired categorical rater decisions. | Compare observed agreement with chance-expected agreement for kappa.', 'Kappa and raw agreement answer different questions and respond to category prevalence.', 'High raw agreement can coexist with low kappa in an imbalanced category distribution.', 'Compare two raters on a rare-positive binary category.'],
  'reliability.blandAltman': ['Compute paired method differences and averages. | Estimate mean difference and displayed limits of agreement.', 'Bias concerns average difference; agreement limits describe the spread of individual differences.', 'Correlation between methods does not establish agreement; proportional bias needs review.', 'Compare two measurement methods that differ by a constant offset.'],
  'mixed.lmm': ['Build fixed-effect predictors and a grouping structure. | Estimate the supported Gaussian mixed-model/random-intercept specification.', 'Fixed effects describe modeled mean changes; random-effect variance describes group heterogeneity.', 'The browser implementation’s supported covariance structure is narrower than a general mixed-model package.', 'Use subject grouping for several measurements from each participant.'],
  'mixed.glmm': ['Combine the selected non-Gaussian response family with group effects. | Fit the supported group-dependent mean model.', 'Effects are interpreted on the chosen family’s link scale.', 'Review the reported approximation and supported random-effect structure before generalizing.', 'Model repeated binary responses grouped by subject.'],
  'factor.cfa': ['Specify indicators and simple factor structure. | Fit the covariance model and compare with the saturated covariance fit.', 'Loadings, residual variances, and fit indices concern the specified measurement model.', 'Factors are standardized and orthogonal in this implementation; unsupported structures are not inferred.', 'Assign three indicators per intended factor and inspect residual variation.'],
  'acceptance.attribute': ['Use the lot/sample sizes and acceptance number to compute acceptance probabilities. | Compare operating-characteristic probabilities across defect rates.', 'An acceptance plan trades producer and consumer risks.', 'Sampling-with/without-replacement assumptions depend on the selected plan.', 'Compare the acceptance probability at defect rates .01 and .10.'],
  'acceptance.variable': ['Use the measurement-based acceptance rule with the specified normal model. | Calculate the displayed acceptance and risk quantities.', 'A variable plan uses quantitative measurements rather than binary defect counts.', 'A misspecified measurement distribution changes the operating characteristic.', 'Compare acceptance as the process mean approaches a specification boundary.'],
  'audit.sampling': ['Plan sample size using N, planning rate, precision, and critical value. | Evaluate observed taint from book/audit values or the supplied rate.', 'Precision planning and taint evaluation have distinct denominators and units.', 'The planning model does not certify an audit sample’s selection mechanism.', 'Compare required sample size for precision .02 and .01 in a population of 1,000.'],
  'audit.data': ['Count first digits and compare with Benford expectations. | Inspect repeated values and group outcome rates where assigned.', 'Digit discrepancies and demographic-parity differences flag questions for investigation.', 'Benford does not apply to every numeric dataset and cannot prove fraud.', 'Compare amount first digits with bounded student scores before interpreting a digit test.'],
  'bain.tests': ['Estimate the selected family’s parameters. | Evaluate the supported informative-hypothesis comparison using its reported prior/approximation.', 'Evidence depends on the constrained hypothesis and comparison model.', 'Read the engine’s approximation label; selecting “SEM” does not enable unrestricted SEM syntax.', 'Compare μ>μ₀ with μ=μ₀ for the same one-sample data.'],
  'bff.general': ['Use the selected statistic family and prior scale. | Recompute its Bayes-factor function across sample-size markers.', 'The curve is conditional on the supplied statistic and prior model, not a future-data forecast.', 'Changing n while holding a statistic fixed is a sensitivity display, not an observed replication.', 'Compare t-family curves under two Cauchy prior scales.'],
  'bfpack.constrained': ['Estimate the selected family’s unconstrained quantities. | Compare the specified equality/order constraint using the implemented approximation.', 'Constraint evidence is not an ordinary unadjusted p-value.', 'The family and prior/approximation determine the comparison; read the result footnotes.', 'Compare greater and less hypotheses on the same mean difference.'],
  'bsts.model': ['Use a local-level state-space Kalman update. | Add optional seasonal mean terms and propagate forecast uncertainty.', 'The filtered level summarizes the evolving latent series state.', 'This local-level implementation is not full spike-and-slab MCMC BSTS.', 'Compare local-level forecasts with period 0 and a seasonal period 12.'],
  'circular.descriptives': ['Convert angles to the selected unit. | Average sine/cosine components and compute direction and resultant length.', 'A mean direction respects wraparound at 0/360 degrees.', 'Ordinary arithmetic averages are inappropriate near the wrap boundary.', 'Average directions 350° and 10° and compare with the arithmetic mean.'],
  'circular.tests': ['Compute resultant-vector uniformity evidence with Rayleigh. | Evaluate a specified direction with V-test and group mean directions with Watson–Williams when assigned.', 'The tests answer different directional hypotheses.', 'Multimodal symmetric directions can escape Rayleigh detection; Watson–Williams has concentration assumptions.', 'Compare clustered directions near 0° with directions spread around the circle.'],
  'cochrane.ma': ['Derive study effects/SEs from the assigned published-data roles or use direct effects. | Pool using the available inverse-variance meta-analysis models.', 'Forest points describe studies; the pooled estimate summarizes the specified effect scale.', 'Continuous and dichotomous effect scales cannot be mixed without a justified transformation.', 'Enter treatment/control arm summaries from several independent studies.'],
  'distributions.explorer': ['Fit or compare the selected distribution families. | Evaluate the displayed CDF or count goodness-of-fit measures.', 'Family ranking compares candidate models, not every possible distribution.', 'Estimated-parameter goodness-of-fit p-values may need calibration beyond standard fixed-parameter tests.', 'Compare normal and lognormal candidates for a positive skewed variable.'],
  'equivalence.t': ['Define lower and upper equivalence margins. | Run both one-sided mean-difference tests and require both to reject.', 'TOST supports equivalence within the prespecified margin, not exact equality.', 'Failure of a difference test alone does not establish equivalence.', 'Compare an interval with an equivalence range of −2 to 2 outcome units.'],
  'jags.model': ['Use the supported conjugate model’s conditional updates. | Generate the implemented Gibbs samples and inspect the returned posterior summaries.', 'Sample summaries concern the selected supported model.', 'This browser Gibbs implementation does not execute arbitrary JAGS model code.', 'Select a supported normal or binomial conjugate model and inspect its chain.'],
  'learnBayes.labs': ['Choose the conjugate Bayesian lesson. | Update its sufficient-statistic parameters and examine the posterior.', 'Posterior summaries combine the selected prior with the supplied observations.', 'Each conjugate family has a specific likelihood and parameterization.', 'Update a Beta prior using success and failure counts.'],
  'learnStats.labs': ['Use the chosen teaching statistic and its simulated or supplied inputs. | Calculate the displayed sample summary or repeated-sampling quantity.', 'The lesson’s statistic and population model define the displayed uncertainty.', 'A simulation result is conditional on its teaching model.', 'Compare simulated sample-mean variation at two sample sizes.'],
  'ml.regression': ['Encode complete numeric predictors and fit the selected regression learner. | Compare its fitted outcomes with the recorded evaluation split.', 'The reported evaluation includes in-sample fits for most learners; KNN uses leave-one-out.', 'Do not describe these displayed errors as independent cross-validation for every algorithm.', 'Compare linear and tree fits on a curved numeric relationship.'],
  'ml.classification': ['Encode a binary target and complete numeric predictors. | Fit the selected classifier and evaluate its displayed predictions.', 'Numeric targets are split at .5; a two-level factor uses its encoded positive level.', 'Check target encoding and whether metrics are from independent held-out data.', 'Compare logistic and tree decisions for the same binary outcome.'],
  'ml.clustering': ['Standardize numeric features. | Fit the selected clustering rule and inspect assignments and cluster diagnostics.', 'Labels identify groups; their numbers have no ordered meaning.', 'Fuzzy and RF choices are explicitly simplified prototypes in this engine.', 'Compare K-means and DBSCAN on two groups plus isolated noise points.'],
  'ml.prediction': ['Use the table’s last holdout fraction as evaluation cases. | Fit the selected supported learner on the preceding training rows and predict the holdout.', 'Predictions belong to the selected split, not a saved external model.', 'Row-order splits and training ranges determine the evaluation; no saved model file is loaded.', 'Place later observations in the holdout and compare prediction error.'],
  'meta.analysis': ['Weight study effects by their estimated precision. | Pool under the selected fixed/random-effect specification and calculate heterogeneity summaries.', 'The pooled effect and between-study variation summarize the modeled study population.', 'Publication bias and dependence among effects are not removed by inverse-variance weighting.', 'Compare fixed and random-effect summaries for heterogeneous studies.'],
  'network.psych': ['Estimate covariance of the selected nodes. | Invert a ridge-adjusted covariance and derive partial-correlation edges.', 'An edge is a regularized conditional association among measured nodes.', 'This is ridge precision rather than graphical-lasso optimization; edges are not causal links.', 'Increase regularization and compare the edge strengths.'],
  'power.analysis': ['Use the selected test’s sampling distribution under the planning effect. | Calculate power or solve for the requested planning quantity.', 'Sample size and effect-size definitions depend on the selected design.', 'Post-hoc power from an estimated effect is not additional evidence for a result.', 'Plan power for a prespecified two-group effect rather than its noisy observed estimate.'],
  'predictive.analytics': ['Fit the selected linear, logistic, or Holt-additive series model on the training prefix. | Evaluate the later holdout rows.', 'Holdout metrics concern forward row-order prediction for the chosen model.', 'Holt uses the documented smoothing constants; this is not an automatic black-box ensemble.', 'Compare training and test errors after a process change near the split.'],
  'process.model': ['Fit the supported mediation/moderation regressions. | Calculate path products or conditional effects for the selected PROCESS model.', 'An indirect effect is a product of fitted paths under the selected model.', 'Observational mediation needs causal assumptions beyond path significance.', 'Compare an indirect path with and without the selected moderator.'],
  'prophet.forecast': ['Build an additive trend, changepoint, and seasonal design. | Fit its Gaussian OLS coefficients and extrapolate the design.', 'Components explain the fitted additive forecast.', 'This is an additive OLS approximation, not Stan-based Prophet; uncertainty uses residual variation.', 'Compare a seasonal series forecast with and without a changepoint term.'],
  'qc.msa': ['Partition measurement variation into supported repeatability/reproducibility components. | Compare measurement variation with total or tolerance variation.', 'A measurement-system percentage concerns the selected study design and denominator.', 'Insufficient parts, operators, or replicates weaken variance-component estimation.', 'Compare repeated measurements of several parts across two operators.'],
  'qc.charts': ['Estimate the selected chart’s center and limits from process observations. | Mark points or subgroup summaries outside those limits.', 'A signal concerns statistical process stability, not conformance to specifications.', 'Subgroup design and temporal independence determine the chart’s limits.', 'Monitor a stable baseline followed by a sustained mean shift.'],
  'qc.capability': ['Estimate process center/spread. | Compare six-SD process width and centering with specification limits.', 'Cp describes spread fit; Cpk also describes distance to the nearest specification limit.', 'A drifting or nonnormal process can invalidate simple capability interpretations.', 'Move the process mean while retaining its SD and compare Cp/Cpk.'],
  'qc.doe': ['Encode design factors and interactions. | Fit the supported response model and compare fitted effects.', 'Design effects depend on factor coding and included interactions.', 'Confounding and insufficient replication cannot be repaired by displaying an ANOVA table.', 'Compare a factorial main-effect model with its interaction model.'],
  'robustT.modelAveraged': ['Compare the supported t-model alternatives using their model-evidence approximation. | Combine the displayed evidence or estimates with model weights.', 'Model averaging is conditional on the included model set.', 'This browser approximation is not a full robust-t MCMC model suite.', 'Compare equal-variance and unequal-variance evidence before interpreting the model-averaged result.'],
  'sem.sem': ['Fit the supported recursive observed-variable paths or simple latent measurement specification. | Compare modeled and observed covariance where identified.', 'Just-identified recursive paths coincide with the corresponding OLS fits.', 'Unrestricted lavaan syntax and arbitrary latent structures are not supported.', 'Fit one outcome path from two exogenous predictors.'],
  'sem.pls': ['Iteratively estimate standardized Mode A indicator composites. | Fit the path between the estimated composite scores.', 'Weights define composites; paths relate those composites.', 'Bootstrap SEs are omitted; PLS components are not covariance-SEM latent variables.', 'Assign two indicator blocks and inspect their composite loadings and path.'],
  'sem.mediation': ['Use the selected mediation, growth, MIMIC, or supported structural specification. | Fit its observed regression or covariance-model parameters.', 'Interpret paths and fit quantities within the selected model’s structure.', 'Observed-variable mediation does not include latent measurement error by default.', 'Compare direct and indirect paths in a simple X→M→Y model.'],
  'survival.nonparametric': ['Build event-time risk sets. | Estimate Kaplan–Meier survival and compare groups with the supported log-rank calculation.', 'Censoring reduces future risk sets without causing a failure step.', 'Noninformative censoring is needed for the usual survival interpretation.', 'Compare two treatment survival curves with event and censor indicators.'],
  'survival.cox': ['Use risk sets at event times to estimate proportional-hazards coefficients. | Report exponentiated coefficients as hazard ratios.', 'A hazard ratio is conditional on the included covariates.', 'Proportional hazards, adequate events, and censoring assumptions need review.', 'Model event time from treatment and age.'],
  'survival.parametric': ['Specify the supported parametric lifetime family. | Fit its survival model and compare parameter-based survival summaries.', 'Coefficients and predicted lifetimes depend on the selected family.', 'An incorrect tail model can distort extrapolated survival.', 'Compare Weibull with exponential lifetime shapes for the same follow-up data.'],
  'timeSeries.stationarity': ['Apply the selected unit-root/stationarity diagnostic to the ordered series. | Compare the reported statistic with its method-specific null.', 'Different stationarity tests can have opposite null hypotheses.', 'Trend and lag specification change the diagnostic question.', 'Compare a random walk with its first-differenced series.'],
  'timeSeries.arima': ['Difference according to d and build the supported AR/MA representation. | Estimate the displayed coefficients and generate forecasts.', 'p,d,q specify different mechanisms, not interchangeable complexity settings.', 'Read estimation and uncertainty approximations in the result footnotes.', 'Compare an AR(1) fit with a first-differenced random-walk model.'],
  'timeSeries.spectral': ['Transform the ordered series into frequency-domain components. | Display frequency-specific periodogram power.', 'A frequency peak suggests a repeating time scale; period is the reciprocal of frequency.', 'Trends and irregular spacing can create misleading spectral peaks.', 'Use a regularly spaced sine-wave scenario to locate its dominant frequency.'],
  'summaryStats.fromPublished': ['Use supplied group sample sizes, means, and SDs. | Compute the selected mean comparison without reconstructing observations.', 'Inference uses published summaries and cannot inspect individual-value diagnostics.', 'Summary statistics must describe compatible groups, units, and sampling designs.', 'Compare two independent published group means with their n and SD.'],
}
const LAB_ALIASES: Record<string, [string, string]> = {
  't.oneSample': ['hypothesis-testing', 'one-sample-t-test'], 't.independent': ['hypothesis-testing', 'two-sample-t-test'], 't.paired': ['hypothesis-testing', 'paired-t-test'],
  'anova.between': ['anova', 'two-way-anova'], 'anova.repeated': ['anova', 'repeated-measures-anova'], 'regression.linear': ['regression', 'multiple-regression'],
  'regression.correlation': ['correlation-association', 'pearson-correlation'], 'factor.pca': ['multivariate-statistics', 'principal-component-analysis'],
}
export const ALGORITHM_NOTES: Record<string, [calculation: string, limit: string]> = {
  linear: ['Fit an intercept and slopes by ordinary least squares.', 'Linear conditional means and full-rank predictors are required.'],
  regularized: ['Coordinate-descent ridge shrinks coefficients with a squared-coefficient penalty.', 'Penalization changes estimates; compare predictor scales.'], ridge: ['Shrink linear coefficients using a squared-coefficient penalty.', 'The penalty is implementation-specific; this is not an automatically tuned penalty path.'],
  lasso: ['Coordinate-descent lasso uses an absolute-coefficient penalty and can set slopes to zero.', 'Correlated predictors can make selected variables unstable.'],
  knn: ['Predict from five nearest feature-space training neighbors.', 'Distance is sensitive to feature units; regression/classification summaries use the engine’s evaluation rule.'],
  tree: ['Build axis-aligned CART-style splits with the supported depth limit.', 'A single tree can change substantially with small data changes.'],
  forest: ['Average the predictions of the browser’s ensemble of trees.', 'Displayed fit metrics are not automatically out-of-bag or cross-validated metrics.'],
  boosting: ['Add shallow residual-fitting trees sequentially.', 'More fitting stages can overfit; inspect the actual evaluation split.'],
  nn: ['Train the supported one-hidden-layer network with four hidden units.', 'This fixed small network is not an automatically tuned deep-learning architecture.'],
  svm: ['Fit the browser’s linear-margin classifier.', 'In the regression menu it thresholds outcomes around their mean; it is not support-vector regression.'],
  logistic: ['Fit a binomial logistic mean model and transform log odds into probabilities.', 'Check the .5/positive-level target encoding and separation.'],
  lda: ['Use class means and a pooled covariance to form a linear discriminant.', 'The model assumes compatible class covariance matrices.'],
  nb: ['Multiply class-conditional Gaussian feature likelihoods with class priors.', 'Gaussian naive Bayes assumes conditional independence among features.'],
  kmeans: ['Alternate nearest-centroid assignment and centroid updates on standardized features.', 'K-means favors roughly compact Euclidean clusters and requires k.'],
  dbscan: ['Expand dense neighborhoods using epsilon and minimum-point requirements.', 'Noise labels are meaningful; density settings and feature scale affect assignments.'],
  hierarchical: ['Use the browser’s single-linkage distance merges and cut into the requested groups.', 'Single linkage can chain observations through bridging points.'],
  fuzzy: ['Report hard labels from the K-means prototype used by this fuzzy menu entry.', 'Soft fuzzy memberships are not computed/exported here.'],
  gmm: ['Initialize spherical-covariance Gaussian-mixture EM with K-means.', 'This is a spherical mixture, not an arbitrary full-covariance mixture.'],
  neighborhood: ['Group observations using the supported standardized-feature neighborhood rule.', 'The radius controls which observations can connect.'],
  rf: ['Use the K-means partition as the engine’s RF-proximity clustering stand-in.', 'No random-forest proximity matrix is fitted for this clustering option.'],
  pearson: ['Normalize centered paired products by both variables’ spread.', 'Pearson measures linear association and is outlier-sensitive.'],
  spearman: ['Assign average ranks to ties and correlate the ranks.', 'Spearman measures monotonic ordering rather than raw-value linearity.'],
  kendall: ['Compare concordant and discordant observation pairs with tie handling.', 'Kendall’s scale differs from Pearson and Spearman.'],
  paf: ['Iterate principal-axis extraction on the reduced covariance/correlation diagonal.', 'A common-factor model is different from PCA total-variance decomposition.'],
  ml: ['Use the engine’s labeled approximate-ML common-factor extraction.', 'This extraction is an approximation, not a complete external ML factor solver.'],
}
export function analysisGuide(id: string, options: AnalysisOptions = {}) {
  const def = ANALYSIS_BY_ID[id]
  if (!def) return undefined
  const alias = LAB_ALIASES[id], original = alias && STUDIO_GUIDE_ENTRIES[alias[0]][alias[1]]
  const m = ANALYSIS_METHOD_ENTRIES[id]
  if (!original && !m) return undefined
  const inputText = def.fields.map(f => `${f.label}${'role' in f ? ` (${f.role})` : ''}${'required' in f && f.required ? ' — required' : ''}`).join('; ')
  const entry: GuideEntry = original ? [original[0], inputText, original[2], original[3], original[4], original[5]] : [def.description, inputText, m[0], m[1], m[2], m[3]]
  const guide = makeGuide(def.title, entry)
  const algorithmField = def.fields.find(f => f.kind === 'choice' && ['algorithm', 'method'].includes(f.key))
  if (algorithmField?.kind === 'choice') {
    const value = String(options[algorithmField.key] ?? algorithmField.options[0].value), selected = algorithmField.options.find(o => o.value === value), notes = ALGORITHM_NOTES[value]
    if (selected && notes) {
      guide.title += ` · ${selected.label}`
      guide.purpose = notes[0]
      guide.algorithm = [notes[0]]
      guide.caution = notes[1]
      if (id.startsWith('ml.')) {
        guide.algorithm.push(entry[2].split(' | ').at(-1)!)
        guide.example = `Assign complete numeric features and run ${selected.label}; inspect its predictions or group assignments alongside the input observations.`
      }
      if (id === 'ml.clustering') guide.inputs = value === 'dbscan' || value === 'neighborhood' ? 'Complete numeric feature columns; epsilon neighborhood radius and minimum points. Features are standardized before distance calculations.' : 'Complete numeric feature columns and the requested number of groups k. Features are standardized before distance calculations.'
      if (id === 'regression.correlation') {
        guide.interpretation = value === 'pearson' ? 'The coefficient describes linear paired association; −1 and +1 represent opposite and matching linear directions.' : value === 'spearman' ? 'The coefficient describes monotonic paired ordering using ranks, including average ranks for ties.' : 'The coefficient describes concordant versus discordant paired ordering with tie adjustment.'
        guide.example = `Select two numeric columns, run ${selected.label}, and inspect paired sample counts and the sign of the association.`
      }
    }
  }
  if (id === 't.independent') {
    guide.title += options.equalVariance ? ' · Student pooled t' : ' · Welch t'
    guide.algorithm = options.equalVariance ? ['Pool the sample variances with nA−1 and nB−1 weights.', 'Divide the A−B mean difference by the pooled SE and use nA+nB−2 df.'] : ['Compute SE=√(sA²/nA+sB²/nB).', 'Divide the A−B difference by SE and use Satterthwaite df.']
    if (options.mannWhitney) guide.algorithm.push('The selected Mann–Whitney follow-up ranks pooled observations and compares rank sums; its location interpretation requires comparable shapes.')
  }
  if (['t.paired', 't.oneSample'].includes(id) && options.wilcoxon) guide.algorithm.push('The selected Wilcoxon follow-up ranks nonzero absolute differences and compares signed rank sums; a symmetric difference distribution supports a location interpretation.')
  const selectedChoices = def.fields.flatMap(f => f.kind === 'choice' && !['method', 'algorithm'].includes(f.key) ? [`${f.label}: ${f.options.find(o => o.value === String(options[f.key] ?? f.options[0]?.value))?.label ?? String(options[f.key])}`] : [])
  if (selectedChoices.length) guide.inputs += `. Selected settings: ${selectedChoices.join('; ')}.`
  if (id === 'anova.between') {
    guide.inputs = inputText
    guide.algorithm = ['Build the selected one- or two-factor design and interactions.', `Calculate ${String(options.ssType ?? 'III')} sums of squares according to the configured design.`, 'Divide effect mean squares by the fitted residual mean square; compare the selected post-hoc family.']
    guide.caution = 'Unbalanced designs can give different Type I, II, and III hypotheses; check the chosen SS type and estimability.'
  }
  if (id === 'regression.glm' || id === 'mixed.glmm') {
    const family = String(options.family ?? 'gaussian')
    const families: Record<string, [string, string]> = {
      gaussian: ['Use an identity link and constant conditional variance.', 'Check linear conditional means and residual spread.'],
      binomial: ['Use a logit link and variance μ(1−μ).', 'Check binary outcome encoding and separation.'],
      poisson: ['Use a log link and variance μ for count outcomes.', 'Overdispersion can invalidate Poisson standard errors.'],
      gamma: ['Use a log link and variance proportional to μ².', 'Outcomes must be strictly positive.'],
      'inverse.gaussian': ['Use this engine’s log link and variance proportional to μ³.', 'Outcomes must be positive; this is a log-link implementation.'],
      negbin: ['Use a log link and variance μ+μ²/θ with a moment-estimated θ.', 'θ is a moment estimate rather than a joint likelihood estimate.'],
    }
    if (families[family]) {
      guide.title += ` · ${family}`
      guide.algorithm = [families[family][0], id === 'mixed.glmm' ? 'Fit the random-intercept model using penalized quasi-likelihood.' : 'Iterate weighted least squares until the mean-model fit converges.']
      guide.caution = families[family][1]
    }
  }
  if (id === 'regression.logistic') {
    const model = String(options.model ?? 'binomial')
    guide.title += ` · ${model}`
    if (model === 'multinomial') guide.algorithm = ['Encode the observed categories against the reference level.', 'Fit category-specific multinomial logit coefficient vectors and report category probabilities.']
    if (model === 'ordinal') { guide.algorithm = ['Fit cumulative-logit thresholds with common location slopes across outcome cutpoints.']; guide.caution = 'The proportional-odds constraint assumes common slopes; confirm the encoded outcome order.' }
  }
  if (def.bayesian && (options.inference === 'bayesian' || !def.frequentist)) {
    guide.title = `${def.title} · Bayesian`
    const variant = BAYESIAN_VARIANTS[id]
    if (variant) {
      guide.algorithm = variant[0].split(' | ')
      guide.purpose = variant[0]
      guide.caution = variant[1]
      guide.interpretation = id.startsWith('audit.') || id === 'acceptance.variable' || id === 'mixed.glmm' ? variant[1] : 'Read BF₁₀ as evidence for the specified alternative relative to its null; prior scale and the stated model comparison determine its meaning.'
    }
    if (['meta.analysis', 'cochrane.ma'].includes(id)) {
      guide.algorithm = ['Fix between-study τ² at its DerSimonian–Laird estimate.', 'Combine inverse-variance study information with a Normal(0,100) prior for the pooled mean.']
      guide.interpretation = 'Read the posterior mean, posterior SE, and P(μ>0) conditional on the fixed heterogeneity estimate.'
      guide.caution = 'The normal–normal posterior does not propagate uncertainty in τ² or run MCMC.'
    }
    if (id === 'network.psych') {
      guide.algorithm = ['Invert the ridge-adjusted covariance using the Wishart-like conjugate precision approximation.', 'Normalize precision entries into partial-correlation edges.']
      guide.caution = 'This is a ridge precision approximation, not graph-selection MCMC or a causal network.'
    }
  }
  return guide
}
