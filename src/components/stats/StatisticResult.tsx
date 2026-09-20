import { formatStat } from '../../lib/statEngine'
import { MathText } from '../ui/MathText'

export function StatisticResult({
  label,
  value,
  formula,
  hint,
  status = 'ok',
}: {
  label: string
  value: number | string
  formula?: string
  hint?: string
  status?: 'ok' | 'warn' | 'empty'
}) {
  const display = typeof value === 'number' ? formatStat(value) : value
  return (
    <article className={`rounded-xl border px-3 py-2 ${status === 'warn' ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white" title={typeof value === 'number' ? String(value) : undefined}>
        {display}
      </p>
      {formula ? (
        <div className="mt-1 text-[11px] text-slate-500">
          <MathText value={formula} />
        </div>
      ) : null}
      {hint ? <p className="mt-1 text-[11px] leading-4 text-slate-500">{hint}</p> : null}
    </article>
  )
}
