import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  CLT_STUDIO,
  NEXT_STUDIO_PATH,
  cltLabPath,
  cltStudioPath,
  markCltLabComplete,
  type CltTab,
} from '../../lib/samplingDistributionsClt'
import type { StudioLab } from '../../lib/statisticsStudios'
import { SamplingDistributionsStudioStyles } from './styles'

const CLT_TABS: CltTab[] = ['learn', 'explore', 'practice', 'quiz']

export function SamplingDistributionsFrame({ children }: { children: ReactNode }) {
  return (
    <main className="clt-studio min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <SamplingDistributionsStudioStyles />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">{children}</div>
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
  const [params] = useSearchParams()
  const requested = params.get('tab') as CltTab | null
  const tab = CLT_TABS.includes(requested as CltTab) ? (requested as CltTab) : defaultTab
  const previous = index > 0 ? CLT_STUDIO.labs[index - 1] : undefined
  const next = index < CLT_STUDIO.labs.length - 1 ? CLT_STUDIO.labs[index + 1] : undefined

  useEffect(() => {
    markCltLabComplete(lab.slug)
  }, [lab.slug])

  return (
    <SamplingDistributionsFrame>
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
