import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { useNavigate, useParams } from 'react-router-dom'
import { Activity, AlertTriangle, BarChart3, BrainCircuit, Calculator, Clipboard, Download, Expand, Hash, Search, Star, TableProperties } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { AppTheme } from '../store/useStore'
import { defaultSelection, runStatModule, STAT_MODULES, type StatModuleGroup, type StatModuleSelection } from '../lib/statModules'
import { useToast } from '../components/ui/toastContext'
import { DatasetEmptyState } from '../components/ui/DatasetEmptyState'

const GROUP_ICONS: Record<StatModuleGroup, typeof Calculator> = {
  Inferential: Calculator,
  'Regression & Modeling': BrainCircuit,
  'Charting & Visualization': BarChart3,
  'Advanced Workflows': Activity,
}

const asCsv = (rows: Array<Record<string, string | number>>) => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  return [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n')
}

const downloadText = (filename: string, text: string, mime = 'text/plain') => {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function StatModulesPage() {
  const { activeDataset, theme } = useStore()
  const { notify } = useToast()
  const { moduleKey: routeModuleKey } = useParams()
  const navigate = useNavigate()
  const initialModule = STAT_MODULES.some((item) => item.key === routeModuleKey) ? routeModuleKey as string : 'confidence_interval'
  const [moduleKey, setModuleKey] = useState(initialModule)
  const [selection, setSelection] = useState<StatModuleSelection>({})
  const [query, setQuery] = useState('')
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(() => JSON.parse(localStorage.getItem('stat-module-favorites') ?? '[]') as string[])
  const [recentKeys, setRecentKeys] = useState<string[]>(() => JSON.parse(localStorage.getItem('stat-module-recents') ?? '[]') as string[])
  const [showExplain, setShowExplain] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [fullscreenChart, setFullscreenChart] = useState(false)
  const [resultAt, setResultAt] = useState(() => new Date())

  const columns = useMemo(() => Object.keys(activeDataset?.data[0] ?? {}), [activeDataset])
  const numericCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? columns,
    [activeDataset, columns]
  )
  const catCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type !== 'numeric').map((col) => col.name) ?? columns,
    [activeDataset, columns]
  )

  const dataRows = activeDataset?.data ?? []
  const effectiveSelection = defaultSelection(dataRows, selection)
  const selectedModule = STAT_MODULES.find((item) => item.key === moduleKey) ?? STAT_MODULES[0]

  let result
  try {
    result = activeDataset
      ? runStatModule(moduleKey, dataRows, effectiveSelection)
      : { title: selectedModule.title, summary: 'Load a dataset to run this module.', metrics: [] }
  } catch (error) {
    result = {
      title: selectedModule.title,
      summary: error instanceof Error ? error.message : 'Unable to compute this module with the selected columns.',
      metrics: [],
      notes: ['Try selecting different numeric or categorical columns.'],
    }
  }

  const filteredModules = STAT_MODULES.filter((module) => {
    const text = `${module.id} ${module.title} ${module.description} ${module.group}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })
  const grouped = filteredModules.reduce((acc, module) => {
    acc[module.group] = [...(acc[module.group] ?? []), module]
    return acc
  }, {} as Record<StatModuleGroup, typeof STAT_MODULES>)

  const update = (key: keyof StatModuleSelection, value: string | number) => {
    setSelection((prev) => ({ ...prev, [key]: value }))
    setResultAt(new Date())
  }

  const selectModule = useCallback((key: string) => {
    setModuleKey(key)
    navigate(`/stat-modules/${key}`)
    setResultAt(new Date())
    const next = [key, ...recentKeys.filter((item) => item !== key)].slice(0, 8)
    setRecentKeys(next)
    localStorage.setItem('stat-module-recents', JSON.stringify(next))
  }, [navigate, recentKeys])

  const toggleFavorite = (key: string) => {
    const next = favoriteKeys.includes(key) ? favoriteKeys.filter((item) => item !== key) : [...favoriteKeys, key]
    setFavoriteKeys(next)
    localStorage.setItem('stat-module-favorites', JSON.stringify(next))
  }

  const copySummary = async () => {
    await navigator.clipboard.writeText(`${result.title}\n${result.summary}\n${result.metrics.map((m) => `${m.label}: ${m.value}`).join('\n')}`)
    notify('Result summary copied.', 'success')
  }

  const copyTable = async () => {
    if (!result.table?.length) return
    await navigator.clipboard.writeText(asCsv(result.table))
    notify('Table copied as CSV.', 'success')
  }

  const exportTable = () => {
    if (!result.table?.length) return
    downloadText(`${selectedModule.key}.csv`, asCsv(result.table), 'text/csv')
    notify('Table exported as CSV.', 'success')
  }

  const warnings = [
    dataRows.length < 30 ? 'Small sample size may make p-values and intervals unstable.' : '',
    activeDataset?.schema.some((col) => col.missingPct > 0) ? 'Missing values detected; results use available valid rows.' : '',
    activeDataset?.schema.some((col) => col.type !== 'numeric' && col.unique > 20) ? 'Some categorical variables have many levels.' : '',
  ].filter(Boolean)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowDown') {
        const idx = STAT_MODULES.findIndex((module) => module.key === moduleKey)
        selectModule(STAT_MODULES[(idx + 1) % STAT_MODULES.length].key)
      }
      if (event.altKey && event.key === 'ArrowUp') {
        const idx = STAT_MODULES.findIndex((module) => module.key === moduleKey)
        selectModule(STAT_MODULES[(idx - 1 + STAT_MODULES.length) % STAT_MODULES.length].key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moduleKey, selectModule])

  if (!activeDataset) {
    return <DatasetEmptyState preferredPath="/stat-modules" description="Load a dataset to run statistical modules with guided inputs, charts, and exportable results." />
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Activity size={18} className="text-indigo-500" />
          <h1 className="font-bold text-slate-800 dark:text-white">Stat Modules</h1>
        </div>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules" className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        </div>

        {favoriteKeys.length > 0 && (
          <ModuleShortcutList title="Favorites" keys={favoriteKeys} active={moduleKey} onSelect={selectModule} />
        )}
        {recentKeys.length > 0 && (
          <ModuleShortcutList title="Recent" keys={recentKeys} active={moduleKey} onSelect={selectModule} />
        )}

        {(Object.entries(grouped) as [StatModuleGroup, typeof STAT_MODULES][]).map(([group, modules]) => {
          const Icon = GROUP_ICONS[group]
          return (
            <div key={group} className="mb-4">
              <div className="mb-1 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Icon size={13} />
                {group}
              </div>
              {modules.map((module) => (
                <button
                  key={module.key}
                  onClick={() => selectModule(module.key)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    moduleKey === module.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="font-semibold">{module.id}.</span>
                  <span className="min-w-0 flex-1 truncate">{module.title.replace(' Module', '')}</span>
                  <button
                    onClick={(event) => { event.stopPropagation(); toggleFavorite(module.key) }}
                    className="rounded p-0.5 hover:bg-white/20"
                    title="Favorite module"
                  >
                    <Star size={12} className={favoriteKeys.includes(module.key) ? 'fill-amber-300 text-amber-300' : ''} />
                  </button>
                </button>
              ))}
            </div>
          )
        })}
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="sticky top-0 z-20 -mx-6 mb-5 border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 text-xs text-slate-400">Analysis / Stat Modules / {selectedModule.title.replace(' Module', '')}</div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedModule.id}. {selectedModule.title}</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{selectedModule.group}</span>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-300">{activeDataset.name}</span>
              <span className="text-xs text-slate-400">Result {resultAt.toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedModule.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={copySummary} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700"><Clipboard size={13} /> Copy summary</button>
              <button onClick={copyTable} disabled={!result.table?.length} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"><TableProperties size={13} /> Copy table</button>
              <button onClick={exportTable} disabled={!result.table?.length} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"><Download size={13} /> CSV</button>
              <button onClick={() => setCompactMode((v) => !v)} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">{compactMode ? 'Comfortable' : 'Compact'}</button>
              <span className="text-xs text-slate-400 self-center">Alt+Up / Alt+Down changes module</span>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <span key={warning} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <AlertTriangle size={12} />
                  {warning}
                </span>
              ))}
            </div>
          )}

          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Inputs</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              <Select label="Numeric 1" value={effectiveSelection.num1} options={numericCols} icon="numeric" onChange={(value) => update('num1', value)} />
              <Select label="Numeric 2" value={effectiveSelection.num2} options={numericCols} icon="numeric" onChange={(value) => update('num2', value)} />
              <Select label="Numeric 3" value={effectiveSelection.num3} options={numericCols} icon="numeric" onChange={(value) => update('num3', value)} />
              <Select label="Target" value={effectiveSelection.target} options={numericCols} icon="numeric" onChange={(value) => update('target', value)} />
              <Select label="Category 1" value={effectiveSelection.cat1} options={catCols.length ? catCols : columns} onChange={(value) => update('cat1', value)} />
              <Select label="Category 2" value={effectiveSelection.cat2} options={catCols.length ? catCols : columns} onChange={(value) => update('cat2', value)} />
              <label className="text-xs text-slate-500">
                Alpha
                <input
                  type="number"
                  min="0.001"
                  max="0.2"
                  step="0.001"
                  value={effectiveSelection.alpha}
                  onChange={(event) => update('alpha', Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Recommended: numeric columns with at least 30 valid values and categorical columns with 2-12 levels.</p>
          </section>

          <section className={`mb-5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${compactMode ? 'p-3' : 'p-5'}`}>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{result.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result.summary}</p>

            {result.metrics.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {result.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <p className="mb-1 text-xs text-slate-400">{metric.label}</p>
                    <p className="break-words text-sm font-bold text-slate-800 dark:text-white">{String(metric.value)}</p>
                  </div>
                ))}
              </div>
            )}

            {result.notes && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                {result.notes.map((note) => <p key={note}>{note}</p>)}
              </div>
            )}
            {showExplain && (
              <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                <div className="mb-1 font-semibold">Explain result</div>
                Results are calculated from the selected dataset columns using available valid rows. p-values below alpha suggest evidence against the null; confidence intervals show plausible parameter ranges; effect sizes describe practical magnitude.
                <span className="ml-2 underline decoration-dotted" title="p-value: probability of data this extreme if the null model were true. CI: plausible range from repeated-sampling logic. Effect size: practical magnitude independent of sample size.">Key terms</span>
              </div>
            )}
            <button onClick={() => setShowExplain((v) => !v)} className="mt-3 text-xs text-indigo-600 dark:text-indigo-300">{showExplain ? 'Hide explanation' : 'Show explanation'}</button>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {result.table && result.table.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Table Output</h2>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50">
                      <tr>
                        {Object.keys(result.table[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-semibold">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {result.table.slice(0, 100).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cell) => (
                            <td key={cell} className="px-3 py-2 text-slate-600 dark:text-slate-300">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {result.chart && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Visualization</h2>
                  <button onClick={() => setFullscreenChart(true)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600"><Expand size={13} /> Fullscreen</button>
                </div>
                <PlotPanel chart={result.chart} theme={theme} moduleKey={selectedModule.key} notify={notify} />
              </section>
            )}
          </div>
        </div>
      </main>
      {fullscreenChart && result.chart && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-6" onClick={() => setFullscreenChart(false)}>
          <div className="h-full rounded-xl bg-white p-4 dark:bg-slate-800" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-white">{result.title}</h2>
              <button onClick={() => setFullscreenChart(false)} className="rounded-md bg-slate-100 px-3 py-1 text-sm dark:bg-slate-700 dark:text-slate-200">Close</button>
            </div>
            <PlotPanel chart={result.chart} theme={theme} moduleKey={selectedModule.key} notify={notify} height="calc(100vh - 130px)" />
          </div>
        </div>
      )}
    </div>
  )
}

function ModuleShortcutList({ title, keys, active, onSelect }: { title: string; keys: string[]; active: string; onSelect: (key: string) => void }) {
  return (
    <div className="mb-3">
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {keys.map((key) => {
        const module = STAT_MODULES.find((item) => item.key === key)
        if (!module) return null
        return (
          <button key={key} onClick={() => onSelect(key)} className={`mb-1 w-full truncate rounded-md px-2 py-1 text-left text-xs ${active === key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
            {module.id}. {module.title.replace(' Module', '')}
          </button>
        )
      })}
    </div>
  )
}

function PlotPanel({ chart, theme, moduleKey, notify, height = '420px' }: { chart: { data: unknown[]; layout?: Record<string, unknown> }; theme: AppTheme; moduleKey: string; notify: (message: string, tone?: 'success' | 'info') => void; height?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    Plotly.react(
      ref.current,
      chart.data as Plotly.Data[],
      {
        autosize: true,
        paper_bgcolor: theme === 'dark' ? '#1e293b' : '#ffffff',
        plot_bgcolor: theme === 'dark' ? '#0f172a' : '#f8fafc',
        font: { color: theme === 'dark' ? '#cbd5e1' : '#334155', family: 'Inter, system-ui, sans-serif', size: 12 },
        ...(chart.layout ?? {}),
      },
      { responsive: true, displaylogo: false }
    )
  }, [chart, theme])

  const exportPng = async () => {
    if (!ref.current) return
    const url = await Plotly.toImage(ref.current, { format: 'png', height: 900, width: 1400 })
    const link = document.createElement('a')
    link.href = url
    link.download = `${moduleKey}.png`
    link.click()
    notify('Chart exported as PNG.', 'success')
  }

  return (
    <div>
      <div ref={ref} style={{ width: '100%', minHeight: height }} />
      <button onClick={exportPng} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
        <Download size={12} />
        PNG
      </button>
    </div>
  )
}

function Select({ label, value, options, onChange, icon }: { label: string; value: string; options: string[]; onChange: (value: string) => void; icon?: 'numeric' }) {
  return (
    <label className="text-xs text-slate-500">
      <span className="inline-flex items-center gap-1">{icon === 'numeric' && <Hash size={11} />}{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
