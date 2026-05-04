import { useStore } from '../../store/useStore'
import { Link } from 'react-router-dom'
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  numeric: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  categorical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  date: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  boolean: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  text: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  id: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function formatBytes(value?: number) {
  if (!value) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function PreviewPage() {
  const { activeDataset } = useStore()

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          Upload Data
        </Link>
      </div>
    )
  }

  const preview = activeDataset.data.slice(0, 10)
  const cols = Object.keys(preview[0] || {})
  const metadata = [
    ['File size', formatBytes(activeDataset.fileSize)],
    ['Row count', activeDataset.rows.toLocaleString()],
    ['Schema confidence', `${activeDataset.schemaConfidence ?? 92}%`],
  ]

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{activeDataset.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {activeDataset.rows.toLocaleString()} rows · {activeDataset.cols} columns · {activeDataset.sourceType}
          </p>
        </div>
        <Link
          to="/data/grid"
          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Open in Grid
        </Link>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {metadata.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">{value}</p>
            {label === 'Schema confidence' && <p className="text-xs text-slate-400">{activeDataset.parseDetails ?? 'Detected from values and missingness'}</p>}
          </div>
        ))}
      </div>

      {/* Schema cards */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Column Schema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {activeDataset.schema.map((col) => (
            <div
              key={col.name}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{col.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[col.type]}`}>
                  {col.type}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Unique</span>
                  <span className="font-medium">{col.unique}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing</span>
                  <span className={`font-medium ${col.missingPct > 10 ? 'text-orange-500' : ''}`}>
                    {col.missingPct.toFixed(1)}%
                  </span>
                </div>
                {col.mean !== undefined && (
                  <div className="flex justify-between">
                    <span>Mean</span>
                    <span className="font-medium">{col.mean.toFixed(2)}</span>
                  </div>
                )}
                {col.min !== undefined && (
                  <div className="flex justify-between">
                    <span>Min</span>
                    <span className="font-medium">{typeof col.min === 'number' ? col.min.toFixed(2) : col.min}</span>
                  </div>
                )}
                {col.max !== undefined && (
                  <div className="flex justify-between">
                    <span>Max</span>
                    <span className="font-medium">{typeof col.max === 'number' ? col.max.toFixed(2) : col.max}</span>
                  </div>
                )}
              </div>
              {col.missingPct === 0 ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle size={10} /> No missing
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1 text-xs text-orange-500">
                  <AlertTriangle size={10} /> {col.missing} missing
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Data preview table */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Data Preview (first 10 rows)
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
          <table className="text-xs w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 w-10">#</th>
                {cols.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {preview.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  {cols.map((c) => (
                    <td key={c} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row[c] === null || row[c] === undefined ? (
                        <span className="text-slate-300 italic">null</span>
                      ) : (
                        String(row[c])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
