import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Beaker, BookOpen, HelpCircle, Pencil } from 'lucide-react'
import {
  markSmLabComplete,
  SM_HOME_COPY,
  SM_NEXT_STUDIO,
  SM_STUDIO,
  smLabPath,
  smNextStudioPath,
  smStudioPath,
  type SmTab,
} from '../../lib/samplingMethods'
import type { StudioLab } from '../../lib/statisticsStudios'
import { LabHeroArt } from './icons'
import { SamplingMethodsStudioStyles } from './styles'

export const SM_TABS: Array<{ id: SmTab; label: string; hint: string; icon: typeof BookOpen }> = [
  { id: 'learn', label: 'Learn', hint: 'Key concepts and visualization', icon: BookOpen },
  { id: 'explore', label: 'Explore', hint: 'Try different samples', icon: Beaker },
  { id: 'practice', label: 'Practice', hint: 'Apply what you learned', icon: Pencil },
  { id: 'quiz', label: 'Quiz', hint: 'Test your understanding', icon: HelpCircle },
]

export function SamplingMethodsFrame({ children }: { children: ReactNode }) {
  return (
    <main className="sm-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <SamplingMethodsStudioStyles />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">{children}</div>
    </main>
  )
}

export function SamplingMethodsLabShell({
  lab,
  index,
  children,
  defaultTab = 'explore',
}: {
  lab: StudioLab
  index: number
  children: (tab: SmTab) => ReactNode
  defaultTab?: SmTab
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as SmTab | null
  const tab = SM_TABS.some((item) => item.id === requested) ? (requested as SmTab) : defaultTab
  const previous = index > 0 ? SM_STUDIO.labs[index - 1] : undefined
  const next = index < SM_STUDIO.labs.length - 1 ? SM_STUDIO.labs[index + 1] : undefined
  const copy = SM_HOME_COPY[lab.slug]

  useEffect(() => {
    markSmLabComplete(lab.slug)
  }, [lab.slug])

  const setTab = (nextTab: SmTab) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', nextTab)
    setParams(nextParams, { replace: true })
  }

  return (
    <SamplingMethodsFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={smStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Sampling Methods
        </Link>
        <p className="text-xs font-semibold text-slate-400">
          Lab {index + 1} of {SM_STUDIO.labs.length}
        </p>
      </div>

      <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Sampling Methods</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
        </div>
        <LabHeroArt slug={lab.slug} />
      </header>

      <nav aria-label="Lab modes" className="grid gap-2 sm:grid-cols-4">
        {SM_TABS.map((item) => {
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
        <div className="sm-mountain pointer-events-none absolute inset-x-24 -top-8 hidden opacity-70 sm:block" />
        {previous ? (
          <Link to={smLabPath(previous.slug)} className="sm-btn sm-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={smStudioPath()} className="sm-btn sm-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Previous lab
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">
          Lab {index + 1} of {SM_STUDIO.labs.length}
        </p>
        {next ? (
          <Link to={smLabPath(next.slug)} className="sm-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={smNextStudioPath()} className="sm-btn">
            Complete Sampling Methods · {SM_NEXT_STUDIO.shortTitle} <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </SamplingMethodsFrame>
  )
}
