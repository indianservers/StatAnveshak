import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { ANALYSIS_BY_ID, JASP_MODULE_ORDER, analysesForModule } from '../../analysis/catalog'
import { useStore } from '../../store/useStore'

const GROUPS = JASP_MODULE_ORDER.map((module) => ({
  module,
  items: analysesForModule(module).filter((item) => item.implemented),
})).filter((group) => group.items.length > 0)

const FEATURED_IDS = [
  'timeSeries.arima',
  'survival.nonparametric',
  'mixed.lmm',
  'sem.sem',
  'meta.analysis',
  'network.psych',
  'ml.regression',
  'qc.charts',
]

const FEATURED = FEATURED_IDS.map((id) => ANALYSIS_BY_ID[id]).filter((item) => item?.implemented)
const ANALYSIS_COUNT = GROUPS.reduce((count, group) => count + group.items.length, 0)

export function AnalysisCatalogSection() {
  const [query, setQuery] = useState('')
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const search = query.trim().toLowerCase()
  const matchingGroups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      !search || `${item.title} ${item.description} ${item.id} ${item.moduleLabel}`.toLowerCase().includes(search),
    ),
  })).filter((group) => group.items.length > 0)

  return (
    <section aria-labelledby="analysis-catalog-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Analyze your data</p>
          <h2 id="analysis-catalog-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Analysis tools</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Explore {ANALYSIS_COUNT} analyses across {GROUPS.length} modules. Choose a method, then run it on your dataset.
          </p>
        </div>
        <Link to="/analysis" onClick={() => setWorkspaceMode('analyze')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40">
          Open analysis workspace <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      {!search && (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Advanced tools</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map((item) => (
              <Link key={item.id} to={`/analysis/${item.id}`} onClick={() => setWorkspaceMode('analyze')} className="group flex min-h-20 flex-col justify-center rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 transition hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-indigo-900 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40">
                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">{item.title}</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.moduleLabel}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">All modules</h3>
        <label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 sm:w-72">
          <Search size={16} aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search methods or modules" aria-label="Search analysis tools" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" />
        </label>
      </div>

      {matchingGroups.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matchingGroups.map((group) => (
            <div key={group.module} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{group.items[0].moduleLabel}</h4>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">{group.items.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link key={item.id} to={`/analysis/${item.id}`} onClick={() => setWorkspaceMode('analyze')} className="group flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300">
                    <span>{item.title}</span><ArrowRight size={14} className="shrink-0 opacity-0 transition group-hover:opacity-100 group-focus:opacity-100" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">No analyses match “{query}”.</p>
      )}
    </section>
  )
}
