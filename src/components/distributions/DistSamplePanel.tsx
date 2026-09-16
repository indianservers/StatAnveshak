import { useMemo, useState } from 'react'
import { Download, Play, RotateCcw } from 'lucide-react'
import { DistChart } from './DistChart'
import {
  generateSamples,
  type Distribution,
} from '../../lib/distributions'

const fmt = (value: number, digits = 3) => {
  if (!Number.isFinite(value)) return '—'
  return Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)
    ? value.toExponential(2)
    : value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function flattenDraws(draws: Array<number | number[]>) {
  return draws.flatMap((item) => (Array.isArray(item) ? item : [item])).filter((value) => Number.isFinite(value))
}

function summarize(values: number[]) {
  if (values.length === 0) {
    return { n: 0, mean: NaN, sd: NaN, min: NaN, max: NaN, median: NaN }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((sum, value) => sum + value, 0) / n
  const variance = n < 2 ? 0 : sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1)
  const mid = Math.floor(n / 2)
  const median = n % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
  return { n, mean, sd: Math.sqrt(variance), min: sorted[0]!, max: sorted[n - 1]!, median }
}

function histogram(values: number[], bins = 14) {
  if (values.length === 0) return [] as Array<{ x: number; y: number }>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = max === min ? 1 : (max - min) / bins
  const counts = Array.from({ length: bins }, () => 0)
  for (const value of values) {
    const index = Math.min(bins - 1, Math.floor((value - min) / width))
    counts[index] += 1
  }
  return counts.map((count, index) => ({
    x: min + (index + 0.5) * width,
    y: count / values.length,
  }))
}

export function DistSamplePanel({
  dist,
  params,
}: {
  dist: Distribution
  params: Record<string, number>
}) {
  const [count, setCount] = useState(120)
  const [draws, setDraws] = useState<Array<number | number[]>>(() => generateSamples(dist, params, 120))
  const values = useMemo(() => flattenDraws(draws), [draws])
  const stats = useMemo(() => summarize(values), [values])
  const bins = useMemo(() => histogram(values, dist.family === 'discrete' ? Math.min(16, Math.max(4, new Set(values.map(Math.round)).size)) : 14), [dist.family, values])

  const draw = (next = count) => {
    setDraws(generateSamples(dist, params, Math.round(next)))
  }

  const copyCsv = async () => {
    const rows = draws.map((item, index) => {
      const cells = Array.isArray(item) ? item.map((value) => fmt(value, 6)) : [fmt(item, 6)]
      return [String(index + 1), ...cells].join(',')
    })
    const header = draws.some((item) => Array.isArray(item))
      ? ['i', ...Array.from({ length: Math.max(0, ...(draws.map((item) => Array.isArray(item) ? item.length : 1))) }, (_, i) => `x${i + 1}`)].join(',')
      : 'i,x'
    await navigator.clipboard.writeText([header, ...rows].join('\n'))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-black text-slate-950 dark:text-white">Draw a sample</h2>
        <p className="mt-1 text-xs text-slate-500">Simulate from the current parameters. The histogram updates live.</p>
        <label className="mt-4 block">
          <span className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
            Sample size
            <input
              type="number"
              min={10}
              max={2000}
              step={10}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
            />
          </span>
          <input type="range" min={10} max={2000} step={10} value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full accent-indigo-600" />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => draw()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700">
            <Play size={15} fill="currentColor" /> Draw sample
          </button>
          <button type="button" onClick={() => draw(count)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            <RotateCcw size={15} /> Redraw
          </button>
          <button type="button" onClick={() => void copyCsv()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            <Download size={15} /> Copy CSV
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            ['n', String(stats.n)],
            ['Mean', fmt(stats.mean)],
            ['SD', fmt(stats.sd)],
            ['Median', fmt(stats.median)],
            ['Min', fmt(stats.min)],
            ['Max', fmt(stats.max)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
              <dd className="text-sm font-black text-slate-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {values.slice(-18).map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="dl-chip rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200"
              style={{ animationDelay: `${index * 28}ms` }}
            >
              {fmt(value, 2)}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-black text-slate-950 dark:text-white">Sample vs model</h2>
        <p className="mt-1 text-xs text-slate-500">Bars are the sample. The curve is the theoretical {dist.family === 'discrete' ? 'PMF' : 'PDF'}.</p>
        <div className="mt-3 h-[220px]">
          <DistChart
            dist={dist}
            params={params}
            mode="density"
            overlays={bins.length > 1 ? [{ x: bins.map((bin) => bin.x), y: bins.map((bin) => bin.y), color: '#34d399', label: 'Sample' }] : []}
          />
        </div>
        <div className="mt-3 max-h-48 overflow-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-3 py-2 font-bold text-slate-500">#</th>
                {draws.some((item) => Array.isArray(item))
                  ? Array.from({ length: Math.max(1, ...draws.map((item) => Array.isArray(item) ? item.length : 1)) }, (_, i) => (
                    <th key={i} className="px-3 py-2 font-bold text-slate-500">x{i + 1}</th>
                  ))
                  : <th className="px-3 py-2 font-bold text-slate-500">Value</th>}
              </tr>
            </thead>
            <tbody>
              {draws.slice(0, 40).map((item, index) => (
                <tr key={index} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5 font-semibold text-slate-400">{index + 1}</td>
                  {(Array.isArray(item) ? item : [item]).map((value, cell) => (
                    <td key={cell} className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">{fmt(value, 4)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {draws.length > 40 ? <p className="mt-2 text-[11px] text-slate-400">Showing first 40 of {draws.length} draws.</p> : null}
      </section>
    </div>
  )
}
