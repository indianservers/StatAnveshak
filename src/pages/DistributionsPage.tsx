import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { BookOpen, CheckCircle2, Download, FlaskConical, GraduationCap, HelpCircle, RefreshCw, Upload } from 'lucide-react'
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
type ProbabilityQuestion = 'left' | 'between' | 'quantile'
type PracticeQuestion = {
  prompt: string
  answer: string
  steps: string[]
}

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

const zFromAlpha: Record<string, number> = {
  '0.10': 1.645,
  '0.05': 1.96,
  '0.01': 2.576,
}

const zFromPower: Record<string, number> = {
  '0.80': 0.842,
  '0.90': 1.282,
  '0.95': 1.645,
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
  const [questionType, setQuestionType] = useState<ProbabilityQuestion>('left')
  const [xValue2, setXValue2] = useState('1')
  const [simSampleSize, setSimSampleSize] = useState('30')
  const [simRepetitions, setSimRepetitions] = useState('200')
  const [sampleMeans, setSampleMeans] = useState<number[]>([])
  const [effectSize, setEffectSize] = useState('0.5')
  const [powerAlpha, setPowerAlpha] = useState('0.05')
  const [targetPower, setTargetPower] = useState('0.80')
  const [practice, setPractice] = useState<PracticeQuestion | null>(null)
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false)
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 })
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
  const x2 = Number(xValue2)
  const betweenLow = Math.min(x, x2)
  const betweenHigh = Math.max(x, x2)
  const betweenProbability = Number.isFinite(x) && Number.isFinite(x2) ? dist.cdf(betweenHigh, cleanParams, loadedData) - dist.cdf(betweenLow, cleanParams, loadedData) : NaN
  const learning = distributionLearning(dist)
  const assumption = assumptionDashboard(loadedData.length ? loadedData : samples.filter((item): item is number => typeof item === 'number'), dist.family)
  const powerN = Math.ceil(2 * ((zFromAlpha[powerAlpha] + zFromPower[targetPower]) / Math.max(0.01, Number(effectSize))) ** 2)
  const sampleMeanAverage = sampleMeans.length ? sampleMeans.reduce((sum, value) => sum + value, 0) / sampleMeans.length : NaN
  const sampleMeanSd = sampleMeans.length > 1
    ? Math.sqrt(sampleMeans.reduce((sum, value) => sum + (value - sampleMeanAverage) ** 2, 0) / (sampleMeans.length - 1))
    : NaN
  const sampleMeanBins = useMemo(() => histogramBins(sampleMeans, 12), [sampleMeans])

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
    const [rangeLo, rangeHi] = dist.range(cleanParams, loadedData)
    const markerX = questionType === 'quantile' ? inv : x
    const shadeStart = questionType === 'between' ? Math.min(x, x2) : rangeLo
    const shadeEnd = questionType === 'between' ? Math.max(x, x2) : markerX
    const shapes: Partial<Plotly.Shape>[] = Number.isFinite(shadeStart) && Number.isFinite(shadeEnd)
      ? [
          {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: Math.max(rangeLo, shadeStart),
            x1: Math.min(rangeHi, shadeEnd),
            y0: 0,
            y1: 1,
            fillcolor: 'rgba(16,185,129,0.14)',
            line: { width: 0 },
          },
          {
            type: 'line',
            xref: 'x',
            yref: 'paper',
            x0: markerX,
            x1: markerX,
            y0: 0,
            y1: 1,
            line: { color: '#10b981', width: 2, dash: 'dot' },
          },
        ]
      : []

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
        shapes,
      },
      { responsive: true }
    )
  }, [cleanParams, densityLabel, dist, inv, loadedData, mode, questionType, theme, x, x2])

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

  const runSamplingSimulator = () => {
    const size = Math.max(2, Math.min(500, Math.round(Number(simSampleSize) || 30)))
    const reps = Math.max(10, Math.min(2000, Math.round(Number(simRepetitions) || 200)))
    const means = Array.from({ length: reps }, () => {
      const draw = generateSamples(dist, cleanParams, size, loadedData)
      const numeric = draw.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
      return numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : NaN
    }).filter(Number.isFinite)
    setSampleMeans(means)
    notify(`Simulated ${means.length.toLocaleString()} sample means.`, 'success')
  }

  const newPracticeQuestion = () => {
    const nextQ = Math.random() > 0.5 ? 0.95 : 0.9
    const nextX = Number.isFinite(x) ? x : 0
    const answer = Math.random() > 0.5
      ? {
          prompt: `What is P(X <= ${numberFormat(nextX)}) for ${dist.name}?`,
          answer: numberFormat(dist.cdf(nextX, cleanParams, loadedData)),
          steps: ['Use the CDF for a left-tail probability.', `Evaluate F(${numberFormat(nextX)}) with the current parameters.`, `The answer is ${numberFormat(dist.cdf(nextX, cleanParams, loadedData))}.`],
        }
      : {
          prompt: `Find the ${Math.round(nextQ * 100)}th percentile for ${dist.name}.`,
          answer: numberFormat(dist.inv(nextQ, cleanParams, loadedData)),
          steps: ['Use inverse CDF for percentile questions.', `Set q = ${nextQ}.`, `x = F^-1(${nextQ}) = ${numberFormat(dist.inv(nextQ, cleanParams, loadedData))}.`],
        }
    setPractice(answer)
    setShowPracticeAnswer(false)
  }

  const markPractice = (correct: boolean) => {
    setPracticeScore((score) => ({ correct: score.correct + (correct ? 1 : 0), total: score.total + 1 }))
    newPracticeQuestion()
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
          {!activeDataset && (
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Upload size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Learning tools are ready without a dataset.</p>
                  <p className="text-xs opacity-80">Upload data only when you want to fit a distribution or compare goodness-of-fit against your own column.</p>
                </div>
              </div>
              <Link to="/data/upload" className="rounded-md bg-indigo-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-700">Upload Data</Link>
            </div>
          )}

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

            <section className="xl:col-span-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap size={16} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Distribution Learning Cards</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <LearningCard title="When to use" items={learning.whenToUse} />
                <LearningCard title="Real-world examples" items={learning.examples} />
                <LearningCard title="Assumptions" items={learning.assumptions} />
                <LearningCard title="Parameter meaning" items={learning.parameters} />
                <LearningCard title="Common mistakes" items={learning.mistakes} />
                <LearningCard title="Similar distributions" items={learning.similar} />
              </div>
            </section>

            <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Interactive Probability Questions</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-xs text-slate-500">
                  Question
                  <select value={questionType} onChange={(event) => setQuestionType(event.target.value as ProbabilityQuestion)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    <option value="left">What is P(X &lt;= x)?</option>
                    <option value="between">What is P(a &lt;= X &lt;= b)?</option>
                    <option value="quantile">Find percentile</option>
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  x or a
                  <input value={xValue} onChange={(event) => setXValue(event.target.value)} type="number" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                </label>
                {questionType === 'between' && (
                  <label className="text-xs text-slate-500">
                    b
                    <input value={xValue2} onChange={(event) => setXValue2(event.target.value)} type="number" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                  </label>
                )}
                {questionType === 'quantile' && (
                  <label className="text-xs text-slate-500">
                    q
                    <input value={qValue} onChange={(event) => setQValue(event.target.value)} type="number" min="0" max="1" step="0.001" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
                  </label>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                {questionType === 'left' && <>P(X &lt;= {numberFormat(x)}) = F({numberFormat(x)}) = <strong>{numberFormat(evalCdf)}</strong>. The chart shades the left-tail area.</>}
                {questionType === 'between' && <>P({numberFormat(betweenLow)} &lt;= X &lt;= {numberFormat(betweenHigh)}) = F({numberFormat(betweenHigh)}) - F({numberFormat(betweenLow)}) = <strong>{numberFormat(betweenProbability)}</strong>.</>}
                {questionType === 'quantile' && <>The {numberFormat(q * 100)}th percentile is F^-1({numberFormat(q)}) = <strong>{numberFormat(inv)}</strong>. The chart marks the percentile.</>}
              </div>
              <ol className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-3">
                <li>1. Identify whether the question asks for CDF, interval probability, or inverse CDF.</li>
                <li>2. Substitute the current distribution parameters and input values.</li>
                <li>3. Read the shaded region or percentile marker on the chart.</li>
              </ol>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Assumption Dashboard</h3>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Sample size" value={assumption.sampleSize} />
                <Metric label="Skewness" value={typeof assumption.skewness === 'number' ? numberFormat(assumption.skewness) : assumption.skewness} />
                <Metric label="Outliers" value={assumption.outliers} />
                <Metric label="Normality cue" value={assumption.normality} />
                <Metric label="Equal variance" value={assumption.equalVariance} />
                <Metric label="Independence" value={assumption.independence} />
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

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Sampling Distribution Simulator</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-500">Sample size<input value={simSampleSize} onChange={(event) => setSimSampleSize(event.target.value)} type="number" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></label>
                <label className="text-xs text-slate-500">Repetitions<input value={simRepetitions} onChange={(event) => setSimRepetitions(event.target.value)} type="number" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></label>
              </div>
              <button onClick={runSamplingSimulator} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"><RefreshCw size={14} /> Simulate means</button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Mean of means" value={numberFormat(sampleMeanAverage)} />
                <Metric label="SD of means" value={numberFormat(sampleMeanSd)} />
              </div>
              {sampleMeanBins.length > 0 && (
                <div className="mt-3 flex h-24 items-end gap-1 rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
                  {sampleMeanBins.map((bin) => (
                    <div
                      key={`${bin.start}-${bin.end}`}
                      title={`${numberFormat(bin.start)} to ${numberFormat(bin.end)}: ${bin.count}`}
                      className="flex-1 rounded-t bg-emerald-500/80"
                      style={{ height: `${Math.max(8, (bin.count / Math.max(...sampleMeanBins.map((item) => item.count))) * 100)}%` }}
                    />
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">As sample size grows, the sample means usually become more bell-shaped and less variable.</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Power and Sample Size</h3>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-slate-500">Effect size<input value={effectSize} onChange={(event) => setEffectSize(event.target.value)} type="number" step="0.05" className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></label>
                <label className="text-xs text-slate-500">Alpha<select value={powerAlpha} onChange={(event) => setPowerAlpha(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option value="0.10">0.10</option><option value="0.05">0.05</option><option value="0.01">0.01</option></select></label>
                <label className="text-xs text-slate-500">Power<select value={targetPower} onChange={(event) => setTargetPower(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"><option value="0.80">80%</option><option value="0.90">90%</option><option value="0.95">95%</option></select></label>
              </div>
              <Metric label="Required n per group" value={powerN.toLocaleString()} />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Approximation for two independent groups: n = 2((z_alpha + z_power) / effect size)^2.</p>
            </section>

            <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Practice Mode</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={newPracticeQuestion} className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">Generate question</button>
                <span className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-200">Score {practiceScore.correct}/{practiceScore.total}</span>
              </div>
              {practice && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                  <p className="font-semibold text-slate-800 dark:text-white">{practice.prompt}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => setShowPracticeAnswer(true)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-200">Show answer</button>
                    <button onClick={() => markPractice(true)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white">I got it</button>
                    <button onClick={() => markPractice(false)} className="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white">Missed it</button>
                  </div>
                  {showPracticeAnswer && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      <p><strong>Answer:</strong> {practice.answer}</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
                        {practice.steps.map((step) => <li key={step}>{step}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="xl:col-span-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Load User Data, Fit Distribution, Compare Goodness-of-Fit</h3>
                  <p className="text-xs text-slate-400">Continuous modules use Kolmogorov-Smirnov distance. Discrete modules use chi-square goodness-of-fit.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={effectiveDataCol} onChange={(event) => setDataCol(event.target.value)} disabled={!numericCols.length} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {numericCols.length ? numericCols.map((col) => <option key={col} value={col}>{col}</option>) : <option value="">No numeric column loaded</option>}
                  </select>
                  <button onClick={loadColumnData} disabled={!activeDataset || !effectiveDataCol} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Load data</button>
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

function LearningCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
        {items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={12} className="mt-1 shrink-0 text-green-500" />{item}</li>)}
      </ul>
    </div>
  )
}

function distributionLearning(dist: Distribution) {
  const base = {
    whenToUse: dist.family === 'discrete'
      ? ['The outcome is a count or whole-number event.', 'You can define trials, arrivals, failures, or categories.']
      : dist.family === 'continuous'
        ? ['The outcome is measured on a continuous scale.', 'You need probabilities, percentiles, or fitted curve comparison.']
        : dist.family === 'multivariate'
          ? ['One observation has several related components.', 'The components are counts or proportions that move together.']
          : ['You do not want to assume a named model.', 'The observed data itself should define percentiles and probabilities.'],
    examples: dist.family === 'discrete'
      ? ['Defect counts, arrivals, successes, claims, clicks.', 'Exam pass/fail, calls per hour, units sold.']
      : dist.family === 'continuous'
        ? ['Heights, scores, waiting time, rainfall, income, measurement error.', 'Quality measurements, delivery time, latency, lifetimes.']
        : dist.family === 'multivariate'
          ? ['Market-share vectors, category counts, composition data.', 'Survey category probabilities and portfolio weights.']
          : ['Bootstrapped observed values.', 'Percentiles from a real sample without smoothing.'],
    assumptions: ['Support must match possible values: ' + dist.support + '.', 'Parameters should be meaningful for the process.', 'Observations should be representative and measured consistently.'],
    parameters: dist.params.length ? dist.params.map((param) => `${param.label}: allowed ${param.min} to ${param.max}, default ${param.default}.`) : ['No editable parameters; it is fixed or data-driven.'],
    mistakes: ['Using a continuous model for impossible negative or fractional values.', 'Trusting a good-looking curve without checking assumptions.', 'Ignoring tails when decisions depend on rare events.'],
    similar: similarDistributions(dist.id),
  }

  if (dist.id === 'normal' || dist.id === 'standard_normal') {
    base.whenToUse = ['Measurement errors or averages from many small effects.', 'Symmetric data where tails are not extremely heavy.']
    base.mistakes = ['Assuming every bell-shaped histogram is normal.', 'Using mean and SD when outliers dominate.']
  }
  if (dist.id === 'poisson' || dist.id === 'exponential') {
    base.examples = ['Queue arrivals, calls per minute, defects per sheet.', 'Waiting time between independent events.']
    base.assumptions.push('Events happen independently at a roughly constant rate.')
  }
  return base
}

function similarDistributions(id: string) {
  if (['bernoulli', 'binomial'].includes(id)) return ['Bernoulli is one trial; Binomial is many trials.', 'Hypergeometric is similar but without replacement.']
  if (['poisson', 'exponential'].includes(id)) return ['Poisson counts events; Exponential measures waiting time between events.', 'Gamma generalizes waiting time for multiple events.']
  if (['normal', 'standard_normal', 'student_t'].includes(id)) return ['Student t is normal-like with heavier tails.', 'Logistic is also symmetric with a different tail shape.']
  if (['gamma', 'weibull', 'lognormal', 'exponential'].includes(id)) return ['All model positive right-skewed values.', 'Weibull is common for reliability; Lognormal for multiplicative growth.']
  if (['beta', 'dirichlet'].includes(id)) return ['Beta models one proportion; Dirichlet models several proportions.', 'Binomial links to Beta through Bayesian updating.']
  if (['multinomial', 'dirichlet'].includes(id)) return ['Multinomial models category counts.', 'Dirichlet models category probabilities.']
  return ['Compare with Normal, Empirical, and a domain-specific distribution.', 'Use Compare all after loading data.']
}

function assumptionDashboard(values: number[], family: string) {
  if (values.length < 2) {
    return { sampleSize: values.length, skewness: '-', outliers: '-', normality: 'Need data', equalVariance: 'Need groups', independence: 'Check design' }
  }
  const outlierResult = detectOutliers(values)
  const skewness = values.length > 2 ? sampleSkewness(values) : 0
  return {
    sampleSize: values.length,
    skewness,
    outliers: outlierResult.length,
    normality: family === 'continuous' ? (values.length >= 30 && Math.abs(skewness) < 1 ? 'reasonable' : 'check QQ/histogram') : 'not required',
    equalVariance: 'compare groups',
    independence: 'verify sampling',
  }
}

function sampleSkewness(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1))
  return sd === 0 ? 0 : values.reduce((sum, value) => sum + ((value - mean) / sd) ** 3, 0) / values.length
}

function detectOutliers(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const lo = q1 - 1.5 * iqr
  const hi = q3 + 1.5 * iqr
  return values.filter((value) => value < lo || value > hi)
}

function histogramBins(values: number[], targetBins: number) {
  const clean = values.filter(Number.isFinite)
  if (!clean.length) return []
  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const width = max === min ? 1 : (max - min) / targetBins
  const bins = Array.from({ length: targetBins }, (_, index) => ({
    start: min + index * width,
    end: min + (index + 1) * width,
    count: 0,
  }))
  clean.forEach((value) => {
    const index = Math.min(targetBins - 1, Math.max(0, Math.floor((value - min) / width)))
    bins[index].count += 1
  })
  return bins
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
