import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookMarked, Search } from 'lucide-react'
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_LETTERS,
  GLOSSARY_TERMS,
  searchGlossary,
  type GlossaryCategory,
} from '../lib/glossary'
import { useSeoMetadata } from '../lib/seo'

type CategoryFilter = GlossaryCategory | 'All'

export function GlossaryPage() {
  useSeoMetadata({
    title: 'Statistics Glossary',
    description: 'A searchable glossary of 200+ statistics terms with plain-language definitions and examples.',
    path: '/glossary',
    keywords: ['statistics glossary', 'statistics terms', 'definitions', 'examples'],
  })

  const location = useLocation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [letter, setLetter] = useState<string | 'All'>('All')

  const matches = useMemo(() => {
    const found = searchGlossary(query, category)
    if (letter === 'All') return found
    return found.filter((item) => item.term[0]?.toUpperCase() === letter)
  }, [category, letter, query])

  const counts = useMemo(() => {
    const byCategory = Object.fromEntries(GLOSSARY_CATEGORIES.map((name) => [name, 0])) as Record<GlossaryCategory, number>
    for (const item of GLOSSARY_TERMS) byCategory[item.category] += 1
    return byCategory
  }, [])

  useEffect(() => {
    const slug = location.hash.replace('#', '')
    if (!slug) return
    const node = document.getElementById(slug)
    node?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [location.hash, matches.length])

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            <BookMarked size={16} />
            Reference
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Statistics Glossary</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {GLOSSARY_TERMS.length} terms in plain language, each with a short example. Search, jump by letter, or filter
            by topic. These are teaching definitions — they stay aligned with the studios, not with a single textbook wording.
          </p>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Terms" value={GLOSSARY_TERMS.length} />
          <Metric label="Topics" value={GLOSSARY_CATEGORIES.length} />
          <Metric label="Showing now" value={matches.length} />
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search terms, definitions, or examples…"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <FilterChip active={category === 'All'} onClick={() => setCategory('All')} label={`All (${GLOSSARY_TERMS.length})`} />
            {GLOSSARY_CATEGORIES.map((name) => (
              <FilterChip
                key={name}
                active={category === name}
                onClick={() => setCategory(name)}
                label={`${name} (${counts[name]})`}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <LetterChip active={letter === 'All'} onClick={() => setLetter('All')} label="All" />
            {GLOSSARY_LETTERS.map((item) => (
              <LetterChip key={item} active={letter === item} onClick={() => setLetter(item)} label={item} />
            ))}
          </div>
        </section>

        {matches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500 dark:border-slate-600">
            No terms match that search. Try a shorter word, such as “mean”, “p-value”, or “interval”.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {matches.map((item) => (
              <article
                key={item.slug}
                id={item.slug}
                className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    <Link to={`/glossary#${item.slug}`} className="hover:text-indigo-600">
                      {item.term}
                    </Link>
                  </h2>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {item.category}
                  </span>
                </div>
                {item.alsoCalled && (
                  <p className="mt-1 text-xs text-slate-400">Also called {item.alsoCalled.join(', ')}</p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.definition}</p>
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Example. </span>
                  {item.example}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function LetterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${
        active
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}
