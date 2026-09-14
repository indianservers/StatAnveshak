import { useState } from 'react'
import { BarChart3, GraduationCap, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'

const STORAGE_KEY = 'anveshak-onboarding-complete'

export function OnboardingTour() {
  const workspaceMode = useStore((state) => state.workspaceMode)
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true')

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  if (!open || workspaceMode === 'learn') return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 p-4" onMouseDown={close}>
      <div
        className="mx-auto mt-20 max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Welcome to StatAnveshak</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A fast path from dataset to insight to learning.</p>
          </div>
          <button onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/data/upload" onClick={close} className="rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-900/20">
            <Upload size={22} className="mb-3 text-indigo-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-100">Load data</p>
            <p className="mt-1 text-xs text-slate-500">Upload files or pick a built-in sample.</p>
          </Link>
          <Link to="/dashboard" onClick={close} className="rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-900/20">
            <BarChart3 size={22} className="mb-3 text-indigo-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-100">Explore</p>
            <p className="mt-1 text-xs text-slate-500">Preview, chart, summarize, and run inference.</p>
          </Link>
          <Link
            to="/"
            onClick={() => {
              setWorkspaceMode('learn')
              close()
            }}
            className="rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-900/20"
          >
            <GraduationCap size={22} className="mb-3 text-indigo-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-100">Learn</p>
            <p className="mt-1 text-xs text-slate-500">Start the CLT lab in two clicks. Six pictures, then the workbench.</p>
          </Link>
        </div>
        <button onClick={close} className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Start exploring
        </button>
      </div>
    </div>
  )
}
