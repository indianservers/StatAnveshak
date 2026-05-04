import { useState, useEffect, useMemo, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import { useStore } from '../../store/useStore'
import { numericColumn } from '../../lib/stats'
import { Link } from 'react-router-dom'
import { Upload, Download, Save, MessageSquarePlus } from 'lucide-react'
import * as ss from 'simple-statistics'

type ChartType = 'histogram' | 'bar' | 'scatter' | 'box' | 'line' | 'violin'
type PaletteName = 'Viridis' | 'Cool' | 'Warm' | 'Colorblind-safe'

const PALETTES: Record<PaletteName, string[]> = {
  Viridis: ['#440154', '#31688e', '#35b779', '#fde725'],
  Cool: ['#0ea5e9', '#6366f1', '#a855f7', '#14b8a6'],
  Warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308'],
  'Colorblind-safe': ['#0072b2', '#e69f00', '#009e73', '#cc79a7'],
}

function makeAxis(title: string, dark: boolean): Partial<Plotly.LayoutAxis> {
  return { title: { text: title }, gridcolor: dark ? '#334155' : '#e2e8f0' }
}

export function ChartsPage() {
  const { activeDataset, theme } = useStore()
  const plotRef = useRef<HTMLDivElement>(null)
  const [chartType, setChartType] = useState<ChartType>('histogram')
  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')
  const [colorCol, setColorCol] = useState('')
  const [palette, setPalette] = useState<PaletteName>('Viridis')
  const [snapshots, setSnapshots] = useState<{ name: string; chartType: ChartType; xCol: string; yCol: string; colorCol: string; palette: PaletteName; annotation: string }[]>([])
  const [snapshotName, setSnapshotName] = useState('')
  const [annotation, setAnnotation] = useState('')

  const numCols = useMemo(() => activeDataset?.schema.filter((c) => c.type === 'numeric').map((c) => c.name) ?? [], [activeDataset])
  const catCols = useMemo(() => activeDataset?.schema.filter((c) => c.type === 'categorical').map((c) => c.name) ?? [], [activeDataset])
  const allCols = useMemo(() => activeDataset?.schema.map((c) => c.name) ?? [], [activeDataset])
  const effectiveXCol = xCol || numCols[0] || allCols[0] || ''
  const effectiveYCol = yCol || numCols.find((col) => col !== effectiveXCol) || ''

  useEffect(() => {
    if (!plotRef.current || !activeDataset || !effectiveXCol) return
    const dark = theme === 'dark'
    const paperBg = dark ? '#1e293b' : '#ffffff'
    const plotBg = dark ? '#0f172a' : '#f8fafc'
    const fontColor = dark ? '#cbd5e1' : '#334155'

    const layout: Partial<Plotly.Layout> = {
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: fontColor, family: 'Inter, system-ui, sans-serif', size: 12 },
      margin: { t: 40, r: 20, b: 60, l: 60 },
      xaxis: makeAxis(effectiveXCol, dark),
      yaxis: makeAxis(effectiveYCol || 'Count', dark),
      annotations: annotation ? [{
        text: annotation,
        xref: 'paper',
        yref: 'paper',
        x: 0.98,
        y: 0.96,
        showarrow: true,
        arrowhead: 2,
        ax: -40,
        ay: 30,
        bgcolor: dark ? '#334155' : '#ffffff',
        bordercolor: PALETTES[palette][0],
        font: { color: fontColor },
      }] : [],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traces: any[] = []
    const xData = numericColumn(activeDataset.data, effectiveXCol)

    if (chartType === 'histogram') {
      traces.push({ type: 'histogram', x: xData, name: effectiveXCol, marker: { color: PALETTES[palette][0] }, nbinsx: 20 })
    } else if (chartType === 'box') {
      if (colorCol) {
        const groups = [...new Set(activeDataset.data.map((r) => String(r[colorCol] ?? '')))]
        groups.forEach((g) => traces.push({
          type: 'box', name: g,
          y: activeDataset.data.filter((r) => String(r[colorCol]) === g).map((r) => Number(r[effectiveXCol])).filter((n) => !isNaN(n)),
          marker: { color: PALETTES[palette][traces.length % PALETTES[palette].length] },
        }))
      } else {
        traces.push({ type: 'box', y: xData, name: effectiveXCol, marker: { color: PALETTES[palette][0] } })
      }
    } else if (chartType === 'violin') {
      if (colorCol) {
        const groups = [...new Set(activeDataset.data.map((r) => String(r[colorCol] ?? '')))]
        groups.forEach((g) => traces.push({
          type: 'violin', name: g,
          y: activeDataset.data.filter((r) => String(r[colorCol]) === g).map((r) => Number(r[effectiveXCol])).filter((n) => !isNaN(n)),
          box: { visible: true }, meanline: { visible: true },
          marker: { color: PALETTES[palette][traces.length % PALETTES[palette].length] },
        }))
      } else {
        traces.push({ type: 'violin', y: xData, name: effectiveXCol, marker: { color: PALETTES[palette][0] }, box: { visible: true }, meanline: { visible: true } })
      }
    } else if (chartType === 'scatter' && effectiveYCol) {
      const pairedRows = activeDataset.data
        .map((row) => [Number(row[effectiveXCol]), Number(row[effectiveYCol]), String(row[colorCol] ?? '')] as [number, number, string])
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
      const xSlice = pairedRows.map(([x]) => x)
      const ySlice = pairedRows.map(([, y]) => y)
      if (colorCol) {
        traces.push({ type: 'scatter', mode: 'markers', x: xSlice, y: ySlice, text: pairedRows.map(([, , label]) => label), marker: { color: PALETTES[palette][0], opacity: 0.7, size: 6 } })
      } else {
        const pairs = xSlice.map((x, i) => [x, ySlice[i]] as [number, number])
        const reg = ss.linearRegression(pairs)
        const lineFn = ss.linearRegressionLine(reg)
        const sortedX = [...xSlice].sort((a, b) => a - b)
        traces.push({ type: 'scatter', mode: 'markers', x: xSlice, y: ySlice, name: 'Data', marker: { color: PALETTES[palette][0], opacity: 0.7, size: 5 } })
        traces.push({ type: 'scatter', mode: 'lines', x: sortedX, y: sortedX.map(lineFn), name: 'Regression', line: { color: PALETTES[palette][2], width: 2 } })
      }
      layout.xaxis = makeAxis(effectiveXCol, dark)
      layout.yaxis = makeAxis(effectiveYCol, dark)
    } else if (chartType === 'bar') {
      const col = colorCol || effectiveXCol
      const counts: Record<string, number> = {}
      activeDataset.data.forEach((r) => { const v = String(r[col] ?? '(missing)'); counts[v] = (counts[v] || 0) + 1 })
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30)
      traces.push({ type: 'bar', x: entries.map((e) => e[0]), y: entries.map((e) => e[1]), marker: { color: PALETTES[palette][1] } })
      layout.xaxis = makeAxis(col, dark)
      layout.yaxis = makeAxis('Count', dark)
    } else if (chartType === 'line' && effectiveYCol) {
      const pairs = activeDataset.data
        .map((row) => [Number(row[effectiveXCol]), Number(row[effectiveYCol])] as [number, number])
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
      traces.push({ type: 'scatter', mode: 'lines+markers', x: pairs.map(([x]) => x), y: pairs.map(([, y]) => y), name: effectiveYCol, line: { color: PALETTES[palette][0] }, marker: { size: 4 } })
    }

    if (traces.length > 0) {
      Plotly.react(plotRef.current, traces as Plotly.Data[], layout, { responsive: true, displayModeBar: true })
    }
  }, [activeDataset, chartType, effectiveXCol, effectiveYCol, colorCol, theme, palette, annotation])

  const downloadPNG = async () => {
    if (!plotRef.current) return
    const url = await Plotly.toImage(plotRef.current as unknown as Plotly.PlotlyHTMLElement, { format: 'png', width: 1200, height: 700 })
    const a = document.createElement('a')
    a.href = url
    a.download = `chart-${chartType}.png`
    a.click()
  }
  const recommendation = useMemo(() => {
    if (chartType === 'histogram' && effectiveXCol) return `Box plot suits this distribution when you need outlier and quartile checks for ${effectiveXCol}.`
    if (chartType === 'scatter' && effectiveYCol) return `Scatter plot is a good fit for checking association between ${effectiveXCol} and ${effectiveYCol}.`
    if (catCols.length > 0 && numCols.length > 0) return `Box plot by ${catCols[0]} can compare the distribution of ${numCols[0]} across groups.`
    return 'Histogram is a good first look for a single numeric column.'
  }, [chartType, effectiveXCol, effectiveYCol, catCols, numCols])

  const saveSnapshot = () => {
    const name = snapshotName.trim() || `${chartType} ${snapshots.length + 1}`
    setSnapshots((items) => [...items.filter((item) => item.name !== name), { name, chartType, xCol: effectiveXCol, yCol: effectiveYCol, colorCol, palette, annotation }])
    setSnapshotName('')
  }

  const restoreSnapshot = (name: string) => {
    const snapshot = snapshots.find((item) => item.name === name)
    if (!snapshot) return
    setChartType(snapshot.chartType)
    setXCol(snapshot.xCol)
    setYCol(snapshot.yCol)
    setColorCol(snapshot.colorCol)
    setPalette(snapshot.palette)
    setAnnotation(snapshot.annotation)
  }

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  const CHART_TYPES: { type: ChartType; label: string }[] = [
    { type: 'histogram', label: 'Histogram' },
    { type: 'bar', label: 'Bar Chart' },
    { type: 'scatter', label: 'Scatter Plot' },
    { type: 'box', label: 'Box Plot' },
    { type: 'line', label: 'Line Chart' },
    { type: 'violin', label: 'Violin Plot' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Charts</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {CHART_TYPES.map(({ type, label }) => (
              <button key={type} onClick={() => setChartType(type)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${chartType === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 ml-auto flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">X / Group:</label>
              <select value={effectiveXCol} onChange={(e) => setXCol(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {(chartType === 'bar' ? allCols : numCols).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            {(chartType === 'scatter' || chartType === 'line') && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Y:</label>
                <select value={effectiveYCol} onChange={(e) => setYCol(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {numCols.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            {(chartType === 'box' || chartType === 'violin' || chartType === 'scatter' || chartType === 'bar') && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Color/Group:</label>
                <select value={colorCol} onChange={(e) => setColorCol(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  <option value="">— none —</option>
                  {catCols.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Palette:</label>
              <select value={palette} onChange={(e) => setPalette(e.target.value as PaletteName)} className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {Object.keys(PALETTES).map((name) => <option key={name}>{name}</option>)}
              </select>
            </div>
            <button onClick={downloadPNG} className="flex items-center gap-1 text-xs border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Download size={12} /> PNG
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
          {recommendation}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <input value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} placeholder="Snapshot name" className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
          <button type="button" onClick={saveSnapshot} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"><Save size={12} /> Save</button>
          <select onChange={(e) => restoreSnapshot(e.target.value)} defaultValue="" className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
            <option value="" disabled>Restore snapshot</option>
            {snapshots.map((item) => <option key={item.name}>{item.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <MessageSquarePlus size={14} className="text-slate-400" />
        <input value={annotation} onChange={(e) => setAnnotation(e.target.value)} placeholder="Add in-chart annotation text" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
        <div ref={plotRef} className="w-full" style={{ minHeight: 420 }} />
      </div>
    </div>
  )
}
