import { useMemo, useState } from 'react'
import {
  formatNum,
  formatP,
  generateOneWay,
  oneWayAnova,
  omnibusReading,
  type AnovaObservation,
  type OneWayPresetId,
} from '../../../lib/anovaStudio'
import { AnovaCard, AnovaSelect, AnovaSlider, AnovaToggle, Insight, ResetButton, SigBadge } from '../shared'
import { GroupBoxPlot } from '../plots'

const PRESETS: Array<{ value: OneWayPresetId; label: string }> = [
  { value: 'teaching-methods', label: 'Teaching methods (default)' },
  { value: 'equal-means', label: 'Equal means' },
  { value: 'moderate-diffs', label: 'Moderate mean differences' },
  { value: 'strong-diffs', label: 'Strong mean differences' },
  { value: 'high-within', label: 'High within-group variance' },
  { value: 'low-within', label: 'Low within-group variance' },
  { value: 'unequal-n', label: 'Unequal sample sizes' },
  { value: 'unequal-var', label: 'Unequal variances' },
]

export function OneWayAnovaLab() {
  const [preset, setPreset] = useState<OneWayPresetId>('teaching-methods')
  const [k, setK] = useState(3)
  const [n, setN] = useState(20)
  const [separation, setSeparation] = useState(0.26)
  const [withinSd, setWithinSd] = useState(8)
  const [seed, setSeed] = useState(17)
  const [showPoints, setShowPoints] = useState(true)
  const [showMeans, setShowMeans] = useState(true)
  const [showGrand, setShowGrand] = useState(true)
  const [showWithin, setShowWithin] = useState(false)
  const [showBetween, setShowBetween] = useState(false)
  const [custom, setCustom] = useState<AnovaObservation[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const generated = useMemo(
    () => generateOneWay({ preset, k, n, seed, separation, withinSd }),
    [preset, k, n, seed, separation, withinSd],
  )
  const rows = custom ?? generated
  const result = useMemo(() => oneWayAnova(rows), [rows])

  const reset = () => {
    setPreset('teaching-methods')
    setK(3)
    setN(20)
    setSeparation(0.26)
    setWithinSd(8)
    setSeed(17)
    setShowPoints(true)
    setShowMeans(true)
    setShowGrand(true)
    setShowWithin(false)
    setShowBetween(false)
    setCustom(null)
    setSelectedId(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <AnovaCard title="Group distributions" action={<AnovaSelect label="Chart" value="box" onChange={() => undefined} options={[{ value: 'box', label: 'Box plot' }]} />}>
          <p className="mb-2 text-sm text-slate-500">
            Compare the distribution of values across groups. Drag a point to edit it. Shapes — not only colors — mark the groups.
          </p>
          <GroupBoxPlot
            groups={result.groups}
            points={rows}
            grandMean={result.grandMean}
            showPoints={showPoints}
            showMeans={showMeans}
            showGrand={showGrand}
            showWithin={showWithin}
            showBetween={showBetween}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={(id, y) => {
              setCustom(rows.map((row) => (row.id === id ? { ...row, y } : row)))
            }}
          />
        </AnovaCard>

        <div className="space-y-4">
          <AnovaCard title="ANOVA results">
            <p className="text-3xl font-black tabular-nums text-slate-950 dark:text-white">
              F({result.dfB}, {result.dfW}) = {formatNum(result.f, 2)}
            </p>
            <p className="mt-1 text-lg font-bold text-slate-500">p = {formatP(result.p)}</p>
            <div className="mt-2">
              <SigBadge significant={result.significant} label={result.significant ? 'Statistically significant' : 'Not statistically significant'} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{omnibusReading(result)}</p>
          </AnovaCard>
          <AnovaCard title="Hypotheses">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              <span className="font-bold">H₀:</span> the population means are equal across all groups. μ₁ = μ₂ = ⋯ = μₖ
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <span className="font-bold">H₁:</span> at least one population mean differs from the others.
            </p>
          </AnovaCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(240px,0.85fr)]">
        <AnovaCard title="Example dataset">
          <p className="mb-2 text-xs text-slate-400">A sample of scores from {result.k} groups. Showing the first six rows.</p>
          <div className="overflow-x-auto">
            <table className="anova-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {result.groups.map((group) => (
                    <th key={group.name}>{group.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    {result.groups.map((group) => (
                      <td key={group.name}>{formatNum(group.values[i] ?? Number.NaN, 1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnovaCard>

        <AnovaCard title="Worked example">
          <ol className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li><span className="mr-2 font-black text-slate-400">1</span>State H₀: all group means are equal.</li>
            <li><span className="mr-2 font-black text-slate-400">2</span>Choose α = {result.alpha}.</li>
            <li><span className="mr-2 font-black text-slate-400">3</span>Compute F({result.dfB}, {result.dfW}) = {formatNum(result.f, 2)}, p = {formatP(result.p)}.</li>
            <li>
              <span className="mr-2 font-black text-slate-400">4</span>
              {result.significant
                ? 'Reject H₀: at least one group mean differs. Follow with post-hoc comparisons to locate the pairs.'
                : 'Fail to reject H₀. The data do not show a detectable mean difference.'}
            </li>
          </ol>
        </AnovaCard>

        <AnovaCard title="Controls & options" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <AnovaSelect
              label="Preset"
              value={preset}
              onChange={(value) => {
                setPreset(value as OneWayPresetId)
                setCustom(null)
              }}
              options={PRESETS}
            />
            <AnovaSlider label="Number of groups" value={k} min={2} max={6} step={1} onChange={(value) => { setK(value); setCustom(null) }} />
            <AnovaSlider label="Sample size per group" value={n} min={6} max={40} step={1} onChange={(value) => { setN(value); setCustom(null) }} />
            <AnovaSlider label="Mean separation" value={separation} min={0} max={1} step={0.05} display={formatNum(separation, 2)} onChange={(value) => { setSeparation(value); setCustom(null) }} />
            <AnovaSlider label="Within-group SD" value={withinSd} min={2} max={20} step={0.5} display={formatNum(withinSd, 1)} onChange={(value) => { setWithinSd(value); setCustom(null) }} />
            <AnovaToggle label="Show individual points" checked={showPoints} onChange={setShowPoints} />
            <AnovaToggle label="Show group means" checked={showMeans} onChange={setShowMeans} />
            <AnovaToggle label="Show grand mean" checked={showGrand} onChange={setShowGrand} />
            <AnovaToggle label="Show within-group deviations" checked={showWithin} onChange={setShowWithin} />
            <AnovaToggle label="Show between-group deviations" checked={showBetween} onChange={setShowBetween} />
            <button type="button" className="anova-btn anova-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
          </div>
        </AnovaCard>
      </div>

      <AnovaCard title="Key takeaways">
        <div className="grid gap-3 md:grid-cols-3">
          <Insight title="What F tests">One-way ANOVA tests differences in means across two or more independent groups using a single factor.</Insight>
          <Insight title="Omnibus, not pairs" tone="warn">A significant result (p &lt; α) means at least one mean differs — not that every pair differs.</Insight>
          <Insight title="Next step" tone="ok">Follow a significant omnibus with post-hoc comparisons such as Tukey HSD to identify which groups differ.</Insight>
        </div>
      </AnovaCard>
    </div>
  )
}
