import { useId, useState, type ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { MathText } from '../ui/MathText'

export function RvCard({
  children,
  className = '',
  title,
  icon,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <section className={`rv-card p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            {icon}
            {title}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function RvSlider({
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

export function RvSelect({
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
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <select className="rv-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FormulaBlock({ tex, label }: { tex: string; label?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center dark:bg-slate-800/80">
      <MathText value={tex} block label={label} />
    </div>
  )
}

export function Insight({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-blue-50/80 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-blue-950/30 dark:text-blue-100">
      <p className="font-bold text-slate-800 dark:text-white">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function ResultBanner({
  tone = 'ok',
  title,
  children,
}: {
  tone?: 'ok' | 'warn' | 'info'
  title: string
  children?: ReactNode
}) {
  const tones = {
    ok: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    warn: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    info: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  }
  return (
    <div className={`rounded-2xl px-4 py-3 ${tones[tone]}`}>
      <p className="flex items-center gap-2 text-sm font-bold">
        <Check size={16} aria-hidden /> {title}
      </p>
      {children && <div className="mt-1 text-sm leading-6">{children}</div>}
    </div>
  )
}

export function QuizBlock({
  prompt,
  options,
  answer,
  explanation,
  onCorrect,
}: {
  prompt: string
  options: string[]
  answer: number
  explanation: string
  onCorrect?: () => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const letters = ['A', 'B', 'C', 'D']
  return (
    <div>
      <p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{prompt}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const selected = picked === index
          const correct = picked !== null && index === answer
          const wrong = selected && index !== answer
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                setPicked(index)
                if (index === answer) onCorrect?.()
              }}
              className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-left text-sm font-semibold ${
                correct
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : wrong
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : selected
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs">{letters[index]}</span>
              {option}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {picked === answer ? 'Correct. ' : 'Not quite. '}
          {explanation}
        </p>
      )}
    </div>
  )
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600">
      <RotateCcw size={14} aria-hidden /> Reset
    </button>
  )
}

export function ConceptList({
  items,
  active,
  onSelect,
}: {
  items: Array<{ id: string; title: string; detail: string }>
  active?: string
  onSelect?: (id: string) => void
}) {
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left ${
              active === item.id ? 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
              <span className="block text-xs leading-5 text-slate-500">{item.detail}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function ChipToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-blue-600" />
      {label}
    </label>
  )
}

export function LabSplit({
  demo,
  concepts,
  worked,
  practice,
}: {
  demo: ReactNode
  concepts: ReactNode
  worked: ReactNode
  practice: ReactNode
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.85fr)]">
        {demo}
        {concepts}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {worked}
        {practice}
      </div>
    </div>
  )
}
