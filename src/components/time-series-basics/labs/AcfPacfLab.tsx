import { useMemo, useState } from 'react'
import { generatePreset, sampleAcf, samplePacf, type PresetId, valuesOf } from '../../../lib/timeSeriesBasics'
import { ConceptList, HandNote, Insight, ResetButton, TsCard, TsSelect, TsSlider, TsToggle } from '../shared'
import { BarCorrChart, TimeChart } from '../plots'

const PRESETS: Array<{ value: PresetId; label: string }> = [
  { value: 'airline', label: 'Monthly airline passengers' },
  { value: 'ar1', label: 'AR(1)' },
  { value: 'ma1', label: 'MA(1)' },
  { value: 'seasonal-monthly', label: 'Seasonal monthly' },
  { value: 'noise', label: 'White noise' },
]

export function AcfPacfLab() {
  const [preset, setPreset] = useState<PresetId>('airline')
  const [maxLag, setMaxLag] = useState(20)
  const [showBand, setShowBand] = useState(true)
  const series = useMemo(() => generatePreset(preset, 96, 15), [preset])
  const y = valuesOf(series)
  const acf = sampleAcf(y, maxLag)
  const pacf = samplePacf(acf)
  const maPattern = sampleAcf(valuesOf(generatePreset('ma1', 160, 21, { theta: 0.7 })), 12)
  const arPattern = samplePacf(sampleAcf(valuesOf(generatePreset('ar1', 160, 21, { phi: 0.7 })), 12))

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <header className="flex flex-wrap justify-between gap-3">
          <HandNote>Patterns in dependence reveal the model structure.</HandNote>
          <HandNote>&quot;Look at the lags. They tell a story.&quot;</HandNote>
        </header>
        <TsCard title="Time series">
          <TimeChart series={[{ id: 'y', label: 'Series used for ACF and PACF (solid)', values: y }]} labels={series.map((row) => row.label ?? '')} height={200} />
        </TsCard>
        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Autocorrelation function (ACF)">
            <BarCorrChart result={acf} title="Sample ACF" showBand={showBand} />
          </TsCard>
          <TsCard title="Partial autocorrelation function (PACF)">
            <BarCorrChart result={pacf} title="Sample PACF" color="#7c3aed" showBand={showBand} />
          </TsCard>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TsCard title="How ACF helps identify MA structure" className="ts-wash-violet">
            <p className="mb-2 text-sm text-slate-600">For an MA(q) process, the ACF typically cuts off after lag q and then sits near zero.</p>
            <BarCorrChart result={maPattern} title="Typical MA ACF" showBand={false} />
          </TsCard>
          <TsCard title="How PACF helps identify AR structure" className="ts-wash-blue">
            <p className="mb-2 text-sm text-slate-600">For an AR(p) process, the PACF typically spikes to lag p and then sits near zero.</p>
            <BarCorrChart result={arPattern} title="Typical AR PACF" color="#7c3aed" showBand={false} />
          </TsCard>
          <TsCard title="Worked example">
            <p className="text-sm leading-6 text-slate-600">
              The airline-style series has a large lag-1 ACF and a seasonal lag-12 spike. That pattern often suggests a seasonal ARIMA, but sample plots are typical shapes — not rigid identification rules.
            </p>
          </TsCard>
          <TsCard title="Key takeaways" className="ts-wash-amber">
            <ConceptList
              items={[
                'ACF measures total linear correlation with the past.',
                'PACF measures extra correlation after shorter lags are removed.',
                'ACF cutoff is typical of MA; PACF cutoff is typical of AR.',
                'Use both plots together, then confirm with theory and residuals.',
              ]}
            />
          </TsCard>
        </div>
      </div>
      <aside className="space-y-4">
        <TsCard title="Lab controls">
          <div className="space-y-3">
            <TsSelect label="Example dataset" value={preset} onChange={(value) => setPreset(value as PresetId)} options={PRESETS} />
            <TsSlider label="Maximum lag" value={maxLag} min={8} max={36} step={1} onChange={setMaxLag} />
            <TsToggle label="Show white-noise bands (±1.96/√n)" checked={showBand} onChange={setShowBand} />
            <Insight title="Careful language">These are typical population patterns. A sample bar can wander even when the process is white noise.</Insight>
            <ResetButton
              onClick={() => {
                setPreset('airline')
                setMaxLag(20)
                setShowBand(true)
              }}
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
