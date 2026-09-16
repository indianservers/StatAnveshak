import { useMemo, useState } from 'react'
import { detrend, formatNum, generatePreset, linearTrend, seasonalFactors, type PresetId, valuesOf } from '../../../lib/timeSeriesBasics'
import { ConceptList, FormulaBlock, HandNote, Insight, ResetButton, TsCard, TsSelect, TsToggle } from '../shared'
import { TimeChart } from '../plots'

const DATASETS: Array<{ value: PresetId; label: string }> = [
  { value: 'airline', label: 'Airline passengers (monthly)' },
  { value: 'linear-up', label: 'Linear upward trend' },
  { value: 'linear-down', label: 'Linear downward trend' },
  { value: 'trend-season', label: 'Trend plus seasonality' },
  { value: 'noise', label: 'Noise only' },
]

export function TrendLab() {
  const [preset, setPreset] = useState<PresetId>('airline')
  const [showTrend, setShowTrend] = useState(true)
  const [method, setMethod] = useState('ols')
  const series = useMemo(() => generatePreset(preset, 72, 8), [preset])
  const y = valuesOf(series)
  const fit = linearTrend(y)
  const leftover = detrend(y, fit.fitted)
  const seasonal = seasonalFactors(leftover, 12, 'additive')
  const remainder = leftover.map((value, i) => value - (seasonal.seasonal[i] ?? 0))

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <TsCard title="Time series with trend" action={<HandNote>See the bigger picture.</HandNote>}>
          <p className="mb-2 text-sm text-slate-500">Monthly airline passengers showing a clear long-term upward movement.</p>
          <TimeChart
            series={[
              { id: 'y', label: 'Actual (solid)', values: y, markers: false },
              ...(showTrend ? [{ id: 'trend', label: 'Trend line (dashed)', values: fit.fitted, dashed: true, color: '#64748b' }] : []),
            ]}
            labels={series.map((row) => row.label ?? '')}
            xLabel="Year"
            yLabel="Passengers"
            title="Series with optional linear trend overlay"
          />
        </TsCard>

        <TsCard title="Decomposition (additive model)">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { title: 'Original series', values: y },
              { title: 'Trend component', values: fit.fitted },
              { title: 'Seasonal component', values: seasonal.seasonal.map((value) => value ?? 0) },
              { title: 'Residual component', values: remainder },
            ].map((panel) => (
              <div key={panel.title}>
                <p className="mb-1 text-xs font-bold text-slate-400">{panel.title}</p>
                <TimeChart series={[{ id: panel.title, label: panel.title, values: panel.values }]} height={140} yLabel="" xLabel="" />
              </div>
            ))}
          </div>
        </TsCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <TsCard title="Linear trend" className="ts-wash-violet">
            <p className="text-sm leading-6 text-slate-600">A straight-line increase or decrease over time.</p>
            <FormulaBlock tex={'Y_t=\\beta_0+\\beta_1 t+\\varepsilon_t'} label="Linear trend plus noise" />
          </TsCard>
          <TsCard title="Nonlinear trend">
            <p className="text-sm leading-6 text-slate-600">Some series curve — exponential or slowing growth.</p>
            <FormulaBlock tex={'Y_t=\\alpha\\,e^{\\beta t}+\\varepsilon_t'} label="Example exponential trend" />
          </TsCard>
          <TsCard title="How to interpret">
            <ConceptList items={['The trend is the long-run direction, not the short wiggles.', 'Upward, downward, or flat are all trends.', 'A clear trend is not the same as a stable series.']} />
          </TsCard>
          <TsCard title="Worked example" className="ts-wash-amber">
            <p className="text-sm leading-6 text-slate-600">
              Airline passengers: slope {formatNum(fit.slope, 2)} per month, R² = {formatNum(fit.r2, 2)}. Seasonal ups and downs sit on top of a rising level.
            </p>
          </TsCard>
          <TsCard title="Key takeaways">
            <ConceptList items={['Trend is slow movement in a series.', 'Use a visualization and a smoother or line to see it.', 'Understanding trend helps forecasting and decisions.']} />
          </TsCard>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Controls">
          <div className="space-y-3">
            <TsSelect label="Dataset" value={preset} onChange={(value) => setPreset(value as PresetId)} options={DATASETS} />
            <TsSelect
              label="Smoothing method"
              value={method}
              onChange={setMethod}
              options={[{ value: 'ols', label: 'Linear trend (OLS)' }]}
            />
            <TsToggle label="Show trend line" checked={showTrend} onChange={setShowTrend} />
            <Insight title="Noise vs trend">
              Linear-fit R² = {formatNum(fit.r2, 2)}. High R² means a strong trend relative to leftover variation.
            </Insight>
            <ResetButton
              onClick={() => {
                setPreset('airline')
                setShowTrend(true)
                setMethod('ols')
              }}
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
