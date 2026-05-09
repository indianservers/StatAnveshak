import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BarChart3, BookOpen, Brain, Calculator, FlaskConical, GitBranch, GraduationCap, ListChecks, Network, Shapes, Sigma } from 'lucide-react'
import { SYLLABUS_MODULE_BY_KEY, SYLLABUS_MODULES, type SyllabusModuleGroup, type SyllabusModuleKey } from '../lib/syllabusModules'

const ICONS: Partial<Record<SyllabusModuleKey, typeof Shapes>> = {
  sample_spaces: Shapes,
  conditional_bayes: GitBranch,
  counting: Calculator,
  distribution_explorer: BarChart3,
  joint_marginal_conditional: Shapes,
  random_variable_simulator: FlaskConical,
  law_large_numbers: Sigma,
  central_limit_theorem: BarChart3,
  bayesian_inference: Brain,
  markov_chains: Network,
  theorem_library: BookOpen,
  proof_intuition: GraduationCap,
  learning_paths: GraduationCap,
  practice_quizzes: ListChecks,
}

const GROUP_COPY: Record<SyllabusModuleGroup, string> = {
  'Probability Foundations': 'Core probability ideas',
  'Probability Labs': 'Interactive probability simulators',
  'Inference & Resampling': 'Modern uncertainty workflows',
  'Design & Experimentation': 'Causal and product experiments',
  'Modeling & Validation': 'Models, forecasts, and validation',
  'Data Quality': 'Missingness, outliers, and influence',
  'Theorems & Learning': 'Proofs, paths, and practice',
  Reporting: 'Interpretation and narration',
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const fmt = (value: number) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '-'
const factorial = (n: number) => {
  if (n < 0 || !Number.isInteger(n)) return NaN
  let out = 1
  for (let i = 2; i <= n; i++) out *= i
  return out
}
const nPr = (n: number, r: number) => factorial(n) / factorial(n - r)
const nCr = (n: number, r: number) => nPr(n, r) / factorial(r)

function parseSet(input: string) {
  return input.split(',').map((item) => item.trim()).filter(Boolean)
}

export function SyllabusModulesPage() {
  const { moduleKey } = useParams()
  const navigate = useNavigate()
  const initial = SYLLABUS_MODULE_BY_KEY[moduleKey as SyllabusModuleKey] ? moduleKey as SyllabusModuleKey : 'sample_spaces'
  const [activeKey, setActiveKey] = useState<SyllabusModuleKey>(initial)
  const active = SYLLABUS_MODULE_BY_KEY[activeKey]
  const grouped = SYLLABUS_MODULES.reduce((acc, module) => {
    acc[module.group] = [...(acc[module.group] ?? []), module]
    return acc
  }, {} as Record<SyllabusModuleGroup, typeof SYLLABUS_MODULES>)

  const select = (key: SyllabusModuleKey) => {
    setActiveKey(key)
    navigate(`/syllabus/${key}`)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 px-1">
          <h1 className="font-bold text-slate-800 dark:text-white">Syllabus Modules</h1>
          <p className="text-xs text-slate-400">UG/PG statistics syllabus coverage, built one topic at a time.</p>
        </div>
        {(Object.entries(grouped) as [SyllabusModuleGroup, typeof SYLLABUS_MODULES][]).map(([group, modules]) => (
          <div key={group} className="mb-4">
            <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
            <p className="mb-2 px-1 text-[11px] text-slate-400">{GROUP_COPY[group]}</p>
            {modules.map((module) => {
              const Icon = ICONS[module.key] ?? Sigma
              return (
                <button
                  key={module.key}
                  onClick={() => select(module.key)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                    activeKey === module.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={15} />
                  <span className="min-w-0 flex-1 truncate">{module.title}</span>
                </button>
              )
            })}
          </div>
        ))}
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-xs text-slate-400">
            <Link to="/learn" className="hover:text-indigo-600">Learn</Link> / Syllabus / {active.title}
          </div>
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{active.title}</h1>
              {active.syllabusTags.map((tag) => (
                <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{tag}</span>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{active.purpose}</p>
          </div>

          {activeKey === 'sample_spaces' && <SampleSpacesModule />}
          {activeKey === 'conditional_bayes' && <ConditionalBayesModule />}
          {activeKey === 'counting' && <CountingModule />}
          {activeKey !== 'sample_spaces' && activeKey !== 'conditional_bayes' && activeKey !== 'counting' && <SuiteModuleView moduleKey={activeKey} />}
        </div>
      </main>
    </div>
  )
}

function SampleSpacesModule() {
  const [universeText, setUniverseText] = useState('HH, HT, TH, TT')
  const [eventAText, setEventAText] = useState('HH, HT')
  const [eventBText, setEventBText] = useState('HH, TH')
  const calc = useMemo(() => {
    const universe = [...new Set(parseSet(universeText))]
    const uSet = new Set(universe)
    const a = [...new Set(parseSet(eventAText).filter((item) => uSet.has(item)))]
    const b = [...new Set(parseSet(eventBText).filter((item) => uSet.has(item)))]
    const aSet = new Set(a)
    const bSet = new Set(b)
    const union = universe.filter((item) => aSet.has(item) || bSet.has(item))
    const intersection = universe.filter((item) => aSet.has(item) && bSet.has(item))
    const complementA = universe.filter((item) => !aSet.has(item))
    const p = (count: number) => universe.length ? count / universe.length : NaN
    return { universe, a, b, union, intersection, complementA, p }
  }, [universeText, eventAText, eventBText])

  return (
    <ModuleShell guide={[
      'Step 1: Enter the sample space S as comma-separated equally likely outcomes.',
      'Step 2: Enter event A and event B using outcomes from S.',
      'Step 3: Check A union B, A intersection B, and A complement.',
      'Step 4: Compare counts with probabilities: probability = favorable outcomes / total outcomes.',
    ]}>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Event Calculator</h2>
          <Input label="Sample space S" value={universeText} onChange={setUniverseText} />
          <Input label="Event A" value={eventAText} onChange={setEventAText} />
          <Input label="Event B" value={eventBText} onChange={setEventBText} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Results</h2>
          <ResultGrid rows={[
            ['|S|', calc.universe.length],
            ['A union B', `{${calc.union.join(', ')}}`],
            ['A intersection B', `{${calc.intersection.join(', ')}}`],
            ['A complement', `{${calc.complementA.join(', ')}}`],
            ['P(A)', fmt(calc.p(calc.a.length))],
            ['P(B)', fmt(calc.p(calc.b.length))],
            ['P(A union B)', fmt(calc.p(calc.union.length))],
            ['P(A intersection B)', fmt(calc.p(calc.intersection.length))],
          ]} />
        </section>
      </div>
    </ModuleShell>
  )
}

function ConditionalBayesModule() {
  const [pA, setPA] = useState(0.01)
  const [pBGivenA, setPBGivenA] = useState(0.95)
  const [pBGivenNotA, setPBGivenNotA] = useState(0.08)
  const pNotA = 1 - pA
  const pB = pBGivenA * pA + pBGivenNotA * pNotA
  const pAGivenB = pB > 0 ? pBGivenA * pA / pB : NaN
  const pNotAGivenB = pB > 0 ? pBGivenNotA * pNotA / pB : NaN

  return (
    <ModuleShell guide={[
      'Step 1: Enter the prior probability P(A).',
      'Step 2: Enter the likelihood P(B|A).',
      'Step 3: Enter the false-positive/background rate P(B|not A).',
      'Step 4: Use total probability to compute P(B), then Bayes theorem to compute P(A|B).',
    ]}>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Bayes Inputs</h2>
          <NumberInput label="P(A)" value={pA} onChange={setPA} />
          <NumberInput label="P(B | A)" value={pBGivenA} onChange={setPBGivenA} />
          <NumberInput label="P(B | not A)" value={pBGivenNotA} onChange={setPBGivenNotA} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Computed Probabilities</h2>
          <ResultGrid rows={[
            ['P(not A)', fmt(pNotA)],
            ['P(B)', fmt(pB)],
            ['P(A and B)', fmt(pA * pBGivenA)],
            ['P(not A and B)', fmt(pNotA * pBGivenNotA)],
            ['P(A | B)', fmt(pAGivenB)],
            ['P(not A | B)', fmt(pNotAGivenB)],
          ]} />
          <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
            Formula: P(A|B) = P(B|A)P(A) / [P(B|A)P(A) + P(B|not A)P(not A)].
          </div>
        </section>
      </div>
    </ModuleShell>
  )
}

function CountingModule() {
  const [n, setN] = useState(10)
  const [r, setR] = useState(3)
  const [groupsText, setGroupsText] = useState('2, 3, 5')
  const groups = groupsText.split(',').map((item) => Number(item.trim())).filter((value) => Number.isInteger(value) && value >= 0)
  const totalGroups = groups.reduce((sum, value) => sum + value, 0)
  const multinomial = totalGroups ? factorial(totalGroups) / groups.reduce((prod, value) => prod * factorial(value), 1) : NaN

  return (
    <ModuleShell guide={[
      'Step 1: Use permutations when order matters.',
      'Step 2: Use combinations when order does not matter.',
      'Step 3: Use arrangements with repetition when each draw has n choices and repeats are allowed.',
      'Step 4: Use multinomial counts when arranging repeated category labels.',
    ]}>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Counting Inputs</h2>
          <NumberInput label="n total items" value={n} onChange={(value) => setN(Math.max(0, Math.round(value)))} max={170} />
          <NumberInput label="r selected/arranged" value={r} onChange={(value) => setR(Math.max(0, Math.round(value)))} max={170} />
          <Input label="Repeated category counts for multinomial" value={groupsText} onChange={setGroupsText} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Results</h2>
          <ResultGrid rows={[
            ['n!', fmt(factorial(n))],
            ['Permutation nPr', r <= n ? fmt(nPr(n, r)) : 'r must be <= n'],
            ['Combination nCr', r <= n ? fmt(nCr(n, r)) : 'r must be <= n'],
            ['With repetition n^r', fmt(n ** r)],
            ['Multinomial total', totalGroups],
            ['Multinomial count', fmt(multinomial)],
          ]} />
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
            nPr = n!/(n-r)!; nCr = n!/[r!(n-r)!]; multinomial = n!/(n1! n2! ... nk!).
          </div>
        </section>
      </div>
    </ModuleShell>
  )
}

function SuiteModuleView({ moduleKey }: { moduleKey: SyllabusModuleKey }) {
  const module = SYLLABUS_MODULE_BY_KEY[moduleKey]
  const [a, setA] = useState(0.55)
  const [b, setB] = useState(0.35)
  const [n, setN] = useState(40)
  const [x, setX] = useState(18)
  const [rate, setRate] = useState(3)
  const [trials, setTrials] = useState(1000)

  const worked = useMemo<Array<[string, string | number]>>(() => {
    const p = clamp01(a)
    const q = clamp01(b)
    const nn = Math.max(1, Math.round(n))
    const xx = Math.max(0, Math.min(nn, Math.round(x)))
    const lambda = Math.max(0.001, rate)
    const mcSe = Math.sqrt(p * (1 - p) / Math.max(1, trials))
    const betaMean = (2 + xx) / (2 + 2 + nn)
    const lift = p > 0 ? (q - p) / p : NaN
    const poissonMean = lambda
    const waitMoreThanOne = Math.exp(-lambda)
    const markovA = p * a + (1 - p) * b
    const moduleRows: Partial<Record<SyllabusModuleKey, Array<[string, string | number]>>> = {
      distribution_explorer: [['Bernoulli mean', fmt(p)], ['Bernoulli variance', fmt(p * (1 - p))], ['Binomial mean', fmt(nn * p)], ['Binomial SD', fmt(Math.sqrt(nn * p * (1 - p)))]],
      joint_marginal_conditional: [['P(X=1,Y=1)', fmt(p * q)], ['P(X=1)', fmt(p)], ['P(Y=1)', fmt(q)], ['Independent?', 'yes when joint = marginal product']],
      random_variable_simulator: [['Sample size', nn], ['Expected successes', fmt(nn * p)], ['Expected failures', fmt(nn * (1 - p))], ['Empirical target', 'compare generated mean to theory']],
      law_large_numbers: [['Trial probability', fmt(p)], ['Expected heads after n', fmt(nn * p)], ['Running mean target', fmt(p)], ['Variance of mean', fmt(p * (1 - p) / nn)]],
      central_limit_theorem: [['Parent p/skew control', fmt(p)], ['Sample size', nn], ['Standard error', fmt(Math.sqrt(p * (1 - p) / nn))], ['Shape expectation', nn >= 30 ? 'normal-like' : 'still rough']],
      bayesian_inference: [['Prior', 'Beta(2, 2)'], ['Posterior alpha', 2 + xx], ['Posterior beta', 2 + nn - xx], ['Posterior mean', fmt(betaMean)]],
      markov_chains: [['P(stay A)', fmt(a)], ['P(B to A)', fmt(b)], ['Next P(A)', fmt(markovA)], ['Steady P(A)', fmt(b / (1 - a + b))]],
      poisson_process: [['Rate lambda', fmt(lambda)], ['Expected count', fmt(poissonMean)], ['P(wait > 1)', fmt(waitMoreThanOne)], ['P(no arrivals in 1)', fmt(waitMoreThanOne)]],
      monte_carlo: [['Trials', trials], ['Estimated probability', fmt(p)], ['Approx MC SE', fmt(mcSe)], ['95% simulation error', `+/- ${fmt(1.96 * mcSe)}`]],
      bootstrap_lab: [['Original n', nn], ['Bootstrap resample n', nn], ['Example mean', fmt(p)], ['Percentile CI idea', '2.5% to 97.5% bootstrap quantiles']],
      permutation_tests: [['Group A mean', fmt(p)], ['Group B mean', fmt(q)], ['Observed difference', fmt(q - p)], ['Null action', 'shuffle labels many times']],
      resampling_comparison: [['Parametric focus', 'model-based SE'], ['Bootstrap focus', 'uncertainty interval'], ['Permutation focus', 'null label exchange'], ['Use together?', 'yes for teaching contrast']],
      experimental_design: [['Factor A levels', Math.max(2, Math.round(a * 10))], ['Factor B levels', Math.max(2, Math.round(b * 10))], ['Cells', Math.max(2, Math.round(a * 10)) * Math.max(2, Math.round(b * 10))], ['Core rule', 'randomize before comparing']],
      ab_testing: [['Control rate', fmt(p)], ['Variant rate', fmt(q)], ['Absolute lift', fmt(q - p)], ['Relative lift', fmt(lift)]],
      survival_analysis: [['At risk', nn], ['Events', xx], ['One-step survival', fmt(1 - xx / nn)], ['Censoring note', 'censored rows stay in risk set until censor time']],
      advanced_time_series: [['Lag-1 phi', fmt(2 * p - 1)], ['Forecast horizon', Math.max(1, Math.round(b * 12))], ['Stationarity cue', Math.abs(2 * p - 1) < 1 ? 'stable AR(1)' : 'unstable'], ['Backtest', 'compare forecast error on held-out tail']],
      multivariate_statistics: [['Variables', Math.max(2, Math.round(a * 10))], ['Outcomes', Math.max(2, Math.round(b * 6))], ['Core object', 'covariance matrix'], ['Watch', 'scale and collinearity']],
      model_selection_validation: [['Train percent', `${Math.round(p * 100)}%`], ['Test percent', `${Math.round((1 - p) * 100)}%`], ['AIC penalty per parameter', 2], ['CV folds', Math.max(2, Math.round(b * 10))]],
      missing_data: [['Missing percent', `${Math.round(p * 100)}%`], ['Complete percent', `${Math.round((1 - p) * 100)}%`], ['Likely first step', p > 0.2 ? 'diagnose before modeling' : 'document and handle'], ['Sensitivity analysis', 'compare methods']],
      outlier_influence: [['Q1', fmt(p)], ['Q3', fmt(q + 0.5)], ['IQR', fmt(q + 0.5 - p)], ['Upper fence', fmt(q + 0.5 + 1.5 * (q + 0.5 - p))]],
      theorem_library: [['Theorems indexed', 12], ['Card fields', 'statement, assumptions, intuition, use'], ['Core warning', 'assumptions matter'], ['Best habit', 'connect theorem to a lab']],
      proof_intuition: [['Proof layers', 4], ['Mode 1', 'plain intuition'], ['Mode 2', 'formal sketch'], ['Mode 3', 'counterexample']],
      learning_paths: [['Beginner path', 'probability -> EDA -> inference'], ['Analyst path', 'data -> tests -> reports'], ['Research path', 'proofs -> models -> validation'], ['Exam path', 'formula drills + quizzes']],
      practice_quizzes: [['Question types', 'MCQ, numeric, interpretation'], ['Hint stages', 3], ['Mastery target', 'repeat missed concepts'], ['Feedback', 'why answer is right/wrong']],
      report_narration: [['Result', 'what changed'], ['Magnitude', 'how much'], ['Uncertainty', 'CI or posterior range'], ['Caveat', 'assumption and design limits']],
    }
    return moduleRows[moduleKey] ?? [['Status', 'Ready'], ['Inputs', 'Use sliders'], ['Output', 'Guided module'], ['Next', 'Open Learn for deeper labs']]
  }, [a, b, n, x, rate, trials, moduleKey])

  return (
    <ModuleShell guide={[
      `Start with the purpose: ${module.purpose}`,
      'Review the core concepts and formulas before using the worked panel.',
      'Change the controls and ask which quantity moved, which stayed fixed, and why.',
      'Close the loop by writing a one-sentence interpretation in reporting language.',
    ]}>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Interactive Controls</h2>
          <RangeInput label="Probability / split A" value={a} onChange={setA} />
          <RangeInput label="Probability / split B" value={b} onChange={setB} />
          <NumberInput label="n / sample size" value={n} onChange={(value) => setN(Math.max(1, Math.round(value)))} max={10000} />
          <NumberInput label="x / successes or events" value={x} onChange={(value) => setX(Math.max(0, Math.round(value)))} max={10000} />
          <NumberInput label="Rate lambda" value={rate} onChange={setRate} max={100} />
          <NumberInput label="Simulation trials" value={trials} onChange={(value) => setTrials(Math.max(10, Math.round(value)))} max={100000} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Worked Module Panel</h2>
          <ResultGrid rows={worked} />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <InfoList title="Concepts" items={module.concepts} />
            <InfoList title="Formulas" items={module.formulas} />
            <InfoList title="Kit Pieces" items={module.kit} />
          </div>
        </section>
      </div>
    </ModuleShell>
  )
}

function ModuleShell({ guide, children }: { guide: string[]; children: ReactNode }) {
  return (
    <div className="space-y-5">
      {children}
      <details className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <ListChecks size={16} className="text-indigo-500" />
          Teaching Guide
        </summary>
        <ol className="space-y-2 border-t border-slate-100 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {guide.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </details>
    </div>
  )
}

function RangeInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="mb-3 block text-xs text-slate-500">
      {label}: {fmt(value)}
      <input type="range" min="0.001" max="0.999" step="0.001" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
    </label>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mb-3 block text-xs text-slate-500">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
    </label>
  )
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NumberInput({ label, value, onChange, max = 1 }: { label: string; value: number; onChange: (value: number) => void; max?: number }) {
  return (
    <label className="mb-3 block text-xs text-slate-500">
      {label}
      <input type="number" min="0" max={max} step={max === 1 ? 0.01 : 1} value={value} onChange={(event) => onChange(max === 1 ? clamp01(Number(event.target.value)) : Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
    </label>
  )
}

function ResultGrid({ rows }: { rows: Array<[string, string | number]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
          <p className="mb-1 text-xs text-slate-400">{label}</p>
          <p className="break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
        </div>
      ))}
    </div>
  )
}
