import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Beaker, BookOpen, HelpCircle, Pencil } from 'lucide-react'
import {
  markPfLabComplete,
  PF_HOME_COPY,
  PF_STUDIO,
  pfLabPath,
  pfStudioPath,
  type PfTab,
} from '../../lib/probabilityFoundations'
import type { StudioLab } from '../../lib/statisticsStudios'
import { LabHeroArt } from './icons'
import { ProbabilityStudioStyles } from './styles'

export const PF_TABS: Array<{ id: PfTab; label: string; hint: string; icon: typeof BookOpen }> = [
  { id: 'learn', label: 'Learn', hint: 'Understand the concept', icon: BookOpen },
  { id: 'explore', label: 'Explore', hint: 'Try it interactively', icon: Beaker },
  { id: 'practice', label: 'Practice', hint: 'Solve problems', icon: Pencil },
  { id: 'quiz', label: 'Quiz', hint: 'Test your knowledge', icon: HelpCircle },
]

export function ProbabilityFrame({ children }: { children: ReactNode }) {
  return (
    <main className="pf-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <ProbabilityStudioStyles />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">{children}</div>
    </main>
  )
}

export function ProbabilityLabShell({
  lab,
  index,
  children,
  defaultTab = 'explore',
  onTab,
}: {
  lab: StudioLab
  index: number
  children: (tab: PfTab) => ReactNode
  defaultTab?: PfTab
  onTab?: (tab: PfTab) => void
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as PfTab | null
  const tab = PF_TABS.some((item) => item.id === requested) ? (requested as PfTab) : defaultTab
  const previous = index > 0 ? PF_STUDIO.labs[index - 1] : undefined
  const next = index < PF_STUDIO.labs.length - 1 ? PF_STUDIO.labs[index + 1] : undefined
  const progress = ((index + 1) / PF_STUDIO.labs.length) * 100
  const copy = PF_HOME_COPY[lab.slug]

  useEffect(() => {
    if (tab === 'explore' || tab === 'practice' || tab === 'quiz') {
      markPfLabComplete(lab.slug)
    }
  }, [lab.slug, tab])

  const setTab = (nextTab: PfTab) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', nextTab)
    setParams(nextParams, { replace: true })
    onTab?.(nextTab)
  }

  return (
    <ProbabilityFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={pfStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Probability Foundations
        </Link>
        <p className="text-xs font-semibold text-slate-400">
          Probability Foundations <span className="mx-1">›</span> {lab.title}
        </p>
      </div>

      <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Lab {index + 1} of {PF_STUDIO.labs.length}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">{lab.summary}</p>
          <div className="mt-4 flex max-w-md items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-400">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="hidden lg:block">
          <LabHeroArt slug={lab.slug} />
          <p className="pf-note mt-2 w-40 text-right">Small experiments. Big insights.</p>
        </div>
      </header>

      <nav aria-label="Lab modes" className="grid gap-2 sm:grid-cols-4">
        {PF_TABS.map((item) => {
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

      {copy && tab === 'learn' && (
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-700 dark:text-slate-200">Try this: </span>
          {copy.tryThis}
        </p>
      )}

      {children(tab)}

      <footer className="relative mt-2 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="pf-mountain pointer-events-none absolute inset-x-24 -top-8 hidden opacity-70 sm:block" />
        {previous ? (
          <Link to={pfLabPath(previous.slug)} className="pf-btn pf-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={pfStudioPath()} className="pf-btn pf-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Back to overview
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">Every roll is a new story.</p>
        {next ? (
          <Link to={pfLabPath(next.slug)} className="pf-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to="/statistics/random-variables" className="pf-btn">
            Next studio <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </ProbabilityFrame>
  )
}

