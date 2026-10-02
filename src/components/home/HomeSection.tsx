import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function HomeSection({
  id,
  icon: Icon,
  iconClass,
  title,
  description,
  action,
  children,
}: {
  id: string
  icon: LucideIcon
  iconClass: string
  title: string
  description: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <Icon size={19} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id={id} className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export const HOME_ACTION_CLASS =
  'inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40 dark:focus-visible:ring-offset-slate-950'
