import { useEffect, useMemo, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { datasetKpis, numericColumn, numericDescriptiveRows, summaryStats } from '../lib/stats'
import { BarChart3, Gauge } from 'lucide-react'
import { DatasetEmptyState } from '../components/ui/DatasetEmptyState'

function formatBytes(value?: number) {
  if (!value) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

const KPI_TONE: Record<string, string> = {
  blue: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200',
  green: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
  amber: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
  rose: 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200',
  slate: 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

function formatCell(value: number | string) {
  return typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value
}

export function DashboardPage() {
  const { activeDataset, theme } = useStore()
  const loadingView = false
  const chart1Ref = useRef<HTMLDivElement>(null)
  const chart2Ref = useRef<HTMLDivElement>(null)
  const chart3Ref = useRef<HTMLDivElement>(null)

  const numCols = useMemo(
    () => activeDataset?.schema.filter((c) => c.type === 'numeric').map((c) => c.name) ?? [],
    [activeDataset]
  )
  const catCols = useMemo(
    () => activeDataset?.schema.filter((c) => c.type === 'categorical').map((c) => c.name) ?? [],
    [activeDataset]
  )

  const paperBg = theme === 'dark' ? '#1e293b' : '#ffffff'
  const plotBg = theme === 'dark' ? '#0f172a' : '#f8fafc'
  const fontColor = theme === 'dark' ? '#cbd5e1' : '#334155'
  const layoutBase: Partial<Plotly.Layout> = useMemo(
    () => ({
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: fontColor, size: 11, family: 'Inter, system-ui, sans-serif' },
      margin: { t: 30, r: 10, b: 40, l: 50 },
    }),
    [paperBg, plotBg, fontColor]
  )

  useEffect(() => {
    if (!activeDataset || loadingView || numCols.length === 0) return

    // Chart 1: Histogram of first numeric column
    if (chart1Ref.current) {
      const data = numericColumn(activeDataset.data, numCols[0])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const histTrace: any = { type: 'histogram', x: data, marker: { color: '#6366f1' }, nbinsx: 20 }
      Plotly.react(chart1Ref.current, [histTrace], { ...layoutBase, title: { text: numCols[0], font: { size: 12 } } }, { responsive: true })
    }

    // Chart 2: Box plots of all numeric cols
    if (chart2Ref.current && numCols.length >= 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const traces: any[] = numCols.slice(0, 4).map((col) => ({
        type: 'box', y: numericColumn(activeDataset.data, col), name: col,
      }))
      Plotly.react(chart2Ref.current, traces, { ...layoutBase, title: { text: 'Box Plots', font: { size: 12 } } }, { responsive: true })
    }

    // Chart 3: Bar chart of first categorical column
    if (chart3Ref.current && catCols.length > 0) {
      const col = catCols[0]
      const counts: Record<string, number> = {}
      activeDataset.data.forEach((r) => { const v = String(r[col] ?? ''); counts[v] = (counts[v] || 0) + 1 })
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
      Plotly.react(chart3Ref.current, [{ type: 'bar', x: entries.map((e) => e[0]), y: entries.map((e) => e[1]), marker: { color: '#f59e0b' } } as Plotly.Data], { ...layoutBase, title: { text: col, font: { size: 12 } } }, { responsive: true })
    }
  }, [activeDataset, layoutBase, numCols, catCols, loadingView])

  if (!activeDataset) {
    return <DatasetEmptyState preferredPath="/dashboard" description="Load a dataset to open the dashboard with automatic charts, KPIs, and data-quality cards." />
  }

  const stats = numCols.slice(0, 4).map((col) => {
    const s = summaryStats(activeDataset.data, col)
    return { col, mean: s.find((x) => x.label === 'Mean')?.value, std: s.find((x) => x.label === 'Std Dev')?.value }
  })
  const kpis = datasetKpis(activeDataset.data, activeDataset.schema)
  const descriptiveRows = numericDescriptiveRows(activeDataset.data, numCols).slice(0, 6)
  const metadata = [
    { label: 'File size', value: formatBytes(activeDataset.fileSize) },
    { label: 'Rows', value: activeDataset.rows.toLocaleString() },
    { label: 'Schema confidence', value: `${activeDataset.schemaConfidence ?? 92}%` },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard - {activeDataset.name}</h1>
          <p className="text-xs text-slate-400">KPI overview, descriptive statistics, and quick visual checks.</p>
        </div>
        <Link
          to="/explore/summary"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <BarChart3 size={14} />
          Full descriptive stats
        </Link>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {metadata.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">{item.value}</p>
            {item.label === 'Schema confidence' && <p className="text-xs text-slate-400">{activeDataset.parseDetails ?? 'Detected from column values'}</p>}
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {loadingView ? Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mb-2 h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        )) : kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-lg border p-4 ${KPI_TONE[kpi.tone ?? 'slate']}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{kpi.label}</p>
              <Gauge size={15} className="opacity-70" />
            </div>
            <p className="text-2xl font-bold">{formatCell(kpi.value)}</p>
            <p className="mt-1 text-xs opacity-75">{kpi.detail}</p>
          </div>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(({ col, mean, std }) => (
          <div key={col} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-400 truncate mb-1">{col}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{typeof mean === 'number' ? mean.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</p>
            <p className="text-xs text-slate-400">σ = {typeof std === 'number' ? std.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</p>
          </div>
        ))}
      </div>

      {descriptiveRows.length > 0 && (
        <div className="mb-6 overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Descriptive Statistics</h2>
              <p className="text-xs text-slate-400">Top numeric columns with central tendency, spread, missingness, and outliers.</p>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                {['Column', 'Count', 'Missing %', 'Mean', 'Median', 'Std Dev', 'IQR', 'Skew', 'Outliers'].map((head) => (
                  <th key={head} className={`px-4 py-2 font-semibold text-slate-500 ${head === 'Column' ? 'text-left' : 'text-right'}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {descriptiveRows.map((row) => (
                <tr key={row.column}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{row.column}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.count}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.missingPct}%</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.mean)}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.median)}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.stdDev)}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.iqr)}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.skewness)}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.outliers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {numCols.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            {loadingView ? <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-700" /> : <div ref={chart1Ref} style={{ minHeight: 260 }} />}
          </div>
        )}
        {numCols.length >= 2 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            {loadingView ? <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-700" /> : <div ref={chart2Ref} style={{ minHeight: 260 }} />}
          </div>
        )}
        {catCols.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            {loadingView ? <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-slate-700" /> : <div ref={chart3Ref} style={{ minHeight: 260 }} />}
          </div>
        )}
      </div>
    </div>
  )
}
