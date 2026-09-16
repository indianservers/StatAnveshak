import { useMemo, useState } from 'react'
import { DistChart } from '../../DistChart'
import { DISTRIBUTION_BY_ID, curvePoints, generateSamples } from '../../../../lib/distributions'
import { fmt, RunBtn, RunRow, StatGrid, type LabProps } from '../shared'

export function IntervalAreaLab({ dist, params }: LabProps) {
  const [lo, setLo] = useState(params.a + (params.b - params.a) * 0.25)
  const [hi, setHi] = useState(params.a + (params.b - params.a) * 0.7)
  const width = Math.max(0, Math.min(params.b, hi) - Math.max(params.a, lo))
  const area = width / Math.max(1e-9, params.b - params.a)
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">Probability is the shaded rectangle — width times height 1/(b−a).</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold">From {fmt(lo)}<input type="range" min={params.a} max={params.b} step={0.05} value={lo} onChange={(e) => setLo(Number(e.target.value))} className="w-full accent-indigo-600" /></label>
        <label className="text-xs font-semibold">To {fmt(hi)}<input type="range" min={params.a} max={params.b} step={0.05} value={hi} onChange={(e) => setHi(Number(e.target.value))} className="w-full accent-indigo-600" /></label>
      </div>
      <div className="h-[200px]"><DistChart dist={dist} params={params} shade={{ lo: Math.min(lo, hi), hi: Math.max(lo, hi) }} /></div>
      <StatGrid items={[['Width', fmt(width)], ['Height 1/(b−a)', fmt(1 / (params.b - params.a))], ['Area = P', fmt(area, 4)]]} />
    </div>
  )
}

export function BellRuleLab({ dist, params }: LabProps) {
  const [rule, setRule] = useState(true)
  const [samples, setSamples] = useState<number[]>([])
  const bands = [1, 2, 3].map((k) => ({ lo: params.mu - k * params.sigma, hi: params.mu + k * params.sigma }))
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={rule} onChange={(e) => setRule(e.target.checked)} /> Show 68–95–99.7 bands
      </label>
      <div className="h-[220px]"><DistChart dist={dist} params={params} shade={rule ? bands[0] : undefined} /></div>
      {rule ? <p className="text-xs text-slate-500">±1σ ≈ 68%, ±2σ ≈ 95%, ±3σ ≈ 99.7%. Markers at {bands.map((b) => `${fmt(b.lo)}…${fmt(b.hi)}`).join(' · ')}</p> : null}
      <RunRow>
        <RunBtn primary onClick={() => setSamples(generateSamples(dist, params, 80).filter((v): v is number => typeof v === 'number'))}>Overlay 80 heights</RunBtn>
      </RunRow>
      {samples.length ? <p className="text-xs text-slate-500">Sample mean {fmt(samples.reduce((s, v) => s + v, 0) / samples.length)} vs μ = {fmt(params.mu)}.</p> : null}
    </div>
  )
}

export function ZScoreLab({ dist, params, onParam }: LabProps) {
  const [raw, setRaw] = useState(115)
  const [mu, setMu] = useState(100)
  const [sigma, setSigma] = useState(15)
  const [mode, setMode] = useState<'left' | 'right' | 'between' | 'two'>('left')
  const z = (raw - mu) / Math.max(sigma, 1e-9)
  const p = mode === 'left' ? dist.cdf(z, params) : mode === 'right' ? 1 - dist.cdf(z, params) : mode === 'two' ? 2 * (1 - dist.cdf(Math.abs(z), params)) : dist.cdf(Math.abs(z), params) - dist.cdf(-Math.abs(z), params)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Num label="Raw score" value={raw} onChange={setRaw} />
        <Num label="Mean μ" value={mu} onChange={(v) => { setMu(v); onParam('mu', 0) }} />
        <Num label="SD σ" value={sigma} onChange={setSigma} />
      </div>
      <p className="rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-black text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">z = ({fmt(raw)} − {fmt(mu)}) / {fmt(sigma)} = {fmt(z, 3)}</p>
      <div className="flex flex-wrap gap-2">
        {(['left', 'right', 'between', 'two'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={`min-h-10 rounded-full px-3 text-xs font-bold ${mode === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{item}</button>
        ))}
      </div>
      <div className="h-[200px]"><DistChart dist={dist} params={params} highlightX={z} shade={mode === 'left' ? { lo: -8, hi: z } : mode === 'right' ? { lo: z, hi: 8 } : { lo: -Math.abs(z), hi: Math.abs(z) }} /></div>
      <p className="text-center text-sm font-black text-indigo-700">Probability = {fmt(p, 4)}</p>
    </div>
  )
}

export function LogTransformLab({ dist, params }: LabProps) {
  const [space, setSpace] = useState<'x' | 'log'>('x')
  const samples = useMemo(() => generateSamples(dist, params, 60).filter((v): v is number => typeof v === 'number' && v > 0), [dist, params])
  const logs = samples.map(Math.log)
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <RunBtn primary={space === 'x'} onClick={() => setSpace('x')}>X space (skewed)</RunBtn>
        <RunBtn primary={space === 'log'} onClick={() => setSpace('log')}>ln(X) space</RunBtn>
      </div>
      <div className="h-[210px]">
        {space === 'x' ? <DistChart dist={dist} params={params} /> : <DistChart dist={DISTRIBUTION_BY_ID.normal} params={{ mu: params.mu, sigma: params.sigma }} />}
      </div>
      <p className="text-xs text-slate-500">
        {space === 'x'
          ? `Raw spend is right-skewed. Sample median ${fmt(quantile(samples, 0.5))} vs mean ${fmt(mean(samples))}.`
          : `ln(X) looks normal. Mean of logs ${fmt(mean(logs))} (parameter μ = ${fmt(params.mu)}).`}
      </p>
    </div>
  )
}

export function MemorylessLab({ dist, params }: LabProps) {
  const [survived, setSurvived] = useState(5)
  const remaining = useMemo(() => {
    const draws = generateSamples(dist, params, 400).filter((v): v is number => typeof v === 'number')
    return draws.filter((v) => v > survived).map((v) => v - survived)
  }, [dist, params, survived])
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">Already survived {fmt(survived)} hours
        <input type="range" min={0} max={8} step={0.1} value={survived} onChange={(e) => setSurvived(Number(e.target.value))} className="w-full accent-indigo-600" />
      </label>
      <div className="h-[200px]"><DistChart dist={dist} params={params} shade={{ lo: 0, hi: survived }} /></div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Remaining waits after {fmt(survived)} still have mean {fmt(mean(remaining) || 1 / params.lambda)} — same as a fresh exponential with mean 1/λ = {fmt(1 / params.lambda)}.
      </p>
    </div>
  )
}

export function SumOfWaitsLab({ dist, params }: LabProps) {
  const k = Math.max(1, Math.round(params.shape))
  const [parts, setParts] = useState<number[]>([])
  const draw = () => {
    const waits = Array.from({ length: k }, () => -Math.log(Math.random()) * params.scale)
    setParts(waits)
  }
  const total = parts.reduce((s, v) => s + v, 0)
  return (
    <div className="space-y-3">
      <p className="text-sm">Integer shape k = {k}: stack {k} exponential waits (scale θ = {fmt(params.scale)}).</p>
      <div className="flex h-10 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        {parts.map((w, i) => (
          <div key={i} className="grid place-items-center text-[10px] font-bold text-white" style={{ width: `${(w / Math.max(total, 0.01)) * 100}%`, background: i % 2 ? '#6366f1' : '#8b5cf6' }}>{fmt(w, 2)}</div>
        ))}
      </div>
      <RunRow>
        <RunBtn primary onClick={draw}>Sum k exponentials</RunBtn>
      </RunRow>
      <StatGrid items={[['T = sum', fmt(total)], ['Theory mean kθ', fmt(params.shape * params.scale)], ['Pieces', String(parts.length)]]} />
      <div className="h-[160px]"><DistChart dist={dist} params={params} highlightX={total || undefined} /></div>
    </div>
  )
}

export function BayesianBetaLab({ dist, params, onParam }: LabProps) {
  const [success, setSuccess] = useState(6)
  const [fail, setFail] = useState(4)
  const prior = { alpha: params.alpha, beta: params.beta }
  const post = { alpha: params.alpha + success, beta: params.beta + fail }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Num label="Observed successes" value={success} onChange={setSuccess} />
        <Num label="Observed failures" value={fail} onChange={setFail} />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Prior Beta({fmt(prior.alpha, 1)}, {fmt(prior.beta, 1)}) → data {success}/{success + fail} → Posterior Beta({fmt(post.alpha, 1)}, {fmt(post.beta, 1)})</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-[160px]"><DistChart dist={dist} params={prior} /></div>
        <div className="h-[160px]"><DistChart dist={dist} params={post} /></div>
      </div>
      <RunBtn onClick={() => { onParam('alpha', post.alpha); onParam('beta', post.beta) }}>Use posterior as next prior</RunBtn>
    </div>
  )
}

export function ChiSquareSquaresLab({ dist, params }: LabProps) {
  const df = Math.round(params.df)
  const [zs, setZs] = useState<number[]>([])
  const draw = () => {
    const next = Array.from({ length: df }, () => {
      const u = Math.random()
      const v = Math.random()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    })
    setZs(next)
  }
  const total = zs.reduce((s, z) => s + z * z, 0)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {zs.map((z, i) => (
          <span key={i} className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700">Z{i + 1}² = {fmt(z * z)}</span>
        ))}
      </div>
      <RunRow>
        <RunBtn primary onClick={draw}>Draw {df} standard normals and square</RunBtn>
      </RunRow>
      <p className="text-sm font-black">χ² = {fmt(total)} (df = {df})</p>
      <div className="h-[180px]"><DistChart dist={dist} params={params} shade={{ lo: dist.inv(0.95, params), hi: 1e9 }} highlightX={total || undefined} /></div>
      <p className="text-xs text-slate-500">Shaded: 5% right-tail rejection region.</p>
    </div>
  )
}

export function TailCompareLab({ dist, params }: LabProps) {
  const normal = DISTRIBUTION_BY_ID.normal
  const overlay = useMemo(() => {
    const c = curvePoints(normal, { mu: 0, sigma: 1 }, 'density')
    return [{ x: c.x, y: c.y, color: '#94a3b8', dash: '6 4', label: 'N(0,1)' }]
  }, [normal])
  return (
    <div className="space-y-3">
      <p className="text-sm">Student t (ν = {Math.round(params.df)}) vs standard normal. Raise df and the extra tails shrink.</p>
      <div className="h-[220px]"><DistChart dist={dist} params={params} overlays={overlay} /></div>
      <p className="text-xs text-slate-500">At ν = 1 this is Cauchy-like; as ν → ∞ the overlay and the t curve coincide.</p>
    </div>
  )
}

export function VarianceRatioLab({ dist, params }: LabProps) {
  const [ratio, setRatio] = useState<number | null>(null)
  const run = () => {
    const a = generateSamples(DISTRIBUTION_BY_ID.normal, { mu: 0, sigma: 1 }, Math.round(params.df1) + 1).filter((v): v is number => typeof v === 'number')
    const b = generateSamples(DISTRIBUTION_BY_ID.normal, { mu: 0, sigma: 1 }, Math.round(params.df2) + 1).filter((v): v is number => typeof v === 'number')
    setRatio(sampleVar(a) / Math.max(sampleVar(b), 1e-9))
  }
  return (
    <div className="space-y-3">
      <RunBtn primary onClick={run}>Draw two samples and form s₁² / s₂²</RunBtn>
      {ratio !== null ? <p className="text-lg font-black">F = {fmt(ratio)}</p> : null}
      <div className="h-[200px]"><DistChart dist={dist} params={params} highlightX={ratio ?? undefined} /></div>
    </div>
  )
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-500">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 min-h-10 w-full rounded-xl border px-2 font-bold dark:border-slate-700 dark:bg-slate-950" />
    </label>
  )
}

function mean(values: number[]) {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : NaN
}
function quantile(values: number[], q: number) {
  if (!values.length) return NaN
  const s = [...values].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? NaN
}
function sampleVar(values: number[]) {
  const m = mean(values)
  return values.length < 2 ? 0 : values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1)
}
