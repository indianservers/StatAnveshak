import { useState } from 'react'
import {
  FAVORITE_SUBJECTS,
  HOUSEHOLD_SPEND,
  PAIRED_HOURS_SCORES,
  TIME_SERIES,
  histogramBins,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { DsCard, DsSelect, Insight, LabSplit, QuizBlock } from '../shared'
import { BarChart, HistogramPlot, LineChart, PieChart, ScatterPlot } from '../plots'

const CHARTS = [
  { id: 'bar', label: 'Bar chart', good: 'Categorical counts' },
  { id: 'histogram', label: 'Histogram', good: 'Quantitative, possibly grouped' },
  { id: 'pie', label: 'Pie chart', good: 'Parts of one whole' },
  { id: 'line', label: 'Line chart', good: 'Time or ordered sequence' },
  { id: 'scatter', label: 'Scatter plot', good: 'Paired numerical variables' },
  { id: 'dot', label: 'Dot plot', good: 'Small numerical lists' },
] as const

type ChartId = (typeof CHARTS)[number]['id']
type Scenario = 'nominal' | 'ordinal' | 'discrete' | 'continuous' | 'paired' | 'time'

const SCENARIOS: Record<Scenario, { label: string; ok: ChartId[]; why: string }> = {
  nominal: { label: 'Categorical nominal (favorite subject)', ok: ['bar', 'pie'], why: 'These are unordered categories with counts.' },
  ordinal: { label: 'Categorical ordinal (satisfaction)', ok: ['bar'], why: 'Order matters, so a bar chart in rank order is safer than a pie.' },
  discrete: { label: 'Discrete numerical (siblings)', ok: ['bar', 'histogram', 'dot'], why: 'Counts of a number can be bars or a histogram.' },
  continuous: { label: 'Continuous numerical (wait time)', ok: ['histogram', 'dot'], why: 'Continuous values need bins, not category slices.' },
  paired: { label: 'Paired numerical (hours vs score)', ok: ['scatter'], why: 'Two measured variables need a scatter plot.' },
  time: { label: 'Time series (daily tickets)', ok: ['line', 'bar'], why: 'Time has order. A line keeps that sequence.' },
}

export function DataVisualizationLab({ tab }: { tab: DsTab }) {
  const [chart, setChart] = useState<ChartId>('bar')
  const [scenario, setScenario] = useState<Scenario>('nominal')
  const allowed = SCENARIOS[scenario].ok.includes(chart)
  const scores = [12, 15, 18, 20, 22, 24, 26, 28, 31, 35, 40, 42, 45, 48, 52]

  if (tab === 'learn') {
    return (
      <DsCard title="Match the chart to the variable">
        <p className="text-sm leading-6 text-slate-600">A chart is a claim about the data type. Bars compare categories. Histograms bin quantities. Scatter needs pairs. Pie is only for parts of one whole.</p>
      </DsCard>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Practice">
        <QuizBlock
          prompt="Which chart is most appropriate for percentage of household expenditure?"
          options={['Histogram', 'Scatter plot', 'Pie chart', 'Box plot']}
          answer={2}
          explanation="Expenditure shares are parts of one budget, so a pie (or a bar of percentages) is the natural display."
        />
      </DsCard>
    )
  }

  return (
    <LabSplit
      demo={
        <DsCard title="Choose a visualization">
          <div className="grid gap-3 sm:grid-cols-2">
            <DsSelect
              label="Scenario"
              value={scenario}
              onChange={(value) => setScenario(value as Scenario)}
              options={Object.entries(SCENARIOS).map(([id, item]) => ({ value: id, label: item.label }))}
            />
            <DsSelect
              label="Chart type"
              value={chart}
              onChange={(value) => setChart(value as ChartId)}
              options={CHARTS.map((item) => ({ value: item.id, label: item.label }))}
            />
          </div>
          <div className="mt-4 min-h-[240px]">
            {chart === 'bar' && <BarChart items={FAVORITE_SUBJECTS} />}
            {chart === 'histogram' && <HistogramPlot bins={histogramBins(scores, 6)} />}
            {chart === 'pie' && <PieChart items={scenario === 'time' ? HOUSEHOLD_SPEND : FAVORITE_SUBJECTS} />}
            {chart === 'line' && <LineChart items={TIME_SERIES} />}
            {chart === 'scatter' && <ScatterPlot points={PAIRED_HOURS_SCORES} />}
            {chart === 'dot' && <HistogramPlot bins={histogramBins(scores, scores.length)} />}
          </div>
          <p className={`mt-3 rounded-2xl px-4 py-3 text-sm ${allowed ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {allowed
              ? `${CHARTS.find((item) => item.id === chart)?.label} fits this scenario. ${SCENARIOS[scenario].why}`
              : `${CHARTS.find((item) => item.id === chart)?.label} is a poor match. ${SCENARIOS[scenario].why} Prefer: ${SCENARIOS[scenario].ok.join(', ')}.`}
          </p>
        </DsCard>
      }
      concepts={
        <DsCard title="Interpretation">
          <p className="text-sm leading-6 text-slate-600">Favorite subjects: Science leads with 28, History is smallest with 12. A bar chart keeps the categories comparable. A pie is acceptable because the counts form one class.</p>
          <Insight title="Rule of thumb">If you cannot name the whole, do not slice a pie. If you have two numeric columns, do not force a histogram.</Insight>
        </DsCard>
      }
      worked={
        <DsCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">Household expenditure is a composition. Pie or stacked percent bars show the share of each category.</p>
          <PieChart items={HOUSEHOLD_SPEND} />
        </DsCard>
      }
      practice={
        <DsCard title="Your turn">
          <QuizBlock
            prompt="Best chart for percentage of household expenditure?"
            options={['Histogram', 'Scatter plot', 'Pie chart', 'Box plot']}
            answer={2}
            explanation="Parts of one whole → pie or percent bar."
          />
        </DsCard>
      }
    />
  )
}
