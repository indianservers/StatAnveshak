import { useId, type ReactElement } from 'react'
import type { StudioIconId } from '../../lib/statisticsStudios'
import { useReducedMotion } from './useReducedMotion'

/**
 * Concept visualizations for the Probability & Statistics Studios.
 *
 * Every icon is plain SVG animated with CSS only, so a page holding all eighteen of them
 * costs no JavaScript timers and no animation library. Motion is opt-in: the `si-on` class
 * is applied on hover/focus and withheld entirely when the user prefers reduced motion.
 */

const ICON_STYLES = `
.si-root { width: 100%; height: 100%; overflow: visible; }
.si-root * { transform-box: fill-box; transform-origin: center; }

@keyframes si-tumble-a { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(5deg); } }
@keyframes si-tumble-b { 0%, 100% { transform: rotate(6deg); } 50% { transform: rotate(-8deg); } }
@keyframes si-rise { 0%, 100% { transform: scaleY(0.72); } 50% { transform: scaleY(1); } }
@keyframes si-drift-right { 0% { transform: translateX(0); opacity: 0.35; } 60% { opacity: 1; } 100% { transform: translateX(26px); opacity: 0.35; } }
@keyframes si-pulse { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.45); opacity: 1; } }
@keyframes si-fall { 0% { transform: translateY(-14px); opacity: 0; } 35% { opacity: 1; } 100% { transform: translateY(16px); opacity: 0; } }
@keyframes si-slide-x { 0%, 100% { transform: translateX(-6px); } 50% { transform: translateX(6px); } }
@keyframes si-shade { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.8; } }
@keyframes si-narrow { 0%, 100% { transform: scaleX(1); opacity: 0.45; } 50% { transform: scaleX(0.55); opacity: 1; } }
@keyframes si-converge { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(0, var(--si-dy, 0px)); } }
@keyframes si-pivot { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(4deg); } }
@keyframes si-stem { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.25); } }
@keyframes si-spread { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(var(--si-dx, 0px)); } }
@keyframes si-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-32px); } }
@keyframes si-draw { 0% { stroke-dashoffset: 100; } 55%, 100% { stroke-dashoffset: 0; } }
@keyframes si-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes si-tilt { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(18deg); } }
@keyframes si-appear { 0%, 20% { opacity: 0; transform: scale(0.4); } 45%, 100% { opacity: 1; transform: scale(1); } }
@keyframes si-swing { 0%, 100% { transform: rotate(-24deg); } 50% { transform: rotate(24deg); } }
@keyframes si-morph { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(var(--si-sy, 1)); } }

.si-on .si-die-a { animation: si-tumble-a 2.4s ease-in-out infinite; }
.si-on .si-die-b { animation: si-tumble-b 2.4s ease-in-out infinite; }
.si-on .si-bar { animation: si-rise 2s ease-in-out infinite; }
.si-on .si-migrate { animation: si-drift-right 2.6s ease-in-out infinite; }
.si-on .si-picked { animation: si-pulse 1.8s ease-in-out infinite; }
.si-on .si-drop { animation: si-fall 2.2s ease-in infinite; }
.si-on .si-interval { animation: si-slide-x 2.8s ease-in-out infinite; }
.si-on .si-region { animation: si-shade 2.2s ease-in-out infinite; }
.si-on .si-posterior { animation: si-narrow 2.8s ease-in-out infinite; }
.si-on .si-point { animation: si-converge 2.6s ease-in-out infinite; }
.si-on .si-line { animation: si-pivot 2.8s ease-in-out infinite; }
.si-on .si-resid { animation: si-stem 2.4s ease-in-out infinite; }
.si-on .si-group { animation: si-spread 2.6s ease-in-out infinite; }
.si-on .si-wave { animation: si-scroll 3.2s linear infinite; }
.si-on .si-trace { animation: si-draw 2.8s ease-out infinite; }
.si-on .si-ellipse { animation: si-tilt 3.4s ease-in-out infinite; }
.si-on .si-spin { animation: si-rotate 6s linear infinite; }
.si-on .si-spark { animation: si-appear 2.4s ease-out infinite; }
.si-on .si-needle { animation: si-swing 2.6s ease-in-out infinite; }
.si-on .si-morph { animation: si-morph 2.6s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .si-root *, .si-on * { animation: none !important; }
}
.motion-reduced .si-root *, .motion-reduced .si-on * { animation: none !important; }
`

/** Render once per page; the browser dedupes the identical rule set anyway. */
export function StudioIconStyles() {
  return <style>{ICON_STYLES}</style>
}

const AXIS = '#cbd5e1'

function Axis() {
  return (
    <>
      <line x1="5" y1="41" x2="59" y2="41" stroke={AXIS} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="7" x2="5" y2="41" stroke={AXIS} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )
}

function DiceIcon() {
  return (
    <>
      <g className="si-die-a">
        <rect x="5" y="12" width="25" height="25" rx="6" fill="#ef4444" />
        {[
          [11, 18],
          [24, 18],
          [17.5, 24.5],
          [11, 31],
          [24, 31],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.4" fill="#fff" />
        ))}
      </g>
      <g className="si-die-b">
        <rect x="33" y="17" width="21" height="21" rx="5" fill="#fb7185" />
        {[
          [38.5, 22.5],
          [43.5, 27.5],
          [48.5, 32.5],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="#fff" />
        ))}
      </g>
    </>
  )
}

function RandomVariablesIcon() {
  const bars = [
    { x: 7, h: 12 },
    { x: 15, h: 21 },
    { x: 23, h: 15 },
  ]
  return (
    <>
      <Axis />
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          className="si-bar"
          x={bar.x}
          y={40 - bar.h}
          width="6"
          height={bar.h}
          rx="1.8"
          fill="#818cf8"
          style={{ animationDelay: `${index * 0.18}s`, transformOrigin: 'bottom' }}
        />
      ))}
      <path d="M33 40 C 39 40 39 15 45 15 C 51 15 51 40 57 40" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" />
      {[0, 1, 2].map((index) => (
        <circle
          key={index}
          className="si-migrate"
          cx={26}
          cy={22 + index * 6}
          r="2.2"
          fill="#c4b5fd"
          style={{ animationDelay: `${index * 0.35}s` }}
        />
      ))}
    </>
  )
}

function DescriptiveIcon() {
  const bars = [10, 19, 27, 22, 13]
  return (
    <>
      <Axis />
      {bars.map((h, index) => (
        <rect
          key={index}
          className="si-bar"
          x={9 + index * 10}
          y={40 - h}
          width="7"
          height={h}
          rx="2"
          fill={index === 2 ? '#059669' : '#34d399'}
          style={{ animationDelay: `${index * 0.14}s`, transformOrigin: 'bottom' }}
        />
      ))}
      <line x1="9" y1="11" x2="56" y2="11" stroke="#047857" strokeWidth="1.6" strokeDasharray="3 3" />
    </>
  )
}

function SamplingIcon() {
  const picked = new Set([3, 7, 12, 16])
  return (
    <>
      {Array.from({ length: 20 }, (_, index) => {
        const col = index % 5
        const row = Math.floor(index / 5)
        const isPicked = picked.has(index)
        return (
          <circle
            key={index}
            className={isPicked ? 'si-picked' : undefined}
            cx={10 + col * 11}
            cy={11 + row * 9}
            r={isPicked ? 3.4 : 3}
            fill={isPicked ? '#2563eb' : '#bfdbfe'}
            style={isPicked ? { animationDelay: `${(index % 4) * 0.25}s` } : undefined}
          />
        )
      })}
    </>
  )
}

function CltIcon() {
  return (
    <>
      <Axis />
      <path d="M7 40 C 19 40 20 9 32 9 C 44 9 45 40 57 40" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.4" strokeLinejoin="round" />
      {[24, 32, 40].map((cx, index) => (
        <circle
          key={cx}
          className="si-drop"
          cx={cx}
          cy="18"
          r="2.4"
          fill="#a78bfa"
          style={{ animationDelay: `${index * 0.5}s` }}
        />
      ))}
    </>
  )
}

function IntervalIcon() {
  const rows = [14, 24, 34]
  return (
    <>
      <line x1="32" y1="6" x2="32" y2="42" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="3 3" />
      {rows.map((y, index) => (
        <g key={y} className="si-interval" style={{ animationDelay: `${index * 0.45}s` }}>
          <line x1="12" y1={y} x2="50" y2={y} stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1={y - 4} x2="12" y2={y + 4} stroke="#0f766e" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="50" y1={y - 4} x2="50" y2={y + 4} stroke="#0f766e" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="31" cy={y} r="2.6" fill="#0f766e" />
        </g>
      ))}
    </>
  )
}

function HypothesisIcon() {
  return (
    <>
      <Axis />
      <path d="M6 40 C 16 40 17 13 27 13 C 37 13 38 40 48 40 Z" fill="#c4b5fd" opacity="0.55" stroke="#7c3aed" strokeWidth="2" />
      <path d="M20 40 C 30 40 31 16 41 16 C 51 16 52 40 60 40 Z" fill="#fda4af" opacity="0.6" stroke="#e11d48" strokeWidth="2" />
      <path className="si-region" d="M46 40 C 51 39 54 30 56 24 L 56 40 Z" fill="#e11d48" />
    </>
  )
}

function BayesIcon() {
  return (
    <>
      <Axis />
      <path d="M7 40 C 20 40 20 20 32 20 C 44 20 44 40 57 40" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="4 3" />
      <path
        className="si-posterior"
        d="M16 40 C 26 40 26 8 32 8 C 38 8 38 40 48 40 Z"
        fill="#d946ef"
        opacity="0.55"
        stroke="#a21caf"
        strokeWidth="2"
        style={{ transformOrigin: 'bottom' }}
      />
    </>
  )
}

function CorrelationIcon() {
  const points: Array<[number, number, number]> = [
    [12, 33, 5],
    [19, 30, -3],
    [26, 26, 6],
    [33, 23, -5],
    [40, 18, 4],
    [47, 14, -4],
    [53, 11, 3],
  ]
  return (
    <>
      <Axis />
      <line x1="9" y1="36" x2="57" y2="9" stroke="#0891b2" strokeWidth="2" opacity="0.5" />
      {points.map(([cx, cy, dy], index) => (
        <circle
          key={cx}
          className="si-point"
          cx={cx}
          cy={cy}
          r="2.8"
          fill="#06b6d4"
          style={{ ['--si-dy' as string]: `${dy}px`, animationDelay: `${index * 0.08}s` }}
        />
      ))}
    </>
  )
}

function RegressionIcon() {
  const points: Array<[number, number]> = [
    [14, 32],
    [23, 29],
    [32, 22],
    [41, 19],
    [50, 12],
  ]
  return (
    <>
      <Axis />
      {points.map(([cx, cy], index) => (
        <rect
          key={`r-${cx}`}
          className="si-resid"
          x={cx - 1}
          y={Math.min(cy, 38 - cx * 0.52)}
          width="2"
          height={Math.abs(cy - (38 - cx * 0.52)) || 3}
          fill="#93c5fd"
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
      <line className="si-line" x1="9" y1="34" x2="57" y2="11" stroke="#2563eb" strokeWidth="2.6" strokeLinecap="round" />
      {points.map(([cx, cy]) => (
        <circle key={`p-${cx}`} cx={cx} cy={cy} r="2.8" fill="#1d4ed8" />
      ))}
    </>
  )
}

function AnovaIcon() {
  const groups = [
    { x: 0, color: '#fb923c', dx: -5 },
    { x: 18, color: '#a78bfa', dx: 0 },
    { x: 36, color: '#60a5fa', dx: 5 },
  ]
  return (
    <>
      <Axis />
      {groups.map((group, index) => (
        <g
          key={group.x}
          className="si-group"
          style={{ ['--si-dx' as string]: `${group.dx}px`, animationDelay: `${index * 0.2}s` }}
        >
          <line x1={13 + group.x} y1="12" x2={13 + group.x} y2="38" stroke={group.color} strokeWidth="1.5" />
          <rect x={9 + group.x} y={18 - index * 2} width="9" height="14" rx="2.5" fill={group.color} opacity="0.85" />
          <line x1={9 + group.x} y1={25 - index * 2} x2={18 + group.x} y2={25 - index * 2} stroke="#1e293b" strokeWidth="1.8" />
        </g>
      ))}
    </>
  )
}

function TimeSeriesIcon() {
  const clipId = `si-ts-${useId()}`
  const wave = 'M0 28 C 6 18 10 36 16 26 C 22 16 26 34 32 24 C 38 14 42 32 48 22 C 54 12 58 30 64 20'
  return (
    <>
      <Axis />
      <clipPath id={clipId}>
        <rect x="6" y="6" width="52" height="35" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g className="si-wave">
          <path d={wave} fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" />
          <path d={wave} fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" transform="translate(64 0)" />
        </g>
      </g>
      <line x1="6" y1="33" x2="58" y2="17" stroke="#b45309" strokeWidth="1.8" strokeDasharray="4 3" />
    </>
  )
}

function RanksIcon() {
  const bars = [26, 21, 17, 13, 9]
  return (
    <>
      <Axis />
      {bars.map((h, index) => (
        <g key={index}>
          <rect
            className="si-bar"
            x={10}
            y={9 + index * 7}
            width={h + 14}
            height="5"
            rx="2.5"
            fill={index === 0 ? '#65a30d' : '#a3e635'}
            style={{ animationDelay: `${index * 0.16}s`, transformOrigin: 'left' }}
          />
          <text x={10 + h + 18} y={13.6 + index * 7} fontSize="5" fontWeight="700" fill="#4d7c0f">
            {index + 1}
          </text>
        </g>
      ))}
    </>
  )
}

function SurvivalIcon() {
  return (
    <>
      <Axis />
      <path
        className="si-trace"
        pathLength={100}
        strokeDasharray="100"
        d="M6 10 H 16 V 17 H 26 V 23 H 34 V 30 H 44 V 35 H 58"
        fill="none"
        stroke="#e11d48"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="26" cy="23" r="2.2" fill="#9f1239" />
      <circle cx="44" cy="35" r="2.2" fill="#9f1239" />
    </>
  )
}

function MultivariateIcon() {
  const cloud: Array<[number, number]> = [
    [22, 28],
    [28, 22],
    [33, 26],
    [38, 20],
    [26, 31],
    [43, 24],
    [31, 18],
    [36, 30],
  ]
  return (
    <>
      <Axis />
      <ellipse className="si-ellipse" cx="32" cy="24" rx="20" ry="9" fill="#ddd6fe" opacity="0.7" stroke="#7c3aed" strokeWidth="1.8" />
      {cloud.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.3" fill="#6d28d9" />
      ))}
    </>
  )
}

function SimulationIcon() {
  const dots: Array<[number, number, boolean]> = [
    [16, 30, true],
    [23, 20, true],
    [30, 27, true],
    [37, 16, false],
    [44, 31, false],
    [20, 13, true],
    [40, 24, false],
    [50, 19, false],
  ]
  return (
    <>
      <rect x="9" y="8" width="46" height="33" rx="5" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.6" />
      <path d="M9 41 A 46 33 0 0 0 55 8" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeDasharray="3 3" />
      {dots.map(([cx, cy, inside], index) => (
        <circle
          key={`${cx}-${cy}`}
          className="si-spark"
          cx={cx}
          cy={cy}
          r="2.4"
          fill={inside ? '#4f46e5' : '#a5b4fc'}
          style={{ animationDelay: `${index * 0.22}s` }}
        />
      ))}
    </>
  )
}

function QualityIcon() {
  const points: Array<[number, number, boolean]> = [
    [12, 26, false],
    [20, 22, false],
    [28, 28, false],
    [36, 24, false],
    [44, 12, true],
    [52, 25, false],
  ]
  return (
    <>
      <line x1="6" y1="12" x2="58" y2="12" stroke="#f43f5e" strokeWidth="1.6" strokeDasharray="4 3" />
      <line x1="6" y1="25" x2="58" y2="25" stroke="#0d9488" strokeWidth="1.8" />
      <line x1="6" y1="38" x2="58" y2="38" stroke="#f43f5e" strokeWidth="1.6" strokeDasharray="4 3" />
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map(([cx, cy, alert]) => (
        <circle
          key={cx}
          className={alert ? 'si-picked' : undefined}
          cx={cx}
          cy={cy}
          r={alert ? 3.2 : 2.4}
          fill={alert ? '#e11d48' : '#0f766e'}
        />
      ))}
    </>
  )
}

function DistributionsIcon() {
  const bars = [
    { x: 8, h: 9, sy: 0.55 },
    { x: 17, h: 18, sy: 0.72 },
    { x: 26, h: 28, sy: 1.15 },
    { x: 35, h: 22, sy: 0.85 },
    { x: 44, h: 13, sy: 0.6 },
  ]
  return (
    <>
      <Axis />
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          className="si-morph"
          x={bar.x}
          y={40 - bar.h}
          width="7.5"
          height={bar.h}
          rx="2"
          fill={index === 2 ? '#7c3aed' : '#a78bfa'}
          style={{ ['--si-sy' as string]: bar.sy, animationDelay: `${index * 0.12}s`, transformOrigin: 'bottom' }}
        />
      ))}
      <path d="M6 40 C 18 40 19 8 31 8 C 43 8 44 40 58 40" fill="none" stroke="#4f46e5" strokeWidth="2.4" strokeLinecap="round" />
    </>
  )
}

const ICONS: Record<StudioIconId, () => ReactElement> = {
  dice: DiceIcon,
  randomVariables: RandomVariablesIcon,
  descriptive: DescriptiveIcon,
  sampling: SamplingIcon,
  clt: CltIcon,
  interval: IntervalIcon,
  hypothesis: HypothesisIcon,
  bayes: BayesIcon,
  correlation: CorrelationIcon,
  regression: RegressionIcon,
  anova: AnovaIcon,
  timeSeries: TimeSeriesIcon,
  ranks: RanksIcon,
  survival: SurvivalIcon,
  multivariate: MultivariateIcon,
  simulation: SimulationIcon,
  quality: QualityIcon,
  distributions: DistributionsIcon,
}

/** Short text equivalents so the visualization is not the only way to read the card. */
const ICON_DESCRIPTIONS: Record<StudioIconId, string> = {
  dice: 'Two dice representing random outcomes',
  randomVariables: 'Discrete bars becoming a continuous density curve',
  descriptive: 'A histogram with a summary line across it',
  sampling: 'A population of dots with a sample highlighted',
  clt: 'Sample means dropping into a bell curve',
  interval: 'Confidence intervals sliding around a fixed true value',
  hypothesis: 'Null and alternative curves with a shaded rejection region',
  bayes: 'A wide prior curve tightening into a narrower posterior',
  correlation: 'A scatter of points around a trend line',
  regression: 'A fitted line with residual stems to each point',
  anova: 'Three group distributions separating from one another',
  timeSeries: 'A moving waveform with a trend line',
  ranks: 'Observations ordered into ranked bars',
  survival: 'A survival curve stepping down over time',
  multivariate: 'A point cloud inside a rotating covariance ellipse',
  simulation: 'Monte Carlo points accumulating inside a region',
  quality: 'A control chart with one point outside the limits',
  distributions: 'A histogram morphing under a bell curve',
}

export function StudioIcon({
  icon,
  active = false,
  className = '',
}: {
  icon: StudioIconId
  active?: boolean
  className?: string
}) {
  const reducedMotion = useReducedMotion()
  const Glyph = ICONS[icon]
  const animate = active && !reducedMotion

  return (
    <svg
      viewBox="0 0 64 48"
      className={`si-root ${animate ? 'si-on' : ''} ${className}`}
      role="img"
      aria-label={ICON_DESCRIPTIONS[icon]}
      focusable="false"
    >
      <Glyph />
    </svg>
  )
}
