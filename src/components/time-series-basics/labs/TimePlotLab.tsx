import { useEffect, useMemo, useState } from 'react'
import {
  type Frequency,
  type PresetId,
  type TsObservation,
  chronological,
  generatePreset,
  shuffleValues,
} from '../../../lib/timeSeriesBasics'
import { ConceptList, HandNote, Insight, ResetButton, TsCard, TsSelect, TsToggle } from '../shared'
import { TimeChart } from '../plots'

const DATASETS: Array<{ value: PresetId; label: string; frequency: Frequency }> = [
  { value: 'daily-temp', label: 'Daily temperature (2023–2024)', frequency: 'daily' },
  { value: 'airline', label: 'Monthly airline passengers', frequency: 'monthly' },
  { value: 'retail-sales', label: 'Monthly retail sales', frequency: 'monthly' },
  { value: 'noise', label: 'White noise', frequency: 'index' },
  { value: 'linear-up', label: 'Linear upward trend', frequency: 'index' },
]

const FREQUENCIES: Array<{ value: Frequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'index', label: 'Index' },
]

export function TimePlotLab() {
  const [preset, setPreset] = useState<PresetId>('daily-temp')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [markers, setMarkers] = useState(true)
  const [grid, setGrid] = useState(true)
  const [shuffled, setShuffled] = useState(false)
  const [seed] = useState(9)
  const [custom, setCustom] = useState<TsObservation[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [zoom, setZoom] = useState<'all' | '60' | '180' | '365'>('all')

  const generated = useMemo(() => generatePreset(preset, preset === 'daily-temp' ? 400 : 72, seed), [preset, seed])
  const base = custom ?? generated
  const ordered = chronological(base)
  const shown = shuffled ? shuffleValues(ordered, seed + 3) : ordered
  const windowed = useMemo(() => {
    if (zoom === 'all') return shown
    const keep = Number(zoom)
    return shown.slice(Math.max(0, shown.length - keep))
  }, [shown, zoom])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        setCustom(ordered.filter((row) => row.id !== selectedId))
        setSelectedId(undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ordered, selectedId])

  const reset = () => {
    setPreset('daily-temp')
    setFrequency('daily')
    setMarkers(true)
    setGrid(true)
    setShuffled(false)
    setCustom(null)
    setZoom('all')
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <TsCard title="Interactive time plot" action={<HandNote>Same data. Bigger insights.</HandNote>}>
          <p className="mb-2 text-sm text-slate-500">
            Explore how the data change over time. Double-click to add a point, drag to move a value, select and press Delete to remove.
          </p>
          <TimeChart
            series={[{ id: 'y', label: shuffled ? 'Shuffled values' : 'Original order', values: windowed.map((row) => row.value), markers, dotted: shuffled }]}
            labels={windowed.map((row) => row.label ?? String(row.t + 1))}
            points={windowed}
            editable
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={(next) => {
              if (zoom === 'all') {
                setCustom(next)
                return
              }
              const byId = new Map(next.map((row) => [row.id, row]))
              setCustom(ordered.map((row) => byId.get(row.id) ?? row))
            }}
            onAdd={({ t, value }) => {
              const id = `custom-${Date.now()}`
              setCustom([...ordered, { id, t: Math.max(0, t), value, label: `t=${t}` }])
              setSelectedId(id)
            }}
            showGrid={grid}
            xLabel={frequency === 'index' ? 'Index' : 'Date'}
            yLabel="Value"
            title="Time plot of the selected series"
          />
        </TsCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Worked example" className="ts-wash-emerald">
            <ol className="space-y-2 text-sm leading-6 text-slate-600">
              <li>1. Load a daily temperature series.</li>
              <li>2. Put date on the x-axis and temperature on the y-axis.</li>
              <li>3. Look for any repeating yearly cycle.</li>
              <li>4. Write down what you notice before fitting a model.</li>
            </ol>
          </TsCard>
          <TsCard title="Reading a time plot">
            <ConceptList
              items={[
                'Level — what typical value does the series sit around?',
                'Trend — is there a long-run rise or fall?',
                'Seasonality — do peaks return at a fixed interval?',
                'Variability — does the spread stay steady?',
                'Outliers — are there unusual spikes or drops?',
              ]}
            />
          </TsCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Common patterns to notice">
            <div className="grid gap-3 sm:grid-cols-2">
              <Insight title="Upward trend">Values generally increase over time.</Insight>
              <Insight title="Seasonal pattern">Repeating cycles at a regular interval.</Insight>
              <Insight title="Changing variability">Periods of higher or lower fluctuation.</Insight>
              <Insight title="Outliers">Unusually high or low values.</Insight>
            </div>
          </TsCard>
          <TsCard title="Key takeaways" className="ts-wash-amber">
            <ConceptList
              items={[
                'A time plot is the first step toward understanding a series.',
                'Order is information. Shuffling the same numbers hides the story.',
                'Use the plot to spot trend, seasonality, variability, and outliers before modeling.',
              ]}
            />
          </TsCard>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Plot controls">
          <div className="space-y-3">
            <TsSelect
              label="Dataset"
              value={preset}
              onChange={(value) => {
                const next = value as PresetId
                setPreset(next)
                setCustom(null)
                setFrequency(DATASETS.find((item) => item.value === next)?.frequency ?? 'index')
              }}
              options={DATASETS}
            />
            <TsSelect label="Frequency" value={frequency} onChange={(value) => setFrequency(value as Frequency)} options={FREQUENCIES} />
            <TsToggle label="Show data markers" checked={markers} onChange={setMarkers} />
            <TsToggle label="Show grid lines" checked={grid} onChange={setGrid} />
            <TsToggle label="Shuffle values (keep dates)" checked={shuffled} onChange={setShuffled} />
            <TsSelect
              label="Zoom range"
              value={zoom}
              onChange={(value) => setZoom(value as typeof zoom)}
              options={[
                { value: 'all', label: 'All' },
                { value: '60', label: 'Last 60 points' },
                { value: '180', label: 'Last 180 points' },
                { value: '365', label: 'Last 365 points' },
              ]}
            />
            <button type="button" className="ts-btn w-full" onClick={() => setCustom(null)}>
              Update plot
            </button>
            <ResetButton onClick={reset} label="Reset" />
          </div>
        </TsCard>
        <HandNote className="text-right">A time plot is the first step to understanding your data&apos;s story.</HandNote>
      </aside>
    </div>
  )
}
