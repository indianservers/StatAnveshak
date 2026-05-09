import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { loadDatasets, deleteDataset, loadProjects, deleteProject } from '../lib/storage'
import { Trash2, Database, RefreshCw } from 'lucide-react'

export function SettingsPage() {
  const { theme, toggleTheme, highContrast, toggleHighContrast, largeText, toggleLargeText, density, toggleDensity, resetZoom, setActiveDataset, setActiveProject } = useStore()
  const [storageInfo, setStorageInfo] = useState<{ datasets: number; projects: number }>({ datasets: 0, projects: 0 })
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadDatasets(), loadProjects()]).then(([ds, ps]) => {
      setStorageInfo({ datasets: ds.length, projects: ps.length })
    })
  }, [])

  const clearAllData = async () => {
    if (!confirm('Clear all saved datasets and projects from browser storage?')) return
    const ds = await loadDatasets()
    const ps = await loadProjects()
    await Promise.all([...ds.map((d) => deleteDataset(d.id)), ...ps.map((p) => deleteProject(p.id))])
    setActiveDataset(null)
    setActiveProject(null)
    setStorageInfo({ datasets: 0, projects: 0 })
    setStatus('Saved datasets and projects were cleared from browser storage.')
  }

  const resetLocalPreferences = () => {
    ;[
      'pref-sidebar-open',
      'pref-theme',
      'pref-high-contrast',
      'pref-large-text',
      'pref-zoom-level',
      'pref-density',
      'pref-favorite-modules',
      'anveshak-onboarding-complete',
      'anveshak-tour-done',
      'anveshak-recent-pages',
      'learn-progress',
      'sandbox-history',
      'stat-module-favorites',
      'stat-module-recents',
    ].forEach((key) => localStorage.removeItem(key))
    resetZoom()
    setStatus('Local preferences and tutorial progress were reset.')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Theme */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Theme</p>
              <p className="text-xs text-slate-400">Currently: {theme === 'light' ? 'Light' : 'Dark'} mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="text-sm border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
            >
              Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button onClick={toggleHighContrast} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              {highContrast ? 'Disable' : 'Enable'} high contrast
            </button>
            <button onClick={toggleLargeText} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              {largeText ? 'Disable' : 'Enable'} large text
            </button>
            <button onClick={toggleDensity} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Switch to {density === 'compact' ? 'comfortable' : 'compact'}
            </button>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Database size={16} /> Browser Storage (IndexedDB)
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{storageInfo.datasets}</p>
              <p className="text-xs text-slate-400">Saved Datasets</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{storageInfo.projects}</p>
              <p className="text-xs text-slate-400">Saved Projects</p>
            </div>
          </div>
          <button
            onClick={clearAllData}
            className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={13} /> Clear Saved Datasets and Projects
          </button>
          <button
            onClick={resetLocalPreferences}
            className="mt-3 flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw size={13} /> Reset Local Preferences
          </button>
          {status && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{status}</p>}
        </div>

        {/* Privacy */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700 p-5">
          <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Privacy Guarantee
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
            Anveshak is a 100% browser-only application. Your data is processed locally using WebAssembly and JavaScript.
            No dataset, result, or analysis is ever transmitted to any server. Your data stays on your device.
          </p>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <RefreshCw size={14} /> About Anveshak
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Anveshak v1.0 · Browser-Only Statistics &amp; Data Analytics Platform<br />
            Built with React, TypeScript, Vite, Tailwind CSS, AG Grid, DuckDB-Wasm, Plotly.js, and simple-statistics.
          </p>
        </div>
      </div>
    </div>
  )
}
