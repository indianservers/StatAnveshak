import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, Star, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { FOCUS_RING } from '../statistics/studioTheme'
import { searchHome } from './homeSearchCatalog'
import { readStringArray, writeLocalJson } from '../../lib/safeStorage'

export function HomeSearch() {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const { favoriteModules, toggleFavoriteModule } = useStore()
  const [category, setCategory] = useState('All')
  const [recent, setRecent] = useState(() => readStringArray('home-recent-searches').slice(0, 5))
  const searching = Boolean(query.trim())
  const results = searchHome(query).filter((entry) => category === 'All' || entry.category === category)
  const clear = () => { setQuery(''); input.current?.focus() }
  const remember = () => {
    const next = [query.trim(), ...recent.filter((item) => item !== query.trim())].filter(Boolean).slice(0, 5)
    setRecent(next); writeLocalJson('home-recent-searches', next)
  }
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); event.stopImmediatePropagation(); input.current?.focus(); input.current?.scrollIntoView({ block: 'center' }) }
    }
    window.addEventListener('keydown', shortcut, true)
    return () => window.removeEventListener('keydown', shortcut, true)
  }, [])

  return (
    <section aria-label="Home search" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <label htmlFor="home-search" className="mb-2 block text-sm font-bold">Find your next step <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-300">Ctrl / ⌘ K</span></label>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950">
        <Search size={20} className="shrink-0 text-indigo-500" aria-hidden />
        <input ref={input} id="home-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') clear() }} placeholder="Search studios, labs, analyses, and data tools…" aria-controls={searching ? 'home-search-results' : undefined} aria-describedby="home-search-status" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
        {query && <button type="button" onClick={clear} aria-label="Clear home search" className={`rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 ${FOCUS_RING}`}><X size={18} /></button>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Search categories">{['All', 'Studio', 'Lab', 'Analysis', 'Data tool'].map((value) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`min-h-11 rounded-lg border px-3 text-xs font-bold ${FOCUS_RING} ${category === value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' : 'border-slate-200 dark:border-slate-700'}`}>{value}</button>)}</div>
      {!searching && recent.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span>Recent searches:</span>{recent.map((value) => <button key={value} className={`min-h-11 rounded-lg px-2 text-indigo-700 dark:text-indigo-300 ${FOCUS_RING}`} onClick={() => { setQuery(value); setCategory('All') }}>{value}</button>)}<button className={`min-h-11 rounded-lg px-2 ${FOCUS_RING}`} onClick={() => { setRecent([]); writeLocalJson('home-recent-searches', []) }}>Clear history</button></div>}
      <p id="home-search-status" role="status" className="mt-2 text-xs text-slate-500 dark:text-slate-400">{searching ? `${results.length} results${results.length > 12 ? ' · Showing the first 12; add more keywords to narrow your search.' : ''}` : 'Try “regression”, “normal distribution”, or “upload”.'}</p>
      {searching && <div id="home-search-results" className="mt-3">
        {results.length ? <ul className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">{results.slice(0, 12).map((entry) => <li key={entry.path} className="flex rounded-xl border border-slate-200 dark:border-slate-700">
          <Link to={entry.path} onClick={() => { remember(); if (entry.analyze) setWorkspaceMode('analyze') }} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950 ${FOCUS_RING}`}>
            <span className="min-w-0 flex-1"><span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">{entry.category}</span><span className="block text-sm font-bold"><Highlight text={entry.title} query={query} /></span><span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300"><Highlight text={entry.description} query={query} /></span></span><ArrowRight size={16} className="shrink-0" aria-hidden />
          </Link>
          <button className={`min-h-11 min-w-11 self-start rounded-lg p-3 ${FOCUS_RING}`} aria-label={`${favoriteModules.includes(entry.path) ? 'Remove' : 'Add'} ${entry.title} ${favoriteModules.includes(entry.path) ? 'from' : 'to'} favorites`} aria-pressed={favoriteModules.includes(entry.path)} onClick={() => toggleFavoriteModule(entry.path)}><Star size={17} fill={favoriteModules.includes(entry.path) ? 'currentColor' : 'none'} className="text-amber-600" /></button>
        </li>)}</ul> : <p className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">No matches for “{query}”. Try a broader topic or another keyword.</p>}
      </div>}
    </section>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return text
  const regex = new RegExp(`(${terms.join('|')})`, 'gi')
  return text.split(regex).map((part, index) => terms.some((term) => new RegExp(`^${term}$`, 'i').test(part)) ? <mark key={index} className="rounded bg-amber-100 text-slate-950 dark:bg-amber-300">{part}</mark> : part)
}

