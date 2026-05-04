import { Link } from 'react-router-dom'
import { Upload, BarChart2, Activity, Calculator, BookOpen, Database, Sigma, Star, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'
import { SAMPLE_DATASETS } from '../lib/sampleData'
import { sampleToDataset } from '../lib/dataset'
import { saveDataset } from '../lib/storage'

export function HomePage() {
  const { datasets, setActiveDataset, addDataset, favoriteModules } = useStore()
  const recentPages = JSON.parse(localStorage.getItem('anveshak-recent-pages') ?? '[]') as Array<{ path: string; label: string }>

  const loadSample = async (id: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === id)
    if (!sample) return
    const ds = sampleToDataset(sample)
    addDataset(ds)
    setActiveDataset(ds)
    await saveDataset(ds)
  }

  const QUICK_ACTIONS = [
    { icon: Upload, label: 'Upload Data', to: '/data/upload', color: 'bg-indigo-500', desc: 'CSV, Excel, JSON' },
    { icon: Sigma, label: 'Explore Stats', to: '/explore/summary', color: 'bg-emerald-500', desc: 'Descriptive statistics' },
    { icon: BarChart2, label: 'Create Charts', to: '/explore/charts', color: 'bg-violet-500', desc: 'Interactive visualizations' },
    { icon: Activity, label: 'Distributions', to: '/distributions', color: 'bg-orange-500', desc: 'PDF, CDF, sampling' },
    { icon: Calculator, label: 'Hypothesis Tests', to: '/inference', color: 'bg-rose-500', desc: 't-test, chi-square' },
    { icon: BookOpen, label: 'Teaching Mode', to: '/learn', color: 'bg-sky-500', desc: 'Interactive learning' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Welcome to <span className="text-indigo-600">Anveshak</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          A browser-only statistics & data analytics workbench. Your data never leaves your device.
        </p>
      </div>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {QUICK_ACTIONS.map(({ icon: Icon, label, to, color, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition-all text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
              <span className="text-xs text-slate-400">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500"><Star size={14} /> Pinned Modules</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            {favoriteModules.length ? favoriteModules.slice(0, 6).map((path) => (
              <Link key={path} to={path} className="mr-2 mb-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300">{path}</Link>
            )) : <p className="text-sm text-slate-400">Pin pages from the sidebar to keep them here.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500"><Clock size={14} /> Recent Pages</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            {recentPages.length ? recentPages.slice(0, 6).map((item) => (
              <Link key={item.path} to={item.path} className="mr-2 mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-300">{item.label}</Link>
            )) : <p className="text-sm text-slate-400">Recent pages will appear after you navigate around.</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Datasets */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sample Datasets</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {SAMPLE_DATASETS.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Database size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">{s.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded shrink-0">
                  {s.category}
                </span>
                <button
                  onClick={() => loadSample(s.id)}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-md transition-colors shrink-0"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Datasets */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Loaded Datasets</h2>
          {datasets.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
              <Upload size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No datasets loaded yet</p>
              <Link
                to="/data/upload"
                className="mt-3 inline-block text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Upload your first dataset
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  onClick={() => setActiveDataset(ds)}
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Database size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{ds.name}</p>
                    <p className="text-xs text-slate-400">
                      {ds.rows.toLocaleString()} rows × {ds.cols} columns
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {ds.sourceType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
