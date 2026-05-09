import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Code2, Database, Play, Upload } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { datasetProfile, getDuckDbPackageStatus, runSimpleSelect, type QueryResult } from '../../lib/query'

export function QueryPage() {
  const { activeDataset } = useStore()
  const [query, setQuery] = useState('SELECT * FROM dataset LIMIT 20')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [engineStatus, setEngineStatus] = useState<string>('DuckDB-WASM not loaded yet')
  const profile = useMemo(() => activeDataset ? datasetProfile(activeDataset) : null, [activeDataset])

  if (!activeDataset) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  const runQuery = () => {
    try {
      setResult(runSimpleSelect(activeDataset, query))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed.')
      setResult(null)
    }
  }

  const checkDuckDb = async () => {
    try {
      const status = await getDuckDbPackageStatus()
      setEngineStatus(`DuckDB-WASM loaded: ${status.exports.join(', ')}`)
    } catch (err) {
      setEngineStatus(err instanceof Error ? err.message : 'DuckDB-WASM failed to load')
    }
  }

  const rows = result?.rows ?? profile?.preview ?? []
  const columns = result?.columns ?? profile?.columns ?? []

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Database size={22} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Query Workbench</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Local SELECT previews powered by the browser data frame layer for {activeDataset.name}.
          </p>
        </div>
        <button onClick={checkDuckDb} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Code2 size={14} />
          Check DuckDB-WASM
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Query</span>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-32 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800 outline-none focus:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <button onClick={runQuery} className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            <Play size={15} />
            Run
          </button>
          {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
          {result && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{result.message}</p>}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 text-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Engine Status</h2>
          <p className="text-slate-500 dark:text-slate-400">{engineStatus}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Rows" value={profile?.rows ?? 0} />
            <Metric label="Columns" value={profile?.columns.length ?? 0} />
          </div>
        </aside>
      </div>

      <section className="mt-5 overflow-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>{columns.map((column) => <th key={column} className="px-3 py-2 text-left font-semibold text-slate-500">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{columns.map((column) => <td key={column} className="px-3 py-2 text-slate-700 dark:text-slate-200">{String(row[column] ?? '')}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-700/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{value.toLocaleString()}</p>
    </div>
  )
}
