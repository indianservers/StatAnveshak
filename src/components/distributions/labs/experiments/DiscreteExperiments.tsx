import { useEffect, useMemo, useState } from 'react'
import { DistChart } from '../../DistChart'
import { DISTRIBUTION_BY_ID, generateSamples } from '../../../../lib/distributions'
import { fmt, RunBtn, RunRow, StatGrid, type LabProps } from '../shared'

export function TokenTrialLab({ dist, params, experience }: LabProps) {
  const [success, setSuccess] = useState(0)
  const [fail, setFail] = useState(0)
  const [last, setLast] = useState<number | null>(null)
  const n = success + fail
  const emp = n ? success / n : NaN
  const run = (times: number) => {
    const draws = generateSamples(dist, params, times).filter((v): v is number => typeof v === 'number')
    let s = 0
    draws.forEach((v) => { if (v === 1) s += 1 })
    setSuccess((v) => v + s)
    setFail((v) => v + (draws.length - s))
    setLast(draws[draws.length - 1] ?? null)
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <OutcomeCard label={experience.successLabel ?? 'Success'} active={last === 1} tone="emerald" count={success} />
        <OutcomeCard label={experience.failureLabel ?? 'Failure'} active={last === 0} tone="rose" count={fail} />
      </div>
      <RunRow>
        {[1, 10, 100, 1000].map((n) => <RunBtn key={n} primary={n === 1} onClick={() => run(n)}>Run {n}</RunBtn>)}
        <RunBtn onClick={() => { setSuccess(0); setFail(0); setLast(null) }}>Reset</RunBtn>
      </RunRow>
      <StatGrid items={[
        ['Trials', String(n)],
        ['Empirical p̂', fmt(emp, 3)],
        ['Theoretical p', fmt(params.p, 3)],
        ['Gap |p̂ − p|', fmt(Math.abs((emp || 0) - params.p), 3)],
      ]} />
      <p className="text-xs text-slate-500">As n grows, p̂ should settle on p — that is the law of large numbers on a single coin.</p>
    </div>
  )
}

function OutcomeCard({ label, active, tone, count }: { label: string; active: boolean; tone: 'emerald' | 'rose'; count: number }) {
  const cls = tone === 'emerald' ? 'from-emerald-50 to-white border-emerald-200' : 'from-rose-50 to-white border-rose-200'
  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 text-center ${cls} ${active ? 'ring-2 ring-indigo-400' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-black text-slate-900">{count}</p>
    </div>
  )
}

export function DiscretePmfLab({ dist, params }: LabProps) {
  const [k, setK] = useState(Math.round(params.n ? params.n * (params.p ?? 0.5) : 3))
  const [mode, setMode] = useState<'eq' | 'le' | 'ge' | 'between'>('eq')
  const [b, setB] = useState(k + 2)
  const [emp, setEmp] = useState<number[]>([])
  const hi = Math.round(params.n ?? params.b ?? 6)
  const lo = Math.round(params.a ?? 0)
  const shade = mode === 'eq' ? { lo: k, hi: k } : mode === 'le' ? { lo, hi: k } : mode === 'ge' ? { lo: k, hi } : { lo: Math.min(k, b), hi: Math.max(k, b) }
  const simulate = () => {
    const draws = generateSamples(dist, params, 200).filter((v): v is number => typeof v === 'number')
    setEmp(draws)
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(['eq', 'le', 'ge', 'between'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={`min-h-10 rounded-full px-3 text-xs font-bold ${mode === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {item === 'eq' ? 'P(X = k)' : item === 'le' ? 'P(X ≤ k)' : item === 'ge' ? 'P(X ≥ k)' : 'P(a…b)'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-500">k<input type="number" value={k} onChange={(e) => setK(Number(e.target.value))} className="mt-1 min-h-10 w-full rounded-xl border px-3 font-bold dark:border-slate-700 dark:bg-slate-950" /></label>
        {mode === 'between' ? <label className="text-xs font-semibold text-slate-500">b<input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} className="mt-1 min-h-10 w-full rounded-xl border px-3 font-bold dark:border-slate-700 dark:bg-slate-950" /></label> : <div />}
      </div>
      <div className="h-[220px]"><DistChart dist={dist} params={params} shade={shade} highlightX={mode === 'eq' ? k : undefined} /></div>
      <RunRow>
        <RunBtn primary onClick={simulate}>{dist.id === 'discrete_uniform' ? 'Roll 200' : 'Simulate 200 batches'}</RunBtn>
      </RunRow>
      {emp.length ? <p className="text-xs text-slate-500">Empirical mean {fmt(emp.reduce((s, v) => s + v, 0) / emp.length)} vs theory {dist.expectedValue(params)}.</p> : null}
    </div>
  )
}

export function WaitingSequenceLab({ dist, params, experience }: LabProps) {
  const r = dist.id === 'negative_binomial' ? Math.round(params.r) : 1
  const [seq, setSeq] = useState<Array<0 | 1>>([])
  const run = () => {
    const next: Array<0 | 1> = []
    let ok = 0
    while (ok < r && next.length < 240) {
      const bit = Math.random() < params.p ? 1 : 0
      next.push(bit)
      if (bit) ok += 1
    }
    setSeq(next)
  }
  const successes = seq.filter((v) => v === 1).length
  const failures = seq.length - successes
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {r === 1 ? 'Stop at the FIRST success.' : `Keep going until success #${r}.`}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {seq.map((bit, i) => (
          <span key={i} className={`rounded-full px-2 py-1 text-[11px] font-black ${bit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
            {i + 1}. {bit ? experience.successLabel : experience.failureLabel}
          </span>
        ))}
      </div>
      <RunRow>
        <RunBtn primary onClick={run}>Simulate sequence</RunBtn>
        <RunBtn onClick={() => setSeq([])}>Reset</RunBtn>
      </RunRow>
      <StatGrid items={[['Trials', String(seq.length)], ['Successes', String(successes)], ['Failures', String(failures)], ['p', fmt(params.p)]]} />
      <div className="h-[180px]"><DistChart dist={dist} params={params} highlightX={dist.id === 'geometric' ? seq.length : failures} /></div>
    </div>
  )
}

export function WithoutReplacementLab({ dist, params }: LabProps) {
  const N = Math.round(params.N)
  const K = Math.round(params.K)
  const n = Math.round(params.n)
  const [lot, setLot] = useState<Array<'ok' | 'def'>>(() => lotOf(N, K))
  const [drawn, setDrawn] = useState<Array<'ok' | 'def'>>([])
  const remainingK = lot.filter((v) => v === 'def').length
  const remainingN = lot.length
  const drawOne = () => {
    if (drawn.length >= n || remainingN <= 0) return
    const index = Math.floor(Math.random() * lot.length)
    const item = lot[index]
    if (!item) return
    setLot((prev) => prev.filter((_, i) => i !== index))
    setDrawn((prev) => [...prev, item])
  }
  const drawAll = () => {
    const nextLot = [...lot]
    const nextDrawn = [...drawn]
    while (nextDrawn.length < n && nextLot.length > 0) {
      const index = Math.floor(Math.random() * nextLot.length)
      const item = nextLot.splice(index, 1)[0]
      if (item) nextDrawn.push(item)
    }
    setLot(nextLot)
    setDrawn(nextDrawn)
  }
  const reset = () => {
    setLot(lotOf(N, K))
    setDrawn([])
  }
  useEffect(() => {
    setLot(lotOf(N, K))
    setDrawn([])
  }, [N, K])
  return (
    <div className="space-y-3">
      <p className="text-sm font-black uppercase tracking-wide text-amber-600">Without replacement</p>
      <div className="flex flex-wrap gap-1">
        {lot.map((item, i) => (
          <span key={`${item}-${i}`} className={`h-4 w-4 rounded-sm ${item === 'def' ? 'bg-rose-400' : 'bg-sky-400'}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">Rose = defective still in the lot. Faded chips have been removed.</p>
      <div className="flex flex-wrap gap-1.5">
        {drawn.map((item, i) => (
          <span key={i} className={`rounded-full px-2 py-1 text-[11px] font-black ${item === 'def' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
            Draw {i + 1}: {item === 'def' ? 'defective' : 'ok'}
          </span>
        ))}
      </div>
      <RunRow>
        <RunBtn primary onClick={drawOne}>Draw one</RunBtn>
        <RunBtn onClick={drawAll}>Draw sample of n</RunBtn>
        <RunBtn onClick={reset}>Reset lot</RunBtn>
      </RunRow>
      <StatGrid items={[
        ['Remaining N', String(remainingN)],
        ['Remaining K', String(remainingK)],
        ['Defectives drawn', String(drawn.filter((v) => v === 'def').length)],
        ['P(next defective)', remainingN ? fmt(remainingK / remainingN) : '—'],
      ]} />
      <div className="h-[160px]"><DistChart dist={dist} params={params} highlightX={drawn.filter((v) => v === 'def').length} /></div>
    </div>
  )
}

export function PoissonTimelineLab({ dist, params, onParam, experience }: LabProps) {
  const [times, setTimes] = useState<number[]>(() => scatter(params.lambda))
  const resim = (lambda = params.lambda) => setTimes(scatter(lambda))
  return (
    <div className="space-y-3">
      {experience.presets ? (
        <div className="flex flex-wrap gap-2">
          {experience.presets.map((preset) => (
            <RunBtn key={preset.id} onClick={() => { Object.entries(preset.params).forEach(([k, v]) => onParam(k, v)); resim(preset.params.lambda) }}>{preset.label}</RunBtn>
          ))}
        </div>
      ) : null}
      <div className="relative h-16 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-x-3 top-1/2 h-px bg-slate-300" />
        {times.map((t, i) => (
          <span key={i} className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-violet-500" style={{ left: `${8 + t * 84}%` }} />
        ))}
      </div>
      <RunRow>
        <RunBtn primary onClick={() => resim()}>Simulate another 10 minutes</RunBtn>
      </RunRow>
      <StatGrid items={[['Arrivals', String(times.length)], ['Expected λ', fmt(params.lambda)], ['Gap', fmt(times.length ? 1 / times.length : 0)]]} />
      <div className="h-[180px]"><DistChart dist={dist} params={params} highlightX={times.length} /></div>
    </div>
  )
}

function lotOf(N: number, K: number): Array<'ok' | 'def'> {
  return Array.from({ length: N }, (_, i) => (i < K ? 'def' : 'ok'))
}

function scatter(lambda: number) {
  const n = Array.from({ length: 40 }, () => -Math.log(Math.random()) / Math.max(lambda, 0.05))
  const times: number[] = []
  let t = 0
  for (const wait of n) {
    t += wait
    if (t > 1) break
    times.push(t)
  }
  return times
}

export function ZeroInflationLab({ dist, params }: LabProps) {
  const [rows, setRows] = useState<Array<{ x: number; kind: 'struct' | 'count' }>>([])
  const run = (n = 80) => {
    const next: Array<{ x: number; kind: 'struct' | 'count' }> = []
    for (let i = 0; i < n; i++) {
      if (Math.random() < params.pi) next.push({ x: 0, kind: 'struct' })
      else {
        const draw = generateSamples(DISTRIBUTION_BY_ID[dist.id === 'zinb' ? 'negative_binomial' : 'poisson'], dist.id === 'zinb' ? { r: params.r, p: params.p } : { lambda: params.lambda }, 1)[0]
        next.push({ x: typeof draw === 'number' ? draw : 0, kind: 'count' })
      }
    }
    setRows(next)
  }
  const struct = rows.filter((r) => r.kind === 'struct').length
  const poisZero = rows.filter((r) => r.kind === 'count' && r.x === 0).length
  const overlay = useMemo(() => {
    const pois = DISTRIBUTION_BY_ID.poisson
    const c = Array.from({ length: 16 }, (_, k) => k)
    return [{ x: c, y: c.map((k) => pois.pdf(k, { lambda: params.lambda ?? 2 })), color: '#94a3b8', dash: '5 4', label: 'Poisson' }]
  }, [params.lambda])
  return (
    <div className="space-y-3">
      <RunRow>
        <RunBtn primary onClick={() => run()}>Simulate 80 days</RunBtn>
        <RunBtn onClick={() => setRows([])}>Reset</RunBtn>
      </RunRow>
      <div className="flex flex-wrap gap-1.5">
        {rows.slice(0, 48).map((row, i) => (
          <span key={i} className={`rounded-md px-2 py-1 text-[11px] font-black ${row.kind === 'struct' ? 'bg-amber-100 text-amber-800' : row.x === 0 ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
            {row.kind === 'struct' ? 'Structural 0' : row.x === 0 ? 'Count 0' : row.x}
          </span>
        ))}
      </div>
      <StatGrid items={[['Structural zeros', String(struct)], ['Process zeros', String(poisZero)], ['π', fmt(params.pi)], ['Mean count', fmt(rows.length ? rows.reduce((s, r) => s + r.x, 0) / rows.length : NaN)]]} />
      <div className="h-[180px]"><DistChart dist={dist} params={params} overlays={overlay} /></div>
    </div>
  )
}
