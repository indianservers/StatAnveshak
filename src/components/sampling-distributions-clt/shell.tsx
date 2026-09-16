import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Beaker, BookOpen, HelpCircle, Pencil } from 'lucide-react'
import {
  CLT_HOME_COPY,
  CLT_STUDIO,
  NEXT_STUDIO_PATH,
  cltLabPath,
  cltStudioPath,
  markCltLabComplete,
  type CltTab,
} from '../../lib/samplingDistributionsClt'
import type { StudioLab } from '../../lib/statisticsStudios'
import { LabHeroArt } from './icons'
import { SamplingDistributionsStudioStyles } from './styles'

export const CLT_TABS: Array<{ id: CltTab; label: string; hint: string; icon: typeof BookOpen }> = [
  { id: 'learn', label: 'Learn', hint: 'Key concepts & visualization', icon: BookOpen },
  { id: 'explore', label: 'Explore', hint: 'Try different settings', icon: Beaker },
  { id: 'practice', label: 'Practice', hint: 'Apply what you learned', icon: Pencil },
  { id: 'quiz', label: 'Quiz', hint: 'Test your understanding', icon: HelpCircle },
]

export function SamplingDistributionsFrame({ children }: { children: ReactNode }) {
  return (
    <main className="clt-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <SamplingDistributionsStudioStyles />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">{children}</div>
    </main>
  )
}

export function SamplingDistributionsLabShell({
  lab,
  index,
  children,
  defaultTab = 'explore',
}: {
  lab: StudioLab
  index: number
  children: (tab: CltTab) => ReactNode
  defaultTab?: CltTab
}) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as CltTab | null
  const tab = CLT_TABS.some((item) => item.id === requested) ? (requested as CltTab) : defaultTab
  const previous = index > 0 ? CLT_STUDIO.labs[index - 1] : undefined
  const next = index < CLT_STUDIO.labs.length - 1 ? CLT_STUDIO.labs[index + 1] : undefined
  const copy = CLT_HOME_COPY[lab.slug]

  useEffect(() => {
    markCltLabComplete(lab.slug)
  }, [lab.slug])

  const setTab = (nextTab: CltTab) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', nextTab)
    setParams(nextParams, { replace: true })
  }

  return (
    <SamplingDistributionsFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={cltStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Sampling Distributions &amp; CLT
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-slate-400">
            Lab {index + 1} of {CLT_STUDIO.labs.length}
          </p>
          <div className="clt-dots" aria-hidden>
            {CLT_STUDIO.labs.map((item, i) => (
              <span key={item.slug} className={`clt-dot ${i <= index ? 'is-on' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Sampling Distributions &amp; CLT
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
        </div>
        <LabHeroArt slug={lab.slug} />
      </header>

      <nav aria-label="Lab modes" className="grid gap-2 sm:grid-cols-4">
        {CLT_TABS.map((item) => {
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
        <div className="clt-mountain pointer-events-none absolute inset-x-24 -top-8 hidden opacity-70 sm:block" />
        {previous ? (
          <Link to={cltLabPath(previous.slug)} className="clt-btn clt-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={cltStudioPath()} className="clt-btn clt-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Previous lab
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">
          Lab {index + 1} of {CLT_STUDIO.labs.length}
        </p>
        {next ? (
          <Link to={cltLabPath(next.slug)} className="clt-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={NEXT_STUDIO_PATH} className="clt-btn">
            Explore Estimation <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </SamplingDistributionsFrame>
  )
}
