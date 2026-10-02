import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { labPath, studioPath, type Studio } from '../../lib/statisticsStudios'
import { FOCUS_RING } from './studioTheme'

/** Every lab in the studio, so learners can jump between labs without going back to the studio page. */
export function StudioLabsMenu({ studio, current }: { studio: Studio; current: string }) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !active) return
    list.scrollLeft = active.offsetLeft - list.clientWidth / 2 + active.clientWidth / 2
  }, [current])

  return (
    <nav
      aria-label={`${studio.title} labs`}
      className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <Link
        to={studioPath(studio)}
        className={`flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-950/50 ${FOCUS_RING}`}
        title={`All labs in ${studio.title}`}
      >
        <LayoutGrid size={14} aria-hidden />
        <span className="hidden sm:inline">{studio.shortTitle} labs</span>
      </Link>
      <ol ref={listRef} className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:thin]">
        {studio.labs.map((lab, index) => {
          const active = lab.slug === current
          return (
            <li key={lab.slug} className="shrink-0">
              <Link
                to={labPath(studio.slug, lab.slug)}
                aria-current={active ? 'page' : undefined}
                title={lab.summary}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-bold transition ${FOCUS_RING} ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  aria-hidden
                >
                  {index + 1}
                </span>
                {lab.title}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
