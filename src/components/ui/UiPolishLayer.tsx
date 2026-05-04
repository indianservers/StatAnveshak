import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, AlertTriangle, CheckCircle2, FileText, Sparkles, X } from 'lucide-react'
import { useStore } from '../../store/useStore'

type RecentPage = { path: string; label: string; at: number }

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/data/upload': 'Upload',
  '/data/grid': 'Data Grid',
  '/explore/summary': 'Summary',
  '/explore/charts': 'Charts',
  '/distributions': 'Distributions',
  '/stat-modules': 'Stat Modules',
  '/syllabus': 'Syllabus Modules',
  '/modules': 'CS Modules',
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
}

export function UiPolishLayer() {
  const { activeDataset, reportPreviewOpen, setReportPreviewOpen } = useStore()
  const location = useLocation()
  const [showTour, setShowTour] = useState(() => localStorage.getItem('anveshak-tour-done') !== 'yes')

  const recent = useMemo(() => {
    const previous = JSON.parse(localStorage.getItem('anveshak-recent-pages') ?? '[]') as RecentPage[]
    const label = PAGE_LABELS[location.pathname]
      ?? (location.pathname.startsWith('/distributions/') ? 'Distribution Module' : location.pathname.startsWith('/stat-modules/') ? 'Stat Module' : location.pathname.startsWith('/syllabus/') ? 'Syllabus Module' : location.pathname.startsWith('/modules/') ? 'CS Module' : 'Workspace')
    const next = [{ path: location.pathname, label, at: previous.find((item) => item.path === location.pathname)?.at ?? 0 }, ...previous.filter((item) => item.path !== location.pathname)].slice(0, 6)
    return next
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem('anveshak-recent-pages', JSON.stringify(recent))
  }, [recent])

  const health = useMemo(() => {
    if (!activeDataset) return null
    const missing = activeDataset.schema.reduce((sum, col) => sum + col.missing, 0)
    const total = Math.max(activeDataset.rows * activeDataset.cols, 1)
    const highMissing = activeDataset.schema.filter((col) => col.missingPct >= 20).length
    const tone = highMissing > 0 || missing / total > 0.1 ? 'warn' : 'ok'
    return { missingPct: (missing / total) * 100, highMissing, tone }
  }, [activeDataset])

  const closeTour = () => {
    localStorage.setItem('anveshak-tour-done', 'yes')
    setShowTour(false)
  }

  return (
    <>
      {showTour && (
        <div className="fixed bottom-4 left-4 z-40 w-80 rounded-xl border border-indigo-200 bg-white p-4 shadow-2xl dark:border-indigo-900 dark:bg-slate-800">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">First Run Tour</h2>
            </div>
            <button onClick={closeTour} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="Close tour"><X size={15} /></button>
          </div>
          <ol className="space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            <li><strong>1.</strong> Upload or load sample data.</li>
            <li><strong>2.</strong> Check Summary and Charts.</li>
            <li><strong>3.</strong> Run Distributions or Stat Modules.</li>
            <li><strong>4.</strong> Export reports from the top/report panel.</li>
          </ol>
          <button onClick={closeTour} className="mt-3 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700">Got it</button>
        </div>
      )}

      {reportPreviewOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-indigo-500" />
              <h2 className="font-bold text-slate-800 dark:text-white">Report Preview</h2>
            </div>
            <button onClick={() => setReportPreviewOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X size={16} /></button>
          </div>
          <div className="space-y-4 p-4 text-sm text-slate-600 dark:text-slate-300">
            {activeDataset ? (
              <>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                  <p className="text-xs text-slate-400">Active dataset</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{activeDataset.name}</p>
                  <p className="text-xs">{activeDataset.rows.toLocaleString()} rows, {activeDataset.cols} columns</p>
                </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-2 font-semibold">Data Health</p>
                <div className="flex items-center gap-2 text-xs">
                  {health?.tone === 'ok' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                  Missing cells: {health?.missingPct.toFixed(2)}%; high-missing columns: {health?.highMissing}
                </div>
              </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 font-semibold">Recommended Next Steps</p>
                  <ul className="space-y-1 text-xs">
                    <li>Open Summary Statistics to verify numeric ranges.</li>
                    <li>Open Charts to inspect outliers and shape.</li>
                    <li>Use Stat Modules when assumptions look valid.</li>
                  </ul>
                </div>
                <Link to="/reports" onClick={() => setReportPreviewOpen(false)} className="inline-flex rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700">Open Export & Reports</Link>
              </>
            ) : (
              <p>No dataset loaded. Upload or load sample data to preview a report.</p>
            )}
            {recent.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent Pages</p>
                <div className="space-y-1">
                  {recent.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setReportPreviewOpen(false)} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700">
                      <span>{item.label}</span>
                      <span className="text-slate-400">{item.path}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeDataset && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-30 hidden rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 lg:flex">
          <Activity size={13} className="mr-1.5 text-emerald-500" />
          {activeDataset.name} · {health?.missingPct.toFixed(1)}% missing
        </div>
      )}
    </>
  )
}
