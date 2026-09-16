import { useMemo, useState, type ReactNode } from 'react'
import {
  Beaker,
  BookOpen,
  Check,
  Copy,
  Lightbulb,
  Play,
  RotateCcw,
  Sigma,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DistChart } from './DistChart'
import { DistHero } from './DistHero'
import { MathText } from '../ui/MathText'
import { getDistributionLesson } from '../../lib/distributionLessons'
import {
  curvePoints,
  DISTRIBUTION_BY_ID,
  generateSamples,
  sanitizeParams,
  type Distribution,
} from '../../lib/distributions'
import { useReducedMotion } from '../visual/useReducedMotion'

const fmt = (value: number, digits = 4) => {
  if (!Number.isFinite(value)) return '—'
  return Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001)
    ? value.toExponential(3)
    : value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function DistributionLesson({
  dist,
  params,
  onParam,
  onReset,
}: {
  dist: Distribution
  params: Record<string, number>
  onParam: (key: string, value: number) => void
  onReset: () => void
}) {
  const lesson = getDistributionLesson(dist.id)
  const reduced = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const [lastLabel, setLastLabel] = useState('Ready')
  const [lastDetail, setLastDetail] = useState('Run the lab to see a live result.')
  const [highlightX, setHighlightX] = useState<number | undefined>()
  const [shade, setShade] = useState<{ lo: number; hi: number } | undefined>()
  const [picked, setPicked] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [x1, setX1] = useState(-1)
  const [x2, setX2] = useState(1)
  const [intervalT, setIntervalT] = useState(1)
  const [threshold, setThreshold] = useState(1)
  const [tail, setTail] = useState<'left' | 'right'>('left')
  const [sims, setSims] = useState(1000)
  const [compareNormal, setCompareNormal] = useState(false)
  const [tailAlpha, setTailAlpha] = useState(0.05)
  const successLabel = 'Success (1)'
  const failureLabel = 'Failure (0)'

  const p = sanitizeParams(dist, params)
  const poissonLambda = dist.id === 'poisson' ? Math.max(0.05, p.lambda * intervalT) : p.lambda
  const chartParams = dist.id === 'poisson' ? { ...p, lambda: poissonLambda } : p
  const overlays = useMemo(() => {
    if (!compareNormal) return []
    const c = curvePoints(DISTRIBUTION_BY_ID.normal, { mu: 0, sigma: 1 }, 'density')
    return [{ x: c.x, y: c.y, color: '#94a3b8', dash: '6 4', label: 'Normal' }]
  }, [compareNormal])

  const meanText = dist.expectedValue(chartParams)
  const varText = dist.variance(chartParams)
  const sdText = (() => {
    const v = Number(varText)
    return Number.isFinite(v) ? fmt(Math.sqrt(Math.max(0, v))) : '—'
  })()

  const copyFormula = async () => {
    await navigator.clipboard.writeText(lesson.formulaLatex)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const runLab = () => {
    if (dist.id === 'bernoulli') {
      const x = generateSamples(dist, p, 1)[0] as number
      setHighlightX(x)
      setLastLabel(x === 1 ? successLabel : failureLabel)
      setLastDetail(`P(X = ${x}) = ${fmt(dist.pdf(x, p))}`)
      return
    }
    if (dist.id === 'binomial') {
      const draws = generateSamples(dist, p, Math.round(sims)).filter((v): v is number => typeof v === 'number')
      const last = draws[draws.length - 1] ?? 0
      setHighlightX(last)
      setLastLabel(`Observed successes = ${last}`)
      setLastDetail(`Out of ${Math.round(p.n)} trials (p = ${fmt(p.p, 2)})`)
      return
    }
    if (dist.id === 'geometric') {
      const draws = generateSamples(dist, p, Math.round(sims)).filter((v): v is number => typeof v === 'number')
      const avg = draws.reduce((s, v) => s + v, 0) / Math.max(1, draws.length)
      const last = draws[draws.length - 1] ?? 1
      setHighlightX(last)
      setLastLabel(`Average number of trials`)
      setLastDetail(`${fmt(avg, 2)} (based on ${Math.round(sims).toLocaleString()} experiments)`)
      return
    }
    if (dist.id === 'poisson') {
      const draws = generateSamples(dist, chartParams, Math.round(sims)).filter((v): v is number => typeof v === 'number')
      const avg = draws.reduce((s, v) => s + v, 0) / Math.max(1, draws.length)
      setHighlightX(Math.round(avg))
      setLastLabel('Mean arrivals')
      setLastDetail(`${fmt(avg, 2)} (theoretical λt = ${fmt(poissonLambda, 2)})`)
      return
    }
    if (dist.id === 'hypergeometric') {
      const x = generateSamples(dist, p, 1)[0] as number
      setHighlightX(x)
      setLastLabel(`X = ${x} successes`)
      setLastDetail(`in a sample of ${Math.round(p.n)} (from N = ${Math.round(p.N)}, K = ${Math.round(p.K)})`)
      return
    }
    if (dist.id === 'normal' || dist.id === 'standard_normal') {
      const lo = Math.min(x1, x2)
      const hi = Math.max(x1, x2)
      const area = Math.max(0, dist.cdf(hi, p) - dist.cdf(lo, p))
      setShade({ lo, hi })
      setLastLabel('Shaded probability')
      setLastDetail(`${fmt(area, 4)} (${fmt(area * 100, 2)}%)`)
      return
    }
    if (dist.id === 'exponential') {
      const t = threshold
      const prob = tail === 'left' ? dist.cdf(t, p) : 1 - dist.cdf(t, p)
      setShade(tail === 'left' ? { lo: 0, hi: t } : { lo: t, hi: dist.range(p)[1] })
      setHighlightX(t)
      setLastLabel(tail === 'left' ? `P(X ≤ ${fmt(t, 2)})` : `P(X > ${fmt(t, 2)})`)
      setLastDetail(`${fmt(prob, 4)} (λ = ${fmt(p.lambda, 2)})`)
      return
    }
    if (dist.id === 'student_t') {
      const crit = dist.inv(1 - tailAlpha / 2, p)
      setShade({ lo: -Math.abs(crit), hi: Math.abs(crit) })
      setLastLabel('Total tail probability')
      setLastDetail(`${fmt(tailAlpha, 4)}  |  P(|T| > ${fmt(crit, 3)}) with ν = ${Math.round(p.df)}`)
      return
    }
    if (dist.id === 'beta') {
      setLastLabel(`Beta(${fmt(p.alpha, 1)}, ${fmt(p.beta, 1)})`)
      setLastDetail(`Mean = ${meanText} · Variance = ${varText}`)
      return
    }
    if (dist.id === 'continuous_uniform') {
      const draws = generateSamples(dist, p, Math.max(1, Math.round(sims / 100))).filter((v): v is number => typeof v === 'number')
      const last = draws[draws.length - 1] ?? (p.a + p.b) / 2
      setHighlightX(last)
      setLastLabel('Last generated value')
      setLastDetail(`${fmt(last, 3)} · a value from U(${fmt(p.a, 2)}, ${fmt(p.b, 2)})`)
      return
    }
    const draws = generateSamples(dist, p, 8).filter((v): v is number => typeof v === 'number')
    const last = draws[draws.length - 1]
    setHighlightX(last)
    setLastLabel('Last draw')
    setLastDetail(last === undefined ? '—' : fmt(last, 4))
  }

  const resetAll = () => {
    onReset()
    setHighlightX(undefined)
    setShade(undefined)
    setLastLabel('Ready')
    setLastDetail('Run the lab to see a live result.')
    setPicked(null)
    setChecked(false)
    setX1(-1)
    setX2(1)
    setIntervalT(1)
    setThreshold(1)
    setCompareNormal(false)
    setTailAlpha(0.05)
    setSims(1000)
  }

  const liveProb = useMemo(() => {
    if (dist.id === 'normal' || dist.id === 'standard_normal') {
      return Math.max(0, dist.cdf(Math.max(x1, x2), p) - dist.cdf(Math.min(x1, x2), p))
    }
    if (dist.family === 'discrete' && highlightX !== undefined) return dist.pdf(Math.round(highlightX), chartParams)
    if (shade) return Math.max(0, dist.cdf(Math.max(shade.lo, shade.hi), chartParams) - dist.cdf(Math.min(shade.lo, shade.hi), chartParams))
    return null
  }, [chartParams, dist, highlightX, p, shade, x1, x2])

  return (
    <div className="dist-lesson mx-auto flex w-full max-w-[1360px] flex-col gap-4 pb-8">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Probability distributions</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">{lesson.title}</h1>
          <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200">{lesson.tagline}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{lesson.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{chip}</span>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 dark:from-slate-900 dark:to-indigo-950">
          <DistHero id={dist.id} />
          <p className="absolute right-4 top-3 max-w-[140px] text-right text-xs font-semibold italic text-indigo-500">{lesson.heroNote}</p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(260px,0.85fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Beaker size={16} /></span>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Interactive Lab</h2>
              <p className="text-xs text-slate-500">{lesson.labBlurb}</p>
            </div>
          </div>
          <div className="space-y-4">
            {dist.params.map((param) => (
              <SliderRow
                key={param.key}
                label={prettyLabel(param.key, param.label)}
                value={p[param.key] ?? param.default}
                min={param.min}
                max={param.max}
                step={param.step}
                onChange={(value) => onParam(param.key, value)}
              />
            ))}
            {dist.id === 'poisson' ? (
              <SliderRow label="Interval length (t)" value={intervalT} min={0.5} max={5} step={0.1} onChange={setIntervalT} />
            ) : null}
            {dist.id === 'normal' || dist.id === 'standard_normal' ? (
              <div className="grid grid-cols-2 gap-3">
                <NumberBox label="From" value={x1} onChange={setX1} />
                <NumberBox label="to" value={x2} onChange={setX2} />
              </div>
            ) : null}
            {dist.id === 'exponential' ? (
              <>
                <SliderRow label="Probability threshold time t" value={threshold} min={0.1} max={6} step={0.05} onChange={setThreshold} />
                <div className="flex gap-2">
                  <Toggle active={tail === 'left'} onClick={() => setTail('left')}>P(X ≤ t)</Toggle>
                  <Toggle active={tail === 'right'} onClick={() => setTail('right')}>P(X &gt; t)</Toggle>
                </div>
              </>
            ) : null}
            {dist.id === 'student_t' ? (
              <>
                <SliderRow label="Tail probability" value={tailAlpha} min={0.001} max={0.2} step={0.001} onChange={setTailAlpha} />
                <p className="text-xs text-slate-500">Critical value |t| ≈ {fmt(dist.inv(1 - tailAlpha / 2, p), 3)}</p>
              </>
            ) : null}
            {['binomial', 'geometric', 'poisson', 'continuous_uniform', 'negative_binomial'].includes(dist.id) ? (
              <SliderRow label={dist.id === 'continuous_uniform' ? 'Sample values' : 'Number of simulations'} value={sims} min={dist.id === 'continuous_uniform' ? 1 : 100} max={dist.id === 'continuous_uniform' ? 40 : 10000} step={dist.id === 'continuous_uniform' ? 1 : 50} onChange={setSims} />
            ) : null}
            {dist.id === 'bernoulli' ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <Toggle active>{successLabel}</Toggle>
                <Toggle active={false}>{failureLabel}</Toggle>
              </div>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={runLab} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700">
              <Play size={15} fill="currentColor" /> {lesson.runLabel}
            </button>
            <button type="button" onClick={resetAll} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
              <RotateCcw size={15} /> Reset
            </button>
            {dist.id === 'student_t' ? (
              <button type="button" onClick={() => { setCompareNormal((v) => !v); runLab() }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-bold text-white">
                Compare with normal
              </button>
            ) : null}
          </div>
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Last result</p>
            <p className={`text-lg font-black text-emerald-800 dark:text-emerald-200 ${reduced ? '' : 'transition-all'}`}>{lastLabel}</p>
            <p className="text-xs text-emerald-800/80">{lastDetail}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Sigma size={16} /></span>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">{lesson.chartKind === 'pmf' ? 'Probability Mass Function (PMF)' : lesson.chartKind === 'pdfcdf' ? 'PDF and CDF' : 'Probability Density Function (PDF)'}</h2>
              <p className="text-xs text-slate-500">{lesson.formulaNote}</p>
            </div>
          </div>
          <div className="h-[230px]">
            <DistChart
              dist={dist}
              params={chartParams}
              mode="density"
              shade={dist.id === 'normal' || dist.id === 'standard_normal' ? { lo: Math.min(x1, x2), hi: Math.max(x1, x2) } : shade}
              highlightX={highlightX}
              overlays={overlays}
            />
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-slate-500">
            {liveProb === null ? `Support ${dist.support}` : `Highlighted probability = ${fmt(liveProb, 4)}`}
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen size={16} /></span>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Formula</h2>
            </div>
            <button type="button" onClick={() => void copyFormula()} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600">
              {copied ? <Check size={14} /> : <Copy size={14} />} Copy
            </button>
          </div>
          <p className="text-xs text-slate-500">{lesson.formulaNote}</p>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-slate-50 px-3 py-4 text-center dark:bg-slate-950">
            <MathText value={lesson.formulaLatex} block />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {lesson.symbols.map((item) => (
              <div key={item.symbol} className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-indigo-600"><MathText value={item.symbol} /></dt>
                <dd className="text-slate-600 dark:text-slate-400">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">How it works</h2>
          <p className="text-xs text-slate-500">A simple, clear process.</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {lesson.steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-xs font-black text-white">{i + 1}</span>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" />
            <h2 className="text-base font-black text-slate-950 dark:text-white">Real-world examples</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {lesson.examples.map((ex) => (
              <article key={ex.title} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{ex.title}</p>
                <p className="text-xs text-slate-500">{ex.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(240px,0.8fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">Key insights</h2>
          <p className="text-xs text-slate-500">Essential properties of the {dist.name} distribution.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {lesson.insights.map((insight) => (
              <article key={insight.title} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">{insight.title}</p>
                {insight.latex ? <div className="mt-1"><MathText value={insight.latex} /></div> : null}
                <p className="mt-1 text-xs text-slate-500">{insight.note}</p>
                {insight.title === 'Mean' ? <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{meanText}</p> : null}
                {insight.title === 'Variance' ? <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{varText}</p> : null}
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">SD ≈ {sdText}</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">Quick practice</h2>
          <p className="text-xs text-slate-500">Test your understanding.</p>
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{lesson.practice.prompt}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {lesson.practice.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => { setPicked(opt.label); setChecked(false) }}
                className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${picked === opt.label ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 dark:border-slate-700'}`}
              >
                <span className="mr-2 text-xs text-slate-400">{opt.label}</span>{opt.text}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setChecked(true)} className="mt-3 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Check answer</button>
          {checked ? (
            <p className={`mt-2 text-sm font-semibold ${picked === lesson.practice.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
              {picked === lesson.practice.correct ? 'Correct.' : 'Not quite.'} {lesson.practice.solution}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">Related distributions</h2>
          <p className="text-xs text-slate-500">Build your knowledge further.</p>
          <div className="mt-3 space-y-2">
            {lesson.related.map((item) => (
              <Link key={item.id} to={`/distributions/${item.id}`} className="block rounded-2xl border border-slate-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500">{item.note}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function prettyLabel(key: string, fallback: string) {
  const map: Record<string, string> = {
    p: 'Success probability (p)',
    n: 'Number of trials (n)',
    lambda: 'Event rate (λ)',
    N: 'Population size (N)',
    K: 'Number of successes (K)',
    a: 'Lower bound a',
    b: 'Upper bound b',
    mu: 'Mean (μ)',
    sigma: 'Standard deviation (σ)',
    alpha: 'α (alpha)',
    beta: 'β (beta)',
    df: 'Degrees of freedom (ν)',
    df1: 'Numerator df',
    df2: 'Denominator df',
    r: 'Target successes (r)',
    shape: 'Shape',
    scale: 'Scale',
  }
  return map[key] ?? fallback
}

function SliderRow({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        <input
          type="number"
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
          value={Number(value.toFixed(4))}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-indigo-600" />
    </label>
  )
}

function NumberBox({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-500">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
    </label>
  )
}

function Toggle({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
      {children}
    </button>
  )
}
