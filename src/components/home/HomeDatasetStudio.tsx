import { useState } from 'react'
import { ArrowRight, Database, FileCheck2, Loader2, Upload } from 'lucide-react'
import { SAMPLE_DATASETS } from '../../lib/sampleData'
import { sampleToDataset } from '../../lib/dataset'
import { saveDataset } from '../../lib/storage'
import { useStore } from '../../store/useStore'
import type { SampleDataset } from '../../types'
import { FOCUS_RING } from '../statistics/studioTheme'
import { HOME_ACTION_CLASS, HomeSection } from './HomeSection'
import { useOpenInAnalyze } from './useOpenInAnalyze'

const POPULAR_IDS = ['student-marks', 'iris-flowers', 'housing-prices', 'customer-churn', 'hospital-readmission', 'city-air-quality', 'campaign-ab-test']
const POPULAR = POPULAR_IDS.map((id) => SAMPLE_DATASETS.find((sample) => sample.id === id)).filter((sample): sample is SampleDataset => Boolean(sample))
const DATASET_COUNT_LABEL = SAMPLE_DATASETS.length >= 10 ? `${Math.floor(SAMPLE_DATASETS.length / 10) * 10}+` : String(SAMPLE_DATASETS.length)

export function HomeDatasetStudio() {
  const { activeDataset, addDataset, setActiveDataset } = useStore()
  const openInAnalyze = useOpenInAnalyze()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const loadSample = async (id: string) => {
    const sample = SAMPLE_DATASETS.find((item) => item.id === id)
    if (!sample) return
    setLoadingId(id)
    try {
      const dataset = sampleToDataset(sample)
      addDataset(dataset)
      setActiveDataset(dataset)
      await saveDataset(dataset)
      openInAnalyze('/data/preview')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <HomeSection
      id="home-datasets-heading"
      icon={Database}
      iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
      title="Dataset Studio"
      description="Explore, upload, or use sample datasets to start your analysis."
      action={(
        <button type="button" onClick={() => openInAnalyze('/data/upload')} className={HOME_ACTION_CLASS}>
          Browse all datasets <ArrowRight size={15} aria-hidden />
        </button>
      )}
    >
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/40 dark:border-slate-800 dark:from-slate-950/60 dark:via-slate-900 dark:to-indigo-950/20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(220px,0.55fr)]">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <DatabaseArt />
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Find the perfect dataset</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Explore {DATASET_COUNT_LABEL} sample datasets across various domains, or upload your own data to get started.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openInAnalyze('/data/upload')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 ${FOCUS_RING}`}
              >
                Browse Datasets <ArrowRight size={15} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => openInAnalyze('/data/upload')}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40 ${FOCUS_RING}`}
              >
                <Upload size={15} aria-hidden /> Upload Your Data
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-5 dark:border-slate-800 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Popular Datasets</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR.map((sample) => {
              const active = activeDataset?.name === sample.name
              const loading = loadingId === sample.id
              return (
                <button
                  key={sample.id}
                  type="button"
                  disabled={loadingId !== null}
                  onClick={() => loadSample(sample.id)}
                  aria-pressed={active}
                  title={sample.description}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition disabled:cursor-wait ${FOCUS_RING} ${
                    active
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {loading && <Loader2 size={12} className="animate-spin" aria-hidden />}
                  {sample.name}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            {activeDataset ? (
              <button type="button" onClick={() => openInAnalyze('/data/preview')} className={`truncate rounded-lg text-left font-semibold text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300 ${FOCUS_RING}`}>
                Loaded: <span className="text-slate-800 dark:text-slate-100">{activeDataset.name}</span> · {activeDataset.rows.toLocaleString()} × {activeDataset.cols}
              </button>
            ) : (
              <span className="font-semibold text-slate-400">Click a dataset to load it instantly.</span>
            )}
            <button type="button" onClick={() => openInAnalyze('/data/upload')} className={`inline-flex items-center gap-1 rounded-lg font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 ${FOCUS_RING}`}>
              View all <ArrowRight size={13} aria-hidden />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 p-5 dark:border-slate-800 lg:border-l lg:border-t-0">
          <div className="flex h-full items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <FileCheck2 size={22} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <div>
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">Supports CSV, Excel, JSON and TXT</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700/80 dark:text-emerald-300/80">Your data stays in your browser.</p>
            </div>
          </div>
        </div>
      </div>
    </HomeSection>
  )
}

function DatabaseArt() {
  return (
    <span aria-hidden className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center sm:mx-0">
      <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/60 dark:to-violet-950/40" />
      <span className="home-pulse absolute inset-6 rounded-full bg-indigo-300/40" />
      <svg viewBox="0 0 64 64" className="home-float relative h-20 w-20">
        <defs>
          <linearGradient id="home-db-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {[38, 26, 14].map((y, i) => (
          <g key={y}>
            <path d={`M12 ${y} v8 a20 6 0 0 0 40 0 v-8`} fill="url(#home-db-side)" opacity={0.85 + i * 0.05} />
            <ellipse cx="32" cy={y} rx="20" ry="6" fill={i === 2 ? '#c7d2fe' : '#a5b4fc'} />
          </g>
        ))}
        <circle cx="52" cy="12" r="2" fill="#34d399" />
        <circle cx="10" cy="20" r="1.5" fill="#f472b6" />
        <path d="M54 30 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z" fill="#fbbf24" />
      </svg>
    </span>
  )
}
