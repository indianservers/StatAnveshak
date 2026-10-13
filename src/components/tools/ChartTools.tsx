import { numericToolColumns } from './toolDefaults'
import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { numberValue } from '../../lib/toolkit'
import { useStore } from '../../store/useStore'
import type { PanelProps } from './toolTypes'
import { ToolTable } from './ToolResults'

const palettes = { okabe: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#d55e00', '#56b4e9'], high: ['#003f5c', '#bc5090', '#ffa600', '#58508d', '#00876c', '#d45087'], mono: ['#334155', '#64748b', '#94a3b8', '#0f172a'] }
type EventGraph = HTMLDivElement & { on: (event: string, callback: (event: { points?: { customdata?: unknown }[] }) => void) => void; removeAllListeners: (event: string) => void }
export function ChartTools({ feature, dataset, message }: PanelProps) {
  const nums = numericToolColumns(dataset), cols = dataset?.schema.map(c => c.name) ?? []
  const [kind, setKind] = useState('scatter'), [x, setX] = useState(nums[0] ?? cols[0] ?? ''), [y, setY] = useState(nums[1] ?? nums[0] ?? ''), [secondY, setSecondY] = useState(nums[2] ?? nums[0] ?? ''), [group, setGroup] = useState(''), [title, setTitle] = useState('My analysis chart'), [palette, setPalette] = useState<keyof typeof palettes>('okabe'), [selected, setSelected] = useState<number[]>([]), [annotation, setAnnotation] = useState('Noteworthy observation'), [annotated, setAnnotated] = useState<{ row: number; text: string }[]>([]), [width, setWidth] = useState(1200), [height, setHeight] = useState(800), [scale, setScale] = useState(2), [format, setFormat] = useState<'svg' | 'png'>('svg'), [error, setError] = useState('')
  const first = useRef<HTMLDivElement>(null), second = useRef<HTMLDivElement>(null), theme = useStore(s => s.theme), dark = ['dark', 'midnight', 'forest'].includes(theme)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const rows = useMemo(() => dataset?.data ?? [], [dataset]), linked = feature === 'linked'
  const traces = useMemo(() => {
    const preferred = dataset?.schema.find(c => c.name === group)?.categoryOrder ?? []
    const groups = group ? [...new Set(rows.map(r => String(r[group] ?? '(missing)')))].sort((a, b) => (preferred.includes(a) ? preferred.indexOf(a) : preferred.length) - (preferred.includes(b) ? preferred.indexOf(b) : preferred.length)) : ['All observations']
    if (groups.length > 30) return { primary: [], secondary: [] }
    const build = (yy: string) => groups.map((g, i) => {
      const cases = rows.flatMap<{ x: number | string; y: number; index: number }>((r, index) => { if (group && String(r[group] ?? '(missing)') !== g) return []; const xv = numberValue(r[x]), yv = numberValue(r[yy]); return kind === 'scatter' || kind === 'line' ? xv !== null && yv !== null ? [{ x: xv, y: yv, index }] : [] : kind === 'histogram' ? xv !== null ? [{ x: xv, y: 0, index }] : [] : [{ x: String(r[x] ?? '(missing)'), y: yv ?? 0, index }] })
      if (kind === 'bar') { const counts = new Map<string, number>(); cases.forEach(r => counts.set(String(r.x), (counts.get(String(r.x)) ?? 0) + 1)); return { type: 'bar', name: g, x: [...counts.keys()], y: [...counts.values()], marker: { color: palettes[palette][i % palettes[palette].length], pattern: { shape: i % 2 ? '/' : '' } } } }
      return { type: kind === 'histogram' ? 'histogram' : 'scatter', mode: kind === 'line' ? 'lines+markers' : 'markers', name: g, x: cases.map(r => r.x), y: cases.map(r => r.y), customdata: cases.map(r => r.index), selectedpoints: selected.length ? cases.flatMap((r, j) => selected.includes(r.index) ? [j] : []) : null, marker: { color: palettes[palette][i % palettes[palette].length], symbol: ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up'][i % 6], size: 9 }, selected: { marker: { opacity: 1, size: 12 } }, unselected: { marker: { opacity: .25 } }, hovertemplate: 'x=%{x}<br>y=%{y}<extra>%{fullData.name}</extra>' }
    })
    return { primary: build(y), secondary: build(secondY) }
  }, [rows, dataset, group, kind, x, y, secondY, palette, selected])
  useEffect(() => {
    let active = true
    const elements = [first.current, ...(linked ? [second.current] : [])].filter((e): e is HTMLDivElement => e !== null)
    const update = async () => {
      for (const [i, el] of elements.entries()) {
        if (!active) return
        await Plotly.react(el, (i ? traces.secondary : traces.primary) as Plotly.Data[], { title: { text: i ? `${title} · ${secondY}` : title }, height: 360, margin: { t: 55, l: 55, r: 15, b: 60 }, dragmode: kind === 'scatter' ? 'lasso' : 'zoom', paper_bgcolor: dark ? '#0f172a' : 'white', plot_bgcolor: dark ? '#0f172a' : 'white', font: { color: dark ? '#e2e8f0' : '#0f172a' }, xaxis: { title: { text: x }, categoryorder: 'array', categoryarray: dataset?.schema.find(c => c.name === x)?.categoryOrder }, yaxis: { title: { text: kind === 'bar' || kind === 'histogram' ? 'Count' : i ? secondY : y } }, annotations: kind === 'scatter' || kind === 'line' ? annotated.flatMap(a => { const r = rows[a.row], xx = numberValue(r?.[x]), yy = numberValue(r?.[i ? secondY : y]); return xx !== null && yy !== null ? [{ x: xx, y: yy, text: a.text, showarrow: true, bgcolor: dark ? '#1e293b' : 'white' }] : [] }) : [] }, { responsive: true, displaylogo: false })
        if (!active) return
        const graph = el as EventGraph; graph.removeAllListeners('plotly_selected'); graph.removeAllListeners('plotly_click')
        const select = (event: { points?: { customdata?: unknown }[] }) => setSelected([...(new Set((event?.points ?? []).map(p => Number(p.customdata)).filter(Number.isFinite)))])
        graph.on('plotly_selected', select); graph.on('plotly_click', select)
      }
    }
    queue.current = queue.current.catch(() => {}).then(update).catch(e => { if (active) setError(e instanceof Error ? e.message : String(e)) })
    const observer = new ResizeObserver(() => elements.forEach(el => { void Plotly.Plots.resize(el) })); elements.forEach(el => observer.observe(el))
    return () => { active = false; observer.disconnect(); queue.current = queue.current.then(() => { elements.forEach(el => Plotly.purge(el)) }) }
  }, [traces, title, secondY, linked, dark, kind, x, y, annotated, rows, dataset])
  const exportChart = async () => {
    try { setError(''); if (!first.current) return; if (!(width >= 300 && width <= 4000 && height >= 200 && height <= 3000 && scale >= 1 && scale <= 4)) throw new Error('Use width 300–4000, height 200–3000, and PNG scale 1–4.'); await Plotly.downloadImage(first.current, { format, filename: 'statanveshak-chart', width: width * (format === 'svg' ? 1 : scale), height: height * (format === 'svg' ? 1 : scale) }); message('Chart export created.') } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  if (!dataset) return <p>Load a dataset to build charts.</p>
  return <div className="space-y-4"><div className="tool-fields"><label>Chart type<select value={kind} onChange={e => { setKind(e.target.value); setSelected([]) }}><option value="scatter">Scatter</option><option value="line">Line in row order</option><option value="histogram">Histogram</option><option value="bar">Category counts</option></select></label><label>Chart X column<select value={x} onChange={e => { setX(e.target.value); setSelected([]); setAnnotated([]) }}>{cols.map(c => <option key={c}>{c}</option>)}</select></label>{['scatter', 'line'].includes(kind) && <label>Chart Y column<select value={y} onChange={e => { setY(e.target.value); setAnnotated([]) }}>{nums.map(c => <option key={c}>{c}</option>)}</select></label>}{linked && <label>Linked Y column<select value={secondY} onChange={e => setSecondY(e.target.value)}>{nums.map(c => <option key={c}>{c}</option>)}</select></label>}<label>Chart grouping<select value={group} onChange={e => setGroup(e.target.value)}><option value="">No grouping</option>{cols.map(c => <option key={c}>{c}</option>)}</select></label><label>Chart title<input value={title} onChange={e => setTitle(e.target.value)}/></label><label>Chart palette<select value={palette} onChange={e => setPalette(e.target.value as keyof typeof palettes)}><option value="okabe">Okabe–Ito</option><option value="high">High contrast</option><option value="mono">Monochrome</option></select></label></div>
    {group && new Set(rows.map(r => String(r[group]))).size > 30 && <p role="alert">Grouping has more than 30 categories. Choose a lower-cardinality column.</p>}
    <p className="text-sm">Use lasso or click to select scatter observations. Groups have distinct colors and symbols; bars also use patterns. Line charts follow dataset row order.</p><div ref={first} role="img" aria-label="Primary interactive chart" className="min-w-0"/>{linked && <div ref={second} role="img" aria-label="Linked interactive chart" className="min-w-0"/>}<p role="status">{selected.length} observations selected{linked ? ' across both charts' : ''}.</p>
    <div className="flex flex-wrap gap-3"><button onClick={() => setSelected([])}>Clear chart selection</button>{feature === 'annotations' && <><label>Annotation text<input value={annotation} onChange={e => setAnnotation(e.target.value)}/></label><button disabled={!selected.length || !annotation.trim()} onClick={() => setAnnotated(a => [...a, ...selected.map(row => ({ row, text: annotation.trim() }))])}>Label selected observations</button><button onClick={() => setAnnotated([])}>Clear annotations</button></>}</div>
    {linked && <details><summary className="cursor-pointer font-bold">Select observations with the keyboard</summary><div className="max-h-52 overflow-auto">{rows.slice(0, 100).map((_, i) => <label key={i} className="mr-4 inline-flex items-center gap-2 py-2"><input type="checkbox" checked={selected.includes(i)} onChange={e => setSelected(s => e.target.checked ? [...s, i] : s.filter(j => j !== i))}/>Row {i + 1}</label>)}</div><p className="text-xs">Keyboard list shows the first 100 rows; the chart lasso can select additional rows.</p></details>}
    {selected.length > 0 && <ToolTable caption="Selected observations" columns={['Original row', x, y]} rows={selected.map(i => [i + 1, String(rows[i]?.[x] ?? ''), String(rows[i]?.[y] ?? '')])}/>}
    <details open={feature === 'chart-export'}><summary className="cursor-pointer font-bold">Publication export settings</summary><div className="tool-fields mt-3"><label>Export preset<select defaultValue="custom" onChange={e => { if (e.target.value === 'single') { setWidth(900); setHeight(600) } else if (e.target.value === 'double') { setWidth(1800); setHeight(1000) } }}><option value="custom">Custom dimensions</option><option value="single">Single column: 900 × 600</option><option value="double">Double column: 1800 × 1000</option></select></label><label>Export width<input type="number" value={width} onChange={e => setWidth(Number(e.target.value))}/></label><label>Export height<input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}/></label><label>Export format<select value={format} onChange={e => setFormat(e.target.value as 'svg' | 'png')}><option value="svg">SVG vector</option><option value="png">PNG bitmap</option></select></label><label>PNG resolution scale<input type="number" min="1" max="4" value={scale} onChange={e => setScale(Number(e.target.value))}/></label></div><button className="tool-primary mt-3" onClick={() => void exportChart()}>Export chart</button></details>{error && <p role="alert" className="text-rose-600">{error}</p>}
  </div>
}



