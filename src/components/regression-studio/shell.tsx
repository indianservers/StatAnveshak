import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  REG_HOME_COPY,
  REG_NEXT_STUDIO,
  REG_STUDIO,
  markRegLabComplete,
  regLabPath,
  regNextStudioPath,
  regStudioPath,
} from '../../lib/regressionStudio'
import type { StudioLab } from '../../lib/statisticsStudios'
import { RegressionStudioStyles } from './styles'

export function RegressionFrame({ children }: { children: ReactNode }) {
  return (
    <main className="reg-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <RegressionStudioStyles />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">{children}</div>
    </main>
  )
}

function LabNav({ current }: { current?: string }) {
  return (
    <nav className="reg-sidebar reg-card p-3" aria-label="Regression labs">
      <Link to={regStudioPath()} className="mb-2 block rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Regression Studio
        <span className="mt-1 block font-semibold normal-case tracking-normal text-slate-400">
          {REG_STUDIO.labs.length} labs · model relationships and make predictions
        </span>
      </Link>
      {REG_STUDIO.labs.map((lab, index) => (
        <Link key={lab.slug} to={regLabPath(lab.slug)} className={lab.slug === current ? 'is-on' : ''}>
          <span>
            {index + 1}. {lab.title}
            <span className="reg-side-copy">{REG_HOME_COPY[lab.slug]?.sidebar ?? lab.summary}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      ))}
    </nav>
  )
}

export function RegressionLabShell({
  lab,
  index,
  children,
}: {
  lab: StudioLab
  index: number
  children: ReactNode
}) {
  const previous = index > 0 ? REG_STUDIO.labs[index - 1] : undefined
  const next = index < REG_STUDIO.labs.length - 1 ? REG_STUDIO.labs[index + 1] : undefined
  const copy = REG_HOME_COPY[lab.slug]
  const pct = Math.round(((index + 1) / REG_STUDIO.labs.length) * 100)

  useEffect(() => {
    markRegLabComplete(lab.slug)
  }, [lab.slug])

  return (
    <RegressionFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={regStudioPath()} className="font-semibold text-slate-500 hover:text-blue-600">
          ← Back to Regression
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-slate-400">
            Lab {index + 1} of {REG_STUDIO.labs.length}
          </p>
          <div className="hidden w-36 sm:block" aria-hidden>
            <div className="h-1.5 rounded-full bg-slate-200">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {next ? (
            <Link to={regLabPath(next.slug)} className="reg-btn">
              Next <ArrowRight size={14} aria-hidden />
            </Link>
          ) : (
            <Link to={regNextStudioPath()} className="reg-btn">
              Finish lab <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <LabNav current={lab.slug} />
        <div className="min-w-0 space-y-5">
          <header>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Regression</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
          </header>
          {children}
        </div>
      </div>

      <footer className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Link to={regLabPath(previous.slug)} className="reg-btn reg-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={regStudioPath()} className="reg-btn reg-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Studio home
          </Link>
        )}
        <p className="hidden text-center text-xs text-slate-400 sm:block">Keep going. Build real modeling skills.</p>
        {next ? (
          <Link to={regLabPath(next.slug)} className="reg-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={regNextStudioPath()} className="reg-btn">
            Explore {REG_NEXT_STUDIO.title} <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </RegressionFrame>
  )
}
