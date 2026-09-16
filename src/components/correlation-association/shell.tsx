import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Beaker, BookOpen, HelpCircle, Pencil } from 'lucide-react'
import {
  CA_HOME_COPY,
  CA_NEXT_STUDIO,
  CA_STUDIO,
  caLabPath,
  caNextStudioPath,
  caStudioPath,
  markCaLabComplete,
  type CaTab,
} from '../../lib/correlationAssociation'
import type { StudioLab } from '../../lib/statisticsStudios'
import { LabHeroArt } from './icons'
import { CorrelationStudioStyles } from './styles'

export const CA_TABS: Array<{ id: CaTab; label: string; hint: string; icon: typeof BookOpen }> = [
  { id: 'learn', label: 'Learn', hint: 'Key ideas and formulas', icon: BookOpen },
  { id: 'explore', label: 'Explore', hint: 'Try live controls', icon: Beaker },
  { id: 'practice', label: 'Practice', hint: 'Worked numbers', icon: Pencil },
  { id: 'quiz', label: 'Quiz', hint: 'Check your reading', icon: HelpCircle },
]

export function CorrelationFrame({ children }: { children: ReactNode }) {
  return (
    <main className="corr-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <CorrelationStudioStyles />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">{children}</div>
    </main>
  )
}

function LabNav({ current }: { current?: string }) {
  return (
    <nav className="corr-sidebar corr-card p-3" aria-label="Correlation and Association labs">
      <Link to={caStudioPath()} className="mb-2 block rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Correlation &amp; Association
        <span className="mt-1 block font-semibold normal-case tracking-normal text-slate-400">
          {CA_STUDIO.labs.length} labs · find, quantify, and interpret relationships
        </span>
      </Link>
      {CA_STUDIO.labs.map((lab, index) => (
        <Link key={lab.slug} to={caLabPath(lab.slug)} className={lab.slug === current ? 'is-on' : ''}>
          <span>
            {index + 1}. {lab.title}
            <span className="corr-side-copy">{CA_HOME_COPY[lab.slug]?.sidebar ?? lab.summary}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      ))}
    </nav>
  )
}

export function CorrelationLabShell({
  lab,
  index,
  children,
  defaultTab = 'explore',
}: {
  lab: StudioLab
  index: number
  children: (tab: CaTab) => ReactNode
  defaultTab?: CaTab
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as CaTab | null
  const tab = CA_TABS.some((item) => item.id === requested) ? (requested as CaTab) : defaultTab
  const previous = index > 0 ? CA_STUDIO.labs[index - 1] : undefined
  const next = index < CA_STUDIO.labs.length - 1 ? CA_STUDIO.labs[index + 1] : undefined
  const copy = CA_HOME_COPY[lab.slug]
  const pct = Math.round(((index + 1) / CA_STUDIO.labs.length) * 100)

  useEffect(() => {
    markCaLabComplete(lab.slug)
  }, [lab.slug])

  const setTab = (nextTab: CaTab) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', nextTab)
    setParams(nextParams, { replace: true })
  }

  return (
    <CorrelationFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={caStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Correlation &amp; Association
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-slate-400">
            Lab {index + 1} of {CA_STUDIO.labs.length}
          </p>
          <div className="hidden w-36 sm:block" aria-hidden>
            <div className="h-1.5 rounded-full bg-slate-200">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {next ? (
            <Link to={caLabPath(next.slug)} className="corr-btn">
              Next lab <ArrowRight size={14} aria-hidden />
            </Link>
          ) : (
            <Link to={caNextStudioPath()} className="corr-btn">
              Finish lab <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <LabNav current={lab.slug} />
        <div className="min-w-0 space-y-5">
          <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Correlation &amp; Association
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
            </div>
            <LabHeroArt slug={lab.slug} />
          </header>

          <nav aria-label="Lab modes" className="grid gap-2 sm:grid-cols-4">
            {CA_TABS.map((item) => {
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
        <div className="corr-mountain pointer-events-none absolute inset-x-24 -top-8 hidden opacity-70 sm:block" />
        {previous ? (
          <Link to={caLabPath(previous.slug)} className="corr-btn corr-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={caStudioPath()} className="corr-btn corr-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Studio home
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">
          Lab {index + 1} of {CA_STUDIO.labs.length} · Keep going — one relationship at a time.
        </p>
        {next ? (
          <Link to={caLabPath(next.slug)} className="corr-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={caNextStudioPath()} className="corr-btn">
            Explore {CA_NEXT_STUDIO.title} <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </CorrelationFrame>
  )
}
