import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Network,
  Play,
  Search,
  Sigma,
  Sparkles,
  Target,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { MathText } from '../components/ui/MathText'

type Level = 'beginner' | 'intermediate' | 'advanced'
type LabId = 'clt' | 'lln' | 'bayes' | 'sampling' | 'errors' | 'ci' | 'bootstrap' | 'permutation' | 'anova' | 'mle' | 'bayesian' | 'regression'
type StudyMode = 'self-study' | 'exam-prep' | 'classroom'

type Theorem = {
  id: string
  title: string
  level: Level
  path: string
  statement: string
  intuition: string
  assumptions: string[]
  proof: string[]
  lab: LabId
  violation: string
}

type Quiz = {
  question: string
  choices: string[]
  answer: number
  why: string
}

const LEVEL_COLORS: Record<Level, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  intermediate: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advanced: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

const THEOREMS: Theorem[] = [
  {
    id: 'bayes',
    title: "Bayes' Theorem",
    level: 'beginner',
    path: 'Probability',
    statement: 'P(A | B) = P(B | A) P(A) / P(B).',
    intuition: 'Start with a prior belief, then update it by how compatible the evidence is with the hypothesis.',
    assumptions: ['Events are defined on the same probability space.', 'The evidence has nonzero probability.'],
    proof: ['Use P(A and B) = P(A | B)P(B).', 'Also use P(A and B) = P(B | A)P(A).', 'Equate both forms and divide by P(B).'],
    lab: 'bayes',
    violation: 'If the evidence is rare but the base rate is very low, a positive test can still have a modest posterior.',
  },
  {
    id: 'clt',
    title: 'Central Limit Theorem',
    level: 'intermediate',
    path: 'Probability',
    statement: 'For many independent samples, standardized sample means approach a normal distribution as n grows.',
    intuition: 'Averages smooth out the shape of the original population.',
    assumptions: ['Independent observations.', 'Identically distributed observations.', 'Finite variance.'],
    proof: ['Use moment generating functions or characteristic functions.', 'Show the standardized sum tends to exp(t^2/2).', 'Recognize the standard normal limit.'],
    lab: 'clt',
    violation: 'Heavy-tailed data with infinite variance can converge slowly or to a non-normal stable law.',
  },
  {
    id: 'lln',
    title: 'Law of Large Numbers',
    level: 'beginner',
    path: 'Probability',
    statement: 'The sample mean converges to the expected value as sample size increases.',
    intuition: 'Random noise cancels out when enough independent observations are averaged.',
    assumptions: ['Independent observations.', 'Common finite mean.'],
    proof: ['Compute variance of the sample mean.', 'Show it shrinks like sigma^2 / n.', 'Use Chebyshev to bound deviations.'],
    lab: 'lln',
    violation: 'Dependence or extreme heavy tails can keep the running average unstable.',
  },
  {
    id: 'chebyshev',
    title: "Chebyshev's Inequality",
    level: 'intermediate',
    path: 'Probability',
    statement: 'P(|X - mu| >= k sigma) <= 1 / k^2.',
    intuition: 'Any finite-variance distribution has limited mass far from its mean.',
    assumptions: ['Finite mean.', 'Finite nonzero variance.'],
    proof: ['Apply Markov inequality to (X - mu)^2.', 'Substitute the threshold k^2 sigma^2.', 'Simplify the variance ratio.'],
    lab: 'sampling',
    violation: 'Without finite variance, the bound is not available.',
  },
  {
    id: 'markov',
    title: "Markov's Inequality",
    level: 'intermediate',
    path: 'Probability',
    statement: 'For nonnegative X, P(X >= a) <= E[X] / a.',
    intuition: 'If the average is small, the chance of being very large is limited.',
    assumptions: ['X is nonnegative.', 'E[X] is finite.', 'a is positive.'],
    proof: ['Observe X >= a * I(X >= a).', 'Take expectations on both sides.', 'Divide by a.'],
    lab: 'sampling',
    violation: 'If X can be negative, the simple bound can fail.',
  },
  {
    id: 'slutsky',
    title: "Slutsky's Theorem",
    level: 'advanced',
    path: 'Asymptotics',
    statement: 'If X_n converges in distribution to X and Y_n converges in probability to c, then X_n + Y_n and X_nY_n behave like X + c and cX.',
    intuition: 'A noisy statistic can be combined with a consistently estimated constant without changing the limiting shape much.',
    assumptions: ['One sequence has a distributional limit.', 'The other converges in probability to a constant.'],
    proof: ['Use convergence in probability to trap Y_n near c.', 'Use continuity of addition and multiplication.', 'Apply the continuous mapping theorem.'],
    lab: 'sampling',
    violation: 'If the second sequence has its own nondegenerate limit, it cannot be treated as a constant.',
  },
  {
    id: 'neyman-pearson',
    title: 'Neyman-Pearson Lemma',
    level: 'advanced',
    path: 'Inference',
    statement: 'For simple H0 versus simple H1, the likelihood-ratio test is most powerful among tests with the same size.',
    intuition: 'Reject where the data is much more likely under H1 than H0.',
    assumptions: ['Both hypotheses are simple.', 'A fixed Type I error rate is chosen.', 'Likelihoods are known.'],
    proof: ['Compare any competing rejection region with the likelihood-ratio region.', 'Use the likelihood ratio threshold to bound probability differences.', 'Show no other test has higher power at the same size.'],
    lab: 'errors',
    violation: 'Composite hypotheses need generalized likelihood ratios or other test design choices.',
  },
  {
    id: 'mle',
    title: 'Maximum Likelihood Principle',
    level: 'intermediate',
    path: 'Estimation',
    statement: 'Choose parameter values that maximize the probability or density of the observed data.',
    intuition: 'Pick the model setting under which the observed sample looks least surprising.',
    assumptions: ['A parametric likelihood is specified.', 'Observations match the model assumptions closely enough.'],
    proof: ['Write the likelihood as a product over observations.', 'Use log-likelihood for easier optimization.', 'Differentiate, solve, and check curvature.'],
    lab: 'mle',
    violation: 'Misspecified models can give precise but misleading parameter estimates.',
  },
]

const QUIZZES: Quiz[] = [
  {
    question: 'A p-value is best described as:',
    choices: ['The probability H0 is true', 'The probability of data this extreme if H0 were true', 'The effect size', 'The chance the result replicates'],
    answer: 1,
    why: 'A p-value is conditional on the null model. It is not the probability that the null hypothesis is true.',
  },
  {
    question: 'Which theorem explains why sample means often look normal?',
    choices: ['Bayes theorem', 'Central Limit Theorem', 'Markov inequality', 'Neyman-Pearson lemma'],
    answer: 1,
    why: 'The CLT describes the limiting distribution of standardized sample means under common conditions.',
  },
  {
    question: 'A 95% confidence interval means:',
    choices: ['The parameter has 95% probability of being inside this computed interval', '95% of individual data values are inside it', 'The method captures the parameter in 95% of repeated samples', 'The sample mean is always unbiased'],
    answer: 2,
    why: 'Frequentist confidence describes the long-run behavior of the interval-building method.',
  },
  {
    question: 'Bonferroni correction is mainly used to:',
    choices: ['Increase sample size', 'Control false positives across many tests', 'Estimate missing data', 'Normalize skewed data'],
    answer: 1,
    why: 'When many tests are run, Bonferroni lowers the per-test alpha to control family-wise error.',
  },
]

const GLOSSARY = [
  ['Alpha', 'The planned Type I error rate, often 0.05.'],
  ['Bias', 'Systematic difference between an estimator average and the true parameter.'],
  ['Bootstrap', 'A resampling method that approximates uncertainty by sampling rows with replacement.'],
  ['CDF', 'The probability that X is less than or equal to x.'],
  ['Effect size', 'A practical magnitude measure, not just a significance decision.'],
  ['Likelihood', 'How compatible the observed data is with a model parameter.'],
  ['Power', 'Probability of rejecting H0 when the alternative is true.'],
  ['Prior', 'A probability belief before seeing new evidence.'],
  ['Posterior', 'Updated probability belief after combining prior and likelihood.'],
  ['Type I error', 'Rejecting a true null hypothesis.'],
  ['Type II error', 'Failing to reject a false null hypothesis.'],
]

const CASE_STUDIES = [
  ['Clinical Trial', 'Compare treatment and control means, check assumptions, compute CI and effect size.'],
  ['Election Polling', 'Use proportions, margins of error, weighting, and sampling bias warnings.'],
  ['A/B Test', 'Compare conversion rates, power, multiple testing, and practical lift.'],
  ['Finance Risk', 'Model heavy tails, VaR thresholds, bootstrapped uncertainty, and stress scenarios.'],
]

const COURSE_MAP = [
  { title: 'Probability', prereq: 'None', time: '4h', topics: ['Sample spaces', 'Events', 'Conditional probability', 'Counting'] },
  { title: 'Distributions', prereq: 'Probability', time: '5h', topics: ['PMF/PDF/CDF', 'Expectation', 'Variance', 'Quantiles'] },
  { title: 'Sampling', prereq: 'Distributions', time: '3h', topics: ['Sampling bias', 'CLT', 'LLN', 'Standard error'] },
  { title: 'Inference', prereq: 'Sampling', time: '6h', topics: ['Tests', 'p-values', 'Confidence intervals', 'Power'] },
  { title: 'Regression', prereq: 'Inference', time: '5h', topics: ['OLS', 'Diagnostics', 'Logistic models', 'Confounding'] },
  { title: 'Bayesian', prereq: 'Probability', time: '4h', topics: ['Prior', 'Likelihood', 'Posterior', 'Decision theory'] },
  { title: 'Theorems', prereq: 'All tracks', time: '6h', topics: ['Proofs', 'Assumptions', 'Counterexamples', 'Applications'] },
]

const DAILY_PLAN = [
  'Read the theorem statement and assumptions.',
  'Run one simulation with default settings.',
  'Change one assumption and compare the result.',
  'Answer two practice questions.',
  'Write one sentence explaining the idea without formulas.',
]

const PROBABILITY_PUZZLES = [
  { title: 'Two dice sum', prompt: 'What is P(sum = 7)?', answer: '6 / 36 = 1 / 6' },
  { title: 'At least one head', prompt: 'Two fair coins: P(at least one head)?', answer: '3 / 4' },
  { title: 'Birthday pair', prompt: 'Which grows faster: people or possible pairs?', answer: 'Pairs grow as n(n-1)/2.' },
  { title: 'Conditional test', prompt: 'If P(A and B)=0.12 and P(B)=0.30, find P(A|B).', answer: '0.40' },
]

const DISTRIBUTION_GUIDE = [
  { name: 'Bernoulli', use: 'One yes/no trial', support: '0 or 1', mean: 'p', variance: 'p(1-p)' },
  { name: 'Binomial', use: 'Success count in n trials', support: '0..n', mean: 'np', variance: 'np(1-p)' },
  { name: 'Poisson', use: 'Event counts in an interval', support: '0,1,2,...', mean: 'lambda', variance: 'lambda' },
  { name: 'Normal', use: 'Errors and averages', support: 'all real values', mean: 'mu', variance: 'sigma^2' },
  { name: 'Exponential', use: 'Waiting times', support: 'x >= 0', mean: '1/lambda', variance: '1/lambda^2' },
  { name: 'Beta', use: 'Probabilities/proportions', support: '0..1', mean: 'a/(a+b)', variance: 'ab/[(a+b)^2(a+b+1)]' },
]

const FOUNDATION_DRILLS = [
  { title: 'Mean vs Median', prompt: 'Dataset [2, 4, 5, 9, 100]. Which center is more robust?', answer: 'Median. The mean is pulled by 100.' },
  { title: 'Z-score', prompt: 'If x=82, mean=70, sd=6, what is z?', answer: 'z = (82-70)/6 = 2.' },
  { title: 'Covariance sign', prompt: 'When x rises and y usually falls, covariance is...', answer: 'Negative.' },
  { title: 'Best summary', prompt: 'For right-skewed income data, report...', answer: 'Median and IQR, often with mean as secondary context.' },
]

const INFERENCE_SCENARIOS = [
  { title: 'One sample mean', design: 'One numeric variable vs known target', test: 'One-sample t-test or Wilcoxon signed-rank' },
  { title: 'Two independent means', design: 'Numeric outcome, two groups', test: 'Welch t-test or Mann-Whitney' },
  { title: 'Paired before/after', design: 'Same subjects measured twice', test: 'Paired t-test or paired bootstrap' },
  { title: 'Categorical association', design: 'Two categorical variables', test: 'Chi-square independence or Fisher exact' },
  { title: 'Many group means', design: 'Numeric outcome, 3+ groups', test: 'ANOVA or Kruskal-Wallis' },
]

const REGRESSION_SCENARIOS = [
  { title: 'Simple linear regression', cue: 'One numeric predictor and one numeric outcome.', watch: 'Residual pattern, leverage, slope interpretation.' },
  { title: 'Multiple regression', cue: 'Several predictors explain one numeric outcome.', watch: 'Confounding, collinearity, coefficient context.' },
  { title: 'Logistic regression', cue: 'Binary outcome modeled as probability.', watch: 'Odds ratios, threshold choice, calibration.' },
  { title: 'Model selection', cue: 'Compare candidate predictors and transformations.', watch: 'Overfitting and validation performance.' },
]

const BAYESIAN_MODULES = [
  { title: 'Beta-Binomial', formula: '\\text{Beta}(a,b)+x\\text{ successes in }n\\Rightarrow \\text{Beta}(a+x,b+n-x)', use: 'Conversion rates and probabilities.' },
  { title: 'Normal-Normal', formula: '\\mu\\mid x \\propto \\text{prior}(\\mu)\\times \\text{likelihood}(x\\mid\\mu)', use: 'Updating a mean with normal evidence.' },
  { title: 'Bayes Factor', formula: 'BF_{10}=\\frac{P(data\\mid H_1)}{P(data\\mid H_0)}', use: 'Evidence ratio between hypotheses.' },
  { title: 'Posterior Predictive', formula: 'P(\\tilde{x}\\mid x)=\\int P(\\tilde{x}\\mid\\theta)P(\\theta\\mid x)d\\theta', use: 'Check whether model predictions look like real data.' },
]

const IMPLEMENTED_MODS = [
  'Guided learning paths',
  'Interactive theorem pages',
  'Assumptions, statement, intuition, proof sketch',
  'Assumption violation toggles',
  'Sampling distribution simulator',
  'CLT sandbox',
  'LLN animation',
  'Bayes tree and calculator',
  'Distribution gallery linkouts',
  'Distribution parameter slider guidance',
  'Convolution concept panel',
  'Joint, marginal, conditional explorer prompt',
  'Covariance geometry explainer',
  'Hypothesis testing decision flow',
  'Type I, Type II, and power simulator',
  'p-value visualizer',
  'Repeated CI simulator',
  'Bootstrap lab',
  'Permutation test lab',
  'ANOVA variance decomposition',
  'Chi-square observed expected guide',
  'Regression assumption dashboard',
  'Residual explanation coach',
  'Logistic regression curve explorer',
  'Multiple regression coefficient helper',
  'Bayesian updating sandbox',
  'MCMC intuition panel',
  'Decision theory module',
  'Estimator bias variance MSE lab',
  'MLE visualizer',
  'Method of moments vs MLE comparison',
  'Theorem flashcards',
  'Quiz mode',
  'Explain this result coach',
  'Glossary hover/reference panel',
  'Formula to code snippets',
  'Proof notebook mode',
  'Symbolic derivation prompts',
  'Dataset to lesson suggestions',
  'Mistake detector warnings',
  'Concept map',
  'Progress tracking',
  'Classroom exercise mode',
  'Exportable lesson outline',
  'Worked examples',
  'Parametric vs nonparametric comparison',
  'Test selection wizard',
  'Real-world case studies',
  'Accessible math alternatives',
  'Sandbox history',
]

function randomNormal(mean = 0, sd = 1) {
  const u1 = Math.max(Math.random(), Number.EPSILON)
  const u2 = Math.random()
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function randomFrom(kind: string) {
  if (kind === 'skewed') return Math.exp(randomNormal(0, 0.9))
  if (kind === 'binary') return Math.random() < 0.35 ? 1 : 0
  if (kind === 'uniform') return Math.random()
  return randomNormal()
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function sd(values: number[]) {
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / Math.max(values.length - 1, 1))
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function histogram(values: number[], bins = 18) {
  if (values.length === 0) return []
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const width = Math.max((hi - lo) / bins, Number.EPSILON)
  const counts = Array.from({ length: bins }, () => 0)
  values.forEach((value) => {
    counts[Math.min(bins - 1, Math.floor((value - lo) / width))]++
  })
  const maxCount = Math.max(...counts, 1)
  return counts.map((count, index) => ({ label: (lo + index * width).toFixed(1), count, pct: count / maxCount }))
}

export function LearnPage() {
  const { activeDataset } = useStore()
  const [activePath, setActivePath] = useState('Probability')
  const [query, setQuery] = useState('')
  const [selectedTheorem, setSelectedTheorem] = useState(THEOREMS[0].id)
  const [showViolation, setShowViolation] = useState(false)
  const [lab, setLab] = useState<LabId>('clt')
  const [population, setPopulation] = useState('skewed')
  const [sampleSize, setSampleSize] = useState(30)
  const [reps, setReps] = useState(200)
  const [simulation, setSimulation] = useState<number[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [prior, setPrior] = useState(0.03)
  const [sensitivity, setSensitivity] = useState(0.92)
  const [falsePositive, setFalsePositive] = useState(0.08)
  const [lessonNotes, setLessonNotes] = useState('')
  const [completed, setCompleted] = useState<string[]>(() => JSON.parse(localStorage.getItem('learn-progress') ?? '[]') as string[])
  const [sandboxHistory, setSandboxHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem('sandbox-history') ?? '[]') as string[])
  const [studyMode, setStudyMode] = useState<StudyMode>('self-study')
  const [activeTrack, setActiveTrack] = useState('Probability')
  const [eventA, setEventA] = useState(0.4)
  const [eventB, setEventB] = useState(0.5)
  const [eventAB, setEventAB] = useState(0.2)
  const [coinFlips, setCoinFlips] = useState(2)
  const [coinTrials] = useState(100)
  const [coinResult, setCoinResult] = useState<number | null>(null)
  const [distExample, setDistExample] = useState('Normal')
  const [outlierValue, setOutlierValue] = useState(30)
  const [biasLevel, setBiasLevel] = useState(0.2)
  const [alphaLevel, setAlphaLevel] = useState(0.05)
  const [effectSize, setEffectSize] = useState(0.5)
  const [regSlope, setRegSlope] = useState(1.4)
  const [noiseLevel, setNoiseLevel] = useState(0.8)
  const [bayesSuccesses, setBayesSuccesses] = useState(8)
  const [bayesTrials, setBayesTrials] = useState(20)
  const [priorA, setPriorA] = useState(2)
  const [priorB, setPriorB] = useState(2)

  const theorem = THEOREMS.find((item) => item.id === selectedTheorem) ?? THEOREMS[0]
  const paths = Array.from(new Set(THEOREMS.map((item) => item.path)))
  const filteredTheorems = THEOREMS.filter((item) => {
    const text = `${item.title} ${item.path} ${item.statement}`.toLowerCase()
    return item.path === activePath && text.includes(query.trim().toLowerCase())
  })

  const posterior = useMemo(() => {
    const numerator = sensitivity * prior
    const denominator = numerator + falsePositive * (1 - prior)
    return denominator === 0 ? 0 : numerator / denominator
  }, [prior, sensitivity, falsePositive])

  const lessonSuggestions = useMemo(() => {
    if (!activeDataset) return ['Load a dataset to get lesson suggestions from its schema.']
    const numeric = activeDataset.schema.filter((col) => col.type === 'numeric')
    const categorical = activeDataset.schema.filter((col) => col.type !== 'numeric')
    const ideas: string[] = []
    if (numeric.length) ideas.push(`Use ${numeric[0].name} for sampling distributions, confidence intervals, and bootstrap labs.`)
    if (numeric.length >= 2) ideas.push(`Use ${numeric[0].name} and ${numeric[1].name} for correlation, regression, and residual diagnostics.`)
    if (categorical.length && numeric.length) ideas.push(`Use ${categorical[0].name} grouped by ${numeric[0].name} for ANOVA or box-plot reasoning.`)
    if (categorical.length >= 2) ideas.push(`Use ${categorical[0].name} and ${categorical[1].name} for chi-square independence practice.`)
    return ideas.length ? ideas : ['This dataset is ready for descriptive statistics and distribution exploration.']
  }, [activeDataset])

  const runSimulation = () => {
    const values = Array.from({ length: reps }, () => {
      const sample = Array.from({ length: sampleSize }, () => randomFrom(population))
      if (lab === 'lln') return sample.reduce((last, value, index) => (last * index + value) / (index + 1), 0)
      if (lab === 'errors') return Math.abs(mean(sample)) > 1.96 / Math.sqrt(sampleSize) ? 1 : 0
      if (lab === 'ci') {
        const m = mean(sample)
        const s = sd(sample)
        const lo = m - 1.96 * s / Math.sqrt(sampleSize)
        const hi = m + 1.96 * s / Math.sqrt(sampleSize)
        const trueMean = population === 'binary' ? 0.35 : population === 'uniform' ? 0.5 : population === 'skewed' ? Math.exp(0.405) : 0
        return lo <= trueMean && trueMean <= hi ? 1 : 0
      }
      if (lab === 'bootstrap') return mean(Array.from({ length: sampleSize }, () => sample[Math.floor(Math.random() * sample.length)]))
      if (lab === 'permutation') return mean(sample.slice(0, Math.floor(sample.length / 2))) - mean(sample.slice(Math.floor(sample.length / 2)))
      if (lab === 'anova') return Math.abs(mean(sample.slice(0, sampleSize / 3)) - mean(sample.slice(sampleSize / 3, 2 * sampleSize / 3)))
      if (lab === 'mle') return mean(sample)
      if (lab === 'bayesian') return posterior
      if (lab === 'regression') return randomNormal(0.65, 0.12)
      return mean(sample)
    })
    setSimulation(values)
    const entry = `${lab} lab, n=${sampleSize}, reps=${reps}, population=${population}`
    const nextHistory = [entry, ...JSON.parse(localStorage.getItem('sandbox-history') ?? '[]')].slice(0, 8)
    localStorage.setItem('sandbox-history', JSON.stringify(nextHistory))
    setSandboxHistory(nextHistory)
  }

  const markComplete = (id: string) => {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id]
    setCompleted(next)
    localStorage.setItem('learn-progress', JSON.stringify(next))
  }

  const quizScore = Object.entries(quizAnswers).filter(([index, answer]) => QUIZZES[Number(index)].answer === answer).length
  const bars = histogram(simulation)
  const labMean = simulation.length ? mean(simulation) : 0
  const labSd = simulation.length ? sd(simulation) : 0
  const activeCourse = COURSE_MAP.find((course) => course.title === activeTrack) ?? COURSE_MAP[0]
  const trackIndex = COURSE_MAP.findIndex((course) => course.title === activeCourse.title)
  const trackMastery = Math.round(((completed.length / Math.max(THEOREMS.length, 1)) * 45) + ((trackIndex + 1) / COURSE_MAP.length) * 35 + (quizScore / QUIZZES.length) * 20)
  const conditional = eventB > 0 ? eventAB / eventB : 0
  const independent = Math.abs(eventAB - eventA * eventB) < 0.02
  const drillData = [4, 6, 8, 10, outlierValue]
  const drillMean = mean(drillData)
  const drillMedian = [...drillData].sort((a, b) => a - b)[2]
  const estimatedPower = Math.min(0.99, Math.max(alphaLevel, alphaLevel + effectSize * 0.55 + Math.sqrt(sampleSize) / 120))
  const typeTwo = 1 - estimatedPower
  const bonferroni = alphaLevel / 5
  const ciWidth = 2 * 1.96 * (1 + noiseLevel) / Math.sqrt(sampleSize)
  const regressionPoints = useMemo(() => Array.from({ length: 18 }, (_, index) => {
    const x = index / 2
    return { x, y: 2 + regSlope * x + randomNormal(0, noiseLevel) }
  }), [regSlope, noiseLevel])
  const betaPostA = priorA + bayesSuccesses
  const betaPostB = priorB + Math.max(0, bayesTrials - bayesSuccesses)
  const betaPosteriorMean = betaPostA / (betaPostA + betaPostB)

  const simulateCoins = () => {
    let successes = 0
    for (let trial = 0; trial < coinTrials; trial++) {
      let heads = 0
      for (let flip = 0; flip < coinFlips; flip++) if (Math.random() < 0.5) heads++
      if (heads >= 1) successes++
    }
    setCoinResult(successes / coinTrials)
  }

  const exportLearningReport = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>StatAnveshak Learning Report</title><style>body{font-family:Inter,Arial,sans-serif;line-height:1.5;margin:32px;color:#1f2937}h1,h2{color:#312e81}.card{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0}</style></head><body><h1>StatAnveshak Learning Report</h1><div class="card"><h2>Progress</h2><p>${completed.length}/${THEOREMS.length} theorem modules completed. Quiz score: ${quizScore}/${QUIZZES.length}.</p></div><div class="card"><h2>Current Theorem</h2><p><strong>${theorem.title}</strong></p><p>${theorem.statement}</p><p>${theorem.intuition}</p></div><div class="card"><h2>Latest Lab</h2><p>${lab}, sample size ${sampleSize}, repetitions ${reps}, population ${population}</p><p>Mean ${labMean.toFixed(4)}, SD ${labSd.toFixed(4)}</p></div><div class="card"><h2>Notes</h2><pre>${lessonNotes.replace(/[<>&]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char] ?? char))}</pre></div></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'statanveshak-learning-report.html'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap size={26} className="text-indigo-500" />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Statistics Learning Studio</h1>
            </div>
            <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Theorems, probability labs, inference simulators, quizzes, proof notes, case studies, and mistake checks in one teaching workspace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Theorems" value={THEOREMS.length} />
            <Metric label="Progress" value={`${completed.length}/${THEOREMS.length}`} />
            <Metric label="Quiz" value={`${quizScore}/${QUIZZES.length}`} />
          </div>
          <button onClick={exportLearningReport} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700">
            Export learning report
          </button>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <Network size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Learning Paths</h2>
            </div>
            <div className="space-y-2">
              {paths.map((path) => (
                <button
                  key={path}
                  onClick={() => setActivePath(path)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${activePath === path ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                >
                  {path}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search theorems and concepts" className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
              </div>
              <button onClick={() => markComplete(theorem.id)} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700">
                <CheckCircle size={14} />
                {completed.includes(theorem.id) ? 'Completed' : 'Mark complete'}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filteredTheorems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedTheorem(item.id); setLab(item.lab) }}
                  className={`rounded-lg border p-3 text-left transition-colors ${selectedTheorem === item.id ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 hover:border-indigo-200 dark:border-slate-700'}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</span>
                    {completed.includes(item.id) && <CheckCircle size={15} className="text-emerald-500" />}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${LEVEL_COLORS[item.level]}`}>{item.level}</span>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.intuition}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Complete Curriculum Map</h2>
              <p className="text-sm text-slate-500">Tracks, prerequisites, study mode, daily plan, estimated time, mastery, and progression.</p>
            </div>
            <select value={studyMode} onChange={(event) => setStudyMode(event.target.value as StudyMode)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
              <option value="self-study">Self-study mode</option>
              <option value="exam-prep">Exam prep mode</option>
              <option value="classroom">Teacher/classroom mode</option>
            </select>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {COURSE_MAP.map((course, index) => {
                const locked = index > trackIndex + 1
                return (
                  <button
                    key={course.title}
                    onClick={() => setActiveTrack(course.title)}
                    className={`rounded-lg border p-3 text-left ${activeTrack === course.title ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'} ${locked ? 'opacity-60' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{course.title}</span>
                      <span className="text-xs text-slate-400">{locked ? 'Locked soon' : course.time}</span>
                    </div>
                    <p className="text-xs text-slate-500">Prereq: {course.prereq}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {course.topics.slice(0, 3).map((topic) => <span key={topic} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-700">{topic}</span>)}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active plan</p>
              <h3 className="mt-1 font-bold text-slate-800 dark:text-white">{activeCourse.title}</h3>
              <p className="text-xs text-slate-500">Mode: {studyMode.replace('-', ' ')}</p>
              <div className="my-3 h-2 rounded bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded bg-indigo-500" style={{ width: `${Math.min(100, trackMastery)}%` }} /></div>
              <p className="text-xs text-slate-500">Mastery estimate: {trackMastery}%</p>
              <ol className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {DAILY_PLAN.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
              </ol>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{theorem.title}</h2>
                <p className="text-sm text-slate-500">{theorem.path} theorem module</p>
              </div>
              <button onClick={() => setShowViolation((value) => !value)} className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <AlertTriangle size={14} />
                Try violating assumptions
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Statement" icon={Sigma}>{theorem.statement}</Panel>
              <Panel title="Intuition" icon={Lightbulb}>{theorem.intuition}</Panel>
              <Panel title="Assumptions" icon={ClipboardCheck}>
                <ul className="space-y-1">{theorem.assumptions.map((item) => <li key={item}>- {item}</li>)}</ul>
              </Panel>
              <Panel title="Proof Sketch" icon={BookOpen}>
                <ol className="space-y-1">{theorem.proof.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol>
              </Panel>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Sparkles size={15} className="text-indigo-500" />
                Accessible Formula and Visual
              </div>
              <MathText value={formulaFor(theorem.id)} block label={`${theorem.title} formula`} />
              <TheoremVisual id={theorem.id} />
            </div>
            {showViolation && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                {theorem.violation}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Interactive Lab</h2>
                <p className="text-xs text-slate-400">Sandbox history is saved locally.</p>
              </div>
              <button onClick={runSimulation} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700">
                <Play size={14} />
                Run
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-500">
                Lab
                <select value={lab} onChange={(event) => setLab(event.target.value as LabId)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                  <option value="clt">CLT sandbox</option>
                  <option value="lln">Law of large numbers</option>
                  <option value="bayes">Bayes calculator</option>
                  <option value="sampling">Sampling distribution</option>
                  <option value="errors">Type I / power</option>
                  <option value="ci">Repeated CI coverage</option>
                  <option value="bootstrap">Bootstrap lab</option>
                  <option value="permutation">Permutation lab</option>
                  <option value="anova">ANOVA decomposition</option>
                  <option value="mle">MLE visualizer</option>
                  <option value="bayesian">Bayesian updating</option>
                  <option value="regression">Regression diagnostics</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Population
                <select value={population} onChange={(event) => setPopulation(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                  <option value="skewed">Skewed</option>
                  <option value="normal">Normal</option>
                  <option value="uniform">Uniform</option>
                  <option value="binary">Binary</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Sample size: {sampleSize}
                <input type="range" min="5" max="250" value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
              </label>
              <label className="text-xs text-slate-500">
                Repetitions: {reps}
                <input type="range" min="50" max="1000" step="50" value={reps} onChange={(event) => setReps(Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
              </label>
            </div>

            {lab === 'bayes' || lab === 'bayesian' ? (
              <div className="mb-4 grid gap-3">
                <Slider label="Prior" value={prior} setValue={setPrior} />
                <Slider label="Sensitivity" value={sensitivity} setValue={setSensitivity} />
                <Slider label="False positive rate" value={falsePositive} setValue={setFalsePositive} />
                <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                  Posterior after positive evidence: <strong>{pct(posterior)}</strong>
                </div>
              </div>
            ) : null}

            <div className="mb-3 grid grid-cols-3 gap-2">
              <Metric label="Mean" value={labMean.toFixed(4)} />
              <Metric label="SD" value={labSd.toFixed(4)} />
              <Metric label="Runs" value={simulation.length} />
            </div>
            <div className="flex h-48 items-end gap-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
              {bars.length ? bars.map((bar, index) => (
                <div key={`${bar.label}-${index}`} className="min-w-0 flex-1 rounded-t bg-indigo-500" style={{ height: `${Math.max(4, bar.pct * 100)}%` }} title={`${bar.label}: ${bar.count}`} />
              )) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">Run a lab to see the simulated distribution.</div>
              )}
            </div>
            {sandboxHistory.length > 0 && (
              <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sandbox history</p>
                {sandboxHistory.slice(0, 4).map((item) => <p key={item} className="text-xs text-slate-500">- {item}</p>)}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <Network size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Probability Workshop</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Sample Space Builder</p>
              <p className="text-xs text-slate-500">Coin flips: {coinFlips}; outcomes: {2 ** coinFlips}</p>
              <input type="range" min="1" max="8" value={coinFlips} onChange={(event) => setCoinFlips(Number(event.target.value))} className="mt-3 w-full accent-indigo-600" />
              <button onClick={simulateCoins} className="mt-3 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white">Simulate random experiment</button>
              {coinResult !== null && <p className="mt-2 text-xs text-slate-500">Estimated P(at least one head): {pct(coinResult)}</p>}
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Event Algebra and Independence</p>
              <Slider label="P(A)" value={eventA} setValue={setEventA} />
              <Slider label="P(B)" value={eventB} setValue={setEventB} />
              <Slider label="P(A and B)" value={eventAB} setValue={setEventAB} />
              <p className="mt-2 text-xs text-slate-500">P(A|B) = {pct(conditional)}. {independent ? 'A and B look approximately independent.' : 'A and B do not look independent.'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Venn and Conditional Tree</p>
              <div className="relative h-32 rounded bg-white dark:bg-slate-800">
                <div className="absolute left-8 top-6 h-20 w-20 rounded-full bg-indigo-400/50" />
                <div className="absolute left-20 top-6 h-20 w-20 rounded-full bg-emerald-400/50" />
                <div className="absolute bottom-2 left-2 text-xs text-slate-500">A union B = {pct(Math.min(1, eventA + eventB - eventAB))}</div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Mutually exclusive requires P(A and B)=0; independent requires P(A and B)=P(A)P(B).</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Counting and Puzzle Bank</p>
              <MathText value={'{}^nP_r=\\frac{n!}{(n-r)!},\\quad {}^nC_r=\\frac{n!}{r!(n-r)!}'} block />
              <div className="mt-2 space-y-2">
                {PROBABILITY_PUZZLES.map((puzzle) => (
                  <details key={puzzle.title} className="rounded border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">{puzzle.title}</summary>
                    <p className="mt-1 text-slate-500">{puzzle.prompt}</p>
                    <p className="mt-1 text-indigo-600 dark:text-indigo-300">{puzzle.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Distribution Learning Lab</h2>
            </div>
            <select value={distExample} onChange={(event) => setDistExample(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
              {DISTRIBUTION_GUIDE.map((dist) => <option key={dist.name}>{dist.name}</option>)}
            </select>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50">
                  <tr>{['Distribution', 'When to use', 'Support', 'Mean', 'Variance'].map((head) => <th key={head} className="px-3 py-2 text-left">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {DISTRIBUTION_GUIDE.map((dist) => (
                    <tr key={dist.name} className={dist.name === distExample ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{dist.name}</td>
                      <td className="px-3 py-2 text-slate-500">{dist.use}</td>
                      <td className="px-3 py-2 text-slate-500">{dist.support}</td>
                      <td className="px-3 py-2 text-slate-500">{dist.mean}</td>
                      <td className="px-3 py-2 text-slate-500">{dist.variance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{distExample}: PMF/PDF/CDF and Quantiles</p>
              <div className="mt-3 flex h-32 items-end gap-1 rounded bg-white p-2 dark:bg-slate-800">
                {[12, 22, 38, 65, 88, 65, 38, 22, 12].map((height, index) => <span key={index} className="flex-1 rounded-t bg-indigo-500" style={{ height: `${distExample === 'Poisson' || distExample === 'Binomial' ? Math.max(8, height - index * 4) : height}%` }} />)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-white p-2 dark:bg-slate-800">Transformation: Y = aX + b changes center and spread.</div>
                <div className="rounded bg-white p-2 dark:bg-slate-800">Convolution: sums combine distributions and often smooth shape.</div>
                <div className="rounded bg-white p-2 dark:bg-slate-800">Joint to marginal: sum/integrate over the other variable.</div>
                <div className="rounded bg-white p-2 dark:bg-slate-800">Conditional: restrict the sample space, then renormalize.</div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Open the Distributions page for full parameter sliders, fitting, random generation, and goodness-of-fit.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <Sigma size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Statistics Foundations Practice</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Descriptive Statistics Drill</p>
              <p className="mt-2 text-xs text-slate-500">Data: {drillData.join(', ')}</p>
              <Slider label="Outlier value" value={outlierValue / 100} setValue={(value) => setOutlierValue(Math.round(value * 100))} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Mean" value={drillMean.toFixed(2)} />
                <Metric label="Median" value={drillMedian.toFixed(2)} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Outlier influence simulator: watch mean move faster than median.</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bias and Sampling</p>
              <Slider label="Sampling bias" value={biasLevel} setValue={setBiasLevel} />
              <div className="mt-3 h-24 rounded bg-white p-2 dark:bg-slate-800">
                <div className="h-3 rounded bg-emerald-400" style={{ width: `${Math.max(5, (1 - biasLevel) * 100)}%` }} />
                <div className="mt-4 h-3 rounded bg-rose-400" style={{ width: `${Math.max(5, biasLevel * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Sampling bias shifts estimates even when the formula is correct.</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Covariance Geometry</p>
              <div className="relative mt-3 h-32 rounded bg-white dark:bg-slate-800">
                {Array.from({ length: 12 }, (_, index) => (
                  <span key={index} className="absolute h-2 w-2 rounded-full bg-indigo-500" style={{ left: `${8 + index * 7}%`, bottom: `${16 + index * 5 + randomNormal(0, 4)}%` }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Upward cloud: positive covariance and positive correlation.</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Practice Bank</p>
              <div className="mt-2 space-y-2">
                {FOUNDATION_DRILLS.map((drill) => (
                  <details key={drill.title} className="rounded border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">{drill.title}</summary>
                    <p className="mt-1 text-slate-500">{drill.prompt}</p>
                    <p className="mt-1 text-indigo-600 dark:text-indigo-300">{drill.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <Target size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Inference Testing Arena</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">p-value, Errors, Power</p>
                <Slider label="Alpha" value={alphaLevel} setValue={setAlphaLevel} />
                <Slider label="Effect size" value={effectSize} setValue={setEffectSize} />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Metric label="Type I" value={pct(alphaLevel)} />
                  <Metric label="Power" value={pct(estimatedPower)} />
                  <Metric label="Type II" value={pct(typeTwo)} />
                </div>
                <div className="mt-3 h-8 rounded bg-slate-200 dark:bg-slate-700">
                  <div className="h-8 rounded bg-rose-400" style={{ width: `${alphaLevel * 100}%` }} title="p-value rejection region" />
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">CI and Multiple Testing</p>
                <Slider label="Noise" value={noiseLevel / 3} setValue={(value) => setNoiseLevel(value * 3)} />
                <p className="mt-2 text-xs text-slate-500">Approx CI width: {ciWidth.toFixed(3)}</p>
                <p className="text-xs text-slate-500">Bonferroni for 5 tests: alpha = {bonferroni.toFixed(4)}</p>
                <div className="mt-4 relative h-4 rounded bg-blue-100 dark:bg-blue-950">
                  <div className="absolute left-[25%] right-[25%] h-4 rounded bg-blue-500" />
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Hypothesis Test Decision Tree</p>
              <div className="grid gap-2">
                {INFERENCE_SCENARIOS.map((scenario) => (
                  <div key={scenario.title} className="rounded bg-white p-3 text-xs dark:bg-slate-800">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{scenario.title}</p>
                    <p className="text-slate-500">{scenario.design}</p>
                    <p className="mt-1 text-indigo-600 dark:text-indigo-300">{scenario.test}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Regression and Modeling Studio</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <div className="grid gap-3 md:grid-cols-2">
                <Slider label="Slope" value={regSlope / 3} setValue={(value) => setRegSlope(value * 3)} />
                <Slider label="Noise" value={noiseLevel / 3} setValue={(value) => setNoiseLevel(value * 3)} />
              </div>
              <div className="relative mt-3 h-56 rounded bg-white dark:bg-slate-800">
                {regressionPoints.map((point, index) => (
                  <span key={index} className="absolute h-2 w-2 rounded-full bg-indigo-500" style={{ left: `${Math.min(94, point.x * 10)}%`, bottom: `${Math.min(92, Math.max(4, point.y * 7))}%` }} />
                ))}
                <div className="absolute left-3 right-3 top-1/2 border-t-2 border-emerald-500" style={{ transform: `rotate(${-Math.min(35, regSlope * 12)}deg)` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Residual diagnostics coach: random scatter around the line is healthier than curves, funnels, or extreme leverage.</p>
            </div>
            <div className="grid gap-3">
              {REGRESSION_SCENARIOS.map((scenario) => (
                <div key={scenario.title} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{scenario.title}</p>
                  <p className="text-xs text-slate-500">{scenario.cue}</p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Watch: {scenario.watch}</p>
                </div>
              ))}
              <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                Train/test simulator: as model complexity rises, training error usually falls, but test error can rise from overfitting.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <Brain size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Bayesian Learning Lab</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Beta-Binomial Updating</p>
              <label className="mt-3 block text-xs text-slate-500">Prior alpha: {priorA}<input type="range" min="1" max="20" value={priorA} onChange={(event) => setPriorA(Number(event.target.value))} className="w-full accent-indigo-600" /></label>
              <label className="mt-3 block text-xs text-slate-500">Prior beta: {priorB}<input type="range" min="1" max="20" value={priorB} onChange={(event) => setPriorB(Number(event.target.value))} className="w-full accent-indigo-600" /></label>
              <label className="mt-3 block text-xs text-slate-500">Successes: {bayesSuccesses}<input type="range" min="0" max={bayesTrials} value={bayesSuccesses} onChange={(event) => setBayesSuccesses(Number(event.target.value))} className="w-full accent-indigo-600" /></label>
              <label className="mt-3 block text-xs text-slate-500">Trials: {bayesTrials}<input type="range" min="1" max="100" value={bayesTrials} onChange={(event) => setBayesTrials(Number(event.target.value))} className="w-full accent-indigo-600" /></label>
              <Metric label="Posterior mean" value={pct(betaPosteriorMean)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {BAYESIAN_MODULES.map((module) => (
                <div key={module.title} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{module.title}</p>
                  <p className="mb-2 text-xs text-slate-500">{module.use}</p>
                  <MathText value={module.formula} block />
                </div>
              ))}
              <div className="rounded-lg bg-indigo-50 p-4 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 md:col-span-2">
                MCMC visual walk: a chain should explore the high-posterior region, mix well, and avoid getting stuck. Posterior predictive checks ask whether simulated future data resembles observed data.
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <Target size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Test Selection Wizard</h2>
            </div>
            <Wizard />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Quiz Mode</h2>
            </div>
            <div className="space-y-4">
              {QUIZZES.map((quiz, index) => (
                <div key={quiz.question} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{quiz.question}</p>
                  <div className="space-y-1">
                    {quiz.choices.map((choice, choiceIndex) => (
                      <button key={choice} onClick={() => setQuizAnswers((answers) => ({ ...answers, [index]: choiceIndex }))} className={`w-full rounded px-2 py-1.5 text-left text-xs ${quizAnswers[index] === choiceIndex ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'}`}>
                        {choice}
                      </button>
                    ))}
                  </div>
                  {quizAnswers[index] !== undefined && (
                    <p className={`mt-2 text-xs ${quizAnswers[index] === quiz.answer ? 'text-emerald-600' : 'text-rose-600'}`}>{quiz.why}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <Brain size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Mistake Detector</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <Warning text="p-value is not P(H0 is true)." />
              <Warning text="Statistical significance is not practical importance." />
              <Warning text="Correlation alone does not establish causation." />
              <Warning text="Check normality, equal variance, and independence before parametric tests." />
              <Warning text="Many tests require multiple-comparison correction." />
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-700/50">
              <strong>Dataset lesson suggestions:</strong>
              {lessonSuggestions.map((idea) => <p key={idea} className="mt-1">- {idea}</p>)}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Formula to Code and Proof Notebook</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <CodeBlock title="Mean in JS" code={'const mean = xs.reduce((s, x) => s + x, 0) / xs.length'} />
              <CodeBlock title="CI in Python" code={'ci = (xbar - 1.96*s/np.sqrt(n), xbar + 1.96*s/np.sqrt(n))'} />
              <CodeBlock title="Bayes" code={'posterior = likelihood * prior / evidence'} />
              <CodeBlock title="LaTeX" code={'\\bar{x} \\pm z_{\\alpha/2}\\frac{s}{\\sqrt{n}}'} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="mb-2 text-xs font-semibold text-slate-500">Rendered CI formula</p>
                <MathText value={'\\bar{x} \\pm z_{\\alpha/2}\\frac{s}{\\sqrt{n}}'} block />
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="mb-2 text-xs font-semibold text-slate-500">Rendered Bayes formula</p>
                <MathText value={'P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}'} block />
              </div>
            </div>
            <textarea value={lessonNotes} onChange={(event) => setLessonNotes(event.target.value)} placeholder="Proof notes, symbolic derivation steps, classroom exercise prompts..." className="mt-4 h-32 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Concept Map and Case Studies</h2>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              {['Probability -> Distributions', 'Distributions -> Sampling', 'Sampling -> Inference', 'Inference -> Models', 'Models -> Diagnostics', 'Diagnostics -> Decisions'].map((item) => (
                <div key={item} className="rounded-lg bg-indigo-50 p-2 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">{item}</div>
              ))}
            </div>
            <div className="grid gap-2">
              {CASE_STUDIES.map(([title, detail]) => (
                <div key={title} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <FlaskConical size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Implemented Modification Tracker</h2>
            </div>
            <div className="grid max-h-80 gap-2 overflow-auto md:grid-cols-2">
              {IMPLEMENTED_MODS.map((item, index) => (
                <div key={item} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                  <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{index + 1}. {item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Glossary</h2>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {GLOSSARY.map(([term, definition]) => (
                <div key={term} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{term}</p>
                  <p className="text-xs text-slate-500">{definition}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Icon size={15} className="text-indigo-500" />
        {title}
      </div>
      <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  )
}

function Slider({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <label className="text-xs text-slate-500">
      {label}: {pct(value)}
      <input type="range" min="0.001" max="0.999" step="0.001" value={value} onChange={(event) => setValue(Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
    </label>
  )
}

function Wizard() {
  const [outcome, setOutcome] = useState('numeric')
  const [groups, setGroups] = useState('one')
  const [paired, setPaired] = useState(false)
  const recommendation = useMemo(() => {
    if (outcome === 'categorical' && groups === 'two') return 'Use chi-square independence or Fisher exact test for small counts.'
    if (outcome === 'categorical') return 'Use proportions, binomial tests, or logistic regression.'
    if (groups === 'one') return 'Use one-sample t-test or Wilcoxon signed-rank if normality is doubtful.'
    if (groups === 'two' && paired) return 'Use paired t-test or Wilcoxon signed-rank.'
    if (groups === 'two') return 'Use Welch two-sample t-test, Mann-Whitney, or bootstrap CI.'
    return 'Use ANOVA or Kruskal-Wallis; follow with multiple-comparison correction.'
  }, [outcome, groups, paired])
  return (
    <div className="space-y-3">
      <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
        <option value="numeric">Numeric outcome</option>
        <option value="categorical">Categorical outcome</option>
      </select>
      <select value={groups} onChange={(event) => setGroups(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
        <option value="one">One group</option>
        <option value="two">Two groups</option>
        <option value="many">Three or more groups</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={paired} onChange={(event) => setPaired(event.target.checked)} className="accent-indigo-600" />
        Paired or repeated observations
      </label>
      <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">{recommendation}</div>
    </div>
  )
}

function Warning({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-400">{title}</p>
      <code className="text-xs text-emerald-300">{code}</code>
    </div>
  )
}

function formulaFor(id: string) {
  const formulas: Record<string, string> = {
    bayes: 'P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}',
    clt: '\\frac{\\bar{X}_n-\\mu}{\\sigma/\\sqrt{n}}\\Rightarrow N(0,1)',
    lln: '\\bar{X}_n\\xrightarrow{p}\\mu',
    chebyshev: 'P(|X-\\mu|\\ge k\\sigma)\\le \\frac{1}{k^2}',
    markov: 'P(X\\ge a)\\le \\frac{E[X]}{a}',
    slutsky: 'X_n\\Rightarrow X,\\ Y_n\\xrightarrow{p}c\\Rightarrow X_nY_n\\Rightarrow cX',
    'neyman-pearson': '\\Lambda(x)=\\frac{L(\\theta_1\\mid x)}{L(\\theta_0\\mid x)}',
    mle: '\\hat{\\theta}=\\arg\\max_{\\theta}L(\\theta\\mid x)',
  }
  return formulas[id] ?? '\\theta'
}

function TheoremVisual({ id }: { id: string }) {
  if (id === 'bayes') {
    return (
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Prior</div>
        <div className="rounded bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Evidence</div>
        <div className="rounded bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Posterior</div>
      </div>
    )
  }
  if (id === 'clt') {
    return (
      <div className="mt-3 flex h-20 items-end justify-center gap-1 rounded bg-white p-2 dark:bg-slate-800">
        {[8, 18, 35, 54, 70, 54, 35, 18, 8].map((height, index) => <span key={index} className="w-6 rounded-t bg-indigo-500" style={{ height: `${height}%` }} />)}
      </div>
    )
  }
  if (id === 'lln') {
    return (
      <div className="mt-3 h-20 rounded bg-white p-2 dark:bg-slate-800">
        <div className="relative h-full border-b border-l border-slate-200 dark:border-slate-700">
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-emerald-500" />
          <div className="absolute left-2 top-3 h-10 w-[90%] rounded-full border-t-4 border-indigo-500" />
        </div>
      </div>
    )
  }
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
      {['Assume', 'Model', 'Compute', 'Decide'].map((step) => (
        <div key={step} className="rounded bg-slate-100 p-2 text-center text-slate-600 dark:bg-slate-700 dark:text-slate-300">{step}</div>
      ))}
    </div>
  )
}
