import { HelpCircle, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { MathText } from '../ui/MathText'
import type { LessonPlayback } from './useLessonPlayback'

export function LessonSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  effect,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  effect: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="font-mono text-sm tabular-nums text-indigo-700 dark:text-indigo-300">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 w-full accent-indigo-600"
      />
      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{effect}</span>
    </label>
  )
}

export function LessonChoice<T extends string>({
  label,
  value,
  options,
  effect,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ id: T; label: string }>
  effect: string
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${
              value === option.id
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{effect}</p>
    </fieldset>
  )
}

export function LessonPlayBar({ playback }: { playback: LessonPlayback }) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={playback.togglePlay}
        className="inline-flex min-h-11 min-w-24 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white hover:bg-indigo-700"
      >
        {playback.playing ? <Pause size={16} /> : <Play size={16} />}
        {playback.playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        onClick={playback.step}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        title="Step one draw"
      >
        <SkipForward size={16} />
        <span className="sr-only">Step</span>
      </button>
      <button
        type="button"
        onClick={playback.reset}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <RotateCcw size={14} />
        Reset
      </button>
      <button
        type="button"
        onClick={playback.toggleSlowMo}
        className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold ${
          playback.slowMo
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300'
        }`}
      >
        Slow-mo
      </button>
      <button
        type="button"
        onClick={() => setHelpOpen((value) => !value)}
        className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        aria-expanded={helpOpen}
        title="Lesson keys"
      >
        <HelpCircle size={16} />
      </button>
      {helpOpen && (
        <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-2 font-semibold text-slate-500">Stage keys</p>
          {[
            ['Space', 'Play / pause'],
            ['← / →', 'Step'],
            ['R', 'Reset story'],
          ].map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-slate-300">{label}</span>
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-700">{keys}</kbd>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LessonCaption({
  formula,
  readout,
  misuse,
}: {
  formula: string
  readout: ReactNode
  misuse: string
}) {
  return (
    <div className="lesson-caption grid gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60 md:grid-cols-3">
      <p className="min-w-0 text-sm text-slate-700 dark:text-slate-200">
        <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">Formula</span>
        <MathText value={formula} />
      </p>
      <p className="text-sm text-slate-700 dark:text-slate-200" role="status" aria-live="polite">
        <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">Readout</span>
        {readout}
      </p>
      <p className="text-sm text-amber-800 dark:text-amber-200">
        <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">If you break it</span>
        {misuse}
      </p>
    </div>
  )
}
