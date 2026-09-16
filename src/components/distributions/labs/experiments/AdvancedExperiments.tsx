import { useMemo, useState } from 'react'
import { DistChart } from '../../DistChart'
import { DISTRIBUTION_BY_ID, curvePoints, generateSamples } from '../../../../lib/distributions'
import { EMPIRICAL_PRESETS as PRESETS } from '../../../../lib/distributionExperiences'
import { fmt, RunBtn, RunRow, StatGrid, type LabProps } from '../shared'

export function WeibullLifetimeLab({ dist, params, onParam, experience }: LabProps) {
  const [view, setView] = useState<'pdf' | 'surv' | 'haz'>('pdf')
  const k = params.shape
  const story = k < 1 ? 'Infant mortality — hazard falls' : k === 1 || Math.abs(k - 1) < 0.05 ? 'Random failures — exponential hazard' : 'Wear-out — hazard rises'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {experience.presets?.map((preset) => (
          <RunBtn key={preset.id} onClick={() => Object.entries(preset.params).forEach(([key, value]) => onParam(key, value))}>{preset.label}</RunBtn>
        ))}
      </div>
      <div className="flex gap-2">
        {(['pdf', 'surv', 'haz'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setView(item)} className={`min-h-10 rounded-full px-3 text-xs font-bold ${view === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{item === 'pdf' ? 'PDF' : item === 'surv' ? 'Survival' : 'Hazard'}</button>
        ))}
      </div>
      <p className="text-sm font-semibold text-amber-700">{story}</p>
      <div className="h-[200px]"><DistChart dist={dist} params={params} mode={view === 'surv' ? 'cdf' : 'density'} /></div>
      {view === 'haz' ? <p className="text-xs text-slate-500">{'Hazard h(t) = f(t) / S(t). For Weibull, h(t) ∝ t^{k−1}.'}</p> : null}
    </div>
  )
}

export function ParetoShareLab({ dist, params }: LabProps) {
  const [top, setTop] = useState(0.2)
  const samples = useMemo(() => generateSamples(dist, params, 400).filter((v): v is number => typeof v === 'number'), [dist, params])
  const sorted = [...samples].sort((a, b) => b - a)
  const total = sorted.reduce((s, v) => s + v, 0)
  const take = Math.max(1, Math.round(top * sorted.length))
  const share = total ? sorted.slice(0, take).reduce((s, v) => s + v, 0) / total : 0
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">Top {(top * 100).toFixed(0)}% of observations
        <input type="range" min={0.05} max={0.5} step={0.05} value={top} onChange={(e) => setTop(Number(e.target.value))} className="w-full accent-indigo-600" />
      </label>
      <p className="text-lg font-black text-indigo-700">own {fmt(share * 100, 1)}% of the total</p>
      <div className="h-[180px]"><DistChart dist={dist} params={params} /></div>
    </div>
  )
}

export function CauchyMeanLab({ dist, params }: LabProps) {
  const [path, setPath] = useState<{ n: number[]; cauchy: number[]; normal: number[] }>({ n: [], cauchy: [], normal: [] })
  const run = () => {
    const c: number[] = []
    const g: number[] = []
    let sc = 0
    let sg = 0
    const ns: number[] = []
    for (let i = 1; i <= 80; i++) {
      const cv = generateSamples(dist, params, 1)[0] as number
      const nv = generateSamples(DISTRIBUTION_BY_ID.normal, { mu: params.x0, sigma: params.gamma }, 1)[0] as number
      sc += cv
      sg += nv
      c.push(sc / i)
      g.push(sg / i)
      ns.push(i)
    }
    setPath({ n: ns, cauchy: c, normal: g })
  }
  return (
    <div className="space-y-3">
      <RunBtn primary onClick={run}>Running means: Cauchy vs Normal</RunBtn>
      <svg viewBox="0 0 320 120" className="h-36 w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
        {path.n.length > 1 ? (
          <>
            <polyline fill="none" stroke="#94a3b8" strokeWidth="2" points={path.n.map((n, i) => `${(n / 80) * 300 + 10},${60 - Math.max(-50, Math.min(50, path.normal[i] ?? 0))}`).join(' ')} />
            <polyline fill="none" stroke="#7c3aed" strokeWidth="2" points={path.n.map((n, i) => `${(n / 80) * 300 + 10},${60 - Math.max(-50, Math.min(50, path.cauchy[i] ?? 0))}`).join(' ')} />
          </>
        ) : null}
      </svg>
      <p className="text-xs text-slate-500">Grey: Normal mean settles. Violet: Cauchy mean keeps leaping. No finite expectation.</p>
      <div className="h-[140px]"><DistChart dist={dist} params={params} /></div>
    </div>
  )
}

export function LogisticThresholdLab({ dist, params }: LabProps) {
  const [score, setScore] = useState(params.mu)
  const p = dist.cdf(score, params)
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">Latent score {fmt(score)}
        <input type="range" min={params.mu - 6 * params.s} max={params.mu + 6 * params.s} step={0.05} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full accent-indigo-600" />
      </label>
      <p className="text-lg font-black">P(approve) = F(score) = {fmt(p, 3)}</p>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-indigo-500" style={{ width: `${p * 100}%` }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-[150px]"><DistChart dist={dist} params={params} highlightX={score} /></div>
        <div className="h-[150px]"><DistChart dist={dist} params={params} mode="cdf" highlightX={score} /></div>
      </div>
    </div>
  )
}

export function SkewSliderLab({ dist, params }: LabProps) {
  const overlay = useMemo(() => {
    const c = curvePoints(DISTRIBUTION_BY_ID.normal, { mu: params.xi ?? params.mu ?? 0, sigma: params.omega ?? params.sigma ?? 1 }, 'density')
    return [{ x: c.x, y: c.y, color: '#94a3b8', dash: '6 4', label: 'Normal' }]
  }, [params])
  const lean = params.alpha < -0.2 ? 'Left-skew' : params.alpha > 0.2 ? 'Right-skew' : 'Nearly normal'
  return (
    <div className="space-y-3">
      <p className="text-sm font-black">{lean} (α = {fmt(params.alpha, 2)})</p>
      <div className="h-[220px]"><DistChart dist={dist} params={params} overlays={overlay} /></div>
    </div>
  )
}

export function LaplaceLossLab({ dist, params }: LabProps) {
  const overlay = useMemo(() => {
    const c = curvePoints(DISTRIBUTION_BY_ID.normal, { mu: params.mu, sigma: params.b * Math.sqrt(2) }, 'density')
    return [{ x: c.x, y: c.y, color: '#94a3b8', dash: '6 4', label: 'Normal' }]
  }, [params])
  return (
    <div className="space-y-3">
      <p className="text-sm">Laplace (L1 / absolute error) vs Normal (L2 / squared error) with matched scale.</p>
      <div className="h-[210px]"><DistChart dist={dist} params={params} overlays={overlay} /></div>
      <StatGrid items={[['Laplace peak', 'sharp median'], ['Normal peak', 'rounded mean'], ['Tails', 'Laplace heavier']]} />
    </div>
  )
}

export function ExtremeValueLab({ dist, params }: LabProps) {
  const [maxima, setMaxima] = useState<number[]>([])
  const year = () => {
    const daily = Array.from({ length: 365 }, () => -Math.log(Math.random()) * 2)
    return Math.max(...daily)
  }
  const run = () => setMaxima(Array.from({ length: 40 }, year))
  return (
    <div className="space-y-3">
      <RunBtn primary onClick={run}>Simulate 40 years of daily rainfall, keep maxima</RunBtn>
      <p className="text-sm">Empirical mean of yearly maxima {fmt(mean(maxima))} · Gumbel location {fmt(params.mu)}</p>
      <div className="h-[200px]"><DistChart dist={dist} params={params} /></div>
    </div>
  )
}

export function FirstPassageLab({ dist, params }: LabProps) {
  const [hits, setHits] = useState<number[]>([])
  const [path, setPath] = useState<number[]>([])
  const run = () => {
    const mu = params.mu
    const steps = 80
    const walk: number[] = [0]
    let t = 0
    while (walk[walk.length - 1]! < 1 && t < 200) {
      walk.push(walk[walk.length - 1]! + mu / steps + (Math.random() - 0.45) * 0.12)
      t += 1
    }
    setPath(walk)
    setHits((prev) => [...prev, t * (mu / steps)])
  }
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 320 90" className="h-24 w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
        <line x1="8" x2="312" y1="16" y2="16" stroke="#fb7185" strokeDasharray="4 3" />
        {path.length > 1 ? <polyline fill="none" stroke="#6366f1" strokeWidth="2" points={path.map((y, i) => `${8 + (i / Math.max(path.length - 1, 1)) * 300},${80 - y * 60}`).join(' ')} /> : null}
      </svg>
      <RunRow>
        <RunBtn primary onClick={run}>Release a particle</RunBtn>
        <RunBtn onClick={() => { setHits([]); setPath([]) }}>Reset</RunBtn>
      </RunRow>
      <p className="text-xs text-slate-500">{hits.length} hitting times · last {fmt(hits[hits.length - 1] ?? NaN)} · theory mean μ = {fmt(params.mu)}</p>
      <div className="h-[150px]"><DistChart dist={dist} params={params} /></div>
    </div>
  )
}

export function StretchedBetaLab({ dist, params }: LabProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-slate-400">Beta on [0, 1]</p>
        <div className="h-[180px]"><DistChart dist={DISTRIBUTION_BY_ID.beta} params={{ alpha: params.alpha, beta: params.beta }} /></div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-slate-400">Stretched onto [{fmt(params.a)}, {fmt(params.b)}]</p>
        <div className="h-[180px]"><DistChart dist={dist} params={params} /></div>
      </div>
    </div>
  )
}

export function MixtureLab({ dist, params }: LabProps) {
  const overlays = useMemo(() => {
    const a = curvePoints(DISTRIBUTION_BY_ID.normal, { mu: params.mu1, sigma: params.s }, 'density')
    const b = curvePoints(DISTRIBUTION_BY_ID.normal, { mu: params.mu2, sigma: params.s }, 'density')
    return [
      { x: a.x, y: a.y.map((v) => v * params.pi), color: '#6366f1', label: 'Comp 1' },
      { x: b.x, y: b.y.map((v) => v * (1 - params.pi)), color: '#f59e0b', label: 'Comp 2' },
    ]
  }, [params])
  const gap = Math.abs(params.mu1 - params.mu2) / params.s
  const shape = gap < 1.2 ? 'Unimodal' : gap < 2.4 ? 'Shoulder' : 'Bimodal'
  return (
    <div className="space-y-3">
      <p className="text-sm font-black">{shape} mixture · Δμ/σ = {fmt(gap)}</p>
      <div className="h-[220px]"><DistChart dist={dist} params={params} overlays={overlays} /></div>
    </div>
  )
}

export function MultinomialLab({ dist, params, experience }: LabProps) {
  const labels = experience.categoryLabels ?? ['A', 'B', 'C']
  const [counts, setCounts] = useState([0, 0, 0])
  const assign = () => {
    const next = [0, 0, 0]
    const p3 = Math.max(0, 1 - params.p1 - params.p2)
    for (let i = 0; i < Math.round(params.n); i++) {
      const u = Math.random()
      next[u < params.p1 ? 0 : u < params.p1 + params.p2 ? 1 : 2] += 1
    }
    setCounts(next)
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {labels.map((label, i) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-950">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="text-2xl font-black">{counts[i]}</p>
          </div>
        ))}
      </div>
      <RunBtn primary onClick={assign}>Assign {Math.round(params.n)} customers</RunBtn>
      <div className="h-[160px]"><DistChart dist={dist} params={params} /></div>
    </div>
  )
}

export function DirichletSimplexLab({ dist, params, onParam, experience }: LabProps) {
  const [pts, setPts] = useState<Array<[number, number, number]>>([])
  const draw = (n = 40) => {
    const next: Array<[number, number, number]> = []
    for (let i = 0; i < n; i++) {
      const sample = dist.sample(params)
      if (Array.isArray(sample)) next.push([sample[0] ?? 0, sample[1] ?? 0, sample[2] ?? 0])
    }
    setPts(next)
  }
  const toXY = (p: [number, number, number]) => {
    const x = 0.5 * (2 * p[1] + p[2])
    const y = (Math.sqrt(3) / 2) * p[2]
    return { x: 20 + x * 260, y: 150 - y * 240 }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {experience.presets?.map((preset) => (
          <RunBtn key={preset.id} onClick={() => { Object.entries(preset.params).forEach(([k, v]) => onParam(k, v)); setPts([]) }}>{preset.label}</RunBtn>
        ))}
      </div>
      <svg viewBox="0 0 300 170" className="h-48 w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
        <polygon points="20,150 280,150 150,20" fill="none" stroke="#c7d2fe" strokeWidth="2" />
        {pts.map((p, i) => {
          const { x, y } = toXY(p)
          return <circle key={i} cx={x} cy={y} r="3.2" fill="#6366f1" opacity="0.75" />
        })}
      </svg>
      <RunRow>
        <RunBtn primary onClick={() => draw()}>Drop 40 compositions</RunBtn>
        <RunBtn onClick={() => setPts([])}>Clear</RunBtn>
      </RunRow>
    </div>
  )
}

export function EmpiricalFitLab({ dist }: LabProps) {
  const [key, setKey] = useState('exams')
  const data = PRESETS[key]?.values ?? PRESETS.exams.values
  const overlays = useMemo(() => {
    const ids = ['normal', 'lognormal', 'gamma', 'weibull'] as const
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899']
    return ids.map((id, i) => {
      const candidate = DISTRIBUTION_BY_ID[id]
      const fit = candidate.fit?.(data)
      if (!fit) return null
      const c = curvePoints(candidate, fit, 'density')
      return { x: c.x, y: c.y, color: colors[i]!, dash: '5 4', label: id }
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }, [data])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([id, preset]) => (
          <RunBtn key={id} primary={id === key} onClick={() => setKey(id)}>{preset.label}</RunBtn>
        ))}
      </div>
      <div className="h-[220px]"><DistChart dist={dist} params={{}} data={data} overlays={overlays} /></div>
      <p className="text-xs text-slate-500">Overlays are visual candidates only — not a formal proof of fit. n = {data.length}.</p>
    </div>
  )
}

function mean(values: number[]) {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : NaN
}
