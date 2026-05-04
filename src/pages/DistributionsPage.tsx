import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { BookOpen, Download, FlaskConical, RefreshCw, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { numericColumn } from '../lib/stats'
import {
  compareFits,
  curvePoints,
  defaultParams,
  DISTRIBUTIONS,
  DISTRIBUTION_BY_ID,
  exportCurveCsv,
  fitDistribution,
  generateSamples,
  goodnessOfFit,
  sanitizeParams,
  type Distribution,
  type DistributionId,
} from '../lib/distributions'
import { useToast } from '../components/ui/toastContext'

type ViewMode = 'density' | 'cdf'

const groupLabel = (dist: Distribution) => {
  if (dist.family === 'continuous') return 'Continuous'
  if (dist.family === 'discrete') return 'Discrete'
  if (dist.family === 'multivariate') return 'Multivariate'
  return 'Empirical'
}

const numberFormat = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return Math.abs(value) >= 10000 || Math.abs(value) < 0.0001
    ? value.toExponential(4)
    : value.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

const downloadText = (filename: string, text: string, mime = 'text/plain') => {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DistributionsPage() {
  const { theme, activeDataset } = useStore()
  const { notify } = useToast()
  const { distributionId } = useParams()
  const navigate = useNavigate()
  const initialDistribution = DISTRIBUTION_BY_ID[distributionId as DistributionId] ? distributionId as DistributionId : 'normal'
  const [selected, setSelected] = useState<DistributionId>(initialDistribution)
  const dist = DISTRIBUTION_BY_ID[selected]
  const [params, setParams] = useState<Record<string, number>>(() => defaultParams(dist))
  const [mode, setMode] = useState<ViewMode>('density')
  const [xValue, setXValue] = useState('0')
  const [qValue, setQValue] = useState('0.95')
  const [sampleCount, setSampleCount] = useState('100')
  const [samples, setSamples] = useState<Array<number | number[]>>([])
  const [dataCol, setDataCol] = useState('')
  const [loadedData, setLoadedData] = useState<number[]>([])
  const [comparison, setComparison] = useState<ReturnType<typeof compareFits>>([])
  const plotRef = useRef<HTMLDivElement>(null)

  const numericCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? [],
    [activeDataset]
  )

  const effectiveDataCol = dataCol || numericCols[0] || ''
  const cleanParams = sanitizeParams(dist, params)
  const x = Number(xValue)
  const q = Math.max(0.000001, Math.min(0.999999, Number(qValue)))
  const densityLabel = dist.family === 'discrete' || dist.family === 'multivariate' ? 'PMF' : 'PDF'
  const evalDensity = Number.isFinite(x) ? dist.pdf(x, cleanParams, loadedData) : NaN
  const evalCdf = Number.isFinite(x) ? dist.cdf(x, cleanParams, loadedData) : NaN
  const inv = dist.inv(q, cleanParams, loadedData)
  const gof = loadedData.length > 1 ? goodnessOfFit(dist, cleanParams, loadedData) : null

  useEffect(() => {
    if (!plotRef.current) return
    const curve = curvePoints(dist, cleanParams, mode, loadedData)
    const paperBg = theme === 'dark' ? '#1e293b' : '#ffffff'
    const plotBg = theme === 'dark' ? '#0f172a' : '#f8fafc'
    const fontColor = theme === 'dark' ? '#cbd5e1' : '#334155'
    const traces: Plotly.Data[] = [
      curve.type === 'bar'
        ? { type: 'bar', x: curve.x, y: curve.y, marker: { color: '#6366f1' }, name: mode === 'cdf' ? 'CDF' : densityLabel }
        : { type: 'scatter', mode: 'lines', x: curve.x, y: curve.y, line: { color: '#6366f1', width: 2.5 }, fill: 'tozeroy', fillcolor: 'rgba(99,102,241,0.15)', name: mode === 'cdf' ? 'CDF' : densityLabel },
    ]

    if (loadedData.length > 1 && mode === 'density' && dist.family !== 'discrete' && dist.family !== 'multivariate') {
      traces.push({
        type: 'histogram',
        x: loadedData,
        histnorm: 'probability density',
        opacity: 0.35,
        marker: { color: '#f59e0b' },
        name: 'Loaded data',
      } as Plotly.Data)
    }

    Plotly.react(
      plotRef.current,
      traces,
      {
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: fontColor, family: 'Inter, system-ui, sans-serif', size: 12 },
        margin: { t: 20, r: 20, b: 48, l: 58 },
        barmode: 'overlay',
        xaxis: { title: { text: 'x' }, gridcolor: theme === 'dark' ? '#334155' : '#e2e8f0' },
        yaxis: { title: { text: mode === 'cdf' ? 'F(x)' : densityLabel }, gridcolor: theme === 'dark' ? '#334155' : '#e2e8f0' },
        legend: { orientation: 'h' },
      },
      { responsive: true }
    )
  }, [cleanParams, densityLabel, dist, loadedData, mode, theme])

  const loadColumnData = () => {
    if (!activeDataset || !effectiveDataCol) return
    const values = numericColumn(activeDataset.data, effectiveDataCol)
    setLoadedData(values)
    notify(`Loaded ${values.length.toLocaleString()} values from ${effectiveDataCol}.`, 'success')
  }

  const fitCurrent = () => {
    const fit = fitDistribution(dist, loadedData)
    if (!fit) {
      notify('This distribution could not be fit to the loaded data.', 'info')
      return
    }
    setParams(fit)
    notify(`${dist.name} parameters fitted to loaded data.`, 'success')
  }

  const compareAll = () => {
    const results = compareFits(loadedData)
    setComparison(results)
    notify(`Compared ${results.length} fitted distributions.`, 'success')
  }

  const generate = () => {
    const count = Math.max(1, Math.min(5000, Math.round(Number(sampleCount) || 100)))
    const generated = selected === 'empirical' && loadedData.length
      ? Array.from({ length: count }, () => loadedData[Math.floor(Math.random() * loadedData.length)])
      : generateSamples(dist, cleanParams, count)
    setSamples(generated)
    notify(`Generated ${count.toLocaleString()} random samples.`, 'success')
  }

  const exportCurve = () => {
    downloadText(`${selected}-${mode}.csv`, exportCurveCsv(dist, cleanParams, mode, loadedData), 'text/csv')
  }

  const exportModule = () => {
    downloadText(`${selected}-module.json`, JSON.stringify({
      distribution: dist.name,
      family: dist.family,
      support: dist.support,
      params: cleanParams,
      formula: dist.formula,
      cdfFormula: dist.cdfFormula,
      expectedValue: dist.expectedValue(cleanParams, loadedData),
      variance: dist.variance(cleanParams, loadedData),
      goodnessOfFit: gof,
      samples: samples.slice(0, 1000),
    }, null, 2), 'application/json')
  }

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-2 px-1">
          <FlaskConical size={18} className="text-indigo-500" />
          <h1 className="font-bold text-slate-800 dark:text-white">Distributions</h1>
        </div>
        {['Discrete', 'Continuous', 'Multivariate', 'Empirical'].map((group) => (
          <div key={group} className="mb-4">
            <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{group}</p>
            {DISTRIBUTIONS.filter((item) => groupLabel(item) === group).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item.id)
                  setParams(defaultParams(item))
                  setSamples([])
                  setComparison([])
                  navigate(`/distributions/${item.id}`)
                }}
                className={`mb-1 w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  selected === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{dist.name} Distribution</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">{groupLabel(dist)}</span>
              </div>
              <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{dist.explanation}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportCurve} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <Download size={13} /> Curve CSV
              </button>
              <button onClick={exportModule} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700">
                <Download size={13} /> Module JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('density')}
                    className={`rounded-md px-3 py-1.5 text-sm ${mode === 'density' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`}
                  >
                    {densityLabel}
                  </button>
                  <button
                    onClick={() => setMode('cdf')}
                    className={`rounded-md px-3 py-1.5 text-sm ${mode === 'cdf' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`}
                  >
                    CDF
                  </button>
                </div>
                <span className="text-xs text-slate-400">Support: {dist.support}</span>
              </div>
              <div ref={plotRef} style={{ minHeight: 380 }} />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Parameters</h3>
              {dist.params.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-700/50">This module has no editable parameters.</p>
              ) : (
                <div className="space-y-4">
                  {dist.params.map((param) => (
                    <div key={param.key}>
                      <div className="mb-1 flex justify-between text-xs">
                        <label className="font-medium text-slate-600 dark:text-slate-300">{param.label}</label>
                        <input
                          type="number"
                          value={cleanParams[param.key] ?? param.default}
                          step={param.step}
                          onChange={(event) => setParams((prev) => ({ ...prev, [param.key]: Number(event.target.value) }))}
                          className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        />
                      </div>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={cleanParams[param.key] ?? param.default}
                        onChange={(event) => setParams((prev) => ({ ...prev, [param.key]: Number(event.target.value) }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="E[X]" value={dist.expectedValue(cleanParams, loadedData)} />
                <Metric label="Var(X)" value={dist.variance(cleanParams, loadedData)} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Formula</h3>
              <div className="space-y-3 text-sm">
                <Formula label={densityLabel} value={dist.formula} />
                <Formula label="CDF" value={dist.cdfFormula} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Evaluate</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-500">
                  x
                  <input value={xValue} onChange={(event) => setXValue(event.target.value)} type="number" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                </label>
                <label className="text-xs text-slate-500">
                  q for inverse CDF
                  <input value={qValue} onChange={(event) => setQValue(event.target.value)} type="number" min="0" max="1" step="0.001" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label={`${densityLabel}(x)`} value={numberFormat(evalDensity)} />
                <Metric label="CDF(x)" value={numberFormat(evalCdf)} />
                <Metric label="Inv CDF(q)" value={numberFormat(inv)} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Random Sample Generator</h3>
              <div className="flex gap-2">
                <input value={sampleCount} onChange={(event) => setSampleCount(event.target.value)} type="number" className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                <button onClick={generate} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">
                  <RefreshCw size={14} /> Generate
                </button>
              </div>
              <div className="mt-3 max-h-28 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                {samples.length ? samples.slice(0, 24).map((item) => Array.isArray(item) ? `[${item.map((v) => numberFormat(v)).join(', ')}]` : numberFormat(item)).join(', ') : 'No samples generated yet.'}
              </div>
            </section>

            <section className="xl:col-span-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Load User Data, Fit Distribution, Compare Goodness-of-Fit</h3>
                  <p className="text-xs text-slate-400">Continuous modules use Kolmogorov-Smirnov distance. Discrete modules use chi-square goodness-of-fit.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={effectiveDataCol} onChange={(event) => setDataCol(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <button onClick={loadColumnData} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Load data</button>
                  <button onClick={fitCurrent} disabled={loadedData.length < 2} className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">Fit current</button>
                  <button onClick={compareAll} disabled={loadedData.length < 2} className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-600">Compare all</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metric label="Loaded n" value={loadedData.length.toLocaleString()} />
                <Metric label="GOF method" value={gof?.method ?? '-'} />
                <Metric label="Statistic" value={numberFormat(gof?.statistic)} />
                <Metric label="p-value" value={numberFormat(gof?.pValue)} />
              </div>

              {comparison.length > 0 && (
                <div className="mt-4 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Rank</th>
                        <th className="px-3 py-2 text-left">Distribution</th>
                        <th className="px-3 py-2 text-left">Method</th>
                        <th className="px-3 py-2 text-right">Statistic</th>
                        <th className="px-3 py-2 text-right">p-value</th>
                        <th className="px-3 py-2 text-left">Fitted parameters</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {comparison.slice(0, 10).map((item, index) => (
                        <tr key={item.id} className={item.id === selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                          <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{item.name}</td>
                          <td className="px-3 py-2 text-slate-500">{item.method}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{numberFormat(item.statistic)}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{numberFormat(item.pValue)}</td>
                          <td className="px-3 py-2 text-slate-500">{Object.entries(item.params).map(([key, value]) => `${key}=${numberFormat(value)}`).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="xl:col-span-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <BookOpen size={16} className="text-indigo-500" />
                    Collapsible Guide: How to Use and Understand {dist.name}
                  </span>
                  <span className="text-xs text-indigo-600 group-open:hidden dark:text-indigo-300">Open guide</span>
                  <span className="hidden text-xs text-indigo-600 group-open:inline dark:text-indigo-300">Close guide</span>
                </summary>
                <DistributionGuide dist={dist} densityLabel={densityLabel} loadedCount={loadedData.length} dataCol={effectiveDataCol} />
              </details>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className="break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  )
}

function Formula({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-slate-400">{label}</p>
      <code className="block rounded-lg bg-slate-50 p-3 text-xs text-indigo-700 dark:bg-slate-700/50 dark:text-indigo-300">{value}</code>
    </div>
  )
}

function DistributionGuide({ dist, densityLabel, loadedCount, dataCol }: { dist: Distribution; densityLabel: string; loadedCount: number; dataCol: string }) {
  const purpose = dist.family === 'discrete'
    ? 'Use it when the outcome is counted in whole values, such as successes, arrivals, defects, or categories encoded as counts.'
    : dist.family === 'continuous'
      ? 'Use it when the outcome is measured on a continuous scale, such as time, size, score, money, rate, or error.'
      : dist.family === 'multivariate'
        ? 'Use it when one observation contains several related components, such as category probabilities or proportions that move together.'
        : 'Use it when you want the data itself to define the distribution without assuming a named theoretical model.'
  const fitAdvice = loadedCount > 1
    ? `You loaded ${loadedCount.toLocaleString()} values from ${dataCol}. Fit current estimates this distribution's parameters from that column; Compare all checks whether another distribution explains the same data better.`
    : 'Load data first, then fit the distribution and compare it against alternatives.'

  return (
    <div className="border-t border-slate-100 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <h4 className="mb-2 font-semibold text-slate-800 dark:text-white">Workflow</h4>
          <ol className="space-y-2 text-xs leading-5">
            <li><strong>Step 1:</strong> Load any dataset from Upload or sample data.</li>
            <li><strong>Step 2:</strong> Select a numeric column in the data-fit panel.</li>
            <li><strong>Step 3:</strong> Click <strong>Load data</strong> and inspect the histogram over the {densityLabel} curve.</li>
            <li><strong>Step 4:</strong> Click <strong>Fit current</strong> to estimate parameters from the selected column.</li>
            <li><strong>Step 5:</strong> Click <strong>Compare all</strong> and prefer lower GOF statistic, then check whether the p-value and visual overlay make practical sense.</li>
            <li><strong>Step 6:</strong> Export the curve or module JSON when the model is useful for a report.</li>
          </ol>
        </div>
        <div>
          <h4 className="mb-2 font-semibold text-slate-800 dark:text-white">Purpose</h4>
          <p className="mb-2 text-xs leading-5">{purpose}</p>
          <p className="text-xs leading-5">{dist.explanation}</p>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-700/50">
            <div><strong>Support:</strong> {dist.support}</div>
            <div><strong>Formula:</strong> {dist.formula}</div>
          </div>
        </div>
        <div>
          <h4 className="mb-2 font-semibold text-slate-800 dark:text-white">How to Read Metrics</h4>
          <ul className="space-y-2 text-xs leading-5">
            <li><strong>{densityLabel}:</strong> likelihood pattern for values. Peaks show common values; tails show rare values.</li>
            <li><strong>CDF:</strong> probability of being less than or equal to x. Use it for percentiles and risk thresholds.</li>
            <li><strong>Inverse CDF:</strong> the x value at a chosen probability, such as the 95th percentile.</li>
            <li><strong>E[X]:</strong> model average. Compare it with your sample mean.</li>
            <li><strong>Variance:</strong> model spread. Compare it with sample variance or the chart width.</li>
            <li><strong>Goodness-of-fit:</strong> {fitAdvice}</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
        Teaching check: ask whether the variable is discrete or continuous, whether the support matches real possible values, whether parameters have a real-world meaning, and whether the fitted model predicts believable tail behavior.
      </div>
    </div>
  )
}
