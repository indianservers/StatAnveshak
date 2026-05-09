import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Binary, Braces, KeyRound, ListOrdered, Network, Search, ShieldCheck } from 'lucide-react'
import { COMPUTING_MODULE_BY_KEY, COMPUTING_MODULES, type ComputingModuleKey } from '../lib/computingModules'

const ICONS: Record<ComputingModuleKey, typeof KeyRound> = {
  cryptography: KeyRound,
  sorting: ListOrdered,
  searching: Search,
  hashing: Binary,
  data_structures: Braces,
  dynamic_programming: Network,
  complexity: ShieldCheck,
}

function parseNumbers(input: string) {
  return input.split(',').map((item) => Number(item.trim())).filter(Number.isFinite)
}

function caesar(text: string, shift: number) {
  return text.replace(/[a-z]/gi, (char) => {
    const base = char >= 'a' && char <= 'z' ? 97 : 65
    return String.fromCharCode(((char.charCodeAt(0) - base + shift + 2600) % 26) + base)
  })
}

function bubbleSort(values: number[]) {
  const arr = [...values]
  const trace: string[] = []
  let comparisons = 0
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      comparisons++
      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        trace.push(`Swap ${arr[j + 1]} and ${arr[j]} -> [${arr.join(', ')}]`)
      }
    }
  }
  return { sorted: arr, comparisons, trace }
}

function linearSearch(values: number[], target: number) {
  const trace: string[] = []
  for (let i = 0; i < values.length; i++) {
    trace.push(`Check index ${i}: ${values[i]}`)
    if (values[i] === target) return { index: i, checks: i + 1, trace }
  }
  return { index: -1, checks: values.length, trace }
}

function binarySearch(values: number[], target: number) {
  const arr = [...values].sort((a, b) => a - b)
  const trace: string[] = []
  let lo = 0
  let hi = arr.length - 1
  let checks = 0
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    checks++
    trace.push(`lo=${lo}, mid=${mid}, hi=${hi}, value=${arr[mid]}`)
    if (arr[mid] === target) return { index: mid, checks, trace, sorted: arr }
    if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return { index: -1, checks, trace, sorted: arr }
}

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function ComputingModulesPage() {
  const { moduleKey } = useParams()
  const navigate = useNavigate()
  const initialKey = COMPUTING_MODULE_BY_KEY[moduleKey as ComputingModuleKey] ? moduleKey as ComputingModuleKey : 'cryptography'
  const [activeKey, setActiveKey] = useState<ComputingModuleKey>(initialKey)
  const module = COMPUTING_MODULE_BY_KEY[activeKey]

  useEffect(() => {
    if (moduleKey && !COMPUTING_MODULE_BY_KEY[moduleKey as ComputingModuleKey]) {
      navigate('/modules', { replace: true })
    }
  }, [moduleKey, navigate])

  const select = (key: ComputingModuleKey) => {
    setActiveKey(key)
    navigate(`/modules/${key}`)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 px-1">
          <h1 className="font-bold text-slate-800 dark:text-white">Computer Science Modules</h1>
          <p className="text-xs text-slate-400">Separate teaching pages for core computing topics.</p>
        </div>
        {COMPUTING_MODULES.map((item) => {
          const Icon = ICONS[item.key]
          return (
            <button
              key={item.key}
              onClick={() => select(item.key)}
              className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                activeKey === item.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={15} />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            </button>
          )
        })}
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 text-xs text-slate-400">
            <Link to="/learn" className="hover:text-indigo-600">Learn</Link> / Modules / {module.title}
          </div>
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{module.title}</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{module.category}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{module.purpose}</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <ModuleDemo activeKey={activeKey} />
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Guide</h2>
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {module.steps.map((step, index) => <li key={step}><strong>Step {index + 1}:</strong> {step}</li>)}
              </ol>
              <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-700 dark:text-slate-200">Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {module.concepts.map((concept) => (
                  <span key={concept} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{concept}</span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function ModuleDemo({ activeKey }: { activeKey: ComputingModuleKey }) {
  const [text, setText] = useState('StatAnveshak teaches data science')
  const [shift, setShift] = useState(3)
  const [numbers, setNumbers] = useState('8, 3, 5, 1, 13, 2, 21')
  const [target, setTarget] = useState('13')
  const [digest, setDigest] = useState('')
  const parsed = useMemo(() => parseNumbers(numbers), [numbers])
  const sorted = useMemo(() => bubbleSort(parsed), [parsed])
  const linear = useMemo(() => linearSearch(parsed, Number(target)), [parsed, target])
  const binary = useMemo(() => binarySearch(parsed, Number(target)), [parsed, target])

  useEffect(() => {
    sha256(text).then(setDigest).catch(() => setDigest('SHA-256 unavailable in this browser context.'))
  }, [text])

  if (activeKey === 'cryptography') {
    const encrypted = caesar(text, shift)
    return (
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">Cryptography Lab</h2>
        <textarea value={text} onChange={(event) => setText(event.target.value)} className="h-24 w-full rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
        <label className="mt-3 block text-xs text-slate-500">Caesar shift: {shift}</label>
        <input type="range" min="1" max="25" value={shift} onChange={(event) => setShift(Number(event.target.value))} className="w-full accent-indigo-600" />
        <ResultGrid rows={[
          ['Ciphertext', encrypted],
          ['Decrypted', caesar(encrypted, -shift)],
          ['SHA-256', digest],
        ]} />
      </div>
    )
  }

  if (activeKey === 'sorting') {
    return (
      <DemoShell title="Sorting Lab" numbers={numbers} setNumbers={setNumbers}>
        <ResultGrid rows={[
          ['Input', `[${parsed.join(', ')}]`],
          ['Bubble sorted', `[${sorted.sorted.join(', ')}]`],
          ['Comparisons', sorted.comparisons],
          ['Trace', sorted.trace.slice(0, 8).join(' | ') || 'Already sorted or too few values.'],
        ]} />
      </DemoShell>
    )
  }

  if (activeKey === 'searching') {
    return (
      <DemoShell title="Searching Lab" numbers={numbers} setNumbers={setNumbers}>
        <label className="mb-3 block text-xs text-slate-500">Target</label>
        <input value={target} onChange={(event) => setTarget(event.target.value)} className="mb-3 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
        <ResultGrid rows={[
          ['Linear index', linear.index],
          ['Linear checks', linear.checks],
          ['Binary sorted input', `[${binary.sorted.join(', ')}]`],
          ['Binary index', binary.index],
          ['Binary checks', binary.checks],
        ]} />
      </DemoShell>
    )
  }

  return (
    <DemoShell title="Interactive Teaching Notes" numbers={numbers} setNumbers={setNumbers}>
      <ResultGrid rows={[
        ['Items', parsed.length],
        ['First value', parsed[0] ?? '-'],
        ['Last value', parsed[parsed.length - 1] ?? '-'],
        ['Use with', 'Compare this page with sorting/searching to discuss structure, growth, and tradeoffs.'],
      ]} />
    </DemoShell>
  )
}

function DemoShell({ title, numbers, setNumbers, children }: { title: string; numbers: string; setNumbers: (value: string) => void; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
      <label className="mb-2 block text-xs text-slate-500">Numbers</label>
      <input value={numbers} onChange={(event) => setNumbers(event.target.value)} className="mb-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
      {children}
    </div>
  )
}

function ResultGrid({ rows }: { rows: Array<[string, string | number]> }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
          <p className="mb-1 text-xs text-slate-400">{label}</p>
          <p className="break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
        </div>
      ))}
    </div>
  )
}
