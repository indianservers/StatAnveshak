import { useId } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Hero visualization for the Studios home: a histogram breathing under a normal curve with
 * sample points dropping in. Pure SVG + CSS keyframes so it costs nothing at runtime and
 * freezes to a clean static picture when reduced motion is requested.
 */

const HERO_STYLES = `
@keyframes sh-breathe { 0%, 100% { transform: scaleY(0.58); } 50% { transform: scaleY(1); } }
@keyframes sh-drop { 0% { transform: translateY(-26px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(34px); opacity: 0; } }
@keyframes sh-trace { 0% { stroke-dashoffset: 100; } 45%, 100% { stroke-dashoffset: 0; } }
@keyframes sh-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

.sh-art .sh-bar { transform-box: fill-box; transform-origin: bottom; }
.sh-art .sh-dot { transform-box: fill-box; }
.sh-live .sh-bar { animation: sh-breathe 4.2s ease-in-out infinite; }
.sh-live .sh-dot { animation: sh-drop 3.4s ease-in infinite; }
.sh-live .sh-curve { animation: sh-trace 4.2s ease-out infinite; }
.sh-live .sh-float { animation: sh-float 5s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .sh-art * { animation: none !important; }
}
.motion-reduced .sh-art * { animation: none !important; }
`

const SCRIPT_FONT = "'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive"

const BAR_HEIGHTS = [7, 17, 37, 69, 106, 138, 150, 138, 106, 69, 37, 17, 7]

export function StudiosHeroArt() {
  const reducedMotion = useReducedMotion()
  const gradientId = `sh-grad-${useId()}`

  return (
    <div className="relative min-h-[220px] w-full sm:min-h-[260px]">
      <style>{HERO_STYLES}</style>

      <svg
        viewBox="0 0 420 240"
        className={`sh-art h-full w-full ${reducedMotion ? '' : 'sh-live'}`}
        role="img"
        aria-label="A histogram of sample data settling under a normal bell curve, with new sample points dropping in."
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="28%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#818cf8" />
            <stop offset="78%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        <line x1="12" y1="202" x2="408" y2="202" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

        {BAR_HEIGHTS.map((height, index) => (
          <rect
            key={index}
            className="sh-bar"
            x={20 + index * 30}
            y={200 - height}
            width="24"
            height={height}
            rx="5"
            fill={`url(#${gradientId})`}
            opacity={0.85}
            style={{ animationDelay: `${index * 0.09}s` }}
          />
        ))}

        <path
          className="sh-curve"
          pathLength={100}
          strokeDasharray="100"
          d="M14 200 C 74 198, 104 54, 210 50 C 316 46, 346 198, 406 200"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {[140, 200, 260].map((cx, index) => (
          <circle
            key={cx}
            className="sh-dot"
            cx={cx}
            cy="60"
            r="5"
            fill="#4f46e5"
            style={{ animationDelay: `${index * 0.9}s` }}
          />
        ))}
      </svg>

      <span
        aria-hidden
        className="sh-float pointer-events-none absolute left-[6%] top-[2%] -rotate-6 text-sm font-semibold text-slate-400 sm:text-base"
        style={{ fontFamily: SCRIPT_FONT }}
      >
        Explore
      </span>
      <span
        aria-hidden
        className="sh-float pointer-events-none absolute right-[16%] top-0 rotate-3 text-sm font-semibold text-slate-400 sm:text-base"
        style={{ fontFamily: SCRIPT_FONT, animationDelay: '1.2s' }}
      >
        Learn
      </span>
      <span
        aria-hidden
        className="sh-float pointer-events-none absolute left-[24%] top-[42%] -rotate-3 text-sm font-semibold text-slate-400 sm:text-base"
        style={{ fontFamily: SCRIPT_FONT, animationDelay: '2.1s' }}
      >
        Apply
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[2%] right-[4%] -rotate-6 text-right text-xs font-semibold leading-5 text-slate-400 sm:text-sm"
        style={{ fontFamily: SCRIPT_FONT }}
      >
        From data
        <br />
        to understanding
      </span>
    </div>
  )
}

/** Compact "why this exists" card that sits beside the hero art in the mockup. */
export function HeroPromiseCard() {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden focusable="false">
          <rect x="3" y="13" width="4" height="8" rx="1.2" fill="#6366f1" />
          <rect x="10" y="8" width="4" height="13" rx="1.2" fill="#8b5cf6" />
          <rect x="17" y="3" width="4" height="18" rx="1.2" fill="#22d3ee" />
        </svg>
      </span>
      <ul className="space-y-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <li>Real data</li>
        <li>Real concepts</li>
        <li>Lasting intuition</li>
      </ul>
    </div>
  )
}
