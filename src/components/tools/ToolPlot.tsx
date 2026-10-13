import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import type { PlotSpec } from '../../analysis/types'
import { useStore } from '../../store/useStore'
export function ToolPlot({ plot }: { plot: PlotSpec }) {
  const ref = useRef<HTMLDivElement>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const theme = useStore(s => s.theme), dark = ['dark', 'midnight', 'forest'].includes(theme)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let active = true
    queue.current = queue.current.catch(() => {}).then(async () => { if (active) await Plotly.react(el, plot.data as Plotly.Data[], { ...plot.layout, title: { text: plot.title }, autosize: true, height: 340, paper_bgcolor: dark ? '#0f172a' : '#ffffff', plot_bgcolor: dark ? '#0f172a' : '#ffffff', font: { color: dark ? '#e2e8f0' : '#0f172a' } }, { responsive: true, displaylogo: false }) })
    const observer = new ResizeObserver(() => { void Plotly.Plots.resize(el) }); observer.observe(el)
    return () => { active = false; observer.disconnect(); queue.current = queue.current.then(() => { Plotly.purge(el) }) }
  }, [plot, dark])
  return <div ref={ref} role="img" aria-label={plot.title} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"/>
}
