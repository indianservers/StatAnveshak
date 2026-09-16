import { useMemo, useState } from 'react'
import { MONTH_LABELS, formatNum, generatePreset, seasonalFactors, type PresetId, type SeasonMode, valuesOf } from '../../../lib/timeSeriesBasics'
import { ConceptList, HandNote, Insight, ResetButton, TsCard, TsSelect, TsSlider, TsToggle } from '../shared'
import { SeasonBars, SeasonalSubseries, TimeChart } from '../plots'

const DATASETS: Array<{ value: PresetId; label: string }> = [
  { value: 'retail-sales', label: 'Retail sales (monthly)' },
  { value: 'airline', label: 'Airline passengers (monthly)' },
  { value: 'seasonal-monthly', label: 'Seasonal monthly (synthetic)' },
  { value: 'trend-season', label: 'Trend plus season' },
]

export function SeasonalityLab() {
  const [preset, setPreset] = useState<PresetId>('retail-sales')
  const [period, setPeriod] = useState(12)
  const [amplitude, setAmplitude] = useState(8)
  const [mode, setMode] = useState<SeasonMode>('multiplicative')
  const [showIndex, setShowIndex] = useState(true)
  const series = useMemo(
    () => generatePreset(preset, 72, 6, { amplitude }),
    [amplitude, preset],
  )
  const y = valuesOf(series)
  const seasonal = seasonalFactors(y, period, mode)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <TsCard title="Time series with seasonality" action={<HandNote>Same patterns. Brighter insights.</HandNote>}>
          <p className="mb-2 text-sm text-slate-500">Monthly retail sales with a clear annual seasonal pattern.</p>
          <TimeChart
            series={[{ id: 'sales', label: 'Monthly sales (solid)', values: y, markers: true }]}
            labels={series.map((row) => row.label ?? '')}
            bands={[
              { x0: 0, x1: 2.5, fill: 'rgba(16,185,129,0.08)', label: 'Q1' },
              { x0: 2.5, x1: 5.5, fill: 'rgba(59,130,246,0.08)', label: 'Q2' },
              { x0: 5.5, x1: 8.5, fill: 'rgba(245,158,11,0.08)', label: 'Q3' },
              { x0: 8.5, x1: 11.5, fill: 'rgba(124,58,237,0.08)', label: 'Q4' },
            ]}
            xLabel="Year"
            yLabel="Sales"
            title="Seasonal monthly series"
          />
        </TsCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Seasonal subseries plot">
            <SeasonalSubseries values={y} period={period} labels={MONTH_LABELS.slice(0, period)} />
          </TsCard>
          <TsCard title="Average seasonal pattern">
            <SeasonBars
              values={seasonal.indexes.map((value) => (Number.isFinite(value) ? value : 0))}
              labels={MONTH_LABELS.slice(0, period)}
              yLabel={mode === 'additive' ? 'Deviation from mean' : 'Seasonal index'}
            />
          </TsCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TsCard title="Interpretation" className="ts-wash-blue">
            <p className="text-sm leading-6 text-slate-600">
              Seasonality means a series repeats at a fixed frequency — for example, higher retail sales every December.
            </p>
          </TsCard>
          <TsCard title="Real-world examples">
            <ConceptList items={['Electricity demand (higher in summer and winter)', 'Tourism (higher in vacation months)', 'Temperature (warmer in summer)']} />
          </TsCard>
          <TsCard title="Worked example">
            <p className="text-sm leading-6 text-slate-600">
              December index = {formatNum(seasonal.indexes[11] ?? Number.NaN, 2)}. January index = {formatNum(seasonal.indexes[0] ?? Number.NaN, 2)}.
              Deseasonalized values use {mode === 'additive' ? 'Y − S' : 'Y / S'} only.
            </p>
          </TsCard>
          <TsCard title="Key takeaways" className="ts-wash-amber">
            <ConceptList items={['Seasonality is a repeating pattern at a fixed period m.', 'Use seasonal indexes and subseries plots to see it.', 'Accounting for seasonality improves forecast accuracy.']} />
          </TsCard>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Lab controls">
          <div className="space-y-3">
            <TsSelect label="Dataset" value={preset} onChange={(value) => setPreset(value as PresetId)} options={DATASETS} />
            <TsSlider label="Season length (m)" value={period} min={4} max={12} step={1} onChange={setPeriod} />
            <TsSlider label="Amplitude" value={amplitude} min={2} max={16} step={1} onChange={setAmplitude} />
            <TsSelect
              label="Seasonal model"
              value={mode}
              onChange={(value) => setMode(value as SeasonMode)}
              options={[
                { value: 'additive', label: 'Additive (Y − S)' },
                { value: 'multiplicative', label: 'Multiplicative (Y / S)' },
              ]}
            />
            <TsToggle label="Show seasonal index" checked={showIndex} onChange={setShowIndex} />
            {showIndex && (
              <Insight title="Seasonal index">
                Relative strength of each month versus the overall {mode === 'additive' ? 'mean (0 = typical)' : 'average (1.0 = typical)'}.
              </Insight>
            )}
            <ResetButton
              onClick={() => {
                setPreset('retail-sales')
                setPeriod(12)
                setAmplitude(8)
                setMode('multiplicative')
                setShowIndex(true)
              }}
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
