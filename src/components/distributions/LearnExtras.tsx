import type { ReactNode } from 'react'
import { AlertTriangle, Ban, CircleHelp, ListChecks } from 'lucide-react'
import type { DistLearnExtras } from '../../lib/distributionLearnExtras'

function BulletCard({
  title,
  icon,
  items,
  tone,
}: {
  title: string
  icon: ReactNode
  items: string[]
  tone: 'sky' | 'rose'
}) {
  const frame = tone === 'sky'
    ? 'border-sky-100 dark:border-sky-900'
    : 'border-rose-100 dark:border-rose-900'
  const iconWrap = tone === 'sky'
    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300'
    : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
  return (
    <section className={`rounded-3xl border bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900 ${frame} dark:border-slate-800`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${iconWrap}`}>{icon}</span>
        <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function AccordionItem({
  summary,
  children,
  marker,
}: {
  summary: string
  children: ReactNode
  marker: string
}) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-slate-50 open:bg-white dark:border-slate-700 dark:bg-slate-950 dark:open:bg-slate-900">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-left text-sm font-bold text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden dark:text-slate-100">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {marker}
        </span>
        <span className="flex-1">{summary}</span>
        <span className="shrink-0 text-xs font-bold text-slate-400 group-open:hidden">Show</span>
        <span className="hidden shrink-0 text-xs font-bold text-indigo-500 group-open:inline">Hide</span>
      </summary>
      <div className="border-t border-slate-200 px-3 py-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {children}
      </div>
    </details>
  )
}

export function LearnExtras({ extras }: { extras: DistLearnExtras }) {
  return (
    <div className="grid gap-4">
      <BulletCard
        title="Assumptions — when this model is valid"
        icon={<ListChecks size={16} />}
        items={extras.assumptions}
        tone="sky"
      />

      <section className="rounded-3xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle size={16} />
          </span>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Common misconceptions</h2>
        </div>
        <div className="grid gap-2">
          {extras.misconceptions.map((item, index) => (
            <AccordionItem key={item.myth} summary={item.myth} marker={`M${index + 1}`}>
              <p>
                <span className="mr-1 font-bold text-emerald-700 dark:text-emerald-400">Correction:</span>
                {' '}{item.truth}
              </p>
            </AccordionItem>
          ))}
        </div>
      </section>

      <BulletCard
        title="When not to use it"
        icon={<Ban size={16} />}
        items={extras.misuse}
        tone="rose"
      />

      <section className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <CircleHelp size={16} />
          </span>
          <h2 className="text-base font-black text-slate-950 dark:text-white">FAQs</h2>
        </div>
        <div className="grid gap-2">
          {extras.faqs.map((item, index) => (
            <AccordionItem key={item.q} summary={item.q} marker={`Q${index + 1}`}>
              {item.a}
            </AccordionItem>
          ))}
        </div>
      </section>
    </div>
  )
}
