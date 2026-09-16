import { useId, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { MathText } from '../ui/MathText'

export function TsCard({
  children,
  className = '',
  title,
  action,
  icon,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <section className={`ts-card p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            {icon}
            {title}
          </h3>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function TsSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  display?: string
}) {
  const id = useId()
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums text-slate-900 dark:text-white">{display ?? String(value)}</span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 dark:bg-slate-700"
      />
    </label>
  )
}

export function TsSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const id = useId()
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <select id={id} className="ts-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TsToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  const id = useId()
  return (
    <label className="ts-toggle">
      <span>{label}</span>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

export function FormulaBlock({ tex, label }: { tex: string; label?: string }) {
  return (
    <div className="ts-formula">
      <MathText value={tex} block label={label} />
    </div>
  )
}

export function Insight({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  const tones = {
    info: 'bg-slate-50 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
    warn: 'bg-amber-50 text-amber-900',
    ok: 'bg-emerald-50 text-emerald-900',
  }
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${tones[tone]}`}>
      <p className="font-bold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function ResetButton({ onClick, label = 'Reset' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="ts-btn ts-btn-ghost w-full">
      <RotateCcw size={14} aria-hidden /> {label}
    </button>
  )
}

export function ConceptList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  )
}

export function HandNote({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`ts-note ${className}`}>{children}</p>
}
