import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Studio, StudioLab } from '../../../lib/statisticsStudios'
import { labPath, studioPath } from '../../../lib/statisticsStudios'
import { fmt } from './format'

export function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-100">{title}</h2>{children}
  </section>
}

export function Slider({ label, value, min, max, step = 1, onChange, suffix = '' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; suffix?: string }) {
  return <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
    <span className="mb-1 flex justify-between gap-2"><span>{label}</span><output className="font-black tabular-nums text-indigo-700 dark:text-indigo-300">{value}{suffix}</output></span>
    <input className="w-full accent-indigo-600" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>
}

export function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>
}

export function Theory({ intuition, formula, assumptions, caution }: { intuition: string; formula: string; assumptions: string; caution: string }) {
  return <Card title="Why it works"><dl className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
    <div><dt className="font-bold text-slate-900 dark:text-white">Idea</dt><dd>{intuition}</dd></div>
    <div><dt className="font-bold text-slate-900 dark:text-white">Calculation</dt><dd className="font-mono text-xs sm:text-sm">{formula}</dd></div>
    <div><dt className="font-bold text-slate-900 dark:text-white">When to use it</dt><dd>{assumptions}</dd></div>
    <div><dt className="font-bold text-slate-900 dark:text-white">Watch out</dt><dd>{caution}</dd></div>
  </dl></Card>
}

export type Series = { name: string; points: Array<{ x: number; y: number }>; color?: string; dashed?: boolean }
export function LineChart({ series, markers = [], xLabel, yLabel, summary, yMin, yMax }: { series: Series[]; markers?: Array<{ x: number; label: string; color?: string }>; xLabel: string; yLabel: string; summary: string; yMin?: number; yMax?: number }) {
  const points = series.flatMap((item) => item.points)
  const xs = points.map((point) => point.x).concat(markers.map((marker) => marker.x))
  const ys = points.map((point) => point.y)
  const loX = Math.min(...xs)
  const hiX = Math.max(...xs)
  const loY = yMin ?? Math.min(0, ...ys)
  const hiY = yMax ?? Math.max(...ys) * 1.08
  const x = (value: number) => 58 + (value - loX) / Math.max(1e-9, hiX - loX) * 508
  const y = (value: number) => 236 - (value - loY) / Math.max(1e-9, hiY - loY) * 192
  return <div><svg role="img" aria-label={summary} viewBox="0 0 620 286" className="w-full">
    {[0, 0.25, 0.5, 0.75, 1].map((fraction) => <g key={fraction}><line x1="58" x2="566" y1={236 - fraction * 192} y2={236 - fraction * 192} stroke="#e2e8f0" /><text x="51" y={240 - fraction * 192} textAnchor="end" fontSize="10" fill="#64748b">{fmt(loY + (hiY - loY) * fraction, 1)}</text></g>)}
    <line x1="58" x2="566" y1="236" y2="236" stroke="#64748b" /><line x1="58" x2="58" y1="44" y2="236" stroke="#64748b" />
    {series.map((item, index) => <polyline key={item.name} points={item.points.map((point) => `${x(point.x)},${y(point.y)}`).join(' ')} fill="none" stroke={item.color ?? ['#4f46e5', '#ea580c', '#16a34a', '#c026d3'][index % 4]} strokeWidth="3" strokeDasharray={item.dashed ? '5 4' : undefined}><title>{item.name}</title></polyline>)}
    {markers.map((marker, index) => <g key={`${marker.label}-${index}`}><line x1={x(marker.x)} x2={x(marker.x)} y1="42" y2="236" stroke={marker.color ?? '#e11d48'} strokeWidth="2" strokeDasharray="5 4" /><text x={Math.min(510, x(marker.x) + 4)} y={56 + index * 15} fontSize="11" fill={marker.color ?? '#be123c'}>{marker.label}</text></g>)}
    <text x="312" y="275" textAnchor="middle" fontSize="12" fill="#64748b">{xLabel} · {fmt(loX, 1)} to {fmt(hiX, 1)}</text><text x="8" y="24" fontSize="12" fill="#64748b">{yLabel}</text>
  </svg><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{series.map((item, index) => <span key={item.name} className="flex items-center gap-1"><span className="h-1 w-5 rounded" style={{ backgroundColor: item.color ?? ['#4f46e5', '#ea580c', '#16a34a', '#c026d3'][index % 4] }} />{item.name}</span>)}</div></div>
}

export function BarChart({ values, labels, summary, color = '#4f46e5', max }: { values: number[]; labels: string[]; summary: string; color?: string; max?: number }) {
  const high = max ?? Math.max(1, ...values)
  const band = 510 / values.length
  return <svg role="img" aria-label={summary} viewBox="0 0 620 270" className="w-full"><line x1="55" x2="570" y1="220" y2="220" stroke="#94a3b8" />{values.map((value, index) => <g key={index}><rect x={60 + index * band} y={220 - value / high * 170} width={Math.max(5, band - 8)} height={Math.max(0, value / high * 170)} rx="3" fill={color} opacity="0.82"><title>{labels[index]}: {fmt(value, 2)}</title></rect><text x={60 + index * band + (band - 8) / 2} y="237" textAnchor="middle" fontSize="10" fill="#64748b">{labels[index]}</text></g>)}</svg>
}

export function ScatterChart({ points, ellipse, axes = [], summary, selected, onSelect }: { points: Array<{ x: number; y: number; label?: string }>; ellipse?: { cx: number; cy: number; rx: number; ry: number; angle: number }; axes?: Array<{ x2: number; y2: number; color: string; label: string }>; summary: string; selected?: number; onSelect?: (index: number) => void }) {
  const maxX = Math.max(2.5, ...points.map((point) => Math.abs(point.x)), ...axes.map((axis) => Math.abs(axis.x2)), ellipse ? Math.abs(ellipse.cx) + ellipse.rx + ellipse.ry : 0)
  const maxY = Math.max(2.2, ...points.map((point) => Math.abs(point.y)), ...axes.map((axis) => Math.abs(axis.y2)), ellipse ? Math.abs(ellipse.cy) + ellipse.rx + ellipse.ry : 0)
  const scale = Math.min(48, 250 / maxX, 108 / maxY)
  const x = (value: number) => 310 + value * scale
  const y = (value: number) => 145 - value * scale
  return <svg role="img" aria-label={summary} viewBox="0 0 620 300" className="w-full"><line x1="30" x2="590" y1="145" y2="145" stroke="#cbd5e1" /><line x1="310" x2="310" y1="20" y2="270" stroke="#cbd5e1" />
    {ellipse && <ellipse cx={x(ellipse.cx)} cy={y(ellipse.cy)} rx={ellipse.rx * scale} ry={ellipse.ry * scale} transform={`rotate(${-ellipse.angle} ${x(ellipse.cx)} ${y(ellipse.cy)})`} fill="#ddd6fe" fillOpacity="0.35" stroke="#7c3aed" strokeWidth="2" />}
    {axes.map((axis) => <g key={axis.label}><line x1="310" y1="145" x2={x(axis.x2)} y2={y(axis.y2)} stroke={axis.color} strokeWidth="3" /><text x={x(axis.x2) + 4} y={y(axis.y2) - 4} fontSize="11" fill={axis.color}>{axis.label}</text></g>)}
    {points.map((point, index) => <circle key={index} cx={x(point.x)} cy={y(point.y)} r={selected === index ? 8 : 5} fill={selected === index ? '#e11d48' : '#6366f1'} opacity="0.8" className={onSelect ? 'cursor-pointer' : undefined} onClick={() => onSelect?.(index)}><title>{point.label ?? `Point ${index + 1}: (${fmt(point.x)}, ${fmt(point.y)})`}</title></circle>)}<text x="560" y="165" fontSize="11" fill="#64748b">X</text><text x="318" y="28" fontSize="11" fill="#64748b">Y</text></svg>
}

export function LabShell({ studio, lab, children }: { studio: Studio; lab: StudioLab; children: ReactNode }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  const previous = studio.labs[index - 1]
  const next = studio.labs[index + 1]
  return <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1200px] flex-col gap-5">
    <nav className="flex flex-wrap items-center justify-between gap-2 text-sm"><Link to={studioPath(studio)} className="font-bold text-indigo-700 dark:text-indigo-300">← {studio.title}</Link><span className="text-slate-500">Lab {index + 1} of {studio.labs.length}</span></nav>
    <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5 dark:border-indigo-950 dark:from-indigo-950/30 dark:to-slate-900"><p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Interactive lab · {studio.title}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{lab.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{lab.summary}</p></header>
    {children}
    <nav aria-label="Lab navigation" className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800"><Link to={previous ? labPath(studio.slug, previous.slug) : studioPath(studio)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"><ArrowLeft size={15} /> {previous?.title ?? 'Studio home'}</Link>{next && <Link to={labPath(studio.slug, next.slug)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white">{next.title} <ArrowRight size={15} /></Link>}</nav>
  </div></main>
}
