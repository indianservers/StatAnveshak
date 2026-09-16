import type { ReactNode } from 'react'
import type { Distribution } from '../../../lib/distributions'
import type { DistributionExperience } from '../../../lib/distributionExperiences'

export type LabProps = {
  dist: Distribution
  params: Record<string, number>
  onParam: (key: string, value: number) => void
  experience: DistributionExperience
  reduced: boolean
}

export const fmt = (value: number, digits = 3) => {
  if (!Number.isFinite(value)) return '—'
  return Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)
    ? value.toExponential(2)
    : value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function flatten(draws: Array<number | number[]>) {
  return draws.flatMap((item) => (Array.isArray(item) ? item : [item])).filter((value) => Number.isFinite(value))
}

export function StatGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="truncate text-sm font-black text-slate-900 dark:text-white">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RunRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

export function RunBtn({ onClick, children, primary }: { onClick: () => void; children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${
        primary ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}
