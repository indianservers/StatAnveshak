import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Beaker, BookOpen, HelpCircle, Pencil } from 'lucide-react'
import {
  markRvLabComplete,
  RV_HOME_COPY,
  RV_STUDIO,
  rvLabPath,
  rvStudioPath,
  type RvTab,
} from '../../lib/randomVariables'
import type { StudioLab } from '../../lib/statisticsStudios'
import { LabHeroArt } from './icons'
import { RandomVariablesStudioStyles } from './styles'

export const RV_TABS: Array<{ id: RvTab; label: string; hint: string; icon: typeof BookOpen }> = [
  { id: 'learn', label: 'Learn', hint: 'Concepts and intuition', icon: BookOpen },
  { id: 'explore', label: 'Explore', hint: 'Interactive simulations', icon: Beaker },
  { id: 'practice', label: 'Practice', hint: 'Build your skills', icon: Pencil },
  { id: 'quiz', label: 'Quiz', hint: 'Test your understanding', icon: HelpCircle },
]

export function RandomVariablesFrame({ children }: { children: ReactNode }) {
  return (
    <main className="rv-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <RandomVariablesStudioStyles />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">{children}</div>
    </main>
  )
}

export function RandomVariableLabShell({
  lab,
  index,
  children,
  defaultTab = 'learn',
}: {
  lab: StudioLab
  index: number
  children: (tab: RvTab) => ReactNode
  defaultTab?: RvTab
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as RvTab | null
  const tab = RV_TABS.some((item) => item.id === requested) ? (requested as RvTab) : defaultTab
  const previous = index > 0 ? RV_STUDIO.labs[index - 1] : undefined
  const next = index < RV_STUDIO.labs.length - 1 ? RV_STUDIO.labs[index + 1] : undefined
  const progress = ((index + 1) / RV_STUDIO.labs.length) * 100
  const copy = RV_HOME_COPY[lab.slug]

  useEffect(() => {
    if (tab === 'explore' || tab === 'practice' || tab === 'quiz' || tab === 'learn') {
      markRvLabComplete(lab.slug)
    }
  }, [lab.slug, tab])

  const setTab = (nextTab: RvTab) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', nextTab)
    setParams(nextParams, { replace: true })
  }

  return (
    <RandomVariablesFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={rvStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Random Variables
        </Link>
        <p className="text-xs font-semibold text-slate-400">
          Random Variables <span className="mx-1">›</span> Lab {index + 1} of {RV_STUDIO.labs.length}
        </p>
      </div>

      <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Lab {index + 1} of {RV_STUDIO.labs.length}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(copy?.chips ?? lab.concepts).map((chip) => (
              <span key={chip} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <LabHeroArt slug={lab.slug} />
        </div>
      </header>

      <nav aria-label="Lab modes" className="grid gap-2 sm:grid-cols-4">
        {RV_TABS.map((item) => {
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

      <footer className="relative mt-2 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="rv-mountain pointer-events-none absolute inset-x-24 -top-8 hidden opacity-70 sm:block" />
        {previous ? (
          <Link to={rvLabPath(previous.slug)} className="rv-btn rv-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={rvStudioPath()} className="rv-btn rv-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Previous lab
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">Lab {index + 1} of {RV_STUDIO.labs.length}</p>
        {next ? (
          <Link to={rvLabPath(next.slug)} className="rv-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to="/statistics/descriptive-statistics" className="rv-btn">
            Complete studio <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </RandomVariablesFrame>
  )
}
