import { useMemo, useState } from 'react'
import {
  BOX_DEFAULT,
  PRACTICE_BOX,
  QUANTILE_METHOD,
  WORKED_BOX,
  formatNum,
  summarize,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { DatasetEditor, DsCard, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock } from '../shared'
import { BoxPlotChart } from '../plots'

export function BoxPlotOutliersLab({ tab }: { tab: DsTab }) {
  const [values, setValues] = useState(BOX_DEFAULT)
  const [selected, setSelected] = useState<number | null>(null)
  const stats = useMemo(() => summarize(values), [values])
  const worked = useMemo(() => summarize(WORKED_BOX), [])
  const practice = useMemo(() => summarize(PRACTICE_BOX), [])

  if (tab === 'learn') {
    return (
      <DsCard title="Tukey box plot">
        <p className="text-sm leading-6 text-slate-600">The box runs from Q1 to Q3. Whiskers stop at the last inlier inside the fences Q1 − 1.5×IQR and Q3 + 1.5×IQR. Points beyond the fences are flagged, not automatically deleted.</p>
        <FormulaBlock tex={'\\text{fence}=Q_{1,3}\\pm 1.5\\times\\text{IQR}'} />
      </DsCard>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Practice">
        <QuizBlock
          prompt={`Which value is an outlier in ${PRACTICE_BOX.join(', ')}?`}
          options={['14', '40', '15', 'None of these']}
          answer={1}
          explanation={`Upper fence ${formatNum(practice.box.upperFence)}. 40 sits above it.`}
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard title="Interactive box plot" action={<span className="text-[11px] font-semibold text-slate-400">{QUANTILE_METHOD} fences</span>}>
          <DatasetEditor values={values} onChange={setValues} fallback={BOX_DEFAULT} presets={['exam', 'outliers', 'shared', 'five']} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="ds-btn ds-btn-ghost" onClick={() => setValues([...values, Math.max(...values, 0) + 40])}>
              Add outlier
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={() => setValues(values.filter((value) => value >= stats.box.lowerFence && value <= stats.box.upperFence))}
            >
              Remove outliers
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <BoxPlotChart box={stats.box} values={values} selected={selected} onSelect={setSelected} height={280} />
            <div className="space-y-2 text-sm">
              <MetricCard label="Min" value={formatNum(stats.min)} />
              <MetricCard label="Q1" value={formatNum(stats.q1)} />
              <MetricCard label="Median" value={formatNum(stats.median)} />
              <MetricCard label="Q3" value={formatNum(stats.q3)} />
              <MetricCard label="Max" value={formatNum(stats.max)} />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            IQR = {formatNum(stats.iqr)}. Fences {formatNum(stats.box.lowerFence)} to {formatNum(stats.box.upperFence)}. Whiskers stop at {formatNum(stats.box.lowerWhisker)} and {formatNum(stats.box.upperWhisker)}, not automatically at min/max.
          </p>
          {stats.box.outliers.length > 0 ? (
            <p className="mt-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {stats.box.outliers.length} outlier{stats.box.outliers.length === 1 ? '' : 's'}: {stats.box.outliers.join(', ')}
            </p>
          ) : (
            <p className="mt-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">No Tukey outliers in this sample.</p>
          )}
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <p className="text-sm leading-6 text-slate-600">The box is the middle 50%. Whiskers reach the farthest points still inside 1.5×IQR. Mean {formatNum(stats.mean)} and range {formatNum(stats.range)} move when you add 120; median and IQR usually do not.</p>
          <Insight title="Outliers are not mistakes">They are part of the story until you have a reason to exclude them.</Insight>
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            Park-tree ages {WORKED_BOX.join(', ')}. Median {formatNum(worked.median)}, IQR {formatNum(worked.iqr)}, upper fence {formatNum(worked.box.upperFence)}. {worked.box.outliers.join(', ') || 'None'} flagged.
          </p>
          <BoxPlotChart box={worked.box} values={WORKED_BOX} height={180} />
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt={`Outlier in ${PRACTICE_BOX.join(', ')}?`}
            options={['14', '40', '15', 'None of these']}
            answer={1}
            explanation={`40 exceeds the upper fence ${formatNum(practice.box.upperFence)}.`}
          />
        </DsCard>
      }
    />
  )
}
