import { useId, useState, type ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { MathText } from '../ui/MathText'
import { DieFace } from './icons'

export function PfCard({
  children,
  className = '',
  title,
  icon,
}: {
  children: ReactNode
  className?: string
  title?: string
  icon?: ReactNode
}) {
  return (
    <section className={`pf-card p-5 ${className}`}>
      {title && (
        <header className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          {icon}
          {title}
        </header>
      )}
      {children}
    </section>
  )
}

export function PfSlider({
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

export function PfStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          className="px-3 py-2 text-lg font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))}
          className="w-full border-x border-slate-200 bg-transparent py-2 text-center text-lg font-black tabular-nums outline-none dark:border-slate-700"
        />
        <button
          type="button"
          className="px-3 py-2 text-lg font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </label>
  )
}

export function RollingDie({
  value,
  rolling,
  onRoll,
  label = 'Roll die',
}: {
  value: number
  rolling: boolean
  onRoll: () => void
  label?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={onRoll}
        aria-label={label}
        className={`rounded-[28px] transition ${rolling ? 'animate-[si-tumble-a_0.35s_linear_infinite]' : 'hover:-translate-y-0.5'}`}
      >
        <DieFace value={value} size={148} />
      </button>
      <button type="button" className="pf-btn" onClick={onRoll}>
        {label}
      </button>
    </div>
  )
}

export function CoinFace({ heads }: { heads: boolean }) {
  return (
    <div
      className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-3xl font-black text-amber-950 shadow-[0_12px_0_#d97706]"
      aria-hidden
    >
      {heads ? 'H' : 'T'}
    </div>
  )
}

export function PlayingCard({ label }: { label: string }) {
  const red = /[♥♦]/.test(label)
  return (
    <div
      className={`flex h-36 w-24 flex-col justify-between rounded-xl border bg-white p-2 shadow-lg ${red ? 'text-rose-600' : 'text-slate-900'}`}
      aria-hidden
    >
      <span className="text-lg font-black">{label}</span>
      <span className="self-center text-4xl">{label.slice(-1)}</span>
      <span className="self-end rotate-180 text-lg font-black">{label}</span>
    </div>
  )
}

export function FormulaBlock({ tex, label }: { tex: string; label?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center dark:bg-slate-800/80">
      <MathText value={tex} block label={label} />
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
              <span className="block text-xs text-slate-500">{item.detail}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function Insight({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-bold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}
