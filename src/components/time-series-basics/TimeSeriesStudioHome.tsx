import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import {
  TS_HOME_COPY,
  TS_NEXT_STUDIO,
  TS_STUDIO,
  generatePreset,
  nextIncompleteTsLab,
  tsLabPath,
  tsNextStudioPath,
  valuesOf,
} from '../../lib/timeSeriesBasics'
import { DomainIcon, FeatureIcon, LabIcon, TimeSeriesHeroArt } from './icons'
import { Sparkline } from './plots'
import { TimeSeriesFrame } from './shell'

const FEATURES = [
  { icon: 'labs' as const, title: '9 interactive labs', detail: 'Hands-on practice with ordered data' },
  { icon: 'world' as const, title: 'Real-world examples', detail: 'See how a series is used every day' },
  { icon: 'steps' as const, title: 'Step-by-step learning', detail: 'Build skills from plot to model' },
  { icon: 'visual' as const, title: 'Visual simulations', detail: 'Interact, explore, and see how it works' },
]

const DOMAINS = [
  { icon: 'finance' as const, title: 'Finance & investing', detail: 'Prices, returns, and market trends' },
  { icon: 'weather' as const, title: 'Weather & climate', detail: 'Temperature, rainfall, and extremes' },
  { icon: 'retail' as const, title: 'Retail & demand', detail: 'Sales, inventory, and seasonal peaks' },
  { icon: 'sensor' as const, title: 'Sensor monitoring', detail: 'Equipment health and IoT streams' },
  { icon: 'econ' as const, title: 'Economics', detail: 'GDP, inflation, and unemployment' },
]

const SPARK: Record<string, number[]> = {
  'time-plot': [10, 12, 11, 18, 30, 22, 14, 11, 9, 12],
  trend: [6, 8, 7, 11, 12, 16, 15, 19, 21, 24],
  seasonality: [8, 14, 10, 16, 9, 15, 11, 18, 10, 16],
  'moving-average': [8, 18, 6, 20, 9, 17, 10, 16, 11, 15],
  autocorrelation: [4, 6, 8, 7, 12, 11, 16, 15, 20, 18],
  'acf-pacf': [22, 14, 9, 6, 5, 4, 3, 3, 2, 2],
  stationarity: [4, 6, 5, 10, 14, 13, 20, 24, 22, 30],
  'white-noise-random-walk': [12, 7, 14, 6, 13, 8, 15, 7, 12, 9],
  'ar-ma-arima-intuition': [8, 11, 7, 14, 10, 9, 16, 12, 11, 17],
}

export function TimeSeriesStudioHome() {
  const [heroActive, setHeroActive] = useState(false)
  const [overview, setOverview] = useState(false)
  const continueLab = nextIncompleteTsLab([])
  const heroSeries = useMemo(() => valuesOf(generatePreset('trend-season', 48, 5, { amplitude: 6 })), [])

  return (
    <TimeSeriesFrame>
      <section
        className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]"
        onMouseEnter={() => setHeroActive(true)}
        onMouseLeave={() => setHeroActive(false)}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Modeling &amp; Prediction</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[46px]">
            Time Series Basics
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
            Understand data over time. Discover patterns, model behavior, and make better predictions for the future.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={tsLabPath(continueLab.slug)} className="ts-btn">
              Start learning <ArrowRight size={15} aria-hidden />
            </Link>
            <button type="button" className="ts-btn ts-btn-ghost" onClick={() => setOverview((value) => !value)}>
              <Play size={14} aria-hidden /> Watch studio overview
            </button>
          </div>
          {overview && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              A time series is ordered. These labs move from a time plot to trend and season, then memory (ACF/PACF),
              stationarity, and the AR / MA / ARIMA building blocks. Order is information — shuffling the same numbers
              destroys the story.
            </p>
          )}
        </div>
        <TimeSeriesHeroArt active={heroActive} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="ts-chip">
            <FeatureIcon name={feature.icon} />
            <span>
              <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{feature.title}</span>
              <span className="block text-[11px] text-slate-400">{feature.detail}</span>
            </span>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Labs in this studio</h2>
          <Link to={tsLabPath(TS_STUDIO.labs[0].slug)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View lab guide
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TS_STUDIO.labs.map((lab, index) => (
            <Link key={lab.slug} to={tsLabPath(lab.slug)} className="ts-card ts-home-card flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <LabIcon id={lab.slug} />
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-xs font-black text-slate-400 dark:bg-slate-800">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-black leading-snug text-slate-950 dark:text-white">{lab.title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">{TS_HOME_COPY[lab.slug]?.blurb ?? lab.summary}</p>
              <div className="mt-3">
                <Sparkline values={SPARK[lab.slug] ?? heroSeries.slice(0, 10)} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="ts-card p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Where time series is used</h2>
          <p className="text-xs font-semibold text-slate-400">Real data. Real impact.</p>
        </div>
        <p className="mb-4 max-w-2xl text-sm text-slate-500">Time series models help you understand and predict the world around us.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {DOMAINS.map((domain) => (
            <div key={domain.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900">
              <DomainIcon name={domain.icon} />
              <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{domain.title}</p>
              <p className="text-xs leading-5 text-slate-400">{domain.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-6 dark:from-slate-900 dark:to-slate-800">
        <div className="ts-mountain pointer-events-none absolute inset-x-0 bottom-0 opacity-70" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Ready for what&apos;s next?</p>
            <p className="mt-1 text-xs text-slate-400">Continue with {TS_NEXT_STUDIO.title} after you can read order, memory, and stationarity.</p>
          </div>
          <Link to={tsNextStudioPath()} className="ts-btn">
            Go to {TS_NEXT_STUDIO.title} <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>
    </TimeSeriesFrame>
  )
}
