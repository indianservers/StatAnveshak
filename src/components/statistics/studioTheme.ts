import type { StudioAccent, StudioLevel } from '../../lib/statisticsStudios'

type AccentTokens = {
  /** Soft tinted surface behind the concept visualization. */
  wash: string
  /** Chip/badge treatment. */
  chip: string
  /** Border used when a card is hovered or focused. */
  ring: string
  /** Bar used as a category rule. */
  rule: string
}

export const ACCENTS: Record<StudioAccent, AccentTokens> = {
  indigo: {
    wash: 'bg-indigo-50/70 dark:bg-indigo-950/30',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    ring: 'hover:border-indigo-300 focus-visible:border-indigo-400 dark:hover:border-indigo-700',
    rule: 'bg-indigo-500',
  },
  violet: {
    wash: 'bg-violet-50/70 dark:bg-violet-950/30',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    ring: 'hover:border-violet-300 focus-visible:border-violet-400 dark:hover:border-violet-700',
    rule: 'bg-violet-500',
  },
  fuchsia: {
    wash: 'bg-fuchsia-50/70 dark:bg-fuchsia-950/30',
    chip: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300',
    ring: 'hover:border-fuchsia-300 focus-visible:border-fuchsia-400 dark:hover:border-fuchsia-700',
    rule: 'bg-fuchsia-500',
  },
  emerald: {
    wash: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    ring: 'hover:border-emerald-300 focus-visible:border-emerald-400 dark:hover:border-emerald-700',
    rule: 'bg-emerald-500',
  },
  teal: {
    wash: 'bg-teal-50/70 dark:bg-teal-950/30',
    chip: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    ring: 'hover:border-teal-300 focus-visible:border-teal-400 dark:hover:border-teal-700',
    rule: 'bg-teal-500',
  },
  cyan: {
    wash: 'bg-cyan-50/70 dark:bg-cyan-950/30',
    chip: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
    ring: 'hover:border-cyan-300 focus-visible:border-cyan-400 dark:hover:border-cyan-700',
    rule: 'bg-cyan-500',
  },
  sky: {
    wash: 'bg-sky-50/70 dark:bg-sky-950/30',
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    ring: 'hover:border-sky-300 focus-visible:border-sky-400 dark:hover:border-sky-700',
    rule: 'bg-sky-500',
  },
  blue: {
    wash: 'bg-blue-50/70 dark:bg-blue-950/30',
    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    ring: 'hover:border-blue-300 focus-visible:border-blue-400 dark:hover:border-blue-700',
    rule: 'bg-blue-500',
  },
  amber: {
    wash: 'bg-amber-50/70 dark:bg-amber-950/30',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    ring: 'hover:border-amber-300 focus-visible:border-amber-400 dark:hover:border-amber-700',
    rule: 'bg-amber-500',
  },
  orange: {
    wash: 'bg-orange-50/70 dark:bg-orange-950/30',
    chip: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    ring: 'hover:border-orange-300 focus-visible:border-orange-400 dark:hover:border-orange-700',
    rule: 'bg-orange-500',
  },
  rose: {
    wash: 'bg-rose-50/70 dark:bg-rose-950/30',
    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    ring: 'hover:border-rose-300 focus-visible:border-rose-400 dark:hover:border-rose-700',
    rule: 'bg-rose-500',
  },
  lime: {
    wash: 'bg-lime-50/70 dark:bg-lime-950/30',
    chip: 'bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300',
    ring: 'hover:border-lime-300 focus-visible:border-lime-400 dark:hover:border-lime-700',
    rule: 'bg-lime-500',
  },
}

export const LEVEL_LABELS: Record<StudioLevel, string> = {
  intro: 'Intro',
  core: 'Core',
  advanced: 'Advanced',
}

export const LEVEL_CLASSES: Record<StudioLevel, string> = {
  intro: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  core: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900',
  advanced: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900',
}

export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950'
