import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Asterisk,
  Ban,
  BarChart2,
  BarChart3,
  Blend,
  ChevronDown,
  CircleDot,
  CircleOff,
  Crosshair,
  Database,
  Dices,
  Expand,
  FlaskConical,
  FlipHorizontal2,
  GraduationCap,
  Grid3X3,
  Hash,
  Hexagon,
  Hourglass,
  Layers,
  Mountain,
  MoveRight,
  PieChart,
  RectangleHorizontal,
  RefreshCcw,
  Repeat2,
  Scale,
  Shapes,
  Sigma,
  Sparkles,
  Spline,
  Target,
  Timer,
  Triangle,
  TrendingUp,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { DistributionLesson } from '../components/distributions/DistributionLesson'
import { useReducedMotion } from '../components/visual/useReducedMotion'
import {
  defaultParams,
  DISTRIBUTIONS,
  DISTRIBUTION_BY_ID,
  sanitizeParams,
  type Distribution,
  type DistributionId,
} from '../lib/distributions'

const GROUPS = ['Discrete', 'Continuous', 'Multivariate', 'Empirical'] as const
type DistGroup = (typeof GROUPS)[number]

const GROUP_ICONS: Record<DistGroup, LucideIcon> = {
  Discrete: Hash,
  Continuous: Spline,
  Multivariate: Layers,
  Empirical: BarChart3,
}

const DIST_ICONS: Record<DistributionId, LucideIcon> = {
  bernoulli: CircleDot,
  binomial: BarChart2,
  geometric: Target,
  negative_binomial: Repeat2,
  hypergeometric: Dices,
  poisson: Sparkles,
  discrete_uniform: Grid3X3,
  zip: CircleOff,
  zinb: Ban,
  continuous_uniform: RectangleHorizontal,
  normal: Activity,
  standard_normal: Sigma,
  lognormal: TrendingUp,
  exponential: Timer,
  gamma: Waves,
  beta: Shapes,
  chi_square: Asterisk,
  student_t: GraduationCap,
  f: Scale,
  weibull: Hourglass,
  pareto: Triangle,
  cauchy: Crosshair,
  logistic: Spline,
  skew_normal: MoveRight,
  laplace: FlipHorizontal2,
  gumbel: Mountain,
  inverse_gaussian: RefreshCcw,
  stretched_beta: Expand,
  mixture_normal: Blend,
  multinomial: PieChart,
  dirichlet: Hexagon,
  empirical: Database,
}

const groupLabel = (dist: Distribution): DistGroup => {
  if (dist.family === 'continuous') return 'Continuous'
  if (dist.family === 'discrete') return 'Discrete'
  if (dist.family === 'multivariate') return 'Multivariate'
  return 'Empirical'
}

const initialOpenGroups = (selectedId: DistributionId): Record<DistGroup, boolean> => {
  const selectedGroup = groupLabel(DISTRIBUTION_BY_ID[selectedId])
  return {
    Discrete: selectedGroup === 'Discrete' || selectedGroup === 'Continuous',
    Continuous: selectedGroup === 'Continuous' || selectedGroup === 'Discrete',
    Multivariate: selectedGroup === 'Multivariate',
    Empirical: selectedGroup === 'Empirical',
  }
}

export function DistributionsPage() {
  const { distributionId } = useParams()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const initial = DISTRIBUTION_BY_ID[distributionId as DistributionId] ? (distributionId as DistributionId) : 'normal'
  const [selected, setSelected] = useState<DistributionId>(initial)
  const dist = DISTRIBUTION_BY_ID[selected]
  const [params, setParams] = useState<Record<string, number>>(() => defaultParams(dist))
  const [openGroups, setOpenGroups] = useState<Record<DistGroup, boolean>>(() => initialOpenGroups(initial))

  useEffect(() => {
    if (!DISTRIBUTION_BY_ID[distributionId as DistributionId]) return
    const next = distributionId as DistributionId
    setSelected(next)
    setParams(defaultParams(DISTRIBUTION_BY_ID[next]))
  }, [distributionId])

  useEffect(() => {
    const group = groupLabel(DISTRIBUTION_BY_ID[selected])
    setOpenGroups((prev) => (prev[group] ? prev : { ...prev, [group]: true }))
  }, [selected])

  const goTo = (id: DistributionId) => {
    const search = window.location.hash.split('?')[1]
    const tab = new URLSearchParams(search).get('tab')
    navigate(tab ? `/distributions/${id}?tab=${tab}` : `/distributions/${id}`)
    setSelected(id)
    setParams(defaultParams(DISTRIBUTION_BY_ID[id]))
  }

  const toggleGroup = (group: DistGroup) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  const cleanParams = useMemo(() => sanitizeParams(dist, params), [dist, params])

  return (
    <div className="flex min-h-full flex-col bg-[#f7f8fc] dark:bg-slate-950 lg:flex-row">
      <aside className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:static lg:z-0 lg:h-auto lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-3 pt-3">
          <FlaskConical size={18} className="text-indigo-500" />
          <h2 className="font-black text-slate-900 dark:text-white">Distributions Studio</h2>
        </div>

        <label className="block px-3 pb-2 pt-2 lg:hidden">
          <span className="sr-only">Choose a distribution</span>
          <select
            value={selected}
            onChange={(event) => goTo(event.target.value as DistributionId)}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {DISTRIBUTIONS.filter((item) => groupLabel(item) === group).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="space-y-2 px-3 pb-3 lg:hidden">
          {GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group]
            const items = DISTRIBUTIONS.filter((item) => groupLabel(item) === group)
            const open = openGroups[group]
            return (
              <div key={group}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`dist-group-mobile-${group}`}
                  onClick={() => toggleGroup(group)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <GroupIcon size={14} className="shrink-0 text-indigo-500" aria-hidden />
                  <span>{group}</span>
                  <span className="font-semibold normal-case tracking-normal text-slate-400">{items.length}</span>
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={`ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${reducedMotion ? 'transition-none' : ''}`}
                  />
                </button>
                <div
                  id={`dist-group-mobile-${group}`}
                  className={`grid overflow-hidden ${reducedMotion ? '' : 'transition-[grid-template-rows] duration-200 ease-out'} ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className={`min-h-0 overflow-hidden ${open ? '' : 'pointer-events-none'}`} inert={open ? undefined : true} aria-hidden={!open}>
                    <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                      {items.map((item) => {
                        const Icon = DIST_ICONS[item.id]
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => goTo(item.id)}
                            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
                              selected === item.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <Icon size={13} aria-hidden />
                            {item.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="hidden p-3 lg:block">
          {GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group]
            const items = DISTRIBUTIONS.filter((item) => groupLabel(item) === group)
            const open = openGroups[group]
            return (
              <div key={group} className="mb-2">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`dist-group-${group}`}
                  onClick={() => toggleGroup(group)}
                  className="mb-1 flex min-h-9 w-full items-center gap-2 rounded-lg px-1 text-left text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <GroupIcon size={14} className="shrink-0 text-indigo-500" aria-hidden />
                  <span>{group}</span>
                  <span className="font-semibold normal-case tracking-normal text-slate-400/80">{items.length}</span>
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={`ml-auto shrink-0 ${reducedMotion ? '' : 'transition-transform duration-200'} ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  id={`dist-group-${group}`}
                  className={`grid overflow-hidden ${reducedMotion ? '' : 'transition-[grid-template-rows] duration-200 ease-out'} ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className={`min-h-0 overflow-hidden ${open ? '' : 'pointer-events-none'}`} inert={open ? undefined : true} aria-hidden={!open}>
                    {items.map((item) => {
                      const Icon = DIST_ICONS[item.id]
                      const active = selected === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => goTo(item.id)}
                          className={`mb-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            active
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon
                            size={15}
                            aria-hidden
                            className={`shrink-0 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}
                          />
                          <span className="truncate">{item.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-3 sm:p-5">
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
