import { useMemo, useState } from 'react'
import {
  associationLabel,
  formatNum,
  generateLinear,
  generatePreset,
  pearsonR,
  summarizePair,
  transformPoints,
  WORKED,
  type CaTab,
  type PresetId,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, CaSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { CorrelationMeter, MiniCloud, ScatterPlot } from '../plots'

const SHAPES: Array<{ value: PresetId | 'linear'; label: string }> = [
  { value: 'linear', label: 'Generated linear' },
  { value: 'u-shape', label: 'U-shape (r near 0)' },
  { value: 'outlier', label: 'Outlier' },
  { value: 'restricted-range', label: 'Restricted range' },
  { value: 'clustered', label: 'Clusters' },
  { value: 'simpson', label: 'Simpson-style groups' },
]

export function PearsonCorrelationLab({ tab }: { tab: CaTab }) {
  const [shape, setShape] = useState<PresetId | 'linear'>('linear')
  const [strength, setStrength] = useState(0.7)
  const [noise, setNoise] = useState(0.2)
  const [n, setN] = useState(50)
  const [shift, setShift] = useState(0)
  const [scale, setScale] = useState(1)
  const [flip, setFlip] = useState(false)
  const [seed, setSeed] = useState(4)

  const points = useMemo(() => {
    const raw = shape === 'linear'
      ? generateLinear({ n, r: strength, noise, seed })
      : generatePreset(shape, n, seed)
    return transformPoints(raw, { shiftX: shift, scaleX: (flip ? -1 : 1) * scale })
  }, [shape, strength, noise, n, shift, scale, flip, seed])
  const stats = useMemo(() => summarizePair(points), [points])

  const reset = () => {
    setShape('linear')
    setStrength(0.7)
    setNoise(0.2)
    setN(50)
    setShift(0)
    setScale(1)
    setFlip(false)
    setSeed(4)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="The Pearson formula">
          <p className="text-sm leading-6 text-slate-600">
            Pearson’s r is covariance divided by the two sample standard deviations. It is a linear association number
            on [−1, +1]. Zero variance makes r undefined, not 0.
          </p>
          <FormulaBlock
            tex={'r=\\dfrac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum (x_i-\\bar x)^2\\sum (y_i-\\bar y)^2}}'}
            label="Pearson correlation"
          />
        </CaCard>
        <CaCard title="What r does not say">
          <Insight title="r = 0 is not “no relationship”">
            A U-shape can have r near 0. Clusters and Simpson-style mixing can also manufacture a linear r that no group owns.
          </Insight>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    const x = WORKED.pearson.map((row) => row.x)
    const y = WORKED.pearson.map((row) => row.y)
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          Study hours and test scores {x.join(', ')} / {y.join(', ')} give r = {formatNum(pearsonR(x, y), 3)}.
        </p>
      </CaCard>
    )
  }

  if (tab === 'quiz') {
    return (
      <CaCard title="Try it yourself">
        <QuizBlock
          items={[
            {
              prompt: 'A dataset has Pearson r = −0.62. Which description is most accurate?',
              options: [
                'Strong positive linear association',
                'Moderate negative linear association',
                'No linear relationship',
                'Perfect negative relationship',
              ],
              answer: 1,
              explanation: '|r| around 0.6 is a moderate linear association; the sign is negative.',
            },
            {
              prompt: 'You add 10 to every X and multiply every Y by 3. Pearson r…',
              options: ['triples', 'stays the same', 'becomes undefined', 'flips sign'],
              answer: 1,
              explanation: 'Shift and positive scale cancel in the standardized formula.',
            },
          ]}
        />
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore the data" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect label="Dataset" value={shape} onChange={(value) => setShape(value as typeof shape)} options={SHAPES} />
            {shape === 'linear' && (
              <>
                <CaSlider label="Relationship strength" value={strength} min={-0.95} max={0.95} step={0.05} display={formatNum(strength, 2)} onChange={setStrength} />
                <CaSlider label="Noise" value={noise} min={0} max={1.4} step={0.05} display={formatNum(noise, 2)} onChange={setNoise} />
              </>
            )}
            <CaSlider label="Number of points" value={n} min={12} max={80} step={1} onChange={setN} />
            <CaSlider label="Shift X" value={shift} min={-40} max={40} step={1} onChange={setShift} />
            <CaSlider label="Positive scale" value={scale} min={0.25} max={6} step={0.25} display={formatNum(scale, 2)} onChange={setScale} />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={flip} onChange={(event) => setFlip(event.target.checked)} />
              Flip X (negative scale)
            </label>
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
          </div>
        </CaCard>
      }
      plot={
        <CaCard
          title="Scatter plot"
          action={<span className="text-xs font-bold text-slate-500">r = {formatNum(stats.pearson, 3)} · {associationLabel(stats.pearson)}</span>}
        >
          <ScatterPlot points={points} showTrend showMeans />
          <div className="mt-3">
            <CorrelationMeter value={stats.pearson} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="r" value={formatNum(stats.pearson, 3)} />
            <Metric label="ρ" value={formatNum(stats.spearman, 3)} />
            <Metric label="n" value={String(stats.n)} />
          </div>
        </CaCard>
      }
      aside={
        <CaCard title="Understanding Pearson’s r">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="plus" title="Strong positive">Points hug an upward line. r close to +1.</ConceptRow>
              <MiniCloud kind="pos" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="minus" title="Strong negative">Points hug a downward line. r close to −1.</ConceptRow>
              <MiniCloud kind="neg" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="none" title="Near zero">No linear tilt. A curve or two clusters can still be present.</ConceptRow>
              <MiniCloud kind="none" />
            </div>
            <Insight title="Invariance">Shift and positive scale leave r unchanged. A negative scale flips the sign.</Insight>
          </div>
        </CaCard>
      }
      bottom={
        <CaCard title="Key concepts">
          <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <li>Range — r lives on [−1, +1] when it is defined.</li>
            <li>Direction — the sign is the linear tilt.</li>
            <li>Linearity — Pearson measures linear association.</li>
            <li>Sensitivity — outliers, restricted ranges, and clusters move r.</li>
          </ul>
        </CaCard>
      }
    />
  )
}
