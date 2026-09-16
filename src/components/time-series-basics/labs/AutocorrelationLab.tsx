import { useMemo, useState } from 'react'
import { formatNum, generatePreset, sampleAcf, type PresetId, valuesOf } from '../../../lib/timeSeriesBasics'
import { ConceptList, HandNote, Insight, ResetButton, TsCard, TsSelect, TsSlider, TsToggle } from '../shared'
import { BarCorrChart, LagScatter, TimeChart } from '../plots'

export function AutocorrelationLab() {
  const [preset, setPreset] = useState<PresetId>('airline')
  const [lag, setLag] = useState(12)
  const [maxLag, setMaxLag] = useState(24)
  const [showBand, setShowBand] = useState(true)
  const series = useMemo(() => generatePreset(preset, 84, 12), [preset])
  const y = valuesOf(series)
  const acf = sampleAcf(y, maxLag)
  const pairs = useMemo(() => {
    const current: number[] = []
    const lagged: number[] = []
    for (let i = lag; i < y.length; i++) {
      current.push(y[i]!)
      lagged.push(y[i - lag]!)
    }
    return { current, lagged }
  }, [lag, y])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-slate-500">See how past values relate to future values.</p>
          <div className="flex gap-4">
            <HandNote>Past values help predict the future.</HandNote>
            <HandNote>Understanding yesterday, make better decisions tomorrow.</HandNote>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Time series plot">
            <TimeChart series={[{ id: 'y', label: 'Monthly series (solid)', values: y }]} labels={series.map((row) => row.label ?? '')} xLabel="Year" yLabel="Value" height={240} />
          </TsCard>
          <TsCard title="Autocorrelation function (ACF)">
            <BarCorrChart result={acf} title="Sample autocorrelation by lag" showBand={showBand} />
            <p className="mt-2 text-xs text-slate-400">Dashed lines are the white-noise approximation ±1.96/√n, not a proof of significance.</p>
          </TsCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TsCard title="Positive autocorrelation" className="ts-wash-emerald">
            <p className="text-sm leading-6 text-slate-600">ACF &gt; 0. High values tend to be followed by high values. Persistence in the series.</p>
          </TsCard>
          <TsCard title="Negative autocorrelation" className="ts-wash-rose">
            <p className="text-sm leading-6 text-slate-600">ACF &lt; 0. High values tend to be followed by low values. Alternating behavior.</p>
          </TsCard>
          <TsCard title="No autocorrelation" className="ts-wash-blue">
            <p className="text-sm leading-6 text-slate-600">ACF ≈ 0. The past does not linearly predict the future at that lag.</p>
          </TsCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title={`Lag scatter: Y(t) vs Y(t − ${lag})`}>
            <LagScatter current={pairs.current} lagged={pairs.lagged} r={acf.values[lag]} />
            <p className="mt-2 text-sm text-slate-500">
              ACF({lag}) = {formatNum(acf.values[lag] ?? Number.NaN, 3)}. This is the same association the bar at lag {lag} reports.
            </p>
          </TsCard>
          <div className="space-y-4">
            <TsCard title="Worked example">
              <p className="text-sm leading-6 text-slate-600">
                Lag 12 on the airline-style series is {formatNum(acf.values[12] ?? Number.NaN, 3)}. A large positive value is typical of a yearly seasonal pattern — it is a reading, not a hard modeling rule.
              </p>
            </TsCard>
            <TsCard title="Key takeaways" className="ts-wash-amber">
              <ConceptList
                items={[
                  'Autocorrelation measures how the past relates to the future.',
                  'Use the ACF to see which lags still carry linear memory.',
                  'If most lags sit near zero, the past may not help a linear forecast.',
                ]}
              />
            </TsCard>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Lab controls">
          <div className="space-y-3">
            <TsSelect
              label="Dataset"
              value={preset}
              onChange={(value) => setPreset(value as PresetId)}
              options={[
                { value: 'airline', label: 'Airline passengers (monthly)' },
                { value: 'ar1', label: 'AR(1)' },
                { value: 'noise', label: 'White noise' },
                { value: 'rw', label: 'Random walk' },
              ]}
            />
            <TsSlider label="Lag k for scatter" value={lag} min={1} max={Math.max(1, acf.lags.length - 1)} step={1} onChange={setLag} />
            <TsSlider label="Maximum lag" value={maxLag} min={6} max={36} step={1} onChange={setMaxLag} />
            <TsToggle label="Show 95% white-noise bands" checked={showBand} onChange={setShowBand} />
            <Insight title="How to interpret">
              ACF at lag k is the correlation between the series and a copy shifted by k periods.
            </Insight>
            <ResetButton
              onClick={() => {
                setPreset('airline')
                setLag(12)
                setMaxLag(24)
                setShowBand(true)
              }}
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
