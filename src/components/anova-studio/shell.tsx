import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  ANOVA_HOME_COPY,
  ANOVA_NEXT_STUDIO,
  ANOVA_STUDIO,
  anovaLabPath,
  anovaNextStudioPath,
  anovaStudioPath,
  loadAnovaProgress,
  markAnovaLabComplete,
} from '../../lib/anovaStudio'
import { STUDIOS_ROOT } from '../../lib/statisticsStudios'
import type { StudioLab } from '../../lib/statisticsStudios'
import { AnovaStudioStyles } from './styles'

export function AnovaFrame({ children }: { children: ReactNode }) {
  return (
    <main className="anova-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <AnovaStudioStyles />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">{children}</div>
    </main>
  )
}

export function AnovaSidebar({ current }: { current?: string }) {
  const progress = loadAnovaProgress()
  const done = progress.completed.filter((slug) => ANOVA_STUDIO.labs.some((lab) => lab.slug === slug))
  const pct = Math.round((done.length / ANOVA_STUDIO.labs.length) * 100)

  return (
    <aside className="anova-sidebar space-y-4">
      <nav className="anova-card p-3" aria-label="ANOVA labs">
        <Link to={STUDIOS_ROOT} className="mb-1 !min-h-8 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          ← Back to all studios
        </Link>
        <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Modeling &amp; prediction</p>
        <Link to={anovaStudioPath()} className={!current ? 'is-on' : ''}>
          <span>ANOVA Studio</span>
        </Link>
        {ANOVA_STUDIO.labs.map((lab, index) => (
          <Link key={lab.slug} to={anovaLabPath(lab.slug)} className={lab.slug === current ? 'is-on' : ''}>
            <span>
              {index + 1}. {lab.title}
            </span>
            <span aria-hidden>›</span>
          </Link>
        ))}
      </nav>
      <div className="anova-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Your progress</p>
        <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{pct}%</p>
        <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {done.length} of {ANOVA_STUDIO.labs.length} labs completed
        </p>
      </div>
      <blockquote className="anova-card p-4 text-sm leading-6 text-slate-500">
        “Better questions. Deeper insights. A more data-literate you.”
        <footer className="mt-2 text-[11px] font-bold text-slate-400">— StatAnveshak</footer>
      </blockquote>
    </aside>
  )
}

export function AnovaChrome({ children, current }: { children: ReactNode; current?: string }) {
  return (
    <AnovaFrame>
      <div className="anova-chrome grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <AnovaSidebar current={current} />
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
    </AnovaFrame>
  )
}

export function AnovaLabShell({
  lab,
  index,
  children,
}: {
  lab: StudioLab
  index: number
  children: ReactNode
}) {
  const previous = index > 0 ? ANOVA_STUDIO.labs[index - 1] : undefined
  const next = index < ANOVA_STUDIO.labs.length - 1 ? ANOVA_STUDIO.labs[index + 1] : undefined
  const copy = ANOVA_HOME_COPY[lab.slug]
  const pct = Math.round(((index + 1) / ANOVA_STUDIO.labs.length) * 100)

  useEffect(() => {
    markAnovaLabComplete(lab.slug)
  }, [lab.slug])

  return (
    <AnovaChrome current={lab.slug}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={anovaStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to ANOVA
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-slate-400">
            Lab {index + 1} of {ANOVA_STUDIO.labs.length}
          </p>
          <div className="hidden w-36 sm:block" aria-hidden>
            <div className="h-1.5 rounded-full bg-slate-200">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {next ? (
            <Link to={anovaLabPath(next.slug)} className="anova-btn">
              Next lab <ArrowRight size={14} aria-hidden />
            </Link>
          ) : (
            <Link to={anovaNextStudioPath()} className="anova-btn">
              Finish lab <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">ANOVA Studio</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
      </header>

      {children}

      <footer className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Link to={anovaLabPath(previous.slug)} className="anova-btn anova-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={anovaStudioPath()} className="anova-btn anova-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Studio home
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">Compare groups. Partition variation.</p>
        {next ? (
          <Link to={anovaLabPath(next.slug)} className="anova-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={anovaNextStudioPath()} className="anova-btn">
            Explore {ANOVA_NEXT_STUDIO.title} <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </AnovaChrome>
  )
}
