import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical, Lightbulb, Sparkles } from 'lucide-react'
import {
  FEATURED_STUDIO,
  STUDIO_CATEGORIES,
  STUDIOS_ROOT,
  studiosByCategory,
  TOTAL_LAB_COUNT,
  TOTAL_STUDIO_COUNT,
} from '../../lib/statisticsStudios'
import { StudioIcon, StudioIconStyles } from '../visual/StudioIcons'
import { StudioCard } from './StudioCard'
import { FOCUS_RING } from './studioTheme'

/**
 * The complete studio catalogue — featured Distributions Studio plus all four categories.
 *
 * Rendered on the Studios home and on the workspace Home page so the learning section is
 * reachable from either mode without duplicating the card markup.
 */
export function AllStudiosSection() {
  const [featuredHovered, setFeaturedHovered] = useState(false)

  return (
    <section aria-labelledby="all-studios-heading" className="flex flex-col gap-5">
      <StudioIconStyles />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Learn statistics</p>
          <h2 id="all-studios-heading" className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
            Probability &amp; Statistics Studios
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {TOTAL_STUDIO_COUNT} interactive studios and {TOTAL_LAB_COUNT} labs, from fundamentals to advanced topics.
          </p>
        </div>
        <Link
          to={STUDIOS_ROOT}
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${FOCUS_RING}`}
        >
          Open studios home <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/70 p-4 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-violet-950/20">
        <p className="mb-3 inline-flex rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
          Featured studio
        </p>
        <div className="grid items-center gap-4 lg:grid-cols-[120px_minmax(0,1fr)_auto]">
          <span
            onMouseEnter={() => setFeaturedHovered(true)}
            onMouseLeave={() => setFeaturedHovered(false)}
            className="flex h-20 items-center justify-center rounded-xl bg-white/80 p-3 ring-1 ring-indigo-100 dark:bg-slate-900/70 dark:ring-indigo-900"
          >
            <StudioIcon icon={FEATURED_STUDIO.icon} active={featuredHovered} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{FEATURED_STUDIO.title}</h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900">
                Available
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{FEATURED_STUDIO.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <FlaskConical size={13} aria-hidden /> {FEATURED_STUDIO.labCount} labs
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb size={13} aria-hidden /> {FEATURED_STUDIO.conceptCount} concepts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={13} aria-hidden /> {FEATURED_STUDIO.highlight}
              </span>
            </div>
          </div>
          <Link
            to={FEATURED_STUDIO.path}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 lg:justify-self-end ${FOCUS_RING}`}
          >
            Open studio <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>

      {STUDIO_CATEGORIES.map((category) => {
        const studios = studiosByCategory(category.id)
        return (
          <div key={category.id}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">{category.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{category.blurb}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
                {studios.length} studios
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {studios.map((studio) => (
                <StudioCard key={studio.slug} studio={studio} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
