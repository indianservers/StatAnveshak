import { useMemo, useState } from 'react'
import {
  QUANTILE_METHOD,
  TEST_SCORES_30,
  formatNum,
  histogramBins,
  percentile,
  percentileRank,
  rankOf,
  summarize,
  zScore,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { DatasetEditor, DsCard, DsSlider, FormulaBlock, LabSplit, MetricCard, QuizBlock } from '../shared'
import { HistogramPlot } from '../plots'

export function PositionMeasuresLab({ tab }: { tab: DsTab }) {
  const [values, setValues] = useState(TEST_SCORES_30)
  const [p, setP] = useState(80)
  const stats = useMemo(() => summarize(values), [values])
  const bins = useMemo(() => histogramBins(values, 8), [values])
  const xp = percentile(values, p)
  const selected = values.reduce((best, value) => (Math.abs(value - xp) < Math.abs(best - xp) ? value : best), values[0] ?? 0)
  const rank = rankOf(values, selected)
  const z = zScore(selected, values)

  if (tab === 'learn') {
    return (
      <DsCard title="Relative position">
        <p className="text-sm leading-6 text-slate-600">A percentile is a location on the ordered list. Quartiles are the 25th, 50th, and 75th percentiles. A z-score says how many sample standard deviations a value sits from the mean.</p>
        <FormulaBlock tex={'z=(x-\\bar{x})/s'} label="Standardized position" />
        <p className="mt-3 text-xs text-slate-400">This studio uses {QUANTILE_METHOD} interpolation everywhere.</p>
      </DsCard>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Practice">
        <QuizBlock
          prompt="On the default test-score set, which value is closest to Q1?"
          options={['45', '59', '72', '85']}
          answer={1}
          explanation={`Q1 = ${formatNum(stats.q1)} using ${QUANTILE_METHOD}.`}
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard title="Explore position" action={<span className="text-[11px] font-semibold text-slate-400">n = {stats.n}</span>}>
          <DatasetEditor values={values} onChange={setValues} fallback={TEST_SCORES_30} presets={['scores30', 'shared', 'center', 'five']} />
          <HistogramPlot
            bins={bins}
            markers={[
              { value: stats.q1, color: '#2563eb', label: 'Q1' },
              { value: stats.median, color: '#059669', label: 'P50' },
              { value: stats.q3, color: '#7c3aed', label: 'Q3' },
              { value: xp, color: '#f59e0b', label: `P${p}` },
            ]}
          />
          <DsSlider label="Percentile" value={p} min={1} max={99} step={1} onChange={setP} display={`P${p} = ${formatNum(xp)}`} />
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="Value" value={formatNum(xp)} />
            <MetricCard label="Percentile rank" value={`${formatNum(percentileRank(values, selected), 1)}%`} />
            <MetricCard label="Average rank" value={formatNum(rank.average, 1)} />
            <MetricCard label="z-score" value={formatNum(z)} />
          </div>
        </DsCard>
      }
      concepts={
        <DsCard title="Key concepts">
          <p className="text-sm leading-6 text-slate-600">Q1 = {formatNum(stats.q1)}, median = {formatNum(stats.median)}, Q3 = {formatNum(stats.q3)}. The selected score {formatNum(selected)} has rank {formatNum(rank.average, 1)} of {stats.n}.</p>
          <FormulaBlock tex={'P_p=Q(p/100)'} label={`${QUANTILE_METHOD} quantile`} />
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">For these {stats.n} scores, the 80th percentile interpolates to {formatNum(percentile(values, 80))}.</p>
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt="Q1 of the default test scores is closest to…"
            options={['45', '59', '72', '85']}
            answer={1}
            explanation={`Q1 = ${formatNum(stats.q1)}.`}
          />
        </DsCard>
      }
    />
  )
}
