import { useEffect, useMemo, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import { useStore } from '../../store/useStore'
import { correlationMatrix } from '../../lib/stats'
import { DatasetEmptyState } from '../../components/ui/DatasetEmptyState'

export function CorrelationPage() {
  const { activeDataset, theme } = useStore()
  const plotRef = useRef<HTMLDivElement>(null)

  const numCols = useMemo(() => activeDataset?.schema.filter((c) => c.type === 'numeric').map((c) => c.name) ?? [], [activeDataset])

  useEffect(() => {
    if (!plotRef.current || !activeDataset || numCols.length < 2) return
    const { cols, matrix } = correlationMatrix(activeDataset.data, numCols)

    const paperBg = theme === 'dark' ? '#1e293b' : '#ffffff'
    const fontColor = theme === 'dark' ? '#cbd5e1' : '#334155'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trace: any = {
      type: 'heatmap',
      z: matrix,
      x: cols,
      y: cols,
      colorscale: 'RdBu',
      zmin: -1,
      zmax: 1,
      text: matrix.map((row) => row.map((v) => v.toFixed(2))),
      texttemplate: '%{text}',
      hoverongaps: false,
    }
    Plotly.react(
      plotRef.current,
      [trace],
      {
        paper_bgcolor: paperBg,
        plot_bgcolor: paperBg,
        font: { color: fontColor, family: 'Inter, system-ui, sans-serif', size: 11 },
        margin: { t: 40, r: 20, b: 80, l: 80 },
        title: { text: 'Pearson Correlation Matrix', font: { size: 14 } },
      },
      { responsive: true }
    )
  }, [activeDataset, numCols, theme])

  if (!activeDataset) {
    return <DatasetEmptyState preferredPath="/explore/correlation" description="Load a dataset with numeric columns to view correlation heatmaps and relationship strength." />
  }

  if (numCols.length < 2) {
    return (
      <div className="p-6 text-slate-500">
        Need at least 2 numeric columns to compute correlation matrix.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Correlation Matrix</h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div ref={plotRef} style={{ minHeight: 500 }} />
      </div>

      {/* Table */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
        <table className="text-xs w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-3 py-2 text-left" />
              {numCols.map((c) => <th key={c} className="px-3 py-2 text-right text-slate-500">{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {correlationMatrix(activeDataset.data, numCols).matrix.map((row, i) => (
              <tr key={numCols[i]} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">{numCols[i]}</td>
                {row.map((v, j) => {
                  const abs = Math.abs(v)
                  const color = i === j ? 'text-slate-400' : abs > 0.7 ? 'text-red-600 font-bold' : abs > 0.4 ? 'text-orange-500 font-semibold' : 'text-slate-600 dark:text-slate-300'
                  return <td key={j} className={`px-3 py-2 text-right ${color}`}>{v.toFixed(3)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
