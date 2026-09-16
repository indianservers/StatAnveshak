import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  conceptCount,
  getStudio,
  labPath,
  relatedStudios,
  studioPath,
  STUDIO_CATEGORIES,
  STUDIOS_ROOT,
  type Studio,
} from '../../lib/statisticsStudios'
import { ACCENTS, FOCUS_RING, LEVEL_CLASSES, LEVEL_LABELS } from './studioTheme'
import { FeatureMark, LabMark, StudioHeroMark } from './labMarks'
import { StudioIcon, StudioIconStyles } from '../visual/StudioIcons'

const NEXT_STUDIO: Record<string, string> = {
  estimation: 'hypothesis-testing',
  'hypothesis-testing': 'bayesian-statistics',
  'nonparametric-statistics': 'reliability-survival',
  'reliability-survival': 'multivariate-statistics',
  'multivariate-statistics': 'statistical-simulation',
  'statistical-simulation': 'quality-decision-making',
}

const HOME_CSS = `
.sh-home * { box-sizing: border-box; }
.sh-card {
  background: #fff;
  border: 1px solid #e6edf6;
  border-radius: 22px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.045);
}
.dark .sh-card { background: #0f172a; border-color: #1e293b; }
.sh-home-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.sh-home-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(37, 99, 235, 0.1); border-color: #c7d7fb; }
.sh-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  min-height: 42px; padding: 0 1.15rem; border-radius: 999px;
  background: #2563eb; color: #fff; font-weight: 700; font-size: 0.875rem; border: 0;
}
.sh-btn:hover { background: #1d4ed8; }
.sh-chip {
  display: inline-flex; align-items: center; gap: 0.55rem;
  padding: 0.65rem 0.9rem; border-radius: 18px;
  background: #fff; border: 1px solid #e6edf6;
}
.dark .sh-chip { background: #0f172a; border-color: #1e293b; }
@media (prefers-reduced-motion: reduce) {
  .sh-home-card { transition: none; }
}
`

const FEATURES = [
  { icon: 'labs' as const, title: 'Interactive labs', detail: 'Learn by doing' },
  { icon: 'visual' as const, title: 'Visual learning', detail: 'See the idea first' },
  { icon: 'world' as const, title: 'Real examples', detail: 'Tied to real decisions' },
  { icon: 'practice' as const, title: 'Practice', detail: 'Build judgment' },
]

export function StudioHomeScreen({ studio }: { studio: Studio }) {
  const [heroActive, setHeroActive] = useState(false)
  const category = STUDIO_CATEGORIES.find((item) => item.id === studio.category)
  const accent = ACCENTS[studio.accent]
  const related = relatedStudios(studio)
  const nextSlug = NEXT_STUDIO[studio.slug]
  const next = (nextSlug ? getStudio(nextSlug) : undefined) ?? related[0]
  const firstLab = studio.labs[0]
  const concepts = useMemo(() => conceptCount(studio), [studio])

  return (
    <main className="sh-home min-w-0 bg-[#f6f8fc] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <style>{HOME_CSS}</style>
      <StudioIconStyles />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <section
          className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]"
          onMouseEnter={() => setHeroActive(true)}
          onMouseLeave={() => setHeroActive(false)}
        >
          <div>
            {category && (
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{category.title}</p>
            )}
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[44px]">
              {studio.title}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">{studio.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="sh-chip">
                  <FeatureMark name={feature.icon} />
                  <span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{feature.title}</span>
                    <span className="block text-[11px] text-slate-400">{feature.detail}</span>
                  </span>
                </div>
              ))}
            </div>
            {firstLab && (
              <Link to={labPath(studio.slug, firstLab.slug)} className={`sh-btn mt-5 ${FOCUS_RING}`}>
                Start first lab <ArrowRight size={15} aria-hidden />
              </Link>
            )}
          </div>
          <div className={`rounded-[28px] p-4 ${accent.wash}`}>
            <StudioHeroMark slug={studio.slug} active={heroActive} />
          </div>
        </section>

        <section className="sh-card flex flex-wrap items-center gap-4 px-5 py-4">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl text-sm font-black ${accent.chip}`}>
            {studio.labs.length}
          </div>
          <div className="min-w-[180px] flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{studio.labs.length} labs · {concepts} concepts</p>
            <p className="text-xs text-slate-400">{studio.tagline}</p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Labs in this studio</h2>
            <p className="text-xs font-semibold text-slate-400">{studio.labs.length} labs · unique icons for every topic</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studio.labs.map((lab, index) => (
              <article key={lab.slug} className="sh-card sh-home-card flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <LabMark slug={lab.slug} size={72} />
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${LEVEL_CLASSES[lab.level]}`}>
                    {LEVEL_LABELS[lab.level]}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-black text-slate-400">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 text-[15px] font-black leading-snug text-slate-950 dark:text-white">{lab.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">{lab.summary}</p>
                <Link to={labPath(studio.slug, lab.slug)} className="sh-btn mt-5 w-full">
                  Start lab <ArrowRight size={15} aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="sh-card p-5">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Related studios</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} to={studioPath(item)} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:border-indigo-200 dark:border-slate-800">
                <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-50 p-2 dark:bg-slate-800">
                  <StudioIcon icon={item.icon} />
                </span>
                <span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.labs.length} labs</p>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {next && (
              <Link to={studioPath(next)} className="sh-btn">
                Continue to {next.title} <ArrowRight size={15} aria-hidden />
              </Link>
            )}
            <Link to={STUDIOS_ROOT} className="text-sm font-bold text-indigo-600">
              All studios
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
