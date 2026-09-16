import { useEffect, useMemo, useState } from 'react'
import { WORKED, formatNum, generatePreset, movingAverage, type MaAlign, type PresetId, valuesOf } from '../../../lib/timeSeriesBasics'
import { ConceptList, FormulaBlock, HandNote, Insight, ResetButton, TsCard, TsSelect, TsSlider, TsToggle } from '../shared'
import { TimeChart } from '../plots'

export function MovingAverageLab() {
  const [preset, setPreset] = useState<PresetId>('retail-sales')
  const [k, setK] = useState(12)
  const [align, setAlign] = useState<MaAlign>('centered')
  const [showRaw, setShowRaw] = useState(true)
  const [animate, setAnimate] = useState(false)
  const [shownK, setShownK] = useState(12)
  const series = useMemo(() => generatePreset(preset, 72, 10), [preset])
  const y = valuesOf(series)
  const small = movingAverage(y, 3, align)
  const large = movingAverage(y, shownK, align)

  useEffect(() => {
    if (!animate) {
      setShownK(k)
      return
    }
    setShownK(3)
    const id = window.setInterval(() => {
      setShownK((current) => (current >= k ? 3 : current + 1))
    }, 240)
    return () => window.clearInterval(id)
  }, [animate, k])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <TsCard title="Monthly retail sales" action={<HandNote>Less noise. Clearer insights.</HandNote>}>
          <p className="mb-2 text-sm text-slate-500">Raw data versus moving averages. This is a smoother, not an MA(q) process.</p>
          <TimeChart
            series={[
              ...(showRaw ? [{ id: 'raw', label: 'Raw series (solid)', values: y, color: '#2563eb' }] : []),
              { id: 'ma3', label: 'MA window = 3 (dotted)', values: small.smoothed, dotted: true, color: '#64748b' },
              { id: 'mak', label: `MA window = ${shownK} (dashed)`, values: large.smoothed, dashed: true, color: '#f59e0b', width: 2.4 },
            ]}
            labels={series.map((row) => row.label ?? '')}
            xLabel="Year"
            yLabel="Sales"
            title="Raw series with moving-average smoothers"
          />
          <p className="mt-2 text-xs text-slate-400">
            Edges stay blank: the first and last observations do not have a full {align} window of {shownK}.
          </p>
        </TsCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <TsCard title="Moving-average formula" className="ts-wash-violet">
            <p className="mb-2 text-sm text-slate-500">The simple moving average at time t is the average of k observations.</p>
            <FormulaBlock tex={'\\mathrm{SMA}_t=\\frac{1}{k}\\sum_{i=0}^{k-1} y_{t-i}'} label="Trailing simple moving average" />
            <p className="mt-2 text-xs text-slate-400">Centered windows average neighbors around t instead of only the past.</p>
          </TsCard>
          <TsCard title="Worked example">
            <p className="text-sm leading-6 text-slate-600">
              Sales of {WORKED.maWindow.join(', ')}. The 3-month average is ({WORKED.maWindow.join(' + ')}) / 3 = {formatNum(WORKED.maMay, 1)}.
            </p>
          </TsCard>
          <TsCard title="Key takeaways" className="ts-wash-amber">
            <ConceptList
              items={[
                'Moving averages reduce short-term noise so trends are easier to see.',
                'Small windows react quickly and keep more noise.',
                'Large windows are smoother and lag more.',
                'A smoother is not the same object as an MA(q) time-series model.',
              ]}
            />
          </TsCard>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Explore the moving average">
          <div className="space-y-3">
            <TsSelect
              label="Dataset"
              value={preset}
              onChange={(value) => setPreset(value as PresetId)}
              options={[
                { value: 'retail-sales', label: 'Retail sales (monthly)' },
                { value: 'airline', label: 'Airline passengers' },
                { value: 'noise', label: 'Noisy series' },
              ]}
            />
            <TsSlider label="Moving-average window size" value={k} min={2} max={24} step={1} onChange={setK} display={`${k}`} />
            <TsSelect
              label="Alignment"
              value={align}
              onChange={(value) => setAlign(value as MaAlign)}
              options={[
                { value: 'trailing', label: 'Trailing (past k)' },
                { value: 'centered', label: 'Centered' },
              ]}
            />
            <TsToggle label="Show raw series" checked={showRaw} onChange={setShowRaw} />
            <TsToggle label="Animate window" checked={animate} onChange={setAnimate} />
            <Insight title="Try different window sizes">
              Small windows (k = 3) follow the data closely. Large windows (k = 12) highlight the long-term pattern.
            </Insight>
            <ResetButton
              onClick={() => {
                setPreset('retail-sales')
                setK(12)
                setAlign('centered')
                setShowRaw(true)
                setAnimate(false)
              }}
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
