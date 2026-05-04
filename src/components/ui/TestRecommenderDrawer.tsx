import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, ShieldCheck, Target, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { datasetGuardrails, recommendTest } from '../../lib/guardrails'

export function TestRecommenderDrawer() {
  const { activeDataset } = useStore()
  const [open, setOpen] = useState(false)
  const [outcomeType, setOutcomeType] = useState('numeric')
  const [groupCount, setGroupCount] = useState('two')
  const [paired, setPaired] = useState(false)
  const guards = useMemo(() => datasetGuardrails(activeDataset), [activeDataset])
  const recommendation = recommendTest(activeDataset, outcomeType, groupCount, paired)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-test-recommender', handler)
    return () => window.removeEventListener('open-test-recommender', handler)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40" onMouseDown={() => setOpen(false)}>
      <aside
        className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Test Recommender</h2>
          </div>
          <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <section className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Study Design</p>
            <div className="space-y-3">
              <label className="block text-xs text-slate-500">
                Outcome
                <select value={outcomeType} onChange={(event) => setOutcomeType(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                  <option value="numeric">Numeric outcome</option>
                  <option value="categorical">Categorical outcome</option>
                </select>
              </label>
              <label className="block text-xs text-slate-500">
                Groups
                <select value={groupCount} onChange={(event) => setGroupCount(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                  <option value="one">One group</option>
                  <option value="two">Two groups</option>
                  <option value="many">Three or more groups</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={paired} onChange={(event) => setPaired(event.target.checked)} className="accent-indigo-600" />
                Paired or repeated observations
              </label>
            </div>
          </section>

          <section className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <CheckCircle size={15} />
              Recommended analysis
            </div>
            {recommendation}
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Guardrails</h3>
            </div>
            {guards.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                No major guardrails detected for the active dataset.
              </p>
            ) : (
              <div className="space-y-2">
                {guards.map((guard) => (
                  <div key={guard.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                      <AlertTriangle size={14} />
                      {guard.title}
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300">{guard.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}
