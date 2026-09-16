import { useMemo, useState } from 'react'
import { DistChart } from '../DistChart'
import { generateSamples, type Distribution } from '../../../lib/distributions'
import type { SampleViz } from '../../../lib/distributionExperiences'
import { flatten, fmt, RunBtn, RunRow, StatGrid } from './shared'

export function SampleLab({
  dist,
  params,
  viz,
}: {
  dist: Distribution
  params: Record<string, number>
  viz: SampleViz
}) {
  const [draws, setDraws] = useState<Array<number | number[]>>(() => generateSamples(dist, params, 40))
  const values = useMemo(() => flatten(draws), [draws])
  const add = (n: number) => setDraws((prev) => [...prev, ...generateSamples(dist, params, n)])
  const mean = values.length ? values.reduce((s, v) => s + v, 0) / values.length : NaN
  const sd = values.length > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)) : NaN

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-black text-slate-950 dark:text-white">Sample laboratory</h3>
      <p className="text-xs text-slate-500">Draw from this family only. Visualization follows the experiment, not a generic template.</p>
      <div className="mt-3">
        <RunRow>
          {[1, 10, 100, 1000, 10000].map((n) => (
            <RunBtn key={n} onClick={() => add(n)} primary={n === 100}>{n.toLocaleString()}</RunBtn>
          ))}
          <RunBtn onClick={() => setDraws(generateSamples(dist, params, 40))}>Reset</RunBtn>
          <RunBtn onClick={() => setDraws(generateSamples(dist, params, 2000))}>Fast Generate</RunBtn>
        </RunRow>
      </div>
      <div className="mt-4">
        <StatGrid items={[['n', String(values.length)], ['Mean', fmt(mean)], ['SD', fmt(sd)], ['Last', fmt(values[values.length - 1] ?? NaN)]]} />
      </div>
      {viz === 'tokens' ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {values.slice(-60).map((value, i) => (
            <span key={`${value}-${i}`} className={`grid h-9 min-w-9 place-items-center rounded-lg text-[11px] font-black ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
              {dist.id === 'bernoulli' ? (value ? 'P' : 'F') : fmt(value, 1)}
            </span>
          ))}
        </div>
      ) : viz === 'simplex' ? (
        <SimplexDots draws={draws} />
      ) : viz === 'sequence' ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {values.slice(-40).map((value, i) => (
            <span key={i} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-700">{fmt(value, 0)}</span>
          ))}
        </div>
      ) : viz === 'failures' ? (
        <div className="mt-4 grid grid-cols-10 gap-1">
          {values.slice(-40).map((value, i) => (
            <span key={i} className="h-8 rounded-md bg-rose-400/80" style={{ opacity: Math.min(1, 0.25 + value / 20) }} title={fmt(value)} />
          ))}
        </div>
      ) : viz === 'particles' || viz === 'events' ? (
        <div className="mt-4 flex h-16 items-center gap-1 overflow-hidden rounded-2xl bg-slate-50 px-2 dark:bg-slate-950">
          {values.slice(-24).map((value, i) => (
            <span key={i} className="h-3 w-3 rounded-full bg-violet-400" style={{ opacity: 0.35 + Math.min(1, value / 8) * 0.6 }} />
          ))}
        </div>
      ) : (
        <div className="mt-4 h-[200px]">
          <DistChart dist={dist} params={params} />
        </div>
      )}
    </section>
  )
}

function SimplexDots({ draws }: { draws: Array<number | number[]> }) {
  const pts = draws
    .map((item) => (Array.isArray(item) ? item : null))
    .filter((item): item is number[] => item !== null && item.length >= 3)
    .slice(-80)
  const toXY = (p: number[]) => {
    const x = 0.5 * (2 * (p[1] ?? 0) + (p[2] ?? 0))
    const y = (Math.sqrt(3) / 2) * (p[2] ?? 0)
    return { x: 20 + x * 260, y: 150 - y * 240 }
  }
  return (
    <svg viewBox="0 0 300 170" className="mt-4 h-40 w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <polygon points="20,150 280,150 150,20" fill="none" stroke="#c7d2fe" strokeWidth="2" />
      {pts.map((p, i) => {
        const { x, y } = toXY(p)
        return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" opacity="0.75" />
      })}
    </svg>
  )
}
