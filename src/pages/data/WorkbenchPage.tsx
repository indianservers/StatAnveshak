import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Combine,
  Database,
  FileText,
  Filter,
  FunctionSquare,
  GitBranch,
  GraduationCap,
  ListChecks,
  RefreshCw,
  Search,
  Sigma,
  Table2,
  Undo2,
  Upload,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../../components/ui/toastContext'
import {
  addComputedColumn,
  binColumn,
  createAnalysisLog,
  crosstab,
  diagnoseDataQuality,
  filterRows,
  frequencyTableDetailed,
  groupedDescriptiveStats,
  inferVariableMetadata,
  joinDatasets,
  labelEncodeColumn,
  normalityDiagnostics,
  recodeColumn,
  recommendAnalysis,
  type AnalysisLogEntry,
} from '../../lib/workbench'
import { numericColumn } from '../../lib/stats'
import type { Dataset } from '../../types'

type Tab = 'wizard' | 'variables' | 'dictionary' | 'quality' | 'transform' | 'statistics' | 'log'

const tabs: { id: Tab; label: string; icon: typeof Sigma }[] = [
  { id: 'wizard', label: 'Analysis Wizard', icon: GraduationCap },
  { id: 'variables', label: 'Variable View', icon: Table2 },
  { id: 'dictionary', label: 'Dictionary', icon: BookOpen },
  { id: 'quality', label: 'Quality', icon: ListChecks },
  { id: 'transform', label: 'Transform', icon: FunctionSquare },
  { id: 'statistics', label: 'Statistics', icon: Calculator },
  { id: 'log', label: 'Analysis Log', icon: FileText },
]

const format = (value: number | string | null) => typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : value ?? '-'

export function WorkbenchPage() {
  const { activeDataset, datasets, setActiveDataset, updateDataset } = useStore()
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('wizard')
  const [query, setQuery] = useState('')
  const [goal, setGoal] = useState('compare')
  const [outcome, setOutcome] = useState('')
  const [predictor, setPredictor] = useState('')
  const [filterColumn, setFilterColumn] = useState('')
  const [filterOperator, setFilterOperator] = useState<'equals' | 'contains' | 'gt' | 'lt'>('equals')
  const [filterValue, setFilterValue] = useState('')
  const [sourceColumn, setSourceColumn] = useState('')
  const [newColumn, setNewColumn] = useState('')
  const [operation, setOperation] = useState<'zscore' | 'log' | 'sqrt' | 'standardize'>('zscore')
  const [recodeFrom, setRecodeFrom] = useState('')
  const [recodeTo, setRecodeTo] = useState('')
  const [rightDatasetId, setRightDatasetId] = useState('')
  const [rightKey, setRightKey] = useState('')
  const [history, setHistory] = useState<Dataset[]>([])
  const [future, setFuture] = useState<Dataset[]>([])
  const [log, setLog] = useState<AnalysisLogEntry[]>([
    createAnalysisLog('Opened workbench', 'Started a reproducible analysis session.'),
  ])

  const variables = useMemo(() => activeDataset ? inferVariableMetadata(activeDataset) : [], [activeDataset])
  const issues = useMemo(() => activeDataset ? diagnoseDataQuality(activeDataset) : [], [activeDataset])
  const filteredVariables = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? variables.filter((item) => [item.name, item.label, item.detectedType, item.measure, item.role].join(' ').toLowerCase().includes(q)) : variables
  }, [query, variables])

  const numericCols = activeDataset?.schema.filter((column) => column.type === 'numeric').map((column) => column.name) ?? []
  const categoricalCols = activeDataset?.schema.filter((column) => ['categorical', 'boolean', 'text'].includes(column.type)).map((column) => column.name) ?? []
  const allCols = activeDataset?.schema.map((column) => column.name) ?? []
  const selectedOutcome = activeDataset?.schema.find((column) => column.name === (outcome || allCols[0]))
  const selectedPredictor = activeDataset?.schema.find((column) => column.name === (predictor || allCols.find((name) => name !== selectedOutcome?.name)))
  const recommendation = recommendAnalysis(goal, selectedOutcome, selectedPredictor)
  const grouped = activeDataset && numericCols[0] && categoricalCols[0] ? groupedDescriptiveStats(activeDataset, numericCols[0], categoricalCols[0]) : []
  const frequencies = activeDataset && categoricalCols[0] ? frequencyTableDetailed(activeDataset, categoricalCols[0]).slice(0, 10) : []
  const cross = activeDataset && categoricalCols.length >= 2 ? crosstab(activeDataset, categoricalCols[0], categoricalCols[1]) : null
  const normality = activeDataset && numericCols[0] ? normalityDiagnostics(numericColumn(activeDataset.data, numericCols[0])) : null

  const applyDataset = (nextDataset: Dataset, action: string, detail: string) => {
    if (!activeDataset) return
    setHistory((items) => [activeDataset, ...items].slice(0, 20))
    setFuture([])
    updateDataset(nextDataset)
    setActiveDataset(nextDataset)
    setLog((items) => [createAnalysisLog(action, detail), ...items])
    notify(detail, 'success')
  }

  const undo = () => {
    if (!activeDataset || history.length === 0) return
    const [previous, ...rest] = history
    setHistory(rest)
    setFuture((items) => [activeDataset, ...items])
    updateDataset(previous)
    setActiveDataset(previous)
    setLog((items) => [createAnalysisLog('Undo', `Restored ${previous.name} to previous state.`), ...items])
  }

  const redo = () => {
    if (!activeDataset || future.length === 0) return
    const [next, ...rest] = future
    setFuture(rest)
    setHistory((items) => [activeDataset, ...items])
    updateDataset(next)
    setActiveDataset(next)
    setLog((items) => [createAnalysisLog('Redo', `Reapplied ${next.parseDetails ?? 'last transformation'}.`), ...items])
  }

  if (!activeDataset) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Database size={22} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Statistics Workbench</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            SPSS-style variable view, data dictionary, quality checks, transforms, and guided analysis for {activeDataset.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={undo} disabled={history.length === 0} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Undo2 size={14} />
            Undo
          </button>
          <button onClick={redo} disabled={future.length === 0} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <RefreshCw size={14} />
            Redo
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['Rows', activeDataset.rows.toLocaleString()],
          ['Columns', activeDataset.cols],
          ['Datasets in project', datasets.length],
          ['Quality issues', issues.filter((issue) => issue.title !== 'No major issues').length],
          ['Log entries', log.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 overflow-auto">
        <div className="flex min-w-max gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                tab === id
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'wizard' && (
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Guided Analysis Wizard</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="What do you want to do?">
                <select value={goal} onChange={(event) => setGoal(event.target.value)} className="input-select">
                  <option value="summarize">Summarize</option>
                  <option value="compare">Compare groups</option>
                  <option value="predict">Predict</option>
                  <option value="test">Test a hypothesis</option>
                </select>
              </Field>
              <Field label="Outcome variable">
                <select value={outcome || allCols[0]} onChange={(event) => setOutcome(event.target.value)} className="input-select">
                  {allCols.map((column) => <option key={column}>{column}</option>)}
                </select>
              </Field>
              <Field label="Predictor/group">
                <select value={predictor || allCols[1] || allCols[0]} onChange={(event) => setPredictor(event.target.value)} className="input-select">
                  {allCols.map((column) => <option key={column}>{column}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
              <p className="text-xs font-semibold text-indigo-500">Recommended method</p>
              <p className="mt-1 text-xl font-bold text-indigo-800 dark:text-indigo-100">{recommendation.method}</p>
              {recommendation.warning && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{recommendation.warning}</p>}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Mistake Warnings</h2>
            {issues.slice(0, 5).map((issue) => <IssueRow key={`${issue.column}-${issue.title}`} issue={issue} />)}
          </div>
        </section>
      )}

      {tab === 'variables' && (
        <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">SPSS-Style Variable View</h2>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search variables" className="rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            </div>
          </div>
          <VariableTable rows={filteredVariables} />
        </section>
      )}

      {tab === 'dictionary' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredVariables.map((variable) => (
            <div key={variable.name} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{variable.label}</h3>
                  <p className="text-xs text-slate-400">{variable.name}</p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-200">{variable.detectedType}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{variable.notes}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Meta label="Measure" value={variable.measure} />
                <Meta label="Role" value={variable.role} />
                <Meta label="Confidence" value={`${variable.typeConfidence}%`} />
                <Meta label="Missing" value={variable.missingRule} />
              </div>
              {variable.valueLabels && <p className="mt-3 text-xs text-slate-500">Value labels: {variable.valueLabels}</p>}
            </div>
          ))}
        </section>
      )}

      {tab === 'quality' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Data Quality Diagnosis</h2>
            <div className="space-y-3">
              {issues.map((issue, index) => <IssueRow key={`${issue.column}-${issue.title}-${index}`} issue={issue} />)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Normality Check: {numericCols[0] ?? 'No numeric column'}</h2>
            {normality && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Meta label="n" value={normality.n} />
                  <Meta label="Skewness" value={normality.skewness} />
                  <Meta label="Kurtosis" value={normality.kurtosis} />
                  <Meta label="JB p-value" value={normality.pValue} />
                </div>
                <p className={`mt-4 rounded-md p-3 text-sm ${normality.normal ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                  {normality.normal ? 'No strong normality warning at alpha 0.05.' : 'Normality warning: consider Q-Q plot, transformation, or a nonparametric alternative.'}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {tab === 'transform' && (
        <section className="grid gap-5 xl:grid-cols-3">
          <TransformCard title="Filter Rows" icon={Filter}>
            <Field label="Column"><Select value={filterColumn || allCols[0]} setValue={setFilterColumn} options={allCols} /></Field>
            <Field label="Operator">
              <select value={filterOperator} onChange={(event) => setFilterOperator(event.target.value as typeof filterOperator)} className="input-select">
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="gt">greater than</option>
                <option value="lt">less than</option>
              </select>
            </Field>
            <Field label="Value"><input value={filterValue} onChange={(event) => setFilterValue(event.target.value)} className="input-select" /></Field>
            <ActionButton onClick={() => applyDataset(filterRows(activeDataset, filterColumn || allCols[0], filterOperator, filterValue), 'Filter rows', `Filtered rows by ${filterColumn || allCols[0]}.`)}>Apply filter</ActionButton>
          </TransformCard>

          <TransformCard title="Computed Columns" icon={FunctionSquare}>
            <Field label="Source numeric column"><Select value={sourceColumn || numericCols[0]} setValue={setSourceColumn} options={numericCols} /></Field>
            <Field label="Operation">
              <select value={operation} onChange={(event) => setOperation(event.target.value as typeof operation)} className="input-select">
                <option value="zscore">z-score / standardize</option>
                <option value="log">log transform</option>
                <option value="sqrt">square-root transform</option>
              </select>
            </Field>
            <Field label="New column"><input value={newColumn} onChange={(event) => setNewColumn(event.target.value)} placeholder={`${sourceColumn || numericCols[0]}_${operation}`} className="input-select" /></Field>
            <ActionButton onClick={() => applyDataset(addComputedColumn(activeDataset, newColumn || `${sourceColumn || numericCols[0]}_${operation}`, sourceColumn || numericCols[0], operation), 'Computed column', `Added ${newColumn || operation} column.`)}>Add column</ActionButton>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton onClick={() => applyDataset(binColumn(activeDataset, sourceColumn || numericCols[0], `${sourceColumn || numericCols[0]}_bin`, 4), 'Binning', `Binned ${sourceColumn || numericCols[0]}.`)}>Bin</ActionButton>
              <ActionButton onClick={() => applyDataset(labelEncodeColumn(activeDataset, categoricalCols[0], `${categoricalCols[0]}_code`), 'Label encode', `Encoded ${categoricalCols[0]}.`)}>Encode</ActionButton>
            </div>
          </TransformCard>

          <TransformCard title="Recode and Join" icon={Combine}>
            <Field label="Recode column"><Select value={sourceColumn || allCols[0]} setValue={setSourceColumn} options={allCols} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From"><input value={recodeFrom} onChange={(event) => setRecodeFrom(event.target.value)} className="input-select" /></Field>
              <Field label="To"><input value={recodeTo} onChange={(event) => setRecodeTo(event.target.value)} className="input-select" /></Field>
            </div>
            <ActionButton onClick={() => applyDataset(recodeColumn(activeDataset, sourceColumn || allCols[0], recodeFrom, recodeTo), 'Recode', `Recoded ${sourceColumn || allCols[0]}.`)}>Recode values</ActionButton>
            <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
              <Field label="Join with dataset">
                <select value={rightDatasetId} onChange={(event) => setRightDatasetId(event.target.value)} className="input-select">
                  <option value="">Select dataset</option>
                  {datasets.filter((dataset) => dataset.id !== activeDataset.id).map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
                </select>
              </Field>
              <Field label="Right key"><input value={rightKey} onChange={(event) => setRightKey(event.target.value)} placeholder="Matching key in right dataset" className="input-select" /></Field>
              <ActionButton onClick={() => {
                const right = datasets.find((dataset) => dataset.id === rightDatasetId)
                if (!right) return notify('Select another dataset first.', 'info')
                applyDataset(joinDatasets(activeDataset, right, sourceColumn || allCols[0], rightKey || sourceColumn || allCols[0]), 'Dataset join', `Joined with ${right.name}.`)
              }}>Join datasets</ActionButton>
            </div>
          </TransformCard>
        </section>
      )}

      {tab === 'statistics' && (
        <section className="grid gap-5 xl:grid-cols-3">
          <StatPanel title={`Grouped Descriptives: ${numericCols[0] ?? '-'} by ${categoricalCols[0] ?? '-'}`}>
            <MiniTable headers={['Group', 'n', 'Mean', 'Median', 'SD', 'SE']} rows={grouped.map((row) => [row.group, row.n, row.mean, row.median, row.sd, row.se])} />
          </StatPanel>
          <StatPanel title={`Frequency Table: ${categoricalCols[0] ?? '-'}`}>
            <MiniTable headers={['Value', 'Freq', '%', 'Valid %', 'Cum %']} rows={frequencies.map((row) => [row.value, row.frequency, row.percent, row.validPercent, row.cumulativePercent])} />
          </StatPanel>
          <StatPanel title="Crosstabs and Association">
            {cross ? (
              <div className="space-y-3">
                <MiniTable headers={['Row', ...cross.colLevels]} rows={cross.rowLevels.map((row, index) => [row, ...cross.table[index]])} />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Meta label="Chi-square" value={cross.chiSquare.statistic} />
                  <Meta label="p-value" value={cross.chiSquare.pValue} />
                  <Meta label="Cramer V" value={cross.cramerV} />
                  <Meta label="Phi" value={cross.phi ?? 'n/a'} />
                </div>
              </div>
            ) : <p className="text-sm text-slate-500">Need at least two categorical variables.</p>}
          </StatPanel>
        </section>
      )}

      {tab === 'log' && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Reproducible Analysis Log</h2>
          <div className="space-y-3">
            {log.map((entry) => (
              <div key={entry.id} className="flex gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                <GitBranch size={16} className="mt-0.5 text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.action}</p>
                  <p className="text-xs text-slate-500">{entry.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.at}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function Select({ value, setValue, options }: { value: string; setValue: (value: string) => void; options: string[] }) {
  return (
    <select value={value || options[0] || ''} onChange={(event) => setValue(event.target.value)} className="input-select">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  )
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">{children}<ArrowRight size={14} /></button>
}

function TransformCard({ title, icon: Icon, children }: { title: string; icon: typeof Sigma; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={17} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function StatPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">{title}</h2>
      {children}
    </div>
  )
}

function VariableTable({ rows }: { rows: ReturnType<typeof inferVariableMetadata> }) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[950px] text-xs">
        <thead className="bg-slate-50 dark:bg-slate-700/50">
          <tr>
            {['Name', 'Label', 'Type', 'Confidence', 'Measure', 'Role', 'Missing', 'Value Labels', 'Notes'].map((head) => (
              <th key={head} className="px-4 py-2 text-left font-semibold text-slate-500">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {rows.map((row) => (
            <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{row.name}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.label}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.detectedType}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.typeConfidence}%</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.measure}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.role}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{row.missingRule}</td>
              <td className="max-w-56 truncate px-4 py-2 text-slate-600 dark:text-slate-300">{row.valueLabels || '-'}</td>
              <td className="max-w-64 truncate px-4 py-2 text-slate-600 dark:text-slate-300">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IssueRow({ issue }: { issue: { severity: 'info' | 'warning' | 'danger'; title: string; detail: string; column?: string } }) {
  const tone = issue.severity === 'danger'
    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
    : issue.severity === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300'
  return (
    <div className={`rounded-md border p-3 ${tone}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {issue.severity === 'info' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
        {issue.column ? `${issue.column}: ${issue.title}` : issue.title}
      </div>
      <p className="mt-1 text-xs opacity-90">{issue.detail}</p>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-700/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{format(value)}</p>
    </div>
  )
}

function MiniTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">No compatible variables found.</p>
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-slate-700/50">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-2 text-left font-semibold text-slate-500">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-3 py-2 text-slate-700 dark:text-slate-200">{format(cell)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
