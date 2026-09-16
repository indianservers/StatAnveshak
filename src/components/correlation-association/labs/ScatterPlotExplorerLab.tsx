import { useMemo, useState } from 'react'
import {
  associationLabel,
  formatNum,
  generateLinear,
  generatePreset,
  summarizePair,
  type CaTab,
  type Observation,
  type PresetId,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, CaSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { CorrelationMeter, MiniCloud, ScatterPlot } from '../plots'

const PRESETS: Array<{ value: PresetId; label: string }> = [
  { value: 'height-weight', label: 'Heights vs weights' },
  { value: 'strong-pos', label: 'Strong positive' },
  { value: 'weak-pos', label: 'Weak positive' },
  { value: 'strong-neg', label: 'Strong negative' },
  { value: 'none', label: 'No linear association' },
  { value: 'u-shape', label: 'U-shape' },
  { value: 'monotonic-nonlinear', label: 'Monotonic nonlinear' },
  { value: 'outlier', label: 'Outlier' },
  { value: 'clustered', label: 'Two clusters' },
]

export function ScatterPlotExplorerLab({ tab }: { tab: CaTab }) {
  const [preset, setPreset] = useState<PresetId>('height-weight')
  const [n, setN] = useState(48)
  const [strength, setStrength] = useState(0.62)
  const [noise, setNoise] = useState(0.15)
  const [showTrend, setShowTrend] = useState(true)
  const [showMeans, setShowMeans] = useState(true)
  const [seed, setSeed] = useState(12)
  const [custom, setCustom] = useState<Observation[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const generated = useMemo(() => {
    if (preset === 'height-weight' || preset === 'strong-pos' || preset === 'weak-pos' || preset === 'strong-neg' || preset === 'none') {
      return generateLinear({
        n,
        r: preset === 'none' ? 0 : preset === 'strong-neg' ? -Math.abs(strength) : Math.abs(strength),
        noise,
        seed,
        xMean: preset === 'height-weight' ? 168 : 50,
        xSd: preset === 'height-weight' ? 9 : 12,
        yMean: preset === 'height-weight' ? 68 : 50,
        ySd: preset === 'height-weight' ? 11 : 12,
      })
    }
    return generatePreset(preset, n, seed)
  }, [preset, n, strength, noise, seed])

  const points = custom ?? generated
  const stats = useMemo(() => summarizePair(points), [points])
  const xLabel = preset === 'height-weight' ? 'Height (cm)' : 'X'
  const yLabel = preset === 'height-weight' ? 'Weight (kg)' : 'Y'

  const reset = () => {
    setPreset('height-weight')
    setN(48)
    setStrength(0.62)
    setNoise(0.15)
    setShowTrend(true)
    setShowMeans(true)
    setSeed(12)
    setCustom(null)
    setSelectedId(undefined)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="Read the cloud first">
          <p className="text-sm leading-6 text-slate-600">
            Direction, form, and strength are visible before any coefficient. A straight cloud, a curve, and a random spray
            are three different stories — even if someone later prints the same r.
          </p>
          <FormulaBlock tex={'r=\\frac{\\mathrm{cov}(X,Y)}{s_X s_Y}'} label="Pearson r after you have looked at the scatter" />
        </CaCard>
        <CaCard title="What to look for">
          <div className="space-y-3">
            <ConceptRow icon="plus" title="Direction">Positive, negative, or no linear tilt.</ConceptRow>
            <ConceptRow icon="none" title="Form">Linear, curved, clustered, or no pattern.</ConceptRow>
            <ConceptRow icon="minus" title="Outliers">Unusual points can warp a fitted line.</ConceptRow>
          </div>
        </CaCard>
      </div>
    )
  }

  if (tab === 'quiz') {
    return (
      <CaCard title="Try it yourself">
        <QuizBlock
          items={[
            {
              prompt: 'A scatter of height versus weight rises to the right with a moderate spread around a line. Which reading is most accurate?',
              options: ['There is a strong negative association.', 'There is no association.', 'There is a moderate positive association.', 'The variables must be causal.'],
              answer: 2,
              explanation: 'An upward linear cloud is a positive association. “Moderate” matches a visible tilt that is not needle-tight.',
            },
            {
              prompt: 'A U-shaped cloud can have Pearson r near 0. What should you conclude?',
              options: ['The variables are independent.', 'There is no relationship of any kind.', 'There is no linear association; a curve can still be present.', 'r must be wrong.'],
              answer: 2,
              explanation: 'r = 0 is about linear association, not about every kind of dependence.',
            },
          ]}
        />
      </CaCard>
    )
  }

  if (tab === 'practice') {
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          Heights versus weights in this lab start near r = {formatNum(stats.pearson, 3)}. Weight tends to increase with
          height, so the cloud tilts up. That is a {associationLabel(stats.pearson)} — not a proof that height causes weight.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="n" value={String(stats.n)} />
          <Metric label="mean X" value={formatNum(stats.meanX, 1)} />
          <Metric label="mean Y" value={formatNum(stats.meanY, 1)} />
          <Metric label="r" value={formatNum(stats.pearson, 3)} />
        </div>
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore the data" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Dataset"
              value={preset}
              onChange={(value) => {
                setPreset(value as PresetId)
                setCustom(null)
                if (value === 'strong-neg') setStrength(0.8)
                if (value === 'none') setStrength(0)
              }}
              options={PRESETS}
            />
            <CaSlider label="Data size" value={n} min={12} max={80} step={1} onChange={(value) => { setN(value); setCustom(null) }} />
            <CaSlider label="Relationship strength" value={strength} min={0} max={0.95} step={0.01} display={formatNum(strength, 2)} onChange={(value) => { setStrength(value); setCustom(null) }} />
            <CaSlider label="Noise" value={noise} min={0} max={1.2} step={0.05} display={formatNum(noise, 2)} onChange={(value) => { setNoise(value); setCustom(null) }} />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={showTrend} onChange={(event) => setShowTrend(event.target.checked)} />
              Show regression line
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={showMeans} onChange={(event) => setShowMeans(event.target.checked)} />
              Show mean lines
            </label>
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => { setSeed((value) => value + 1); setCustom(null) }}>
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
          <ScatterPlot
            points={points}
            xLabel={xLabel}
            yLabel={yLabel}
            showTrend={showTrend}
            showMeans={showMeans}
            selectedId={selectedId}
            editable
            onSelect={setSelectedId}
            onChange={setCustom}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Metric label="n" value={String(stats.n)} />
            <Metric label="x̄" value={formatNum(stats.meanX, 1)} />
            <Metric label="ȳ" value={formatNum(stats.meanY, 1)} />
            <Metric label="cov" value={formatNum(stats.cov, 2)} />
            <Metric label="r" value={formatNum(stats.pearson, 3)} />
            <Metric label="ρ" value={formatNum(stats.spearman, 3)} />
          </div>
        </CaCard>
      }
      aside={
        <CaCard title="Understanding association">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="plus" title="Positive association">As one variable increases, the other tends to increase.</ConceptRow>
              <MiniCloud kind="pos" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="minus" title="Negative association">As one variable increases, the other tends to decrease.</ConceptRow>
              <MiniCloud kind="neg" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="none" title="No linear association">The cloud has no consistent tilt. A curve can still hide here.</ConceptRow>
              <MiniCloud kind="none" />
            </div>
            <Insight title="Try this">Switch to the U-shape. Pearson can sit near 0 while the pattern is obvious.</Insight>
          </div>
        </CaCard>
      }
      bottom={
        <div className="grid gap-4 lg:grid-cols-3">
          <CaCard title="Worked example">
            <p className="text-sm leading-6 text-slate-600">
              On the height–weight cloud, n = {stats.n}, r = {formatNum(stats.pearson, 3)}. Taller people in this sample tend
              to weigh more. That is association, not a diet plan.
            </p>
          </CaCard>
          <CaCard title="Key concepts">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Direction — positive, negative, or none.</li>
              <li>Strength — how tightly points follow a form.</li>
              <li>Form — linear, curved, or clustered.</li>
              <li>Outliers — unusual points can bend the story.</li>
            </ul>
          </CaCard>
          <CaCard title="Live meter">
            <CorrelationMeter value={stats.pearson} />
            <p className="mt-2 text-xs text-slate-400">Pearson r only. Spearman ρ is listed under the plot.</p>
          </CaCard>
        </div>
      }
    />
  )
}
