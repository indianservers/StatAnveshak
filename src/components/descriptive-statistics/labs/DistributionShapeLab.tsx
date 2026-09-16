import { useMemo, useState } from 'react'
import { formatModes, formatNum, histogramBins, shapeSample, summarize, type DsTab } from '../../../lib/descriptiveStatistics'
import { DsCard, LabSplit, MetricCard, QuizBlock } from '../shared'
import { HistogramPlot } from '../plots'

const SHAPES = [
  { id: 'symmetric', label: 'Symmetric' },
  { id: 'left', label: 'Left-skewed' },
  { id: 'right', label: 'Right-skewed' },
  { id: 'bimodal', label: 'Bimodal' },
  { id: 'multimodal', label: 'Multimodal' },
  { id: 'uniform', label: 'Uniform' },
] as const

type ShapeId = (typeof SHAPES)[number]['id']

const NOTES: Record<ShapeId, string> = {
  symmetric: 'Balanced around a central value. Mean, median, and mode sit close together.',
  left: 'Longer left tail (negative skew). The mean is usually pulled left of the median.',
  right: 'Longer right tail (positive skew). The mean is usually pulled right of the median.',
  bimodal: 'Two distinct peaks — often two groups mixed in one list.',
  multimodal: 'More than two peaks. Look for subgroups before quoting a single center.',
  uniform: 'Roughly equal frequency across the range. Little central pile-up.',
}

export function DistributionShapeLab({ tab }: { tab: DsTab }) {
  const [shape, setShape] = useState<ShapeId>('symmetric')
  const [density, setDensity] = useState(false)
  const [values, setValues] = useState(() => shapeSample('symmetric'))
  const stats = useMemo(() => summarize(values), [values])
  const bins = useMemo(() => histogramBins(values, 12), [values])
  const waitTimes = [1, 2, 2, 3, 3, 3, 4, 4, 5, 6, 8, 12, 18]

  const apply = (next: ShapeId) => {
    setShape(next)
    setValues(shapeSample(next))
  }

  if (tab === 'learn') {
    return (
      <DsCard title="Shape language">
        <p className="text-sm leading-6 text-slate-600">Describe peaks, tails, gaps, and clusters before you quote a single average. Skew is a direction, not a moral. A rule like “mean &gt; median ⇒ right skew” is a tendency, not a theorem.</p>
      </DsCard>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Identify the shape">
        <HistogramPlot bins={histogramBins(waitTimes, 7)} />
        <QuizBlock
          prompt="The wait-time histogram has a long right tail. What shape is that?"
          options={['Symmetric', 'Right-skewed', 'Bimodal', 'Multimodal']}
          answer={1}
          explanation="Most values pile on the left; a few long waits stretch the right tail."
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard
          title="Explore distribution shapes"
          action={
            <button type="button" className="ds-btn ds-btn-ghost" onClick={() => setDensity((value) => !value)}>
              {density ? 'Density curve' : 'Histogram'}
            </button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {SHAPES.map((item) => (
              <button key={item.id} type="button" className={`ds-btn ${shape === item.id ? '' : 'ds-btn-ghost'}`} onClick={() => apply(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="ds-btn ds-btn-ghost mt-3" onClick={() => setValues(shapeSample(shape))}>
            Generate new sample
          </button>
          <HistogramPlot
            bins={bins}
            markers={[
              { value: stats.mean, color: '#f59e0b', label: 'Mean' },
              { value: stats.median, color: '#059669', label: 'Median' },
              ...(stats.modes.frequency > 1 ? stats.modes.values.slice(0, 2).map((value) => ({ value, color: '#2563eb', label: 'Mode' })) : []),
            ]}
          />
          {density && <p className="text-xs text-slate-400">Smoothed density is approximated by the histogram outline — the same sample, fewer bins hidden.</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <MetricCard label="Mean" value={formatNum(stats.mean)} accent="#d97706" />
            <MetricCard label="Median" value={formatNum(stats.median)} accent="#059669" />
            <MetricCard label="Mode" value={formatModes(stats.modes)} />
            <MetricCard label="Skewness" value={formatNum(stats.skewness)} />
          </div>
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <p className="text-sm font-bold text-slate-800">{SHAPES.find((item) => item.id === shape)?.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{NOTES[shape]}</p>
          <p className="mt-3 text-sm text-slate-500">This sample: mean {formatNum(stats.mean)}, median {formatNum(stats.median)}. If they separate, look at the longer tail rather than reciting a slogan.</p>
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="mb-2 text-sm text-slate-600">Coffee-shop wait times (minutes). Most people are served quickly; a few wait much longer.</p>
          <HistogramPlot bins={histogramBins(waitTimes, 7)} height={160} />
          <p className="mt-2 text-sm text-emerald-700">Answer: right-skewed.</p>
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt="A histogram piled on the left with a long right tail is…"
            options={['Symmetric', 'Right-skewed', 'Bimodal', 'Multimodal']}
            answer={1}
            explanation="Positive / right skew: the long tail points right."
          />
        </DsCard>
      }
    />
  )
}
