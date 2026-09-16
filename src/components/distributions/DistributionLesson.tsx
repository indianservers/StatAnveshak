import { useState } from 'react'
import { Beaker, BookOpen, Check, Copy, Lightbulb } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DistChart } from './DistChart'
import { DistHero } from './DistHero'
import { DistLessonStyles, DistTabBar, tabFromQuery, type DistTabId } from './DistTabBar'
import { DistSamplePanel } from './DistSamplePanel'
import { PracticeProblems } from './PracticeProblems'
import { ComparePanel } from './labs/ComparePanel'
import { ExperimentHost } from './labs/ExperimentHost'
import { InsightsPanel } from './labs/InsightsPanel'
import { ParameterControls } from './labs/ParameterControls'
import { ProbabilityExplorer } from './labs/ProbabilityExplorer'
import { SampleLab } from './labs/SampleLab'
import { ScenarioPanel } from './labs/ScenarioPanel'
import { LearnExtras } from './LearnExtras'
import { MathText } from '../ui/MathText'
import { EMPIRICAL_PRESETS, getDistributionExperience } from '../../lib/distributionExperiences'
import { getDistributionLearnExtras } from '../../lib/distributionLearnExtras'
import { getDistributionLesson } from '../../lib/distributionLessons'
import { sanitizeParams, type Distribution } from '../../lib/distributions'
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
  const experience = getDistributionExperience(dist.id)
  const reduced = useReducedMotion()
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DistTabId>(() => {
    const fromSearch = new URLSearchParams(location.search).get('tab')
    const fromHash = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('tab')
    return tabFromQuery(fromSearch ?? fromHash)
  })
  const selectTab = (next: DistTabId) => {
    setTab(next)
    navigate({ pathname: location.pathname, search: next === 'learn' ? '' : `?tab=${next}` }, { replace: true })
  }
  const [copied, setCopied] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const p = sanitizeParams(dist, params)
  const meanText = dist.expectedValue(p)
  const varText = dist.variance(p)
  const sdText = (() => {
    const v = Number(varText)
    return Number.isFinite(v) ? fmt(Math.sqrt(Math.max(0, v))) : '—'
  })()

  const copyFormula = async () => {
    await navigator.clipboard.writeText(lesson.formulaLatex)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const labProps = { dist, params: p, onParam, experience, reduced }
  const empiricalData = dist.id === 'empirical' ? EMPIRICAL_PRESETS.exams.values : undefined
  const showGenericShape = dist.id !== 'dirichlet' && dist.id !== 'empirical'

  return (
    <div className="dist-lesson mx-auto flex w-full max-w-[1100px] flex-col gap-3 pb-10 sm:gap-4">
      <DistLessonStyles />
      <header className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Distributions Studio</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">{lesson.title}</h1>
          <p className="mt-1 text-base font-semibold text-slate-700 sm:text-lg dark:text-slate-200">{lesson.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{chip}</span>
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {[['Mean', meanText], ['Variance', varText], ['SD', sdText]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="truncate text-sm font-black text-slate-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={`relative min-h-[148px] overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-3 sm:p-4 dark:from-slate-900 dark:to-indigo-950 ${reduced ? '' : 'dl-hero-on'}`}>
          <DistHero id={dist.id} />
          <p className="absolute right-3 top-2 max-w-[130px] text-right text-[11px] font-semibold italic text-indigo-500 sm:right-4 sm:top-3">{lesson.heroNote}</p>
        </div>
      </header>

      <div className="sticky top-0 z-10 -mx-1 bg-[#f7f8fc]/95 px-1 py-1 backdrop-blur dark:bg-slate-950/90">
        <DistTabBar value={tab} onChange={selectTab} />
      </div>

      <div key={`${dist.id}-${tab}`} id={`dist-panel-${tab}`} role="tabpanel" aria-labelledby={`dist-tab-${tab}`} className="dl-panel">
        {tab === 'learn' ? (
          <div className="grid gap-4">
            <ScenarioPanel experience={experience} />
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-black text-slate-950 dark:text-white">Learn</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{lesson.learn}</p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {lesson.steps.map((step, i) => (
                  <li key={step.title} className="dl-step rounded-2xl bg-slate-50 p-3 dark:bg-slate-950" style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-xs font-black text-white">{i + 1}</span>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.body}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => selectTab('viz')} className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-bold text-white">Open this lab</button>
                <button type="button" onClick={() => selectTab('sample')} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Sample laboratory</button>
              </div>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                <h2 className="text-base font-black text-slate-950 dark:text-white">Why this distribution?</h2>
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
            <LearnExtras extras={getDistributionLearnExtras(dist.id)} />
            <InsightsPanel items={experience.insights} />
            <ComparePanel ids={experience.comparisonIds} />
          </div>
        ) : null}

        {tab === 'viz' ? (
          <div className="grid gap-4">
            <ScenarioPanel experience={experience} />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Beaker size={16} /></span>
                  <div>
                    <h2 className="text-base font-black text-slate-950 dark:text-white">{experience.scenarioTitle}</h2>
                    <p className="text-xs text-slate-500">{experience.learningGoal}</p>
                  </div>
                </div>
                <ParameterControls dist={dist} params={p} onParam={onParam} />
                <button type="button" onClick={onReset} className="mt-4 min-h-11 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Reset parameters</button>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-black text-slate-950 dark:text-white">Interactive experiment</h2>
                <p className="mb-3 text-xs text-slate-500">{experience.datasetLabel} — {experience.datasetHint}</p>
                <ExperimentHost key={dist.id} {...labProps} />
              </section>
            </div>
            <div className={`grid gap-4 ${showGenericShape ? 'xl:grid-cols-2' : ''}`}>
              <ProbabilityExplorer dist={dist} params={p} data={empiricalData} />
              {showGenericShape ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-base font-black text-slate-950 dark:text-white">Shape explorer</h3>
                  <p className="text-xs text-slate-500">Live {dist.family === 'discrete' || dist.id === 'multinomial' ? 'PMF' : 'PDF'} for the current parameters.</p>
                  <div className="mt-3 h-[200px]"><DistChart dist={dist} params={p} data={empiricalData} /></div>
                  <p className="mt-2 text-center text-xs font-semibold text-slate-500">Support {dist.support}</p>
                </section>
              ) : null}
            </div>
            <ComparePanel ids={experience.comparisonIds} />
          </div>
        ) : null}

        {tab === 'sample' ? (
          <div className="grid gap-4">
            <SampleLab key={`${dist.id}-${JSON.stringify(p)}`} dist={dist} params={p} viz={experience.sampleViz} />
            <DistSamplePanel key={`${dist.id}-panel-${JSON.stringify(p)}`} dist={dist} params={p} />
          </div>
        ) : null}

        {tab === 'formulas' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen size={16} /></span>
                  <h2 className="text-base font-black text-slate-950 dark:text-white">Formulas</h2>
                </div>
                <button type="button" onClick={() => void copyFormula()} className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-bold text-slate-500 hover:text-indigo-600">
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
            <InsightsPanel items={experience.insights} />
          </div>
        ) : null}

        {tab === 'practice' ? (
          <div className="grid gap-4">
            <PracticeProblems distId={dist.id} />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-black text-slate-950 dark:text-white">Quick practice</h2>
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{lesson.practice.prompt}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {lesson.practice.options.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => { setPicked(opt.label); setChecked(false) }}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${picked === opt.label ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 dark:border-slate-700'}`}
                    >
                      <span className="mr-2 text-xs text-slate-400">{opt.label}</span>{opt.text}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setChecked(true)} className="mt-3 min-h-11 rounded-full bg-indigo-600 px-4 text-sm font-bold text-white">Check answer</button>
                {checked ? (
                  <p className={`mt-2 text-sm font-semibold ${picked === lesson.practice.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {picked === lesson.practice.correct ? 'Correct.' : 'Not quite.'} {lesson.practice.solution}
                  </p>
                ) : null}
              </section>
              <ComparePanel ids={experience.comparisonIds} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
