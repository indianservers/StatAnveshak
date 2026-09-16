import { formatNum, type EcdfStep, type HistBin, type TukeyBox } from '../../lib/descriptiveStatistics'

type PlotBase = {
  width?: number
  height?: number
  className?: string
}

function domain(values: number[], pad = 0.08): [number, number] {
  if (values.length === 0) return [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [min - 1, max + 1]
  const span = max - min
  return [min - span * pad, max + span * pad]
}

export function DotPlot({
  values,
  selected,
  onSelect,
  markers = [],
  width = 640,
  height = 160,
  className = '',
}: PlotBase & {
  values: number[]
  selected?: number | null
  onSelect?: (index: number) => void
  markers?: Array<{ value: number; color: string; label: string; dash?: boolean }>
}) {
  const [x0, x1] = domain([...values, ...markers.map((marker) => marker.value)])
  const left = 28
  const right = width - 16
  const axis = height - 36
  const scale = (value: number) => left + ((value - x0) / (x1 - x0)) * (right - left)
  const stacks = new Map<number, number>()
  const ticks = 6
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} role="img" aria-label="Dot plot">
      <line x1={left} y1={axis} x2={right} y2={axis} stroke="#94a3b8" />
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const value = x0 + ((x1 - x0) * i) / ticks
        const x = scale(value)
        return (
          <g key={i}>
            <line x1={x} y1={axis} x2={x} y2={axis + 5} stroke="#94a3b8" />
            <text x={x} y={axis + 18} textAnchor="middle" fontSize="11" fill="#64748b">
              {formatNum(value, 1)}
            </text>
          </g>
        )
      })}
      {markers.map((marker) => (
        <g key={marker.label}>
          <line
            x1={scale(marker.value)}
            y1={18}
            x2={scale(marker.value)}
            y2={axis}
            stroke={marker.color}
            strokeWidth="2"
            strokeDasharray={marker.dash ? '4 3' : undefined}
          />
          <text x={scale(marker.value)} y={14} textAnchor="middle" fontSize="11" fontWeight="700" fill={marker.color}>
            {marker.label}
          </text>
        </g>
      ))}
      {values.map((value, index) => {
        const key = Math.round(value * 1000)
        const stack = stacks.get(key) ?? 0
        stacks.set(key, stack + 1)
        const cx = scale(value)
        const cy = axis - 10 - stack * 16
        const active = selected === index
        return (
          <circle
            key={`${value}-${index}`}
            className="ds-dot"
            cx={cx}
            cy={cy}
            r={active ? 7 : 6}
            fill={active ? '#1d4ed8' : '#3b82f6'}
            tabIndex={0}
            role="button"
            aria-label={`Value ${value}`}
            onClick={() => onSelect?.(index)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onSelect?.(index)
            }}
          />
        )
      })}
    </svg>
  )
}

export function HistogramPlot({
  bins,
  markers = [],
  yLabel = 'Frequency',
  width = 640,
  height = 240,
  className = '',
}: PlotBase & {
  bins: HistBin[]
  markers?: Array<{ value: number; color: string; label: string }>
  yLabel?: string
}) {
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count))
  const [x0, x1] = domain(bins.flatMap((bin) => [bin.start, bin.end]), 0.02)
  const left = 42
  const right = width - 16
  const top = 18
  const bottom = height - 32
  const sx = (value: number) => left + ((value - x0) / (x1 - x0)) * (right - left)
  const sy = (count: number) => bottom - (count / maxCount) * (bottom - top)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} role="img" aria-label="Histogram">
      <text x="12" y="14" fontSize="11" fill="#94a3b8">
        {yLabel}
      </text>
      {[0, 0.5, 1].map((frac) => {
        const y = sy(maxCount * frac)
        return (
          <g key={frac}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#e2e8f0" />
            <text x={left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {formatNum(maxCount * frac, 0)}
            </text>
          </g>
        )
      })}
      {bins.map((bin) => (
        <rect
          key={`${bin.start}-${bin.end}`}
          x={sx(bin.start) + 1}
          y={sy(bin.count)}
          width={Math.max(2, sx(bin.end) - sx(bin.start) - 2)}
          height={bottom - sy(bin.count)}
          rx="3"
          fill="#93c5fd"
        />
      ))}
      {markers.map((marker) => (
        <g key={marker.label}>
          <line x1={sx(marker.value)} y1={top} x2={sx(marker.value)} y2={bottom} stroke={marker.color} strokeWidth="2" />
          <text x={sx(marker.value)} y={top + 10} textAnchor="middle" fontSize="10" fill={marker.color} fontWeight="700">
            {marker.label}
          </text>
        </g>
      ))}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
    </svg>
  )
}

export function BoxPlotChart({
  box,
  values,
  selected,
  onSelect,
  width = 280,
  height = 280,
  className = '',
  horizontal = false,
}: PlotBase & {
  box: TukeyBox
  values: number[]
  selected?: number | null
  onSelect?: (index: number) => void
  horizontal?: boolean
}) {
  const [lo, hi] = domain([...values, box.lowerFence, box.upperFence], 0.12)
  const map = (value: number) => {
    const t = (value - lo) / (hi - lo)
    return horizontal ? 24 + t * (width - 48) : height - 28 - t * (height - 48)
  }
  if (!Number.isFinite(box.median)) {
    return <p className="text-sm text-slate-400">Add more values to draw a box plot.</p>
  }
  const center = horizontal ? height / 2 : width / 2
  const boxLo = horizontal ? 0 : center - 28
  const boxHi = horizontal ? 0 : center + 28
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} role="img" aria-label="Box plot">
      {horizontal ? (
        <>
          <line x1={map(box.lowerWhisker)} y1={center} x2={map(box.upperWhisker)} y2={center} stroke="#64748b" />
          <line x1={map(box.lowerWhisker)} y1={center - 12} x2={map(box.lowerWhisker)} y2={center + 12} stroke="#64748b" />
          <line x1={map(box.upperWhisker)} y1={center - 12} x2={map(box.upperWhisker)} y2={center + 12} stroke="#64748b" />
          <rect x={map(box.q1)} y={center - 22} width={Math.max(2, map(box.q3) - map(box.q1))} height="44" rx="6" fill="#dbeafe" stroke="#2563eb" />
          <line x1={map(box.median)} y1={center - 22} x2={map(box.median)} y2={center + 22} stroke="#1d4ed8" strokeWidth="2.4" />
        </>
      ) : (
        <>
          <line x1={center} y1={map(box.lowerWhisker)} x2={center} y2={map(box.upperWhisker)} stroke="#64748b" />
          <line x1={center - 12} y1={map(box.lowerWhisker)} x2={center + 12} y2={map(box.lowerWhisker)} stroke="#64748b" />
          <line x1={center - 12} y1={map(box.upperWhisker)} x2={center + 12} y2={map(box.upperWhisker)} stroke="#64748b" />
          <rect
            x={boxLo}
            y={map(box.q3)}
            width={boxHi - boxLo}
            height={Math.max(2, map(box.q1) - map(box.q3))}
            rx="6"
            fill="#dbeafe"
            stroke="#2563eb"
          />
          <line x1={boxLo} y1={map(box.median)} x2={boxHi} y2={map(box.median)} stroke="#1d4ed8" strokeWidth="2.4" />
        </>
      )}
      {values.map((value, index) => {
        const outlier = value < box.lowerFence || value > box.upperFence
        const x = horizontal ? map(value) : center + ((index % 3) - 1) * 10
        const y = horizontal ? center + ((index % 3) - 1) * 10 : map(value)
        return (
          <circle
            key={`${value}-${index}`}
            className="ds-dot"
            cx={x}
            cy={y}
            r={selected === index ? 5 : 4}
            fill={outlier ? '#ef4444' : '#2563eb'}
            onClick={() => onSelect?.(index)}
          />
        )
      })}
    </svg>
  )
}

export function FiveNumberStrip({ box, width = 640, height = 92 }: { box: TukeyBox; width?: number; height?: number }) {
  const [lo, hi] = domain([box.min, box.max], 0.06)
  const sx = (value: number) => 24 + ((value - lo) / (hi - lo)) * (width - 48)
  const marks = [
    { value: box.min, label: 'Min', color: '#64748b' },
    { value: box.q1, label: 'Q1', color: '#2563eb' },
    { value: box.median, label: 'Median', color: '#059669' },
    { value: box.q3, label: 'Q3', color: '#2563eb' },
    { value: box.max, label: 'Max', color: '#64748b' },
  ]
  if (!Number.isFinite(box.median)) return null
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Five-number strip">
      <line x1={sx(box.min)} y1={48} x2={sx(box.max)} y2={48} stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <rect x={sx(box.q1)} y={34} width={Math.max(2, sx(box.q3) - sx(box.q1))} height="28" rx="6" fill="#dbeafe" />
      {marks.map((mark) => (
        <g key={mark.label}>
          <circle cx={sx(mark.value)} cy={48} r="6" fill={mark.color} />
          <text x={sx(mark.value)} y={20} textAnchor="middle" fontSize="11" fontWeight="700" fill={mark.color}>
            {mark.label}
          </text>
          <text x={sx(mark.value)} y={80} textAnchor="middle" fontSize="11" fill="#475569">
            {formatNum(mark.value)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function EcdfPlot({
  steps,
  x,
  width = 520,
  height = 220,
  className = '',
}: PlotBase & { steps: EcdfStep[]; x?: number }) {
  if (steps.length === 0) return <p className="text-sm text-slate-400">Add data to draw the ECDF.</p>
  const xs = steps.map((step) => step.x)
  const [x0, x1] = domain(xs, 0.08)
  const left = 40
  const right = width - 16
  const top = 16
  const bottom = height - 28
  const sx = (value: number) => left + ((value - x0) / (x1 - x0)) * (right - left)
  const sy = (value: number) => bottom - value * (bottom - top)
  let path = `M ${sx(x0)} ${sy(0)}`
  for (const step of steps) {
    path += ` H ${sx(step.x)} V ${sy(step.y1)}`
  }
  path += ` H ${sx(x1)}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} role="img" aria-label="Empirical CDF">
      <text x={left} y="12" fontSize="11" fill="#94a3b8">
        F(x)
      </text>
      {[0, 0.5, 1].map((p) => (
        <g key={p}>
          <line x1={left} y1={sy(p)} x2={right} y2={sy(p)} stroke="#e2e8f0" />
          <text x={left - 6} y={sy(p) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
            {p.toFixed(1)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.4" />
      {x !== undefined && (
        <>
          <line x1={sx(x)} y1={top} x2={sx(x)} y2={bottom} stroke="#f59e0b" strokeDasharray="4 3" />
          <circle cx={sx(x)} cy={sy(steps.filter((step) => step.x <= x).at(-1)?.y1 ?? 0)} r="4" fill="#2563eb" />
        </>
      )}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
    </svg>
  )
}

export function BarChart({
  items,
  width = 520,
  height = 220,
}: {
  items: Array<{ label: string; count: number; color: string }>
  width?: number
  height?: number
}) {
  const max = Math.max(1, ...items.map((item) => item.count))
  const left = 36
  const bottom = height - 28
  const barW = (width - left - 16) / items.length
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Bar chart">
      {items.map((item, index) => {
        const h = (item.count / max) * (bottom - 20)
        return (
          <g key={item.label}>
            <rect x={left + index * barW + 8} y={bottom - h} width={barW - 16} height={h} rx="6" fill={item.color} />
            <text x={left + index * barW + barW / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function PieChart({ items }: { items: Array<{ label: string; count: number; color: string }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1
  let angle = -Math.PI / 2
  const cx = 90
  const cy = 90
  const r = 70
  return (
    <svg viewBox="0 0 220 180" className="w-full" role="img" aria-label="Pie chart">
      {items.map((item) => {
        const sweep = (item.count / total) * Math.PI * 2
        const x1 = cx + r * Math.cos(angle)
        const y1 = cy + r * Math.sin(angle)
        angle += sweep
        const x2 = cx + r * Math.cos(angle)
        const y2 = cy + r * Math.sin(angle)
        const large = sweep > Math.PI ? 1 : 0
        return <path key={item.label} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={item.color} />
      })}
    </svg>
  )
}

export function ScatterPlot({
  points,
  width = 520,
  height = 220,
}: {
  points: Array<{ x: number; y: number }>
  width?: number
  height?: number
}) {
  const [x0, x1] = domain(points.map((point) => point.x))
  const [y0, y1] = domain(points.map((point) => point.y))
  const left = 36
  const bottom = height - 24
  const sx = (value: number) => left + ((value - x0) / (x1 - x0)) * (width - left - 16)
  const sy = (value: number) => bottom - ((value - y0) / (y1 - y0)) * (bottom - 16)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Scatter plot">
      <line x1={left} y1={bottom} x2={width - 12} y2={bottom} stroke="#94a3b8" />
      <line x1={left} y1={16} x2={left} y2={bottom} stroke="#94a3b8" />
      {points.map((point, index) => (
        <circle key={index} cx={sx(point.x)} cy={sy(point.y)} r="4.5" fill="#2563eb" />
      ))}
    </svg>
  )
}

export function LineChart({
  items,
  width = 520,
  height = 220,
}: {
  items: Array<{ label: string; value: number }>
  width?: number
  height?: number
}) {
  const [y0, y1] = domain(items.map((item) => item.value))
  const left = 28
  const bottom = height - 28
  const sx = (index: number) => left + (index / Math.max(1, items.length - 1)) * (width - left - 16)
  const sy = (value: number) => bottom - ((value - y0) / (y1 - y0)) * (bottom - 16)
  const d = items.map((item, index) => `${index === 0 ? 'M' : 'L'} ${sx(index)} ${sy(item.value)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Line chart">
      <path d={d} fill="none" stroke="#2563eb" strokeWidth="2.4" />
      {items.map((item, index) => (
        <g key={item.label}>
          <circle cx={sx(index)} cy={sy(item.value)} r="3.5" fill="#2563eb" />
          <text x={sx(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
            {item.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function FrequencyPolygon({
  bins,
  width = 520,
  height = 200,
}: {
  bins: HistBin[]
  width?: number
  height?: number
}) {
  if (bins.length === 0) return null
  const max = Math.max(1, ...bins.map((bin) => bin.count))
  const [x0, x1] = domain(bins.map((bin) => bin.mid))
  const left = 28
  const bottom = height - 24
  const sx = (value: number) => left + ((value - x0) / (x1 - x0)) * (width - left - 16)
  const sy = (count: number) => bottom - (count / max) * (bottom - 16)
  const d = bins.map((bin, index) => `${index === 0 ? 'M' : 'L'} ${sx(bin.mid)} ${sy(bin.count)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Frequency polygon">
      <path d={d} fill="none" stroke="#8b5cf6" strokeWidth="2.2" />
      {bins.map((bin) => (
        <circle key={bin.mid} cx={sx(bin.mid)} cy={sy(bin.count)} r="3.5" fill="#8b5cf6" />
      ))}
    </svg>
  )
}

export function DeviationPlot({
  values,
  mean,
  squared = false,
  width = 640,
  height = 180,
}: {
  values: number[]
  mean: number
  squared?: boolean
  width?: number
  height?: number
}) {
  const [x0, x1] = domain([...values, mean])
  const left = 24
  const right = width - 16
  const axis = height / 2
  const sx = (value: number) => left + ((value - x0) / (x1 - x0)) * (right - left)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Deviations from the mean">
      <line x1={left} y1={axis} x2={right} y2={axis} stroke="#94a3b8" />
      <line x1={sx(mean)} y1={16} x2={sx(mean)} y2={height - 16} stroke="#f59e0b" strokeWidth="2" />
      {values.map((value, index) => (
        <g key={`${value}-${index}`}>
          <line
            x1={sx(mean)}
            y1={axis + ((index % 2 ? 1 : -1) * (squared ? 28 : 18))}
            x2={sx(value)}
            y2={axis + ((index % 2 ? 1 : -1) * (squared ? 28 : 18))}
            stroke={value >= mean ? '#2563eb' : '#ef4444'}
            strokeWidth={squared ? 6 : 2}
            opacity={squared ? 0.35 : 0.9}
          />
          <circle cx={sx(value)} cy={axis} r="5" fill="#2563eb" />
        </g>
      ))}
    </svg>
  )
}
