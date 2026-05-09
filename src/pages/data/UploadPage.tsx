import { useState, useCallback, useMemo } from 'react'
import { Upload, FileText, Table2, AlertCircle, Database, CheckCircle, Clock, Edit3, ChevronDown, ChevronRight } from 'lucide-react'
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
  const { addDataset, setActiveDataset } = useStore()
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

  const groupedSamples = useMemo(() => SAMPLE_DATASETS.reduce((acc, sample) => {
    const group = ['Finance', 'Health', 'Sports'].includes(sample.category) ? sample.category : sample.category
    acc[group] = [...(acc[group] ?? []), sample]
    return acc
  }, {} as Record<string, typeof SAMPLE_DATASETS>), [])

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

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 mb-3"><Database size={16} className="text-indigo-500" /><h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Load Sample Data</h2></div>
        <div className="space-y-5">
          {Object.entries(groupedSamples).map(([category, samples]) => (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{category}</span>
                <span className="text-xs text-slate-400">{samples.length} datasets</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {samples.slice(0, 6).map((sample) => {
                  const expanded = expandedSamples.includes(sample.id)
                  return (
                    <div key={sample.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <button type="button" onClick={() => loadSampleDataset(sample.id)} disabled={loading} className="w-full text-left">
                        <span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{sample.name}</span><span className="text-xs text-slate-400">{sample.data.length} rows</span></span>
                        <span className="block text-xs text-slate-400 mt-1">{sample.description}</span>
                      </button>
                      <button type="button" onClick={() => setExpandedSamples((items) => expanded ? items.filter((id) => id !== sample.id) : [...items, sample.id])} className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-300">
                        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        Sample rows
                      </button>
                      {expanded && (
                        <div className="mt-2 overflow-auto rounded border border-slate-100 dark:border-slate-700">
                          <table className="w-full text-xs">
                            <tbody>{sample.data.slice(0, 3).map((row, index) => <tr key={index} className="border-b border-slate-100 last:border-0 dark:border-slate-700">{Object.values(row).slice(0, 4).map((value, i) => <td key={i} className="px-2 py-1 text-slate-500">{String(value)}</td>)}</tr>)}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
