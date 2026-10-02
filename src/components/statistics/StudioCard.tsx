import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical, Lightbulb } from 'lucide-react'
import { conceptCount, FEATURED_STUDIO, studioPath, type Studio, type StudioAccent, type StudioIconId } from '../../lib/statisticsStudios'
import { StudioIcon } from '../visual/StudioIcons'
import { ACCENTS, FOCUS_RING } from './studioTheme'

type StudioCardViewProps = {
  to: string
  icon: StudioIconId
  accent: StudioAccent
  title: string
  tagline: string
  labs: number
  concepts: number
}

function StudioCardView({ to, icon, accent, title, tagline, labs, concepts }: StudioCardViewProps) {
  const [hovered, setHovered] = useState(false)
  const tokens = ACCENTS[accent]

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${tokens.ring} ${FOCUS_RING}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-16 w-[4.5rem] shrink-0 items-center justify-center rounded-2xl p-2 ${tokens.wash}`}>
          <StudioIcon icon={icon} active={hovered} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black leading-snug text-slate-950 dark:text-white">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{tagline}</span>
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <FlaskConical size={12} aria-hidden />
            {labs} labs
          </span>
          <span className="inline-flex items-center gap-1">
            <Lightbulb size={12} aria-hidden />
            {concepts} concepts
          </span>
        </span>
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-400"
        >
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  )
}

export function StudioCard({ studio }: { studio: Studio }) {
  return (
    <StudioCardView
      to={studioPath(studio)}
      icon={studio.icon}
      accent={studio.accent}
      title={studio.title}
      tagline={studio.tagline}
      labs={studio.labs.length}
      concepts={conceptCount(studio)}
    />
  )
}

export function DistributionsStudioCard() {
  return (
    <StudioCardView
      to={FEATURED_STUDIO.path}
      icon={FEATURED_STUDIO.icon}
      accent="indigo"
      title={FEATURED_STUDIO.title}
      tagline={FEATURED_STUDIO.tagline}
      labs={FEATURED_STUDIO.labCount}
      concepts={FEATURED_STUDIO.conceptCount}
    />
  )
}
