import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Database, FlaskConical, Map } from 'lucide-react'

export type RelatedItem = {
  kind: 'next' | 'related' | 'studio' | 'data'
  label: string
  detail?: string
  to: string
}

const ICONS = {
  next: ArrowRight,
  related: BookOpen,
  studio: FlaskConical,
  data: Database,
} as const

const KIND_LABEL: Record<RelatedItem['kind'], string> = {
  next: 'Next',
  related: 'Related',
  studio: 'Try in studio',
  data: 'Try with your data',
}

export function RelatedLearning({ items, heading = 'Continue from here' }: { items: RelatedItem[]; heading?: string }) {
  const visible = items.filter((item) => item.to)
  if (visible.length === 0) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
        <Map size={15} className="text-indigo-500" aria-hidden />
        {heading}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.slice(0, 4).map((item) => {
          const Icon = ICONS[item.kind]
          return (
            <Link
              key={`${item.kind}-${item.to}`}
              to={item.to}
              className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
            >
              <Icon size={15} className="mt-0.5 shrink-0 text-indigo-500" aria-hidden />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{KIND_LABEL[item.kind]}</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</span>
                {item.detail && <span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span>}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
