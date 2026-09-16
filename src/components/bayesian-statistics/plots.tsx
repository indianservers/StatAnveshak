import { useMemo } from 'react'
import { formatNum, type CredibleInterval, type DensityPoint } from '../../lib/bayesianStatistics'

type Series = {
  id: string
  label: string
  points: DensityPoint[]
  role?: 'prior' | 'likelihood' | 'posterior' | 'predictive' | 'other'
  color?: string
  dash?: string
}

const ROLE_STYLE: Record<NonNullable<Series['role']>, { color: string; dash: string; width: number }> = {
  prior: { color: '#2563eb', dash: '7 5', width: 2.2 },
  likelihood: { color: '#059669', dash: '2 4', width: 2.2 },
  posterior: { color: '#dc2626', dash: '', width: 2.6 },
  predictive: { color: '#7c3aed', dash: '', width: 2.4 },
  other: { color: '#64748b', dash: '', width: 2 },
}

function domain(values: number[], pad = 0.04): [number, number] {
  if (values.length === 0) return [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [min - 1, max + 1]
  const span = max - min
  return [min - span * pad, max + span * pad]
}

function ticks(min: number, max: number, count = 5): number[] {
  if (count <= 1) return [min]
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1))
}

function pathFrom(points: DensityPoint[], scaleX: (x: number) => number, scaleY: (y: number) => number): string {
  return points.map((point, i) => `${i === 0 ? 'M' : 'L'}${scaleX(point.x)} ${scaleY(point.y)}`).join(' ')
}

export function DensityChart({
  series,
  xLabel,
  yLabel = 'Density',
  height = 240,
  markers = [],
  shade,
  labels = true,
  ariaLabel = 'Density chart',
}: {
  series: Series[]
  xLabel?: string
  yLabel?: string
  height?: number
  markers?: Array<{ x: number; label: string; color?: string; dash?: string }>
  shade?: { lo: number; hi: number; color?: string }
  labels?: boolean
  ariaLabel?: string
}) {
  const width = 720
  const left = 46
  const right = width - 16
  const top = 22
  const bottom = height - 36
  const xs = series.flatMap((item) => item.points.map((p) => p.x))
  const ys = series.flatMap((item) => item.points.map((p) => p.y))
  const [x0, x1] = domain(xs)
  const yMax = Math.max(0.01, ...ys)
  const scaleX = (value: number) => left + ((value - x0) / (x1 - x0 || 1)) * (right - left)
  const scaleY = (value: number) => bottom - (value / yMax) * (bottom - top)

  const peakLabels = useMemo(() => {
    if (!labels) return []
    return series
      .filter((item) => item.points.length > 0)
      .map((item) => {
        const peak = item.points.reduce((best, point) => (point.y > best.y ? point : best))
        return { id: item.id, label: item.label, x: scaleX(peak.x), y: Math.max(14, scaleY(peak.y) - 10), color: item.color ?? ROLE_STYLE[item.role ?? 'other'].color }
      })
  }, [labels, series, x0, x1, yMax])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <text x="12" y="14" fontSize="10" fill="#94a3b8">
        {yLabel}
      </text>
      {ticks(0, yMax, 4).map((tick) => {
        const y = scaleY(tick)
        return (
          <g key={tick}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#eef2f7" />
            <text x={left - 6} y={y + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
              {formatNum(tick, 2)}
            </text>
          </g>
        )
      })}
      {shade && (
        <rect
          x={scaleX(shade.lo)}
          y={top}
          width={Math.max(1, scaleX(shade.hi) - scaleX(shade.lo))}
          height={bottom - top}
          fill={shade.color ?? '#93c5fd'}
          opacity="0.28"
        />
      )}
      {series.map((item) => {
        const style = ROLE_STYLE[item.role ?? 'other']
        return (
          <path
            key={item.id}
            d={pathFrom(item.points, scaleX, scaleY)}
            fill="none"
            stroke={item.color ?? style.color}
            strokeWidth={style.width}
            strokeDasharray={item.dash ?? style.dash}
            strokeLinecap="round"
          />
        )
      })}
      {markers.map((marker) => (
        <g key={`${marker.label}-${marker.x}`}>
          <line
            x1={scaleX(marker.x)}
            y1={top}
            x2={scaleX(marker.x)}
            y2={bottom}
            stroke={marker.color ?? '#0f172a'}
            strokeDasharray={marker.dash ?? '4 3'}
            strokeWidth="1.6"
          />
          <text x={scaleX(marker.x) + 4} y={top + 10} fontSize="10" fill={marker.color ?? '#334155'}>
            {marker.label}
          </text>
        </g>
      ))}
      {peakLabels.map((item) => (
        <text key={item.id} x={item.x} y={item.y} fontSize="11" fontWeight="700" fill={item.color} textAnchor="middle">
          {item.label}
        </text>
      ))}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      {ticks(x0, x1, 6).map((tick) => (
        <text key={tick} x={scaleX(tick)} y={bottom + 16} textAnchor="middle" fontSize="10" fill="#64748b">
          {formatNum(tick, Math.abs(x1 - x0) < 3 ? 2 : 1)}
        </text>
      ))}
      {xLabel && (
        <text x={(left + right) / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">
          {xLabel}
        </text>
      )}
    </svg>
  )
}

export function HistogramChart({
  bins,
  overlay,
  mean,
  xLabel,
  yLabel = 'Frequency',
  height = 220,
  ariaLabel = 'Histogram',
}: {
  bins: Array<{ x0: number; x1: number; mid: number; count: number }>
  overlay?: DensityPoint[]
  mean?: number
  xLabel?: string
  yLabel?: string
  height?: number
  ariaLabel?: string
}) {
  const width = 680
  const left = 44
  const right = width - 14
  const top = 16
  const bottom = height - 34
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count))
  const x0 = bins[0]?.x0 ?? 0
  const x1 = bins[bins.length - 1]?.x1 ?? 1
  const barW = Math.max(1, (right - left) / Math.max(bins.length, 1) - 1)
  const overlayMax = overlay ? Math.max(...overlay.map((p) => p.y), 1e-6) : 1
  const scaleX = (value: number) => left + ((value - x0) / (x1 - x0 || 1)) * (right - left)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <text x="12" y="14" fontSize="10" fill="#94a3b8">
        {yLabel}
      </text>
      {bins.map((bin) => {
        const h = (bin.count / maxCount) * (bottom - top)
        return (
          <rect
            key={bin.mid}
            x={scaleX(bin.x0) + 0.5}
            y={bottom - h}
            width={barW}
            height={h}
            rx="2"
            fill="#93c5fd"
          />
        )
      })}
      {overlay && (
        <path
          d={overlay
            .map((point, i) => {
              const x = scaleX(point.x)
              const y = bottom - (point.y / overlayMax) * (bottom - top) * 0.92
              return `${i === 0 ? 'M' : 'L'}${x} ${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        />
      )}
      {mean !== undefined && Number.isFinite(mean) && (
        <line x1={scaleX(mean)} y1={top} x2={scaleX(mean)} y2={bottom} stroke="#dc2626" strokeDasharray="4 3" />
      )}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      {ticks(x0, x1, 6).map((tick) => (
        <text key={tick} x={scaleX(tick)} y={bottom + 16} textAnchor="middle" fontSize="10" fill="#64748b">
          {formatNum(tick, Math.abs(x1 - x0) < 4 ? 2 : 1)}
        </text>
      ))}
      {xLabel && (
        <text x={(left + right) / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">
          {xLabel}
        </text>
      )}
    </svg>
  )
}

export function TraceChart({
  values,
  height = 180,
  ariaLabel = 'MCMC trace',
}: {
  values: number[]
  height?: number
  ariaLabel?: string
}) {
  const width = 680
  const left = 44
  const right = width - 12
  const top = 12
  const bottom = height - 28
  const [y0, y1] = domain(values, 0.08)
  const scaleX = (i: number) => left + (i / Math.max(values.length - 1, 1)) * (right - left)
  const scaleY = (v: number) => bottom - ((v - y0) / (y1 - y0 || 1)) * (bottom - top)
  const d = values.map((value, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)} ${scaleY(value)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {values.length > 1 && <path d={d} fill="none" stroke="#2563eb" strokeWidth="1.6" />}
      {values.length > 0 && (
        <circle cx={scaleX(values.length - 1)} cy={scaleY(values[values.length - 1])} r="3.4" fill="#2563eb" />
      )}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      <text x={(left + right) / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">
        Iteration
      </text>
    </svg>
  )
}

export function IntervalReadout({ interval }: { interval: CredibleInterval }) {
  return (
    <p className="text-sm font-semibold text-slate-600">
      {Math.round(interval.mass * 100)}% {interval.kind === 'hpd' ? 'HPD' : 'equal-tailed'} interval
      <span className="ml-2 tabular-nums text-slate-900 dark:text-white">
        [{formatNum(interval.lo, 3)}, {formatNum(interval.hi, 3)}]
      </span>
    </p>
  )
}

export function BalanceBar({
  prior,
  data,
}: {
  prior: number
  data: number
}) {
  const priorPct = clamp01(prior)
  const dataPct = clamp01(data)
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>Prior weight {formatNum(priorPct, 2)}</span>
        <span>Data weight {formatNum(dataPct, 2)}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-blue-500" style={{ width: `${priorPct * 100}%` }} />
        <div className="bg-emerald-500" style={{ width: `${dataPct * 100}%` }} />
      </div>
    </div>
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
