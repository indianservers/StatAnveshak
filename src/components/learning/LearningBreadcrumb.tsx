import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export type LearningCrumb = { label: string; to?: string }

export function LearningBreadcrumb({ trail }: { trail: LearningCrumb[] }) {
  const items: LearningCrumb[] = [{ label: 'Learning', to: '/learn' }, ...trail]

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
                  className="rounded truncate hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:text-indigo-300"
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
