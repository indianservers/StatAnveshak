import { useEffect, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import * as ss from 'simple-statistics'
import jStatRaw from 'jstat'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'

const jStat = jStatRaw as unknown as { studentt: { cdf: (x: number, df: number) => number } }

export function RegressionPage() {
  const { activeDataset, theme } = useStore()
  const numCols = activeDataset?.schema.filter((c) => c.type === 'numeric').map((c) => c.name) ?? []
  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')
  const plotRef = useRef<HTMLDivElement>(null)
  const residRef = useRef<HTMLDivElement>(null)

  const effectiveXCol = xCol || numCols[0] || ''
  const effectiveYCol = yCol || numCols.find((col) => col !== effectiveXCol) || ''

  const regResult = (() => {
    if (!activeDataset || !effectiveXCol || !effectiveYCol || effectiveXCol === effectiveYCol) return null
    const pairs = activeDataset.data
      .map((row) => [Number(row[effectiveXCol]), Number(row[effectiveYCol])] as [number, number])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    const n = pairs.length
    if (n < 3) return null
    const reg = ss.linearRegression(pairs)
    const line = ss.linearRegressionLine(reg)
    const predicted = pairs.map(([x]) => line(x))
    const residuals = pairs.map(([, y], i) => y - predicted[i])
    const r2 = ss.rSquared(pairs, line)
    const rAdj = 1 - (1 - r2) * (n - 1) / (n - 2)
    const sse = residuals.reduce((a, r) => a + r * r, 0)
    const mse = sse / (n - 2)
    const se = Math.sqrt(mse)
    const xMean = ss.mean(pairs.map(([x]) => x))
    const sxx = pairs.reduce((a, [x]) => a + (x - xMean) ** 2, 0)
    const seSlope = Math.sqrt(mse / sxx)
    const tSlope = reg.m / seSlope
    const pSlope = 2 * (1 - jStat.studentt.cdf(Math.abs(tSlope), n - 2))
    return { slope: reg.m, intercept: reg.b, r2, rAdj, n, se, tSlope, pSlope, pairs, predicted, residuals, line }
  })()

  useEffect(() => {
    if (!regResult) return
    const sortedX = regResult.pairs.map(([x]) => x).sort((a, b) => a - b)
    const paperBg = theme === 'dark' ? '#1e293b' : '#ffffff'
    const plotBg = theme === 'dark' ? '#0f172a' : '#f8fafc'
    const fontColor = theme === 'dark' ? '#cbd5e1' : '#334155'
    const layoutBase: Partial<Plotly.Layout> = {
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: fontColor, size: 11, family: 'Inter, system-ui, sans-serif' },
      margin: { t: 30, r: 20, b: 50, l: 60 },
    }

    if (plotRef.current) {
      Plotly.react(plotRef.current, [
        { type: 'scatter', mode: 'markers', x: regResult.pairs.map(([x]) => x), y: regResult.pairs.map(([, y]) => y), name: 'Data', marker: { color: '#6366f1', size: 5, opacity: 0.7 } },
        { type: 'scatter', mode: 'lines', x: sortedX, y: sortedX.map(regResult.line), name: `y = ${regResult.slope.toFixed(3)}x + ${regResult.intercept.toFixed(3)}`, line: { color: '#ef4444', width: 2 } },
      ], { ...layoutBase, xaxis: { title: { text: effectiveXCol } }, yaxis: { title: { text: effectiveYCol } } }, { responsive: true })
    }

    if (residRef.current) {
      Plotly.react(residRef.current, [
        { type: 'scatter', mode: 'markers', x: regResult.predicted, y: regResult.residuals, name: 'Residuals', marker: { color: '#f59e0b', size: 5, opacity: 0.8 } },
        { type: 'scatter', mode: 'lines', x: [Math.min(...regResult.predicted), Math.max(...regResult.predicted)], y: [0, 0], name: 'Zero line', line: { color: '#94a3b8', width: 1.5, dash: 'dash' } },
      ], { ...layoutBase, xaxis: { title: { text: 'Fitted values' } }, yaxis: { title: { text: 'Residuals' } }, title: { text: 'Residual Plot', font: { size: 13 } } }, { responsive: true })
    }
  }, [effectiveXCol, effectiveYCol, regResult, theme])

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Simple Linear Regression</h1>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">X (Predictor)</label>
          <select value={effectiveXCol} onChange={(e) => setXCol(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {numCols.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Y (Response)</label>
          <select value={effectiveYCol} onChange={(e) => setYCol(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {numCols.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {regResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Slope (beta1)', value: regResult.slope.toFixed(6) },
            { label: 'Intercept (beta0)', value: regResult.intercept.toFixed(6) },
            { label: 'R2', value: regResult.r2.toFixed(6) },
            { label: 'Adj. R2', value: regResult.rAdj.toFixed(6) },
            { label: 'Std Error', value: regResult.se.toFixed(6) },
            { label: 't (slope)', value: regResult.tSlope.toFixed(4) },
            { label: 'p-value', value: regResult.pSlope.toFixed(6) },
            { label: 'n', value: regResult.n },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div ref={plotRef} style={{ minHeight: 300 }} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div ref={residRef} style={{ minHeight: 300 }} />
        </div>
      </div>
    </div>
  )
}
