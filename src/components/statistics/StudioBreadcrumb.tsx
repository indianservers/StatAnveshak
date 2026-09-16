import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { STUDIOS_ROOT } from '../../lib/statisticsStudios'
import { FOCUS_RING } from './studioTheme'

export type Crumb = { label: string; to?: string }

export function StudioBreadcrumb({ trail }: { trail: Crumb[] }) {
  const items: Crumb[] = [{ label: 'Probability & Statistics Studios', to: STUDIOS_ROOT }, ...trail]

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
              {item.to && !last ? (
                <Link
                  to={item.to}
                  className={`rounded truncate hover:text-indigo-600 dark:hover:text-indigo-300 ${FOCUS_RING}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate ${last ? 'text-slate-700 dark:text-slate-200' : ''}`} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight size={12} aria-hidden className="text-slate-300 dark:text-slate-600" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
