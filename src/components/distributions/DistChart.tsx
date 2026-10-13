import { useId, useMemo, useRef, useState } from 'react'
import { curvePoints, type Distribution } from '../../lib/distributions'
import { useDistributionUI } from './distributionUI'
import { useAnimationVisibility } from './useAnimationVisibility'

type Overlay = { x: number[]; y: number[]; color: string; dash?: string; label: string }
export function DistChart({ dist, params, mode = 'density', shade, highlightX, overlays = [], data, height = 220 }: {
  dist: Distribution; params: Record<string, number>; mode?: 'density' | 'cdf'; shade?: { lo: number; hi: number; outside?: boolean }; highlightX?: number; overlays?: Overlay[]; data?: number[]; height?: number
}) {
  const uid = useId().replace(/:/g, '')
  const { ui, update, replay } = useDistributionUI()
  const frame = useRef<HTMLDivElement>(null)
  const visible = useAnimationVisibility(frame)
  const dialog = useRef<HTMLDialogElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [point, setPoint] = useState(0)
  const [inspecting, setInspecting] = useState(false)
  const [page, setPage] = useState(0)
  const curve = useMemo(() => curvePoints(dist, params, mode, data), [data, dist, mode, params])
  const points = curve.x.map((x, i) => ({ x, y: curve.y[i] })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
  const width = 520, plotHeight = Math.max(160, height), left = 48, right = 16, top = 20, bottom = 36
  const xMin = curve.x[0] ?? 0, xMax = curve.x.at(-1) ?? 1
  const yMax = Math.max(0.05, ...points.map(p => p.y), ...overlays.flatMap(o => o.y.filter(Number.isFinite)))
  const xAt = (x: number) => left + (x - xMin) / Math.max(1e-9, xMax - xMin) * (width - left - right)
  const yAt = (y: number) => plotHeight - bottom - y / yMax * (plotHeight - top - bottom)
  const fmt = (n: number) => Number.isFinite(n) ? Number(n.toPrecision(5)).toString() : '—'
  const selected = (x: number) => shade ? (shade.outside ? x <= Math.min(shade.lo, shade.hi) || x >= Math.max(shade.lo, shade.hi) : x >= Math.min(shade.lo, shade.hi) && x <= Math.max(shade.lo, shade.hi)) : highlightX !== undefined && Math.abs(x - highlightX) < 1e-9
  const path = (ps: typeof points) => ps.map((p, i) => `${i ? 'L' : 'M'} ${xAt(p.x)} ${yAt(p.y)}`).join(' ')
  const area = (ps: typeof points) => ps.length ? `M ${xAt(ps[0].x)} ${yAt(0)} ${ps.map(p => `L ${xAt(p.x)} ${yAt(p.y)}`).join(' ')} L ${xAt(ps.at(-1)!.x)} ${yAt(0)} Z` : ''
  const selectedRuns: (typeof points)[] = []
  points.forEach((p, i) => { if (selected(p.x)) { if (!i || !selected(points[i - 1].x)) selectedRuns.push([]); selectedRuns.at(-1)!.push(p) } })
  const inspected = points[Math.min(point, points.length - 1)]
  const label = `${dist.name} ${mode === 'cdf' ? 'CDF' : dist.family === 'discrete' ? 'PMF' : 'PDF'}`
  const download = () => {
    if (!svg.current) return
    const clone = svg.current.cloneNode(true) as SVGSVGElement
    const originals = [svg.current, ...svg.current.querySelectorAll('*')]
    const copies = [clone, ...clone.querySelectorAll('*')]
    originals.forEach((el, i) => {
      const computed = getComputedStyle(el)
      for (const prop of ['fill', 'stroke', 'color', 'stop-color', 'font-size', 'font-family']) copies[i].setAttribute(prop, computed.getPropertyValue(prop).replace(/url\([^#]*#([^)"]+)"?\)/g, 'url(#$1)'))
      copies[i].removeAttribute('class'); copies[i].removeAttribute('style')
    })
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', String(width)); clone.setAttribute('height', String(plotHeight))
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    background.setAttribute('width', String(width)); background.setAttribute('height', String(plotHeight)); background.setAttribute('fill', document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'); clone.prepend(background)
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }))
    const link = document.createElement('a'); link.href = url; link.download = `${dist.id}-${mode}.svg`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const renderPlot = (suffix: string) => <svg ref={suffix === 'main' ? svg : undefined} key={`${suffix}-${replay}`} viewBox={`0 0 ${width} ${plotHeight}`} className="dl-chart-in w-full" role="img" aria-label={label} onPointerMove={event => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = xMin + ((event.clientX - rect.left) / rect.width * width - left) / (width - left - right) * (xMax - xMin)
    let nearest = 0; points.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(points[nearest].x - x)) nearest = i }); setPoint(nearest); setInspecting(true)
  }}>
    <title>{label}</title><desc>Horizontal axis: outcome x. Vertical axis: {mode === 'cdf' ? 'cumulative probability' : 'probability density or mass'}. Inspect sampled values with the control below.</desc>
    <defs><linearGradient id={`${uid}-${suffix}-fill`} x2="0" y2="1"><stop stopColor="var(--dist-line)" stopOpacity=".3"/><stop offset="1" stopColor="var(--dist-line)" stopOpacity=".04"/></linearGradient><clipPath id={`${uid}-${suffix}-clip`}><rect x={left - 8} y={top - 8} width={width - left - right + 16} height={plotHeight - top - bottom + 8}/></clipPath></defs>
    {Array.from({ length: 5 }, (_, i) => <g key={i}>{ui.grid && <line x1={left} x2={width - right} y1={yAt(i * yMax / 4)} y2={yAt(i * yMax / 4)} stroke="currentColor" opacity=".15"/>}<text x={left - 6} y={yAt(i * yMax / 4) + 3} textAnchor="end" fill="currentColor" fontSize="10">{fmt(i * yMax / 4)}</text></g>)}
    {Array.from({ length: 6 }, (_, i) => <text key={i} x={xAt(xMin + i / 5 * (xMax - xMin))} y={plotHeight - 12} textAnchor="middle" fill="currentColor" fontSize="10">{fmt(xMin + i / 5 * (xMax - xMin))}</text>)}
    <g clipPath={`url(#${uid}-${suffix}-clip)`}>
      {curve.type === 'bar' ? points.map((p, i) => <rect key={i} className="dl-bar" style={{ animationDelay: `${Math.min(i * 18, 500)}ms` }} x={xAt(p.x) - Math.max(2, (width - left - right) / Math.max(points.length, 1) * .36)} y={yAt(p.y)} width={Math.max(4, (width - left - right) / Math.max(points.length, 1) * .72)} height={Math.max(0, yAt(0) - yAt(p.y))} rx="3" fill={selected(p.x) ? 'var(--dist-selection)' : 'var(--dist-line)'}><title>x = {fmt(p.x)}, value = {fmt(p.y)}{selected(p.x) ? ', selected event' : ''}</title></rect>) : <><path d={area(points)} fill={`url(#${uid}-${suffix}-fill)`}/>{selectedRuns.map((ps, i) => <path key={i} d={area(ps)} fill="var(--dist-selection)" opacity=".3"/>)}<path d={path(points)} className="dl-line" pathLength="1" strokeDasharray="1" fill="none" stroke="var(--dist-line)" strokeWidth="2.5"/></>}
      {overlays.map(o => <path key={o.label} d={path(o.x.map((x, i) => ({ x, y: o.y[i] })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)))} fill="none" stroke={o.color} strokeWidth="2" strokeDasharray={o.dash}/>)}
      {highlightX !== undefined && <line x1={xAt(highlightX)} x2={xAt(highlightX)} y1={top} y2={yAt(0)} stroke="currentColor" strokeDasharray="4 4"/>}
      {inspecting && inspected && <g><line x1={xAt(inspected.x)} x2={xAt(inspected.x)} y1={top} y2={yAt(0)} stroke="currentColor" strokeDasharray="3 3"/><circle cx={xAt(inspected.x)} cy={yAt(inspected.y)} r="4" fill="var(--dist-line)" stroke="currentColor"/></g>}
    </g>
  </svg>
  return <div ref={frame} className="dist-chart-frame" data-animation-visible={visible}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-bold">{label}</span><div className="flex gap-1"><button className="dist-ui-button" onClick={() => update({ grid: !ui.grid })} aria-pressed={ui.grid}>Grid</button><button className="dist-ui-button" onClick={() => dialog.current?.showModal()}>Expand chart</button><button className="dist-ui-button" onClick={download}>Save SVG</button></div></div>
    {renderPlot('main')}
    {inspecting && inspected && <p className="dist-chart-tooltip text-xs">x = {fmt(inspected.x)} · {mode === 'cdf' ? 'CDF' : 'Value'} = {fmt(inspected.y)}</p>}
    {ui.legend && <div className="flex flex-wrap gap-3 text-xs"><span style={{ color: 'var(--dist-line)' }}>● {label}</span>{shade && <span style={{ color: 'var(--dist-selection)' }}>■ Selected {shade.outside ? 'tails' : 'event'}</span>}{overlays.map(o => <span key={o.label} style={{ color: o.color }}>{o.dash ? '┄' : '━'} {o.label}</span>)}</div>}
    {points.length < curve.x.length && <p className="text-xs">Infinite endpoint densities are omitted from the plot; inspect nearby finite values.</p>}
    <details className="mt-2 text-xs"><summary className="cursor-pointer py-2">Inspect values & data</summary><label className="flex items-center gap-3">Chart point<input className="min-w-0 flex-1" type="range" min="0" max={Math.max(0, points.length - 1)} value={Math.min(point, Math.max(0, points.length - 1))} onChange={e => { setPoint(Number(e.target.value)); setInspecting(true) }}/></label><p aria-live="polite">x = {fmt(inspected?.x ?? NaN)} · {mode === 'cdf' ? 'CDF' : 'Value'} = {fmt(inspected?.y ?? NaN)} (sampled curve)</p><div className="max-h-48 overflow-auto"><table className="w-full text-right"><caption className="text-left">Plotted values · {points.length} points</caption><thead><tr><th scope="col">x</th><th scope="col">Value</th></tr></thead><tbody>{points.slice(Math.min(page, Math.max(0, Math.ceil(points.length / 20) - 1)) * 20, (Math.min(page, Math.max(0, Math.ceil(points.length / 20) - 1)) + 1) * 20).map((p, i) => <tr key={i}><td>{fmt(p.x)}</td><td>{fmt(p.y)}</td></tr>)}</tbody></table></div><div className="flex justify-between"><button className="dist-ui-button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous values</button><button className="dist-ui-button" disabled={(page + 1) * 20 >= points.length} onClick={() => setPage(p => p + 1)}>Next values</button></div></details>
    <dialog ref={dialog} className="dist-chart-dialog p-5" aria-labelledby={`${uid}-title`}><div className="flex items-center justify-between gap-3"><h2 id={`${uid}-title`} className="font-bold">{label}</h2><button autoFocus className="dist-ui-button" onClick={() => dialog.current?.close()}>Close chart</button></div>{renderPlot('expanded')}<p className="text-sm">Move over the curve to inspect it. Press Escape to close.</p>{inspecting && inspected && <p>x = {fmt(inspected.x)} · Value = {fmt(inspected.y)}</p>}</dialog>
  </div>
}
