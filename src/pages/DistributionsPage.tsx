import { useEffect, useMemo, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { DistributionLesson } from '../components/distributions/DistributionLesson'
import {
  defaultParams,
  DISTRIBUTIONS,
  DISTRIBUTION_BY_ID,
  sanitizeParams,
  type Distribution,
  type DistributionId,
} from '../lib/distributions'

const groupLabel = (dist: Distribution) => {
  if (dist.family === 'continuous') return 'Continuous'
  if (dist.family === 'discrete') return 'Discrete'
  if (dist.family === 'multivariate') return 'Multivariate'
  return 'Empirical'
}

export function DistributionsPage() {
  const { distributionId } = useParams()
  const navigate = useNavigate()
  const initial = DISTRIBUTION_BY_ID[distributionId as DistributionId] ? (distributionId as DistributionId) : 'normal'
  const [selected, setSelected] = useState<DistributionId>(initial)
  const dist = DISTRIBUTION_BY_ID[selected]
  const [params, setParams] = useState<Record<string, number>>(() => defaultParams(dist))

  useEffect(() => {
    if (!DISTRIBUTION_BY_ID[distributionId as DistributionId]) return
    const next = distributionId as DistributionId
    setSelected(next)
    setParams(defaultParams(DISTRIBUTION_BY_ID[next]))
  }, [distributionId])

  const changeDistribution = (id: DistributionId) => {
    setSelected(id)
    setParams(defaultParams(DISTRIBUTION_BY_ID[id]))
    navigate(`/distributions/${id}`)
  }

  const cleanParams = useMemo(() => sanitizeParams(dist, params), [dist, params])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fc] dark:bg-slate-950 lg:flex-row">
      <aside className="shrink-0 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:h-full lg:w-60 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="mb-3 flex items-center gap-2 px-1">
          <FlaskConical size={18} className="text-indigo-500" />
          <h2 className="font-black text-slate-900 dark:text-white">Distributions</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:overflow-visible lg:pb-0">
          {['Discrete', 'Continuous', 'Multivariate', 'Empirical'].map((group) => (
            <div key={group} className="min-w-48 lg:mb-4 lg:min-w-0">
              <p className="mb-1 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">{group}</p>
              {DISTRIBUTIONS.filter((item) => groupLabel(item) === group).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeDistribution(item.id)}
                  className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    selected === item.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <DistributionLesson
          key={dist.id}
          dist={dist}
          params={cleanParams}
          onParam={(key, value) => setParams((prev) => sanitizeParams(dist, { ...prev, [key]: value }))}
          onReset={() => setParams(defaultParams(dist))}
        />
      </main>
    </div>
  )
}
