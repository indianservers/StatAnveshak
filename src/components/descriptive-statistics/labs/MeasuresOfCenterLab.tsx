import { useMemo, useState } from 'react'
import {
  CENTER_DEFAULT,
  PRACTICE_CENTER,
  QUANTILE_METHOD,
  WORKED_CENTER,
  formatModes,
  formatNum,
  randomSample,
  summarize,
  trimmedMean,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { ChipToggle, DataChips, DatasetEditor, DsCard, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock } from '../shared'
import { DotPlot } from '../plots'

export function MeasuresOfCenterLab({ tab }: { tab: DsTab }) {
  const [values, setValues] = useState(CENTER_DEFAULT)
  const [selected, setSelected] = useState<number | null>(null)
  const [showMean, setShowMean] = useState(true)
  const [showMedian, setShowMedian] = useState(true)
  const [showMode, setShowMode] = useState(true)
  const stats = useMemo(() => summarize(values), [values])
  const worked = useMemo(() => summarize(WORKED_CENTER), [])
  const practice = useMemo(() => summarize(PRACTICE_CENTER), [])
  const markers = [
    ...(showMean ? [{ value: stats.mean, color: '#f59e0b', label: 'Mean' }] : []),
    ...(showMedian ? [{ value: stats.median, color: '#059669', label: 'Median', dash: true }] : []),
    ...(showMode && stats.modes.frequency > 1 ? stats.modes.values.map((value) => ({ value, color: '#2563eb', label: 'Mode' })) : []),
  ]

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <DsCard title="Concept">
          <p className="text-sm leading-6 text-slate-600">
            A measure of center is one number that stands for the whole list. The mean is the balance point, the median is the middle ranked value, and the mode is the most frequent value.
          </p>
          <FormulaBlock tex={'\\bar{x}=(\\sum x_i)/n'} label="Arithmetic mean" />
        </DsCard>
        <DsCard title="When they disagree">
          <Insight title="Try this">
            Add one extreme value. The mean shifts strongly, the median usually shifts less, and the mode often stays put.
          </Insight>
        </DsCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt={`What is the median of ${PRACTICE_CENTER.join(', ')}?`}
          options={['5', '6', '8', '11']}
          answer={1}
          explanation={`n is odd, so the middle ranked value is ${formatNum(practice.median)}.`}
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard title="Explore measures of center" action={<span className="text-[11px] font-semibold text-slate-400">{QUANTILE_METHOD} median</span>}>
          <DatasetEditor values={values} onChange={setValues} fallback={CENTER_DEFAULT} presets={['center', 'shared', 'rightSkew', 'leftSkew', 'outliers', 'repeats']} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="ds-btn ds-btn-ghost" onClick={() => setValues(randomSample(10, 2, 16))}>
              Generate new data
            </button>
            <button type="button" className="ds-btn ds-btn-ghost" onClick={() => setValues([...values, Math.max(...values, 0) + 12])}>
              Add an extreme value
            </button>
          </div>
          <div className="mt-4">
            <DataChips values={values} selected={selected} onSelect={setSelected} onRemove={(index) => setValues(values.filter((_, i) => i !== index))} />
          </div>
          <DotPlot values={values} selected={selected} onSelect={setSelected} markers={markers} />
          <div className="mt-2 flex flex-wrap gap-4">
            <ChipToggle checked={showMean} onChange={setShowMean} label="Mean" />
            <ChipToggle checked={showMedian} onChange={setShowMedian} label="Median" />
            <ChipToggle checked={showMode} onChange={setShowMode} label="Mode" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="n" value={String(stats.n)} />
            <MetricCard label="Mean" value={formatNum(stats.mean)} accent="#d97706" />
            <MetricCard label="Median" value={formatNum(stats.median)} accent="#059669" />
            <MetricCard label="Mode" value={formatModes(stats.modes)} accent="#2563eb" />
          </div>
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <p className="text-sm leading-6 text-slate-600">Mean {formatNum(stats.mean)} is the balance point of the {stats.n} dots. Median {formatNum(stats.median)} is the middle of the ordered list. Mode {formatModes(stats.modes)} is the tallest stack.</p>
          <FormulaBlock tex={'\\bar{x}_w=\\sum w_i x_i/\\sum w_i'} label="Weighted mean" />
          <p className="mt-3 text-sm text-slate-500">10% trimmed mean: {formatNum(trimmedMean(values, 0.1))}</p>
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">Data: {WORKED_CENTER.join(', ')}. Mean {formatNum(worked.mean)}, median {formatNum(worked.median)}, modes {formatModes(worked.modes)} (4 and 9 each appear twice).</p>
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt={`Median of ${PRACTICE_CENTER.join(', ')}?`}
            options={['5', '6', '8', '11']}
            answer={1}
            explanation={`The middle value is ${formatNum(practice.median)}.`}
          />
        </DsCard>
      }
    />
  )
}
