import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Clock, Columns3, Contrast, Database, FileText, HelpCircle, Minus, Moon, Plus, RotateCcw, Save, Search, Sun, Target, Type } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { saveDataset } from '../../lib/storage'
import { useToast } from '../ui/toastContext'
import { datasetGuardrails } from '../../lib/guardrails'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/projects': 'Projects',
  '/data/upload': 'Upload',
  '/data/preview': 'Preview',
  '/data/grid': 'Data Grid',
  '/data/clean': 'Clean & Transform',
  '/data/workbench': 'Statistics Workbench',
  '/data/query': 'Query Workbench',
  '/explore/summary': 'Summary Statistics',
  '/explore/charts': 'Charts',
  '/explore/correlation': 'Correlation',
  '/explore/frequency': 'Frequency',
  '/distributions': 'Distributions',
  '/inference': 'Inference Tests',
  '/regression': 'Regression',
  '/advanced': 'Advanced Analysis',
  '/stat-modules': 'Stat Modules',
  '/syllabus': 'Syllabus Modules',
  '/modules': 'CS Modules',
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/learn': 'Teaching Mode',
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
  } = useStore()
  const [showHelp, setShowHelp] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
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
    await saveDataset(activeDataset)
    setLastSavedAt(Date.now())
    notify('Dataset saved to browser storage.', 'success')
  }

  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }
  const lastSavedLabel = lastSavedAt ? relativeTime(lastSavedAt) : null

  return (
    <header className="h-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-3 shrink-0">
      <div className="flex-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
        <nav className="hidden lg:flex items-center gap-1 text-xs min-w-0" aria-label="Breadcrumb">
          {breadcrumb.map((part, index) => (
            <span key={`${part}-${index}`} className="inline-flex items-center gap-1 min-w-0">
              {index === 0 ? (
                <Link to="/" className="text-slate-400 hover:text-indigo-600">{part}</Link>
              ) : (
                <span className={`truncate ${index === breadcrumb.length - 1 ? 'font-medium text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{part}</span>
              )}
              {index < breadcrumb.length - 1 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />}
            </span>
          ))}
        </nav>

        {activeProject && (
          <>
            <FolderIcon className="w-4 h-4 text-indigo-500" />
            <span className="font-medium">{activeProject.name}</span>
            <span className="text-slate-400">/</span>
          </>
        )}

        {activeDataset ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <Database size={14} className="text-green-500 shrink-0" />
            <select
              value={activeDataset.id}
              onChange={(event) => {
                const selected = datasets.find((item) => item.id === event.target.value)
                if (selected) setActiveDataset(selected)
              }}
              className="max-w-44 bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
              title="Global dataset selector"
            >
              {recentDatasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
            <span className="hidden sm:inline text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              {activeDataset.rows.toLocaleString()} rows x {activeDataset.cols} cols
            </span>
            {typeCounts && (
              <span className="hidden sm:inline text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded" title="Numeric and categorical/text column counts">
                {typeCounts}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-xs">No dataset loaded - upload or select one</span>
        )}
      </div>

      <div className="hidden md:flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Browser only
      </div>

      {dataHealth && (
        <div className="relative hidden xl:block">
          <button
            type="button"
            onClick={() => setShowHealth((value) => !value)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
            dataHealth.tone === 'ok'
              ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
              : 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
            }`}
            aria-expanded={showHealth}
            title="Show missing data by column"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dataHealth.tone === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            Health {dataHealth.missingPct.toFixed(1)}% missing
          </button>
          {showHealth && (
            <div className="absolute right-0 top-8 z-30 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-2 text-xs font-semibold text-slate-500">Missing data breakdown</p>
              {dataHealth.missingColumns.length === 0 ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-300">No missing values detected.</p>
              ) : (
                <div className="max-h-56 overflow-auto space-y-2">
                  {dataHealth.missingColumns.slice(0, 12).map((col) => (
                    <div key={col.name}>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate text-slate-600 dark:text-slate-300">{col.name}</span>
                        <span className="font-medium text-slate-500">{col.missing} ({col.missingPct.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-slate-100 dark:bg-slate-700">
                        <div className="h-1.5 rounded bg-amber-400" style={{ width: `${Math.min(100, col.missingPct)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => navigate('/data/upload')}
        className="hidden md:flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
        title="Load sample data or upload a file"
      >
        <Database size={12} />
        Dataset
      </button>

      <button
        onClick={() => window.dispatchEvent(new Event('open-test-recommender'))}
        className="hidden lg:flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
        title="Open test recommender and data guardrails"
      >
        <Target size={12} />
        Wizard
        {guardrails.length > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertTriangle size={10} />
            {guardrails.length}
          </span>
        )}
      </button>

      <button
        onClick={openCommandPalette}
        className="hidden md:flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
        title="Open command palette"
      >
        <Search size={12} />
        Ctrl K
      </button>

      <button
        onClick={toggleDensity}
        className={`hidden lg:flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-md transition-colors ${
          density === 'compact'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
        title="Toggle compact mode"
      >
        <Columns3 size={12} />
        {density === 'compact' ? 'Compact' : 'Comfort'}
      </button>

      <button
        onClick={() => setReportPreviewOpen(true)}
        className="hidden lg:flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md transition-colors"
        title="Open report preview drawer"
      >
        <FileText size={12} />
        Report
      </button>

      {activeDataset && (
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors"
        >
          <Save size={12} />
          Save
        </button>
      )}

      {lastSavedAt && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400" title={new Date(lastSavedAt).toLocaleString()}>
          <Clock size={12} />
          Saved {lastSavedLabel}
        </div>
      )}

      <button
        onClick={zoomOut}
        disabled={zoomLevel <= 0.8}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-700 transition-colors"
        title="Zoom out"
      >
        <Minus size={16} />
      </button>

      <button
        onClick={resetZoom}
        className="hidden sm:flex h-8 min-w-12 items-center justify-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Reset zoom"
      >
        <RotateCcw size={12} />
        {Math.round(zoomLevel * 100)}%
      </button>

      <button
        onClick={zoomIn}
        disabled={zoomLevel >= 1.5}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-700 transition-colors"
        title="Zoom in"
      >
        <Plus size={16} />
      </button>

      <button
        onClick={toggleLargeText}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${largeText ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        title="Toggle larger base text"
      >
        <Type size={16} />
      </button>

      <button
        onClick={toggleHighContrast}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${highContrast ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        title="Toggle high contrast"
      >
        <Contrast size={16} />
      </button>

      <button
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Toggle theme"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowHelp((value) => !value)}
          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Keyboard shortcuts"
        >
          <HelpCircle size={16} />
        </button>
        {showHelp && (
          <div className="absolute right-0 top-10 z-30 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xl">
            <p className="text-xs font-semibold text-slate-500 mb-2">Keyboard Shortcuts</p>
            {[
              ['Ctrl K', 'Command palette'],
              ['Esc', 'Close dialogs'],
              ['/', 'Use page search boxes'],
              ['Click column', 'Select or analyze column'],
            ].map(([keys, label]) => (
              <div key={keys} className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-600 dark:text-slate-300">{label}</span>
                <kbd className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-slate-500">{keys}</kbd>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
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
