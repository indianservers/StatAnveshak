import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * One structural region of a lab page (visualization, controls, explanation, and so on).
 *
 * Phase 1 renders the frame plus an outline of what the region will hold. Phase 2 replaces
 * the outline by passing `children`, so an upgraded lab never has to touch the page shell.
 */
export function LabSection({
  icon: Icon,
  title,
  description,
  outline,
  tall = false,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  outline?: string[]
  tall?: boolean
  children?: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Icon size={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      {children ?? (
        <div
          className={`mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/40 ${
            tall ? 'min-h-40' : 'min-h-24'
          }`}
        >
          {outline?.length ? (
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              {outline.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  )
}
