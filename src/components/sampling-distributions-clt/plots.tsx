import { useEffect, useRef } from 'react'
import { formatNum, type HistBin } from '../../lib/samplingDistributionsClt'

type PlotBase = { width?: number; height?: number; className?: string }

function domain(values: number[], pad = 0.06): [number, number] {
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

export function HistogramChart({
  bins,
  mean,
  overlay,
  xLabel,
  yLabel = 'Frequency',
  height = 220,
  className = '',
  ariaLabel = 'Histogram',
}: PlotBase & {
  bins: HistBin[]
  mean?: number
  overlay?: Array<{ x: number; y: number }>
  xLabel?: string
  yLabel?: string
  ariaLabel?: string
}) {
  const width = 640
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
  const overlayPath = overlay
    ?.map((point, i) => {
      const x = scaleX(point.x)
      const y = bottom - (point.y / overlayMax) * (bottom - top) * 0.92
      return `${i === 0 ? 'M' : 'L'}${x} ${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-auto w-full ${className}`} role="img" aria-label={ariaLabel}>
      <text x="12" y="14" fontSize="10" fill="#94a3b8">
        {yLabel}
      </text>
      {ticks(0, maxCount, 4).map((tick) => {
        const y = bottom - (tick / maxCount) * (bottom - top)
        return (
          <g key={tick}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#eef2f7" />
            <text x={left - 6} y={y + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
              {formatNum(tick, tick >= 10 ? 0 : 1)}
            </text>
          </g>
        )
      })}
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
            fill="#818cf8"
          />
        )
      })}
      {overlayPath && <path d={overlayPath} fill="none" stroke="#4f46e5" strokeWidth="2" />}
      {mean !== undefined && Number.isFinite(mean) && (
        <line x1={scaleX(mean)} y1={top} x2={scaleX(mean)} y2={bottom} stroke="#1d4ed8" strokeDasharray="4 3" />
      )}
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

export function DensityChart({
  series,
  xLabel,
  height = 230,
  className = '',
  ariaLabel = 'Density overlay',
}: PlotBase & {
  series: Array<{ id: string; color: string; points: Array<{ x: number; y: number }>; label?: string }>
  xLabel?: string
  ariaLabel?: string
}) {
  const width = 680
  const left = 44
  const right = width - 14
  const top = 16
  const bottom = height - 34
  const xs = series.flatMap((item) => item.points.map((p) => p.x))
  const ys = series.flatMap((item) => item.points.map((p) => p.y))
  const [x0, x1] = domain(xs)
  const yMax = Math.max(0.01, ...ys)
  const scaleX = (value: number) => left + ((value - x0) / (x1 - x0 || 1)) * (right - left)
  const scaleY = (value: number) => bottom - (value / yMax) * (bottom - top)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-auto w-full ${className}`} role="img" aria-label={ariaLabel}>
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
      {series.map((item) => {
        const d = item.points
          .map((point, i) => `${i === 0 ? 'M' : 'L'}${scaleX(point.x)} ${scaleY(point.y)}`)
          .join(' ')
        return <path key={item.id} d={d} fill="none" stroke={item.color} strokeWidth="2.2" />
      })}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      {ticks(x0, x1, 6).map((tick) => (
        <text key={tick} x={scaleX(tick)} y={bottom + 16} textAnchor="middle" fontSize="10" fill="#64748b">
          {formatNum(tick, 1)}
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

export function LineChart({
  series,
  xLabel,
  yLabel,
  target,
  height = 240,
  className = '',
  ariaLabel = 'Line chart',
}: PlotBase & {
  series: Array<{ id: string; color: string; points: Array<{ x: number; y: number }> }>
  xLabel?: string
  yLabel?: string
  target?: number
  ariaLabel?: string
}) {
  const width = 680
  const left = 44
  const right = width - 12
  const top = 16
  const bottom = height - 34
  const xs = series.flatMap((item) => item.points.map((p) => p.x))
  const ys = series.flatMap((item) => item.points.map((p) => p.y))
  if (target !== undefined) ys.push(target)
  const [x0, x1] = domain(xs, 0)
  const [y0, y1] = domain(ys, 0.12)
  const scaleX = (value: number) => left + ((value - x0) / (x1 - x0 || 1)) * (right - left)
  const scaleY = (value: number) => bottom - ((value - y0) / (y1 - y0 || 1)) * (bottom - top)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-auto w-full ${className}`} role="img" aria-label={ariaLabel}>
      {yLabel && (
        <text x="12" y="14" fontSize="10" fill="#94a3b8">
          {yLabel}
        </text>
      )}
      {ticks(y0, y1, 4).map((tick) => (
        <g key={tick}>
          <line x1={left} y1={scaleY(tick)} x2={right} y2={scaleY(tick)} stroke="#eef2f7" />
          <text x={left - 6} y={scaleY(tick) + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
            {formatNum(tick, 2)}
          </text>
        </g>
      ))}
      {target !== undefined && (
        <line x1={left} y1={scaleY(target)} x2={right} y2={scaleY(target)} stroke="#94a3b8" strokeDasharray="5 4" />
      )}
      {series.map((item) => {
        const d = item.points
          .map((point, i) => `${i === 0 ? 'M' : 'L'}${scaleX(point.x)} ${scaleY(point.y)}`)
          .join(' ')
        return <path key={item.id} d={d} fill="none" stroke={item.color} strokeWidth="2" />
      })}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      {ticks(x0, x1, 5).map((tick) => (
        <text key={tick} x={scaleX(tick)} y={bottom + 16} textAnchor="middle" fontSize="10" fill="#64748b">
          {formatNum(tick, 0)}
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

export function SeCurveChart({
  sigma,
  markers,
  height = 210,
  className = '',
}: PlotBase & { sigma: number; markers: number[] }) {
  const ns = Array.from({ length: 40 }, (_, i) => 2 + i * 6)
  const points = ns.map((n) => ({ x: n, y: sigma / Math.sqrt(n) }))
  return (
    <div className={className}>
      <LineChart
        series={[{ id: 'se', color: '#2563eb', points }]}
        xLabel="Sample size n"
        yLabel="SE"
        ariaLabel="Standard error versus sample size"
        height={height}
      />
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Markers at n = {markers.join(', ')}:{' '}
        {markers.map((n) => `n=${n} → ${formatNum(sigma / Math.sqrt(n), 2)}`).join(' · ')}
      </p>
    </div>
  )
}

export function SampleDots({ values, max = 36 }: { values: number[]; max?: number }) {
  const shown = values.slice(0, max)
  const [lo, hi] = domain(shown.length ? shown : [0, 1])
  return (
    <svg viewBox="0 0 320 54" className="h-14 w-full" role="img" aria-label="Current sample">
      <line x1="12" y1="36" x2="308" y2="36" stroke="#cbd5e1" />
      {shown.map((value, index) => {
        const x = 12 + ((value - lo) / (hi - lo || 1)) * 296
        return <circle key={`${value}-${index}`} cx={x} cy={36} r="4.5" fill="#818cf8" />
      })}
    </svg>
  )
}

export function PopulationDotsCanvas({
  values,
  className = '',
}: {
  values: number[]
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cols = 40
    const rows = Math.ceil(values.length / cols)
    const size = 7
    const gap = 2
    canvas.width = cols * (size + gap)
    canvas.height = rows * (size + gap)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    values.forEach((value, index) => {
      const c = index % cols
      const r = Math.floor(index / cols)
      ctx.beginPath()
      ctx.arc(c * (size + gap) + size / 2, r * (size + gap) + size / 2, size / 2.3, 0, Math.PI * 2)
      ctx.fillStyle = value >= 0.5 ? '#7c3aed' : '#e2e8f0'
      ctx.fill()
    })
  }, [values])
  return <canvas ref={ref} className={`max-h-44 w-full ${className}`} aria-label="Binary population" />
}

export function DensityPreview({
  points,
  label,
}: {
  points: Array<{ x: number; y: number }>
  label: string
}) {
  const width = 220
  const height = 78
  const [x0, x1] = domain(points.map((p) => p.x), 0)
  const yMax = Math.max(0.01, ...points.map((p) => p.y))
  const d = points
    .map((point, i) => {
      const x = 8 + ((point.x - x0) / (x1 - x0 || 1)) * (width - 16)
      const y = height - 16 - (point.y / yMax) * (height - 28)
      return `${i === 0 ? 'M' : 'L'}${x} ${y}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[78px] w-full" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="2" />
      <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="10" fill="#94a3b8">
        {label}
      </text>
    </svg>
  )
}

export function NumberGrid({ values, highlight }: { values: number[]; highlight?: number[] }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {values.map((value, index) => {
        const marked = highlight?.includes(index)
        return (
          <span
            key={`${value}-${index}`}
            className={`grid h-8 place-items-center rounded-lg text-xs font-bold ${
              marked ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {formatNum(value, 0)}
          </span>
        )
      })}
    </div>
  )
}
