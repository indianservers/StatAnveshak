import { Activity, BookOpen, Lightbulb, PenLine, Table2, type LucideIcon } from 'lucide-react'

export const DIST_TABS = [
  { id: 'learn', label: 'Learn', icon: Lightbulb },
  { id: 'viz', label: 'Visualization', icon: Activity },
  { id: 'sample', label: 'Sample data', icon: Table2 },
  { id: 'formulas', label: 'Formulas', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: PenLine },
] as const

export type DistTabId = (typeof DIST_TABS)[number]['id']

export function isDistTabId(value: string | null): value is DistTabId {
  return DIST_TABS.some((tab) => tab.id === value)
}

export function tabFromQuery(value: string | null): DistTabId {
  if (value === 'how' || value === 'learn') return 'learn'
  return isDistTabId(value) ? value : 'learn'
}

export function DistTabBar({
  value,
  onChange,
}: {
  value: DistTabId
  onChange: (id: DistTabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Distribution lesson"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] dark:border-slate-800 dark:bg-slate-900 [&::-webkit-scrollbar]:hidden"
    >
      {DIST_TABS.map((tab) => {
        const Icon = tab.icon as LucideIcon
        const active = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`dist-tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`dist-panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon size={15} aria-hidden />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

const STYLES = `
@keyframes dl-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dl-rise { from { transform: scaleY(0.08); opacity: 0.4; } to { transform: scaleY(1); opacity: 1; } }
@keyframes dl-draw { 0% { stroke-dashoffset: 1; } 35% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
@keyframes dl-pop { from { opacity: 0; transform: scale(0.7) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes dl-flip { 0%, 100% { transform: rotateY(0deg); } 40% { transform: rotateY(180deg); } }
@keyframes dl-wobble { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(7deg); } }
@keyframes dl-breathe { 0%, 100% { transform: scaleY(0.55); } 50% { transform: scaleY(1); } }
@keyframes dl-pulse { 0%, 100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(1.25); opacity: 1; } }
@keyframes dl-fall { 0% { transform: translateY(-10px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(12px); opacity: 0.15; } }
@keyframes dl-tick { 0%, 20% { opacity: 0; transform: scale(0.5); } 40%, 100% { opacity: 1; transform: scale(1); } }

.dl-panel { animation: dl-in 0.32s ease-out both; }
.dl-step { animation: dl-in 0.4s ease-out both; }
.dl-chart-in .dl-bar { transform-box: fill-box; transform-origin: bottom; animation: dl-rise 0.5s ease-out both; }
.dl-chart-in .dl-line { animation: dl-draw 0.7s ease-out both; }
.dl-chip { animation: dl-pop 0.35s ease-out both; }
.dl-hero-on .dl-coin { animation: dl-flip 2.8s ease-in-out infinite; transform-style: preserve-3d; }
.dl-hero-on .dl-coin-b { animation: dl-wobble 2.4s ease-in-out infinite; }
.dl-hero-on svg .dl-bar { transform-box: fill-box; transform-origin: bottom; animation: dl-breathe 1.8s ease-in-out infinite; }
.dl-hero-on .dl-dot { animation: dl-pulse 1.8s ease-in-out infinite; }
.dl-hero-on .dl-mark { animation: dl-tick 2s ease-out infinite; }
.dl-hero-on .dl-drop { animation: dl-fall 2s ease-in infinite; }
.dl-hero-on .dl-trace { stroke-dasharray: 1; animation: dl-draw 2.6s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .dl-panel, .dl-step, .dl-chart-in .dl-bar, .dl-chart-in .dl-line, .dl-chip, .dl-hero-on * { animation: none !important; }
}
.motion-reduced .dl-panel,
.motion-reduced .dl-step,
.motion-reduced .dl-chart-in .dl-bar,
.motion-reduced .dl-chart-in .dl-line,
.motion-reduced .dl-chip,
.motion-reduced .dl-hero-on * { animation: none !important; }
`

export function DistLessonStyles() {
  return <style>{STYLES}</style>
}
