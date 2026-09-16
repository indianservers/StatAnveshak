import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  BAYES_HOME_COPY,
  BAYES_NEXT_STUDIO,
  BAYES_STUDIO,
  bayesLabPath,
  bayesNextStudioPath,
  loadBayesProgress,
  nextIncompleteBayesLab,
} from '../../lib/bayesianStatistics'
import { BayesianHeroArt, FeatureIcon, LabIcon } from './icons'
import { BayesianFrame } from './shell'

const FEATURES = [
  { icon: 'labs' as const, title: 'Interactive labs', detail: 'Learn by updating' },
  { icon: 'world' as const, title: 'Real-world examples', detail: 'From rates to risk' },
  { icon: 'visual' as const, title: 'Visual simulations', detail: 'See the posterior move' },
  { icon: 'practice' as const, title: 'Practice', detail: 'Build confidence' },
]

export function BayesianStudioHome() {
  const [heroActive, setHeroActive] = useState(false)
  const progress = useMemo(() => loadBayesProgress(), [])
  const done = progress.completed.filter((slug) => BAYES_STUDIO.labs.some((lab) => lab.slug === slug))
  const pct = Math.round((done.length / BAYES_STUDIO.labs.length) * 100)
  const continueLab = nextIncompleteBayesLab(done)

  return (
    <BayesianFrame>
      <section
        className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]"
        onMouseEnter={() => setHeroActive(true)}
        onMouseLeave={() => setHeroActive(false)}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Inference · Studio</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[44px]">
            Bayesian Statistics
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
            Update beliefs with data. Carry a prior as a distribution, reweight it with a likelihood, and read
            conclusions from the posterior — including prediction and uncertainty.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bayes-chip">
                <FeatureIcon name={feature.icon} />
                <span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{feature.title}</span>
                  <span className="block text-[11px] text-slate-400">{feature.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bayes-card p-4">
          <BayesianHeroArt active={heroActive} />
          <p className="bayes-quote mt-3">
            “Bayesian statistics turns data into knowledge and uncertainty into better decisions.”
          </p>
        </div>
      </section>

      <section className="bayes-card flex flex-wrap items-center gap-4 px-5 py-4">
        <div
          className="grid h-14 w-14 place-items-center rounded-full border-[5px] border-slate-100 text-sm font-black text-slate-700 dark:border-slate-800 dark:text-white"
          style={{ background: `conic-gradient(#2563eb ${pct}%, #e2e8f0 0)` }}
          aria-label={`${pct} percent complete`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs dark:bg-slate-900">{pct}%</span>
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {done.length} of {BAYES_STUDIO.labs.length} labs completed
          </p>
          <p className="text-xs text-slate-400">Build Bayesian intuition one update at a time.</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p className="max-w-xs text-xs leading-5 text-slate-400">Prior, likelihood, posterior — then prediction.</p>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Labs in this studio</h2>
          <p className="text-xs font-semibold text-slate-400">{BAYES_STUDIO.labs.length} labs · learn at your own pace</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {BAYES_STUDIO.labs.map((lab, index) => {
            const complete = done.includes(lab.slug)
            return (
              <article key={lab.slug} className="bayes-card bayes-home-card flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-xs font-black text-slate-400 dark:bg-slate-800">
                    {index + 1}
                  </span>
                  {complete && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Done
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-col items-start gap-2">
                  <LabIcon id={lab.slug} />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-black leading-snug text-slate-950 dark:text-white">{lab.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{BAYES_HOME_COPY[lab.slug]?.blurb ?? lab.summary}</p>
                  </div>
                </div>
                <Link to={bayesLabPath(lab.slug)} className="bayes-btn mt-5 w-full">
                  Start lab <ArrowRight size={15} aria-hidden />
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-6 dark:from-slate-900 dark:to-slate-800">
        <div className="bayes-mountain pointer-events-none absolute inset-x-0 bottom-0 opacity-80" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
              Bayesian statistics is a way of thinking, a framework for learning from data, and a tool for decisions
              under uncertainty.
            </p>
            <p className="mt-1 text-xs text-slate-400">Continue with {BAYES_NEXT_STUDIO.title} when you are ready.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={bayesLabPath(continueLab.slug)} className="bayes-btn bayes-btn-ghost">
              Continue learning
            </Link>
            <Link to={bayesNextStudioPath()} className="bayes-btn">
              Go to {BAYES_NEXT_STUDIO.shortTitle} <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
        <p className="bayes-note relative mt-4 text-right">Data today. Better decisions tomorrow.</p>
      </section>
    </BayesianFrame>
  )
}
