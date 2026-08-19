import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Box,
  ChevronDown,
  CheckCircle2,
  Database,
  Download,
  FlaskConical,
  Gauge,
  GraduationCap,
  Info,
  Layers3,
  RefreshCw,
  Save,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
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
import { SAMPLE_DATASETS } from '../lib/sampleData'
import { sampleToDataset } from '../lib/dataset'
import { saveDataset } from '../lib/storage'
import type { Dataset } from '../types'
import { useToast } from '../components/ui/toastContext'

type StudioMode = 'explore' | 'learn' | 'simulate' | 'fit'
type CurveMode = 'density' | 'cdf'
type QuestionType = 'left' | 'between' | 'right' | 'inverse'
type VisualKind =
  | 'bernoulli'
  | 'binomial'
  | 'geometric'
  | 'negative_binomial'
  | 'hypergeometric'
  | 'poisson'
  | 'discrete_uniform'
  | 'continuous_uniform'
  | 'normal'
  | 'standard_normal'
  | 'lognormal'
  | 'exponential'
  | 'gamma'
  | 'beta'
  | 'chi_square'
  | 'student_t'
  | 'f'
  | 'weibull'
  | 'pareto'
  | 'cauchy'
  | 'logistic'
  | 'multinomial'
  | 'dirichlet'
  | 'empirical'

type DistributionExperience = {
  visual: VisualKind
  tagline: string
  intuition: string
  commonUses: string[]
  assumptions: string[]
  mistakes: string[]
  related: Array<{ id: DistributionId; note: string }>
  dataSuggestions: string[]
}

type FitSummary = {
  n: number
  missing: number
  min: number
  max: number
  mean: number
  median: number
  variance: number
  sd: number
  skewness: number
  kurtosis: number
}

type DistributionDepthEnhancement = {
  title: string
  detail: string
  action: string
  value?: string
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
}

type DistributionSpecificTool = {
  title: string
  detail: string
  output: string
  action: string
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
}

type DistributionTheory = {
  plainMeaning: string
  whenToUse: string
  howToRead: string
  examples: string[]
}

const STUDIO_MODES: Array<{ id: StudioMode; label: string; icon: typeof Sparkles }> = [
  { id: 'explore', label: 'Explore', icon: Sparkles },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'simulate', label: 'Simulate', icon: Shuffle },
  { id: 'fit', label: 'Fit Data', icon: SlidersHorizontal },
]

const VISUAL_KIND_BY_ID: Record<DistributionId, VisualKind> = {
  bernoulli: 'bernoulli',
  binomial: 'binomial',
  geometric: 'geometric',
  negative_binomial: 'negative_binomial',
  hypergeometric: 'hypergeometric',
  poisson: 'poisson',
  discrete_uniform: 'discrete_uniform',
  continuous_uniform: 'continuous_uniform',
  normal: 'normal',
  standard_normal: 'standard_normal',
  lognormal: 'lognormal',
  exponential: 'exponential',
  gamma: 'gamma',
  beta: 'beta',
  chi_square: 'chi_square',
  student_t: 'student_t',
  f: 'f',
  weibull: 'weibull',
  pareto: 'pareto',
  cauchy: 'cauchy',
  logistic: 'logistic',
  multinomial: 'multinomial',
  dirichlet: 'dirichlet',
  empirical: 'empirical',
}

const SUGGESTION_IDS: Record<DistributionId, string[]> = {
  bernoulli: ['loan-applications', 'customer-churn', 'campaign-ab-test'],
  binomial: ['campaign-ab-test', 'exam-item-analysis', 'survey-satisfaction'],
  geometric: ['call-center', 'web-analytics', 'campaign-ab-test'],
  negative_binomial: ['traffic-accidents', 'insurance-claims', 'manufacturing-defects'],
  hypergeometric: ['manufacturing-defects', 'quality-inspection', 'loan-applications'],
  poisson: ['call-center', 'traffic-accidents', 'manufacturing-defects'],
  discrete_uniform: ['survey-satisfaction', 'exam-item-analysis'],
  continuous_uniform: ['daily-weather', 'student-marks'],
  normal: ['student-marks', 'iris-flowers', 'blood-pressure-trial'],
  standard_normal: ['student-marks', 'blood-pressure-trial'],
  lognormal: ['ecommerce-orders', 'insurance-claims', 'housing-prices'],
  exponential: ['call-center', 'ecommerce-orders', 'daily-weather'],
  gamma: ['daily-weather', 'call-center', 'city-air-quality'],
  beta: ['survey-satisfaction', 'campaign-ab-test', 'school-attendance'],
  chi_square: ['survey-satisfaction', 'exam-item-analysis', 'manufacturing-defects'],
  student_t: ['student-marks', 'blood-pressure-trial', 'iris-flowers'],
  f: ['student-marks', 'blood-pressure-trial', 'manufacturing-defects'],
  weibull: ['machine-sensor', 'manufacturing-defects', 'construction-progress'],
  pareto: ['insurance-claims', 'ecommerce-orders', 'housing-prices'],
  cauchy: ['stock-returns', 'insurance-claims'],
  logistic: ['customer-churn', 'campaign-ab-test', 'loan-applications'],
  multinomial: ['survey-satisfaction', 'election-polling', 'ecommerce-orders'],
  dirichlet: ['survey-satisfaction', 'election-polling', 'marketing-campaigns'],
  empirical: ['student-marks', 'monthly-sales', 'city-air-quality'],
}

const numberFormat = (value: number | string | null | undefined, digits = 4) => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001)
    ? value.toExponential(3)
    : value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const valuesForColumn = (dataset: Dataset | null, column: string) => {
  if (!dataset || !column) return []
  return dataset.data.map((row) => Number(row[column])).filter(Number.isFinite)
}

const preferredNumericColumn = (dataset: Dataset | null, columns: string[], dist: Distribution) => {
  if (!dataset || !columns.length) return ''
  const idLike = /(^|_)(id|index|serial|row|no|number)$/i
  const preferredWords: Partial<Record<DistributionId, string[]>> = {
    normal: ['score', 'marks', 'height', 'pressure', 'value'],
    standard_normal: ['z', 'score', 'marks', 'height', 'pressure'],
    lognormal: ['price', 'amount', 'income', 'sales', 'cost'],
    exponential: ['time', 'wait', 'duration', 'arrival'],
    gamma: ['rainfall', 'time', 'duration', 'amount'],
    weibull: ['life', 'failure', 'duration', 'time'],
    pareto: ['price', 'amount', 'income', 'claim', 'sales'],
    beta: ['rate', 'ratio', 'percent', 'share', 'score'],
    empirical: ['score', 'marks', 'sales', 'value', 'aqi'],
  }
  const meaningful = columns.filter((column) => !idLike.test(column.replace(/\s+/g, '_')))
  const pool = meaningful.length ? meaningful : columns
  const keywords = preferredWords[dist.id] ?? ['score', 'value', 'rate', 'amount', 'time', 'sales', 'count']
  const keywordMatch = pool.find((column) => keywords.some((word) => column.toLowerCase().includes(word)))
  if (keywordMatch) return keywordMatch
  return [...pool].sort((a, b) => valuesForColumn(dataset, b).length - valuesForColumn(dataset, a).length)[0] ?? columns[0]
}

const groupLabel = (dist: Distribution) => {
  if (dist.family === 'continuous') return 'Continuous'
  if (dist.family === 'discrete') return 'Discrete'
  if (dist.family === 'multivariate') return 'Multivariate'
  return 'Empirical'
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
  const { distributionId } = useParams()
  const navigate = useNavigate()
  const { activeDataset, datasets, addDataset, setActiveDataset } = useStore()
  const { notify } = useToast()
  const initialDistribution = DISTRIBUTION_BY_ID[distributionId as DistributionId] ? distributionId as DistributionId : 'normal'
  const [selected, setSelected] = useState<DistributionId>(initialDistribution)
  const dist = DISTRIBUTION_BY_ID[selected]
  const experience = getExperience(dist)
  const [params, setParams] = useState<Record<string, number>>(() => defaultParams(dist))
  const cleanParams = sanitizeParams(dist, params)
  const [studioMode, setStudioMode] = useState<StudioMode>('explore')
  const [curveMode, setCurveMode] = useState<CurveMode>('density')
  const [questionType, setQuestionType] = useState<QuestionType>('between')
  const [x1, setX1] = useState('-1')
  const [x2, setX2] = useState('1')
  const [q, setQ] = useState('0.95')
  const [sampleCount, setSampleCount] = useState('100')
  const [samples, setSamples] = useState<Array<number | number[]>>([])
  const [simReps, setSimReps] = useState('200')
  const [simMeans, setSimMeans] = useState<number[]>([])
  const [fitDatasetId, setFitDatasetId] = useState(activeDataset?.id ?? '')
  const [fitColumn, setFitColumn] = useState('')
  const [fitValues, setFitValues] = useState<number[]>([])
  const [fitComparison, setFitComparison] = useState<ReturnType<typeof compareFits>>([])
  const [fitResult, setFitResult] = useState<ReturnType<typeof goodnessOfFit> | null>(null)
  const [binCount, setBinCount] = useState(18)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!DISTRIBUTION_BY_ID[distributionId as DistributionId]) return
    const next = distributionId as DistributionId
    setSelected(next)
    setParams(defaultParams(DISTRIBUTION_BY_ID[next]))
    setSamples([])
    setSimMeans([])
    setFitComparison([])
    setFitResult(null)
    setQuestionType(next === 'standard_normal' ? 'left' : 'between')
  }, [distributionId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const allDatasets = useMemo(() => {
    const loaded = [
      ...(activeDataset ? [{ dataset: activeDataset, source: 'Active' }] : []),
      ...datasets.map((dataset) => ({ dataset, source: 'Loaded' })),
    ]
    const samples = SAMPLE_DATASETS.map((sample) => ({ dataset: sampleToDataset(sample), source: 'Sample' }))
    const merged = [...loaded, ...samples]
    const seen = new Set<string>()
    return merged.filter(({ dataset }) => {
      if (seen.has(dataset.id)) return false
      seen.add(dataset.id)
      return true
    })
  }, [activeDataset, datasets])

  useEffect(() => {
    if (!activeDataset) return
    const hasSelectedDataset = allDatasets.some(({ dataset }) => dataset.id === fitDatasetId)
    if (fitDatasetId && hasSelectedDataset) return
    setFitDatasetId(activeDataset.id)
    setFitColumn('')
    setFitValues([])
    setFitComparison([])
    setFitResult(null)
  }, [activeDataset, allDatasets, fitDatasetId])

  const fitDataset = useMemo(() => {
    return allDatasets.find((item) => item.dataset.id === fitDatasetId)?.dataset ?? activeDataset ?? allDatasets[0]?.dataset ?? null
  }, [activeDataset, allDatasets, fitDatasetId])

  const numericColumns = useMemo(() => fitDataset?.schema.filter((column) => column.type === 'numeric').map((column) => column.name) ?? [], [fitDataset])
  const categoricalColumns = useMemo(() => fitDataset?.schema.filter((column) => column.type !== 'numeric').map((column) => column.name) ?? [], [fitDataset])
  const suggestedFitColumn = useMemo(() => preferredNumericColumn(fitDataset, numericColumns, dist), [dist, fitDataset, numericColumns])
  const effectiveFitColumn = fitColumn || suggestedFitColumn || numericColumns[0] || ''
  const automaticFitValues = useMemo(() => valuesForColumn(fitDataset, effectiveFitColumn), [effectiveFitColumn, fitDataset])
  const visibleFitValues = fitValues.length ? fitValues : automaticFitValues
  const visibleFitResult = useMemo(() => fitResult ?? (visibleFitValues.length > 1 ? goodnessOfFit(dist, cleanParams, visibleFitValues) : null), [cleanParams, dist, fitResult, visibleFitValues])
  const fitSummary = useMemo(() => summarizeFit(visibleFitValues, fitDataset, effectiveFitColumn), [effectiveFitColumn, fitDataset, visibleFitValues])
  const probability = probabilityAnswer(dist, cleanParams, questionType, Number(x1), Number(x2), Number(q), visibleFitValues)

  const changeDistribution = (id: DistributionId) => {
    setSelected(id)
    setParams(defaultParams(DISTRIBUTION_BY_ID[id]))
    setSamples([])
    setSimMeans([])
    setFitComparison([])
    setFitResult(null)
    navigate(`/distributions/${id}`)
  }

  const updateParam = (key: string, value: number) => {
    setParams((prev) => sanitizeParams(dist, { ...prev, [key]: value }))
  }

  const resetParams = () => setParams(defaultParams(dist))

  const exportCurve = () => downloadText(`${selected}-${curveMode}.csv`, exportCurveCsv(dist, cleanParams, curveMode === 'density' ? 'density' : 'cdf', visibleFitValues), 'text/csv')

  const saveModule = () => downloadText(`${selected}-studio.json`, JSON.stringify({
    distribution: dist.name,
    route: `/distributions/${selected}`,
    mode: studioMode,
    curveMode,
    params: cleanParams,
    probability,
    fit: fitSummary,
  }, null, 2), 'application/json')

  const generate = () => {
    const count = clamp(Math.round(Number(sampleCount) || 100), 1, 5000)
    const generated = selected === 'empirical' && visibleFitValues.length
      ? Array.from({ length: count }, () => visibleFitValues[Math.floor(Math.random() * visibleFitValues.length)])
      : generateSamples(dist, cleanParams, count, visibleFitValues)
    setSamples(generated)
    notify(`Generated ${count.toLocaleString()} ${dist.name} samples.`, 'success')
  }

  const simulateMeans = () => {
    const reps = clamp(Math.round(Number(simReps) || 200), 20, 1500)
    const size = clamp(Math.round(Number(sampleCount) || 100), 2, 500)
    const means = Array.from({ length: reps }, () => {
      const draw = generateSamples(dist, cleanParams, size, visibleFitValues)
      const values = draw.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
      return values.length ? mean(values) : NaN
    }).filter(Number.isFinite)
    setSimMeans(means)
    notify(`Simulated ${means.length.toLocaleString()} sample means.`, 'success')
  }

  const loadFitData = () => {
    if (!fitDataset || !effectiveFitColumn) return
    const values = valuesForColumn(fitDataset, effectiveFitColumn)
    setFitValues(values)
    setFitResult(values.length > 1 ? goodnessOfFit(dist, cleanParams, values) : null)
    notify(`Loaded ${values.length.toLocaleString()} values from ${fitDataset.name}.`, 'success')
  }

  const selectFitDataset = (id: string) => {
    const nextDataset = allDatasets.find((item) => item.dataset.id === id)?.dataset
    setFitDatasetId(id)
    setFitColumn('')
    setFitValues([])
    setFitComparison([])
    setFitResult(null)
    if (nextDataset) setActiveDataset(nextDataset)
  }

  const fitCurrent = () => {
    const sourceValues = fitValues.length ? fitValues : automaticFitValues
    if (sourceValues.length < 2) {
      notify('Load real numeric data before fitting.', 'info')
      return
    }
    const fitted = fitDistribution(dist, sourceValues)
    if (!fitted) {
      notify(`${dist.name} cannot be fitted to this column.`, 'info')
      return
    }
    setParams(fitted)
    setFitValues(sourceValues)
    setFitResult(goodnessOfFit(dist, sanitizeParams(dist, fitted), sourceValues))
    notify(`${dist.name} parameters fitted from real data.`, 'success')
  }

  const compareAll = () => {
    const sourceValues = fitValues.length ? fitValues : automaticFitValues
    if (sourceValues.length < 2) return
    const results = compareFits(sourceValues)
    setFitValues(sourceValues)
    setFitComparison(results)
    notify(`Compared ${results.length.toLocaleString()} compatible distributions.`, 'success')
  }

  const openSuggestedDataset = async (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((item) => item.id === sampleId)
    if (!sample) return
    const dataset = sampleToDataset(sample)
    addDataset(dataset)
    setActiveDataset(dataset)
    await saveDataset(dataset)
    setFitDatasetId(dataset.id)
    const numeric = dataset.schema.filter((column) => column.type === 'numeric').map((column) => column.name)
    setFitColumn(preferredNumericColumn(dataset, numeric, dist))
    notify(`${dataset.name} loaded for fitting.`, 'success')
    setStudioMode('fit')
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 lg:flex-row">
      <DistributionSidebar selected={selected} onSelect={changeDistribution} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 p-3 sm:p-4 lg:p-4">
          {!activeDataset && (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Upload size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Explore, learn and simulate without uploading data.</p>
                  <p className="text-xs opacity-80">Use Fit Data mode when you want real diagnostics from a loaded or sample dataset.</p>
                </div>
              </div>
              <Link to="/data/upload" className="rounded-xl bg-indigo-600 px-3 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700">Open datasets</Link>
            </div>
          )}

          <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <FlaskConical size={16} />
                </span>
                <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{dist.name} Distribution</h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{groupLabel(dist)}</span>
              </div>
              <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500 dark:text-slate-400">{experience.tagline}</p>
              <p className="text-xs font-semibold text-slate-400">Support: {dist.support}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportCurve} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
                <Download size={15} /> Export
              </button>
              <button type="button" onClick={saveModule} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <Save size={15} /> Save Module
              </button>
            </div>
          </header>

          <DistributionDataSource
            datasets={allDatasets}
            fitDatasetId={fitDataset?.id ?? ''}
            setFitDatasetId={selectFitDataset}
            numericColumns={numericColumns}
            fitColumn={effectiveFitColumn}
            setFitColumn={(column) => {
              setFitColumn(column)
              setFitValues([])
              setFitComparison([])
              setFitResult(null)
            }}
            loadedCount={visibleFitValues.length}
            onLoadData={loadFitData}
            onOpenFit={() => setStudioMode('fit')}
          />

          <ModeTabs mode={studioMode} setMode={setStudioMode} />

          {studioMode === 'explore' && (
            <ExploreMode
              dist={dist}
              params={cleanParams}
              experience={experience}
              curveMode={curveMode}
              setCurveMode={setCurveMode}
              questionType={questionType}
              setQuestionType={setQuestionType}
              x1={x1}
              setX1={setX1}
              x2={x2}
              setX2={setX2}
              q={q}
              setQ={setQ}
              probability={probability}
              updateParam={updateParam}
              resetParams={resetParams}
              loadedData={visibleFitValues}
              binCount={binCount}
              setBinCount={setBinCount}
            />
          )}

          {studioMode === 'learn' && <LearnMode dist={dist} experience={experience} params={cleanParams} />}

          {studioMode === 'simulate' && (
            <SimulateMode
              dist={dist}
              experience={experience}
              sampleCount={sampleCount}
              setSampleCount={setSampleCount}
              simReps={simReps}
              setSimReps={setSimReps}
              samples={samples}
              simMeans={simMeans}
              onGenerate={generate}
              onSimulateMeans={simulateMeans}
              loadedData={visibleFitValues}
            />
          )}

          {studioMode === 'fit' && (
            <FitDataMode
              dist={dist}
              params={cleanParams}
              experience={experience}
              datasets={allDatasets}
              fitDatasetId={fitDataset?.id ?? ''}
              setFitDatasetId={selectFitDataset}
              numericColumns={numericColumns}
              categoricalColumns={categoricalColumns}
              fitColumn={effectiveFitColumn}
              setFitColumn={(column) => {
                setFitColumn(column)
                setFitValues([])
              }}
              fitValues={visibleFitValues}
              fitSummary={fitSummary}
              fitResult={visibleFitResult}
              fitComparison={fitComparison}
              onLoadData={loadFitData}
              onFitCurrent={fitCurrent}
              onCompareAll={compareAll}
              onOpenSuggestedDataset={openSuggestedDataset}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function DistributionSidebar({ selected, onSelect }: { selected: DistributionId; onSelect: (id: DistributionId) => void }) {
  return (
    <aside className="shrink-0 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:h-full lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="mb-3 flex items-center gap-2 px-1">
        <FlaskConical size={18} className="text-indigo-500" />
        <h2 className="font-black text-slate-900 dark:text-white">Distributions</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:overflow-visible lg:pb-0">
        {['Discrete', 'Continuous', 'Multivariate', 'Empirical'].map((group) => (
          <div key={group} className="min-w-48 lg:mb-4 lg:min-w-0">
            <p className="mb-1 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">{group}</p>
            {DISTRIBUTIONS.filter((item) => groupLabel(item) === group).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  selected === item.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}

function ModeTabs({ mode, setMode }: { mode: StudioMode; setMode: (mode: StudioMode) => void }) {
  return (
    <nav aria-label="Distribution studio modes" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-4">
      {STUDIO_MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setMode(id)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            mode === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </nav>
  )
}

function DistributionDataSource({
  datasets,
  fitDatasetId,
  setFitDatasetId,
  numericColumns,
  fitColumn,
  setFitColumn,
  loadedCount,
  onLoadData,
  onOpenFit,
}: {
  datasets: Array<{ dataset: Dataset; source: string }>
  fitDatasetId: string
  setFitDatasetId: (id: string) => void
  numericColumns: string[]
  fitColumn: string
  setFitColumn: (column: string) => void
  loadedCount: number
  onLoadData: () => void
  onOpenFit: () => void
}) {
  const selectedDataset = datasets.find(({ dataset }) => dataset.id === fitDatasetId)?.dataset
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Database size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Working dataset
                <select value={fitDatasetId} onChange={(event) => setFitDatasetId(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  {datasets.map(({ dataset, source }) => <option key={dataset.id} value={dataset.id}>{dataset.name} ({source})</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Numeric column
                <select value={fitColumn} onChange={(event) => setFitColumn(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  {numericColumns.length ? numericColumns.map((column) => <option key={column} value={column}>{column}</option>) : <option value="">No numeric columns</option>}
                </select>
              </label>
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-slate-400">
              {selectedDataset ? `${selectedDataset.rows.toLocaleString()} rows x ${selectedDataset.cols} columns` : 'No dataset selected'}
              {loadedCount > 0 ? ` · ${loadedCount.toLocaleString()} values attached` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onLoadData} disabled={!numericColumns.length} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40">
            <Upload size={15} /> Use Data
          </button>
          <button type="button" onClick={onOpenFit} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
            <SlidersHorizontal size={15} /> Fit
          </button>
        </div>
      </div>
    </section>
  )
}

function ExploreMode({
  dist,
  params,
  experience,
  curveMode,
  setCurveMode,
  questionType,
  setQuestionType,
  x1,
  setX1,
  x2,
  setX2,
  q,
  setQ,
  probability,
  updateParam,
  resetParams,
  loadedData,
  binCount,
  setBinCount,
}: {
  dist: Distribution
  params: Record<string, number>
  experience: DistributionExperience
  curveMode: CurveMode
  setCurveMode: (mode: CurveMode) => void
  questionType: QuestionType
  setQuestionType: (type: QuestionType) => void
  x1: string
  setX1: (value: string) => void
  x2: string
  setX2: (value: string) => void
  q: string
  setQ: (value: string) => void
  probability: string
  updateParam: (key: string, value: number) => void
  resetParams: () => void
  loadedData: number[]
  binCount: number
  setBinCount: (value: number) => void
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => setCurveMode('density')} className={`rounded-xl px-4 py-2 text-sm font-black ${curveMode === 'density' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
              {dist.family === 'discrete' || dist.family === 'multivariate' ? 'PMF' : 'PDF'}
            </button>
            <button type="button" onClick={() => setCurveMode('cdf')} className={`rounded-xl px-4 py-2 text-sm font-black ${curveMode === 'cdf' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>CDF</button>
          </div>
          <div className="flex gap-2">
            <IconButton label="Zoom in" />
            <IconButton label="Zoom out" />
            <IconButton label="Reset view" />
          </div>
        </div>
        <DistributionVisual dist={dist} params={params} experience={experience} curveMode={curveMode} questionType={questionType} x1={Number(x1)} x2={Number(x2)} q={Number(q)} loadedData={loadedData} binCount={binCount} />
      </section>

      <ParameterControls dist={dist} params={params} updateParam={updateParam} resetParams={resetParams} />

      <ProbabilityComposer
        dist={dist}
        questionType={questionType}
        setQuestionType={setQuestionType}
        x1={x1}
        setX1={setX1}
        x2={x2}
        setX2={setX2}
        q={q}
        setQ={setQ}
        probability={probability}
      />

      <section className="grid gap-4 xl:col-span-2 lg:grid-cols-3">
        <FormulaCard dist={dist} />
        <IntuitionCard experience={experience} dist={dist} />
        <TryItCard dist={dist} params={params} loadedData={loadedData} />
      </section>

      <DistributionDepthPanel dist={dist} params={params} loadedData={loadedData} probability={probability} />
      <DistributionSpecificToolsPanel dist={dist} params={params} loadedData={loadedData} />

      <section className="grid gap-3 xl:col-span-2 md:grid-cols-2 xl:grid-cols-4">
        <InfoStrip icon={Info} title="Assumptions" items={experience.assumptions} />
        <InfoStrip icon={AlertTriangle} title="Common mistakes" items={experience.mistakes} />
        <InfoStrip icon={Layers3} title="Related distributions" items={experience.related.map((item) => `${DISTRIBUTION_BY_ID[item.id].name}: ${item.note}`)} />
        <InfoStrip icon={BookOpen} title="Parameter meaning" items={dist.params.length ? dist.params.map((param) => `${param.key}: ${param.label}`) : ['Fixed or data-driven distribution.']} />
      </section>

      {dist.id === 'empirical' && (
        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-slate-950 dark:text-white">Empirical controls</h2>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Bins
              <input type="range" min={6} max={40} value={binCount} onChange={(event) => setBinCount(Number(event.target.value))} className="accent-indigo-600" />
              <span className="w-8 text-right">{binCount}</span>
            </label>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Choose a working dataset and numeric column above. The empirical page uses those genuine observations for histogram, ECDF, box, rug and density views.</p>
        </section>
      )}
    </div>
  )
}

function ParameterControls({ dist, params, updateParam, resetParams }: { dist: Distribution; params: Record<string, number>; updateParam: (key: string, value: number) => void; resetParams: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-slate-950 dark:text-white">Distribution Controls</h2>
        <button type="button" onClick={resetParams} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800" aria-label="Reset parameters">
          <RefreshCw size={16} />
        </button>
      </div>
      {dist.params.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">This page has fixed or data-driven parameters.</div>
      ) : (
        <div className="space-y-4">
          {dist.params.map((param) => (
            <div key={param.key}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">{param.label}</label>
                <input
                  type="number"
                  value={params[param.key] ?? param.default}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  onChange={(event) => updateParam(param.key, Number(event.target.value))}
                  className="min-h-10 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={params[param.key] ?? param.default}
                onChange={(event) => updateParam(param.key, Number(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          ))}
        </div>
      )}
      <div className={`mt-5 grid gap-2 ${dist.family === 'multivariate' ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <Metric label="E[X]" value={controlExpectedValue(dist, params)} />
        <Metric label="Var(X)" value={controlVarianceValue(dist, params)} />
        <Metric label="Support" value={controlSupportValue(dist)} />
      </div>
    </section>
  )
}

function DistributionVisual({ dist, params, experience, curveMode, questionType, x1, x2, q, loadedData, binCount }: { dist: Distribution; params: Record<string, number>; experience: DistributionExperience; curveMode: CurveMode; questionType: QuestionType; x1: number; x2: number; q: number; loadedData: number[]; binCount: number }) {
  if (dist.id === 'bernoulli') return <BernoulliVisual params={params} />
  if (dist.id === 'hypergeometric') return <HypergeometricVisual dist={dist} params={params} />
  if (dist.id === 'poisson') return <PoissonVisual dist={dist} params={params} questionType={questionType} x1={x1} x2={x2} />
  if (dist.id === 'discrete_uniform') return <DiscreteBarsVisual dist={dist} params={params} questionType={questionType} x1={x1} x2={x2} title="Equal probability for every integer in the support" />
  if (dist.id === 'continuous_uniform') return <UniformContinuousVisual dist={dist} params={params} questionType={questionType} x1={x1} x2={x2} curveMode={curveMode} />
  if (dist.id === 'weibull') return <WeibullVisual dist={dist} params={params} questionType={questionType} x1={x1} x2={x2} />
  if (dist.id === 'pareto') return <ParetoVisual dist={dist} params={params} />
  if (dist.id === 'cauchy') return <CauchyVisual dist={dist} params={params} />
  if (dist.id === 'logistic') return <LogisticVisual dist={dist} params={params} curveMode={curveMode} />
  if (dist.id === 'multinomial') return <MultinomialVisual params={params} />
  if (dist.id === 'dirichlet') return <DirichletVisual params={params} />
  if (dist.id === 'empirical') return <EmpiricalVisual values={loadedData} binCount={binCount} />
  if (dist.family === 'discrete') return <DiscreteBarsVisual dist={dist} params={params} questionType={questionType} x1={x1} x2={x2} title={experience.intuition} />
  return <ContinuousCurveVisual dist={dist} params={params} curveMode={curveMode} questionType={questionType} x1={x1} x2={x2} q={q} loadedData={loadedData} />
}

function ContinuousCurveVisual({ dist, params, curveMode, questionType, x1, x2, q, loadedData }: { dist: Distribution; params: Record<string, number>; curveMode: CurveMode; questionType: QuestionType; x1: number; x2: number; q: number; loadedData: number[] }) {
  const curve = curvePoints(dist, params, curveMode === 'density' ? 'density' : 'cdf', loadedData)
  const points = curve.x.map((x, index) => ({ x, y: curve.y[index] })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
  const dataValues = loadedData.filter(Number.isFinite)
  const dataMin = dataValues.length ? Math.min(...dataValues) : Infinity
  const dataMax = dataValues.length ? Math.max(...dataValues) : -Infinity
  const minX = Math.min(...points.map((point) => point.x), dataMin)
  const maxX = Math.max(...points.map((point) => point.x), dataMax)
  const dataBins = curveMode === 'density' && dataValues.length > 1 ? histogramBins(dataValues, 24) : []
  const binWidth = dataBins[0] ? Math.max(dataBins[0].end - dataBins[0].start, 1e-9) : 1
  const histogramDensities = dataBins.map((bin) => bin.count / Math.max(dataValues.length * binWidth, 1e-9))
  const ecdfPoints = curveMode === 'cdf' && dataValues.length > 1
    ? [...dataValues].sort((a, b) => a - b).map((value, index) => ({ x: value, y: (index + 1) / dataValues.length }))
    : []
  const maxY = Math.max(...points.map((point) => point.y), ...histogramDensities, 1)
  const width = 760
  const height = 360
  const left = 46
  const right = 18
  const top = 20
  const bottom = 42
  const px = (value: number) => left + ((value - minX) / Math.max(maxX - minX, 1)) * (width - left - right)
  const py = (value: number) => height - bottom - (value / Math.max(maxY, 1e-9)) * (height - top - bottom)
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${px(point.x).toFixed(1)} ${py(point.y).toFixed(1)}`).join(' ')
  const baseline = height - bottom
  const shadeLow = questionType === 'right' ? x1 : questionType === 'inverse' ? dist.inv(clamp(q, 0.001, 0.999), params, loadedData) : Math.min(x1, x2)
  const shadeHigh = questionType === 'left' || questionType === 'inverse' ? x1 : Math.max(x1, x2)
  const shadePoints = points.filter((point) => questionType === 'right' ? point.x >= shadeLow : point.x >= shadeLow && point.x <= shadeHigh)
  const shadePath = shadePoints.length ? `${shadePoints.map((point, index) => `${index ? 'L' : 'M'} ${px(point.x).toFixed(1)} ${py(point.y).toFixed(1)}`).join(' ')} L ${px(shadePoints[shadePoints.length - 1].x).toFixed(1)} ${baseline} L ${px(shadePoints[0].x).toFixed(1)} ${baseline} Z` : ''
  const mu = params.mu ?? 0
  const sigma = params.sigma ?? params.s ?? 1

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${dist.name} ${curveMode} graph`} className="min-h-[320px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
        {Array.from({ length: 7 }, (_, index) => (
          <line key={`v-${index}`} x1={left + index * ((width - left - right) / 6)} x2={left + index * ((width - left - right) / 6)} y1={top} y2={baseline} stroke="#e2e8f0" strokeDasharray="4 4" />
        ))}
        {Array.from({ length: 5 }, (_, index) => (
          <line key={`h-${index}`} x1={left} x2={width - right} y1={top + index * ((baseline - top) / 4)} y2={top + index * ((baseline - top) / 4)} stroke="#e2e8f0" strokeDasharray="4 4" />
        ))}
        {shadePath && <path d={shadePath} fill="url(#probFill)" opacity="0.85" />}
        <path d={`${path} L ${px(maxX)} ${baseline} L ${px(minX)} ${baseline} Z`} fill="rgba(99,102,241,0.12)" />
        {dataBins.map((bin, index) => {
          const density = histogramDensities[index]
          const x = px(bin.start)
          const w = Math.max(1, px(bin.end) - x - 1)
          const h = baseline - py(density)
          return <rect key={`${bin.start}-${bin.end}`} x={x} y={py(density)} width={w} height={h} fill="#10b981" opacity="0.28" />
        })}
        {ecdfPoints.length > 1 && (
          <path
            d={ecdfPoints.map((point, index) => `${index ? 'L' : 'M'} ${px(point.x).toFixed(1)} ${py(point.y).toFixed(1)}`).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="5 5"
          />
        )}
        {dataValues.length > 0 && curveMode === 'density' && dataValues.slice(0, 220).map((value, index) => (
          <line key={`${value}-${index}`} x1={px(value)} x2={px(value)} y1={baseline - 12} y2={baseline} stroke="#059669" strokeOpacity="0.28" />
        ))}
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="3" />
        {dist.id === 'normal' && curveMode === 'density' && [-2, -1, 0, 1, 2].map((z) => (
          <line key={z} x1={px(mu + z * sigma)} x2={px(mu + z * sigma)} y1={top + 16} y2={baseline} stroke={z === 0 ? '#64748b' : '#10b981'} strokeDasharray={z === 0 ? '2 2' : '5 5'} />
        ))}
        {dist.id === 'standard_normal' && [-3, -2, -1, 0, 1, 2, 3].map((z) => (
          <text key={z} x={px(z)} y={height - 14} textAnchor="middle" fill="#475569" fontSize="12">{z > 0 ? `+${z}` : z}</text>
        ))}
        <line x1={left} x2={width - right} y1={baseline} y2={baseline} stroke="#94a3b8" />
        <line x1={left} x2={left} y1={top} y2={baseline} stroke="#94a3b8" />
        <text x={width / 2} y={height - 8} textAnchor="middle" fill="#475569" fontSize="13">x</text>
        <text x="15" y={height / 2} fill="#475569" fontSize="13" transform={`rotate(-90 15 ${height / 2})`}>{curveMode === 'cdf' ? 'F(x)' : 'PDF'}</text>
        <defs>
          <linearGradient id="probFill" x1="0" x2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
          </linearGradient>
        </defs>
      </svg>
      {dataValues.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{dataValues.length.toLocaleString()} loaded values</span>
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">Purple = model</span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Green = data</span>
        </div>
      )}
      {dist.id === 'normal' && (
        <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:grid-cols-3">
          <span className="rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/40">68% within +/-1 sigma</span>
          <span className="rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/40">95% within +/-2 sigma</span>
          <span className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">99.7% within +/-3 sigma</span>
        </div>
      )}
    </div>
  )
}

function DiscreteBarsVisual({ dist, params, questionType, x1, x2, title }: { dist: Distribution; params: Record<string, number>; questionType: QuestionType; x1: number; x2: number; title: string }) {
  const [lo, hi] = dist.range(params)
  const start = Math.max(-2, Math.ceil(lo))
  const end = Math.min(Math.floor(hi), start + 45)
  const xs = Array.from({ length: Math.max(1, end - start + 1) }, (_, index) => start + index)
  const ys = xs.map((x) => dist.pdf(x, params))
  const maxY = Math.max(...ys, 1e-9)
  const width = 760
  const height = 330
  const left = 42
  const bottom = 40
  const barGap = 4
  const barW = Math.max(6, (width - left - 22) / xs.length - barGap)
  const selectedLow = Math.min(x1, x2)
  const selectedHigh = questionType === 'left' ? x1 : questionType === 'right' ? Infinity : Math.max(x1, x2)

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${dist.name} PMF bars`} className="min-h-[310px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
        <line x1={left} x2={width - 18} y1={height - bottom} y2={height - bottom} stroke="#94a3b8" />
        <line x1={left} x2={left} y1="22" y2={height - bottom} stroke="#94a3b8" />
        {xs.map((x, index) => {
          const h = (ys[index] / maxY) * (height - 72)
          const inRange = questionType === 'right' ? x >= x1 : x >= selectedLow && x <= selectedHigh
          return (
            <g key={x}>
              <rect x={left + index * (barW + barGap) + 4} y={height - bottom - h} width={barW} height={h} rx="5" fill={inRange ? '#10b981' : '#6366f1'} opacity={inRange ? 0.85 : 0.62} />
              {xs.length <= 22 && <text x={left + index * (barW + barGap) + 4 + barW / 2} y={height - 16} textAnchor="middle" fill="#64748b" fontSize="11">{x}</text>}
            </g>
          )
        })}
        <text x={left + 8} y="22" fill="#475569" fontSize="13" fontWeight="700">{title}</text>
      </svg>
      {dist.id === 'negative_binomial' && <TrialSequence successes={Math.round(params.r ?? 5)} p={params.p ?? 0.4} />}
      {dist.id === 'geometric' && <TrialSequence successes={1} p={params.p ?? 0.25} />}
      {dist.id === 'binomial' && <TrialGrid n={Math.round(params.n ?? 10)} p={params.p ?? 0.5} />}
    </div>
  )
}

function BernoulliVisual({ params }: { params: Record<string, number> }) {
  const p = clamp(params.p ?? 0.5, 0, 1)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <OutcomeBlock title="Failure" value="X = 0" probability={1 - p} tone="slate" />
      <OutcomeBlock title="Success" value="X = 1" probability={p} tone="emerald" />
      <div className="lg:col-span-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
        <div className="h-7 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${p * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs font-bold text-slate-500">
          <span>1 - p = {numberFormat(1 - p)}</span>
          <span>p = {numberFormat(p)}</span>
        </div>
        <TrialSequence successes={1} p={p} />
      </div>
    </div>
  )
}

function OutcomeBlock({ title, value, probability, tone }: { title: string; value: string; probability: number; tone: 'slate' | 'emerald' }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'}`}>
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-3 text-4xl font-black text-indigo-600 dark:text-indigo-300">{numberFormat(probability, 3)}</p>
    </div>
  )
}

function HypergeometricVisual({ dist, params }: { dist: Distribution; params: Record<string, number> }) {
  const N = Math.round(params.N ?? 60)
  const K = Math.round(params.K ?? 20)
  const n = Math.round(params.n ?? 10)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
        <p className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">Population without replacement</p>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: Math.min(N, 80) }, (_, index) => (
            <span key={index} className={`aspect-square rounded-full ${index < K ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Draw {n} from {N}; {K} are success items. Probabilities change after each draw.</p>
      </div>
      <DiscreteBarsVisual dist={dist} params={params} questionType="between" x1={0} x2={n} title="Successes in the sample" />
    </div>
  )
}

function PoissonVisual({ dist, params, questionType, x1, x2 }: { dist: Distribution; params: Record<string, number>; questionType: QuestionType; x1: number; x2: number }) {
  const lambda = params.lambda ?? 5
  return (
    <div>
      <div className="mb-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
        <p className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">Event-arrival timeline</p>
        <div className="relative h-14 rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {Array.from({ length: Math.min(20, Math.round(lambda * 2 + 4)) }, (_, index) => (
            <span key={index} className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-indigo-500 shadow" style={{ left: `${6 + ((index * 37 + 11) % 88)}%` }} />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Events occur independently at an average rate lambda = {numberFormat(lambda)} per interval.</p>
      </div>
      <DiscreteBarsVisual dist={dist} params={params} questionType={questionType} x1={x1} x2={x2} title="Counts per interval" />
    </div>
  )
}

function UniformContinuousVisual({ params, x1, x2, curveMode }: { dist: Distribution; params: Record<string, number>; questionType: QuestionType; x1: number; x2: number; curveMode: CurveMode }) {
  const a = params.a ?? 0
  const b = params.b ?? 1
  const low = Math.max(a, Math.min(x1, x2))
  const high = Math.min(b, Math.max(x1, x2))
  const width = 760
  const height = 300
  const px = (value: number) => 70 + ((value - (a - (b - a) * 0.2)) / ((b - a) * 1.4 || 1)) * 620
  const rectY = 80
  const rectH = 120
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Continuous uniform rectangular density" className="min-h-[300px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      {curveMode === 'cdf' ? (
        <polyline points={`${px(a)},230 ${px(a)},210 ${px(b)},70 ${px(b)},55`} fill="none" stroke="#4f46e5" strokeWidth="4" />
      ) : (
        <>
          <rect x={px(a)} y={rectY} width={px(b) - px(a)} height={rectH} rx="8" fill="rgba(99,102,241,0.18)" stroke="#4f46e5" strokeWidth="3" />
          <rect x={px(low)} y={rectY} width={Math.max(0, px(high) - px(low))} height={rectH} fill="rgba(16,185,129,0.35)" />
        </>
      )}
      <line x1="46" x2="720" y1="230" y2="230" stroke="#94a3b8" />
      <text x={px(a)} y="255" textAnchor="middle" fill="#475569">a</text>
      <text x={px(b)} y="255" textAnchor="middle" fill="#475569">b</text>
      <text x="70" y="34" fill="#475569" fontWeight="700">Area is probability. The rectangle has constant height 1/(b-a).</text>
    </svg>
  )
}

function WeibullVisual({ dist, params, questionType, x1, x2 }: { dist: Distribution; params: Record<string, number>; questionType: QuestionType; x1: number; x2: number }) {
  const shape = params.shape ?? 1.5
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="lg:col-span-2"><ContinuousCurveVisual dist={dist} params={params} curveMode="density" questionType={questionType} x1={x1} x2={x2} q={0.95} loadedData={[]} /></div>
      <div className="grid gap-3">
        <MiniFunction title="Survival S(x)" dist={dist} params={params} kind="survival" />
        <MiniFunction title="Hazard h(x)" dist={dist} params={params} kind="hazard" />
        <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
          <p className="font-black text-slate-800 dark:text-white">Failure rate</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{shape < 1 ? 'Decreasing early failure rate.' : shape === 1 ? 'Constant failure rate.' : 'Increasing wear-out failure rate.'}</p>
        </div>
      </div>
    </div>
  )
}

function ParetoVisual({ dist, params }: { dist: Distribution; params: Record<string, number> }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      <ContinuousCurveVisual dist={dist} params={params} curveMode="density" questionType="right" x1={params.xm ?? 1} x2={0} q={0.95} loadedData={[]} />
      <div className="grid gap-3">
        <MiniFunction title="Survival tail" dist={dist} params={params} kind="survival" />
        <TailShareChart alpha={params.alpha ?? 2.5} />
      </div>
    </div>
  )
}

function CauchyVisual({ dist, params }: { dist: Distribution; params: Record<string, number> }) {
  const normal = DISTRIBUTION_BY_ID.normal
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      <OverlayCurve primary={dist} secondary={normal} params={params} secondaryParams={{ mu: params.x0 ?? 0, sigma: params.gamma ?? 1 }} labelA="Cauchy" labelB="Normal" />
      <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
        <AlertTriangle className="text-rose-500" size={22} />
        <h2 className="mt-3 font-black text-slate-950 dark:text-white">Mean and variance do not exist</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Running averages stay unstable because extreme observations are common enough to dominate the sample.</p>
        <RunningMeanStrip />
      </div>
    </div>
  )
}

function LogisticVisual({ dist, params, curveMode }: { dist: Distribution; params: Record<string, number>; curveMode: CurveMode }) {
  const normal = DISTRIBUTION_BY_ID.normal
  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      {curveMode === 'cdf'
        ? <ContinuousCurveVisual dist={dist} params={params} curveMode="cdf" questionType="between" x1={params.mu - 1} x2={params.mu + 1} q={0.95} loadedData={[]} />
        : <OverlayCurve primary={dist} secondary={normal} params={params} secondaryParams={{ mu: params.mu ?? 0, sigma: (params.s ?? 1) * 1.8 }} labelA="Logistic" labelB="Normal" />}
      <MiniFunction title="S-shaped CDF" dist={dist} params={params} kind="cdf" />
    </div>
  )
}

function MultinomialVisual({ params }: { params: Record<string, number> }) {
  const p1 = clamp(params.p1 ?? 0.3, 0.01, 0.98)
  const p2 = clamp(params.p2 ?? 0.4, 0.01, 0.98)
  const p3 = Math.max(0.01, 1 - p1 - p2)
  const total = p1 + p2 + p3
  const probs = [p1 / total, p2 / total, p3 / total]
  const colors = ['#6366f1', '#10b981', '#f97316']
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
        <p className="mb-4 text-sm font-black text-slate-700 dark:text-slate-200">Category probabilities</p>
        {probs.map((p, index) => (
          <div key={index} className="mb-3">
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>Category {index + 1}</span><span>{numberFormat(p, 3)}</span></div>
            <div className="h-5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full" style={{ width: `${p * 100}%`, background: colors[index] }} /></div>
          </div>
        ))}
      </div>
      <CompositionChart probs={probs} colors={colors} />
    </div>
  )
}

function DirichletVisual({ params }: { params: Record<string, number> }) {
  const a = [params.a1 ?? 2, params.a2 ?? 3, params.a3 ?? 4]
  const sum = a.reduce((total, value) => total + value, 0)
  const p = a.map((value) => value / sum)
  const point = ternaryPoint(p[0], p[1], p[2])
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <svg viewBox="0 0 520 420" role="img" aria-label="Dirichlet ternary simplex" className="min-h-[340px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
        <polygon points="260,34 50,380 470,380" fill="rgba(99,102,241,0.08)" stroke="#4f46e5" strokeWidth="3" />
        {Array.from({ length: 7 }, (_, index) => (
          <circle key={index} cx={85 + index * 58} cy={350 - Math.sin(index) * 110} r={22 + index * 3} fill={index % 2 ? '#8b5cf6' : '#10b981'} opacity="0.12" />
        ))}
        <circle cx={point.x} cy={point.y} r="12" fill="#f97316" stroke="white" strokeWidth="4" />
        <text x="260" y="22" textAnchor="middle" fill="#475569" fontWeight="700">Category 1</text>
        <text x="32" y="398" fill="#475569" fontWeight="700">Category 2</text>
        <text x="430" y="398" fill="#475569" fontWeight="700">Category 3</text>
      </svg>
      <div className="grid gap-3">
        <CompositionChart probs={p} colors={['#6366f1', '#10b981', '#f97316']} />
        <p className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">Concentration = {numberFormat(sum)}. Higher concentration keeps probability vectors closer to the centre.</p>
      </div>
    </div>
  )
}

function EmpiricalVisual({ values, binCount }: { values: number[]; binCount: number }) {
  if (!values.length) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center dark:bg-slate-950">
        <Box size={34} className="text-indigo-500" />
        <h2 className="mt-3 text-lg font-black text-slate-950 dark:text-white">Load real data in Fit Data mode</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">The empirical page is data-driven and does not invent a theoretical curve.</p>
      </div>
    )
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <HistogramSvg values={values} binCount={binCount} title="Histogram with rug" />
      <EcdfSvg values={values} />
      <BoxPlotSvg values={values} />
      <ViolinSvg values={values} />
    </div>
  )
}

function DistributionTheoryPanel({ dist }: { dist: Distribution }) {
  const theory = distributionTheory(dist.id)
  const basics = distributionBasics(dist.id)
  const numericalExamples = distributionNumericalExamples(dist.id)
  return (
    <section className="lg:col-span-2 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-500" />
            <h2 className="font-black text-slate-950 dark:text-white">{dist.name} theory in simple words</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{theory.plainMeaning}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">Learn mode</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Use it when</p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{theory.whenToUse}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">How to read it</p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{theory.howToRead}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/25">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">Simple warning</p>
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">Use the distribution only when the story of the data matches the model, not just because the curve looks close.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/25">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">From basics</p>
        <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{basics}</p>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">3 examples</p>
        <div className="grid gap-3 md:grid-cols-3">
          {theory.examples.map((example, index) => (
            <article key={example} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">{index + 1}</span>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{example}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">College-style numerical examples</p>
        <div className="grid gap-3 md:grid-cols-3">
          {numericalExamples.map((example, index) => (
            <NumericalExampleCard key={example} dist={dist} example={example} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function NumericalExampleCard({ dist, example, index }: { dist: Distribution; example: string; index: number }) {
  const formula = distributionNumericalFormula(dist.id)
  const answer = finalAnswerFromExample(example)
  return (
    <details className="group rounded-xl border border-emerald-100 bg-emerald-50 p-0 dark:border-emerald-900/50 dark:bg-emerald-950/25">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-2 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        <span>
          <span className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white">Example {index + 1}</span>
          <span className="mt-2 block text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">{shortProblem(example)}</span>
        </span>
        <ChevronDown size={17} className="mt-1 shrink-0 text-emerald-600 transition group-open:rotate-180 dark:text-emerald-300" />
      </summary>
      <div className="space-y-2 border-t border-emerald-100 p-3 text-sm leading-6 text-slate-700 dark:border-emerald-900/50 dark:text-slate-300">
        <WorkedStep label="Given" text={givenFromExample(example)} />
        <WorkedStep label="Formula" text={formula} />
        <WorkedStep label="Substitute" text={example} />
        <WorkedStep label="Answer" text={answer} />
        <WorkedStep label="Interpretation" text={interpretNumericalAnswer(dist, answer)} />
      </div>
    </details>
  )
}

function WorkedStep({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-2 dark:bg-slate-900/60">
      <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{label}</p>
      <p className="mt-1">{text}</p>
    </div>
  )
}

function shortProblem(example: string) {
  return example.split(',')[0].replace(/^If /, 'Given ').replace(/^For /, 'For ')
}

function givenFromExample(example: string) {
  const firstSentence = example.split('.')[0]
  return firstSentence || example
}

function finalAnswerFromExample(example: string) {
  const decimalMatches = [...example.matchAll(/=\s*(-?\d+(?:\.\d+)?)(?![^(]*\))/g)].map((match) => match[1])
  if (decimalMatches.length) return decimalMatches[decimalMatches.length - 1]
  const aboutMatch = example.match(/about\s+([^\.]+)/i)
  if (aboutMatch) return aboutMatch[1]
  const answerMatch = example.match(/answer:\s*([^\.]+)/i)
  if (answerMatch) return answerMatch[1]
  if (/undefined/i.test(example)) return 'undefined'
  if (/valid/i.test(example)) return 'valid'
  return 'Read the final computed value in the substitution step.'
}

function distributionNumericalFormula(id: DistributionId) {
  const formulas: Record<DistributionId, string> = {
    bernoulli: 'Use P(X=1)=p, P(X=0)=1-p, E[X]=p, Var(X)=p(1-p).',
    binomial: 'Use P(X=k)=C(n,k)p^k(1-p)^(n-k), E[X]=np, Var(X)=np(1-p).',
    geometric: 'Use P(X=k)=(1-p)^(k-1)p, E[X]=1/p, and P(X>k)=(1-p)^k.',
    negative_binomial: 'Use P(X=k)=C(k+r-1,k)(1-p)^k p^r, E[X]=r(1-p)/p, Var(X)=r(1-p)/p^2.',
    hypergeometric: 'Use P(X=k)=C(K,k)C(N-K,n-k)/C(N,n), E[X]=nK/N.',
    poisson: 'Use P(X=k)=e^(-lambda)lambda^k/k!, E[X]=lambda, Var(X)=lambda.',
    discrete_uniform: 'Use P(X=x)=1/(b-a+1), E[X]=(a+b)/2 for integer endpoints.',
    continuous_uniform: 'Use P(c<=X<=d)=(d-c)/(b-a), E[X]=(a+b)/2, Var(X)=(b-a)^2/12.',
    normal: 'Use z=(x-mu)/sigma, then read probability from the Normal table or rule.',
    standard_normal: 'Use Z directly with the standard Normal table: mean 0, standard deviation 1.',
    lognormal: 'Use median=e^mu and mean=exp(mu+sigma^2/2) when ln(X) is Normal.',
    exponential: 'Use E[X]=1/lambda, P(X>x)=e^(-lambda x), and P(X<=x)=1-e^(-lambda x).',
    gamma: 'Use E[X]=shape x scale and Var(X)=shape x scale^2.',
    beta: 'Use mean=alpha/(alpha+beta), and posterior Beta(alpha+successes, beta+failures).',
    chi_square: 'Use E[X]=df, Var(X)=2df, or chi-square=(n-1)s^2/sigma0^2 for variance tests.',
    student_t: 'Use df=n-1 and t=(sample mean-null mean)/(s/sqrt(n)).',
    f: 'Use F=MS_between/MS_within or F=larger variance/smaller variance for variance-ratio questions.',
    weibull: 'Use median=lambda(ln 2)^(1/k); shape k explains failure-rate behavior.',
    pareto: 'Use P(X>x)=(xm/x)^alpha and mean=alpha*xm/(alpha-1) when alpha>1.',
    cauchy: 'Use symmetry around location x0; median=x0. Mean and variance are undefined.',
    logistic: 'Use F(x)=1/(1+e^(-(x-mu)/s)); for logit z, probability=1/(1+e^-z).',
    multinomial: 'Use expected count n*pi and coefficient n!/(x1!x2!...xk!).',
    dirichlet: 'Use expected share alpha_i/alpha0 and posterior alpha_i+count_i.',
    empirical: 'Use observed-count probability: count satisfying condition divided by total n.',
  }
  return formulas[id]
}

function interpretNumericalAnswer(dist: Distribution, answer: string) {
  if (/undefined/i.test(answer)) return `For ${dist.name}, this quantity is not mathematically defined, so do not report it as a regular numeric estimate.`
  if (/valid/i.test(answer)) return `The condition is satisfied for ${dist.name}, so the stated probabilities or parameters can be used.`
  return `For this ${dist.name} question, the final numerical result is ${answer}. In an exam, write this with the formula and substitution shown above.`
}

function distributionTheory(id: DistributionId): DistributionTheory {
  const theory: Record<DistributionId, DistributionTheory> = {
    bernoulli: {
      plainMeaning: 'Bernoulli is the simplest probability model: one try, with only success or failure.',
      whenToUse: 'Use it for a single yes/no, pass/fail, true/false, or 0/1 outcome.',
      howToRead: 'p is the chance of success. 1 - p is the chance of failure.',
      examples: ['A student answers one question correctly or incorrectly.', 'A customer clicks an ad or does not click it.', 'A loan application is approved or rejected.'],
    },
    binomial: {
      plainMeaning: 'Binomial counts how many successes happen in a fixed number of identical yes/no trials.',
      whenToUse: 'Use it when the number of trials is fixed and each trial has the same success chance.',
      howToRead: 'n is the number of tries. p is success chance per try. X is the number of successes.',
      examples: ['Number of correct answers in a 20-question multiple-choice quiz.', 'Number of conversions from 100 campaign visitors.', 'Number of defective items in a sample of 50 parts.'],
    },
    geometric: {
      plainMeaning: 'Geometric models how many tries it takes until the first success appears.',
      whenToUse: 'Use it when you repeat independent attempts and stop at the first success.',
      howToRead: 'Smaller p means longer waiting. Larger p means success usually arrives sooner.',
      examples: ['Calls made until one customer answers.', 'Login attempts until a user enters the right password.', 'Website visits until the first purchase.'],
    },
    negative_binomial: {
      plainMeaning: 'Negative Binomial models failures before a chosen number of successes is reached.',
      whenToUse: 'Use it for count data that is more spread out than Poisson, or for waiting until several successes.',
      howToRead: 'r is the target number of successes. p is the chance of success each try.',
      examples: ['Failed sales calls before 5 successful sales.', 'Insurance claims per customer group when counts are highly variable.', 'Defect incidents before a process records 10 clean batches.'],
    },
    hypergeometric: {
      plainMeaning: 'Hypergeometric counts successes when sampling from a finite group without putting items back.',
      whenToUse: 'Use it when the population size and number of success items are known.',
      howToRead: 'N is total items, K is success items, n is drawn items, and X is successes drawn.',
      examples: ['Defective items found when inspecting 10 parts from a batch of 100.', 'Red cards drawn from a deck without replacement.', 'Flagged files found in an audit sample.'],
    },
    poisson: {
      plainMeaning: 'Poisson counts how many events happen in a fixed time, place, or exposure window.',
      whenToUse: 'Use it when events happen independently at a roughly constant average rate.',
      howToRead: 'lambda is the average count. In Poisson, the mean and variance are both lambda.',
      examples: ['Calls arriving at a help desk per hour.', 'Road accidents at an intersection per month.', 'Manufacturing defects per batch.'],
    },
    discrete_uniform: {
      plainMeaning: 'Discrete Uniform means every integer in a fixed range is equally likely.',
      whenToUse: 'Use it for fair random integer choices.',
      howToRead: 'All bars have the same height because every outcome has the same probability.',
      examples: ['Outcome of a fair six-sided die.', 'Randomly choosing an integer from 1 to 10.', 'Assigning a random group number from 1 to 4.'],
    },
    continuous_uniform: {
      plainMeaning: 'Continuous Uniform means every value inside an interval has equal density.',
      whenToUse: 'Use it when only the minimum and maximum are known and all points inside are equally plausible.',
      howToRead: 'Probability is area. Wider intervals contain more probability.',
      examples: ['Random arrival time between 2:00 and 3:00.', 'A simulated measurement chosen anywhere between two limits.', 'Random position along a straight line segment.'],
    },
    normal: {
      plainMeaning: 'Normal is the bell curve: values cluster near the middle and thin out evenly on both sides.',
      whenToUse: 'Use it for many measurement errors, averages, and naturally balanced variation.',
      howToRead: 'mu is the center. sigma is the spread. About 95% is within two sigmas.',
      examples: ['Exam scores around a class average.', 'Small measurement errors from an instrument.', 'Heights of adults in a similar population.'],
    },
    standard_normal: {
      plainMeaning: 'Standard Normal is a Normal curve converted into z-scores.',
      whenToUse: 'Use it when values are measured in standard deviation units from the mean.',
      howToRead: 'z = 0 is average. z = 1 is one standard deviation above average.',
      examples: ['Finding the percentile for a z-score of 1.5.', 'Comparing test scores from different exams after standardizing.', 'Reading critical values for confidence intervals.'],
    },
    lognormal: {
      plainMeaning: 'Lognormal models positive values that grow by multiplication rather than addition.',
      whenToUse: 'Use it for positive right-skewed amounts where a log transform looks bell-shaped.',
      howToRead: 'The original values are skewed, but their logs behave like a Normal distribution.',
      examples: ['House prices in a city.', 'Order values in an online store.', 'Insurance claim amounts.'],
    },
    exponential: {
      plainMeaning: 'Exponential models waiting time until the next event when events arrive at a steady rate.',
      whenToUse: 'Use it for positive waiting times with a constant hazard.',
      howToRead: 'lambda is the rate. Higher lambda means shorter waits on average.',
      examples: ['Time until the next customer call.', 'Time between website visits.', 'Lifetime of a part with constant failure risk.'],
    },
    gamma: {
      plainMeaning: 'Gamma models positive totals or waiting time until several events have accumulated.',
      whenToUse: 'Use it for positive, right-skewed measurements with flexible shape.',
      howToRead: 'Shape changes the curve form. Scale stretches or compresses the values.',
      examples: ['Total rainfall during a storm period.', 'Time needed to complete several service steps.', 'Total medical cost for a treatment episode.'],
    },
    beta: {
      plainMeaning: 'Beta models values between 0 and 1, especially rates, shares, and probabilities.',
      whenToUse: 'Use it for proportions or beliefs about a probability.',
      howToRead: 'Alpha pulls mass toward 1. Beta pulls mass toward 0. Together they control certainty.',
      examples: ['Conversion rate of a campaign.', 'Proportion of students satisfied with a course.', 'Prior belief about a success probability in Bayesian analysis.'],
    },
    chi_square: {
      plainMeaning: 'Chi-Square is built from squared standard Normal values, so it is always zero or positive.',
      whenToUse: 'Use it for variance questions and categorical goodness-of-fit or independence tests.',
      howToRead: 'Degrees of freedom control the shape. Larger values usually mean more mismatch or variance.',
      examples: ['Testing whether observed category counts match expected counts.', 'Testing independence between gender and preference.', 'Creating a confidence interval for a population variance.'],
    },
    student_t: {
      plainMeaning: "Student's t is like Normal but with heavier tails, especially for small samples.",
      whenToUse: 'Use it for mean inference when the population standard deviation is unknown.',
      howToRead: 'Low degrees of freedom means heavier tails. High degrees of freedom looks close to Normal.',
      examples: ['One-sample t-test for average blood pressure change.', 'Confidence interval for a small class mean.', 'Comparing two small group means with uncertain variance.'],
    },
    f: {
      plainMeaning: 'F models ratios of two variance-like quantities.',
      whenToUse: 'Use it for ANOVA, regression model tests, and variance comparisons.',
      howToRead: 'Large F means the numerator variance is large compared with the denominator variance.',
      examples: ['Testing if group means differ in ANOVA.', 'Testing whether a regression model explains useful variation.', 'Comparing variability from two measurement systems.'],
    },
    weibull: {
      plainMeaning: 'Weibull models lifetimes and failure times with changing risk over time.',
      whenToUse: 'Use it for reliability, survival, and maintenance data.',
      howToRead: 'Shape below 1 means risk decreases; near 1 means constant risk; above 1 means wear-out risk increases.',
      examples: ['Time until a machine component fails.', 'Battery lifetime under test conditions.', 'Time until a customer cancels a subscription.'],
    },
    pareto: {
      plainMeaning: 'Pareto models heavy tails where a few very large values dominate the total.',
      whenToUse: 'Use it for upper-tail size, wealth, loss, or demand concentration.',
      howToRead: 'Smaller alpha means a heavier tail and more extreme large values.',
      examples: ['Largest insurance losses.', 'Top customer spending amounts.', 'Wealth concentration in the highest-income group.'],
    },
    cauchy: {
      plainMeaning: 'Cauchy is a very heavy-tailed symmetric distribution where the mean and variance do not exist.',
      whenToUse: 'Use it to study extreme errors, robust methods, or ratio-like quantities.',
      howToRead: 'The center is meaningful, but averages can jump wildly because extreme values are common.',
      examples: ['Demonstrating why the mean can fail.', 'Robustness testing for an estimator.', 'Ratios that can explode when the denominator is near zero.'],
    },
    logistic: {
      plainMeaning: 'Logistic has a symmetric density and an S-shaped cumulative curve.',
      whenToUse: 'Use it for growth curves, latent score models, and explaining logistic regression probability links.',
      howToRead: 'mu is the center of the S-curve. s controls how quickly the curve rises.',
      examples: ['Growth of adoption over time.', 'Latent satisfaction turning into a probability.', 'Teaching how log-odds become probabilities.'],
    },
    multinomial: {
      plainMeaning: 'Multinomial counts outcomes across several categories after repeated trials.',
      whenToUse: 'Use it when each trial has one of many possible categories.',
      howToRead: 'The counts add to n, and the category probabilities add to 1.',
      examples: ['Survey responses across five choices.', 'Votes across several candidates.', 'Product purchases across multiple categories.'],
    },
    dirichlet: {
      plainMeaning: 'Dirichlet models a whole set of probabilities that must add to 1.',
      whenToUse: 'Use it for uncertainty about category shares or as a Bayesian prior for Multinomial probabilities.',
      howToRead: 'Each alpha belongs to one category. The total alpha controls how concentrated the probability vector is.',
      examples: ['Uncertainty about vote share among parties.', 'Prior belief about market share across brands.', 'Topic proportions in a document model.'],
    },
    empirical: {
      plainMeaning: 'Empirical distribution uses the observed data directly, without assuming a formula-shaped curve.',
      whenToUse: 'Use it when real data should speak for itself or when no theoretical model is trusted yet.',
      howToRead: 'The ECDF shows the fraction of observations at or below each value.',
      examples: ['Percentiles from actual student marks.', 'Observed delivery times from real orders.', 'Distribution of measured air quality values.'],
    },
  }
  return theory[id]
}

function distributionBasics(id: DistributionId) {
  const basics: Record<DistributionId, string> = {
    bernoulli: 'Start with one question that has only two possible answers: yes or no. Bernoulli is the probability model for that one question. We usually call yes a success and no a failure, but success does not always mean good; it only means the event you are counting happened. The whole distribution is controlled by one number, p. If p is 0.70, success happens 70% of the time in the long run and failure happens 30% of the time. Bernoulli is important because many bigger models are built from it. A Binomial distribution is just many Bernoulli trials counted together. Use Bernoulli when each row is one binary outcome, not when you have many categories or a measured amount.',
    binomial: 'Binomial begins with the Bernoulli idea and repeats it a fixed number of times. Imagine asking the same yes/no question n times, with the same chance of success each time. The Binomial distribution does not tell you the exact order of successes and failures; it tells you how many successes you get in total. If n is 20 and p is 0.5, it answers questions like “what is the chance of getting 12 successes?” This works best when trials are independent, meaning one trial does not change the next. It also assumes p stays the same across trials. If different people have different probabilities, or the number of trials changes by row, plain Binomial can become misleading.',
    geometric: 'Geometric is about waiting for the first success. You keep trying the same independent yes/no trial until success happens, then you stop. The random value is the trial number where the first success appears. If p is large, success usually comes quickly. If p is small, long waits become more common. A key idea is memorylessness: after several failures, the chance of success on the next independent try is still p. The past failures do not make the next trial “due.” This model is useful for attempts, retries, and first responses. It is not right when success becomes easier or harder over time, or when you care about the second or third success instead of the first.',
    negative_binomial: 'Negative Binomial is a waiting-count model like Geometric, but it waits for several successes instead of just the first one. It usually counts how many failures happen before reaching r successes. It is also very useful for real-world count data when the counts are more spread out than Poisson allows. Poisson expects the mean and variance to be about the same, but real counts often have extra variation because people, places, or time periods are different. Negative Binomial can handle that extra spread. The two key parameters are r, the success target, and p, the success probability. Use it for overdispersed counts or repeated attempts. Avoid it for continuous waiting times; those need models like Gamma or Weibull.',
    hypergeometric: 'Hypergeometric is for sampling without replacement. That means after you pick an item, it does not go back into the population. Because the population changes after each draw, the success probability also changes. This is different from Binomial, where every trial has the same p. Hypergeometric needs three basic numbers: the total population size N, the number of success items K, and the number of items drawn n. It then tells you the chance of drawing a certain number of successes. This is common in quality inspection, audits, card problems, and small finite populations. Use it when the population is known and fixed. If the population is huge or replacement happens, Binomial is often simpler and close enough.',
    poisson: 'Poisson is a model for counting events in a fixed window: a time interval, area, batch, page, or other exposure unit. The main parameter is lambda, the average number of events in that window. Poisson has a special property: the mean and variance are both lambda. That makes it simple, but also easy to misuse. It works best when events are independent, rare-ish, and happen at a roughly constant rate within comparable windows. For example, calls per hour can be Poisson if each hour is similar. If some hours are busy and others quiet, the rate is changing. If events cluster together, independence is broken. In those cases, compare with Negative Binomial or add exposure/time structure.',
    discrete_uniform: 'Discrete Uniform is the “fair integer” distribution. There is a fixed list of integer outcomes, and each one has the same probability. A fair die is the easiest example: 1, 2, 3, 4, 5, and 6 all have probability 1/6. The model is simple because shape is flat, not peaked or skewed. It is useful for random assignment, games of chance, simulation, and teaching probability. The important detail is that outcomes are separate countable values, not every decimal value between two endpoints. If a value can be 2.4 or 2.41, that is not discrete uniform. Also, if some outcomes are more likely than others, the model no longer fits.',
    continuous_uniform: 'Continuous Uniform is the flat distribution over a real interval. Any small interval of the same width has the same probability as any other small interval of that width. The probability of one exact value is zero, because there are infinitely many possible values. Probability is measured by area under the rectangle. The two parameters are the lower endpoint a and upper endpoint b. This distribution is useful when all values inside known bounds are equally plausible, or when making simple random simulations. It is not a good model just because data have a minimum and maximum. Real data often cluster, slope, or have tails. Use it only when the equal-density story makes sense.',
    normal: 'Normal is the familiar bell-shaped curve. Values are most common near the center and become less common as you move away in either direction. It is symmetric, so the left and right sides mirror each other. The center is mu, and the spread is sigma. Many averages become approximately Normal because of the Central Limit Theorem, and many measurement errors are modeled as Normal because small independent errors add together. The 68-95-99.7 rule is a helpful guide: about 68% falls within one sigma, 95% within two, and 99.7% within three. But Normal is not automatic. Strong skew, hard boundaries, extreme outliers, or heavy tails can make another distribution better.',
    standard_normal: 'Standard Normal is the Normal distribution after converting values into z-scores. A z-score tells how many standard deviations a value is from the mean. The Standard Normal always has mean 0 and standard deviation 1, so it acts like a universal reference table. If z is 0, the value is exactly average. If z is 2, it is two standard deviations above average. This makes different measurements easier to compare, because raw units are removed. Standard Normal is used for percentiles, critical values, and many approximate tests. It should not be used directly on raw data unless the data have already been standardized. Otherwise, use a Normal distribution with the real mean and standard deviation.',
    lognormal: 'Lognormal is for positive values that are formed by multiplication, growth rates, or percentage changes. On the original scale it is right-skewed: many small or middle values and a few very large ones. But if you take the logarithm of the values, the logs look Normal. This is why Lognormal appears in income, prices, file sizes, durations, and insurance losses. The median is often easier to understand than the mean, because the mean is pulled upward by large values. Lognormal cannot handle zero or negative values. If zero is a real possible outcome, you need a different model or a two-part model. Always check the log scale before trusting the fit.',
    exponential: 'Exponential models the waiting time until the next event in a process with a constant event rate. It is the waiting-time partner of the Poisson count model. If calls arrive at a steady average rate, Poisson counts calls per hour, while Exponential models the time between calls. Its key idea is memorylessness: if you have already waited five minutes, the remaining wait has the same distribution as it did at the start. This is only reasonable when the risk does not age or change over time. Exponential is useful for simple service times, arrival gaps, and lifetimes with constant hazard. If failure risk increases with age or decreases after early defects, Weibull is better.',
    gamma: 'Gamma is a flexible model for positive, right-skewed values. One way to understand it is as the total waiting time until several events happen. Exponential waits for one event; Gamma can wait for many. It also works for accumulated positive amounts such as rainfall, costs, workload, and time spent across several steps. The shape parameter controls whether the curve is very skewed or more mound-shaped. The scale parameter stretches the values. Gamma is useful when values cannot be negative and the distribution has a long right tail. It is not for data that can cross zero. It also needs enough data to estimate shape reliably, because many different positive curves can look similar in small samples.',
    beta: 'Beta is the main distribution for values between 0 and 1. That makes it useful for proportions, rates, probabilities, and shares. It is very flexible: it can be U-shaped, flat, skewed left, skewed right, or mound-shaped. The alpha parameter pulls the distribution toward 1, while beta pulls it toward 0. In Bayesian thinking, alpha and beta can act like prior success and failure information. If you observe successes, alpha increases; if you observe failures, beta increases. Beta is not for percentages written as 0 to 100 unless you first divide by 100. It also does not include exact 0 or exact 1 in its usual continuous form, so boundary values need care.',
    chi_square: 'Chi-Square is a positive distribution made by adding squared standard Normal values. Because values are squared, the distribution cannot go below zero and is usually right-skewed. The degrees of freedom tell how many squared pieces are being added. Chi-Square appears in many inference methods. In categorical tests, it measures how far observed counts are from expected counts. In variance inference, it helps test or estimate population variance. The basic reading is: larger Chi-Square often means more mismatch or more variation than expected. But raw counts are not automatically Chi-Square. They become a Chi-Square statistic only after comparing observed and expected values using the correct formula and assumptions.',
    student_t: "Student's t is like the Normal distribution but with heavier tails. The heavier tails account for extra uncertainty when the sample is small and the population standard deviation is unknown. Degrees of freedom control the tail thickness. With low degrees of freedom, extreme values are more likely than under Normal. As degrees of freedom increase, the t distribution becomes almost Normal. This distribution is central to t-tests and confidence intervals for means. It is especially useful when estimating the mean from small samples. It still assumes the data are reasonably symmetric or that the sampling distribution of the mean is acceptable. For strongly skewed data, a transformation, bootstrap, or nonparametric method may be better.",
    f: 'F is a distribution for ratios of variance-like quantities. It is always positive because variances are positive. The two degrees of freedom describe the numerator and denominator parts of the ratio. F is most common in ANOVA and regression. In ANOVA, it compares variation explained by group differences to variation left inside groups. In regression, it can test whether a model explains more than a baseline. Large F values usually mean the numerator variation is large relative to the denominator, which can signal a meaningful effect. F is not used for raw measurements directly. It is used for statistics that are constructed as variance ratios under specific assumptions.',
    weibull: 'Weibull is a lifetime and reliability distribution. It models how long something lasts before an event such as failure, cancellation, or breakdown. Its special strength is that the risk can change over time. The shape parameter explains the risk pattern. If shape is below 1, risk decreases over time, often called early failure. If shape is near 1, risk is roughly constant, like Exponential. If shape is above 1, risk increases over time, which matches aging or wear-out. Weibull is common in engineering, survival analysis, maintenance, and customer retention. It should be used when the measured variable is time-to-event or lifetime. Ordinary positive skewed amounts may be better modeled by Gamma or Lognormal.',
    pareto: 'Pareto is a heavy-tail distribution for situations where a small number of very large values dominate the total. It begins at a minimum value, often called xm, and then the tail falls slowly. The alpha parameter controls how heavy the tail is. Smaller alpha means more extreme large values. Pareto is useful for upper-tail behavior: large insurance claims, top incomes, big customers, or extreme file sizes. It is often not a model for the entire dataset, only for values above a meaningful threshold. A key warning is that moments may not exist. If alpha is too small, the mean or variance can be infinite. That changes how summaries should be interpreted.',
    cauchy: 'Cauchy is a symmetric distribution with extremely heavy tails. It looks a bit like a Normal curve near the center, but extreme values are much more common. The most important fact is that the mean and variance do not exist mathematically. This is not just a small-sample problem; averaging more Cauchy data does not settle down the way Normal averages do. The center or median can still be meaningful, but the ordinary mean can jump wildly. Cauchy is useful for teaching robustness, modeling rare extreme errors, and understanding ratio-like quantities that can explode. Do not report mean and variance as if they are stable. Use robust summaries such as median and IQR.',
    logistic: 'Logistic has a symmetric bell-like density and an S-shaped cumulative curve. The S-curve is the easiest way to understand it: values far below the center have probability near 0, values far above the center have probability near 1, and values near the center transition quickly. This makes Logistic important for growth processes and for explaining logistic regression. In logistic regression, a linear score is transformed into a probability using the logistic S-shape. The location parameter sets the center, and the scale controls how gradual or sharp the transition is. Logistic can resemble Normal but has slightly heavier tails. It is not itself a model for binary outcomes; logistic regression handles binary outcomes.',
    multinomial: 'Multinomial is the many-category version of Binomial. Instead of each trial being success or failure, each trial falls into one of several categories. After n trials, the distribution describes the count in each category. All counts must add up to n. The category probabilities must add up to 1. This creates dependence between counts: if one category gets more, at least one other category must get fewer. Multinomial is useful for surveys, voting, product choices, diagnoses, and any repeated categorical outcome. It assumes each trial has the same probability vector and trials are independent. If probabilities differ by person, time, or group, a simple Multinomial model may hide important structure.',
    dirichlet: 'Dirichlet is a distribution over probability vectors. That means it models several proportions that must all be positive and must add to 1. It is the natural partner of the Multinomial distribution in Bayesian statistics. If Multinomial models category counts, Dirichlet models uncertainty about the category probabilities before or after seeing those counts. Each alpha parameter belongs to one category. Larger alpha values put more belief in that category. The total alpha controls concentration: low total alpha allows more extreme probability vectors, while high total alpha keeps vectors closer to the average mix. Use Dirichlet for compositions, market shares, topic proportions, or category probability uncertainty, not for one isolated proportion.',
    empirical: 'Empirical distribution is the simplest data-first approach: use the observed values exactly as they are. There is no assumed formula, no smooth curve required, and no parameter story to force onto the data. The empirical CDF tells what fraction of observed values are at or below a chosen value. This is useful for percentiles, medians, outlier inspection, and understanding real shape before fitting a theoretical distribution. Empirical is honest because it only claims what was observed. Its weakness is that it cannot naturally predict beyond the data range, and it can be noisy with small samples. Use it early in analysis, then compare theoretical models only if you need smoothing, extrapolation, or explanation.',
  }
  return basics[id]
}

function distributionNumericalExamples(id: DistributionId) {
  const examples: Record<DistributionId, string[]> = {
    bernoulli: [
      'If p = 0.7, then P(success) = 0.7 and P(failure) = 1 - 0.7 = 0.3.',
      'If a machine passes one inspection with probability p = 0.95, then the chance it fails is 0.05.',
      'For p = 0.4, E[X] = p = 0.4 and Var(X) = p(1-p) = 0.4 x 0.6 = 0.24.',
    ],
    binomial: [
      'If n = 10 and p = 0.5, P(X = 3) = C(10,3)(0.5)^3(0.5)^7 = 120/1024 = 0.1172.',
      'If 20 items each have defect chance 0.02, expected defects = np = 20 x 0.02 = 0.4.',
      'If n = 8 and p = 0.25, Var(X) = np(1-p) = 8 x 0.25 x 0.75 = 1.5.',
    ],
    geometric: [
      'If p = 0.2, the expected trial for first success is E[X] = 1/p = 5.',
      'If p = 0.4, P(first success on trial 3) = (0.6)^2 x 0.4 = 0.144.',
      'If p = 0.1, P(first success after 4 trials) = P(X > 4) = (0.9)^4 = 0.6561.',
    ],
    negative_binomial: [
      'If r = 3 and p = 0.5, expected failures before 3 successes = r(1-p)/p = 3.',
      'If r = 2 and p = 0.4, P(3 failures before 2 successes) = C(4,3)(0.6)^3(0.4)^2 = 0.1382.',
      'If r = 5 and p = 0.25, Var(X) = r(1-p)/p^2 = 5 x 0.75 / 0.0625 = 60.',
    ],
    hypergeometric: [
      'From N = 20 items with K = 5 defective, draw n = 4. P(1 defective) = C(5,1)C(15,3)/C(20,4) = 0.4696.',
      'If N = 50, K = 10, n = 5, expected successes = nK/N = 5 x 10 / 50 = 1.',
      'From 10 students with 4 seniors, choose 3. P(all seniors) = C(4,3)C(6,0)/C(10,3) = 0.0333.',
    ],
    poisson: [
      'If lambda = 4 calls/hour, P(X = 2) = e^-4 x 4^2 / 2! = 0.1465.',
      'If lambda = 3, then E[X] = 3 and Var(X) = 3.',
      'If defects average 0.5 per page, P(no defects) = e^-0.5 = 0.6065.',
    ],
    discrete_uniform: [
      'For a fair die, P(X = 4) = 1/6 = 0.1667.',
      'For integers 1 to 10, P(X >= 8) = 3/10 = 0.3.',
      'For integers a = 2 to b = 6, E[X] = (2 + 6)/2 = 4.',
    ],
    continuous_uniform: [
      'If X is uniform from 0 to 10, P(3 <= X <= 7) = (7 - 3)/(10 - 0) = 0.4.',
      'For Uniform(2, 8), E[X] = (2 + 8)/2 = 5.',
      'For Uniform(0, 12), Var(X) = (12 - 0)^2/12 = 12.',
    ],
    normal: [
      'If X ~ Normal(100, 15), z for X = 130 is (130 - 100)/15 = 2.',
      'If z = 1.96 in a Normal model, the middle area is about 95%.',
      'If mu = 50 and sigma = 4, about 68% of values lie from 46 to 54.',
    ],
    standard_normal: [
      'For Z standard Normal, P(Z <= 1.96) is about 0.975.',
      'For Z standard Normal, P(Z > 1.645) is about 0.05.',
      'If a score has mean 70 and SD 10, raw 85 gives z = (85 - 70)/10 = 1.5.',
    ],
    lognormal: [
      'If ln(X) has mu = 2 and sigma = 0.5, median X = e^2 = 7.389.',
      'If mu = 1 and sigma = 0.4, mean X = exp(1 + 0.4^2/2) = exp(1.08) = 2.945.',
      'If X = 20, then log value used for fitting is ln(20) = 2.996.',
    ],
    exponential: [
      'If lambda = 0.5 per minute, expected waiting time = 1/lambda = 2 minutes.',
      'If lambda = 0.2, P(X > 5) = e^(-0.2 x 5) = e^-1 = 0.3679.',
      'If lambda = 3, P(X <= 1) = 1 - e^-3 = 0.9502.',
    ],
    gamma: [
      'If shape = 3 and scale = 2, E[X] = shape x scale = 6.',
      'If shape = 4 and scale = 1.5, Var(X) = shape x scale^2 = 4 x 2.25 = 9.',
      'If Exponential has lambda = 0.5, it is Gamma with shape = 1 and scale = 2.',
    ],
    beta: [
      'For Beta(alpha = 2, beta = 3), mean = 2/(2+3) = 0.4.',
      'For Beta(4, 4), the mean is 0.5, so the distribution is centered at one-half.',
      'With prior Beta(2, 2) and 6 successes, 4 failures, posterior = Beta(8, 6).',
    ],
    chi_square: [
      'For df = 5, E[X] = df = 5 and Var(X) = 2df = 10.',
      'If chi-square statistic = 12 with df = 4, compare it to a chi-square table to get the right-tail p-value.',
      'For sample variance s^2 = 9, n = 11, and sigma0^2 = 4, chi-square = (n-1)s^2/sigma0^2 = 22.5.',
    ],
    student_t: [
      'For n = 10, degrees of freedom for a one-sample t-test are df = n - 1 = 9.',
      'If sample mean = 52, null mean = 50, s = 4, n = 16, t = (52 - 50)/(4/sqrt(16)) = 2.',
      'For df = 20, a two-sided 95% critical t is about 2.086.',
    ],
    f: [
      'If MS_between = 18 and MS_within = 6, F = 18/6 = 3.',
      'For df1 = 2 and df2 = 27, compare the F statistic to an F table for ANOVA significance.',
      'If two sample variances are 25 and 10, an F ratio can be 25/10 = 2.5.',
    ],
    weibull: [
      'If shape k = 1, Weibull becomes Exponential with constant hazard.',
      'If scale lambda = 100 and shape k = 2, the median life is 100 x (ln 2)^(1/2) = 83.26.',
      'If k = 3, failure risk increases over time, so it suggests wear-out behavior.',
    ],
    pareto: [
      'If xm = 100 and alpha = 2, P(X > 200) = (100/200)^2 = 0.25.',
      'If xm = 10 and alpha = 3, mean = alpha xm/(alpha - 1) = 30/2 = 15.',
      'If alpha = 1.5, the mean exists but variance is infinite because alpha <= 2.',
    ],
    cauchy: [
      'For Cauchy with location x0 = 0 and scale gamma = 1, the median is 0.',
      'For standard Cauchy, P(X <= 0) = 0.5 because it is symmetric around 0.',
      'If asked for mean or variance of Cauchy, answer: undefined, not zero.',
    ],
    logistic: [
      'For logistic CDF F(x)=1/(1+e^-x), F(0)=1/(1+1)=0.5.',
      'If mu = 10 and scale s = 2, the midpoint of the S-curve is x = 10.',
      'If logit = 1.386, probability = 1/(1+e^-1.386) = 0.8.',
    ],
    multinomial: [
      'If n = 10 and probabilities are 0.2, 0.3, 0.5, expected counts are 2, 3, and 5.',
      'For n = 5 and counts (2,1,2), coefficient = 5!/(2!1!2!) = 30.',
      'If category probabilities are 0.4, 0.4, 0.2, they are valid because they sum to 1.',
    ],
    dirichlet: [
      'For Dirichlet(2, 3, 5), total alpha = 10 and expected shares are 0.2, 0.3, 0.5.',
      'If prior is Dirichlet(1,1,1) and observed counts are (4,2,3), posterior is Dirichlet(5,3,4).',
      'For alphas (10,10,10), total alpha = 30, so draws stay near equal shares.',
    ],
    empirical: [
      'For data 2, 4, 6, 8, empirical P(X <= 6) = 3/4 = 0.75.',
      'For sorted data 10, 20, 30, 40, the median is (20 + 30)/2 = 25.',
      'For data 5, 5, 7, 9, empirical P(X = 5) = 2/4 = 0.5.',
    ],
  }
  return examples[id]
}

function LearnMode({ dist, experience, params }: { dist: Distribution; experience: DistributionExperience; params: Record<string, number> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DistributionTheoryPanel dist={dist} />
      <FormulaCard dist={dist} />
      <IntuitionCard experience={experience} dist={dist} />
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-black text-slate-950 dark:text-white">How to reason about this model</h2>
        <ol className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li><strong>1. Check support:</strong> values must live in {dist.support}.</li>
          <li><strong>2. Read the parameters:</strong> {dist.params.length ? dist.params.map((param) => `${param.key} controls ${param.label}`).join('; ') : 'this distribution is fixed or data-driven'}.</li>
          <li><strong>3. Ask a probability question:</strong> left tail, right tail, between, or inverse percentile.</li>
          <li><strong>4. Fit real data:</strong> compare sample summaries with model summaries before trusting the curve.</li>
        </ol>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-black text-slate-950 dark:text-white">Current parameter meaning</h2>
        <div className="mt-3 grid gap-2">
          {dist.params.length ? dist.params.map((param) => (
            <div key={param.key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase text-slate-400">{param.key}</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{param.label}: {numberFormat(params[param.key])}</p>
            </div>
          )) : <p className="text-sm text-slate-500 dark:text-slate-400">No editable parameters on this page.</p>}
        </div>
      </section>
      <section className="grid gap-3 lg:col-span-2 md:grid-cols-3">
        <InfoStrip icon={Info} title="Assumptions" items={experience.assumptions} />
        <InfoStrip icon={AlertTriangle} title="Mistakes" items={experience.mistakes} />
        <InfoStrip icon={Layers3} title="Related" items={experience.related.map((item) => `${DISTRIBUTION_BY_ID[item.id].name}: ${item.note}`)} />
      </section>
    </div>
  )
}

function SimulateMode({ dist, experience, sampleCount, setSampleCount, simReps, setSimReps, samples, simMeans, onGenerate, onSimulateMeans, loadedData }: { dist: Distribution; experience: DistributionExperience; sampleCount: string; setSampleCount: (value: string) => void; simReps: string; setSimReps: (value: string) => void; samples: Array<number | number[]>; simMeans: number[]; onGenerate: () => void; onSimulateMeans: () => void; loadedData: number[] }) {
  const numericSamples = samples.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-black text-slate-950 dark:text-white">Random sampling simulator</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{experience.intuition}</p>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sample size
            <input value={sampleCount} onChange={(event) => setSampleCount(event.target.value)} type="number" min={1} max={5000} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </label>
          <button type="button" onClick={onGenerate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"><RefreshCw size={16} /> Generate</button>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sampling repetitions
            <input value={simReps} onChange={(event) => setSimReps(event.target.value)} type="number" min={20} max={1500} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </label>
          <button type="button" onClick={onSimulateMeans} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-700 dark:bg-slate-700"><Shuffle size={16} /> Simulate means</button>
        </div>
        {dist.id === 'empirical' && !loadedData.length && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">Empirical simulation resamples real loaded data. Load a column in Fit Data mode first.</p>}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 font-black text-slate-950 dark:text-white">Sample preview</h2>
          {numericSamples.length ? <HistogramSvg values={numericSamples} binCount={16} title={`n = ${numericSamples.length}`} /> : <VectorSamplePreview samples={samples} />}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Mean" value={numericSamples.length ? numberFormat(mean(numericSamples)) : '-'} />
            <Metric label="SD" value={numericSamples.length ? numberFormat(sd(numericSamples)) : '-'} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 font-black text-slate-950 dark:text-white">Sampling distribution</h2>
          {simMeans.length ? <HistogramSvg values={simMeans} binCount={16} title="Sample means" /> : <div className="flex min-h-[250px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-400 dark:bg-slate-950">Run simulate means</div>}
        </div>
      </section>
    </div>
  )
}

function FitDataMode({ dist, params, experience, datasets, fitDatasetId, setFitDatasetId, numericColumns, categoricalColumns, fitColumn, setFitColumn, fitValues, fitSummary, fitResult, fitComparison, onLoadData, onFitCurrent, onCompareAll, onOpenSuggestedDataset }: { dist: Distribution; params: Record<string, number>; experience: DistributionExperience; datasets: Array<{ dataset: Dataset; source: string }>; fitDatasetId: string; setFitDatasetId: (id: string) => void; numericColumns: string[]; categoricalColumns: string[]; fitColumn: string; setFitColumn: (column: string) => void; fitValues: number[]; fitSummary: FitSummary | null; fitResult: ReturnType<typeof goodnessOfFit> | null; fitComparison: ReturnType<typeof compareFits>; onLoadData: () => void; onFitCurrent: () => void; onCompareAll: () => void; onOpenSuggestedDataset: (id: string) => void }) {
  const suggestions = experience.dataSuggestions.map((id) => SAMPLE_DATASETS.find((sample) => sample.id === id)).filter(Boolean)
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-black text-slate-950 dark:text-white">Fit real data</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use loaded datasets or actual Stat Anveshak sample datasets. No invented fitting data is used.</p>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Dataset
            <select value={fitDatasetId} onChange={(event) => setFitDatasetId(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              {datasets.map(({ dataset, source }) => <option key={dataset.id} value={dataset.id}>{dataset.name} ({source})</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Numeric column
            <select value={fitColumn} onChange={(event) => setFitColumn(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              {numericColumns.length ? numericColumns.map((column) => <option key={column} value={column}>{column}</option>) : <option value="">No numeric columns</option>}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Optional grouping column
            <select className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              <option value="">No grouping</option>
              {categoricalColumns.map((column) => <option key={column} value={column}>{column}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onLoadData} disabled={!numericColumns.length} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Load</button>
            <button type="button" onClick={onFitCurrent} disabled={fitValues.length < 2} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40">Fit</button>
            <button type="button" onClick={onCompareAll} disabled={fitValues.length < 2} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-700">Compare</button>
          </div>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase text-slate-400">Compatible sample datasets</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sample) => sample && (
              <button key={sample.id} type="button" onClick={() => onOpenSuggestedDataset(sample.id)} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300">
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-black text-slate-950 dark:text-white">Real-data diagnostics</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{diagnosticLabel(dist)}</span>
          </div>
          {fitValues.length ? <FitDiagnosticVisual dist={dist} params={params} values={fitValues} /> : <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-400 dark:bg-slate-950">Load a real column to see diagnostics</div>}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Dataset n" value={fitSummary?.n ?? 0} />
          <Metric label="Missing" value={fitSummary?.missing ?? 0} />
          <Metric label="Min / Max" value={fitSummary ? `${numberFormat(fitSummary.min)} / ${numberFormat(fitSummary.max)}` : '-'} />
          <Metric label="Mean / Median" value={fitSummary ? `${numberFormat(fitSummary.mean)} / ${numberFormat(fitSummary.median)}` : '-'} />
          <Metric label="Variance" value={fitSummary ? numberFormat(fitSummary.variance) : '-'} />
          <Metric label="SD" value={fitSummary ? numberFormat(fitSummary.sd) : '-'} />
          <Metric label="Skewness" value={fitSummary ? numberFormat(fitSummary.skewness) : '-'} />
          <Metric label="Kurtosis" value={fitSummary ? numberFormat(fitSummary.kurtosis) : '-'} />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="GOF method" value={fitResult?.method ?? '-'} />
          <Metric label="Statistic" value={numberFormat(fitResult?.statistic)} />
          <Metric label="p-value" value={numberFormat(fitResult?.pValue)} />
          <Metric label="Selected model" value={dist.name} />
        </div>

        {fitComparison.length > 0 && (
          <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">Distribution</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-right">Statistic</th>
                  <th className="px-3 py-2 text-right">p-value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fitComparison.slice(0, 10).map((item, index) => (
                  <tr key={item.id} className={item.id === dist.id ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}>
                    <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                    <td className="px-3 py-2 text-slate-500">{item.method}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{numberFormat(item.statistic)}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{numberFormat(item.pValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function ProbabilityComposer({ dist, questionType, setQuestionType, x1, setX1, x2, setX2, q, setQ, probability }: { dist: Distribution; questionType: QuestionType; setQuestionType: (value: QuestionType) => void; x1: string; setX1: (value: string) => void; x2: string; setX2: (value: string) => void; q: string; setQ: (value: string) => void; probability: string }) {
  const cards: Array<{ id: QuestionType; label: string; hint: string }> = [
    { id: 'left', label: 'Left tail', hint: 'P(X <= x)' },
    { id: 'between', label: 'Between', hint: 'P(x1 <= X <= x2)' },
    { id: 'right', label: 'Right tail', hint: 'P(X >= x)' },
    { id: 'inverse', label: 'Inverse', hint: 'Find x from q' },
  ]
  return (
    <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-black text-slate-950 dark:text-white">Interactive Probability</h2>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.1fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:col-span-2">
          {cards.map((card) => (
            <button key={card.id} type="button" onClick={() => setQuestionType(card.id)} className={`rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${questionType === card.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <span className="block text-sm font-black">{card.label}</span>
              <span className="mt-1 block text-xs">{card.hint}</span>
              <TinyQuestionIcon type={card.id} />
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-sm font-black text-slate-700 dark:text-slate-200">{probabilityQuestionLabel(questionType, dist)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {questionType !== 'inverse' ? (
              <>
                <label className="text-xs font-semibold text-slate-500">x1<input value={x1} onChange={(event) => setX1(event.target.value)} type="number" className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>
                {questionType === 'between' && <label className="text-xs font-semibold text-slate-500">x2<input value={x2} onChange={(event) => setX2(event.target.value)} type="number" className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>}
              </>
            ) : (
              <label className="col-span-2 text-xs font-semibold text-slate-500">q<input value={q} onChange={(event) => setQ(event.target.value)} type="number" min={0.001} max={0.999} step={0.001} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>
            )}
          </div>
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-lg font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{probability}</div>
        </div>
      </div>
    </section>
  )
}

function FormulaCard({ dist }: { dist: Distribution }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-black text-slate-950 dark:text-white">Formula & Meaning</h2>
      <div className="mt-3 space-y-3">
        <code className="block rounded-xl bg-slate-50 p-3 text-sm font-semibold text-indigo-700 dark:bg-slate-950 dark:text-indigo-300">{dist.formula}</code>
        <code className="block rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">CDF: {dist.cdfFormula}</code>
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {dist.params.map((param) => (
          <p key={param.key}><strong>{param.key}</strong>: {param.label}</p>
        ))}
        {!dist.params.length && <p>This distribution is fixed or derives its shape from loaded data.</p>}
      </div>
    </section>
  )
}

function IntuitionCard({ experience, dist }: { experience: DistributionExperience; dist: Distribution }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-black text-slate-950 dark:text-white">Real-world intuition</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{experience.intuition}</p>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase text-slate-400">Common uses</p>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {experience.commonUses.map((item) => (
            <li key={item} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />{item}</li>
          ))}
        </ul>
      </div>
      {dist.id === 'standard_normal' && <ZConverter />}
      {dist.id === 'beta' && <BetaBayes params={{ alpha: 2, beta: 2 }} />}
    </section>
  )
}

function TryItCard({ dist, params, loadedData }: { dist: Distribution; params: Record<string, number>; loadedData: number[] }) {
  const generated = useMemo(() => generateSamples(dist, params, 100, loadedData).filter((item): item is number => typeof item === 'number' && Number.isFinite(item)), [dist, loadedData, params])
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-black text-slate-950 dark:text-white">Try it</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Instant sample preview from current parameters.</p>
      <div className="mt-3">{generated.length ? <HistogramSvg values={generated} binCount={12} title="Sample preview (n = 100)" /> : <VectorSamplePreview samples={generateSamples(dist, params, 30, loadedData)} />}</div>
    </section>
  )
}

function DistributionDepthPanel({ dist, params, loadedData, probability }: { dist: Distribution; params: Record<string, number>; loadedData: number[]; probability: string }) {
  const enhancements = distributionDepthEnhancements(dist, params, loadedData, probability)
  return (
    <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-indigo-500" />
            <h2 className="font-black text-slate-950 dark:text-white">{dist.name} specific depth</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Five high-impact distribution-specific tools now attached to this model, not a generic probability page.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">5 enhancements</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {enhancements.map((item) => {
          const tone = item.tone ?? 'indigo'
          const cardClass = tone === 'emerald'
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/25'
            : tone === 'amber'
              ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/25'
              : tone === 'rose'
                ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/25'
                : tone === 'slate'
                  ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
                  : 'border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/25'
          const valueClass = tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-300'
            : tone === 'amber' ? 'text-amber-700 dark:text-amber-300'
              : tone === 'rose' ? 'text-rose-700 dark:text-rose-300'
                : 'text-indigo-700 dark:text-indigo-300'
          return (
            <article key={item.title} className={`rounded-xl border p-3 ${cardClass}`}>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.action}</p>
              <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-white">{item.title}</h3>
              {item.value && <p className={`mt-2 text-lg font-black ${valueClass}`}>{item.value}</p>}
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function DistributionSpecificToolsPanel({ dist, params, loadedData }: { dist: Distribution; params: Record<string, number>; loadedData: number[] }) {
  const tools = distributionSpecificTools(dist, params, loadedData)
  return (
    <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={17} className="text-indigo-500" />
            <h2 className="font-black text-slate-950 dark:text-white">{dist.name} tools and calculators</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Distribution-specific helpers for approximation checks, conversions, diagnostics, and exam-style reading.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{tools.length} tools</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.title} tool={tool} />
        ))}
      </div>
    </section>
  )
}

function ToolCard({ tool }: { tool: DistributionSpecificTool }) {
  const tone = tool.tone ?? 'indigo'
  const classes = tone === 'emerald'
    ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/25'
    : tone === 'amber'
      ? 'border-amber-100 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/25'
      : tone === 'rose'
        ? 'border-rose-100 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/25'
        : tone === 'slate'
          ? 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'
          : 'border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/25'
  const outputClass = tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-300'
    : tone === 'amber' ? 'text-amber-700 dark:text-amber-300'
      : tone === 'rose' ? 'text-rose-700 dark:text-rose-300'
        : 'text-indigo-700 dark:text-indigo-300'
  return (
    <article className={`rounded-xl border p-3 ${classes}`}>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{tool.action}</p>
      <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-white">{tool.title}</h3>
      <p className={`mt-2 text-lg font-black leading-snug [overflow-wrap:anywhere] ${outputClass}`}>{tool.output}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{tool.detail}</p>
    </article>
  )
}

function distributionSpecificTools(dist: Distribution, params: Record<string, number>, loadedData: number[]): DistributionSpecificTool[] {
  const p = clamp(params.p ?? 0.5, 0.001, 0.999)
  const n = Math.max(1, Math.round(params.n ?? 10))
  const lambda = Math.max(0.001, params.lambda ?? 1)
  const mu = params.mu ?? params.x0 ?? 0
  const sigma = Math.max(0.001, params.sigma ?? params.s ?? params.gamma ?? 1)
  const df = Math.max(1, Math.round(params.df ?? 10))
  const normal = DISTRIBUTION_BY_ID.normal
  const z975 = normal.inv(0.975, { mu: 0, sigma: 1 })
  const clean = loadedData.filter(Number.isFinite).sort((a, b) => a - b)
  const empiricalMedian = clean.length ? quantile(clean, 0.5) : NaN
  const bootstrapPreview = clean.length > 4 ? bootstrapMeanPreview(clean) : null
  const p3 = Math.max(0, 1 - (params.p1 ?? 0.3) - (params.p2 ?? 0.4))
  const dirTotal = (params.a1 ?? 2) + (params.a2 ?? 3) + (params.a3 ?? 4)
  const betaTotal = (params.alpha ?? 2) + (params.beta ?? 2)
  const supportData = clean.length ? `${clean.length.toLocaleString()} loaded values` : 'Load data'

  const byId: Record<DistributionId, DistributionSpecificTool[]> = {
    bernoulli: [
      { action: 'Coding', title: '0/1 coding converter', output: `1=event, 0=non-event`, detail: 'Use this before fitting: success must be coded as 1 and failure as 0.', tone: 'emerald' },
      { action: 'Loss', title: 'Expected loss calculator', output: `loss x p = ${numberFormat(p, 3)}L`, detail: 'If one success/failure event costs L, expected loss is probability times loss.' },
      { action: 'Warning', title: 'Bernoulli vs Binomial', output: 'one trial only', detail: 'Use Binomial when you count successes across repeated trials.', tone: 'amber' },
    ],
    binomial: [
      { action: 'Approx', title: 'Normal approximation checker', output: n * p >= 10 && n * (1 - p) >= 10 ? 'ready' : 'use exact', detail: `np=${numberFormat(n * p, 2)}, n(1-p)=${numberFormat(n * (1 - p), 2)}. Both should be at least 10.`, tone: n * p >= 10 && n * (1 - p) >= 10 ? 'emerald' : 'amber' },
      { action: 'Correction', title: 'Continuity correction', output: 'k becomes k +/- 0.5', detail: 'When using Normal approximation for counts, shift boundaries by 0.5.' },
      { action: 'Table', title: 'Cumulative table cue', output: `P(X<=mean) approx ${numberFormat(cdfAtMean(dist, params), 3)}`, detail: 'Use CDF mode to read cumulative probabilities like a table.' },
    ],
    geometric: [
      { action: 'Proof', title: 'Memoryless visual proof', output: `P(wait>k)=(${numberFormat(1 - p, 2)})^k`, detail: 'After failures, the next independent trial still has success probability p.' },
      { action: 'Calculator', title: 'At least k trials', output: `P(X>4)=${numberFormat((1 - p) ** 4, 4)}`, detail: 'This answers retry or waiting-risk questions.' },
      { action: 'Simulation', title: 'Retry simulation', output: `average wait ${numberFormat(1 / p, 2)}`, detail: 'Generate samples to see trial counts jump around the expected wait.' },
    ],
    negative_binomial: [
      { action: 'Diagnostic', title: 'Overdispersion vs Poisson', output: `Var/Mean=${numberFormat(1 / p, 2)}`, detail: 'A ratio above 1 signals extra count spread compared with Poisson.', tone: p < 0.95 ? 'amber' : 'emerald' },
      { action: 'Toggle', title: 'Failures/successes reading', output: `failures before r=${Math.round(params.r ?? 5)}`, detail: 'Read X as failures before the target number of successes.' },
      { action: 'Mean', title: 'Expected failures', output: numberFormat((params.r ?? 5) * (1 - p) / p, 3), detail: 'Use r(1-p)/p to estimate the average failure count.' },
    ],
    hypergeometric: [
      { action: 'Correction', title: 'Finite population correction', output: `FPC=${numberFormat(((params.N ?? 60) - (params.n ?? 10)) / Math.max((params.N ?? 60) - 1, 1), 3)}`, detail: 'Sampling without replacement reduces variance as the sample fraction grows.' },
      { action: 'Compare', title: 'Binomial approximation', output: `p=K/N=${numberFormat((params.K ?? 20) / Math.max(params.N ?? 60, 1), 3)}`, detail: 'Binomial is close when n is tiny compared with N.' },
      { action: 'Bounds', title: 'Possible successes', output: `${Math.max(0, (params.n ?? 10) - ((params.N ?? 60) - (params.K ?? 20)))} to ${Math.min(params.n ?? 10, params.K ?? 20)}`, detail: 'Hypergeometric support depends on the finite population.' },
    ],
    poisson: [
      { action: 'Rate', title: 'Rate conversion tool', output: `2 intervals: ${numberFormat(2 * lambda, 3)}`, detail: 'For twice the exposure, multiply lambda by 2.' },
      { action: 'Exposure', title: 'Exposure adjustment', output: `half exposure: ${numberFormat(lambda / 2, 3)}`, detail: 'Counts must be compared on equal exposure windows.' },
      { action: 'Diagnostic', title: 'Poisson vs NegBin', output: 'check Var ~= Mean', detail: 'If loaded count variance is much bigger than mean, use Negative Binomial.', tone: 'amber' },
    ],
    discrete_uniform: [
      { action: 'Fairness', title: 'Observed count fairness', output: supportData, detail: 'Load observed integer outcomes and compare bars against equal probabilities.' },
      { action: 'Game', title: 'Dice/card example', output: `each=${numberFormat(1 / Math.max((params.b ?? 6) - (params.a ?? 1) + 1, 1), 3)}`, detail: 'Every integer has the same probability.' },
      { action: 'Range', title: 'Support size', output: `${Math.max(1, Math.round((params.b ?? 6) - (params.a ?? 1) + 1))} outcomes`, detail: 'More outcomes means smaller probability per integer.' },
    ],
    continuous_uniform: [
      { action: 'Area', title: 'Rectangle area calculator', output: `height=${numberFormat(1 / Math.max((params.b ?? 1) - (params.a ?? 0), 1e-9), 3)}`, detail: 'Probability is rectangle area: width times height.' },
      { action: 'Random', title: 'Random-number demo', output: `a + u(b-a)`, detail: 'A uniform random value is made by stretching a 0 to 1 random number.' },
      { action: 'Quantile', title: 'Percentile formula', output: `x=a+q(b-a)`, detail: 'Uniform percentiles move linearly across the interval.' },
    ],
    normal: [
      { action: 'Converter', title: 'Z-score converter', output: `x=mu+1sigma -> ${numberFormat(mu + sigma, 3)}`, detail: 'Convert between raw values and standard units.' },
      { action: 'Rule', title: 'Empirical rule visual', output: `[${numberFormat(mu - 2 * sigma, 2)}, ${numberFormat(mu + 2 * sigma, 2)}]`, detail: 'About 95% of a Normal curve lies inside this interval.' },
      { action: 'Finder', title: 'Percentile finder', output: `97.5%=${numberFormat(mu + z975 * sigma, 3)}`, detail: 'Uses the inverse Normal curve for percentile cutoffs.' },
      { action: 'Link', title: 'Continuity correction link', output: 'count +/- 0.5', detail: 'Use when Normal approximates a discrete count distribution.' },
    ],
    standard_normal: [
      { action: 'Lookup', title: 'Z-table style lookup', output: `Phi(1.96)=${numberFormat(normal.cdf(1.96, { mu: 0, sigma: 1 }), 3)}`, detail: 'Read cumulative area to the left of z.' },
      { action: 'Critical', title: 'Critical value calculator', output: `95% two-tail: +/-${numberFormat(z975, 3)}`, detail: 'Common cutoff for two-sided 95% intervals.' },
      { action: 'Compare', title: 'One-tail/two-tail', output: `one 5%: 1.645`, detail: 'One-tail 5% critical value is smaller than two-tail 5% split.' },
    ],
    lognormal: [
      { action: 'Preview', title: 'Log-transform preview', output: `median=e^mu=${numberFormat(Math.exp(mu), 3)}`, detail: 'Take logs to check if the transformed data look Normal.' },
      { action: 'Explain', title: 'Mean vs median vs mode', output: `mean ${numberFormat(Math.exp(mu + sigma * sigma / 2), 3)}`, detail: 'In right-skewed data, mean is usually above median.' },
      { action: 'Risk', title: 'Tail-risk calculator', output: `P(X>median)=0.5`, detail: 'The tail contains fewer observations but can dominate totals.' },
    ],
    exponential: [
      { action: 'Proof', title: 'Memoryless proof', output: `P(X>s+t|X>s)=P(X>t)`, detail: 'Remaining wait does not depend on elapsed wait.' },
      { action: 'Toggle', title: 'Hazard/survival', output: `S(mean)=${numberFormat(Math.exp(-1), 3)}`, detail: 'Survival at the mean waiting time is always e^-1.' },
      { action: 'Link', title: 'Poisson process calculator', output: `count rate lambda=${numberFormat(lambda, 3)}`, detail: 'Poisson counts and Exponential gaps describe the same steady event process.' },
    ],
    gamma: [
      { action: 'Bridge', title: 'Exponential/Erlang bridge', output: (params.shape ?? 2) === 1 ? 'Exponential' : 'multi-event wait', detail: 'Integer shape values are Erlang waiting-time models.' },
      { action: 'Preset', title: 'Shape comparison', output: (params.shape ?? 2) < 1 ? 'very skewed' : (params.shape ?? 2) < 5 ? 'right skew' : 'mound-like', detail: 'Increasing shape makes Gamma less sharply skewed.' },
      { action: 'Lab', title: 'Waiting for k events', output: `mean=${numberFormat((params.shape ?? 2) * (params.scale ?? 1), 3)}`, detail: 'Shape times scale gives expected accumulated wait.' },
    ],
    beta: [
      { action: 'Bayes', title: 'Bayesian update lab', output: `+6,+4 -> Beta(${numberFormat((params.alpha ?? 2) + 6, 1)}, ${numberFormat((params.beta ?? 2) + 4, 1)})`, detail: 'Successes add to alpha; failures add to beta.', tone: 'emerald' },
      { action: 'Prior', title: 'Prior strength slider', output: `alpha+beta=${numberFormat(betaTotal, 2)}`, detail: 'Larger total means stronger prior information.' },
      { action: 'Interval', title: 'Credible interval cue', output: `mean=${numberFormat((params.alpha ?? 2) / betaTotal, 3)}`, detail: 'Use simulation or beta quantiles for a full credible interval.' },
    ],
    chi_square: [
      { action: 'Builder', title: 'Expected vs observed table', output: 'O, E, (O-E)^2/E', detail: 'Each cell contributes to the total chi-square statistic.' },
      { action: 'DF', title: 'Degrees-of-freedom explainer', output: `df=${df}`, detail: 'For tables, df usually equals (rows-1)(columns-1).' },
      { action: 'Region', title: 'Right-tail critical region', output: 'large values reject', detail: 'Chi-square tests usually look for unusually large statistics.' },
    ],
    student_t: [
      { action: 'Compare', title: 't vs Normal by df', output: df >= 30 ? 'near Normal' : 'heavier tails', detail: 'Small df makes wider critical values.', tone: df >= 30 ? 'emerald' : 'amber' },
      { action: 'CI', title: 'Confidence interval calculator', output: `mean +/- t*SE`, detail: 'Use t critical values when sigma is estimated from data.' },
      { action: 'Warning', title: 'Small-sample panel', output: `df=${df}`, detail: 'Check symmetry and outliers carefully for small samples.' },
    ],
    f: [
      { action: 'ANOVA', title: 'ANOVA source explainer', output: `F=MS model/MS error`, detail: 'F compares explained variation against leftover variation.' },
      { action: 'Ratio', title: 'Variance-ratio calculator', output: `df1=${Math.round(params.df1 ?? 5)}, df2=${Math.round(params.df2 ?? 10)}`, detail: 'Both degrees of freedom change the curve shape.' },
      { action: 'Sensitivity', title: 'df1/df2 sensitivity', output: (params.df2 ?? 10) > 30 ? 'stable tail' : 'wide tail', detail: 'Small denominator df creates heavier right tails.' },
    ],
    weibull: [
      { action: 'Reliability', title: 'Reliability dashboard', output: `shape=${numberFormat(params.shape ?? 1.5, 2)}`, detail: 'Shape tells whether failures decrease, stay constant, or increase.' },
      { action: 'Life', title: 'B10/B50 life calculator', output: `B50=${numberFormat((params.scale ?? 1) * Math.log(2) ** (1 / Math.max(params.shape ?? 1.5, 1e-9)), 3)}`, detail: 'B50 is the median life. B10 is the 10% failure life.' },
      { action: 'Hazard', title: 'Hazard shape explainer', output: (params.shape ?? 1.5) < 1 ? 'decreasing' : (params.shape ?? 1.5) > 1 ? 'increasing' : 'constant', detail: 'This is the most important Weibull interpretation.' },
    ],
    pareto: [
      { action: '80/20', title: '80/20 calculator', output: `tail alpha=${numberFormat(params.alpha ?? 2.5, 2)}`, detail: 'Lower alpha means stronger concentration in the upper tail.' },
      { action: 'Threshold', title: 'Tail threshold selector', output: `xm=${numberFormat(params.xm ?? 1, 3)}`, detail: 'Pareto usually models values above a meaningful threshold.' },
      { action: 'Moment', title: 'Finite mean/variance warning', output: (params.alpha ?? 2.5) <= 1 ? 'mean infinite' : (params.alpha ?? 2.5) <= 2 ? 'variance infinite' : 'finite', detail: 'Moment existence changes what summaries are safe.', tone: (params.alpha ?? 2.5) <= 2 ? 'amber' : 'emerald' },
    ],
    cauchy: [
      { action: 'Simulation', title: 'Running mean instability', output: 'mean unstable', detail: 'More observations do not force the sample mean to settle.' },
      { action: 'Summary', title: 'Median/IQR emphasis', output: `center=${numberFormat(params.x0 ?? 0, 3)}`, detail: 'Use robust center and spread instead of mean and variance.' },
      { action: 'Compare', title: 'Normal comparison', output: 'heavier tails', detail: 'Extreme values are much more common than under Normal.' },
    ],
    logistic: [
      { action: 'Convert', title: 'Logit-to-probability', output: `logit 0 -> 0.5`, detail: 'Probability equals 1/(1+e^-logit).' },
      { action: 'Threshold', title: 'S-curve threshold lab', output: `midpoint=${numberFormat(params.mu ?? 0, 3)}`, detail: 'At the midpoint, cumulative probability is 0.5.' },
      { action: 'Bridge', title: 'Logistic regression bridge', output: `odds = p/(1-p)`, detail: 'This connects probability curves to log-odds models.' },
    ],
    multinomial: [
      { action: 'Editor', title: 'Category probability editor', output: `${numberFormat(params.p1 ?? 0.3, 2)}, ${numberFormat(params.p2 ?? 0.4, 2)}, ${numberFormat(p3, 2)}`, detail: 'Probabilities are normalized into category shares.' },
      { action: 'Counts', title: 'Expected counts table', output: `${numberFormat(n * (params.p1 ?? 0.3), 1)}, ${numberFormat(n * (params.p2 ?? 0.4), 1)}, ${numberFormat(n * p3, 1)}`, detail: 'Expected count equals n times category probability.' },
      { action: 'Link', title: 'Chi-square connection', output: 'observed vs expected', detail: 'Multinomial expected counts feed chi-square goodness-of-fit tests.' },
    ],
    dirichlet: [
      { action: 'Simplex', title: 'Interactive prior lab', output: `alpha0=${numberFormat(dirTotal, 2)}`, detail: 'Total alpha controls how concentrated probability vectors are.' },
      { action: 'Posterior', title: 'Update from counts', output: `+4,+2,+3`, detail: 'Observed category counts add directly to alpha values.' },
      { action: 'Mean', title: 'Expected shares', output: `${numberFormat((params.a1 ?? 2) / dirTotal, 2)}, ${numberFormat((params.a2 ?? 3) / dirTotal, 2)}, ${numberFormat((params.a3 ?? 4) / dirTotal, 2)}`, detail: 'Expected share equals alpha_i divided by alpha0.' },
    ],
    empirical: [
      { action: 'Percentile', title: 'Percentile calculator', output: clean.length ? `median=${numberFormat(empiricalMedian, 3)}` : 'Load data', detail: 'Empirical percentiles come directly from sorted observations.' },
      { action: 'Bootstrap', title: 'Bootstrap resampling', output: bootstrapPreview ? `[${numberFormat(bootstrapPreview.low, 2)}, ${numberFormat(bootstrapPreview.high, 2)}]` : 'Need 5+ values', detail: 'Bootstrap shows uncertainty by resampling observed data.' },
      { action: 'Compare', title: 'Empirical vs fitted curve', output: supportData, detail: 'Use Fit Data mode to compare the data-first shape with candidate curves.' },
    ],
  }
  return byId[dist.id]
}

function cdfAtMean(dist: Distribution, params: Record<string, number>) {
  const expected = Number(dist.expectedValue(params))
  return Number.isFinite(expected) ? dist.cdf(expected, params) : 0.5
}

function bootstrapMeanPreview(values: number[]) {
  const estimates = Array.from({ length: 120 }, (_, i) => {
    const sample = values.map((_, j) => values[(i * 17 + j * 13) % values.length])
    return mean(sample)
  }).sort((a, b) => a - b)
  return { low: quantile(estimates, 0.025), high: quantile(estimates, 0.975) }
}

function distributionDepthEnhancements(dist: Distribution, params: Record<string, number>, loadedData: number[], probability: string): DistributionDepthEnhancement[] {
  const p = clamp(params.p ?? 0.5, 0.001, 0.999)
  const n = Math.max(1, Math.round(params.n ?? 10))
  const lambda = Math.max(0.001, params.lambda ?? 1)
  const mu = params.mu ?? params.x0 ?? 0
  const sigma = Math.max(0.001, params.sigma ?? params.s ?? params.gamma ?? 1)
  const df = Math.max(1, Math.round(params.df ?? 5))
  const dataText = loadedData.length ? `${loadedData.length.toLocaleString()} values loaded` : 'Load data to activate'
  const commonTail = probability && probability !== '-' ? probability : 'Set x/q above'
  const byId: Record<DistributionId, DistributionDepthEnhancement[]> = {
    bernoulli: [
      { action: 'Outcome lab', title: 'Success/failure balance', value: `p=${numberFormat(p, 3)}`, detail: 'Use the two outcome blocks to teach event probability before aggregating trials.', tone: 'emerald' },
      { action: 'Risk check', title: 'Rare-event warning', value: p < 0.08 || p > 0.92 ? 'Extreme p' : 'Balanced enough', detail: 'Extreme probabilities need larger samples before rates feel stable.', tone: p < 0.08 || p > 0.92 ? 'amber' : 'indigo' },
      { action: 'Fit cue', title: 'Binary data fit', value: dataText, detail: 'Fit from 0/1 columns, pass/fail flags, approvals, churn, or conversion outcomes.' },
      { action: 'Bridge', title: 'Builds Binomial', value: `Var=${numberFormat(p * (1 - p), 3)}`, detail: 'Many identical Bernoulli trials become a Binomial count.' },
      { action: 'Misuse guard', title: 'Not for multi-class labels', detail: 'Use Multinomial when there are more than two mutually exclusive outcomes.', tone: 'rose' },
    ],
    binomial: [
      { action: 'Trial grid', title: 'Fixed n simulator', value: `n=${n}`, detail: 'The grid makes fixed repeated independent trials visible.' },
      { action: 'Shape cue', title: 'Normal approximation', value: n * p >= 10 && n * (1 - p) >= 10 ? 'Reasonable' : 'Weak', detail: 'Use normal approximation only when both expected successes and failures are large enough.', tone: n * p >= 10 && n * (1 - p) >= 10 ? 'emerald' : 'amber' },
      { action: 'Tail question', title: 'Exact probability area', value: commonTail, detail: 'Use the composer for exact left, right, between, and inverse questions.' },
      { action: 'Fit cue', title: 'Estimate p from counts', value: `E[X]=${numberFormat(n * p, 3)}`, detail: 'Fit needs counts out of a known maximum trial count.' },
      { action: 'Misuse guard', title: 'Requires fixed trials', detail: 'If the trial count varies by row, model proportions or use grouped binomial logic.', tone: 'rose' },
    ],
    geometric: [
      { action: 'Waiting lab', title: 'First success timing', value: `E[X]=${numberFormat(1 / p, 3)}`, detail: 'Shows how many attempts are expected until the first success.' },
      { action: 'Memoryless cue', title: 'Still same chance next try', value: `p=${numberFormat(p, 3)}`, detail: 'Past failures do not change the probability of the next independent attempt.' },
      { action: 'Tail question', title: 'Retry risk', value: commonTail, detail: 'Right-tail probabilities answer how likely long retry chains are.' },
      { action: 'Fit cue', title: 'Use attempt counts', value: dataText, detail: 'Fit from positive integer counts: attempts, calls, retries, or visits until success.' },
      { action: 'Misuse guard', title: 'Stops at first success only', detail: 'Use Negative Binomial when the process waits for several successes.', tone: 'rose' },
    ],
    negative_binomial: [
      { action: 'Overdispersion', title: 'Count variance lab', value: `Var=${numberFormat(params.r * (1 - p) / (p * p), 3)}`, detail: 'Good when count variance is bigger than the mean.' },
      { action: 'Stopping rule', title: 'Failures before r successes', value: `r=${Math.round(params.r ?? 5)}`, detail: 'The story must stop after a target number of successes.' },
      { action: 'Poisson contrast', title: 'Handles extra spread', detail: 'Compare against Poisson when event counts show clustering or heterogeneity.' },
      { action: 'Fit cue', title: 'Use non-negative counts', value: dataText, detail: 'Fit fails if variance is not larger than the mean.' },
      { action: 'Misuse guard', title: 'Not a waiting-time duration', detail: 'Use Gamma or Weibull for continuous positive durations.', tone: 'rose' },
    ],
    hypergeometric: [
      { action: 'Population lab', title: 'Without replacement', value: `N=${Math.round(params.N ?? 60)}`, detail: 'The population bubbles show why probabilities change after each draw.' },
      { action: 'Finite correction', title: 'Sampling fraction', value: `${numberFormat((params.n ?? 10) / Math.max(params.N ?? 60, 1), 2)}`, detail: 'The finite population effect matters when sample size is not tiny.' },
      { action: 'Audit use', title: 'Inspection sampling', value: `K=${Math.round(params.K ?? 20)}`, detail: 'Use when successes in the population are fixed before sampling.' },
      { action: 'Binomial contrast', title: 'Replacement matters', detail: 'Switch to Binomial when each draw has a constant success probability.' },
      { action: 'Misuse guard', title: 'Needs known population', detail: 'Avoid if population size or success count is unknown.', tone: 'rose' },
    ],
    poisson: [
      { action: 'Event timeline', title: 'Rate per interval', value: `lambda=${numberFormat(lambda, 3)}`, detail: 'The timeline links counts to a constant average event rate.' },
      { action: 'Mean-variance check', title: 'Equidispersion', value: 'Mean = variance', detail: 'If real count variance greatly exceeds mean, compare Negative Binomial.', tone: 'amber' },
      { action: 'Tail question', title: 'Capacity risk', value: commonTail, detail: 'Right tails answer overload questions such as too many calls or defects.' },
      { action: 'Fit cue', title: 'Use interval counts', value: dataText, detail: 'Rows should be comparable intervals, areas, batches, or exposures.' },
      { action: 'Misuse guard', title: 'No event dependence', detail: 'Clumped events, seasonality, or changing exposure break simple Poisson assumptions.', tone: 'rose' },
    ],
    discrete_uniform: [
      { action: 'Fairness lab', title: 'Equal integer mass', value: `${Math.round(params.a ?? 1)} to ${Math.round(params.b ?? 6)}`, detail: 'Every integer in the support should have identical probability.' },
      { action: 'Support check', title: 'Closed integer range', detail: 'Great for dice-like randomization and simple random integer generators.' },
      { action: 'Fit cue', title: 'Min/max from data', value: dataText, detail: 'Fit can infer the observed integer bounds from loaded data.' },
      { action: 'Diagnostic', title: 'Observed counts should look flat', detail: 'Use Fit Data to compare observed vs expected bars.' },
      { action: 'Misuse guard', title: 'Not continuous', detail: 'Use Continuous Uniform for measurements between two real endpoints.', tone: 'rose' },
    ],
    continuous_uniform: [
      { action: 'Area lab', title: 'Rectangle probability', value: `width=${numberFormat((params.b ?? 1) - (params.a ?? 0), 3)}`, detail: 'Probability is visible as area over the selected interval.' },
      { action: 'Quantile cue', title: 'Linear CDF', detail: 'Percentiles move at a constant speed from a to b.' },
      { action: 'Fit cue', title: 'Estimate endpoints', value: dataText, detail: 'Fit uses observed minimum and maximum as endpoints.' },
      { action: 'Diagnostic', title: 'Flat density test', detail: 'Use histogram bars to check for systematic slope or clustering.' },
      { action: 'Misuse guard', title: 'Hard bounds required', detail: 'Do not use for long-tailed or naturally unbounded measurements.', tone: 'rose' },
    ],
    normal: [
      { action: 'Sigma bands', title: '68-95-99.7 guide', value: `mu=${numberFormat(mu, 3)}`, detail: 'Vertical sigma markers are active on the density chart.' },
      { action: 'Data overlay', title: 'Histogram plus curve', value: dataText, detail: 'Loaded values overlay in green so the bell shape can be checked directly.' },
      { action: 'Tail question', title: 'Z-style probability', value: commonTail, detail: 'Use tails and inverse mode for percentile and cutoff questions.' },
      { action: 'Fit cue', title: 'Mean and SD fit', value: `sigma=${numberFormat(sigma, 3)}`, detail: 'Fit estimates center and spread from a numeric column.' },
      { action: 'Misuse guard', title: 'Watch skew and outliers', detail: 'Use Lognormal, Gamma, t, or Empirical when tails or skew dominate.', tone: 'rose' },
    ],
    standard_normal: [
      { action: 'Z table', title: 'Fixed reference curve', value: 'mu=0, sigma=1', detail: 'No parameters, so every probability is in standard deviation units.' },
      { action: 'Critical values', title: 'Inverse percentile lab', value: commonTail, detail: 'Use inverse mode to teach z critical values and percentiles.' },
      { action: 'Tail cue', title: 'Symmetric two-tail reasoning', detail: 'Left and right tails mirror around zero.' },
      { action: 'Fit cue', title: 'Standardize raw data first', value: dataText, detail: 'Use raw data only after converting values to z-scores.' },
      { action: 'Misuse guard', title: 'Not raw units', detail: 'Use Normal when the mean and SD are not 0 and 1.', tone: 'rose' },
    ],
    lognormal: [
      { action: 'Log scale cue', title: 'Multiplicative growth', value: `median=${numberFormat(Math.exp(mu), 3)}`, detail: 'The median is exp(mu); the mean is pulled right by sigma.' },
      { action: 'Tail lab', title: 'Right-skewed positive values', value: `mean=${numberFormat(Math.exp(mu + sigma * sigma / 2), 3)}`, detail: 'Use for amounts, prices, sizes, and durations made by multiplication.' },
      { action: 'Fit cue', title: 'Fit logs of positive values', value: dataText, detail: 'Zero or negative values are excluded from lognormal fitting.' },
      { action: 'Diagnostic', title: 'Compare log-normality', detail: 'Use Q-Q in Fit Data to see if logged values are roughly normal.' },
      { action: 'Misuse guard', title: 'Cannot include zero', detail: 'Use Gamma, Weibull, or Empirical when zeros are structural.', tone: 'rose' },
    ],
    exponential: [
      { action: 'Hazard lab', title: 'Constant failure rate', value: `mean=${numberFormat(1 / lambda, 3)}`, detail: 'Waiting time has the same remaining distribution after elapsed time.' },
      { action: 'Poisson link', title: 'Gaps between events', detail: 'Use with Poisson counts when events arrive independently at a constant rate.' },
      { action: 'Survival view', title: 'Reliability curve', value: `S(1/lambda)=${numberFormat(Math.exp(-1), 3)}`, detail: 'Fit Data mode shows survival diagnostics for loaded durations.' },
      { action: 'Fit cue', title: 'Positive durations only', value: dataText, detail: 'Fit estimates lambda as one divided by the sample mean.' },
      { action: 'Misuse guard', title: 'No aging effect', detail: 'Use Weibull when hazard increases or decreases over time.', tone: 'rose' },
    ],
    gamma: [
      { action: 'Shape lab', title: 'Accumulated waiting', value: `alpha=${numberFormat(params.shape ?? 2, 3)}`, detail: 'Shape controls how many waiting-time components are effectively accumulated.' },
      { action: 'Scale cue', title: 'Spread multiplier', value: `theta=${numberFormat(params.scale ?? 1, 3)}`, detail: 'Scale stretches positive values without changing the basic shape story.' },
      { action: 'Fit cue', title: 'Positive skewed data', value: dataText, detail: 'Good for rainfall, duration totals, cost amounts, and severity.' },
      { action: 'Exponential bridge', title: 'Exponential when alpha=1', detail: 'The exponential distribution is a special Gamma case.' },
      { action: 'Misuse guard', title: 'No negative values', detail: 'Use Normal or Empirical for values that can cross zero.', tone: 'rose' },
    ],
    beta: [
      { action: 'Proportion lab', title: 'Bounded 0 to 1', value: `mean=${numberFormat((params.alpha ?? 2) / ((params.alpha ?? 2) + (params.beta ?? 2)), 3)}`, detail: 'Great for rates, shares, probabilities, and Bayesian belief about a proportion.' },
      { action: 'Shape cue', title: 'U, J, flat, or mound', detail: 'Alpha and beta together determine whether mass lives near endpoints or center.' },
      { action: 'Bayes bridge', title: 'Prior plus evidence', detail: 'Successes add to alpha; failures add to beta.' },
      { action: 'Fit cue', title: 'Use fractional data', value: dataText, detail: 'Values must be strictly inside 0 and 1 for fitting.' },
      { action: 'Misuse guard', title: 'Not percentages 0 to 100', detail: 'Scale percentages to 0 to 1 before fitting.', tone: 'rose' },
    ],
    chi_square: [
      { action: 'DF lab', title: 'Squared z components', value: `df=${df}`, detail: 'Degrees of freedom count independent squared standard-normal pieces.' },
      { action: 'Inference use', title: 'GOF and variance tests', detail: 'Connect this curve to chi-square test statistics and variance inference.' },
      { action: 'Tail cue', title: 'Mostly right-tail decisions', value: commonTail, detail: 'Large chi-square values often signal mismatch or excess variance.' },
      { action: 'Fit cue', title: 'Positive skewed values', value: dataText, detail: 'Fit is rough; use domain meaning for df before trusting it.' },
      { action: 'Misuse guard', title: 'Not arbitrary counts', detail: 'Counts become chi-square only after expected-vs-observed standardization.', tone: 'rose' },
    ],
    student_t: [
      { action: 'Tail lab', title: 'Heavy tails at low df', value: `df=${df}`, detail: 'Small df gives wider tails than Normal and protects small-sample inference.' },
      { action: 'Normal bridge', title: 'Approaches Normal', value: df >= 30 ? 'Near normal' : 'Still heavy-tailed', detail: 'As df grows, the t curve becomes almost normal.', tone: df >= 30 ? 'emerald' : 'indigo' },
      { action: 'Critical values', title: 'CI and test cutoff', value: commonTail, detail: 'Use inverse mode for confidence interval and t-test thresholds.' },
      { action: 'Fit cue', title: 'Symmetric noisy data', value: dataText, detail: 'Useful when outliers are plausible but symmetry remains reasonable.' },
      { action: 'Misuse guard', title: 'Not for skew', detail: 'Use Gamma, Lognormal, or Empirical for clearly skewed positive data.', tone: 'rose' },
    ],
    f: [
      { action: 'Ratio lab', title: 'Variance ratio', value: `df1=${Math.round(params.df1 ?? 5)}, df2=${Math.round(params.df2 ?? 10)}`, detail: 'Represents one scaled chi-square divided by another.' },
      { action: 'ANOVA bridge', title: 'Model comparison', detail: 'Use for ANOVA, regression F tests, and comparing explained to unexplained variation.' },
      { action: 'Right tail', title: 'Large ratios matter', value: commonTail, detail: 'F decisions usually live in the right tail.' },
      { action: 'Fit cue', title: 'Use test statistics', value: dataText, detail: 'Raw data are not usually F-distributed unless they are variance ratios.' },
      { action: 'Misuse guard', title: 'Positive only', detail: 'Negative values and symmetric residuals do not fit an F distribution.', tone: 'rose' },
    ],
    weibull: [
      { action: 'Reliability lab', title: 'Failure-rate shape', value: (params.shape ?? 1.5) < 1 ? 'decreasing' : (params.shape ?? 1.5) > 1 ? 'increasing' : 'constant', detail: 'The hazard panel explains early failure, random failure, or wear-out.' },
      { action: 'Survival view', title: 'S(x) and h(x)', detail: 'Special survival and hazard mini charts are shown for this distribution.' },
      { action: 'Fit cue', title: 'Lifetime data', value: dataText, detail: 'Fit positive lifetimes, failure times, durations, or reliability measurements.' },
      { action: 'Exponential bridge', title: 'Shape near 1', detail: 'When shape equals 1, Weibull behaves like Exponential.' },
      { action: 'Misuse guard', title: 'Needs event-time meaning', detail: 'Do not use solely because data are positive and skewed.', tone: 'rose' },
    ],
    pareto: [
      { action: 'Tail lab', title: 'Extreme concentration', value: `alpha=${numberFormat(params.alpha ?? 2.5, 3)}`, detail: 'Lower alpha means a few large values dominate totals.' },
      { action: 'Survival view', title: 'Power-law tail', detail: 'The survival chart keeps tail risk visible rather than hiding it in the body.' },
      { action: 'Fit cue', title: 'Use exceedances', value: dataText, detail: 'Fit works best for values above a meaningful minimum threshold.' },
      { action: 'Mean guard', title: 'Moment existence', value: (params.alpha ?? 2.5) <= 1 ? 'mean infinite' : (params.alpha ?? 2.5) <= 2 ? 'variance infinite' : 'moments finite', detail: 'Moment cards warn when mean or variance is not finite.', tone: (params.alpha ?? 2.5) <= 2 ? 'amber' : 'emerald' },
      { action: 'Misuse guard', title: 'Not the whole body', detail: 'Pareto often describes only the upper tail, not small and middle values.', tone: 'rose' },
    ],
    cauchy: [
      { action: 'Instability lab', title: 'No finite mean', value: 'undefined', detail: 'The running-mean strip shows why averages do not settle down.', tone: 'amber' },
      { action: 'Normal contrast', title: 'Much heavier tails', detail: 'Overlay compares Cauchy to a normal curve with similar center and width.' },
      { action: 'Robust cue', title: 'Use median and IQR', detail: 'Summaries should focus on location and scale robust to extremes.' },
      { action: 'Fit cue', title: 'Heavy-tailed symmetric data', value: dataText, detail: 'Fit uses median and half-IQR rather than mean and SD.' },
      { action: 'Misuse guard', title: 'Never report mean/variance', detail: 'Mean and variance are mathematically undefined, not merely hard to estimate.', tone: 'rose' },
    ],
    logistic: [
      { action: 'CDF lab', title: 'S-shaped probability', value: `scale=${numberFormat(params.s ?? 1, 3)}`, detail: 'Switch to CDF mode to show the smooth probability transition.' },
      { action: 'Normal contrast', title: 'Similar center, heavier tails', detail: 'Density view overlays Logistic against Normal for comparison.' },
      { action: 'Regression bridge', title: 'Logit link intuition', detail: 'Use to explain how linear scores become probabilities.' },
      { action: 'Fit cue', title: 'Symmetric continuous data', value: dataText, detail: 'Works for symmetric data with slightly heavier tails than Normal.' },
      { action: 'Misuse guard', title: 'Not binary outcomes directly', detail: 'For binary response modelling, use logistic regression modules.', tone: 'rose' },
    ],
    multinomial: [
      { action: 'Composition lab', title: 'Category probability vector', value: `n=${n}`, detail: 'Bars and composition chart show probabilities across several categories.' },
      { action: 'Covariance cue', title: 'Counts compete', detail: 'More count in one category forces fewer counts elsewhere because totals sum to n.' },
      { action: 'Binomial bridge', title: 'First-category marginal', detail: 'The scalar chart shows X1 as a binomial marginal.' },
      { action: 'Fit cue', title: 'Use category counts', value: dataText, detail: 'Loaded numeric data are only a proxy; categorical count fitting should be explicit.' },
      { action: 'Misuse guard', title: 'Probabilities must sum to one', detail: 'Renormalize category probabilities before interpretation.', tone: 'rose' },
    ],
    dirichlet: [
      { action: 'Simplex lab', title: 'Uncertain probability vector', value: `alpha0=${numberFormat((params.a1 ?? 2) + (params.a2 ?? 3) + (params.a3 ?? 4), 3)}`, detail: 'The ternary simplex makes the probability-vector support visible.' },
      { action: 'Concentration cue', title: 'Confidence in composition', detail: 'Higher total alpha keeps draws closer to the center.' },
      { action: 'Bayes bridge', title: 'Multinomial prior', detail: 'Observed category counts add to the alpha vector.' },
      { action: 'Fit cue', title: 'Use compositions', value: dataText, detail: 'Rows should be proportions that sum to one, not independent raw columns.' },
      { action: 'Misuse guard', title: 'Not single proportions', detail: 'Use Beta for one proportion; Dirichlet is for several shares together.', tone: 'rose' },
    ],
    empirical: [
      { action: 'Data-first lab', title: 'No theoretical curve', value: dataText, detail: 'Histogram, ECDF, box, and violin come directly from observed values.' },
      { action: 'Percentile cue', title: 'Sample quantiles', value: loadedData.length ? `median=${numberFormat(quantile([...loadedData].sort((a, b) => a - b), 0.5), 3)}` : 'Load data', detail: 'Use inverse probability as an observed percentile lookup.' },
      { action: 'Outlier view', title: 'Box and rug diagnostics', detail: 'Shows actual spread and extreme values without assuming a family.' },
      { action: 'Fit bridge', title: 'Compare candidate curves', detail: 'Use Fit Data mode to rank theoretical alternatives against the empirical shape.' },
      { action: 'Misuse guard', title: 'Does not extrapolate tails', detail: 'Empirical distributions cannot predict values beyond observed data.', tone: 'rose' },
    ],
  }
  return byId[dist.id]
}

function FitDiagnosticVisual({ dist, params, values }: { dist: Distribution; params: Record<string, number>; values: number[] }) {
  if (dist.id === 'bernoulli') return <BinaryFit values={values} p={params.p ?? 0.5} />
  if (dist.family === 'discrete') return <ObservedExpectedBars dist={dist} params={params} values={values} />
  if (['weibull', 'exponential'].includes(dist.id)) return <SurvivalDashboard values={values} dist={dist} params={params} />
  if (dist.id === 'beta') return <BetaFit values={values} dist={dist} params={params} />
  if (dist.family === 'multivariate') return <CategoricalFit values={values} />
  if (dist.id === 'empirical') return <EmpiricalVisual values={values} binCount={18} />
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <HistogramSvg values={values} binCount={18} title="Histogram" />
      <QqPlot values={values} dist={dist} params={params} />
      <EcdfSvg values={values} />
      <BoxPlotSvg values={values} />
    </div>
  )
}

function IconButton({ label }: { label: string }) {
  return <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={label}><Gauge size={15} /></button>
}

function controlExpectedValue(dist: Distribution, params: Record<string, number>) {
  if (dist.id === 'dirichlet') {
    const alpha1 = params.alpha1 ?? 2
    const alpha2 = params.alpha2 ?? 3
    const alpha3 = params.alpha3 ?? 4
    const total = alpha1 + alpha2 + alpha3
    return `[${numberFormat(alpha1 / total, 2)}, ${numberFormat(alpha2 / total, 2)}, ${numberFormat(alpha3 / total, 2)}]`
  }
  if (dist.id === 'multinomial') return 'n x probability vector'
  const value = numberFormat(dist.expectedValue(params))
  return value === '-' || value.toLowerCase() === 'undefined' ? 'not defined' : value
}

function controlVarianceValue(dist: Distribution, params: Record<string, number>) {
  if (dist.id === 'dirichlet') return 'component spread'
  if (dist.id === 'multinomial') return 'covariance matrix'
  const value = numberFormat(dist.variance(params))
  return value === '-' || value.toLowerCase() === 'undefined' ? 'not defined' : value
}

function controlSupportValue(dist: Distribution) {
  if (dist.id === 'dirichlet') return 'probability simplex'
  if (dist.id === 'multinomial') return 'count vectors summing to n'
  return dist.support
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 min-w-0 text-sm font-black leading-snug text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100">{value}</p>
    </div>
  )
}

function InfoStrip({ icon: Icon, title, items }: { icon: typeof Info; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className="text-indigo-500" />
        <h2 className="text-sm font-black text-slate-900 dark:text-white">{title}</h2>
      </div>
      <ul className="space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
        {items.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </section>
  )
}

function TinyQuestionIcon({ type }: { type: QuestionType }) {
  const width = 96
  const height = 42
  const shade = type === 'left' ? 'M10 36 C25 36 30 12 48 12 L48 36 Z'
    : type === 'right' ? 'M48 36 L48 12 C66 12 71 36 86 36 Z'
      : type === 'inverse' ? 'M16 36 C26 18 36 12 48 12 C60 12 70 18 80 36'
        : 'M32 36 L32 18 C42 10 54 10 64 18 L64 36 Z'
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-10 w-full">
      <path d="M10 36 C25 36 30 12 48 12 C66 12 71 36 86 36" fill="none" stroke="#64748b" strokeWidth="2" />
      <path d={shade} fill="rgba(99,102,241,0.28)" stroke="#4f46e5" strokeWidth="1.5" />
    </svg>
  )
}

function HistogramSvg({ values, binCount, title }: { values: number[]; binCount: number; title: string }) {
  if (!values.length) return <EmptyChart label="No numeric values" />
  const bins = histogramBins(values, binCount)
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1)
  const width = 520
  const height = 260
  const left = 34
  const bottom = 34
  const barW = (width - left - 18) / bins.length
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="min-h-[250px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <text x="18" y="24" fill="#475569" fontSize="13" fontWeight="800">{title}</text>
      <line x1={left} x2={width - 18} y1={height - bottom} y2={height - bottom} stroke="#94a3b8" />
      {bins.map((bin, index) => {
        const h = (bin.count / maxCount) * (height - 72)
        return <rect key={`${bin.start}-${index}`} x={left + index * barW + 2} y={height - bottom - h} width={Math.max(4, barW - 4)} height={h} rx="4" fill={index % 2 ? '#8b5cf6' : '#6366f1'} opacity="0.86" />
      })}
      {values.slice(0, 80).map((value, index) => {
        const min = Math.min(...values)
        const max = Math.max(...values)
        const x = left + ((value - min) / Math.max(max - min, 1)) * (width - left - 18)
        return <line key={index} x1={x} x2={x} y1={height - bottom + 3} y2={height - bottom + 9} stroke="#10b981" opacity="0.5" />
      })}
    </svg>
  )
}

function EcdfSvg({ values }: { values: number[] }) {
  if (!values.length) return <EmptyChart label="No ECDF" />
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const width = 520
  const height = 260
  const px = (value: number) => 34 + ((value - min) / Math.max(max - min, 1)) * 468
  const py = (value: number) => 220 - value * 178
  const points = sorted.map((value, index) => `${px(value)},${py((index + 1) / sorted.length)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Empirical CDF" className="min-h-[250px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <text x="18" y="24" fill="#475569" fontSize="13" fontWeight="800">Empirical CDF</text>
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="3" />
    </svg>
  )
}

function BoxPlotSvg({ values }: { values: number[] }) {
  if (!values.length) return <EmptyChart label="No box plot" />
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const q1 = quantile(sorted, 0.25)
  const med = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const px = (value: number) => 46 + ((value - min) / Math.max(max - min, 1)) * 430
  return (
    <svg viewBox="0 0 520 180" role="img" aria-label="Box plot" className="min-h-[180px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <text x="18" y="24" fill="#475569" fontSize="13" fontWeight="800">Box plot</text>
      <line x1={px(min)} x2={px(max)} y1="92" y2="92" stroke="#94a3b8" strokeWidth="3" />
      <rect x={px(q1)} y="62" width={Math.max(10, px(q3) - px(q1))} height="60" rx="9" fill="#a78bfa" opacity="0.85" />
      <line x1={px(med)} x2={px(med)} y1="58" y2="126" stroke="#334155" strokeWidth="3" />
    </svg>
  )
}

function ViolinSvg({ values }: { values: number[] }) {
  if (!values.length) return <EmptyChart label="No violin" />
  const bins = histogramBins(values, 18)
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1)
  const left = bins.map((bin, index) => `${260 - (bin.count / maxCount) * 160},${30 + index * 10}`).join(' ')
  const right = [...bins].reverse().map((bin, reverseIndex) => `${260 + (bin.count / maxCount) * 160},${30 + (bins.length - 1 - reverseIndex) * 10}`).join(' ')
  return (
    <svg viewBox="0 0 520 240" role="img" aria-label="Violin plot" className="min-h-[220px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <text x="18" y="24" fill="#475569" fontSize="13" fontWeight="800">Violin / density shape</text>
      <polygon points={`${left} ${right}`} fill="rgba(16,185,129,0.35)" stroke="#10b981" strokeWidth="2" />
      <line x1="260" x2="260" y1="30" y2="205" stroke="#64748b" strokeDasharray="4 4" />
    </svg>
  )
}

function QqPlot({ values, dist, params }: { values: number[]; dist: Distribution; params: Record<string, number> }) {
  const sorted = [...values].sort((a, b) => a - b)
  const theoretical = sorted.map((_, index) => dist.inv((index + 0.5) / sorted.length, params, values)).filter(Number.isFinite)
  if (!theoretical.length) return <EmptyChart label="Q-Q plot not meaningful" />
  const minX = Math.min(...theoretical)
  const maxX = Math.max(...theoretical)
  const minY = sorted[0]
  const maxY = sorted[sorted.length - 1]
  const px = (value: number) => 38 + ((value - minX) / Math.max(maxX - minX, 1)) * 450
  const py = (value: number) => 220 - ((value - minY) / Math.max(maxY - minY, 1)) * 174
  return (
    <svg viewBox="0 0 520 260" role="img" aria-label="Q-Q plot" className="min-h-[250px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <text x="18" y="24" fill="#475569" fontSize="13" fontWeight="800">Q-Q plot</text>
      <line x1="38" y1="220" x2="488" y2="46" stroke="#94a3b8" strokeDasharray="5 5" />
      {theoretical.map((x, index) => <circle key={index} cx={px(x)} cy={py(sorted[index])} r="2.5" fill="#4f46e5" opacity="0.72" />)}
    </svg>
  )
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex min-h-[250px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400 dark:bg-slate-950">{label}</div>
}

function TrialSequence({ successes, p }: { successes: number; p: number }) {
  const seq = Array.from({ length: Math.min(18, successes + Math.max(2, Math.round((1 - p) * 8))) }, (_, index) => index >= successes + 2)
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase text-slate-400">Trial sequence simulator</p>
      <div className="flex flex-wrap gap-2">
        {seq.map((success, index) => <span key={index} className={`rounded-lg px-2 py-1 text-xs font-black ${success ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{success ? 'S' : 'F'}</span>)}
      </div>
    </div>
  )
}

function TrialGrid({ n, p }: { n: number; p: number }) {
  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="mb-2 text-xs font-bold uppercase text-slate-400">n trial grid</p>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: Math.min(n, 100) }, (_, index) => <span key={index} className={`aspect-square rounded ${((index * 37) % 100) / 100 < p ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />)}
      </div>
    </div>
  )
}

function MiniFunction({ title, dist, params, kind }: { title: string; dist: Distribution; params: Record<string, number>; kind: 'survival' | 'hazard' | 'cdf' }) {
  const [lo, hi] = dist.range(params)
  const xs = Array.from({ length: 80 }, (_, index) => lo + (index / 79) * (hi - lo))
  const ys = xs.map((x) => {
    if (kind === 'survival') return 1 - dist.cdf(x, params)
    if (kind === 'cdf') return dist.cdf(x, params)
    return dist.pdf(x, params) / Math.max(1e-9, 1 - dist.cdf(x, params))
  })
  const maxY = Math.max(...ys, 1e-9)
  const points = xs.map((_, index) => `${12 + index * 2.2},${95 - (ys[index] / maxY) * 70}`).join(' ')
  return (
    <svg viewBox="0 0 200 112" role="img" aria-label={title} className="min-h-[112px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <text x="12" y="18" fill="#475569" fontSize="12" fontWeight="800">{title}</text>
      <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="3" />
    </svg>
  )
}

function TailShareChart({ alpha }: { alpha: number }) {
  const topShare = clamp(0.2 ** (1 - 1 / Math.max(alpha, 1.01)), 0, 1)
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-sm font-black text-slate-700 dark:text-slate-200">Cumulative share</p>
      <div className="mt-4 h-7 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-gradient-to-r from-orange-400 to-rose-500" style={{ width: `${topShare * 100}%` }} /></div>
      <p className="mt-2 text-xs text-slate-500">Top-tail concentration approx {numberFormat(topShare * 100, 1)}%.</p>
    </div>
  )
}

function OverlayCurve({ primary, secondary, params, secondaryParams, labelA, labelB }: { primary: Distribution; secondary: Distribution; params: Record<string, number>; secondaryParams: Record<string, number>; labelA: string; labelB: string }) {
  const c1 = curvePoints(primary, params, 'density')
  const c2 = curvePoints(secondary, secondaryParams, 'density')
  const xs = [...c1.x, ...c2.x]
  const ys = [...c1.y, ...c2.y]
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys, 1)
  const px = (value: number) => 40 + ((value - minX) / Math.max(maxX - minX, 1)) * 700
  const py = (value: number) => 300 - (value / maxY) * 250
  const pathFor = (c: ReturnType<typeof curvePoints>) => c.x.map((x, index) => `${index ? 'L' : 'M'} ${px(x).toFixed(1)} ${py(c.y[index]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 760 330" role="img" aria-label={`${labelA} versus ${labelB}`} className="min-h-[320px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      <path d={pathFor(c2)} fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 6" />
      <path d={pathFor(c1)} fill="none" stroke="#4f46e5" strokeWidth="4" />
      <text x="50" y="28" fill="#4f46e5" fontWeight="800">{labelA}</text>
      <text x="150" y="28" fill="#64748b" fontWeight="800">{labelB}</text>
    </svg>
  )
}

function RunningMeanStrip() {
  return (
    <div className="mt-4 flex items-end gap-1">
      {Array.from({ length: 22 }, (_, index) => <span key={index} className="w-full rounded-t bg-rose-400" style={{ height: `${12 + ((index * index * 17) % 70)}px` }} />)}
    </div>
  )
}

function CompositionChart({ probs, colors }: { probs: number[]; colors: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="mb-3 text-sm font-black text-slate-700 dark:text-slate-200">Outcome composition</p>
      <div className="flex h-32 overflow-hidden rounded-xl">
        {probs.map((p, index) => <div key={index} style={{ width: `${p * 100}%`, background: colors[index] }} />)}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-xs font-bold text-slate-500">
        {probs.map((p, index) => <span key={index}>C{index + 1}: {numberFormat(p, 2)}</span>)}
      </div>
    </div>
  )
}

function BinaryFit({ values, p }: { values: number[]; p: number }) {
  const successes = values.filter((value) => value > 0).length
  const observed = successes / Math.max(values.length, 1)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <OutcomeBlock title="Observed failure" value="X = 0" probability={1 - observed} tone="slate" />
      <OutcomeBlock title="Observed success" value="X = 1" probability={observed} tone="emerald" />
      <div className="lg:col-span-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Observed p = {numberFormat(observed)} vs theoretical p = {numberFormat(p)}</p>
      </div>
    </div>
  )
}

function ObservedExpectedBars({ dist, params, values }: { dist: Distribution; params: Record<string, number>; values: number[] }) {
  const rounded = values.map(Math.round)
  const min = Math.min(...rounded)
  const max = Math.min(Math.max(...rounded), min + 25)
  const xs = Array.from({ length: max - min + 1 }, (_, index) => min + index)
  const observed = xs.map((x) => rounded.filter((value) => value === x).length)
  const expected = xs.map((x) => values.length * dist.pdf(x, params))
  const maxY = Math.max(...observed, ...expected, 1)
  return (
    <svg viewBox="0 0 760 320" role="img" aria-label="Observed versus expected count bars" className="min-h-[300px] w-full rounded-2xl bg-slate-50 dark:bg-slate-950">
      {xs.map((x, index) => {
        const baseX = 42 + index * 26
        return (
          <g key={x}>
            <rect x={baseX} y={280 - (observed[index] / maxY) * 220} width="10" height={(observed[index] / maxY) * 220} fill="#6366f1" />
            <rect x={baseX + 11} y={280 - (expected[index] / maxY) * 220} width="10" height={(expected[index] / maxY) * 220} fill="#10b981" />
          </g>
        )
      })}
      <text x="42" y="26" fill="#475569" fontWeight="800">Observed vs expected frequencies</text>
    </svg>
  )
}

function SurvivalDashboard({ values, dist, params }: { values: number[]; dist: Distribution; params: Record<string, number> }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <HistogramSvg values={values.filter((value) => value > 0)} binCount={16} title="Positive durations" />
      <MiniFunction title="Fitted survival" dist={dist} params={params} kind="survival" />
      <MiniFunction title="Fitted hazard" dist={dist} params={params} kind="hazard" />
    </div>
  )
}

function BetaFit({ values, dist, params }: { values: number[]; dist: Distribution; params: Record<string, number> }) {
  const bounded = values.filter((value) => value >= 0 && value <= 1)
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <HistogramSvg values={bounded} binCount={14} title="Bounded 0-1 values" />
      <ContinuousCurveVisual dist={dist} params={params} curveMode="density" questionType="between" x1={0.25} x2={0.75} q={0.95} loadedData={[]} />
    </div>
  )
}

function CategoricalFit({ values }: { values: number[] }) {
  const counts = new Map<number, number>()
  values.map(Math.round).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  const entries = [...counts.entries()].slice(0, 8)
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1
  return <CompositionChart probs={entries.map(([, count]) => count / total)} colors={['#6366f1', '#10b981', '#f97316', '#f43f5e', '#06b6d4', '#a855f7', '#84cc16', '#64748b']} />
}

function ZConverter() {
  const [raw, setRaw] = useState('72')
  const [mu, setMu] = useState('60')
  const [sigma, setSigma] = useState('10')
  const z = (Number(raw) - Number(mu)) / Math.max(Number(sigma), 1e-9)
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="mb-2 text-xs font-bold uppercase text-slate-400">Raw score to z</p>
      <div className="grid grid-cols-3 gap-2">
        <input value={raw} onChange={(event) => setRaw(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={mu} onChange={(event) => setMu(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={sigma} onChange={(event) => setSigma(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
      </div>
      <p className="mt-2 text-sm font-black text-indigo-600 dark:text-indigo-300">z = {numberFormat(z)}</p>
    </div>
  )
}

function BetaBayes({ params }: { params: { alpha: number; beta: number } }) {
  return <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Prior Beta({params.alpha}, {params.beta}) updates with successes and failures by adding counts to alpha and beta.</p>
}

function VectorSamplePreview({ samples }: { samples: Array<number | number[]> }) {
  const vectors = samples.filter(Array.isArray).slice(0, 12) as number[][]
  if (!vectors.length) return <EmptyChart label="Generate samples" />
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <div className="grid gap-2">
        {vectors.map((vector, index) => (
          <div key={index} className="flex h-6 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            {vector.map((value, i) => <span key={i} style={{ width: `${Math.max(4, value * 100)}%` }} className={i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-emerald-500' : 'bg-orange-500'} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

function probabilityAnswer(dist: Distribution, params: Record<string, number>, type: QuestionType, x1: number, x2: number, q: number, data: number[]) {
  if (type === 'inverse') return `x = ${numberFormat(dist.inv(clamp(q, 0.000001, 0.999999), params, data))}`
  if (!Number.isFinite(x1)) return '-'
  if (type === 'left') return `P(X <= ${numberFormat(x1)}) = ${numberFormat(dist.cdf(x1, params, data))}`
  if (type === 'right') return `P(X >= ${numberFormat(x1)}) = ${numberFormat(1 - dist.cdf(x1, params, data))}`
  if (!Number.isFinite(x2)) return '-'
  const lo = Math.min(x1, x2)
  const hi = Math.max(x1, x2)
  return `P(${numberFormat(lo)} <= X <= ${numberFormat(hi)}) = ${numberFormat(dist.cdf(hi, params, data) - dist.cdf(lo, params, data))}`
}

function probabilityQuestionLabel(type: QuestionType, dist: Distribution) {
  if (type === 'inverse') return `Find percentile for ${dist.name}`
  if (type === 'right') return 'Right-tail probability'
  if (type === 'left') return 'Left-tail probability'
  return 'Between two values'
}

function diagnosticLabel(dist: Distribution) {
  if (dist.id === 'bernoulli') return 'Binary proportions'
  if (dist.family === 'discrete') return 'Observed vs expected counts'
  if (['weibull', 'exponential'].includes(dist.id)) return 'Survival and hazard'
  if (dist.id === 'beta') return 'Bounded proportion fit'
  if (dist.family === 'multivariate') return 'Composition diagnostics'
  if (dist.id === 'empirical') return 'Empirical dashboard'
  return 'Histogram, ECDF and Q-Q'
}

function summarizeFit(values: number[], dataset: Dataset | null, column: string): FitSummary | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const m = mean(values)
  const v = variance(values)
  const sourceMissing = dataset?.schema.find((item) => item.name === column)?.missing ?? 0
  return {
    n: values.length,
    missing: sourceMissing,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: m,
    median: quantile(sorted, 0.5),
    variance: v,
    sd: Math.sqrt(Math.max(v, 0)),
    skewness: skewness(values),
    kurtosis: kurtosis(values),
  }
}

function histogramBins(values: number[], targetBins: number) {
  const clean = values.filter(Number.isFinite)
  if (!clean.length) return []
  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const width = max === min ? 1 : (max - min) / targetBins
  const bins = Array.from({ length: targetBins }, (_, index) => ({ start: min + index * width, end: min + (index + 1) * width, count: 0 }))
  clean.forEach((value) => {
    const index = Math.min(targetBins - 1, Math.max(0, Math.floor((value - min) / width)))
    bins[index].count += 1
  })
  return bins
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function variance(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1)
}

function sd(values: number[]) {
  return Math.sqrt(Math.max(variance(values), 0))
}

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const index = (sorted.length - 1) * p
  const lo = Math.floor(index)
  const hi = Math.ceil(index)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo)
}

function skewness(values: number[]) {
  const m = mean(values)
  const s = sd(values)
  if (!s) return 0
  return mean(values.map((value) => ((value - m) / s) ** 3))
}

function kurtosis(values: number[]) {
  const m = mean(values)
  const s = sd(values)
  if (!s) return 0
  return mean(values.map((value) => ((value - m) / s) ** 4)) - 3
}

function ternaryPoint(a: number, b: number, c: number) {
  const x1 = 260
  const y1 = 34
  const x2 = 50
  const y2 = 380
  const x3 = 470
  const y3 = 380
  return { x: a * x1 + b * x2 + c * x3, y: a * y1 + b * y2 + c * y3 }
}

function getExperience(dist: Distribution): DistributionExperience {
  const related = relatedFor(dist.id)
  const base: DistributionExperience = {
    visual: VISUAL_KIND_BY_ID[dist.id],
    tagline: dist.explanation,
    intuition: 'Connect the formula to a practical data-generating story before fitting it to data.',
    commonUses: ['Exploratory modelling', 'Probability questions', 'Simulation and teaching'],
    assumptions: [`Support matches ${dist.support}`, 'Observations are representative', 'Parameters have real meaning'],
    mistakes: ['Using a convenient curve without checking support', 'Ignoring tail behaviour', 'Fitting before inspecting real data'],
    related,
    dataSuggestions: SUGGESTION_IDS[dist.id] ?? [],
  }
  const overrides: Partial<Record<DistributionId, Partial<DistributionExperience>>> = {
    bernoulli: { tagline: 'One trial, two outcomes: success or failure.', intuition: 'Models a binary event where p is the long-run success rate.', commonUses: ['Pass/fail outcomes', 'Loan approval flags', 'Churn or conversion events'] },
    binomial: { tagline: 'Counts successes across a fixed number of independent trials.', intuition: 'Repeats a Bernoulli trial n times and counts how many successes occur.', commonUses: ['Campaign conversions', 'Defect counts in fixed samples', 'Exam item successes'] },
    geometric: { tagline: 'Waiting trials until the first success.', intuition: 'Shows how quickly the first success appears when each attempt has probability p.', commonUses: ['Attempts until response', 'Retries until success', 'First purchase timing'] },
    negative_binomial: { tagline: 'Failures before the target number of successes.', intuition: 'Useful when counts are more dispersed than Poisson and the process stops after r successes.', commonUses: ['Overdispersed incidents', 'Claim counts', 'Failures before milestones'] },
    hypergeometric: { tagline: 'Sampling successes from a finite population without replacement.', intuition: 'Each draw changes what remains in the population, unlike binomial sampling.', commonUses: ['Quality inspection', 'Audit samples', 'Card draws'] },
    poisson: { tagline: 'Counts independent events in a fixed interval.', intuition: 'Lambda is both the centre and spread driver for event counts.', commonUses: ['Calls per hour', 'Defects per batch', 'Accidents per day'] },
    normal: { tagline: 'The bell-shaped model for measurement error and many averages.', intuition: 'Models natural variation around a typical value, with sigma controlling spread.', commonUses: ['Heights and scores', 'Measurement errors', 'Quality measurements'] },
    standard_normal: { tagline: 'The fixed z-score reference curve with mean 0 and standard deviation 1.', intuition: 'Turns raw scores into comparable standard units.', commonUses: ['Z tables', 'Critical values', 'Percentiles'] },
    lognormal: { tagline: 'Positive values created by multiplicative growth.', intuition: 'Values are skewed on the original scale but normal after taking logs.', commonUses: ['Income', 'Transaction values', 'Claim severity'] },
    exponential: { tagline: 'Waiting time between independent events under a constant hazard.', intuition: 'The memoryless model: elapsed waiting does not change the remaining waiting distribution.', commonUses: ['Service times', 'Arrival gaps', 'Component lifetime'] },
    gamma: { tagline: 'Positive waiting time until multiple events or accumulated severity.', intuition: 'Generalizes exponential waiting time by changing shape.', commonUses: ['Rainfall', 'Durations', 'Severity amounts'] },
    beta: { tagline: 'Flexible distribution for rates and proportions between 0 and 1.', intuition: 'Alpha and beta shape prior belief or observed variation in a proportion.', commonUses: ['Conversion rates', 'Satisfaction proportions', 'Bayesian priors'] },
    chi_square: { tagline: 'Right-skewed distribution of summed squared standard normal variables.', intuition: 'Degrees of freedom count how many squared components are added.', commonUses: ['Goodness-of-fit', 'Independence tests', 'Variance inference'] },
    student_t: { tagline: 'Normal-like curve with heavier tails controlled by degrees of freedom.', intuition: 'Protects mean inference when sigma is estimated from smaller samples.', commonUses: ['t-tests', 'Confidence intervals', 'Small-sample means'] },
    f: { tagline: 'Distribution of variance ratios.', intuition: 'Compares explained and unexplained variation through a positive right-skewed ratio.', commonUses: ['ANOVA', 'Regression F-tests', 'Variance comparison'] },
    weibull: { tagline: 'Reliability model with decreasing, constant, or increasing hazard.', intuition: 'Shape reveals infant mortality, random failure, or wear-out behaviour.', commonUses: ['Product lifetime', 'Machine failure', 'Maintenance planning'] },
    pareto: { tagline: 'Heavy-tailed model for concentration and large extremes.', intuition: 'A few very large values can dominate totals.', commonUses: ['Wealth', 'Insurance losses', 'Demand concentration'] },
    cauchy: { tagline: 'Heavy-tailed symmetric model where mean and variance do not exist.', intuition: 'Extreme observations make averages unstable.', commonUses: ['Robustness demos', 'Heavy-tailed errors', 'Ratio phenomena'] },
    logistic: { tagline: 'Symmetric density with an S-shaped CDF.', intuition: 'Often appears in growth and latent-variable logistic models.', commonUses: ['Growth processes', 'Logistic regression errors', 'Quantile models'] },
    multinomial: { tagline: 'Counts across multiple categories in repeated categorical draws.', intuition: 'Generalizes binomial from two outcomes to several outcomes.', commonUses: ['Survey choices', 'Product categories', 'Election preferences'] },
    dirichlet: { tagline: 'Distribution over probability vectors whose entries sum to one.', intuition: 'Models uncertainty about category probabilities.', commonUses: ['Composition data', 'Bayesian multinomial priors', 'Market shares'] },
    empirical: { tagline: 'A distribution defined entirely by real observed data.', intuition: 'No theoretical curve is assumed unless you compare one in Fit Data mode.', commonUses: ['Any numeric dataset', 'Percentiles', 'Outlier and shape exploration'] },
  }
  return { ...base, ...overrides[dist.id] }
}

function relatedFor(id: DistributionId): Array<{ id: DistributionId; note: string }> {
  if (['bernoulli', 'binomial'].includes(id)) return [{ id: 'binomial', note: 'Many Bernoulli trials' }, { id: 'hypergeometric', note: 'Without replacement' }]
  if (['poisson', 'exponential', 'gamma'].includes(id)) return [{ id: 'exponential', note: 'Waiting time' }, { id: 'gamma', note: 'Multiple waits' }]
  if (['normal', 'standard_normal', 'student_t', 'logistic'].includes(id)) return [{ id: 'student_t', note: 'Heavier tails' }, { id: 'logistic', note: 'S-shaped CDF' }]
  if (['weibull', 'pareto', 'lognormal'].includes(id)) return [{ id: 'lognormal', note: 'Multiplicative' }, { id: 'weibull', note: 'Reliability' }]
  if (['beta', 'dirichlet', 'multinomial'].includes(id)) return [{ id: 'beta', note: 'One proportion' }, { id: 'dirichlet', note: 'Many proportions' }]
  return [{ id: 'normal', note: 'Baseline comparison' }, { id: 'empirical', note: 'Use real data' }]
}
