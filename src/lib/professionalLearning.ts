import type { ColumnSchema, Dataset } from '../types'

export type PracticeKind = 'mcq' | 'numeric' | 'interpretation' | 'dataset-task' | 'case-study'
export type DecisionGoal = 'compare-groups' | 'relationship' | 'predict' | 'describe' | 'fit-distribution'
export type VariableShape = 'numeric' | 'categorical' | 'mixed' | 'time'
export type SampleDesign = 'one-sample' | 'two-independent' | 'paired' | 'three-plus' | 'observational'

export type PracticeQuestion = {
  id: string
  kind: PracticeKind
  level: 'Beginner' | 'Intermediate' | 'Professional'
  topic: string
  prompt: string
  choices?: string[]
  answer: string
  explanation: string
  datasetHint?: string
}

export const LEARNING_PATHS = [
  {
    id: 'student-foundations',
    audience: 'Students',
    title: 'Statistics Foundations',
    outcome: 'Move from descriptive statistics to confidence intervals and hypothesis tests.',
    modules: ['Data types and scales', 'Summary statistics', 'Probability and distributions', 'Sampling', 'Confidence intervals', 't-tests', 'Chi-square tests'],
    practiceTargets: ['30 MCQs', '12 numeric problems', '4 dataset tasks'],
  },
  {
    id: 'research-methods',
    audience: 'Researchers',
    title: 'Research Methods and Inference',
    outcome: 'Choose valid tests, check assumptions, and write defensible results sections.',
    modules: ['Study design', 'Power and sample size', 'Assumption checks', 'ANOVA', 'Regression', 'Effect sizes', 'APA reporting'],
    practiceTargets: ['10 case studies', '8 interpretation drills', '5 report templates'],
  },
  {
    id: 'business-analytics',
    audience: 'Professionals',
    title: 'Business Analytics Practice',
    outcome: 'Analyze operational, sales, customer, and experiment data with clear decisions.',
    modules: ['Data quality', 'Dashboards', 'Correlation', 'A/B tests', 'Forecasting', 'Segmentation', 'Executive reporting'],
    practiceTargets: ['8 dataset tasks', '6 dashboards', '4 decision memos'],
  },
  {
    id: 'medical-statistics',
    audience: 'Healthcare',
    title: 'Medical Statistics Essentials',
    outcome: 'Interpret clinical comparisons, diagnostic accuracy, risk, and trial results.',
    modules: ['Clinical variables', 'Risk and odds', 'Paired designs', 'Diagnostic tests', 'Survival basics', 'Clinical report wording'],
    practiceTargets: ['6 clinical cases', '8 interpretation drills', '4 assumption audits'],
  },
]

export const PRACTICE_BANK: PracticeQuestion[] = [
  {
    id: 'mcq-variable-type',
    kind: 'mcq',
    level: 'Beginner',
    topic: 'Data types',
    prompt: 'Which variable type is most appropriate for blood group?',
    choices: ['Numeric continuous', 'Categorical nominal', 'Date/time', 'Numeric ordinal'],
    answer: 'Categorical nominal',
    explanation: 'Blood group has labels without a natural numeric distance or ordering.',
  },
  {
    id: 'mcq-pvalue',
    kind: 'interpretation',
    level: 'Intermediate',
    topic: 'Inference',
    prompt: 'A test gives p = 0.031 at alpha = 0.05. What is the correct conclusion?',
    choices: ['Accept H0', 'Reject H0', 'The effect is large', 'The result is clinically important'],
    answer: 'Reject H0',
    explanation: 'The p-value is below alpha, so reject H0. It does not prove effect size or practical importance.',
  },
  {
    id: 'numeric-ci',
    kind: 'numeric',
    level: 'Intermediate',
    topic: 'Confidence intervals',
    prompt: 'A sample mean is 50, standard error is 2, and the 95% critical value is 1.96. What is the margin of error?',
    answer: '3.92',
    explanation: 'Margin of error = critical value x standard error = 1.96 x 2 = 3.92.',
  },
  {
    id: 'dataset-ab',
    kind: 'dataset-task',
    level: 'Professional',
    topic: 'A/B testing',
    prompt: 'Use Campaign A/B Test to compare conversion behavior between variants and write a business recommendation.',
    answer: 'Use a proportion or conversion-rate comparison with effect size and confidence interval.',
    explanation: 'A/B test decisions need both statistical evidence and practical lift, not only p-values.',
    datasetHint: 'Campaign A/B Test',
  },
  {
    id: 'case-clinical',
    kind: 'case-study',
    level: 'Professional',
    topic: 'Clinical reporting',
    prompt: 'A medication group has lower week-12 systolic pressure than control. What must be checked before claiming treatment benefit?',
    answer: 'Baseline balance, paired/independent design, missingness, variance, effect size, and clinical relevance.',
    explanation: 'Clinical claims require design validity, assumptions, magnitude, uncertainty, and limitations.',
    datasetHint: 'Blood Pressure Trial',
  },
  {
    id: 'mcq-chi-square',
    kind: 'mcq',
    level: 'Intermediate',
    topic: 'Chi-square',
    prompt: 'Which warning matters most for a chi-square independence test?',
    choices: ['Expected cell counts below 5', 'Numeric column has decimals', 'Mean is not zero', 'Data has a date column'],
    answer: 'Expected cell counts below 5',
    explanation: 'Small expected counts can invalidate chi-square approximation. Combine categories or use exact methods.',
  },
  {
    id: 'numeric-z',
    kind: 'numeric',
    level: 'Beginner',
    topic: 'Standardization',
    prompt: 'If x = 72, mean = 60, and SD = 6, what is the z-score?',
    answer: '2',
    explanation: 'z = (x - mean) / SD = (72 - 60) / 6 = 2.',
  },
  {
    id: 'interpret-correlation',
    kind: 'interpretation',
    level: 'Beginner',
    topic: 'Correlation',
    prompt: 'A correlation of r = 0.82 between study hours and marks means what?',
    answer: 'There is a strong positive linear association, but not proof of causation.',
    explanation: 'Correlation measures association. Causal claims need design or additional evidence.',
    datasetHint: 'Student Marks',
  },
]

export const FORMULA_BRIDGES = [
  {
    id: 'z-score',
    title: 'Z-score',
    formula: 'z = (x - mean) / sd',
    purpose: 'Standardize a value into standard deviation units.',
    steps: ['Choose a numeric value x.', 'Subtract the column mean.', 'Divide by the sample standard deviation.', 'Interpret distance from average.'],
  },
  {
    id: 't-one-sample',
    title: 'One-sample t',
    formula: 't = (mean - mu0) / (s / sqrt(n))',
    purpose: 'Test whether a sample mean differs from a hypothesized population mean.',
    steps: ['Compute sample mean.', 'Compute sample SD.', 'Compute standard error.', 'Compare t to the t distribution.'],
  },
  {
    id: 'ci-mean',
    title: 'Confidence interval for mean',
    formula: 'mean +/- t* x SE',
    purpose: 'Estimate a plausible range for the population mean.',
    steps: ['Pick confidence level.', 'Compute SE.', 'Multiply by critical value.', 'Report lower and upper bounds.'],
  },
  {
    id: 'chi-square',
    title: 'Chi-square statistic',
    formula: 'X2 = sum((observed - expected)^2 / expected)',
    purpose: 'Measure disagreement between observed and expected frequencies.',
    steps: ['Build observed counts.', 'Compute expected counts.', 'Check expected count assumptions.', 'Sum standardized deviations.'],
  },
]

export const TEACHING_DATASET_LIBRARY = [
  { sampleId: 'student-marks', difficulty: 'Beginner', concepts: ['correlation', 'descriptive statistics', 'ANOVA'], task: 'Explain which academic factor is most associated with total marks.' },
  { sampleId: 'campaign-ab-test', difficulty: 'Intermediate', concepts: ['A/B testing', 'proportions', 'business decisions'], task: 'Compare campaign variants and recommend whether to ship B.' },
  { sampleId: 'blood-pressure-trial', difficulty: 'Professional', concepts: ['paired tests', 'clinical effect', 'assumptions'], task: 'Write a clinical-style comparison of baseline and week-12 systolic pressure.' },
  { sampleId: 'customer-churn', difficulty: 'Professional', concepts: ['classification', 'risk factors', 'logistic thinking'], task: 'Identify variables that should enter a churn-risk model.' },
  { sampleId: 'manufacturing-defects', difficulty: 'Intermediate', concepts: ['quality control', 'Poisson counts', 'process monitoring'], task: 'Find batches that need process investigation.' },
  { sampleId: 'survey-satisfaction', difficulty: 'Beginner', concepts: ['Likert data', 'frequency tables', 'group comparison'], task: 'Summarize satisfaction patterns and limitations of ordinal scales.' },
]

export const INSTRUCTOR_TEMPLATES = [
  { title: 'Concept Drill Assignment', output: 'Worksheet + answer key', rubric: ['Correct method choice', 'Formula substitution', 'Interpretation clarity', 'Assumption awareness'] },
  { title: 'Dataset Analysis Lab', output: 'Student report + reproducibility log', rubric: ['Data cleaning notes', 'Chart quality', 'Valid test choice', 'Conclusion with limitations'] },
  { title: 'Mock Exam Pack', output: 'Timed MCQ/numeric set', rubric: ['Accuracy', 'Time management', 'Common mistakes reviewed', 'Retry improvement'] },
  { title: 'Professional Case Memo', output: 'One-page decision memo', rubric: ['Business/research question', 'Evidence strength', 'Risk and caveats', 'Recommendation'] },
]

export const REPORT_TEMPLATES = [
  { title: 'Research Paper Results', sections: ['Research question', 'Methods', 'Assumptions', 'Results', 'Effect size', 'Limitations', 'APA statement'] },
  { title: 'Business Dashboard Memo', sections: ['Decision context', 'KPI summary', 'Segment findings', 'Recommended action', 'Risk notes'] },
  { title: 'Medical Audit Report', sections: ['Clinical question', 'Cohort definition', 'Outcome summary', 'Statistical comparison', 'Clinical interpretation', 'Cautions'] },
  { title: 'Thesis Chapter Analysis', sections: ['Objective', 'Data source', 'Descriptive statistics', 'Inferential tests', 'Figures/tables', 'Discussion bridge'] },
  { title: 'Quality Control Note', sections: ['Process metric', 'Control signal', 'Outliers', 'Root-cause prompt', 'Corrective action'] },
]

export function recommendTest(goal: DecisionGoal, shape: VariableShape, design: SampleDesign) {
  if (goal === 'describe') return 'Use summary statistics, frequency tables, histograms, and missingness checks before inference.'
  if (goal === 'fit-distribution') return 'Use distribution fit, goodness-of-fit, Q-Q style visual checks, and domain plausibility.'
  if (goal === 'predict') return shape === 'numeric' ? 'Use linear regression with residual diagnostics and validation.' : 'Use logistic/classification workflow with confusion matrix and calibration.'
  if (goal === 'relationship') return shape === 'numeric' ? 'Use correlation/regression with scatterplot and outlier checks.' : 'Use chi-square independence with expected-count checks.'
  if (design === 'paired') return 'Use paired t-test for numeric paired data, or McNemar/Wilcoxon alternatives when assumptions fail.'
  if (design === 'three-plus') return 'Use ANOVA for numeric outcome across 3+ groups, with variance and residual checks.'
  if (shape === 'categorical') return 'Use chi-square or proportion test, checking expected counts and sample independence.'
  return 'Use Welch two-sample t-test for two independent numeric groups, with variance and outlier checks.'
}

export function assumptionPanel(dataset: Dataset | null, method: string, variables: string[]) {
  const checks: Array<{ label: string; status: 'ok' | 'warn' | 'review'; detail: string }> = []
  if (!dataset) return [{ label: 'Dataset', status: 'review' as const, detail: 'Load a dataset to inspect assumptions against real columns.' }]
  const selected = variables.map((name) => dataset.schema.find((col) => col.name === name)).filter(Boolean) as ColumnSchema[]
  const missing = selected.reduce((sum, col) => sum + col.missing, 0)
  checks.push({
    label: 'Sample size',
    status: dataset.rows >= 30 ? 'ok' : 'warn',
    detail: dataset.rows >= 30 ? `${dataset.rows} rows available.` : `Only ${dataset.rows} rows; inference may be unstable.`,
  })
  checks.push({
    label: 'Missing data',
    status: missing === 0 ? 'ok' : missing / Math.max(dataset.rows * Math.max(selected.length, 1), 1) > 0.1 ? 'warn' : 'review',
    detail: missing === 0 ? 'No missing values in selected variables.' : `${missing} missing values in selected variables.`,
  })
  checks.push({
    label: 'Variable type',
    status: selected.length === 0 ? 'review' : selected.every((col) => method.includes('chi') ? col.type !== 'numeric' : col.type === 'numeric') ? 'ok' : 'review',
    detail: selected.length === 0 ? 'Select variables for a targeted check.' : `Selected: ${selected.map((col) => `${col.name} (${col.type})`).join(', ')}.`,
  })
  checks.push({
    label: 'Independence',
    status: 'review',
    detail: 'Confirm design knowledge: repeated measurements, clustering, and sampling method cannot be inferred from column values alone.',
  })
  checks.push({
    label: 'Outliers / distribution',
    status: selected.some((col) => col.type === 'numeric' && typeof col.std === 'number' && col.std === 0) ? 'warn' : 'review',
    detail: 'Inspect histograms/boxplots for skew, extreme values, and zero-variance columns before reporting.',
  })
  return checks
}

export function interpretationNarrative(method: string, result: string, assumptions: string[]) {
  const caveat = assumptions.length ? ` This conclusion should be read with caution because ${assumptions.join('; ')}.` : ''
  return {
    plain: `${method}: ${result}.${caveat}`,
    report: `Using ${method}, the analysis found ${result.toLowerCase()}. The result should be interpreted in the context of the study design, data quality, and assumption checks.`,
    apa: `${method} result: ${result}. Report the statistic, degrees of freedom when relevant, p-value, confidence interval, and effect size.`,
    doNotConclude: 'Do not claim causation, clinical/business importance, or population generality unless the design and sampling support it.',
  }
}
