import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { useDataset } from '../../hooks/useDataset'
import {
  describeSeries,
  extractNumericSeries,
  formatStat,
  meanTrace,
  parseNumberList,
  percentile,
  type SpreadKind,
} from '../../lib/statEngine'
import { MathText } from '../ui/MathText'
import { StatisticResult } from './StatisticResult'
import { VariableSelector } from './VariableSelector'

export function StatisticsCalculator() {
  const { dataset, numericColumns } = useDataset()
  const [source, setSource] = useState<'manual' | 'column'>('manual')
  const [raw, setRaw] = useState('12, 14, 15, 18, 18, 21')
  const [column, setColumn] = useState(numericColumns[0] ?? '')
  const [spread, setSpread] = useState<SpreadKind>('sample')
  const [pctl, setPctl] = useState(90)
  const [showSteps, setShowSteps] = useState(false)

  const parsed = useMemo(() => parseNumberList(raw), [raw])
  const columnSeries = useMemo(() => {
    if (!dataset || !column) return { values: [] as number[], missing: 0 }
    return extractNumericSeries(dataset.data, column)
  }, [column, dataset])

  const values = source === 'manual' ? parsed.values : columnSeries.values
  const missing = source === 'manual' ? parsed.issues.length : columnSeries.missing
  const stats = describeSeries(values, missing, spread)
  const extraPercentile = percentile(values, pctl)

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-indigo-500" />
        <h2 className="font-bold text-slate-800 dark:text-white">Statistics calculator</h2>
      </div>
      <p className="mb-4 text-sm text-slate-500">Enter values or choose a numeric dataset column. Variance and SD use sample (n − 1) or population (n).</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={`rounded-full px-3 py-1.5 text-xs font-bold ${source === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`} onClick={() => setSource('manual')}>
          Manual values
        </button>
        <button type="button" className={`rounded-full px-3 py-1.5 text-xs font-bold ${source === 'column' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`} onClick={() => setSource('column')}>
          Dataset column
        </button>
        <button type="button" className={`rounded-full px-3 py-1.5 text-xs font-bold ${spread === 'sample' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`} onClick={() => setSpread('sample')}>
          Sample
        </button>
        <button type="button" className={`rounded-full px-3 py-1.5 text-xs font-bold ${spread === 'population' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`} onClick={() => setSpread('population')}>
          Population
        </button>
      </div>
      {source === 'manual' ? (
        <label className="block text-xs font-semibold text-slate-500">
          Values (commas or new lines)
          <textarea
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="12, 14, 15, 18, 18, 21"
          />
        </label>
      ) : (
        <VariableSelector
          columns={dataset?.schema ?? []}
          value={column}
          onChange={setColumn}
          role="numeric"
          label="Numeric column"
          allowEmpty={false}
        />
      )}
      {source === 'manual' && parsed.issues.length > 0 ? (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Ignored {parsed.issues.length} invalid token{parsed.issues.length === 1 ? '' : 's'}: {parsed.issues.map((issue) => `“${issue.token}”`).join(', ')}. Missing values are not treated as zero.
        </p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">
        Valid observations: {stats.valid}
        {stats.missing ? ` · Missing / invalid: ${stats.missing}` : ''}
        {' · '}
        {spread === 'sample' ? 'Sample variance divides by n − 1' : 'Population variance divides by n'}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Center</p>
          <div className="grid grid-cols-3 gap-2">
            <StatisticResult label="Mean" value={stats.mean} formula={'\\bar{x}=\\Sigma x_i/n'} hint="Average of the valid observations." />
            <StatisticResult label="Median" value={stats.median} hint="Middle value after sorting." />
            <StatisticResult label="Mode" value={stats.mode} hint="Most frequent value(s)." />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Spread</p>
          <div className="grid grid-cols-2 gap-2">
            <StatisticResult label="Range" value={stats.range} />
            <StatisticResult label={spread === 'sample' ? 'Sample variance' : 'Population variance'} value={stats.variance} formula={spread === 'sample' ? 's^2=\\Sigma(x_i-\\bar{x})^2/(n-1)' : '\\sigma^2=\\Sigma(x_i-\\mu)^2/n'} />
            <StatisticResult label={spread === 'sample' ? 'Sample SD' : 'Population SD'} value={stats.sd} />
            <StatisticResult label="IQR" value={stats.iqr} hint="Q3 − Q1." />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Position</p>
          <div className="grid grid-cols-5 gap-2">
            <StatisticResult label="Min" value={stats.min} />
            <StatisticResult label="Q1" value={stats.q1} />
            <StatisticResult label="Q2" value={stats.q2} />
            <StatisticResult label="Q3" value={stats.q3} />
            <StatisticResult label="Max" value={stats.max} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Shape</p>
          <div className="grid grid-cols-3 gap-2">
            <StatisticResult label="Skewness" value={stats.skewness} hint="Sample G1. 0 is symmetric." />
            <StatisticResult label="Kurtosis" value={stats.kurtosis} hint="Sample excess kurtosis G2." />
            <StatisticResult label="CV" value={stats.cv} hint="SD divided by |mean|." />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Percentile
          <input
            type="number"
            min={0}
            max={100}
            value={pctl}
            onChange={(event) => setPctl(Number(event.target.value))}
            className="mt-1 w-24 rounded-md border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          P<sub>{pctl}</sub> = {formatStat(extraPercentile)}
        </p>
        <button type="button" className="text-xs font-semibold text-indigo-600" onClick={() => setShowSteps((value) => !value)}>
          {showSteps ? 'Hide calculation' : 'Show calculation'}
        </button>
      </div>
      {showSteps ? (
        <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          <p className="mb-1 font-semibold">Mean</p>
          {meanTrace(values).map((line) => <p key={line}>{line}</p>)}
          <div className="mt-2"><MathText value={'s^2=\\Sigma(x_i-\\bar{x})^2/(n-1)\\quad\\sigma^2=\\Sigma(x_i-\\mu)^2/n'} /></div>
        </div>
      ) : null}
    </section>
  )
}
