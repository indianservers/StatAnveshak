import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { categoricalDescriptiveRows, datasetKpis, numericDescriptiveRows, summaryStats } from '../../lib/stats'
import { Link } from 'react-router-dom'
import { Copy, Gauge, HelpCircle, Upload } from 'lucide-react'
import { useToast } from '../../components/ui/toastContext'

const STAT_HELP: Record<string, string> = {
  Count: 'Number of valid numeric observations.',
  Mean: 'Arithmetic average; sensitive to outliers.',
  Median: 'Middle value; robust to outliers.',
  Mode: 'Most frequent value.',
  'Std Dev': 'Typical spread around the mean.',
  Variance: 'Squared standard deviation.',
  IQR: 'Middle 50% spread, Q3 minus Q1.',
  Skewness: 'Direction and strength of distribution asymmetry.',
  Kurtosis: 'Tail heaviness compared with a normal distribution.',
  'CV (%)': 'Standard deviation as a percentage of the mean.',
}

const KPI_TONE: Record<string, string> = {
  blue: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200',
  green: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
  amber: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
  rose: 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200',
  slate: 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

function formatCell(value: number | string) {
  return typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : value
}

export function SummaryPage() {
  const { activeDataset } = useStore()
  const { notify } = useToast()
  const numericCols = activeDataset?.schema.filter((c) => c.type === 'numeric').map((c) => c.name) ?? []
  const categoricalCols = activeDataset?.schema.filter((c) => c.type === 'categorical' || c.type === 'boolean').map((c) => c.name) ?? []
  const [selectedCol, setSelectedCol] = useState<string>(numericCols[0] ?? '')

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  const col = selectedCol || numericCols[0]
  const stats = col ? summaryStats(activeDataset.data, col) : []
  const kpis = datasetKpis(activeDataset.data, activeDataset.schema)
  const numericRows = numericDescriptiveRows(activeDataset.data, numericCols)
  const categoricalRows = categoricalDescriptiveRows(activeDataset.data, categoricalCols)

  const copyStats = async () => {
    const numericText = numericRows.map((row) => [
      row.column, row.count, row.missingPct, row.mean, row.median, row.stdDev, row.variance,
      row.min, row.max, row.iqr, row.skewness, row.kurtosis, row.cvPct, row.outliers,
    ].join('\t')).join('\n')
    const categoricalText = categoricalRows.map((row) => [
      row.column, row.count, row.missingPct, row.unique, row.topValue, row.topFrequency, row.topPct, row.entropy,
    ].join('\t')).join('\n')
    await navigator.clipboard.writeText([
      'Numeric Descriptive Statistics',
      'Column\tCount\tMissing %\tMean\tMedian\tStd Dev\tVariance\tMin\tMax\tIQR\tSkewness\tKurtosis\tCV %\tOutliers',
      numericText,
      '',
      'Categorical Descriptive Statistics',
      'Column\tCount\tMissing %\tUnique\tTop Value\tTop Frequency\tTop %\tEntropy',
      categoricalText,
    ].join('\n'))
    notify('Summary statistics copied.', 'success')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Summary Statistics</h1>
          <p className="text-xs text-slate-400">Descriptive statistics, robust spread, and distribution shape.</p>
        </div>
        <button
          onClick={copyStats}
          disabled={stats.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Copy size={13} />
          Copy table
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {kpis.map((kpi) => (
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

      {/* Column selector */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Column:</label>
        <select
          value={col}
          onChange={(e) => setSelectedCol(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          {numericCols.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {numericCols.length === 0 && (
          <span className="text-sm text-orange-500">No numeric columns detected</span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-slate-400" title="Click a row in the table below to switch the active column.">
          <HelpCircle size={13} />
          Click a column row to analyze it
        </span>
      </div>

      {/* Stats grid */}
      {stats.length > 0 && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                <p className="text-xs text-slate-400 mb-1" title={STAT_HELP[s.label] ?? s.label}>{s.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  {typeof s.value === 'number' ? s.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* All numeric columns summary table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
            <table className="text-xs w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">Column</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Count</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Missing %</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Mean</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Mode</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Std Dev</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Variance</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Min</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Q1</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Median</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Q3</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Max</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Range</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">IQR</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Skew</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Kurtosis</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">CV %</th>
                  <th className="px-4 py-2 text-right font-semibold text-slate-500">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {numericRows.map((row) => {
                  return (
                    <tr
                      key={row.column}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer ${row.column === col ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => setSelectedCol(row.column)}
                    >
                      <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{row.column}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.count}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.missingPct}%</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.mean)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.mode)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.stdDev)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.variance)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.min)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.q1)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.median)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.q3)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.max)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.range)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.iqr)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.skewness)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.kurtosis)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{formatCell(row.cvPct)}</td>
                      <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.outliers}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {categoricalRows.length > 0 && (
        <div className="mt-6 overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Categorical Descriptive Statistics</h2>
            <p className="text-xs text-slate-400">Levels, most common values, missingness, and entropy for categorical columns.</p>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                {['Column', 'Count', 'Missing %', 'Unique', 'Top Value', 'Top Freq', 'Top %', 'Entropy'].map((head) => (
                  <th key={head} className={`px-4 py-2 font-semibold text-slate-500 ${head === 'Column' || head === 'Top Value' ? 'text-left' : 'text-right'}`}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {categoricalRows.map((row) => (
                <tr key={row.column}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{row.column}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.count}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.missingPct}%</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.unique}</td>
                  <td className="px-4 py-2 text-left text-slate-600 dark:text-slate-300">{row.topValue}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.topFrequency}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.topPct}%</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{row.entropy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
