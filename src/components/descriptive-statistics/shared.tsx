import { useEffect, useId, useState, type ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { MathText } from '../ui/MathText'
import {
  DS_PRESETS,
  formatList,
  loadSharedData,
  parseNumbers,
  saveSharedData,
  type DsPresetId,
} from '../../lib/descriptiveStatistics'

export function DsCard({
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
    <section className={`ds-card p-5 ${className}`}>
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

export function DsSlider({
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

export function DsSelect({
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
      <select className="ds-select" value={value} onChange={(event) => onChange(event.target.value)}>
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
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: accent ?? undefined }}>
        {value}
      </p>
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

export function DataChips({
  values,
  selected,
  onSelect,
  onRemove,
}: {
  values: number[]
  selected?: number | null
  onSelect?: (index: number) => void
  onRemove?: (index: number) => void
}) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Dataset values">
      {values.map((value, index) => (
        <li key={`${value}-${index}`}>
          <button
            type="button"
            onClick={() => onSelect?.(index)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
              selected === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
            }`}
          >
            {value}
            {onRemove && (
              <span
                className="ml-1 text-[10px] opacity-70"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(index)
                }}
              >
                ×
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}

export function DatasetEditor({
  values,
  onChange,
  presets = ['shared', 'center', 'symmetric', 'rightSkew', 'leftSkew', 'outliers', 'lowSpread', 'highSpread', 'bimodal'],
  fallback,
}: {
  values: number[]
  onChange: (next: number[]) => void
  presets?: DsPresetId[]
  fallback: number[]
}) {
  const [draft, setDraft] = useState(formatList(values, 4))
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(values.join(', '))
  }, [values])

  const apply = (next: number[]) => {
    onChange(next)
    setDraft(next.join(', '))
    saveSharedData(next)
    setError(next.length === 0 ? 'Enter at least one number.' : '')
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Data (comma or space separated)</span>
        <textarea
          className="ds-textarea"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Dataset values"
        />
      </label>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ds-btn"
          onClick={() => {
            const parsed = parseNumbers(draft)
            if (parsed.invalid.length) setError(`Ignored: ${parsed.invalid.join(', ')}`)
            else setError(parsed.values.length === 0 ? 'Enter at least one number.' : '')
            if (parsed.values.length) apply(parsed.values)
          }}
        >
          Update data
        </button>
        <button type="button" className="ds-btn ds-btn-ghost" onClick={() => apply([...values].sort((a, b) => a - b))}>
          Sort
        </button>
        <button type="button" className="ds-btn ds-btn-ghost" onClick={() => apply([...fallback])}>
          Reset
        </button>
      </div>
      <DsSelect
        label="Preset"
        value=""
        onChange={(id) => {
          if (!id) return
          apply(id === 'shared' ? loadSharedData() : [...DS_PRESETS[id as DsPresetId].values])
        }}
        options={[{ value: '', label: 'Load a preset…' }, ...presets.map((id) => ({ value: id, label: DS_PRESETS[id].label }))]}
      />
    </div>
  )
}
