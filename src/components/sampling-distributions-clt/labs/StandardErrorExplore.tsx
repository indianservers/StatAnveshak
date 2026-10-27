import { useMemo, useState, type CSSProperties } from 'react'
import { Calculator, Lightbulb, Play, RotateCcw, Sigma, Users } from 'lucide-react'
import { SamplingDistributionEngine, createPopulation } from '../../../lib/samplingDistributionsClt'
import { HistogramChart } from '../plots'
import { MathText } from '../../ui/MathText'

const OVERLAYS = [{ n: 10, color: '#8b53ff' }, { n: 50, color: '#2878ff' }, { n: 200, color: '#00b7a5' }]

function DensityComparison({ sigma }: { sigma: number }) {
  const w = 920, h = 320, left = 68, right = 906, top = 15, bottom = 267
  const span = Math.max(10, sigma)
  const x0 = 50 - span, x1 = 50 + span
  const ymax = Math.ceil((1 / (sigma / Math.sqrt(200) * Math.sqrt(2 * Math.PI))) * 10) / 10
  const sx = (x: number) => left + (x - x0) / (x1 - x0) * (right - left)
  const sy = (y: number) => bottom - y / ymax * (bottom - top)
  const xticks = Array.from({ length: 11 }, (_, i) => x0 + i * (x1 - x0) / 10)
  return <svg className="se-density" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Sampling distributions of the mean for sample sizes 10, 50, and 200">
    {Array.from({ length: 9 }, (_, i) => ymax * i / 8).map(y => <g key={y}><line x1={left} x2={right} y1={sy(y)} y2={sy(y)} stroke="#e9edf5" /><text x={left - 12} y={sy(y) + 4} textAnchor="end">{y.toFixed(2)}</text></g>)}
    {xticks.map(x => <g key={x}><line x1={sx(x)} x2={sx(x)} y1={top} y2={bottom} stroke="#e9edf5" /><text x={sx(x)} y={bottom + 25} textAnchor="middle">{Number(x.toFixed(1))}</text></g>)}
    {OVERLAYS.map(({ n, color }) => {
      const se = sigma / Math.sqrt(n)
      const points = Array.from({ length: 401 }, (_, i) => {
        const x = x0 + i / 400 * (x1 - x0)
        const density = Math.exp(-0.5 * ((x - 50) / se) ** 2) / (se * Math.sqrt(2 * Math.PI))
        return `${sx(x)},${sy(density)}`
      })
      return <g key={n}><path d={`M${sx(x0)},${bottom} L${points.join(' L')} L${sx(x1)},${bottom} Z`} fill={color} fillOpacity=".12" /><path d={`M${points.join(' L')}`} fill="none" stroke={color} strokeWidth="2.2" /></g>
    })}
    <line x1={sx(50)} x2={sx(50)} y1={top} y2={bottom} stroke="#526384" strokeDasharray="7 6" />
    <path d={`M${left},${top} V${bottom} H${right}`} fill="none" stroke="#7e889e" />
    <text x={(left + right) / 2} y={h - 10} textAnchor="middle">Sample mean (x̄)</text>
    <text transform={`translate(13 ${(top + bottom) / 2}) rotate(-90)`} textAnchor="middle">Probability density</text>
  </svg>
}

function Slider({ label, value, min, max, step = 1, ticks, color, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; ticks: number[]; color: string; onChange: (value: number) => void
}) {
  const progress = (value - min) / (max - min) * 100
  return <label className="se-slider" style={{ '--slider-color': color } as CSSProperties}>
    <span className="se-slider-title"><span>{label}</span><output>{value.toLocaleString()}</output></span>
    <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ background: `linear-gradient(to right,${color} ${progress}%,#dfe6f2 ${progress}%)` }} />
    <span className="se-ticks" aria-hidden>{ticks.map((tick, index) => <span key={tick} style={{ left: `${(tick - min) / (max - min) * 100}%`, transform: index === 0 ? 'none' : index === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{tick.toLocaleString()}</span>)}</span>
  </label>
}

export function StandardErrorExplore() {
  const [sigma, setSigma] = useState(10)
  const [n, setN] = useState(50)
  const [repetitions, setRepetitions] = useState(1000)
  const [seed, setSeed] = useState(31)
  const result = useMemo(() => {
    const population = createPopulation({ kind: 'normal', mu: 50, sigma })
    return new SamplingDistributionEngine({ seed }).simulate({ population, n, R: repetitions, statistic: 'mean', seed })
  }, [sigma, n, repetitions, seed])
  const se = sigma / Math.sqrt(n)
  const reset = () => { setSigma(10); setN(50); setRepetitions(1000); setSeed(31) }
  return <div className="se-layout">
    <section className="se-panel" aria-labelledby="se-distribution-heading">
      <div className="se-chart-heading">
        <div><h2 id="se-distribution-heading">Sampling distribution of the mean</h2><p>Sampling distributions for different sample sizes (population mean μ = 50, σ = {sigma}).</p></div>
        <div className="se-legend" aria-label="Sample size legend">{OVERLAYS.map(item => <span key={item.n}><i style={{ background: item.color }} />n = {item.n}</span>)}</div>
      </div>
      <DensityComparison sigma={sigma} />
      <div className="se-metrics" aria-live="polite">
        <div className="se-metric"><Users aria-hidden /><div><small>Sample size (n)</small><strong>{n}</strong></div></div>
        <div className="se-metric"><Sigma aria-hidden /><div><small>Population SD (σ)</small><strong>{sigma}</strong></div></div>
        <div className="se-metric"><Calculator aria-hidden /><div><small>Standard error (SE)</small><strong>{se.toFixed(2)}</strong></div><em>SE = σ / √n</em></div>
      </div>
      <section className="se-histogram" aria-label="Simulated sample means">
        <h3>Distribution of sample means (n = {n}, {result.R.toLocaleString()} samples)</h3>
        <div className="se-histogram-body">
          <HistogramChart bins={result.histogram} xDomain={[Math.min(40, result.histogram[0]?.x0 ?? 40), Math.max(60, result.histogram.at(-1)?.x1 ?? 60)]} height={145} xLabel="Sample mean (x̄)" yLabel="Frequency" ariaLabel="Distribution of simulated sample means" />
          <dl className="se-summary"><div><dt>Mean (x̄)</dt><dd>{result.empiricalMean.toFixed(2)}</dd></div><div><dt>SD (empirical)</dt><dd>{result.empiricalSd.toFixed(2)}</dd></div><div><dt>Theoretical SE</dt><dd>{se.toFixed(2)}</dd></div><div><dt>Samples</dt><dd>{result.R.toLocaleString()}</dd></div></dl>
        </div>
      </section>
    </section>
    <aside className="se-panel se-controls" aria-label="Simulation controls">
      <header><h2>Simulation controls</h2><button type="button" className="se-reset" onClick={reset}><RotateCcw size={16} aria-hidden />Reset</button></header>
      <Slider label="Population standard deviation (σ)" value={sigma} min={1} max={50} ticks={[1, 5, 10, 20, 50]} color="#6942ff" onChange={setSigma} />
      <Slider label="Sample size (n)" value={n} min={10} max={200} ticks={[10, 50, 100, 200]} color="#2878ff" onChange={setN} />
      <div className="se-presets" aria-label="Sample size presets">{[10, 50, 200].map(size => <button key={size} type="button" aria-pressed={n === size} onClick={() => setN(size)}>{size}</button>)}</div>
      <Slider label="Number of samples" value={repetitions} min={100} max={5000} step={100} ticks={[100, 500, 1000, 5000]} color="#8592ac" onChange={setRepetitions} />
      <button type="button" className="se-draw" onClick={() => setSeed(value => value + 1)}><Play size={22} fill="currentColor" aria-hidden />Draw samples</button>
      <section className="se-callout"><h3><Sigma size={21} aria-hidden />Formula for standard error</h3><div className="se-formula"><MathText value={'\\mathrm{SE}(\\bar{x})=\\frac{\\sigma}{\\sqrt{n}}'} label="SE of x bar equals sigma divided by square root of n" /><p>SE is the standard deviation of the sampling distribution of the mean.</p></div></section>
      <section className="se-callout se-insight"><h3><Lightbulb size={23} aria-hidden />Key insight</h3><strong>Larger samples give more precise estimates.</strong><p>As n increases, the standard error decreases, so the sampling distribution becomes narrower.</p></section>
    </aside>
  </div>
}
