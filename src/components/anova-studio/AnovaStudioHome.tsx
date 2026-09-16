import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  ANOVA_HOME_COPY,
  ANOVA_NEXT_STUDIO,
  ANOVA_STUDIO,
  anovaLabPath,
  anovaNextStudioPath,
  loadAnovaProgress,
  nextIncompleteAnovaLab,
} from '../../lib/anovaStudio'
import { AnovaHeroArt, AppIcon, FeatureIcon, LabCardArt, LabIcon } from './icons'
import { AnovaChrome } from './shell'

const FEATURES = [
  { icon: 'labs' as const, title: '6 interactive labs', detail: 'From one-way to assumptions' },
  { icon: 'world' as const, title: 'Real-world examples', detail: 'Teaching, plants, scores' },
  { icon: 'steps' as const, title: 'Step-by-step learning', detail: 'Read the table, then the pairs' },
  { icon: 'visual' as const, title: 'Visual simulations', detail: 'Watch F move live' },
]

const APPLICATIONS = [
  { icon: 'education' as const, title: 'Education', detail: 'Compare test scores across teaching methods.' },
  { icon: 'biology' as const, title: 'Biology', detail: 'Analyze growth rates across treatments or species.' },
  { icon: 'manufacturing' as const, title: 'Manufacturing', detail: 'Identify process differences across machines or batches.' },
  { icon: 'marketing' as const, title: 'Marketing', detail: 'Compare campaign effectiveness across channels.' },
  { icon: 'experiments' as const, title: 'Experiments', detail: 'Test the effect of different conditions in a study.' },
]

export function AnovaStudioHome() {
  const [heroActive, setHeroActive] = useState(false)
  const progress = useMemo(() => loadAnovaProgress(), [])
  const done = progress.completed.filter((slug) => ANOVA_STUDIO.labs.some((lab) => lab.slug === slug))
  const continueLab = nextIncompleteAnovaLab(done)

  return (
    <AnovaChrome>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Modeling &amp; prediction</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[44px]">ANOVA</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-slate-500">
            Compare means across groups and discover if differences are statistically significant.
          </p>
        </div>
        <Link to={anovaLabPath(continueLab.slug)} className="anova-btn">
          Continue learning <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <section className="anova-hero grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]" onMouseEnter={() => setHeroActive(true)} onMouseLeave={() => setHeroActive(false)}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500">Turn data into meaningful comparisons</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">More than just averages. Find out what really differs.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Use ANOVA to compare multiple groups, test your hypotheses, and make confident, data-driven decisions.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="anova-chip">
                <FeatureIcon name={feature.icon} />
                <span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{feature.title}</span>
                  <span className="block text-[11px] text-slate-400">{feature.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <AnovaHeroArt active={heroActive} />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Labs in this studio</h2>
          <p className="text-xs font-semibold text-slate-400">Work through the labs in order, or jump to the topic you need.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ANOVA_STUDIO.labs.map((lab, index) => {
            const complete = done.includes(lab.slug)
            return (
              <article key={lab.slug} className="anova-card anova-home-card flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <LabIcon id={lab.slug} />
                  <div className="flex flex-col items-end gap-1">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-xs font-black text-slate-400 dark:bg-slate-800">
                      {index + 1}
                    </span>
                    {complete && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Done
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 text-[15px] font-black leading-snug text-slate-950 dark:text-white">{lab.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">{ANOVA_HOME_COPY[lab.slug]?.blurb ?? lab.summary}</p>
                <div className="mt-3 rounded-2xl bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
                  <LabCardArt id={lab.slug} />
                </div>
                <Link to={anovaLabPath(lab.slug)} className="anova-btn mt-4 w-full">
                  Start lab <ArrowRight size={15} aria-hidden />
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="anova-card p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Real-world applications</h2>
            <p className="text-sm text-slate-500">ANOVA helps you make sense of differences in the world.</p>
          </div>
          <Link to={anovaNextStudioPath()} className="text-sm font-bold text-blue-600">
            Next: {ANOVA_NEXT_STUDIO.title} →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {APPLICATIONS.map((item) => (
            <div key={item.title} className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70">
              <AppIcon name={item.icon} />
              <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </AnovaChrome>
  )
}
