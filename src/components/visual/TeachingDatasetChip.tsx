import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { sampleToDataset } from '../../lib/dataset'
import { findSampleById, sampleLibraryMeta } from '../../lib/sampleLibrary'
import { saveDataset } from '../../lib/storage'

export function TeachingDatasetChip({ compact = false }: { compact?: boolean }) {
  const { activeDataset, addDataset, setActiveDataset } = useStore()
  const [open, setOpen] = useState(false)
  const library = useMemo(() => sampleLibraryMeta(), [])
  const dataset = activeDataset
  const isTeaching = !dataset || dataset.sourceType === 'sample'
  const name = dataset?.name ?? 'Student Marks'
  const rows = dataset?.rows ?? 100

  const swap = async (id: string) => {
    const sample = findSampleById(id)
    if (!sample) return
    const next = sampleToDataset(sample)
    addDataset(next)
    setActiveDataset(next)
    await saveDataset(next)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      >
        <span className="truncate">
          {isTeaching ? 'Teaching dataset' : 'Dataset'} · {name} · {rows} rows
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-72 w-72 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="px-2 pb-2 text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">Swap sample</p>
          {library.slice(0, compact ? 8 : 12).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void swap(item.id)}
              className="block w-full rounded-lg px-2 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="block font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
              <span className="text-slate-500">{item.rows} rows · {item.task}</span>
            </button>
          ))}
          <Link
            to="/data/upload"
            className="mt-1 block rounded-lg px-2 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300"
            onClick={() => setOpen(false)}
          >
            Open full library
          </Link>
        </div>
      )}
    </div>
  )
}
