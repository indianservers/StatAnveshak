import { useId, useState, type ReactNode } from 'react'
import { MathText } from '../ui/MathText'
import { ConceptIcon } from './icons'

export function CltCard({
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
    <section className={`clt-card p-5 ${className}`}>
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

export function CltSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  ticks,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  display?: string
  ticks?: number[]
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
      {ticks && (
        <span className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </span>
      )}
    </label>
  )
}

export function CltSelect({
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
      <select
        id={id}
        className="clt-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
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

export function Insight({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  const tones = {
    info: 'bg-blue-50/80 text-slate-700 dark:bg-blue-950/30 dark:text-blue-100',
    warn: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    ok: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
  }
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${tones[tone]}`}>
      <p className="font-bold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="clt-metric">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

export function ConceptRow({
  icon,
  title,
  children,
}: {
  icon: Parameters<typeof ConceptIcon>[0]['name']
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-800">
        <ConceptIcon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <div className="mt-1 text-sm leading-6 text-slate-500">{children}</div>
      </div>
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
      <div className="mt-3 grid gap-2">
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

export function LabExploreGrid({
  simulation,
  concepts,
  example,
  practice,
}: {
  simulation: ReactNode
  concepts: ReactNode
  example: ReactNode
  practice: ReactNode
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)]">
      <div className="flex flex-col gap-4">
        {simulation}
        <div className="grid gap-4 lg:grid-cols-2">
          {example}
          {practice}
        </div>
      </div>
      {concepts}
    </div>
  )
}
