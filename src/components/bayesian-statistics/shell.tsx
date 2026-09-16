import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Beaker, BookOpen, HelpCircle, Pencil } from 'lucide-react'
import {
  BAYES_HOME_COPY,
  BAYES_NEXT_STUDIO,
  BAYES_STUDIO,
  bayesLabPath,
  bayesNextStudioPath,
  bayesStudioPath,
  markBayesLabComplete,
  type BayesTab,
} from '../../lib/bayesianStatistics'
import type { StudioLab } from '../../lib/statisticsStudios'
import { LabHeroArt } from './icons'
import { BayesianStudioStyles } from './styles'

export const BAYES_TABS: Array<{ id: BayesTab; label: string; hint: string; icon: typeof BookOpen }> = [
  { id: 'learn', label: 'Learn', hint: 'Key ideas and formulas', icon: BookOpen },
  { id: 'explore', label: 'Interact', hint: 'Try live controls', icon: Beaker },
  { id: 'practice', label: 'Practice', hint: 'Apply the update', icon: Pencil },
  { id: 'quiz', label: 'Quiz', hint: 'Check your reading', icon: HelpCircle },
]

export function BayesianFrame({ children }: { children: ReactNode }) {
  return (
    <main className="bayes-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <BayesianStudioStyles />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">{children}</div>
    </main>
  )
}

function LabNav({ current }: { current?: string }) {
  return (
    <nav className="bayes-sidebar bayes-card p-3" aria-label="Bayesian Statistics labs">
      <Link to={bayesStudioPath()} className="mb-2 block rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Bayesian Statistics · {BAYES_STUDIO.labs.length} labs
      </Link>
      {BAYES_STUDIO.labs.map((lab, index) => (
        <Link key={lab.slug} to={bayesLabPath(lab.slug)} className={lab.slug === current ? 'is-on' : ''}>
          <span>
            {index + 1}. {lab.title}
          </span>
          <span aria-hidden>›</span>
        </Link>
      ))}
    </nav>
  )
}

export function BayesianLabShell({
  lab,
  index,
  children,
  defaultTab = 'explore',
}: {
  lab: StudioLab
  index: number
  children: (tab: BayesTab) => ReactNode
  defaultTab?: BayesTab
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as BayesTab | null
  const tab = BAYES_TABS.some((item) => item.id === requested) ? (requested as BayesTab) : defaultTab
  const previous = index > 0 ? BAYES_STUDIO.labs[index - 1] : undefined
  const next = index < BAYES_STUDIO.labs.length - 1 ? BAYES_STUDIO.labs[index + 1] : undefined
  const copy = BAYES_HOME_COPY[lab.slug]

  useEffect(() => {
    markBayesLabComplete(lab.slug)
  }, [lab.slug])

  const setTab = (nextTab: BayesTab) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', nextTab)
    setParams(nextParams, { replace: true })
  }

  return (
    <BayesianFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={bayesStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Bayesian Statistics
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-slate-400">
            Lab {index + 1} of {BAYES_STUDIO.labs.length}
          </p>
          <div className="flex gap-1" aria-hidden>
            {BAYES_STUDIO.labs.map((item, i) => (
              <span key={item.slug} className={`h-2 w-2 rounded-full ${i <= index ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <LabNav current={lab.slug} />
        <div className="min-w-0 space-y-5">
          <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Bayesian Statistics</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
            </div>
            <LabHeroArt slug={lab.slug} />
          </header>

          <nav aria-label="Lab modes" className="grid gap-2 sm:grid-cols-4">
            {BAYES_TABS.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    active
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-slate-900 dark:ring-blue-900'
                      : 'text-slate-500 hover:bg-white/70 dark:hover:bg-slate-900/60'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={18} aria-hidden />
                  <span>
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="block text-[11px] font-medium text-slate-400">{item.hint}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          {children(tab)}
        </div>
      </div>

      <footer className="relative mt-2 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="bayes-mountain pointer-events-none absolute inset-x-24 -top-8 hidden opacity-70 sm:block" />
        {previous ? (
          <Link to={bayesLabPath(previous.slug)} className="bayes-btn bayes-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={bayesStudioPath()} className="bayes-btn bayes-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Studio home
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">
          Lab {index + 1} of {BAYES_STUDIO.labs.length}
        </p>
        {next ? (
          <Link to={bayesLabPath(next.slug)} className="bayes-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={bayesNextStudioPath()} className="bayes-btn">
            Explore {BAYES_NEXT_STUDIO.shortTitle} <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </BayesianFrame>
  )
}
