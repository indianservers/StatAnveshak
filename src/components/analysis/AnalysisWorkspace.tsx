import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Copy, Play, Search } from 'lucide-react'
import Plotly from 'plotly.js-dist-min'
import { ANALYSIS_BY_ID, ANALYSIS_CATALOG, JASP_MODULE_ORDER, analysesForModule } from '../../analysis/catalog'
import type { AnalysisDef, AnalysisOptions, AnalysisResult, PlotSpec } from '../../analysis/types'
import { runAnalysisInWorker } from '../../lib/workerClient'
import { useStore } from '../../store/useStore'
import { DatasetEmptyState } from '../ui/DatasetEmptyState'
import { useToast } from '../ui/toastContext'
import { SamplingMachine } from '../visual/SamplingMachine'
import { useReducedMotion } from '../visual/useReducedMotion'
import { numericColumn } from '../../lib/stats'

type Props = { analysisId: string }

export function AnalysisWorkspace({ analysisId }: Props) {
  const { activeDataset, theme } = useStore()
  const { notify } = useToast()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const analysis = ANALYSIS_BY_ID[analysisId] ?? ANALYSIS_CATALOG[0]
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<AnalysisOptions>({})
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  const numericCols = activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? []
  const preferredNumeric = (activeDataset?.schema ?? [])
    .filter((col) => col.type === 'numeric' && col.unique < (activeDataset?.rows ?? 0) && !/_id$/i.test(col.name))
    .map((col) => col.name)
  const numericPool = preferredNumeric.length ? preferredNumeric : numericCols
  const catCols = activeDataset?.schema.filter((col) => col.type !== 'numeric').map((col) => col.name) ?? []
  const allCols = activeDataset?.schema.map((col) => col.name) ?? []

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase()
    return JASP_MODULE_ORDER.map((module) => {
      const items = analysesForModule(module).filter((item) => !q || `${item.title} ${item.moduleLabel} ${item.id}`.toLowerCase().includes(q))
      return items.length ? { module, label: items[0].moduleLabel, items } : null
    }).filter(Boolean) as Array<{ module: string; label: string; items: AnalysisDef[] }>
  }, [query])

  useEffect(() => {
    const next: AnalysisOptions = { ciLevel: 0.95, rscale: 0.707, inference: analysis.frequentist ? 'frequentist' : 'bayesian' }
    for (const field of analysis.fields) {
      if (field.kind === 'variables' && field.multiple) {
        const pool = field.role === 'numeric' ? numericPool : field.role === 'categorical' ? catCols : allCols
        if (field.key === 'covariates') {
          next[field.key] = pool.slice(1, Math.max(2, Math.min(3, pool.length)))
        } else if (field.key === 'controls') {
          next[field.key] = []
        } else {
          const take = field.key === 'factors' ? 1 : field.key === 'measures' || field.key === 'dependents' ? Math.min(3, pool.length) : Math.min(3, pool.length)
          next[field.key] = field.required ? pool.slice(0, take) : field.key === 'raters' ? pool.slice(0, Math.min(2, pool.length)) : []
        }
      } else if (field.kind === 'select' || (field.kind === 'variables' && !field.multiple)) {
        const pool = field.role === 'numeric' ? numericPool : field.role === 'categorical' ? catCols : allCols
        const offset = field.key === 'measure2' || field.key === 'covariate' || field.key === 'columns' ? 1 : 0
        next[field.key] = pool[offset] ?? pool[0] ?? ''
      } else if (field.kind === 'choice') {
        next[field.key] = field.options[0]?.value ?? ''
      } else if (field.kind === 'toggle') {
        next[field.key] = field.default ?? false
      } else if (field.kind === 'number') {
        next[field.key] = field.default ?? (field.key === 'ciLevel' ? 0.95 : 0)
      } else if (field.kind === 'checkboxGroup') {
        next[field.key] = Object.fromEntries(field.items.map((item) => [item.key, item.key === 'tukey']))
      }
    }
    // Options reset when the analysis or dataset changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the option panel for the selected analysis
    setOptions(next)
    setResult(null)
    setError(null)
    const requiredReady = analysis.fields.filter((field) => 'required' in field && field.required).every((field) => {
      const value = next[field.key]
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== ''
    })
    const rows = activeDataset?.data ?? []
    if (analysis.implemented && (rows.length || analysis.allowEmptyData) && requiredReady) {
      void runAnalysisInWorker(analysis.id, rows, next).then(setResult).catch((err) => setError(err instanceof Error ? err.message : 'Analysis failed.'))
    }
  }, [analysis.id, activeDataset?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- seed options only when the analysis or dataset identity changes

  const run = async () => {
    if (!activeDataset && !analysis.allowEmptyData) return
    if (!analysis.implemented) {
      setError(null)
      setResult({
        analysisId: analysis.id,
        title: analysis.title,
        interpretation: `${analysis.title} is scheduled for Phase ${analysis.phase}.`,
        assumptions: [],
        footnotes: [analysis.description],
        tables: [],
        plots: [],
      })
      return
    }
    setRunning(true)
    setError(null)
    try {
      const next = await runAnalysisInWorker(analysis.id, activeDataset?.data ?? [], options)
      setResult(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
    } finally {
      setRunning(false)
    }
  }

  const runRef = useRef(run)
  useEffect(() => {
    runRef.current = run
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        void runRef.current()
      }
      if (!typing && event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const copyTables = async () => {
    if (!result) return
    const text = result.tables.map((table) => [table.title, table.columns.join('\t'), ...table.rows.map((row) => row.join('\t'))].join('\n')).join('\n\n')
    await navigator.clipboard.writeText(text)
    notify('Results copied.', 'success')
  }

  if (!activeDataset && !analysis.allowEmptyData) {
    return <DatasetEmptyState preferredPath={`/analysis/${analysis.id}`} description="Load a dataset to run JASP-catalog analyses. Learn Stats, Bayes labs, and summary-statistics analyses also run without a table." />
  }

  const samplingColumn = String(options.variable ?? options.dependent ?? options.measure1 ?? numericPool[0] ?? '')
  const samplingValues = activeDataset && samplingColumn ? numericColumn(activeDataset.data, samplingColumn) : []
  const showSampling = analysis.id.startsWith('t.') && samplingValues.length >= 8

  return (
    <div className="flex h-full min-h-[calc(100vh-7rem)] flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 p-3 dark:border-slate-700">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">JASP modules</p>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-900">
            <Search size={14} className="text-slate-400" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search analyses" aria-label="Search analyses" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>
        <nav className="min-h-0 flex-1 overflow-auto p-2" aria-label="Analysis catalog">
          {modules.map((group) => {
            const open = !collapsed.includes(group.module)
            return (
              <div key={group.module} className="mb-1">
                <button type="button" onClick={() => setCollapsed((value) => open ? [...value, group.module] : value.filter((item) => item !== group.module))} className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {group.label}
                </button>
                {open && group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/analysis/${item.id}`)}
                    className={`mb-0.5 flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm ${item.id === analysis.id ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/40'}`}
                  >
                    <span>{item.title}</span>
                    {!item.implemented && <span className="shrink-0 text-[10px] text-slate-400">P{item.phase}</span>}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      <section className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50 lg:w-80 lg:border-b-0 lg:border-r dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">{analysis.title}</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">{analysis.description}</p>
          {analysis.frequentist && analysis.bayesian && (
            <div className="mt-3 flex rounded-md border border-slate-200 p-0.5 text-xs dark:border-slate-600">
              {(['frequentist', 'bayesian'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`flex-1 rounded px-2 py-1 font-semibold ${options.inference === mode ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                  onClick={() => {
                    const next = { ...options, inference: mode }
                    setOptions(next)
                    if (analysis.implemented && (activeDataset?.data.length || analysis.allowEmptyData)) {
                      void runAnalysisInWorker(analysis.id, activeDataset?.data ?? [], next).then(setResult).catch((err) => setError(err instanceof Error ? err.message : 'Analysis failed.'))
                    }
                  }}
                >
                  {mode === 'frequentist' ? 'Frequentist' : 'Bayesian'}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          {options.inference === 'bayesian' && analysis.bayesian && (
            <label className="block text-xs font-semibold text-slate-500">
              rscale (JZS / Cauchy)
              <input
                type="number"
                min={0.1}
                step={0.01}
                value={Number(options.rscale ?? 0.707)}
                onChange={(event) => setOptions((value) => ({ ...value, rscale: Number(event.target.value) }))}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
          )}
          {options.inference === 'bayesian' && analysis.id === 'frequencies.binomial' && (
            <>
              <label className="block text-xs font-semibold text-slate-500">
                Prior α
                <input type="number" min={0.1} step={0.1} value={Number(options.priorAlpha ?? 1)} onChange={(event) => setOptions((value) => ({ ...value, priorAlpha: Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal dark:border-slate-600 dark:bg-slate-800" />
              </label>
              <label className="block text-xs font-semibold text-slate-500">
                Prior β
                <input type="number" min={0.1} step={0.1} value={Number(options.priorBeta ?? 1)} onChange={(event) => setOptions((value) => ({ ...value, priorBeta: Number(event.target.value) }))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal dark:border-slate-600 dark:bg-slate-800" />
              </label>
            </>
          )}
          {analysis.fields.map((field) => {
            const pool = field.kind === 'number' || field.kind === 'toggle' || field.kind === 'checkboxGroup' || field.kind === 'choice' ? [] : field.role === 'numeric' ? numericCols : field.role === 'categorical' ? catCols : allCols
            if (field.kind === 'variables' && field.multiple) {
              const selected = Array.isArray(options[field.key]) ? options[field.key] as string[] : []
              return (
                <fieldset key={field.key}>
                  <legend className="mb-1 text-xs font-semibold text-slate-500">{field.label}{field.required ? ' *' : ''}</legend>
                  <div className="max-h-40 space-y-1 overflow-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-800">
                    {pool.map((col) => (
                      <label key={col} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(col)}
                          onChange={() => {
                            const next = selected.includes(col) ? selected.filter((item) => item !== col) : [...selected, col]
                            setOptions((value) => ({ ...value, [field.key]: next }))
                          }}
                        />
                        {col}
                      </label>
                    ))}
                    {pool.length === 0 && <p className="text-xs text-slate-400">No matching columns.</p>}
                  </div>
                </fieldset>
              )
            }
            if (field.kind === 'select' || (field.kind === 'variables' && !field.multiple)) {
              return (
                <label key={field.key} className="block text-xs font-semibold text-slate-500">
                  {field.label}{field.required ? ' *' : ''}
                  <select
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={String(options[field.key] ?? '')}
                    onChange={(event) => setOptions((value) => ({ ...value, [field.key]: event.target.value }))}
                  >
                    {!field.required && <option value="">None</option>}
                    {pool.map((col) => <option key={col} value={col}>{col}</option>)}
                  </select>
                </label>
              )
            }
            if (field.kind === 'choice') {
              return (
                <label key={field.key} className="block text-xs font-semibold text-slate-500">
                  {field.label}{field.required ? ' *' : ''}
                  <select
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={String(options[field.key] ?? field.options[0]?.value ?? '')}
                    onChange={(event) => setOptions((value) => ({ ...value, [field.key]: event.target.value }))}
                  >
                    {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              )
            }
            if (field.kind === 'toggle') {
              return (
                <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(options[field.key])}
                    onChange={(event) => setOptions((value) => ({ ...value, [field.key]: event.target.checked }))}
                  />
                  {field.label}
                </label>
              )
            }
            if (field.kind === 'checkboxGroup') {
              const selected = (options[field.key] && typeof options[field.key] === 'object' && !Array.isArray(options[field.key])
                ? options[field.key] as Record<string, boolean>
                : {}) 
              return (
                <fieldset key={field.key}>
                  <legend className="mb-1 text-xs font-semibold text-slate-500">{field.label}</legend>
                  <div className="space-y-1 rounded-md border border-slate-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-800">
                    {field.items.map((item) => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(selected[item.key])}
                          onChange={() => setOptions((value) => ({
                            ...value,
                            [field.key]: { ...selected, [item.key]: !selected[item.key] },
                          }))}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )
            }
            if (field.kind === 'number') {
              return (
                <label key={field.key} className="block text-xs font-semibold text-slate-500">
                  {field.label}
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={options[field.key] === undefined || options[field.key] === '' ? '' : Number(options[field.key])}
                    onChange={(event) => setOptions((value) => ({ ...value, [field.key]: event.target.value === '' ? '' : Number(event.target.value) }))}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal dark:border-slate-600 dark:bg-slate-800"
                  />
                </label>
              )
            }
            return null
          })}
        </div>
        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <button type="button" onClick={() => void run()} disabled={running} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            <Play size={15} />
            {running ? 'Running…' : analysis.implemented ? 'Run analysis' : 'Show phase note'}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">Ctrl/⌘ + Enter to run. / focuses the catalog search.</p>
        </div>
      </section>

      <section className="min-w-0 flex-1 overflow-auto bg-white p-4 dark:bg-slate-950">
        {showSampling && (
          <div className="mb-6">
            <SamplingMachine key={samplingColumn} values={samplingValues} column={samplingColumn} reducedMotion={reducedMotion} />
            <p className="mt-2 text-xs text-slate-500">Play grows the sampling picture. Run analysis still fills the t-test table below.</p>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {!result && !error && (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
            Assign variables and run. Results stay in this collection until you run again.
          </div>
        )}
        {result && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{result.title}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{result.interpretation}</p>
              </div>
              <button type="button" onClick={() => void copyTables()} disabled={!result.tables.length} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300">
                <Copy size={13} /> Copy tables
              </button>
            </div>
            {result.assumptions.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="mb-1 font-semibold">Assumptions and data notes</p>
                <ul className="list-disc space-y-1 pl-5">
                  {result.assumptions.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}
            {result.tables.map((table) => {
              const shown = table.rows.slice(0, 80)
              return (
              <div key={table.id} className="overflow-auto rounded-xl border border-slate-300 dark:border-slate-600">
                <div className="border-b border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">{table.title}</div>
                <table className="min-w-full text-xs tabular-nums">
                  <caption className="sr-only">{table.title}</caption>
                  <thead>
                    <tr>
                      {table.columns.map((column) => (
                        <th key={column} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((row, index) => (
                      <tr key={index} className="border-t border-slate-200 odd:bg-white even:bg-slate-50 dark:border-slate-700 dark:odd:bg-slate-950 dark:even:bg-slate-900">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="whitespace-nowrap px-3 py-1.5 text-slate-800 dark:text-slate-100">{String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {table.rows.length > shown.length && (
                  <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-700">Showing the first {shown.length} of {table.rows.length} rows. Copy tables for the full grid.</p>
                )}
              </div>
              )
            })}
            {result.plots.map((plot) => <PlotPanel key={plot.id} plot={plot} theme={theme} />)}
            {result.footnotes.length > 0 && (
              <div className="text-xs leading-5 text-slate-500">
                {result.footnotes.map((note, index) => (
                  <p key={note}><span className="font-semibold">Note {index + 1}.</span> {note}</p>
                ))}
              </div>
            )}
            {analysis.implemented && (
              <p className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={13} /> Phase {analysis.phase} analysis.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function PlotPanel({ plot, theme }: { plot: PlotSpec; theme: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const dark = theme === 'dark' || theme === 'midnight' || theme === 'forest'
  useEffect(() => {
    if (!ref.current) return
    void Plotly.react(ref.current, plot.data as Plotly.Data[], {
      ...plot.layout,
      title: { text: plot.title, font: { size: 13 } },
      paper_bgcolor: dark ? '#020617' : '#ffffff',
      plot_bgcolor: dark ? '#020617' : '#ffffff',
      font: { color: dark ? '#e2e8f0' : '#334155', size: 11 },
      autosize: true,
    }, { responsive: true, displayModeBar: true })
  }, [plot, dark])
  return (
    <figure className="rounded-xl border border-slate-300 dark:border-slate-600">
      <div ref={ref} className="h-[380px] w-full" role="img" aria-label={plot.title} />
      <figcaption className="border-t border-slate-200 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">{plot.title}</figcaption>
    </figure>
  )
}
