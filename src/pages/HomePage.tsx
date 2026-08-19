import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  BarChart2,
  Calculator,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  Grid2X2,
  HelpCircle,
  LineChart,
  List,
  MessageSquareText,
  Pin,
  PlayCircle,
  Search,
  ShieldCheck,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
  Wand2,
  X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { SAMPLE_DATASETS } from '../lib/sampleData'
import { sampleToDataset } from '../lib/dataset'
import { saveDataset } from '../lib/storage'
import type { Dataset, Project, SampleDataset } from '../types'

type HomeMode = 'overview' | 'datasets' | 'guided' | 'recent'
type DatasetSort = 'popular' | 'name' | 'rows' | 'columns'
type DatasetView = 'grid' | 'list'
type GuideKey = 'descriptive' | 'inferential' | 'exploratory' | 'predictive'
type Tone = 'indigo' | 'emerald' | 'violet' | 'orange' | 'sky' | 'rose'

type RecentPage = {
  path: string
  label: string
}

type DatasetProfile = {
  missing: number
  numeric: number
  categorical: number
}

const HOME_MODES: Array<{ id: HomeMode; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'guided', label: 'Guided Analysis' },
  { id: 'recent', label: 'Recent Work' },
]

const QUICK_ACTIONS: Array<{ icon: LucideIcon; title: string; description: string; to: string; tone: Tone }> = [
  { icon: Upload, title: 'Import Data', description: 'CSV, Excel, JSON and TXT', to: '/data/upload', tone: 'indigo' },
  { icon: Sigma, title: 'Explore Statistics', description: 'Descriptive summaries', to: '/explore/summary', tone: 'emerald' },
  { icon: BarChart2, title: 'Create Visualization', description: 'Charts and dashboards', to: '/explore/charts', tone: 'violet' },
  { icon: Activity, title: 'Run a Test', description: 'Hypothesis testing', to: '/inference', tone: 'orange' },
]

const METHOD_CARDS: Array<{
  key: GuideKey
  icon: LucideIcon
  title: string
  question: string
  techniques: string
  variables: string
  to: string
  tone: Tone
}> = [
  { key: 'descriptive', icon: BarChart2, title: 'Summary Statistics', question: 'Describe your data with key measures.', techniques: 'Mean, median, spread, frequency', variables: 'Any numeric or categorical fields', to: '/explore/summary', tone: 'indigo' },
  { key: 'inferential', icon: Sigma, title: 'Compare Groups', question: 'Test differences between two or more groups.', techniques: 't-test, ANOVA, chi-square', variables: 'Outcome plus grouping field', to: '/inference', tone: 'sky' },
  { key: 'exploratory', icon: Sparkles, title: 'Relationships', question: 'Explore relationships between variables.', techniques: 'Correlation, scatterplots, heatmaps', variables: 'Two or more numeric fields', to: '/explore/correlation', tone: 'violet' },
  { key: 'predictive', icon: LineChart, title: 'Predict Outcomes', question: 'Build models to make predictions.', techniques: 'Regression, diagnostics, forecasting', variables: 'Target and predictor fields', to: '/regression', tone: 'orange' },
  { key: 'exploratory', icon: Activity, title: 'Distribution Analysis', question: 'Understand shape, tails, and probability.', techniques: 'PDF, CDF, simulation, GoF', variables: 'Numeric field or parameters', to: '/distributions', tone: 'emerald' },
  { key: 'predictive', icon: Clock, title: 'Time-Series Analysis', question: 'Track trends and seasonality over time.', techniques: 'Trend, decomposition, forecast', variables: 'Date or time plus numeric value', to: '/stat-modules/time_series_basics', tone: 'rose' },
]

const PINNED_TOOL_OPTIONS: Array<{ label: string; path: string; icon: LucideIcon; tone: Tone }> = [
  { label: 'Descriptive Statistics', path: '/explore/summary', icon: Sigma, tone: 'emerald' },
  { label: 'Correlation Matrix', path: '/explore/correlation', icon: Grid2X2, tone: 'violet' },
  { label: 'Hypothesis Tests', path: '/inference', icon: Activity, tone: 'rose' },
  { label: 'Regression Analysis', path: '/regression', icon: LineChart, tone: 'indigo' },
  { label: 'Distributions', path: '/distributions', icon: Calculator, tone: 'orange' },
  { label: 'Charts', path: '/explore/charts', icon: BarChart2, tone: 'sky' },
]

const toneClasses: Record<Tone, { icon: string; soft: string; border: string; gradient: string }> = {
  indigo: { icon: 'bg-indigo-600 text-white', soft: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', gradient: 'from-indigo-500 to-violet-500' },
  emerald: { icon: 'bg-emerald-500 text-white', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', gradient: 'from-emerald-400 to-teal-500' },
  violet: { icon: 'bg-violet-500 text-white', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', gradient: 'from-violet-500 to-fuchsia-500' },
  orange: { icon: 'bg-orange-500 text-white', soft: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', gradient: 'from-orange-400 to-amber-500' },
  sky: { icon: 'bg-sky-500 text-white', soft: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800', gradient: 'from-sky-400 to-cyan-500' },
  rose: { icon: 'bg-rose-500 text-white', soft: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', gradient: 'from-rose-400 to-pink-500' },
}

export function HomePage() {
  const {
    activeDataset,
    datasets,
    projects,
    setActiveDataset,
    addDataset,
    favoriteModules,
    toggleFavoriteModule,
    analysisHistory,
  } = useStore()
  const [mode, setMode] = useState<HomeMode>('overview')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<DatasetSort>('popular')
  const [datasetView, setDatasetView] = useState<DatasetView>('grid')
  const [page, setPage] = useState(1)
  const [guideKey, setGuideKey] = useState<GuideKey>('descriptive')
  const navigate = useNavigate()

  const recentPages = readRecentPages()
  const categories = useMemo(() => ['All', ...Array.from(new Set(SAMPLE_DATASETS.map((sample) => sample.category))).sort()], [])
  const datasetStats = useMemo(() => getDatasetProfile(activeDataset), [activeDataset])
  const previewDataset = useMemo(() => activeDataset ?? sampleToDataset(SAMPLE_DATASETS[0]), [activeDataset])

  const filteredSamples = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const samples = SAMPLE_DATASETS.filter((sample) => {
      const categoryMatch = selectedCategory === 'All' || sample.category === selectedCategory
      const queryMatch = !normalizedQuery
        || sample.name.toLowerCase().includes(normalizedQuery)
        || sample.description.toLowerCase().includes(normalizedQuery)
        || sample.category.toLowerCase().includes(normalizedQuery)
        || sample.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      return categoryMatch && queryMatch
    })

    return [...samples].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'rows') return b.data.length - a.data.length
      if (sortBy === 'columns') return getColumnNames(b).length - getColumnNames(a).length
      return b.tags.length - a.tags.length || b.data.length - a.data.length
    })
  }, [query, selectedCategory, sortBy])

  const pageSize = datasetView === 'grid' ? 6 : 8
  const pageCount = Math.max(1, Math.ceil(filteredSamples.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pagedSamples = filteredSamples.slice((safePage - 1) * pageSize, safePage * pageSize)

  const loadSample = async (id: string, target = '/data/preview') => {
    const sample = SAMPLE_DATASETS.find((item) => item.id === id)
    if (!sample) return
    const ds = sampleToDataset(sample)
    addDataset(ds)
    setActiveDataset(ds)
    await saveDataset(ds)
    navigate(target)
  }

  const openDataset = (dataset: Dataset, target = '/data/preview') => {
    setActiveDataset(dataset)
    navigate(target)
  }

  const resetFilters = () => {
    setQuery('')
    setSelectedCategory('All')
    setSortBy('popular')
    setPage(1)
  }

  return (
    <main className="min-w-0 bg-slate-50/70 px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <HomeModeTabs mode={mode} setMode={setMode} />

        {mode === 'overview' && (
          <OverviewMode
            activeDataset={activeDataset}
            datasets={datasets}
            projects={projects}
            recentPages={recentPages}
            previewDataset={previewDataset}
            datasetStats={datasetStats}
            onOpenDataset={openDataset}
            onLoadSample={() => loadSample(SAMPLE_DATASETS[0].id)}
            setMode={setMode}
          />
        )}

        {mode === 'datasets' && (
          <DatasetLibraryMode
            categories={categories}
            query={query}
            setQuery={(value) => {
              setQuery(value)
              setPage(1)
            }}
            selectedCategory={selectedCategory}
            setSelectedCategory={(value) => {
              setSelectedCategory(value)
              setPage(1)
            }}
            sortBy={sortBy}
            setSortBy={setSortBy}
            datasetView={datasetView}
            setDatasetView={setDatasetView}
            samples={pagedSamples}
            totalMatches={filteredSamples.length}
            page={safePage}
            pageCount={pageCount}
            setPage={setPage}
            resetFilters={resetFilters}
            onLoadSample={loadSample}
          />
        )}

        {mode === 'guided' && (
          <GuidedAnalysisMode
            guideKey={guideKey}
            setGuideKey={setGuideKey}
            hasDataset={Boolean(activeDataset)}
            onLoadSample={() => loadSample(SAMPLE_DATASETS[0].id)}
          />
        )}

        {mode === 'recent' && (
          <RecentWorkMode
            datasets={datasets}
            projects={projects}
            recentPages={recentPages}
            favoriteModules={favoriteModules}
            toggleFavoriteModule={toggleFavoriteModule}
            analysisCount={analysisHistory.length}
            previewDataset={previewDataset}
            onOpenDataset={openDataset}
            onLoadSample={() => loadSample(SAMPLE_DATASETS[0].id)}
          />
        )}
      </div>
    </main>
  )
}

function HomeModeTabs({ mode, setMode }: { mode: HomeMode; setMode: (mode: HomeMode) => void }) {
  return (
    <nav aria-label="Home page modes" className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:min-w-0">
        {HOME_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
              mode === item.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

function OverviewMode({
  activeDataset,
  datasets,
  projects,
  recentPages,
  previewDataset,
  datasetStats,
  onOpenDataset,
  onLoadSample,
  setMode,
}: {
  activeDataset: Dataset | null
  datasets: Dataset[]
  projects: Project[]
  recentPages: RecentPage[]
  previewDataset: Dataset
  datasetStats: DatasetProfile
  onOpenDataset: (dataset: Dataset, target?: string) => void
  onLoadSample: () => void
  setMode: (mode: HomeMode) => void
}) {
  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Stat <span className="text-indigo-600 dark:text-indigo-400">Anveshak</span>
            </h1>
            <p className="mt-1 text-base font-bold text-slate-700 dark:text-slate-300">Statistics Studio</p>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <ShieldCheck size={16} className="text-indigo-500" />
            Your data stays on your device.
          </p>
        </div>
        <WorkspaceStatus activeDataset={activeDataset} datasetCount={datasets.length} />
      </section>

      {activeDataset && <LoadedDatasetPanel dataset={activeDataset} profile={datasetStats} onOpenDataset={onOpenDataset} />}

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => <QuickActionCard key={action.to} {...action} />)}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <RecentWorkPanel projects={projects} datasets={datasets} recentPages={recentPages} onOpenDataset={onOpenDataset} onLoadSample={onLoadSample} />
        <InsightPreview dataset={previewDataset} labelledAsSample={!activeDataset} />
      </div>

      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Open the dataset studio</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Search all {SAMPLE_DATASETS.length} sample datasets in a compact card library.</p>
          </div>
          <button type="button" onClick={() => setMode('datasets')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950">
            Browse datasets <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </>
  )
}

function WorkspaceStatus({ activeDataset, datasetCount }: { activeDataset: Dataset | null; datasetCount: number }) {
  const items = [
    { icon: CheckCircle2, label: 'Workspace status', value: 'Ready' },
    { icon: Database, label: 'Loaded datasets', value: `${datasetCount} loaded` },
    { icon: Clock, label: 'Last activity', value: activeDataset ? relativeTime(activeDataset.createdAt) : '-' },
    { icon: ShieldCheck, label: 'Mode', value: 'Browser only' },
  ]

  return (
    <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <Icon size={17} />
          </span>
          <span>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
            <span className="block text-sm font-black text-slate-900 dark:text-white">{value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function QuickActionCard({ icon: Icon, title, description, to, tone }: { icon: LucideIcon; title: string; description: string; to: string; tone: Tone }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:focus:ring-offset-slate-950"
    >
      <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone].icon} shadow-sm`}>
        <Icon size={23} />
      </span>
      <span className="block text-base font-black text-slate-950 dark:text-white">{title}</span>
      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span>
    </Link>
  )
}

function RecentWorkPanel({
  datasets,
  recentPages,
  onOpenDataset,
  onLoadSample,
}: {
  projects: Project[]
  datasets: Dataset[]
  recentPages: RecentPage[]
  onOpenDataset: (dataset: Dataset) => void
  onLoadSample: () => void
}) {
  const rows = datasets.slice(0, 3)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="continue-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="continue-heading" className="text-base font-black text-slate-950 dark:text-white">Continue your work</h2>
        <Link to="/projects" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">View all projects</Link>
      </div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((dataset) => (
            <button
              key={dataset.id}
              type="button"
              onClick={() => onOpenDataset(dataset)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                <Database size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{dataset.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{dataset.sourceType.toUpperCase()} · {relativeTime(dataset.createdAt)}</span>
              </span>
              <MiniHistogram dataset={dataset} className="hidden w-24 sm:block" />
              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700">Open</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <HomeEmptyState
            icon={Database}
            title="No recent datasets yet"
            description="Import a file or open a sample dataset to begin analysis."
            primaryLabel="Open sample dataset"
            onPrimary={onLoadSample}
            secondaryLabel="Import data"
            secondaryTo="/data/upload"
          />
          {recentPages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentPages.slice(0, 4).map((item) => (
                <Link key={item.path} to={item.path} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function InsightPreview({ dataset, labelledAsSample }: { dataset: Dataset; labelledAsSample: boolean }) {
  const numeric = firstNumericColumn(dataset)
  const values = numeric ? numericValues(dataset, numeric.name) : []
  const stats = values.length ? summarize(values) : null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="insight-heading">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="insight-heading" className="text-base font-black text-slate-950 dark:text-white">Statistical insight preview</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{labelledAsSample ? 'Sample dataset' : 'Loaded dataset'}: {dataset.name}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">n = {dataset.rows.toLocaleString()}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(170px,0.65fr)]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
          {values.length ? <HistogramChart values={values} label={numeric?.name ?? 'Value'} /> : <ChartEmpty label="No numeric column available" />}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-1">
          <Metric label="Mean" value={stats ? formatNumber(stats.mean) : '-'} detail={stats ? `95% CI ${formatNumber(stats.ciLow)}, ${formatNumber(stats.ciHigh)}` : undefined} />
          <Metric label="Std. deviation" value={stats ? formatNumber(stats.sd) : '-'} />
          <Metric label="Median" value={stats ? formatNumber(stats.median) : '-'} />
          <Metric label="Skewness" value={stats ? formatNumber(stats.skewness) : '-'} />
        </dl>
      </div>
      <Link to="/explore/summary" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
        Open full analysis <ArrowRight size={15} />
      </Link>
    </section>
  )
}

function LoadedDatasetPanel({ dataset, profile, onOpenDataset }: { dataset: Dataset; profile: DatasetProfile; onOpenDataset: (dataset: Dataset, target?: string) => void }) {
  const recommendations = getRecommendations(profile)

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20" aria-label="Loaded dataset">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Loaded dataset</p>
          <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{dataset.name}</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <StatPill label="Rows" value={dataset.rows.toLocaleString()} />
            <StatPill label="Columns" value={dataset.cols.toLocaleString()} />
            <StatPill label="Missing" value={profile.missing.toLocaleString()} />
            <StatPill label="Numeric" value={profile.numeric.toLocaleString()} />
            <StatPill label="Categorical" value={profile.categorical.toLocaleString()} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recommendations.map((item) => (
              <Link key={item.to} to={item.to} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-900">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button type="button" onClick={() => onOpenDataset(dataset, '/data/grid')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Data Grid</button>
          <button type="button" onClick={() => onOpenDataset(dataset, '/data/clean')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">Clean & Transform</button>
          <button type="button" onClick={() => onOpenDataset(dataset, '/explore/summary')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">Summary</button>
          <button type="button" onClick={() => onOpenDataset(dataset, '/explore/charts')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">Create Chart</button>
        </div>
      </div>
    </section>
  )
}

function DatasetLibraryMode({
  categories,
  query,
  setQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  datasetView,
  setDatasetView,
  samples,
  totalMatches,
  page,
  pageCount,
  setPage,
  resetFilters,
  onLoadSample,
}: {
  categories: string[]
  query: string
  setQuery: (value: string) => void
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  sortBy: DatasetSort
  setSortBy: (value: DatasetSort) => void
  datasetView: DatasetView
  setDatasetView: (value: DatasetView) => void
  samples: SampleDataset[]
  totalMatches: number
  page: number
  pageCount: number
  setPage: (value: number) => void
  resetFilters: () => void
  onLoadSample: (id: string) => void
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Explore Sample Datasets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open a dataset to start exploring and generating insights.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{totalMatches} matching datasets</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search datasets by name, topic, or method</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search datasets by name, topic, or keyword..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-950"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <span className="sr-only">Sort datasets</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as DatasetSort)} className="bg-transparent text-sm font-semibold text-slate-700 outline-none dark:text-slate-200">
            <option value="popular">Sort by: Popular</option>
            <option value="name">Sort by: Name</option>
            <option value="rows">Sort by: Rows</option>
            <option value="columns">Sort by: Columns</option>
          </select>
        </label>
        <div className="flex min-h-11 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950" aria-label="Dataset view">
          <button type="button" onClick={() => setDatasetView('grid')} className={`flex w-10 items-center justify-center rounded-lg ${datasetView === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`} aria-label="Grid view"><Grid2X2 size={16} /></button>
          <button type="button" onClick={() => setDatasetView('list')} className={`flex w-10 items-center justify-center rounded-lg ${datasetView === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`} aria-label="List view"><List size={16} /></button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`min-h-10 shrink-0 rounded-xl border px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              selectedCategory === category
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {category}
          </button>
        ))}
        {(query || selectedCategory !== 'All' || sortBy !== 'popular') && (
          <button type="button" onClick={resetFilters} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            <Filter size={15} /> Clear filters
          </button>
        )}
      </div>

      {samples.length ? (
        <div className={`mt-5 grid gap-4 ${datasetView === 'grid' ? 'lg:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1'}`}>
          {samples.map((sample, index) => (
            <DatasetCard key={sample.id} sample={sample} compact={datasetView === 'list'} chartVariant={index % 5} onLoadSample={onLoadSample} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <HomeEmptyState icon={Search} title="No datasets match these filters" description="Try a broader keyword or clear the selected category." primaryLabel="Clear filters" onPrimary={resetFilters} secondaryLabel="Import data" secondaryTo="/data/upload" />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Showing page {page} of {pageCount}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Previous</button>
          {Array.from({ length: Math.min(pageCount, 7) }, (_, index) => index + 1).map((item) => (
            <button key={item} type="button" onClick={() => setPage(item)} className={`h-10 w-10 rounded-xl text-sm font-bold ${item === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item}</button>
          ))}
          <button type="button" onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Next</button>
        </div>
      </div>
    </section>
  )
}

function DatasetCard({ sample, compact, chartVariant, onLoadSample }: { sample: SampleDataset; compact: boolean; chartVariant: number; onLoadSample: (id: string) => void }) {
  const columns = getColumnNames(sample)
  const numericColumn = columns.find((column) => sample.data.some((row) => typeof row[column] === 'number'))
  const values = numericColumn ? sample.data.map((row) => Number(row[numericColumn])).filter(Number.isFinite) : []

  return (
    <article className={`group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 ${compact ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]' : ''}`}>
      <div className="min-w-0">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-950 dark:text-white">{sample.name}</h2>
            <p className="mt-1 max-h-10 overflow-hidden text-sm text-slate-500 dark:text-slate-400">{sample.description}</p>
          </div>
          <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-slate-800" aria-label={`Pin ${sample.name}`}>
            <Pin size={15} />
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{sample.category}</span>
          {sample.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>
          ))}
        </div>
      </div>
      <div className={`${compact ? '' : 'mb-4'} rounded-2xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/60`}>
        <DatasetPreviewChart values={values} variant={chartVariant} label={numericColumn ?? sample.name} />
      </div>
      <div className={`${compact ? 'self-end' : ''}`}>
        <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 text-center dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          <StatCell label="Rows" value={sample.data.length.toLocaleString()} />
          <StatCell label="Columns" value={columns.length.toLocaleString()} />
          <StatCell label="Type" value="CSV" />
        </div>
        <button
          type="button"
          onClick={() => onLoadSample(sample.id)}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        >
          Open dataset
        </button>
      </div>
    </article>
  )
}

function GuidedAnalysisMode({ guideKey, setGuideKey, hasDataset, onLoadSample }: { guideKey: GuideKey; setGuideKey: (key: GuideKey) => void; hasDataset: boolean; onLoadSample: () => void }) {
  const steps = [
    { icon: Database, title: 'Choose Data', text: hasDataset ? 'Dataset is ready for analysis.' : 'Select or import a dataset to begin.', done: hasDataset, to: '/data/upload' },
    { icon: MessageSquareText, title: 'Ask a Question', text: 'Define what you want to learn or test.', done: false, to: '/professional-learning' },
    { icon: Sigma, title: 'Select a Method', text: 'Pick the right statistical method.', done: false, to: '/inference' },
    { icon: BarChart2, title: 'See Results', text: 'Understand results with clear insights.', done: false, to: '/reports' },
  ]

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">What would you like to discover?</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Follow a simple path to get answers from your data.</p>
        <div className="mt-5 grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_210px]">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Link key={step.title} to={step.to} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20">
                <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${step.done || index === 0 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>{index + 1}</span>
                <Icon size={28} className="mb-4 text-indigo-500" />
                <h2 className="font-black text-slate-950 dark:text-white">{step.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.text}</p>
              </Link>
            )
          })}
          <MethodGuide guideKey={guideKey} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-black text-slate-950 dark:text-white">Recommended methods</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {METHOD_CARDS.map((method) => (
            <AnalysisMethodCard key={method.title} method={method} active={guideKey === method.key} onSelect={() => setGuideKey(method.key)} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Starting options">
        <StartOption icon={PlayCircle} title="Start with a tutorial" text="Step-by-step guides for common analyses." to="/learn" />
        <StartOption icon={Wand2} title="Use the Wizard" text="Answer a few questions and get a method suggestion." to="/professional-learning" />
        <StartOption icon={HelpCircle} title="Ask an example question" text="Open a sample dataset and explore common questions." onClick={onLoadSample} />
      </section>
    </>
  )
}

function AnalysisMethodCard({ method, active, onSelect }: { method: typeof METHOD_CARDS[number]; active: boolean; onSelect: () => void }) {
  const Icon = method.icon
  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm transition dark:bg-slate-950 ${active ? `${toneClasses[method.tone].border} ring-2 ring-indigo-100 dark:ring-indigo-950` : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[method.tone].soft}`}><Icon size={19} /></span>
        <button type="button" onClick={onSelect} className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950">Guide</button>
      </div>
      <h3 className="font-black text-slate-950 dark:text-white">{method.title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{method.question}</p>
      <dl className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div><dt className="font-black uppercase text-slate-400">Techniques</dt><dd>{method.techniques}</dd></div>
        <div><dt className="font-black uppercase text-slate-400">Variables</dt><dd>{method.variables}</dd></div>
      </dl>
      <Link to={method.to} className={`mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl text-sm font-black ${toneClasses[method.tone].soft} hover:brightness-95`}>
        Open tool
      </Link>
    </article>
  )
}

function MethodGuide({ guideKey }: { guideKey: GuideKey }) {
  const guide = {
    descriptive: { title: 'Descriptive', text: 'Summarize and understand your data before making claims.', route: '/explore/summary' },
    inferential: { title: 'Inferential', text: 'Test conclusions about populations using sample evidence.', route: '/inference' },
    exploratory: { title: 'Exploratory', text: 'Find patterns, relationships, clusters, and unusual values.', route: '/explore/charts' },
    predictive: { title: 'Predictive', text: 'Build models and evaluate how well they predict outcomes.', route: '/regression' },
  }[guideKey]

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Method guide</p>
      <h2 className="mt-2 font-black text-slate-950 dark:text-white">{guide.title}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{guide.text}</p>
      <Link to={guide.route} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">Open guide <ArrowRight size={15} /></Link>
    </aside>
  )
}

function RecentWorkMode({
  datasets,
  projects,
  recentPages,
  favoriteModules,
  toggleFavoriteModule,
  analysisCount,
  previewDataset,
  onOpenDataset,
  onLoadSample,
}: {
  datasets: Dataset[]
  projects: Project[]
  recentPages: RecentPage[]
  favoriteModules: string[]
  toggleFavoriteModule: (path: string) => void
  analysisCount: number
  previewDataset: Dataset
  onOpenDataset: (dataset: Dataset, target?: string) => void
  onLoadSample: () => void
}) {
  return (
    <>
      <WorkspaceMetrics projectCount={projects.length} datasetCount={SAMPLE_DATASETS.length} loadedDatasetCount={datasets.length} analysisCount={analysisCount} testsRun={analysisCount} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <RecentProjects projects={projects} datasets={datasets} recentPages={recentPages} onOpenDataset={onOpenDataset} />
        <PinnedTools favoriteModules={favoriteModules} toggleFavoriteModule={toggleFavoriteModule} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InsightDashboard dataset={previewDataset} />
        <LearningProgress />
      </div>
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-sm dark:border-indigo-900 dark:from-indigo-950/30 dark:via-slate-900 dark:to-violet-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-black text-slate-950 dark:text-white">Start new analysis</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Import data or open a sample dataset to begin a new analysis.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/data/upload" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"><Upload size={16} /> Import data</Link>
            <button type="button" onClick={onLoadSample} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-50 dark:bg-slate-950 dark:text-indigo-300 dark:ring-indigo-900">Open sample dataset</button>
          </div>
        </div>
      </section>
    </>
  )
}

function WorkspaceMetrics({ projectCount, datasetCount, loadedDatasetCount, analysisCount, testsRun }: { projectCount: number; datasetCount: number; loadedDatasetCount: number; analysisCount: number; testsRun: number }) {
  const metrics: Array<{ icon: LucideIcon; label: string; value: number; detail: string; tone: Tone }> = [
    { icon: Database, label: 'Projects', value: projectCount, detail: 'Open projects', tone: 'indigo' },
    { icon: Database, label: 'Datasets', value: datasetCount, detail: `${loadedDatasetCount} loaded`, tone: 'emerald' },
    { icon: BarChart2, label: 'Analyses', value: analysisCount, detail: 'This browser', tone: 'violet' },
    { icon: Target, label: 'Tests Run', value: testsRun, detail: 'This browser', tone: 'orange' },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">Your Statistics Workspace</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Continue recent projects or explore insights from your data.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ icon: Icon, label, value, detail, tone }) => (
          <div key={label} className={`rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:from-slate-950 dark:to-slate-900 ${toneClasses[tone].border}`}>
            <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone].soft}`}><Icon size={18} /></span>
            <span className="block text-2xl font-black text-slate-950 dark:text-white">{value}</span>
            <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{detail}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecentProjects({ datasets, recentPages, onOpenDataset }: { projects: Project[]; datasets: Dataset[]; recentPages: RecentPage[]; onOpenDataset: (dataset: Dataset, target?: string) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 font-black text-slate-950 dark:text-white">Recent projects</h2>
      {datasets.length ? (
        <div className="space-y-3">
          {datasets.slice(0, 4).map((dataset) => (
            <button key={dataset.id} type="button" onClick={() => onOpenDataset(dataset)} className="grid w-full gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-indigo-200 hover:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-[minmax(0,1fr)_130px_auto]">
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950 dark:text-white">{dataset.name}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{dataset.sourceType.toUpperCase()}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{relativeTime(dataset.createdAt)}</span>
                </span>
              </span>
              <MiniHistogram dataset={dataset} />
              <span className="self-center rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700">Open</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <HomeEmptyState icon={Clock} title="No saved work yet" description="Your recent projects and datasets will appear here after you load data." primaryLabel="Import data" primaryTo="/data/upload" secondaryLabel="Open samples" secondaryTo="/data/preview" />
          {recentPages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentPages.slice(0, 5).map((item) => (
                <Link key={item.path} to={item.path} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300">{item.label}</Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function PinnedTools({ favoriteModules, toggleFavoriteModule }: { favoriteModules: string[]; toggleFavoriteModule: (path: string) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 font-black text-slate-950 dark:text-white">Pinned tools</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PINNED_TOOL_OPTIONS.map((tool) => {
          const pinned = favoriteModules.includes(tool.path)
          const Icon = tool.icon
          return (
            <div key={tool.path} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tool.tone].soft}`}><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <Link to={tool.path} className="block truncate text-sm font-black text-slate-950 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300">{tool.label}</Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quick workspace access</p>
                </div>
                <button type="button" onClick={() => toggleFavoriteModule(tool.path)} className={`flex h-8 w-8 items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${pinned ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800'}`} aria-label={`${pinned ? 'Unpin' : 'Pin'} ${tool.label}`}>
                  <Pin size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function InsightDashboard({ dataset }: { dataset: Dataset }) {
  const numericColumns = dataset.schema.filter((column) => column.type === 'numeric')
  const first = numericColumns[0]?.name
  const second = numericColumns[1]?.name
  const values = first ? numericValues(dataset, first) : []
  const secondValues = second ? numericValues(dataset, second).slice(0, values.length) : []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 font-black text-slate-950 dark:text-white">Insight preview</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
          <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">Distribution</p>
          <HistogramChart values={values} label={first ?? 'Value'} compact />
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
          <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">Relationship</p>
          <ScatterChart x={values} y={secondValues.length ? secondValues : values.map((value, index) => value + index * 0.18)} />
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
          <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">Groups</p>
          <BoxPreview values={values} />
        </div>
      </div>
    </section>
  )
}

function LearningProgress() {
  const progress: Array<{ label: string; value: number; tone: Tone }> = [
    { label: 'Descriptive Statistics', value: 67, tone: 'emerald' },
    { label: 'Inferential Tests', value: 50, tone: 'sky' },
    { label: 'Regression Analysis', value: 40, tone: 'violet' },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 font-black text-slate-950 dark:text-white">Learning progress</h2>
      <div className="space-y-4">
        {progress.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="text-xs font-bold text-slate-500">{item.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-full rounded-full bg-gradient-to-r ${toneClasses[item.tone].gradient}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Link to="/learn" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">Continue learning <ArrowRight size={15} /></Link>
    </section>
  )
}

function HomeEmptyState({
  icon: Icon,
  title,
  description,
  primaryLabel,
  primaryTo,
  onPrimary,
  secondaryLabel,
  secondaryTo,
}: {
  icon: LucideIcon
  title: string
  description: string
  primaryLabel: string
  primaryTo?: string
  onPrimary?: () => void
  secondaryLabel?: string
  secondaryTo?: string
}) {
  const primaryClass = 'inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-950/50">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700"><Icon size={22} /></span>
      <h3 className="mt-3 font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {primaryTo ? <Link to={primaryTo} className={primaryClass}>{primaryLabel}</Link> : <button type="button" onClick={onPrimary} className={primaryClass}>{primaryLabel}</button>}
        {secondaryLabel && secondaryTo && <Link to={secondaryTo} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">{secondaryLabel}</Link>}
      </div>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</dd>
      {detail && <dd className="text-xs text-slate-500 dark:text-slate-400">{detail}</dd>}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100 dark:bg-slate-900 dark:ring-emerald-900">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="block font-black text-slate-900 dark:text-white">{value}</span>
    </span>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="px-2 py-2">
      <span className="block text-[0.68rem] font-bold uppercase text-slate-400">{label}</span>
      <span className="block text-xs font-black text-slate-800 dark:text-slate-100">{value}</span>
    </span>
  )
}

function StartOption({ icon: Icon, title, text, to, onClick }: { icon: LucideIcon; title: string; text: string; to?: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><Icon size={18} /></span>
      <span>
        <span className="block font-black text-slate-950 dark:text-white">{title}</span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{text}</span>
      </span>
    </>
  )
  const className = 'flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20'
  return to ? <Link to={to} className={className}>{content}</Link> : <button type="button" onClick={onClick} className={className}>{content}</button>
}

function DatasetPreviewChart({ values, variant, label }: { values: number[]; variant: number; label: string }) {
  if (!values.length) return <ChartEmpty label="Categorical preview" />
  if (variant === 1) return <ScatterChart x={values.slice(0, 60)} y={values.slice(0, 60).map((value, index) => value + Math.sin(index / 4) * 5)} />
  if (variant === 2) return <DonutPreview values={values} />
  if (variant === 3) return <LinePreview values={values} />
  if (variant === 4) return <BoxPreview values={values} />
  return <HistogramChart values={values} label={label} compact />
}

function HistogramChart({ values, label, compact = false }: { values: number[]; label: string; compact?: boolean }) {
  if (!values.length) return <ChartEmpty label="No numeric values" />
  const bins = buildBins(values, compact ? 14 : 18)
  const max = Math.max(...bins.map((bin) => bin.count), 1)
  const height = compact ? 92 : 180
  const width = 420
  const barWidth = width / bins.length
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Histogram of ${label}`} className="h-full min-h-[92px] w-full">
      <rect width={width} height={height} rx="16" fill="transparent" />
      {bins.map((bin, index) => {
        const barHeight = Math.max(4, (bin.count / max) * (height - 24))
        return <rect key={`${bin.start}-${index}`} x={index * barWidth + 3} y={height - barHeight - 8} width={Math.max(4, barWidth - 6)} height={barHeight} rx="4" fill={index % 2 ? '#8b5cf6' : '#6366f1'} opacity={0.9} />
      })}
      {!compact && <text x="12" y="18" fill="#64748b" fontSize="12" fontWeight="700">{label}</text>}
    </svg>
  )
}

function MiniHistogram({ dataset, className = 'w-28' }: { dataset: Dataset; className?: string }) {
  const column = firstNumericColumn(dataset)
  const values = column ? numericValues(dataset, column.name) : []
  return <div className={className}>{values.length ? <HistogramChart values={values} label={column?.name ?? 'value'} compact /> : <ChartEmpty label="No chart" />}</div>
}

function ScatterChart({ x, y }: { x: number[]; y: number[] }) {
  const pairs = x.slice(0, 80).map((value, index) => [value, y[index] ?? value] as const)
  if (!pairs.length) return <ChartEmpty label="No numeric pair" />
  const xs = pairs.map(([value]) => value)
  const ys = pairs.map(([, value]) => value)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const sx = (value: number) => 16 + ((value - minX) / Math.max(maxX - minX, 1)) * 188
  const sy = (value: number) => 102 - ((value - minY) / Math.max(maxY - minY, 1)) * 82

  return (
    <svg viewBox="0 0 220 112" role="img" aria-label="Scatterplot preview" className="h-full min-h-[92px] w-full">
      <line x1="16" y1="102" x2="210" y2="102" stroke="#cbd5e1" />
      <line x1="16" y1="14" x2="16" y2="102" stroke="#cbd5e1" />
      <line x1="22" y1="94" x2="204" y2="24" stroke="#60a5fa" strokeWidth="2" opacity="0.75" />
      {pairs.map(([px, py], index) => <circle key={`${px}-${py}-${index}`} cx={sx(px)} cy={sy(py)} r="2.4" fill={index % 3 === 0 ? '#10b981' : index % 3 === 1 ? '#6366f1' : '#f97316'} opacity="0.82" />)}
    </svg>
  )
}

function DonutPreview({ values }: { values: number[] }) {
  const total = values.slice(0, 4).reduce((sum, value) => sum + Math.abs(value), 0) || 1
  const parts = values.slice(0, 4).map((value) => Math.max(0.05, Math.abs(value) / total))
  const segments = parts.map((part, index) => ({
    part,
    start: parts.slice(0, index).reduce((sum, value) => sum + value, 0),
  }))
  const colors = ['#6366f1', '#10b981', '#f97316', '#f43f5e']
  return (
    <svg viewBox="0 0 220 112" role="img" aria-label="Donut chart preview" className="h-full min-h-[92px] w-full">
      {segments.map(({ part, start }, index) => {
        return <circle key={`${part}-${index}`} cx="110" cy="56" r="34" fill="none" stroke={colors[index]} strokeWidth="18" strokeDasharray={`${part * 214} 214`} strokeDashoffset={-start * 214} transform="rotate(-90 110 56)" />
      })}
      <circle cx="110" cy="56" r="22" fill="white" />
    </svg>
  )
}

function LinePreview({ values }: { values: number[] }) {
  const points = values.slice(0, 30)
  if (!points.length) return <ChartEmpty label="No line preview" />
  const min = Math.min(...points)
  const max = Math.max(...points)
  const d = points.map((value, index) => {
    const x = 12 + (index / Math.max(points.length - 1, 1)) * 196
    const y = 98 - ((value - min) / Math.max(max - min, 1)) * 78
    return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 220 112" role="img" aria-label="Line chart preview" className="h-full min-h-[92px] w-full">
      <path d={d} fill="none" stroke="#22c55e" strokeWidth="3" />
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" transform="translate(0 -8)" opacity="0.7" />
    </svg>
  )
}

function BoxPreview({ values }: { values: number[] }) {
  if (!values.length) return <ChartEmpty label="No box plot" />
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const scale = (value: number) => 14 + ((value - min) / Math.max(max - min, 1)) * 192
  return (
    <svg viewBox="0 0 220 112" role="img" aria-label="Box plot preview" className="h-full min-h-[92px] w-full">
      {[34, 56, 78].map((y, index) => (
        <g key={y}>
          <line x1={scale(min)} y1={y} x2={scale(max)} y2={y} stroke="#94a3b8" strokeWidth="2" />
          <rect x={scale(q1)} y={y - 13} width={Math.max(8, scale(q3) - scale(q1))} height="26" rx="5" fill={['#34d399', '#a78bfa', '#fb7185'][index]} opacity="0.82" />
          <line x1={scale(median)} y1={y - 13} x2={scale(median)} y2={y + 13} stroke="#334155" strokeWidth="2" />
        </g>
      ))}
    </svg>
  )
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex min-h-[92px] items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      {label}
    </div>
  )
}

function getDatasetProfile(dataset: Dataset | null): DatasetProfile {
  if (!dataset) return { missing: 0, numeric: 0, categorical: 0 }
  return {
    missing: dataset.schema.reduce((sum, column) => sum + column.missing, 0),
    numeric: dataset.schema.filter((column) => column.type === 'numeric').length,
    categorical: dataset.schema.filter((column) => column.type === 'categorical' || column.type === 'boolean' || column.type === 'text').length,
  }
}

function getRecommendations(profile: DatasetProfile) {
  const items = [{ label: 'Summary Statistics', to: '/explore/summary' }]
  if (profile.numeric >= 2) items.push({ label: 'Correlation', to: '/explore/correlation' }, { label: 'Regression', to: '/regression' })
  if (profile.categorical >= 1) items.push({ label: 'Frequency Tables', to: '/explore/frequency' })
  if (profile.numeric >= 1) items.push({ label: 'Create Chart', to: '/explore/charts' })
  return items.slice(0, 5)
}

function getColumnNames(sample: SampleDataset) {
  return Object.keys(sample.data[0] ?? {})
}

function firstNumericColumn(dataset: Dataset) {
  return dataset.schema.find((column) => column.type === 'numeric' && !/(^id$|_id$|id$)/i.test(column.name))
    ?? dataset.schema.find((column) => column.type === 'numeric')
}

function numericValues(dataset: Dataset, column: string) {
  return dataset.data.map((row) => Number(row[column])).filter(Number.isFinite)
}

function buildBins(values: number[], count: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = Math.max((max - min) / count, Number.EPSILON)
  const bins = Array.from({ length: count }, (_, index) => ({ start: min + index * width, count: 0 }))
  values.forEach((value) => {
    const index = Math.min(count - 1, Math.max(0, Math.floor((value - min) / width)))
    bins[index].count += 1
  })
  return bins
}

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1)
  const sd = Math.sqrt(variance)
  const median = quantile(sorted, 0.5)
  const skewness = values.reduce((sum, value) => sum + ((value - mean) / Math.max(sd, Number.EPSILON)) ** 3, 0) / values.length
  const margin = 1.96 * sd / Math.sqrt(values.length)
  return { mean, sd, median, skewness, ciLow: mean - margin, ciHigh: mean + margin }
}

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
}

function relativeTime(time: number) {
  const diff = Date.now() - time
  const minute = 60_000
  const hour = minute * 60
  const day = hour * 24
  if (diff < minute) return 'Just now'
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`
  return `${Math.floor(diff / day)} days ago`
}

function readRecentPages() {
  try {
    const value = JSON.parse(localStorage.getItem('anveshak-recent-pages') ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is RecentPage => typeof item?.path === 'string' && typeof item?.label === 'string') : []
  } catch {
    return []
  }
}
