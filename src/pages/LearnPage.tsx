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
  RefreshCw,
  Search,
  Sigma,
  Sparkles,
  Target,
} from 'lucide-react'
import { useStore } from '../store/useStore'

type Level = 'beginner' | 'intermediate' | 'advanced'
type LabId = 'clt' | 'lln' | 'bayes' | 'sampling' | 'errors' | 'ci' | 'bootstrap' | 'permutation' | 'anova' | 'mle' | 'bayesian' | 'regression'

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
          </section>
        </div>

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
