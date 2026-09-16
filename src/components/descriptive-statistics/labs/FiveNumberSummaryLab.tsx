import { useMemo, useState } from 'react'
import {
  FIVE_NUMBER_DEFAULT,
  PRACTICE_FIVE,
  QUANTILE_METHOD,
  WORKED_FIVE,
  formatNum,
  summarize,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { DatasetEditor, DsCard, FormulaBlock, LabSplit, MetricCard, QuizBlock } from '../shared'
import { BoxPlotChart, FiveNumberStrip } from '../plots'

export function FiveNumberSummaryLab({ tab }: { tab: DsTab }) {
  const [values, setValues] = useState(FIVE_NUMBER_DEFAULT)
  const [step, setStep] = useState(5)
  const stats = useMemo(() => summarize(values), [values])
  const worked = useMemo(() => summarize(WORKED_FIVE), [])
  const practice = useMemo(() => summarize(PRACTICE_FIVE), [])
  const sorted = stats.n ? [...values].sort((a, b) => a - b) : []

  if (tab === 'learn') {
    return (
      <DsCard title="Five numbers">
        <p className="text-sm leading-6 text-slate-600">Sort the data, find the median, then read Q1 and Q3 from the same {QUANTILE_METHOD} rule used in every other lab. The picture is Min — Q1 — Median — Q3 — Max.</p>
        <FormulaBlock tex={'\\text{IQR}=Q_3-Q_1'} />
      </DsCard>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Practice">
        <QuizBlock
          prompt={`Median of ${PRACTICE_FIVE.join(', ')}?`}
          options={[formatNum(practice.min), formatNum(practice.median), formatNum(practice.q3), formatNum(practice.max)]}
          answer={1}
          explanation={`Even n uses the average of the two central values: ${formatNum(practice.median)}.`}
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard title="Five-number workspace">
          <DatasetEditor values={values} onChange={setValues} fallback={FIVE_NUMBER_DEFAULT} presets={['five', 'shared', 'scores30', 'outliers']} />
          <div className="mt-3 flex flex-wrap gap-2">
            {['Sort', 'Median', 'Split', 'Q1', 'Q3'].map((label, index) => (
              <button
                key={label}
                type="button"
                className={`ds-btn ${step >= index + 1 ? '' : 'ds-btn-ghost'}`}
                onClick={() => setStep(index + 1)}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
          {step >= 1 && <p className="mt-3 text-sm text-slate-500">Sorted: {sorted.join(', ')}</p>}
          <FiveNumberStrip box={stats.box} />
          <div className="mx-auto max-w-xs">
            <BoxPlotChart box={stats.box} values={values} height={220} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-5">
            <MetricCard label="Min" value={formatNum(stats.min)} />
            <MetricCard label="Q1" value={formatNum(stats.q1)} />
            <MetricCard label="Median" value={formatNum(stats.median)} />
            <MetricCard label="Q3" value={formatNum(stats.q3)} />
            <MetricCard label="Max" value={formatNum(stats.max)} />
          </div>
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <p className="text-sm leading-6 text-slate-600">Lower half sits left of the median. Upper half sits right. IQR = {formatNum(stats.iqr)}. Quartiles use {QUANTILE_METHOD}, not “median of each half,” so odd and even n stay consistent with the box-plot lab.</p>
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            {WORKED_FIVE.join(', ')} → min {formatNum(worked.min)}, Q1 {formatNum(worked.q1)}, median {formatNum(worked.median)}, Q3 {formatNum(worked.q3)}, max {formatNum(worked.max)}.
          </p>
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt={`Median of ${PRACTICE_FIVE.join(', ')}?`}
            options={[formatNum(practice.min), formatNum(practice.median), formatNum(practice.q3), formatNum(practice.max)]}
            answer={1}
            explanation={`Median = ${formatNum(practice.median)}.`}
          />
        </DsCard>
      }
    />
  )
}
