import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SamplingMachine } from '../components/visual/SamplingMachine'
import { TeachingDatasetChip } from '../components/visual/TeachingDatasetChip'
import { useReducedMotion } from '../components/visual/useReducedMotion'
import { numericColumn } from '../lib/stats'
import { useStore } from '../store/useStore'
import { DatasetEmptyState } from '../components/ui/DatasetEmptyState'

export function InferencePage() {
  const activeDataset = useStore((state) => state.activeDataset)
  const reducedMotion = useReducedMotion()
  const numCols = useMemo(
    () =>
      activeDataset?.schema
        .filter((column) => column.type === 'numeric' && !/_id$/i.test(column.name))
        .map((column) => column.name) ?? [],
    [activeDataset]
  )
  const [column, setColumn] = useState('')
  const effective = column || numCols[0] || ''
  const values = activeDataset && effective ? numericColumn(activeDataset.data, effective) : []

  if (!activeDataset) {
    return (
      <DatasetEmptyState
        preferredPath="/inference"
        description="Load a dataset to watch sample means pile up, then open the t-test tables in Analyze."
      />
    )
  }

  return (
    <div className="pb-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-3 pt-4 sm:px-5">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Column
          <select
            value={effective}
            onChange={(event) => setColumn(event.target.value)}
            className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal dark:border-slate-600 dark:bg-slate-800"
          >
            {numCols.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <TeachingDatasetChip compact />
          <Link to="/analysis/t.oneSample" className="text-sm font-bold text-indigo-600 hover:underline">
            Open t-test tables
          </Link>
        </div>
      </div>
      {values.length >= 8 ? (
        <SamplingMachine key={effective} values={values} column={effective} reducedMotion={reducedMotion} />
      ) : (
        <p className="px-5 py-8 text-sm text-slate-500">Need at least 8 numeric values in this column.</p>
      )}
    </div>
  )
}
