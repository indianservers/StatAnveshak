import { useMemo, useState } from 'react'
import { DistChart } from '../DistChart'
import type { Distribution } from '../../../lib/distributions'
import { fmt } from './shared'

type DiscreteMode = 'eq' | 'le' | 'ge' | 'between'
type ContinuousMode = 'left' | 'right' | 'between' | 'two'

export function ProbabilityExplorer({ dist, params, data }: { dist: Distribution; params: Record<string, number>; data?: number[] }) {
  const discrete = dist.family === 'discrete' || dist.id === 'multinomial'
  const [dMode, setDMode] = useState<DiscreteMode>('eq')
  const [cMode, setCMode] = useState<ContinuousMode>('between')
  const [k, setK] = useState(2)
  const [a, setA] = useState(dist.family === 'continuous' ? -1 : 0)
  const [b, setB] = useState(dist.family === 'continuous' ? 1 : 3)

  const result = useMemo(() => {
    if (discrete) {
      const lo = Math.min(Math.round(a), Math.round(b))
      const hi = Math.max(Math.round(a), Math.round(b))
      const kk = Math.round(k)
      if (dMode === 'eq') return { p: dist.pdf(kk, params, data), shade: { lo: kk - 0.5, hi: kk + 0.5 }, label: `P(X = ${kk})` }
      if (dMode === 'le') return { p: dist.cdf(kk, params, data), shade: { lo: -1e9, hi: kk }, label: `P(X ≤ ${kk})` }
      if (dMode === 'ge') return { p: 1 - dist.cdf(kk - 1, params, data), shade: { lo: kk, hi: 1e9 }, label: `P(X ≥ ${kk})` }
      return { p: Math.max(0, dist.cdf(hi, params, data) - dist.cdf(lo - 1, params, data)), shade: { lo, hi }, label: `P(${lo} ≤ X ≤ ${hi})` }
    }
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    if (cMode === 'left') return { p: dist.cdf(hi, params, data), shade: { lo: -1e9, hi }, label: `P(X ≤ ${fmt(hi)})` }
    if (cMode === 'right') return { p: 1 - dist.cdf(lo, params, data), shade: { lo, hi: 1e9 }, label: `P(X ≥ ${fmt(lo)})` }
    if (cMode === 'two') {
      const p = dist.cdf(lo, params, data) + (1 - dist.cdf(hi, params, data))
      return { p, shade: { lo, hi }, label: `P(X ≤ ${fmt(lo)} or X ≥ ${fmt(hi)})` }
    }
    return { p: Math.max(0, dist.cdf(hi, params, data) - dist.cdf(lo, params, data)), shade: { lo, hi }, label: `P(${fmt(lo)} ≤ X ≤ ${hi})` }
  }, [a, b, cMode, dMode, data, discrete, dist, k, params])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-black text-slate-950 dark:text-white">Probability explorer</h3>
      <p className="text-xs text-slate-500">Shade a region. The number is the live {discrete ? 'PMF / CDF' : 'area under the density'}.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(discrete ? (['eq', 'le', 'ge', 'between'] as const) : (['left', 'right', 'between', 'two'] as const)).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => (discrete ? setDMode(mode as DiscreteMode) : setCMode(mode as ContinuousMode))}
            className={`min-h-10 rounded-full px-3 text-xs font-bold ${
              (discrete ? dMode : cMode) === mode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {discrete
              ? { eq: 'P(X = k)', le: 'P(X ≤ k)', ge: 'P(X ≥ k)', between: 'P(a ≤ X ≤ b)' }[mode as DiscreteMode]
              : { left: 'Left tail', right: 'Right tail', between: 'Between', two: 'Two tails' }[mode as ContinuousMode]}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {discrete && dMode !== 'between' ? (
          <NumberField label="k" value={k} onChange={setK} />
        ) : (
          <>
            <NumberField label={discrete ? 'a' : 'From'} value={a} onChange={setA} />
            <NumberField label={discrete ? 'b' : 'To'} value={b} onChange={setB} />
          </>
        )}
      </div>
      <div className="mt-3 h-[200px]">
        <DistChart dist={dist} params={params} data={data} shade={result.shade} highlightX={discrete && dMode === 'eq' ? Math.round(k) : undefined} />
      </div>
      <p className="mt-2 text-center text-sm font-black text-indigo-700 dark:text-indigo-300">
        {result.label} = {fmt(result.p, 4)}
      </p>
    </section>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-500">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  )
}
