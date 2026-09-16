import { useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { MathText } from '../ui/MathText'

export function SmCard({
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
    <section className={`sm-card p-5 ${className}`}>
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

export function SmSlider({
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
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums text-slate-900 dark:text-white">{display ?? String(value)}</span>
      </span>
      <input
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

export function SmSelect({
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
      <select className="sm-select" value={value} onChange={(event) => onChange(event.target.value)}>
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

export function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
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
}: {
  items: Array<{ title: string; body: string; icon: ReactNode }>
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 dark:bg-slate-800">
            {item.icon}
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
            <span className="mt-0.5 block text-sm leading-6 text-slate-500">{item.body}</span>
          </span>
        </li>
      ))}
    </ul>
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

  const resetQuestion = (nextIndex: number) => {
    setIndex(nextIndex)
    setPicked(null)
    setChecked(false)
  }

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
                name={`sm-quiz-${index}`}
                checked={selected}
                onChange={() => {
                  setPicked(optionIndex)
                  setChecked(false)
                }}
                className="accent-blue-600"
              />
              {option}
            </label>
          )
        })}
      </fieldset>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="sm-btn" disabled={picked === null} onClick={() => setChecked(true)}>
          Check answer
        </button>
        {index < items.length - 1 && (
          <button type="button" className="sm-btn sm-btn-ghost" onClick={() => resetQuestion(index + 1)}>
            Next question
          </button>
        )}
      </div>
      {checked && (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {picked === item.answer ? 'Correct. ' : 'Not quite. '}
          {item.explanation}
        </p>
      )}
    </div>
  )
}
