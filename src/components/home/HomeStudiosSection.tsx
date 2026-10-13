import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Network, Star } from 'lucide-react'
import { STATISTICS_STUDIOS, STUDIO_CATEGORIES, STUDIOS_ROOT, TOTAL_LAB_COUNT, TOTAL_STUDIO_COUNT, type Studio } from '../../lib/statisticsStudios'
import { StudioIconStyles } from '../visual/StudioIcons'
import { DistributionsStudioCard, StudioCard } from '../statistics/StudioCard'
import { HOME_ACTION_CLASS, HomeSection } from './HomeSection'
import { useHomePreferences } from './homePreferencesContext'
import { useStore } from '../../store/useStore'
import { studioProgressSummary, type ContinueTarget } from '../../lib/learningProgress'
import { readLocal, writeLocal } from '../../lib/safeStorage'

const LEVEL_LABELS = { intro: 'Introductory entry', core: 'Core entry', advanced: 'Advanced entry' }
function entryLevel(studio: Studio) {
  return studio.labs.some((lab) => lab.level === 'intro') ? 'intro' : studio.labs.some((lab) => lab.level === 'core') ? 'core' : 'advanced'
}

export function HomeStudiosSection() {
  const { topic, level } = useHomePreferences()
  const [grouping, setGrouping] = useState(() => readLocal('home-studio-grouping') === 'level' ? 'level' : 'topic')
  const progress = studioProgressSummary()
  const filtered = STATISTICS_STUDIOS.filter((studio) => (topic === 'all' || studio.category === topic) && (level === 'all' || studio.labs.some((lab) => lab.level === level)))
  const groups = grouping === 'topic'
    ? STUDIO_CATEGORIES.map((category) => ({ id: category.id, title: category.title, studios: filtered.filter((studio) => studio.category === category.id) }))
    : (['intro', 'core', 'advanced'] as const).map((value) => ({ id: value, title: LEVEL_LABELS[value], studios: filtered.filter((studio) => entryLevel(studio) === value) }))

  return (
    <HomeSection id="home-studios-heading" icon={Network} iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
      title="Probability & Statistics Studios" description={`${TOTAL_STUDIO_COUNT} interactive studios and ${TOTAL_LAB_COUNT} labs, from fundamentals to advanced topics.`}
      action={<Link to={STUDIOS_ROOT} className={HOME_ACTION_CLASS}>Open studios home <ArrowRight size={15} aria-hidden /></Link>}
    >
      <StudioIconStyles />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-slate-600 dark:text-slate-300">{filtered.length} studios match your topic and difficulty filters.</p>
        <label className="text-xs font-bold">Group studios by<select className="home-input ml-2" value={grouping} onChange={(event) => { setGrouping(event.target.value); writeLocal('home-studio-grouping', event.target.value) }}><option value="topic">Topic</option><option value="level">Learning level</option></select></label>
      </div>
      {grouping === 'level' && <p className="mb-3 text-xs">Studios are grouped by their easiest lab. Use the difficulty filter to find individual labs at your level.</p>}
      <div className="space-y-5">{groups.filter((group) => group.studios.length).map((group) => (
        <div key={group.id}>
          <h3 className="mb-3 font-bold">{group.title}</h3>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {group.studios.map((studio) => <StudioTile key={studio.slug} studio={studio} progress={progress.find((item) => item.path === `${STUDIOS_ROOT}/${studio.slug}`)} />)}
          </div>
        </div>
      ))}</div>
      {!filtered.length && <p className="p-4 text-sm">No studios match. Reset the filters in your workspace above.</p>}
      {topic === 'all' && level === 'all' && <div className="mt-4 max-w-sm"><DistributionsStudioCard /></div>}
    </HomeSection>
  )
}

function StudioTile({ studio, progress }: { studio: Studio; progress?: ContinueTarget }) {
  const { level } = useHomePreferences()
  const { favoriteModules, toggleFavoriteModule } = useStore()
  const path = `${STUDIOS_ROOT}/${studio.slug}`
  const matching = studio.labs.filter((lab) => level === 'all' || lab.level === level)
  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex-1"><StudioCard studio={studio} /></div>
    <div className="flex items-center justify-between gap-2 text-xs">
      <span>{[...new Set(studio.labs.map((lab) => lab.level))].join(' / ')} · ~10–20 min/lab</span>
      <button onClick={() => toggleFavoriteModule(path)} aria-pressed={favoriteModules.includes(path)} aria-label={`${favoriteModules.includes(path) ? 'Remove' : 'Add'} ${studio.title} ${favoriteModules.includes(path) ? 'from' : 'to'} favorites`} className="home-focus flex min-h-11 min-w-11 items-center justify-center rounded-lg"><Star size={17} className="text-amber-600" fill={favoriteModules.includes(path) ? 'currentColor' : 'none'} /></button>
    </div>
    {progress && <div><progress aria-label={`${studio.title} progress`} value={Math.min(progress.completed, progress.total)} max={progress.total} className="h-2 w-full accent-indigo-600" /><p className="text-xs text-slate-600 dark:text-slate-300">{Math.min(progress.completed, progress.total)} / {progress.total} labs completed</p></div>}
    <details><summary className="min-h-11 cursor-pointer text-xs font-bold">{matching.length} matching labs &amp; time estimates</summary><ul className="space-y-2 text-xs">{matching.map((lab) => <li key={lab.slug}><Link className="home-link block py-2" to={`${path}/${lab.slug}`}>{lab.title} · {lab.level} · ~{lab.level === 'advanced' ? '20' : '10'} min</Link></li>)}</ul></details>
  </div>
}
