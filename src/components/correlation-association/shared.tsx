import { useId, useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { MathText } from '../ui/MathText'
import { ConceptIcon } from './icons'

export function CaCard({
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
    <section className={`corr-card p-5 ${className}`}>
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

export function CaSlider({
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

export function CaSelect({
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
      <select id={id} className="corr-select" value={value} onChange={(event) => onChange(event.target.value)}>
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

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center dark:bg-slate-800/80">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
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

export type QuizItem = {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export function QuizBlock({ items }: { items: QuizItem[] }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const item = items[index] ?? items[0]
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div>
      <p className="text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Question {index + 1} of {items.length}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{item.prompt}</p>
      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">Answer choices</legend>
        {item.options.map((option, optionIndex) => {
          const selected = picked === optionIndex
          const correct = checked && optionIndex === item.answer
          const wrong = checked && selected && optionIndex !== item.answer
          return (
            <label
              key={option}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border px-3 text-sm font-semibold ${
                correct
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : wrong
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : selected
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <input
                type="radio"
                name={`corr-quiz-${index}`}
                checked={selected}
                onChange={() => {
                  setPicked(optionIndex)
                  setChecked(false)
                }}
              />
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs">{letters[optionIndex]}</span>
              {option}
            </label>
          )
        })}
      </fieldset>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="corr-btn" disabled={picked === null} onClick={() => setChecked(true)}>
          Check answer
        </button>
        <button
          type="button"
          className="corr-btn corr-btn-ghost"
          onClick={() => {
            setIndex((index + 1) % items.length)
            setPicked(null)
            setChecked(false)
          }}
        >
          Next question
        </button>
      </div>
      {checked && <p className="mt-3 text-sm leading-6 text-slate-500">{item.explanation}</p>}
    </div>
  )
}

export function LabExploreGrid({
  controls,
  plot,
  aside,
  bottom,
}: {
  controls: ReactNode
  plot: ReactNode
  aside: ReactNode
  bottom?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.15fr)_minmax(240px,0.85fr)]">
        {controls}
        {plot}
        {aside}
      </div>
      {bottom}
    </div>
  )
}
