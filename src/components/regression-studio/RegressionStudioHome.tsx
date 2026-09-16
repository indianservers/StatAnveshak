import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  REG_HOME_COPY,
  REG_NEXT_STUDIO,
  REG_STUDIO,
  loadRegProgress,
  nextIncompleteRegLab,
  regLabPath,
  regNextStudioPath,
} from '../../lib/regressionStudio'
import { FeatureIcon, LabIcon, RegressionHeroArt } from './icons'
import { RegressionFrame } from './shell'

const FEATURES = [
  { icon: 'labs' as const, title: 'Interactive labs', detail: 'Fit lines by moving points' },
  { icon: 'visual' as const, title: 'Visual learning', detail: 'See residuals and bands' },
  { icon: 'world' as const, title: 'Real examples', detail: 'Study, sales, diagnosis' },
  { icon: 'practice' as const, title: 'Practice', detail: 'Check the reading' },
]

export function RegressionStudioHome() {
  const [heroActive, setHeroActive] = useState(false)
  const progress = useMemo(() => loadRegProgress(), [])
  const done = progress.completed.filter((slug) => REG_STUDIO.labs.some((lab) => lab.slug === slug))
  const pct = Math.round((done.length / REG_STUDIO.labs.length) * 100)
  const continueLab = nextIncompleteRegLab(done)

  return (
    <RegressionFrame>
      <section
        className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]"
        onMouseEnter={() => setHeroActive(true)}
        onMouseLeave={() => setHeroActive(false)}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Modeling · Studio</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[44px]">Regression</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
            Fit a line, read the coefficients, check the residuals, and only then trust the prediction. These labs move from
            simple OLS to intervals, extra predictors, and logistic curves.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="reg-chip">
                <FeatureIcon name={feature.icon} />
                <span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{feature.title}</span>
                  <span className="block text-[11px] text-slate-400">{feature.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <RegressionHeroArt active={heroActive} />
      </section>

      <section className="reg-card flex flex-wrap items-center gap-4 px-5 py-4">
        <div
          className="grid h-14 w-14 place-items-center rounded-full border-[5px] border-slate-100 text-sm font-black text-slate-700 dark:border-slate-800 dark:text-white"
          style={{ background: `conic-gradient(#2563eb ${pct}%, #e2e8f0 0)` }}
          aria-label={`${pct} percent complete`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs dark:bg-slate-900">{pct}%</span>
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {done.length} of {REG_STUDIO.labs.length} labs completed
          </p>
          <p className="text-xs text-slate-400">Build modeling skills one residual at a time.</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p className="max-w-xs text-xs leading-5 text-slate-400">A coefficient is an association. Causation is a separate claim.</p>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Labs in this studio</h2>
          <p className="text-xs font-semibold text-slate-400">{REG_STUDIO.labs.length} labs · learn at your own pace</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REG_STUDIO.labs.map((lab, index) => {
            const complete = done.includes(lab.slug)
            return (
              <article key={lab.slug} className="reg-card reg-home-card flex h-full flex-col p-5">
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
                <p className="mt-1 text-sm leading-5 text-slate-500">{REG_HOME_COPY[lab.slug]?.blurb ?? lab.summary}</p>
                <Link to={regLabPath(lab.slug)} className="reg-btn mt-5 w-full">
                  Start lab <ArrowRight size={15} aria-hidden />
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-6 dark:from-slate-900 dark:to-slate-800">
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Ready for what&apos;s next?</p>
            <p className="mt-1 text-xs text-slate-400">Continue with {REG_NEXT_STUDIO.title} after you can read a fitted line.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={regLabPath(continueLab.slug)} className="reg-btn reg-btn-ghost">
              Continue learning
            </Link>
            <Link to={regNextStudioPath()} className="reg-btn">
              Go to {REG_NEXT_STUDIO.title} <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </RegressionFrame>
  )
}
