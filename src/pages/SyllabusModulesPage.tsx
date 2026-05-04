import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Calculator, GitBranch, ListChecks, Shapes } from 'lucide-react'
import { SYLLABUS_MODULE_BY_KEY, SYLLABUS_MODULES, type SyllabusModuleKey } from '../lib/syllabusModules'

const ICONS: Record<SyllabusModuleKey, typeof Shapes> = {
  sample_spaces: Shapes,
  conditional_bayes: GitBranch,
  counting: Calculator,
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
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Probability Foundations</p>
        {SYLLABUS_MODULES.map((module) => {
          const Icon = ICONS[module.key]
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

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mb-3 block text-xs text-slate-500">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
    </label>
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
