import { useMemo, useRef, useState } from 'react'
import { formatNum, mean, type Observation } from '../../lib/regressionStudio'

type Box = { left: number; right: number; top: number; bottom: number }
const PLOT: Box = { left: 48, right: 16, top: 18, bottom: 38 }

function extent(values: number[], pad = 0.08): [number, number] {
  if (values.length === 0) return [0, 1]
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  if (lo === hi) return [lo - 1, hi + 1]
  const span = hi - lo
  return [lo - span * pad, hi + span * pad]
}

function scaleX(value: number, domain: [number, number], width: number) {
  return PLOT.left + ((value - domain[0]) / (domain[1] - domain[0])) * (width - PLOT.left - PLOT.right)
}

function scaleY(value: number, domain: [number, number], height: number) {
  return height - PLOT.bottom - ((value - domain[0]) / (domain[1] - domain[0])) * (height - PLOT.top - PLOT.bottom)
}

function invertX(px: number, domain: [number, number], width: number) {
  return domain[0] + ((px - PLOT.left) / (width - PLOT.left - PLOT.right)) * (domain[1] - domain[0])
}

function invertY(py: number, domain: [number, number], height: number) {
  return domain[0] + ((height - PLOT.bottom - py) / (height - PLOT.top - PLOT.bottom)) * (domain[1] - domain[0])
}

export type SeriesPoint = { x: number; y: number }
export type BandPoint = { x: number; lo: number; hi: number }
export type GroupStyle = 'circle' | 'square'

export function ScatterChart({
  points,
  xLabel = 'X',
  yLabel = 'Y',
  lines = [],
  bands = [],
  residualSquares = false,
  residualStems = false,
  marker,
  editable = false,
  selectedId,
  onSelect,
  onChange,
  onAdd,
  height = 300,
  xDomain,
  yDomain,
  title,
}: {
  points: Array<Observation & { style?: GroupStyle; label?: string }>
  xLabel?: string
  yLabel?: string
  lines?: Array<{ a: SeriesPoint; b: SeriesPoint; dashed?: boolean; color?: string; label?: string }>
  bands?: Array<{ points: BandPoint[]; fill: string; dashed?: boolean; label: string }>
  residualSquares?: boolean
  residualStems?: boolean
  marker?: { x: number; y: number; label?: string }
  editable?: boolean
  selectedId?: string
  onSelect?: (id: string | undefined) => void
  onChange?: (points: Observation[]) => void
  onAdd?: (point: { x: number; y: number }) => void
  height?: number
  xDomain?: [number, number]
  yDomain?: [number, number]
  title?: string
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const width = 560
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const xd = xDomain ?? extent(xs)
  const yd = yDomain ?? extent(ys, 0.12)

  const toSvg = (event: { clientX: number; clientY: number }) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const box = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - box.left) / box.width) * width,
      y: ((event.clientY - box.top) / box.height) * height,
    }
  }

  const ticks = (domain: [number, number]) => {
    const span = domain[1] - domain[0]
    const step = span / 4
    return [0, 1, 2, 3, 4].map((i) => domain[0] + i * step)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full touch-none"
      role="img"
      aria-label={title ?? `Scatter plot of ${points.length} points`}
      onPointerMove={(event) => {
        if (!dragging || !onChange) return
        const pt = toSvg(event)
        onChange(
          points.map((point) =>
            point.id === dragging ? { ...point, x: invertX(pt.x, xd, width), y: invertY(pt.y, yd, height) } : point,
          ),
        )
      }}
      onPointerUp={() => setDragging(null)}
      onPointerLeave={() => setDragging(null)}
      onDoubleClick={(event) => {
        if (!onAdd) return
        const pt = toSvg(event)
        onAdd({ x: invertX(pt.x, xd, width), y: invertY(pt.y, yd, height) })
      }}
    >
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      {ticks(xd).map((tick) => (
        <g key={`x-${tick}`}>
          <line x1={scaleX(tick, xd, width)} x2={scaleX(tick, xd, width)} y1={PLOT.top} y2={height - PLOT.bottom} stroke="#eef2f7" />
          <text x={scaleX(tick, xd, width)} y={height - 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {formatNum(tick, tick >= 20 ? 0 : 1)}
          </text>
        </g>
      ))}
      {ticks(yd).map((tick) => (
        <g key={`y-${tick}`}>
          <line x1={PLOT.left} x2={width - PLOT.right} y1={scaleY(tick, yd, height)} y2={scaleY(tick, yd, height)} stroke="#eef2f7" />
          <text x={PLOT.left - 8} y={scaleY(tick, yd, height) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
            {formatNum(tick, tick >= 20 ? 0 : 1)}
          </text>
        </g>
      ))}
      <line x1={PLOT.left} x2={width - PLOT.right} y1={height - PLOT.bottom} y2={height - PLOT.bottom} stroke="#cbd5e1" />
      <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={height - PLOT.bottom} stroke="#cbd5e1" />
      <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">
        {xLabel}
      </text>
      <text transform={`translate(12 ${height / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#64748b">
        {yLabel}
      </text>

      {bands.map((band) => {
        const top = band.points.map((p) => `${scaleX(p.x, xd, width)},${scaleY(p.hi, yd, height)}`).join(' ')
        const bottom = [...band.points].reverse().map((p) => `${scaleX(p.x, xd, width)},${scaleY(p.lo, yd, height)}`).join(' ')
        return (
          <polygon
            key={band.label}
            points={`${top} ${bottom}`}
            fill={band.fill}
            stroke={band.dashed ? '#7c3aed' : '#2563eb'}
            strokeDasharray={band.dashed ? '5 4' : undefined}
            strokeWidth="1.2"
            opacity="0.55"
          >
            <title>{band.label}</title>
          </polygon>
        )
      })}

      {lines.map((line, i) => (
        <line
          key={`${line.label ?? 'line'}-${i}`}
          x1={scaleX(line.a.x, xd, width)}
          y1={scaleY(line.a.y, yd, height)}
          x2={scaleX(line.b.x, xd, width)}
          y2={scaleY(line.b.y, yd, height)}
          stroke={line.color ?? '#2563eb'}
          strokeWidth="2.2"
          strokeDasharray={line.dashed ? '6 4' : undefined}
        >
          {line.label && <title>{line.label}</title>}
        </line>
      ))}

      {points.map((point) => {
        const px = scaleX(point.x, xd, width)
        const py = scaleY(point.y, yd, height)
        const fy = point.fitted !== undefined ? scaleY(point.fitted, yd, height) : py
        const selected = point.id === selectedId
        return (
          <g key={point.id}>
            {(residualStems || residualSquares) && point.fitted !== undefined && (
              <line x1={px} x2={px} y1={py} y2={fy} stroke="#64748b" strokeDasharray="3 3" />
            )}
            {residualSquares && point.fitted !== undefined && (
              <rect
                x={px}
                y={Math.min(py, fy)}
                width={Math.abs(py - fy)}
                height={Math.abs(py - fy)}
                fill={point.y >= point.fitted ? 'rgba(37,99,235,0.16)' : 'rgba(15,23,42,0.1)'}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}
            {point.style === 'square' ? (
              <rect
                x={px - (selected ? 5.5 : 4.5)}
                y={py - (selected ? 5.5 : 4.5)}
                width={selected ? 11 : 9}
                height={selected ? 11 : 9}
                fill="#fff"
                stroke="#7c3aed"
                strokeWidth="1.8"
                role="button"
                tabIndex={0}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  setDragging(point.id)
                  onSelect?.(point.id)
                }}
              >
                <title>{point.label ?? `Point ${point.id}`}</title>
              </rect>
            ) : (
              <circle
                cx={px}
                cy={py}
                r={selected ? 5.6 : 4.2}
                fill={point.binaryY === 1 ? '#0f172a' : '#2563eb'}
                stroke={point.binaryY === 0 ? '#0f172a' : '#fff'}
                strokeWidth={point.binaryY === 0 ? 1.6 : 1}
                role="button"
                tabIndex={0}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  setDragging(point.id)
                  onSelect?.(point.id)
                }}
              >
                <title>{point.label ?? `Point ${point.id}`}</title>
              </circle>
            )}
          </g>
        )
      })}

      {marker && (
        <g>
          <line
            x1={scaleX(marker.x, xd, width)}
            x2={scaleX(marker.x, xd, width)}
            y1={PLOT.top}
            y2={height - PLOT.bottom}
            stroke="#7c3aed"
            strokeDasharray="4 3"
          />
          <circle cx={scaleX(marker.x, xd, width)} cy={scaleY(marker.y, yd, height)} r="6" fill="#fff" stroke="#7c3aed" strokeWidth="2.2" />
          {marker.label && (
            <text x={scaleX(marker.x, xd, width) + 10} y={scaleY(marker.y, yd, height) - 10} fontSize="11" fontWeight="700" fill="#5b21b6">
              {marker.label}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}

export function ResidualPanel({
  residuals,
  fitted,
  x,
}: {
  residuals: number[]
  fitted: number[]
  x: number[]
}) {
  const vsFitted = residuals.map((r, i) => ({ id: `rf-${i}`, x: fitted[i] ?? 0, y: r }))
  const vsX = residuals.map((r, i) => ({ id: `rx-${i}`, x: x[i] ?? 0, y: r }))
  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Residuals vs fitted</p>
        <ScatterChart points={vsFitted} xLabel="Fitted" yLabel="Residual" height={160} lines={[{ a: { x: Math.min(...fitted), y: 0 }, b: { x: Math.max(...fitted), y: 0 }, color: '#94a3b8' }]} />
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Residuals vs X</p>
        <ScatterChart points={vsX} xLabel="X" yLabel="Residual" height={140} lines={[{ a: { x: Math.min(...x), y: 0 }, b: { x: Math.max(...x), y: 0 }, color: '#94a3b8' }]} />
      </div>
    </div>
  )
}

export function ResidualHistogram({ residuals }: { residuals: number[] }) {
  const bins = 8
  const lo = Math.min(...residuals, -1)
  const hi = Math.max(...residuals, 1)
  const width = hi - lo || 1
  const counts = Array.from({ length: bins }, () => 0)
  residuals.forEach((value) => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(((value - lo) / width) * bins)))
    counts[idx] += 1
  })
  const max = Math.max(...counts, 1)
  const svgW = 280
  const svgH = 120
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="h-auto w-full" role="img" aria-label="Histogram of residuals">
      {counts.map((count, i) => {
        const barH = (count / max) * 80
        const x = 20 + i * ((svgW - 32) / bins)
        return (
          <g key={i}>
            <rect x={x} y={96 - barH} width={(svgW - 40) / bins - 3} height={barH} rx="3" fill={i < bins / 2 ? '#94a3b8' : '#2563eb'} />
          </g>
        )
      })}
      <line x1="16" x2={svgW - 8} y1="96" y2="96" stroke="#cbd5e1" />
      <text x={svgW / 2} y={114} textAnchor="middle" fontSize="10" fill="#64748b">
        Residual
      </text>
    </svg>
  )
}

export function BarSplit({ left, right, leftLabel, rightLabel }: { left: number; right: number; leftLabel: string; rightLabel: string }) {
  const total = left + right
  const pct = total > 0 ? (100 * left) / total : 50
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
        <span>
          {leftLabel} {formatNum(pct, 0)}%
        </span>
        <span>
          {rightLabel} {formatNum(100 - pct, 0)}%
        </span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-blue-600" style={{ width: `${pct}%` }} />
        <div className="bg-slate-300" style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  )
}

export function HorizontalBars({
  items,
}: {
  items: Array<{ label: string; value: number; max?: number; pattern?: 'solid' | 'hatch' }>
}) {
  const max = Math.max(...items.map((item) => item.max ?? Math.abs(item.value)), 0.01)
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
            <span>{item.label}</span>
            <span className="tabular-nums">{formatNum(item.value, 3)}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className={`h-3 rounded-full ${item.pattern === 'hatch' ? 'bg-[repeating-linear-gradient(135deg,#2563eb_0_4px,#93c5fd_4px_8px)]' : 'bg-blue-600'}`}
              style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function QQPlot({ residuals }: { residuals: number[] }) {
  const sorted = [...residuals].sort((a, b) => a - b)
  const n = sorted.length
  const points = useMemo(
    () =>
      sorted.map((value, i) => {
        const p = (i + 0.5) / n
        const z = Math.sqrt(2) * inverseErfApprox(2 * p - 1)
        return { id: `q-${i}`, x: z * (mean(sorted.map(Math.abs)) || 1), y: value }
      }),
    [n, sorted],
  )
  if (n < 3) return null
  const lo = Math.min(...points.map((p) => p.x), ...points.map((p) => p.y))
  const hi = Math.max(...points.map((p) => p.x), ...points.map((p) => p.y))
  return (
    <ScatterChart
      points={points}
      xLabel="Normal quantile"
      yLabel="Residual"
      height={160}
      lines={[{ a: { x: lo, y: lo }, b: { x: hi, y: hi }, color: '#94a3b8', dashed: true, label: 'Reference line' }]}
      title="Normal Q-Q plot of residuals"
    />
  )
}

function inverseErfApprox(x: number): number {
  const a = 0.147
  const t = Math.log(1 - x * x)
  const u = 2 / (Math.PI * a) + t / 2
  return Math.sign(x) * Math.sqrt(Math.sqrt(u * u - t / a) - u)
}
