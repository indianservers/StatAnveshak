import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, LayoutGrid, Search, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { FOCUS_RING } from '../statistics/studioTheme'
import { HomeGlyph } from './HomeGlyphs'
import { HOME_ACTION_CLASS, HomeSection } from './HomeSection'
import { MODULE_GLYPHS, MODULE_GROUPS, searchModuleGroups } from './homeCatalog'

const COLLAPSED_COUNT = 6

export function HomeAllModules({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(defaultExpanded)
  const searching = query.trim().length > 0
  const groups = searchModuleGroups(query)
  const visible = searching || expanded ? groups : groups.slice(0, COLLAPSED_COUNT)

  return (
    <HomeSection
      id="home-modules-heading"
      icon={LayoutGrid}
      iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
      title="All Modules"
      description="Browse all statistical modules, from core concepts to advanced methods."
      action={(
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-indigo-950 sm:w-64 sm:flex-none">
            <Search size={15} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search modules..."
              aria-label="Search modules and analyses"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            {searching && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear module search" className="rounded-md p-0.5 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X size={14} />
              </button>
            )}
          </label>
          {!searching && (
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="home-modules-grid" className={HOME_ACTION_CLASS}>
              {expanded ? 'Show fewer' : `View all ${MODULE_GROUPS.length} modules`}
              <ChevronDown size={15} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          )}
        </div>
      )}
    >
      {visible.length ? (
        <div id="home-modules-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {visible.map((group) => {
            const glyph = MODULE_GLYPHS[group.module]
            const first = group.items[0]
            const subtitle = searching
              ? group.items.slice(0, 2).map((item) => item.title).join(' · ') + (group.items.length > 2 ? ` +${group.items.length - 2}` : '')
              : group.items.length === 1 ? first.title : `${first.title} +${group.items.length - 1} more`
            return (
              <Link
                key={group.module}
                to={`/analysis/${first.id}`}
                onClick={() => setWorkspaceMode('analyze')}
                className={`group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 ${FOCUS_RING}`}
              >
                <HomeGlyph kind={glyph.kind} tone={glyph.tone} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black text-slate-950 dark:text-white">{group.label}</span>
                    <ArrowRight size={14} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" aria-hidden />
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">No modules or analyses match “{query}”.</p>
      )}
    </HomeSection>
  )
}
