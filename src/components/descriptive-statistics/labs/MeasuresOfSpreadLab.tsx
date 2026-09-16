import { useMemo, useState } from 'react'
import {
  QUANTILE_METHOD,
  SPREAD_DEFAULT,
  WORKED_SPREAD,
  formatNum,
  summarize,
  type DsTab,
  type VarianceMode,
} from '../../../lib/descriptiveStatistics'
import { DatasetEditor, DsCard, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock } from '../shared'
import { DeviationPlot, DotPlot } from '../plots'

export function MeasuresOfSpreadLab({ tab }: { tab: DsTab }) {
  const [values, setValues] = useState(SPREAD_DEFAULT)
  const [mode, setMode] = useState<VarianceMode>('sample')
  const [selected, setSelected] = useState<number | null>(null)
  const stats = useMemo(() => summarize(values), [values])
  const worked = useMemo(() => summarize(WORKED_SPREAD), [])
  const variance = mode === 'sample' ? stats.sampleVar : stats.popVar
  const sd = mode === 'sample' ? stats.sampleSd : stats.popSd

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <DsCard title="Concept">
          <p className="text-sm leading-6 text-slate-600">Spread asks how far the values sit from each other. Range uses only the ends. IQR uses the middle half. Variance and standard deviation use every deviation from the mean.</p>
          <FormulaBlock tex={'s^2=\\sum(x_i-\\bar{x})^2/(n-1)'} label="Sample variance" />
        </DsCard>
        <Insight title="Same center, different spread">Two datasets can share a mean and still look nothing alike once you draw the deviations.</Insight>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Check">
        <QuizBlock
          prompt="Which measure of spread is least affected by a single extreme outlier?"
          options={['Range', 'Variance', 'Standard deviation', 'IQR']}
          answer={3}
          explanation="IQR uses Q1 and Q3, so one far tail value usually leaves it unchanged."
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard title="Explore spread" action={<span className="text-[11px] font-semibold text-slate-400">{QUANTILE_METHOD} quartiles</span>}>
          <DatasetEditor values={values} onChange={setValues} fallback={SPREAD_DEFAULT} presets={['shared', 'lowSpread', 'highSpread', 'outliers', 'symmetric']} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={`ds-btn ${mode === 'sample' ? '' : 'ds-btn-ghost'}`} onClick={() => setMode('sample')}>
              Sample (n−1)
            </button>
            <button type="button" className={`ds-btn ${mode === 'population' ? '' : 'ds-btn-ghost'}`} onClick={() => setMode('population')}>
              Population (N)
            </button>
          </div>
          <DotPlot values={values} selected={selected} onSelect={setSelected} markers={[{ value: stats.mean, color: '#f59e0b', label: 'Mean' }]} />
          <DeviationPlot values={values} mean={stats.mean} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Range" value={formatNum(stats.range)} hint={`${formatNum(stats.max)} − ${formatNum(stats.min)}`} />
            <MetricCard label={mode === 'sample' ? 's²' : 'σ²'} value={formatNum(variance)} />
            <MetricCard label={mode === 'sample' ? 's' : 'σ'} value={formatNum(sd)} />
            <MetricCard label="IQR" value={formatNum(stats.iqr)} hint={`${formatNum(stats.q3)} − ${formatNum(stats.q1)}`} />
            <MetricCard label="MAD" value={formatNum(stats.mad)} />
            <MetricCard label="n" value={String(stats.n)} />
          </div>
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <FormulaBlock tex={'\\text{IQR}=Q_3-Q_1'} />
          <p className="mt-3 text-sm leading-6 text-slate-600">Drag values away from the amber mean line. Squared deviations grow faster than absolute deviations, so variance reacts more than MAD.</p>
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            Data {WORKED_SPREAD.join(', ')}. Range {formatNum(worked.range)}, sample variance {formatNum(worked.sampleVar)}, s = {formatNum(worked.sampleSd)}, IQR {formatNum(worked.iqr)}.
          </p>
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt="Which measure is least affected by outliers?"
            options={['Range', 'Variance', 'Standard deviation', 'IQR']}
            answer={3}
            explanation="The IQR ignores the extreme tails."
          />
        </DsCard>
      }
    />
  )
}
