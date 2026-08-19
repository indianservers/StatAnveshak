import { useState, useCallback, useMemo } from 'react'
import { Upload, FileText, Table2, AlertCircle, Database, CheckCircle, Clock, Edit3, ChevronDown, ChevronRight, Search, SlidersHorizontal, BarChart2, X } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { detectSchema } from '../../lib/schema'
import { useStore } from '../../store/useStore'
import { saveDataset } from '../../lib/storage'
import { useNavigate } from 'react-router-dom'
import { SAMPLE_DATASETS } from '../../lib/sampleData'
import { sampleToDataset } from '../../lib/dataset'
import type { ColumnSchema, Dataset } from '../../types'
import { DATASET_FILE_LIMIT_BYTES, uniqueColumnNames } from '../../lib/validation'
import { detectSchemaInWorker } from '../../lib/workerClient'

type PendingImport = {
  id: string
  fileName: string
  displayName: string
  fileSize: number
  sourceType: 'csv' | 'excel' | 'json'
  details: string
  confidence: number
  data: Record<string, unknown>[]
  schema: ColumnSchema[]
  columns: string[]
  warnings: string[]
  progress: number
  eta: string
  status: 'ready' | 'parsing'
}

const CATEGORY_COLORS: Record<string, string> = {
  Finance: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Health: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  Sports: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Business: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

function formatBytes(value?: number) {
  if (!value) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function detectFile(file: File) {
  if (file.size > DATASET_FILE_LIMIT_BYTES) {
    throw new Error(`${file.name}: file is larger than ${formatBytes(DATASET_FILE_LIMIT_BYTES)}. Split it or use a smaller extract.`)
  }
  if (file.name.match(/\.csv$/i)) return { sourceType: 'csv' as const, details: 'CSV detected, delimiter: comma', confidence: 96 }
  if (file.name.match(/\.(tsv|txt)$/i)) return { sourceType: 'csv' as const, details: 'Delimited text detected, delimiter: tab/auto', confidence: 88 }
  if (file.name.match(/\.xlsx?$/i)) return { sourceType: 'excel' as const, details: 'Excel workbook detected, first sheet selected', confidence: 94 }
  if (file.name.match(/\.json$/i)) return { sourceType: 'json' as const, details: 'JSON detected, object array expected', confidence: 92 }
  throw new Error(`${file.name}: unsupported file type. Please upload CSV, Excel, or JSON.`)
}

function typeIcon(type: string) {
  if (type === 'numeric') return '#'
  if (type === 'date') return 'D'
  return 'T'
}

export function UploadPage() {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<PendingImport[]>([])
  const [expandedSamples, setExpandedSamples] = useState<string[]>([])
  const [sampleQuery, setSampleQuery] = useState('')
  const [sampleCategory, setSampleCategory] = useState('All')
  const [sampleSort, setSampleSort] = useState<'popular' | 'name' | 'rows' | 'columns'>('popular')
  const [samplePage, setSamplePage] = useState(1)
  const { addDataset, setActiveDataset, datasets } = useStore()
  const navigate = useNavigate()

  const parseFile = useCallback(async (file: File): Promise<PendingImport> => {
    const detected = detectFile(file)
    const id = `pending_${Date.now()}_${file.name}`
    setPending((items) => [...items, {
      id,
      fileName: file.name,
      displayName: file.name.replace(/\.[^.]+$/, ''),
      fileSize: file.size,
      ...detected,
      data: [],
      schema: [],
      columns: [],
      warnings: [],
      progress: 12,
      eta: 'estimating',
      status: 'parsing',
    }])

    const started = Date.now()
    const timer = window.setInterval(() => {
      setPending((items) => items.map((item) => item.id === id && item.status === 'parsing'
        ? { ...item, progress: Math.min(92, item.progress + 14), eta: 'less than 1 min' }
        : item))
    }, 250)

    try {
      let data: Record<string, unknown>[] = []
      if (detected.sourceType === 'csv') {
        const text = await file.text()
        const result = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimiter: file.name.match(/\.tsv$/i) ? '\t' : undefined,
        })
        if (result.errors.length > 0) console.warn('CSV parse warnings:', result.errors.slice(0, 3))
        data = result.data
      } else if (detected.sourceType === 'excel') {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]
      } else {
        const text = await file.text()
        const parsed = JSON.parse(text)
        data = Array.isArray(parsed) ? parsed : [parsed]
      }
      if (data.length === 0) throw new Error(`${file.name}: file appears to be empty or has no data rows.`)

      const schema = data.length > 5000 ? await detectSchemaInWorker(data) : detectSchema(data)
      const warnings = [
        ...(schema.some((col) => col.missing > 0) ? ['Missing values were detected. Review missing-value rules before analysis.'] : []),
        ...(new Set(schema.map((col) => col.name.toLowerCase())).size !== schema.length ? ['Duplicate column names were detected and will be made unique on import.'] : []),
      ]
      const finished: PendingImport = {
        id,
        fileName: file.name,
        displayName: file.name.replace(/\.[^.]+$/, ''),
        fileSize: file.size,
        ...detected,
        confidence: Date.now() - started > 1000 ? detected.confidence : Math.min(99, detected.confidence + 1),
        data,
        schema,
        columns: schema.map((col) => col.name),
        warnings,
        progress: 100,
        eta: 'done',
        status: 'ready',
      }
      setPending((items) => items.map((item) => item.id === id ? finished : item))
      return finished
    } finally {
      window.clearInterval(timer)
    }
  }, [])

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setLoading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        await parseFile(file)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }, [parseFile])

  const commitImport = async (item: PendingImport) => {
    const columns = uniqueColumnNames(item.columns)
    const renamedData = item.data.map((row) => Object.fromEntries(item.schema.map((col, index) => [columns[index] || col.name, row[col.name]])))
    const schema = renamedData.length > 5000 ? await detectSchemaInWorker(renamedData) : detectSchema(renamedData)
    const queuedAt = Number(item.id.split('_')[1]) || 0
    const ds: Dataset = {
      id: `ds_${item.id}`,
      name: item.displayName.trim() || item.fileName.replace(/\.[^.]+$/, ''),
      rows: renamedData.length,
      cols: schema.length,
      createdAt: queuedAt,
      schema,
      sourceType: item.sourceType,
      fileSize: item.fileSize,
      schemaConfidence: item.confidence,
      parseDetails: item.details,
      data: renamedData,
    }
    addDataset(ds)
    setActiveDataset(ds)
    await saveDataset(ds)
    setPending((items) => items.filter((queued) => queued.id !== item.id))
    navigate('/data/preview')
  }

  const updateColumnName = (id: string, index: number, value: string) => {
    setPending((items) => items.map((item) => item.id === id
      ? { ...item, columns: item.columns.map((col, i) => i === index ? value : col) }
      : item))
  }

  const sampleCategories = useMemo(() => ['All', ...Array.from(new Set(SAMPLE_DATASETS.map((sample) => sample.category))).sort()], [])

  const filteredSamples = useMemo(() => {
    const query = sampleQuery.trim().toLowerCase()
    const samples = SAMPLE_DATASETS.filter((sample) => {
      const categoryMatch = sampleCategory === 'All' || sample.category === sampleCategory
      const queryMatch = !query
        || sample.name.toLowerCase().includes(query)
        || sample.description.toLowerCase().includes(query)
        || sample.category.toLowerCase().includes(query)
        || sample.tags.some((tag) => tag.toLowerCase().includes(query))
      return categoryMatch && queryMatch
    })

    return [...samples].sort((a, b) => {
      if (sampleSort === 'name') return a.name.localeCompare(b.name)
      if (sampleSort === 'rows') return b.data.length - a.data.length
      if (sampleSort === 'columns') return getColumnNames(b).length - getColumnNames(a).length
      return b.tags.length - a.tags.length || b.data.length - a.data.length
    })
  }, [sampleCategory, sampleQuery, sampleSort])

  const samplePageSize = 6
  const samplePageCount = Math.max(1, Math.ceil(filteredSamples.length / samplePageSize))
  const currentSamplePage = Math.min(samplePage, samplePageCount)
  const pagedSamples = filteredSamples.slice((currentSamplePage - 1) * samplePageSize, currentSamplePage * samplePageSize)

  const recentDatasets = useMemo(() => [...datasets].sort((a, b) => b.createdAt - a.createdAt), [datasets])

  const openExistingDataset = (dataset: Dataset, path = '/data/preview') => {
    setActiveDataset(dataset)
    navigate(path)
  }

  const loadSampleDataset = async (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((item) => item.id === sampleId)
    if (!sample) return
    setLoading(true)
    setError(null)
    try {
      const ds = sampleToDataset(sample)
      addDataset(ds)
      setActiveDataset(ds)
      await saveDataset(ds)
      navigate('/data/preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sample data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Upload Data</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Your data is processed entirely in the browser. Nothing is uploaded to any server.</p>

      {recentDatasets.length > 0 && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Your Datasets</h2>
              <p className="text-xs text-slate-400">Tap a dataset to load it immediately, or jump straight to charts.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">{recentDatasets.length} saved</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {recentDatasets.slice(0, 6).map((dataset) => (
              <div
                key={dataset.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
              >
                <button type="button" onClick={() => openExistingDataset(dataset)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Table2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{dataset.name}</p>
                    <p className="text-xs text-slate-400">{dataset.rows.toLocaleString()} rows x {dataset.cols} columns</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openExistingDataset(dataset, '/explore/charts')}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Visualize
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl p-8 transition-colors ${dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300'}`}
      >
        <input type="file" id="file-input" multiple accept=".csv,.tsv,.txt,.xlsx,.xls,.json" className="sr-only" onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = '' }} />
        <div className="grid gap-6 md:grid-cols-[180px_1fr] items-center">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
            <div className="mb-3 flex h-16 items-end gap-2">
              <span className="h-8 w-8 rounded bg-indigo-500" />
              <span className="h-12 w-8 rounded bg-emerald-500" />
              <span className="h-6 w-8 rounded bg-amber-500" />
              <span className="h-14 w-8 rounded bg-rose-500" />
            </div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">StatAnveshak import canvas</p>
          </div>
          <div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">Drop one or more files here</p>
            <p className="text-sm text-slate-400 mb-4">CSV, TSV, Excel, and JSON files are queued for review before import.</p>
            <label htmlFor="file-input" className="inline-flex cursor-pointer items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
              <Upload size={16} />
              Browse Files
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Drop Queue</h2>
          {pending.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {item.sourceType === 'excel' ? <Table2 size={16} className="text-emerald-500" /> : <FileText size={16} className="text-indigo-500" />}
                    <input value={item.displayName} onChange={(e) => setPending((items) => items.map((queued) => queued.id === item.id ? { ...queued, displayName: e.target.value } : queued))} className="rounded border border-transparent bg-transparent text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 dark:text-slate-100" />
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">{formatBytes(item.fileSize)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.details} - confidence {item.confidence}%</p>
                  {item.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {item.warnings.map((warning) => (
                        <li key={warning} className="text-xs text-amber-600 dark:text-amber-300">{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button disabled={item.status !== 'ready'} onClick={() => commitImport(item)} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  <CheckCircle size={14} />
                  Confirm Import
                </button>
              </div>
              {item.status === 'parsing' && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Parsing {item.progress}%</span>
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> ETA {item.eta}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100 dark:bg-slate-700"><div className="h-2 rounded bg-indigo-500" style={{ width: `${item.progress}%` }} /></div>
                </div>
              )}
              {item.status === 'ready' && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Rename columns before import</p>
                    {item.schema.slice(0, 8).map((col, index) => (
                      <label key={col.name} className="flex items-center gap-2 text-xs">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 font-bold text-slate-500 dark:bg-slate-700">{typeIcon(col.type)}</span>
                        <input value={item.columns[index]} onChange={(e) => updateColumnName(item.id, index, e.target.value)} className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
                        <Edit3 size={12} className="text-slate-400" />
                      </label>
                    ))}
                  </div>
                  <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>{item.schema.slice(0, 6).map((col, index) => <th key={col.name} className="px-3 py-2 text-left text-slate-500">{typeIcon(col.type)} {item.columns[index]} {col.missing > 0 && <span className="text-amber-500">!</span>}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {item.data.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex}>{item.schema.slice(0, 6).map((col) => <td key={col.name} className="px-3 py-2 text-slate-600 dark:text-slate-300">{String(row[col.name] ?? '')}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Database size={16} className="text-indigo-500" />
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Explore Sample Datasets</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open a sample dataset to load real rows, schema, charts, and analysis content.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {filteredSamples.length} of {SAMPLE_DATASETS.length} datasets
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <span className="sr-only">Search sample datasets</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={sampleQuery}
              onChange={(event) => {
                setSampleQuery(event.target.value)
                setSamplePage(1)
              }}
              placeholder="Search datasets by name, topic, or method..."
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-950"
            />
            {sampleQuery && (
              <button type="button" onClick={() => setSampleQuery('')} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100" aria-label="Clear sample search">
                <X size={15} />
              </button>
            )}
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-600 dark:bg-slate-900">
            <SlidersHorizontal size={15} className="text-slate-400" />
            <span className="sr-only">Sort sample datasets</span>
            <select value={sampleSort} onChange={(event) => setSampleSort(event.target.value as typeof sampleSort)} className="bg-transparent text-sm font-semibold text-slate-700 outline-none dark:text-slate-100">
              <option value="popular">Sort by: Popular</option>
              <option value="name">Sort by: Name</option>
              <option value="rows">Sort by: Rows</option>
              <option value="columns">Sort by: Columns</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {sampleCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSampleCategory(category)
                setSamplePage(1)
              }}
              className={`min-h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                sampleCategory === category
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : `border-slate-200 ${CATEGORY_COLORS[category] ?? 'bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'} hover:border-indigo-300`
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {pagedSamples.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {pagedSamples.map((sample, index) => {
              const expanded = expandedSamples.includes(sample.id)
              return (
                <article key={sample.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{sample.name}</h3>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">{sample.data.length} rows</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{sample.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[sample.category] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{sample.category}</span>
                        {sample.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <SamplePreviewChart sample={sample} variant={index % 4} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 bg-slate-50 text-center dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
                    <SampleStat label="Rows" value={sample.data.length.toLocaleString()} />
                    <SampleStat label="Columns" value={getColumnNames(sample).length.toLocaleString()} />
                    <SampleStat label="Type" value="CSV" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button type="button" onClick={() => setExpandedSamples((items) => expanded ? items.filter((id) => id !== sample.id) : [...items, sample.id])} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                      {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      Sample rows
                    </button>
                    <button type="button" onClick={() => loadSampleDataset(sample.id)} disabled={loading} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                      <BarChart2 size={14} />
                      Open dataset
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-3 overflow-auto rounded-lg border border-slate-100 dark:border-slate-700">
                      <table className="w-full text-xs">
                        <tbody>{sample.data.slice(0, 3).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-100 last:border-0 dark:border-slate-700">{Object.values(row).slice(0, 4).map((value, valueIndex) => <td key={valueIndex} className="px-2 py-1 text-slate-500 dark:text-slate-300">{String(value)}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-600 dark:bg-slate-900">
            <Search size={24} className="mx-auto text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No sample datasets found</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try a different keyword or category.</p>
            <button type="button" onClick={() => { setSampleQuery(''); setSampleCategory('All'); setSamplePage(1) }} className="mt-3 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Clear filters</button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Page {currentSamplePage} of {samplePageCount}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSamplePage(Math.max(1, currentSamplePage - 1))} disabled={currentSamplePage === 1} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300">Previous</button>
            {Array.from({ length: Math.min(samplePageCount, 7) }, (_, index) => index + 1).map((item) => (
              <button key={item} type="button" onClick={() => setSamplePage(item)} className={`h-9 w-9 rounded-md text-xs font-semibold ${item === currentSamplePage ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'}`}>{item}</button>
            ))}
            <button type="button" onClick={() => setSamplePage(Math.min(samplePageCount, currentSamplePage + 1))} disabled={currentSamplePage === samplePageCount} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300">Next</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SampleStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="px-2 py-2">
      <span className="block text-[0.68rem] font-bold uppercase text-slate-400">{label}</span>
      <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </span>
  )
}

function SamplePreviewChart({ sample, variant }: { sample: SampleDatasetLike; variant: number }) {
  const columns = getColumnNames(sample)
  const numericColumn = columns.find((column) => sample.data.some((row) => typeof row[column] === 'number' && !/(^id$|_id$|id$)/i.test(column)))
    ?? columns.find((column) => sample.data.some((row) => typeof row[column] === 'number'))
  const values = numericColumn ? sample.data.map((row) => Number(row[numericColumn])).filter(Number.isFinite).slice(0, 80) : []

  if (!values.length) {
    return (
      <div className="flex min-h-[104px] items-center justify-center rounded-lg bg-slate-50 text-xs font-semibold text-slate-400 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
        Categorical preview
      </div>
    )
  }

  if (variant === 1) return <ScatterPreview values={values} />
  if (variant === 2) return <LinePreview values={values} />
  if (variant === 3) return <BoxPreview values={values} />
  return <HistogramPreview values={values} label={numericColumn ?? sample.name} />
}

function HistogramPreview({ values, label }: { values: number[]; label: string }) {
  const bins = buildBins(values, 12)
  const max = Math.max(...bins.map((bin) => bin.count), 1)
  const width = 180
  const height = 104
  const barWidth = width / bins.length

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Histogram preview for ${label}`} className="min-h-[104px] w-full rounded-lg bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
      {bins.map((bin, index) => {
        const barHeight = Math.max(5, (bin.count / max) * 72)
        return <rect key={`${bin.start}-${index}`} x={index * barWidth + 4} y={88 - barHeight} width={Math.max(5, barWidth - 7)} height={barHeight} rx="3" fill={index % 2 ? '#8b5cf6' : '#60a5fa'} />
      })}
    </svg>
  )
}

function ScatterPreview({ values }: { values: number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points = values.slice(0, 55)

  return (
    <svg viewBox="0 0 180 104" role="img" aria-label="Scatter preview" className="min-h-[104px] w-full rounded-lg bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
      <line x1="14" y1="88" x2="168" y2="88" stroke="#cbd5e1" />
      <line x1="14" y1="14" x2="14" y2="88" stroke="#cbd5e1" />
      <line x1="20" y1="82" x2="162" y2="25" stroke="#60a5fa" strokeWidth="2" opacity="0.7" />
      {points.map((value, index) => {
        const x = 18 + (index / Math.max(points.length - 1, 1)) * 144
        const y = 86 - ((value - min) / Math.max(max - min, 1)) * 68
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.3" fill={index % 3 === 0 ? '#10b981' : index % 3 === 1 ? '#6366f1' : '#f97316'} opacity="0.85" />
      })}
    </svg>
  )
}

function LinePreview({ values }: { values: number[] }) {
  const points = values.slice(0, 36)
  const min = Math.min(...points)
  const max = Math.max(...points)
  const d = points.map((value, index) => {
    const x = 12 + (index / Math.max(points.length - 1, 1)) * 156
    const y = 86 - ((value - min) / Math.max(max - min, 1)) * 68
    return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 180 104" role="img" aria-label="Line chart preview" className="min-h-[104px] w-full rounded-lg bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
      <path d={d} fill="none" stroke="#22c55e" strokeWidth="3" />
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" transform="translate(0 -7)" opacity="0.75" />
    </svg>
  )
}

function BoxPreview({ values }: { values: number[] }) {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const scale = (value: number) => 14 + ((value - min) / Math.max(max - min, 1)) * 152

  return (
    <svg viewBox="0 0 180 104" role="img" aria-label="Box plot preview" className="min-h-[104px] w-full rounded-lg bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
      {[32, 52, 72].map((y, index) => (
        <g key={y}>
          <line x1={scale(min)} y1={y} x2={scale(max)} y2={y} stroke="#94a3b8" strokeWidth="2" />
          <rect x={scale(q1)} y={y - 10} width={Math.max(8, scale(q3) - scale(q1))} height="20" rx="4" fill={['#34d399', '#a78bfa', '#fb7185'][index]} opacity="0.82" />
          <line x1={scale(median)} y1={y - 10} x2={scale(median)} y2={y + 10} stroke="#334155" strokeWidth="2" />
        </g>
      ))}
    </svg>
  )
}

type SampleDatasetLike = {
  name: string
  data: Record<string, unknown>[]
}

function getColumnNames(sample: SampleDatasetLike) {
  return Object.keys(sample.data[0] ?? {})
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

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}
