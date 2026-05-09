export type SyllabusModuleKey =
  | 'sample_spaces'
  | 'conditional_bayes'
  | 'counting'
  | 'distribution_explorer'
  | 'joint_marginal_conditional'
  | 'random_variable_simulator'
  | 'law_large_numbers'
  | 'central_limit_theorem'
  | 'bayesian_inference'
  | 'markov_chains'
  | 'poisson_process'
  | 'monte_carlo'
  | 'bootstrap_lab'
  | 'permutation_tests'
  | 'resampling_comparison'
  | 'experimental_design'
  | 'ab_testing'
  | 'survival_analysis'
  | 'advanced_time_series'
  | 'multivariate_statistics'
  | 'model_selection_validation'
  | 'missing_data'
  | 'outlier_influence'
  | 'theorem_library'
  | 'proof_intuition'
  | 'learning_paths'
  | 'practice_quizzes'
  | 'report_narration'

export type SyllabusModuleGroup =
  | 'Probability Foundations'
  | 'Probability Labs'
  | 'Inference & Resampling'
  | 'Design & Experimentation'
  | 'Modeling & Validation'
  | 'Data Quality'
  | 'Theorems & Learning'
  | 'Reporting'

export type SyllabusModule = {
  key: SyllabusModuleKey
  title: string
  group: SyllabusModuleGroup
  syllabusTags: string[]
  purpose: string
  concepts: string[]
  formulas: string[]
  kit: string[]
}

export const SYLLABUS_MODULES: SyllabusModule[] = [
  {
    key: 'sample_spaces',
    title: 'Sample Spaces & Events',
    group: 'Probability Foundations',
    syllabusTags: ['UG probability', 'events', 'set operations'],
    purpose: 'Build sample spaces and compute event complements, unions, intersections, and probabilities.',
    concepts: ['Outcome', 'Sample space', 'Event', 'Complement', 'Union', 'Intersection'],
    formulas: ['P(A)=|A|/|S|', 'P(A union B)=P(A)+P(B)-P(A intersection B)'],
    kit: ['Set calculator', 'Event probability grid', 'Teaching guide'],
  },
  {
    key: 'conditional_bayes',
    title: 'Conditional Probability & Bayes Theorem',
    group: 'Probability Foundations',
    syllabusTags: ['conditional probability', 'Bayes theorem', 'total probability'],
    purpose: 'Compute P(A|B), P(B|A), total probability, and Bayes posterior from entered probabilities.',
    concepts: ['Prior', 'Likelihood', 'Evidence', 'Posterior', 'Base rate'],
    formulas: ['P(A|B)=P(A and B)/P(B)', 'P(A|B)=P(B|A)P(A)/P(B)'],
    kit: ['Bayes calculator', 'False-positive interpretation', 'Formula walkthrough'],
  },
  {
    key: 'counting',
    title: 'Counting Techniques',
    group: 'Probability Foundations',
    syllabusTags: ['permutations', 'combinations', 'multinomial'],
    purpose: 'Teach permutations, combinations, arrangements with repetition, and multinomial counts.',
    concepts: ['Order matters', 'Replacement', 'Factorial', 'Partition counts'],
    formulas: ['nPr=n!/(n-r)!', 'nCr=n!/[r!(n-r)!]', 'n!/(n1! n2! ... nk!)'],
    kit: ['Permutation calculator', 'Combination calculator', 'Multinomial calculator'],
  },
  {
    key: 'distribution_explorer',
    title: 'Probability Distribution Explorer',
    group: 'Probability Labs',
    syllabusTags: ['PMF', 'PDF', 'CDF', 'quantiles'],
    purpose: 'Explore distribution shapes and parameter effects with immediate probability summaries.',
    concepts: ['Support', 'Parameter', 'Mass/density', 'CDF', 'Expected value', 'Variance'],
    formulas: ['E[X]=sum x p(x) or integral x f(x) dx', 'Var(X)=E[X^2]-E[X]^2'],
    kit: ['Bernoulli/binomial/Poisson/normal cards', 'Parameter sliders', 'CDF reading prompts'],
  },
  {
    key: 'joint_marginal_conditional',
    title: 'Joint, Marginal & Conditional Distributions',
    group: 'Probability Labs',
    syllabusTags: ['joint distribution', 'marginal', 'conditional'],
    purpose: 'Convert a joint probability table into marginal totals and conditional probabilities.',
    concepts: ['Joint table', 'Row marginal', 'Column marginal', 'Conditional slice', 'Independence'],
    formulas: ['P(X=x)=sum_y P(X=x,Y=y)', 'P(X=x|Y=y)=P(X=x,Y=y)/P(Y=y)'],
    kit: ['2x2 table explorer', 'Marginal totals', 'Independence checks'],
  },
  {
    key: 'random_variable_simulator',
    title: 'Random Variable Simulator',
    group: 'Probability Labs',
    syllabusTags: ['simulation', 'random variables', 'sampling'],
    purpose: 'Generate samples from discrete and continuous random variables and inspect empirical behavior.',
    concepts: ['Trial', 'Sample', 'Empirical mean', 'Empirical variance', 'Histogram'],
    formulas: ['sample mean = sum x_i/n', 'sample variance = sum (x_i-xbar)^2/(n-1)'],
    kit: ['Distribution selector', 'Sample summary', 'Histogram-ready output'],
  },
  {
    key: 'law_large_numbers',
    title: 'Law of Large Numbers Simulator',
    group: 'Probability Labs',
    syllabusTags: ['LLN', 'convergence', 'sample mean'],
    purpose: 'Show the running sample mean stabilizing near the expected value as sample size grows.',
    concepts: ['Expected value', 'Running average', 'Convergence in probability', 'Noise cancellation'],
    formulas: ['Xbar_n -> mu', 'Var(Xbar_n)=sigma^2/n'],
    kit: ['Coin-flip convergence lab', 'Running mean table', 'Assumption warnings'],
  },
  {
    key: 'central_limit_theorem',
    title: 'Central Limit Theorem Lab',
    group: 'Probability Labs',
    syllabusTags: ['CLT', 'sampling distribution', 'standard error'],
    purpose: 'Simulate sample means from non-normal populations and watch their distribution become normal-like.',
    concepts: ['Sampling distribution', 'Standardization', 'Standard error', 'Finite variance'],
    formulas: ['(Xbar-mu)/(sigma/sqrt(n)) => N(0,1)', 'SE=sigma/sqrt(n)'],
    kit: ['Parent distribution selector', 'Sample-size slider', 'Replicate summary'],
  },
  {
    key: 'bayesian_inference',
    title: 'Bayesian Inference Module',
    group: 'Inference & Resampling',
    syllabusTags: ['prior', 'likelihood', 'posterior', 'credible interval'],
    purpose: 'Update a prior with evidence and interpret posterior means and credible ranges.',
    concepts: ['Prior', 'Likelihood', 'Posterior', 'Credible interval', 'Posterior predictive'],
    formulas: ['posterior proportional to likelihood x prior', 'Beta(a,b)+x of n => Beta(a+x,b+n-x)'],
    kit: ['Beta-binomial updater', 'Posterior mean', 'Credible interval explanation'],
  },
  {
    key: 'markov_chains',
    title: 'Markov Chains',
    group: 'Probability Labs',
    syllabusTags: ['transition matrix', 'state', 'steady state'],
    purpose: 'Model state-to-state movement using transition matrices and long-run probabilities.',
    concepts: ['State', 'Transition probability', 'Matrix power', 'Stationary distribution'],
    formulas: ['pi_{t+1}=pi_t P', 'pi=pi P'],
    kit: ['Two-state chain calculator', 'Step-by-step distribution', 'Steady-state cue'],
  },
  {
    key: 'poisson_process',
    title: 'Poisson Process & Exponential Waiting Time',
    group: 'Probability Labs',
    syllabusTags: ['Poisson', 'exponential', 'memoryless'],
    purpose: 'Connect event counts per interval with waiting times between arrivals.',
    concepts: ['Rate', 'Arrival count', 'Interarrival time', 'Memoryless property'],
    formulas: ['P(N(t)=k)=e^(-lambda t)(lambda t)^k/k!', 'P(T>t)=e^(-lambda t)'],
    kit: ['Rate calculator', 'Expected count', 'Waiting-time probability'],
  },
  {
    key: 'monte_carlo',
    title: 'Monte Carlo Simulation Toolkit',
    group: 'Inference & Resampling',
    syllabusTags: ['simulation', 'uncertainty', 'risk'],
    purpose: 'Estimate probabilities, integrals, and uncertainty through repeated random trials.',
    concepts: ['Random trial', 'Estimator', 'Simulation error', 'Repeatability'],
    formulas: ['estimate = successes/trials', 'MC SE approx sqrt(p(1-p)/n)'],
    kit: ['Pi estimator', 'Probability estimator', 'Error discussion'],
  },
  {
    key: 'bootstrap_lab',
    title: 'Bootstrapping Visual Lab',
    group: 'Inference & Resampling',
    syllabusTags: ['bootstrap', 'confidence interval', 'resampling'],
    purpose: 'Resample rows with replacement to approximate sampling uncertainty.',
    concepts: ['Resample', 'Statistic', 'Bootstrap distribution', 'Percentile interval'],
    formulas: ['CI_percentile=[q_0.025, q_0.975]', 'resample size = original n'],
    kit: ['Bootstrap mean demo', 'Interval interpretation', 'Caveats'],
  },
  {
    key: 'permutation_tests',
    title: 'Permutation Test Builder',
    group: 'Inference & Resampling',
    syllabusTags: ['randomization test', 'exchangeability', 'p-value'],
    purpose: 'Shuffle labels to test whether an observed group difference is surprising under no association.',
    concepts: ['Exchangeability', 'Observed statistic', 'Null distribution', 'Extreme count'],
    formulas: ['p = count(|T_perm| >= |T_obs|)/B'],
    kit: ['Group-difference recipe', 'Label-shuffle explanation', 'p-value reading'],
  },
  {
    key: 'resampling_comparison',
    title: 'Resampling vs Parametric Test Comparison',
    group: 'Inference & Resampling',
    syllabusTags: ['parametric', 'bootstrap', 'permutation'],
    purpose: 'Compare when t-tests, bootstrap intervals, and permutation tests agree or diverge.',
    concepts: ['Model assumption', 'Robustness', 'Small sample', 'Skew/outlier sensitivity'],
    formulas: ['t=(xbar1-xbar2)/SE', 'bootstrap CI and permutation p answer different questions'],
    kit: ['Decision guide', 'Agreement cases', 'Divergence warnings'],
  },
  {
    key: 'experimental_design',
    title: 'Experimental Design Module',
    group: 'Design & Experimentation',
    syllabusTags: ['randomization', 'blocking', 'confounding', 'factorial design'],
    purpose: 'Plan studies that can support credible causal comparisons.',
    concepts: ['Treatment', 'Control', 'Randomization', 'Blocking', 'Replication', 'Confounding'],
    formulas: ['total cells = levels(A) x levels(B)', 'df_total=n-1'],
    kit: ['Design checklist', 'Factorial cell planner', 'Bias warnings'],
  },
  {
    key: 'ab_testing',
    title: 'A/B Testing Suite',
    group: 'Design & Experimentation',
    syllabusTags: ['conversion', 'uplift', 'sample size'],
    purpose: 'Compare conversion rates, estimate uplift, and plan sample size for product experiments.',
    concepts: ['Control', 'Variant', 'Conversion rate', 'Lift', 'Power', 'Sequential peeking'],
    formulas: ['lift=(pB-pA)/pA', 'z=(pB-pA)/SE'],
    kit: ['Conversion calculator', 'Uplift summary', 'Peeking warning'],
  },
  {
    key: 'survival_analysis',
    title: 'Survival Analysis Expansion',
    group: 'Modeling & Validation',
    syllabusTags: ['Kaplan-Meier', 'log-rank', 'Cox regression'],
    purpose: 'Analyze time-to-event data with censoring and group comparisons.',
    concepts: ['Time to event', 'Censoring', 'Survival curve', 'Hazard', 'Risk set'],
    formulas: ['S(t)=product(1-d_i/n_i)', 'hazard ratio from Cox model'],
    kit: ['KM checklist', 'Log-rank interpretation', 'Cox model cues'],
  },
  {
    key: 'advanced_time_series',
    title: 'Advanced Time Series',
    group: 'Modeling & Validation',
    syllabusTags: ['ARIMA', 'decomposition', 'ACF', 'stationarity'],
    purpose: 'Go beyond moving averages with trend, seasonality, autocorrelation, and forecast validation.',
    concepts: ['Trend', 'Seasonality', 'Lag', 'Autocorrelation', 'Stationarity', 'Backtesting'],
    formulas: ['AR(1): y_t=c+phi y_{t-1}+e_t', 'forecast error = y_t - yhat_t'],
    kit: ['ACF/PACF guide', 'Decomposition plan', 'Backtest metrics'],
  },
  {
    key: 'multivariate_statistics',
    title: 'Multivariate Statistics',
    group: 'Modeling & Validation',
    syllabusTags: ['MANOVA', 'discriminant analysis', 'canonical correlation'],
    purpose: 'Analyze multiple outcomes and multivariate relationships.',
    concepts: ['Vector outcome', 'Covariance matrix', 'Dimension reduction', 'Separation'],
    formulas: ['S = covariance matrix', 'linear discriminant score = w^T x'],
    kit: ['MANOVA cues', 'LDA/QDA guide', 'Canonical correlation map'],
  },
  {
    key: 'model_selection_validation',
    title: 'Model Selection & Validation',
    group: 'Modeling & Validation',
    syllabusTags: ['cross-validation', 'AIC', 'BIC', 'overfitting'],
    purpose: 'Choose models using validation, information criteria, and generalization checks.',
    concepts: ['Train/test split', 'Cross-validation', 'AIC/BIC', 'Bias-variance tradeoff', 'Overfitting'],
    formulas: ['AIC=2k-2ln(L)', 'BIC=k ln(n)-2ln(L)'],
    kit: ['Validation checklist', 'Metric chooser', 'Overfitting demo prompt'],
  },
  {
    key: 'missing_data',
    title: 'Missing Data Module',
    group: 'Data Quality',
    syllabusTags: ['MCAR', 'MAR', 'MNAR', 'imputation'],
    purpose: 'Diagnose missingness patterns and select defensible handling strategies.',
    concepts: ['MCAR', 'MAR', 'MNAR', 'Deletion', 'Imputation', 'Sensitivity analysis'],
    formulas: ['missing percent = missing/n', 'imputed value depends on chosen model'],
    kit: ['Missingness map guide', 'Strategy selector', 'Caveat language'],
  },
  {
    key: 'outlier_influence',
    title: 'Outlier & Influence Toolkit',
    group: 'Data Quality',
    syllabusTags: ['outliers', 'leverage', 'Cook distance', 'robustness'],
    purpose: 'Detect extreme values, influential points, and robust alternatives.',
    concepts: ['IQR rule', 'Z-score', 'Mahalanobis distance', 'Leverage', 'Cook distance'],
    formulas: ['IQR fences = Q1-1.5IQR, Q3+1.5IQR', 'z=(x-mu)/sigma'],
    kit: ['Outlier rules', 'Influence checklist', 'Robust summary alternatives'],
  },
  {
    key: 'theorem_library',
    title: 'Theorem Library',
    group: 'Theorems & Learning',
    syllabusTags: ['Bayes', 'CLT', 'LLN', 'Chebyshev', 'Gauss-Markov'],
    purpose: 'Search, study, and connect major statistics and probability theorems.',
    concepts: ['Statement', 'Assumptions', 'Consequence', 'Counterexample', 'Application'],
    formulas: ['LLN: Xbar_n -> mu', 'CLT: standardized mean => N(0,1)', 'Gauss-Markov: BLUE under OLS assumptions'],
    kit: ['Searchable cards', 'Assumption matrix', 'Application map'],
  },
  {
    key: 'proof_intuition',
    title: 'Proof Sketches & Intuition Mode',
    group: 'Theorems & Learning',
    syllabusTags: ['proof', 'intuition', 'counterexample'],
    purpose: 'Teach each theorem through formal statements, intuition, proof sketches, and assumption breaks.',
    concepts: ['Formal statement', 'Proof idea', 'Intuition', 'Example', 'Failure mode'],
    formulas: ['proof = definitions + key inequality/limit + conclusion'],
    kit: ['Proof notebooks', 'Plain-language mode', 'Counterexample prompts'],
  },
  {
    key: 'learning_paths',
    title: 'Interactive Learning Paths',
    group: 'Theorems & Learning',
    syllabusTags: ['beginner', 'exam prep', 'data analyst', 'research'],
    purpose: 'Guide learners through coherent tracks matched to their goals.',
    concepts: ['Prerequisite', 'Track', 'Milestone', 'Practice loop', 'Progress'],
    formulas: ['learn = concept + example + lab + quiz + reflection'],
    kit: ['Beginner path', 'Exam-prep path', 'Data analyst path', 'Research statistics path'],
  },
  {
    key: 'practice_quizzes',
    title: 'Practice Questions & Auto-Generated Quizzes',
    group: 'Theorems & Learning',
    syllabusTags: ['quiz', 'practice', 'solutions'],
    purpose: 'Offer MCQ, numeric, and interpretation practice with hints and explanations.',
    concepts: ['Question type', 'Hint', 'Step solution', 'Feedback', 'Mastery'],
    formulas: ['score = correct/attempted', 'review interval grows with mastery'],
    kit: ['MCQ bank', 'Numerical drills', 'Interpretation questions'],
  },
  {
    key: 'report_narration',
    title: 'Report Narration Assistant',
    group: 'Reporting',
    syllabusTags: ['interpretation', 'caveats', 'recommendations'],
    purpose: 'Turn statistical outputs into plain-English findings with assumptions and next steps.',
    concepts: ['Finding', 'Evidence', 'Effect size', 'Assumption', 'Limitation', 'Recommendation'],
    formulas: ['report = result + magnitude + uncertainty + caveat + action'],
    kit: ['Narration templates', 'Assumption caveats', 'Next-step suggestions'],
  },
]

export const SYLLABUS_MODULE_BY_KEY = Object.fromEntries(SYLLABUS_MODULES.map((module) => [module.key, module])) as Record<SyllabusModuleKey, SyllabusModule>
