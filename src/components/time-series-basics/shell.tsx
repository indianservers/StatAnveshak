import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  TS_HOME_COPY,
  TS_NEXT_STUDIO,
  TS_STUDIO,
  markTsLabComplete,
  tsLabPath,
  tsNextStudioPath,
  tsStudioPath,
} from '../../lib/timeSeriesBasics'
import type { StudioLab } from '../../lib/statisticsStudios'
import { TimeSeriesStudioStyles } from './styles'

export function TimeSeriesFrame({ children }: { children: ReactNode }) {
  return (
    <main className="ts-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <TimeSeriesStudioStyles />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">{children}</div>
    </main>
  )
}

function LabNav({ current }: { current?: string }) {
  return (
    <nav className="ts-sidebar ts-card p-3" aria-label="Time series labs">
      <Link to={tsStudioPath()} className="mb-2 block rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Studio labs ({TS_STUDIO.labs.length})
      </Link>
      {TS_STUDIO.labs.map((lab, index) => (
        <Link key={lab.slug} to={tsLabPath(lab.slug)} className={lab.slug === current ? 'is-on' : ''}>
          <span>
            {index + 1}. {lab.title}
            <span className="ts-side-copy">{TS_HOME_COPY[lab.slug]?.sidebar ?? lab.summary}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}

export function TimeSeriesLabShell({
  lab,
  index,
  children,
}: {
  lab: StudioLab
  index: number
  children: ReactNode
}) {
  const previous = index > 0 ? TS_STUDIO.labs[index - 1] : undefined
  const next = index < TS_STUDIO.labs.length - 1 ? TS_STUDIO.labs[index + 1] : undefined
  const copy = TS_HOME_COPY[lab.slug]

  useEffect(() => {
    markTsLabComplete(lab.slug)
  }, [lab.slug])

  return (
    <TimeSeriesFrame>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Modeling &amp; Prediction · Time Series Basics · {lab.title}
        </p>
        <p className="text-xs font-semibold text-slate-400">
          Lab {index + 1} of {TS_STUDIO.labs.length}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <LabNav current={lab.slug} />
        <div className="relative min-w-0 space-y-5">
          <div className="ts-mountain pointer-events-none absolute inset-x-0 -top-2 hidden opacity-70 sm:block" />
          <header className="relative">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{lab.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-[15px]">{copy?.blurb ?? lab.summary}</p>
          </header>
          {children}
        </div>
      </div>

      <footer className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Link to={tsLabPath(previous.slug)} className="ts-btn ts-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> {previous.title}
          </Link>
        ) : (
          <Link to={tsStudioPath()} className="ts-btn ts-btn-ghost">
            <ArrowLeft size={15} aria-hidden /> Studio home
          </Link>
        )}
        {next ? (
          <Link to={tsLabPath(next.slug)} className="ts-btn">
            {next.title} <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link to={tsNextStudioPath()} className="ts-btn">
            Explore {TS_NEXT_STUDIO.title} <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </footer>
    </TimeSeriesFrame>
  )
}
