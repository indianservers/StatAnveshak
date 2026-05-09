import { Link, useNavigate } from 'react-router-dom'
import { BarChart2, Database, LayoutDashboard, Table2, Upload } from 'lucide-react'
import { useStore } from '../../store/useStore'

type DatasetEmptyStateProps = {
  title?: string
  description?: string
  preferredPath?: string
}

export function DatasetEmptyState({
  title = 'No dataset loaded',
  description = 'Choose an existing dataset, upload a file, or load sample data to start analysis.',
  preferredPath = '/data/preview',
}: DatasetEmptyStateProps) {
  const { datasets, setActiveDataset } = useStore()
  const navigate = useNavigate()
  const recentDatasets = [...datasets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  const openDataset = (dataset: typeof datasets[number], path = preferredPath) => {
    setActiveDataset(dataset)
    navigate(path)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Database size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/data/upload" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Upload size={15} />
            Go to datasets page
          </Link>
          <Link to="/data/upload" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <Database size={15} />
            Load sample data
          </Link>
        </div>

        {recentDatasets.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tap a dataset to load</p>
            <div className="space-y-2">
              {recentDatasets.map((dataset) => (
                <button
                  key={dataset.id}
                  type="button"
                  onClick={() => openDataset(dataset)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Table2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{dataset.name}</p>
                    <p className="text-xs text-slate-400">{dataset.rows.toLocaleString()} rows x {dataset.cols} columns</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">{dataset.sourceType}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {recentDatasets[0] && (
                <>
                  <button type="button" onClick={() => openDataset(recentDatasets[0], '/explore/charts')} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                    <BarChart2 size={14} />
                    Visualize
                  </button>
                  <button type="button" onClick={() => openDataset(recentDatasets[0], '/dashboard')} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                    <LayoutDashboard size={14} />
                    Dashboard
                  </button>
                  <button type="button" onClick={() => openDataset(recentDatasets[0], '/data/grid')} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Table2 size={14} />
                    Data grid
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
