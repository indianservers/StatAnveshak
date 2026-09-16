import { Link } from 'react-router-dom'
import { DISTRIBUTION_BY_ID } from '../../../lib/distributions'
import type { DistributionId } from '../../../lib/distributions'

export function ComparePanel({ ids }: { ids: DistributionId[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-black text-slate-950 dark:text-white">Compare with related labs</h3>
      <p className="text-xs text-slate-500">Same studio, different experiment. Stay on Practice or jump into the other lab.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ids.map((id) => {
          const dist = DISTRIBUTION_BY_ID[id]
          if (!dist) return null
          return (
            <Link key={id} to={`/distributions/${id}?tab=viz`} className="rounded-2xl border border-slate-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{dist.name}</p>
              <p className="text-xs text-slate-500">{dist.explanation}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
