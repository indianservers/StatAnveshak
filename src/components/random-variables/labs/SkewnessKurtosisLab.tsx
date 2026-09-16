import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  formatFixed,
  integrate,
  linspace,
  markRvLabComplete,
  normalPdf,
  skewNormalPdf,
  studentTPdf,
} from '../../../lib/randomVariables'
import { PDFPlot } from '../plots'
import { ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSlider } from '../shared'

type Shape = 'normal' | 'right' | 'left' | 'high-k' | 'low-k'

const CONCEPTS = [
  { id: 'skew', title: 'Skewness', detail: 'Skewness measures the asymmetry of a distribution. Positive skew means a long right tail; negative skew means a long left tail; zero means symmetry.' },
  { id: 'kurt', title: 'Kurtosis', detail: 'Kurtosis describes tail heaviness. Higher kurtosis (leptokurtic) means more extreme values; lower kurtosis (platykurtic) means lighter tails — not just a pointier peak.' },
  { id: 'interpret', title: 'Interpretation', detail: 'Skewness and kurtosis help us understand shape, outliers, and risk in real-world data beyond the mean and standard deviation.' },
  { id: 'world', title: 'Real-world use', detail: 'Important in fields like finance, biology, and engineering to assess non-normal data and model risk.' },
]

function raisedCosinePdf(x: number): number {
  if (x < -1 || x > 1) return 0
  return 0.5 * (1 + Math.cos(Math.PI * x))
}

export function SkewnessKurtosisLab({ tab }: { tab: string }) {
  const [shape, setShape] = useState<Shape>('normal')
  const [skew, setSkew] = useState(0)
  const [df, setDf] = useState(8)
  const [concept, setConcept] = useState('skew')

  const model = useMemo(() => {
    if (shape === 'right' || (shape === 'normal' && skew > 0.05)) {
      const alpha = shape === 'right' ? 4 : skew * 6
      return { pdf: (x: number) => skewNormalPdf(x, alpha), min: -4, max: 5, label: 'Right-skewed' }
    }
    if (shape === 'left' || (shape === 'normal' && skew < -0.05)) {
      const alpha = shape === 'left' ? -4 : skew * 6
      return { pdf: (x: number) => skewNormalPdf(x, alpha), min: -5, max: 4, label: 'Left-skewed' }
    }
    if (shape === 'high-k') return { pdf: (x: number) => studentTPdf(x, df), min: -6, max: 6, label: 'Heavy tails' }
    if (shape === 'low-k') return { pdf: (x: number) => raisedCosinePdf(x / 2) / 2, min: -3, max: 3, label: 'Light tails' }
    return { pdf: (x: number) => normalPdf(x), min: -4, max: 4, label: 'Normal' }
  }, [df, shape, skew])

  const stats = useMemo(() => {
    const xs = linspace(model.min, model.max, 240)
    const ys = xs.map(model.pdf)
    const mass = integrate(model.pdf, model.min, model.max)
    const mean = integrate((x) => x * model.pdf(x), model.min, model.max) / Math.max(mass, 1e-12)
    const m2 = integrate((x) => (x - mean) ** 2 * model.pdf(x), model.min, model.max) / Math.max(mass, 1e-12)
    const m3 = integrate((x) => (x - mean) ** 3 * model.pdf(x), model.min, model.max) / Math.max(mass, 1e-12)
    const m4 = integrate((x) => (x - mean) ** 4 * model.pdf(x), model.min, model.max) / Math.max(mass, 1e-12)
    const sd = Math.sqrt(Math.max(m2, 0))
    const g1 = sd > 1e-12 ? m3 / sd ** 3 : 0
    const g2 = sd > 1e-12 ? m4 / sd ** 4 : Number.NaN
    let mode = xs[0] ?? 0
    let peak = -1
    xs.forEach((x, i) => {
      if ((ys[i] ?? 0) > peak) {
        peak = ys[i] ?? 0
        mode = x
      }
    })
    const median = (() => {
      let acc = 0
      const dx = (model.max - model.min) / (xs.length - 1)
      for (let i = 0; i < xs.length; i += 1) {
        acc += (ys[i] ?? 0) * dx
        if (acc / mass >= 0.5) return xs[i] ?? mean
      }
      return mean
    })()
    return { mean, sd, skew: g1, kurt: g2, mode, median }
  }, [model])

  const reset = () => {
    setShape('normal')
    setSkew(0)
    setDf(8)
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="A dataset has skewness −0.8 and kurtosis 2.2. Which description best matches the shape?"
          options={['Right-skewed with heavier tails', 'Symmetric with lighter tails', 'Left-skewed with lighter tails', 'Left-skewed with heavier tails']}
          answer={2}
          explanation="Negative skew is a longer left tail. Kurtosis 2.2 < 3 is platykurtic (lighter tails than a normal)."
          onCorrect={() => markRvLabComplete('skewness-kurtosis')}
        />
      </RvCard>
    )
  }

  const shapes: Array<{ id: Shape; label: string }> = [
    { id: 'normal', label: 'Symmetric (normal)' },
    { id: 'right', label: 'Right-skewed' },
    { id: 'left', label: 'Left-skewed' },
    { id: 'high-k', label: 'High kurtosis' },
    { id: 'low-k', label: 'Low kurtosis' },
  ]

  return (
    <LabSplit
      demo={
        <RvCard title="Explore distribution shape" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Compare how skewness and kurtosis change the shape of a distribution.</p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {shapes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setShape(item.id)}
                className={`rounded-2xl px-2 py-2 text-center text-[11px] font-bold ${
                  shape === item.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 dark:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <RvSlider label="Skewness control" value={skew} min={-1} max={1} step={0.05} onChange={(value) => { setSkew(value); setShape('normal') }} display={formatFixed(skew, 2)} />
            <RvSlider label="Tail weight (t df)" value={df} min={3} max={30} step={1} onChange={(value) => { setDf(value); setShape('high-k') }} display={String(df)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px]">
            <div>
              <p className="mb-1 text-sm font-bold text-slate-700">Probability density function</p>
              <PDFPlot
                f={model.pdf}
                min={model.min}
                max={model.max}
                markers={[
                  { x: stats.mean, label: 'mean', color: '#ef4444' },
                  { x: stats.median, label: 'median', color: '#22c55e' },
                  { x: stats.mode, label: 'mode', color: '#2563eb' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <ResultBanner title={`Mean μ = ${formatFixed(stats.mean, 2)}`} />
              <ResultBanner tone="info" title={`Median = ${formatFixed(stats.median, 2)}`} />
              <ResultBanner tone="info" title={`Mode = ${formatFixed(stats.mode, 2)}`} />
              <p className="text-xs text-slate-500">σ = {formatFixed(stats.sd, 2)}</p>
              <p className="text-xs text-slate-500">Skewness = {formatFixed(stats.skew, 2)}</p>
              <p className="text-xs text-slate-500">Kurtosis = {formatFixed(stats.kurt, 2)} {stats.kurt > 3.2 ? '(leptokurtic)' : stats.kurt < 2.8 ? '(platykurtic)' : '(mesokurtic)'}</p>
            </div>
          </div>
          <Insight title="Current shape">
            {stats.skew > 0.25
              ? 'The long tail is on the right. Mean is pulled toward that tail, past the median and mode.'
              : stats.skew < -0.25
                ? 'The long tail is on the left. Mean is pulled left of the median.'
                : stats.kurt > 3.4
                  ? 'Tails are heavier than a normal. Extreme values are more likely — that is kurtosis, not just peakedness.'
                  : stats.kurt < 2.6
                    ? 'Tails are lighter than a normal. Extremes are rarer.'
                    : 'Approximately symmetric with normal-like tails. Mean, median, and mode nearly coincide.'}
          </Insight>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">A dataset has mean 50, standard deviation 10, skewness 1.2, and kurtosis 5.0. Interpret the shape.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Skewness 1.2 (positive) → right-skewed with a longer right tail</li>
            <li>Kurtosis 5.0 &gt; 3 → leptokurtic, with heavier tails than a normal distribution</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="A dataset has skewness −0.8 and kurtosis 2.2. Which description best matches the shape?"
            options={['Right-skewed with heavier tails', 'Symmetric with lighter tails', 'Left-skewed with lighter tails', 'Left-skewed with heavier tails']}
            answer={2}
            explanation="Negative skew is left-tailed; kurtosis below 3 means lighter tails."
            onCorrect={() => markRvLabComplete('skewness-kurtosis')}
          />
        </RvCard>
      }
    />
  )
}
