import { useMemo, useState } from 'react'
import {
  FREQ_DEFAULT,
  FREQ_SIBLINGS,
  PRACTICE_FREQ,
  formatNum,
  groupedFrequency,
  histogramBins,
  parseNumbers,
  ungroupedFrequency,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { ChipToggle, DsCard, DsSlider, FormulaBlock, LabSplit, QuizBlock } from '../shared'
import { BarChart, FrequencyPolygon, HistogramPlot } from '../plots'

export function FrequencyTablesLab({ tab }: { tab: DsTab }) {
  const [draft, setDraft] = useState(FREQ_DEFAULT.join(' '))
  const [values, setValues] = useState(FREQ_DEFAULT)
  const [grouped, setGrouped] = useState(false)
  const [bins, setBins] = useState(4)
  const [showBar, setShowBar] = useState(true)
  const [showHist, setShowHist] = useState(true)
  const [highlight, setHighlight] = useState<number | null>(null)
  const ungrouped = useMemo(() => ungroupedFrequency(values), [values])
  const classes = useMemo(() => groupedFrequency(values, bins), [values, bins])
  const hist = useMemo(() => histogramBins(values, bins), [values, bins])
  const siblings = useMemo(() => ungroupedFrequency(FREQ_SIBLINGS), [])
  const practice = useMemo(() => ungroupedFrequency(PRACTICE_FREQ), [])

  const apply = (input: string) => {
    const parsed = parseNumbers(input)
    if (parsed.values.length) setValues(parsed.values)
  }

  if (tab === 'learn') {
    return (
      <DsCard title="From list to table">
        <p className="text-sm leading-6 text-slate-600">Frequency is how often a value occurs. Relative frequency is that count divided by n. Cumulative frequency is the running total of values at or below a cut.</p>
        <FormulaBlock tex={'\\text{relative frequency}=f/n'} />
      </DsCard>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    const six = practice.find((row) => row.value === 6)
    return (
      <DsCard title="Practice">
        <p className="mb-3 text-sm text-slate-600">Hours of sleep: {PRACTICE_FREQ.join(', ')}</p>
        <QuizBlock
          prompt="What is the frequency of 6?"
          options={['3', '4', String(six?.frequency ?? 5), '6']}
          answer={2}
          explanation={`6 appears ${six?.frequency} times. Relative frequency ${formatNum(six?.relative ?? 0, 2)}.`}
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard
          title="Build a frequency table"
          action={
            <button type="button" className="ds-btn ds-btn-ghost" onClick={() => { setDraft(FREQ_DEFAULT.join(' ')); setValues(FREQ_DEFAULT) }}>
              Use example data
            </button>
          }
        >
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">1. Enter your data</span>
            <textarea className="ds-textarea" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Frequency data" />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <ChipToggle checked={grouped} onChange={setGrouped} label="Grouped classes" />
            <ChipToggle checked={showBar} onChange={setShowBar} label="Show bar chart" />
            <ChipToggle checked={showHist} onChange={setShowHist} label="Show histogram" />
          </div>
          {grouped && <DsSlider label="Number of classes" value={bins} min={3} max={10} step={1} onChange={setBins} />}
          <button type="button" className="ds-btn mt-3" onClick={() => apply(draft)}>
            Create frequency table
          </button>
          <div className="mt-4 overflow-x-auto">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>{grouped ? 'Class' : 'Value'}</th>
                  {!grouped && <th>Tally</th>}
                  <th>Frequency</th>
                  <th>Relative</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {(grouped ? classes : ungrouped).map((row, index) => {
                  const key = 'value' in row ? row.value : row.start
                  const active = highlight === key
                  return (
                    <tr key={index} className={active ? 'ds-cell-active' : ''} onClick={() => setHighlight(key)} style={{ cursor: 'pointer' }}>
                      <td>{'value' in row ? row.value : row.label}</td>
                      {'tally' in row && <td>{row.tally}</td>}
                      <td>{row.frequency}</td>
                      <td>{formatNum(row.relative, 2)}</td>
                      <td>{row.cumulative}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td>Total</td>
                  {!grouped && <td>—</td>}
                  <td>{values.length}</td>
                  <td>1.00</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {showBar && (
              <BarChart
                items={ungrouped.map((row, index) => ({
                  label: String(row.value),
                  count: row.frequency,
                  color: ['#60a5fa', '#2563eb', '#a78bfa', '#f59e0b'][index % 4],
                }))}
              />
            )}
            {showHist && <HistogramPlot bins={hist} height={200} />}
          </div>
          <FrequencyPolygon bins={hist} />
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <ol className="space-y-3 text-sm leading-6 text-slate-600">
            <li><strong>Frequency</strong> — how many times a value (or class) occurs.</li>
            <li><strong>Relative frequency</strong> — f / n, a share between 0 and 1.</li>
            <li><strong>Cumulative frequency</strong> — running total of frequencies up to that row.</li>
          </ol>
          <FormulaBlock tex={'CF_k=\\sum_{i\\le k} f_i'} />
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="mb-2 text-sm text-slate-600">Siblings of 12 students: {FREQ_SIBLINGS.join(', ')}</p>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>f</th>
                <th>Rel</th>
                <th>CF</th>
              </tr>
            </thead>
            <tbody>
              {siblings.map((row) => (
                <tr key={row.value}>
                  <td>{row.value}</td>
                  <td>{row.frequency}</td>
                  <td>{formatNum(row.relative, 2)}</td>
                  <td>{row.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DsCard>
      }
      practice={
        <DsCard title="Try it yourself">
          <p className="mb-2 text-sm text-slate-600">Hours of sleep: {PRACTICE_FREQ.join(', ')}</p>
          <QuizBlock
            prompt="Frequency of 6?"
            options={['3', '4', String(practice.find((row) => row.value === 6)?.frequency ?? 5), '7']}
            answer={2}
            explanation="Count the sixes, then optionally add relative and cumulative columns."
          />
        </DsCard>
      }
    />
  )
}
