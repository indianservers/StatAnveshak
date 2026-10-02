import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Clock, Columns3, Contrast, Database, FileText, FlaskConical, HelpCircle, LogOut, Minus, Moon, MoreHorizontal, Palette, Plus, Save, Search, Sun, Target, Type } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { saveDataset } from '../../lib/storage'
import { useToast } from '../ui/toastContext'
import { datasetGuardrails } from '../../lib/guardrails'
import { TeachingDatasetChip } from '../visual/TeachingDatasetChip'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/projects': 'Projects',
  '/data/upload': 'Upload',
  '/data/preview': 'Preview',
  '/data/grid': 'Data Grid',
  '/data/clean': 'Clean & Transform',
  '/data/workbench': 'Statistics Workbench',
  '/data/query': 'Query Workbench',
  '/explore/summary': 'Descriptive Statistics',
  '/analysis': 'Analysis',
  '/explore/charts': 'Charts',
  '/explore/correlation': 'Correlation',
  '/explore/frequency': 'Frequency',
  '/analysis/regression.correlation': 'Correlation',
  '/analysis/frequencies.contingency': 'Contingency Tables',
  '/analysis/regression.linear': 'Linear Regression',
  '/distributions': 'Distributions Studio',
  '/inference': 'Inference Tests',
  '/regression': 'Regression',
  '/advanced': 'Advanced Analysis',
  '/stat-modules': 'Stat Modules',
  '/syllabus': 'Syllabus Modules',
  '/modules': 'CS Modules',
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/statistics': 'Statistics Studios',
  '/learn': 'Continue Learning',
  '/learn/wall': 'Lesson Wall',
  '/classroom': 'Classroom',
  '/professional-learning': 'Professional Learning',
  '/solver': 'Solver',
  '/documentation': 'Documentation',
  '/docs': 'Documentation',
  '/glossary': 'Glossary',
  '/sitemap': 'Sitemap',
  '/settings': 'Settings',
}

export function TopBar() {
  const {
    theme,
    toggleTheme,
    activeDataset,
    activeProject,
    datasets,
    setActiveDataset,
    highContrast,
    toggleHighContrast,
    largeText,
    toggleLargeText,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    density,
    toggleDensity,
    setReportPreviewOpen,
    lastSavedAt,
    setLastSavedAt,
    workspaceMode,
    setWorkspaceMode,
  } = useStore()
  const [showHelp, setShowHelp] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useToast()

  const recentDatasets = useMemo(() => [...datasets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8), [datasets])
  const dataHealth = useMemo(() => {
    if (!activeDataset) return null
    const missing = activeDataset.schema.reduce((sum, col) => sum + col.missing, 0)
    const total = Math.max(activeDataset.rows * activeDataset.cols, 1)
    const missingPct = (missing / total) * 100
    const missingColumns = activeDataset.schema
      .filter((col) => col.missing > 0)
      .sort((a, b) => b.missingPct - a.missingPct)
    return {
      missingPct,
      missingColumns,
      tone: missingPct > 10 || activeDataset.schema.some((col) => col.missingPct >= 20) ? 'warn' : 'ok',
    }
  }, [activeDataset])
  const typeCounts = useMemo(() => {
    if (!activeDataset) return null
    const numeric = activeDataset.schema.filter((col) => col.type === 'numeric').length
    const categorical = activeDataset.schema.filter((col) => col.type === 'categorical' || col.type === 'text' || col.type === 'boolean').length
    return `${numeric}N ${categorical}C`
  }, [activeDataset])
  const guardrails = useMemo(() => datasetGuardrails(activeDataset), [activeDataset])
  const breadcrumb = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 0) return ['Workspace', 'Home']
    return ['Workspace', ...parts.map((part) => PAGE_NAMES[`/${parts.slice(0, parts.indexOf(part) + 1).join('/')}`] ?? part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))]
  }, [location.pathname])

  const handleSave = async () => {
    if (!activeDataset) return
    try {
      await saveDataset(activeDataset)
      setLastSavedAt(Date.now())
      notify('Dataset saved to browser storage.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The dataset was read, but could not be stored in this browser.', 'error')
    }
  }

  const unloadDataset = () => {
    setActiveDataset(null)
    setShowHealth(false)
    notify('Dataset unloaded. Saved datasets are still available from the datasets page.', 'info')
  }

  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    setShowMore(false)
  }
  const lastSavedLabel = lastSavedAt ? relativeTime(lastSavedAt) : null
  const iconBtn = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'

  return (
    <header className="relative z-20 flex min-h-12 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:gap-3 sm:px-3 md:px-4">
      <Link
        to="/"
        className="flex shrink-0 items-center gap-2 rounded-md pr-1 text-slate-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300"
        title="Stat Anveshak home"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
          <FlaskConical size={16} />
        </span>
        <span className="hidden text-base font-bold tracking-tight sm:inline">Stat Anveshak</span>
      </Link>

      <div className="flex shrink-0 items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-600" role="tablist" aria-label="Workspace mode">
        {(['learn', 'analyze'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setWorkspaceMode(mode)}
            className={`rounded-md px-2.5 py-1 text-xs font-bold capitalize ${
              workspaceMode === mode
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <nav className="hidden min-w-0 items-center gap-1 text-xs xl:flex" aria-label="Breadcrumb">
          {breadcrumb.map((part, index) => (
            <span key={`${part}-${index}`} className="inline-flex min-w-0 items-center gap-1">
              {index === 0 ? (
                <Link to="/" className="text-slate-400 hover:text-indigo-600">{part}</Link>
              ) : (
                <span className={`truncate ${index === breadcrumb.length - 1 ? 'font-medium text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{part}</span>
              )}
              {index < breadcrumb.length - 1 && <ChevronRight size={12} className="shrink-0 text-slate-300 dark:text-slate-600" />}
            </span>
          ))}
        </nav>

        {activeProject && (
          <span className="hidden min-w-0 items-center gap-1.5 truncate 2xl:inline-flex">
            <FolderIcon className="h-4 w-4 shrink-0 text-indigo-500" />
            <span className="truncate font-medium">{activeProject.name}</span>
            <span className="text-slate-400">/</span>
          </span>
        )}

        {workspaceMode === 'learn' ? (
          <TeachingDatasetChip compact />
        ) : activeDataset ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <Database size={14} className="shrink-0 text-green-500" />
            <select
              value={activeDataset.id}
              onChange={(event) => {
                const selected = datasets.find((item) => item.id === event.target.value)
                if (selected) setActiveDataset(selected)
              }}
              className="max-w-[9.5rem] truncate bg-transparent text-sm font-medium text-slate-700 outline-none sm:max-w-[12rem] dark:text-slate-200"
              title="Global dataset selector"
            >
              {recentDatasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
            <span className="hidden truncate text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded lg:inline dark:bg-slate-700">
              {activeDataset.rows.toLocaleString()} × {activeDataset.cols}
            </span>
            {typeCounts && (
              <span className="hidden text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded xl:inline dark:bg-indigo-900/30 dark:text-indigo-300" title="Numeric and categorical/text column counts">
                {typeCounts}
              </span>
            )}
          </div>
        ) : (
          <Link
            to="/data/upload"
            className="truncate rounded-md border border-dashed border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
          >
            No dataset loaded
          </Link>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {workspaceMode === 'analyze' && activeDataset && (
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs text-white hover:bg-indigo-700"
          >
            <Save size={12} />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}
        {workspaceMode === 'analyze' && activeDataset && (
          <button
            onClick={unloadDataset}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Unload current dataset without deleting it"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Unload</span>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowMore((value) => !value); setShowHelp(false); setShowHealth(false) }}
            className={iconBtn}
            title="More workspace controls"
            aria-expanded={showMore}
          >
            <MoreHorizontal size={16} />
          </button>
          {showMore && (
            <div className="absolute right-0 top-10 z-40 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</p>
              <div className="grid grid-cols-2 gap-2">
                <MoreAction icon={Search} label="Command palette" hint="Ctrl K" onClick={openCommandPalette} />
                {workspaceMode === 'analyze' && (
                  <MoreAction icon={Database} label="Datasets" onClick={() => { navigate('/data/upload'); setShowMore(false) }} />
                )}
                {workspaceMode === 'analyze' && (
                  <MoreAction icon={Target} label={guardrails.length ? `Wizard (${guardrails.length})` : 'Wizard'} onClick={() => { window.dispatchEvent(new Event('open-test-recommender')); setShowMore(false) }} />
                )}
                {workspaceMode === 'analyze' && (
                  <MoreAction icon={Columns3} label={density === 'compact' ? 'Compact' : 'Comfort'} onClick={toggleDensity} />
                )}
                {workspaceMode === 'analyze' && (
                  <MoreAction icon={FileText} label="Report preview" onClick={() => { setReportPreviewOpen(true); setShowMore(false) }} />
                )}
                <MoreAction icon={Type} label={largeText ? 'Large text on' : 'Large text'} onClick={toggleLargeText} />
                <MoreAction icon={Contrast} label={highContrast ? 'High contrast on' : 'High contrast'} onClick={toggleHighContrast} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-900">
                <button type="button" onClick={zoomOut} disabled={zoomLevel <= 0.8} className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-40 dark:hover:bg-slate-800" title="Zoom out"><Minus size={14} /></button>
                <button type="button" onClick={resetZoom} className="text-xs font-medium text-slate-600 dark:text-slate-300" title="Reset zoom">{Math.round(zoomLevel * 100)}%</button>
                <button type="button" onClick={zoomIn} disabled={zoomLevel >= 1.5} className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-40 dark:hover:bg-slate-800" title="Zoom in"><Plus size={14} /></button>
              </div>
              {dataHealth && (
                <button
                  type="button"
                  onClick={() => setShowHealth((value) => !value)}
                  className={`mt-2 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-xs ${
                    dataHealth.tone === 'ok'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                  }`}
                >
                  <span>Health {dataHealth.missingPct.toFixed(1)}% missing</span>
                  {guardrails.length > 0 && <AlertTriangle size={12} />}
                </button>
              )}
              {showHealth && dataHealth && (
                <div className="mt-2 max-h-40 overflow-auto text-xs">
                  {dataHealth.missingColumns.length === 0 ? (
                    <p className="text-emerald-600 dark:text-emerald-300">No missing values detected.</p>
                  ) : dataHealth.missingColumns.slice(0, 12).map((col) => (
                    <div key={col.name} className="flex justify-between gap-2 py-0.5">
                      <span className="truncate text-slate-600 dark:text-slate-300">{col.name}</span>
                      <span className="text-slate-500">{col.missingPct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
              {lastSavedAt && (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} /> Saved {lastSavedLabel}
                </p>
              )}
              <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Browser only · data stays on this device</p>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className={iconBtn}
          title={`Toggle theme (${theme})`}
        >
          {theme === 'light' ? <Moon size={16} /> : theme === 'dark' ? <Sun size={16} /> : <Palette size={16} />}
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowHelp((value) => !value); setShowMore(false) }}
            className={iconBtn}
            title="Keyboard shortcuts"
          >
            <HelpCircle size={16} />
          </button>
          {showHelp && (
            <div className="absolute right-0 top-10 z-40 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-2 text-xs font-semibold text-slate-500">Keyboard Shortcuts</p>
              {[
                ['Ctrl K', 'Command palette'],
                ['Esc', 'Close dialogs'],
                ['/', 'Use page search boxes'],
                ['Click column', 'Select or analyze column'],
              ].map(([keys, label]) => (
                <div key={keys} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-700">{keys}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MoreAction({ icon: Icon, label, hint, onClick }: { icon: typeof Search; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Icon size={13} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </button>
  )
}

function relativeTime(value: number) {
  const diffSeconds = Math.max(0, Math.round((Date.now() - value) / 1000))
  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  return new Date(value).toLocaleDateString()
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
