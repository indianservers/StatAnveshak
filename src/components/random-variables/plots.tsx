import { useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { formatNum, linspace } from '../../lib/randomVariables'

type Point = { x: number; y: number }

function scaleX(x: number, min: number, max: number, left: number, right: number): number {
  if (max <= min) return left
  return left + ((x - min) / (max - min)) * (right - left)
}

function scaleY(y: number, min: number, max: number, top: number, bottom: number): number {
  if (max <= min) return bottom
  return bottom - ((y - min) / (max - min)) * (bottom - top)
}

function ticks(min: number, max: number, count = 5): number[] {
  return linspace(min, max, count)
}

export function PMFChart({
  items,
  empirical,
  selected,
  showLabels = true,
  mean,
  onSelect,
  height = 220,
}: {
  items: Array<{ x: number; p: number }>
  empirical?: Map<number, number>
  selected?: number | null
  showLabels?: boolean
  mean?: number
  onSelect?: (x: number) => void
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 520
  const left = 46
  const right = width - 16
  const top = 18
  const bottom = height - 36
  const xs = items.map((item) => item.x)
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 1)
  const maxP = Math.max(0.3, ...items.map((item) => item.p), ...(empirical ? [...empirical.values()] : [0]))
  const barW = Math.min(36, ((right - left) / Math.max(items.length, 1)) * 0.46)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Probability mass function">
      <text x="16" y="14" fontSize="11" fill="#94a3b8">
        P
      </text>
      {ticks(0, maxP, 4).map((t) => {
        const y = scaleY(t, 0, maxP, top, bottom)
        return (
          <g key={t}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#eef2f7" />
            <text x={left - 8} y={y + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
              {formatNum(t, 2)}
            </text>
          </g>
        )
      })}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      {items.map((item) => {
        const cx = scaleX(item.x, minX - 0.6, maxX + 0.6, left, right)
        const h = ((item.p / maxP) * (bottom - top))
        const emp = empirical?.get(item.x)
        const active = selected === item.x || hover === item.x
        return (
          <g key={item.x}>
            <rect
              x={cx - barW / 2}
              y={bottom - h}
              width={barW}
              height={h}
              rx="3"
              fill={active ? '#1d4ed8' : '#60a5fa'}
              className="cursor-pointer"
              onMouseEnter={() => setHover(item.x)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(item.x)}
            />
            {emp !== undefined && (
              <rect
                x={cx + barW / 2 + 2}
                y={bottom - (emp / maxP) * (bottom - top)}
                width={Math.max(4, barW * 0.35)}
                height={(emp / maxP) * (bottom - top)}
                rx="2"
                fill="#f59e0b"
                opacity="0.85"
              />
            )}
            {showLabels && (
              <text x={cx} y={bottom - h - 6} fontSize="10" fill="#64748b" textAnchor="middle">
                {formatNum(item.p, 3)}
              </text>
            )}
            <text x={cx} y={bottom + 14} fontSize="11" fill="#64748b" textAnchor="middle">
              {item.x}
            </text>
          </g>
        )
      })}
      {mean !== undefined && Number.isFinite(mean) && (
        <line
          x1={scaleX(mean, minX - 0.6, maxX + 0.6, left, right)}
          y1={top}
          x2={scaleX(mean, minX - 0.6, maxX + 0.6, left, right)}
          y2={bottom}
          stroke="#ef4444"
          strokeDasharray="4 3"
        />
      )}
      <text x={(left + right) / 2} y={height - 4} fontSize="11" fill="#94a3b8" textAnchor="middle">
        x (outcome)
      </text>
    </svg>
  )
}

export function PDFPlot({
  f,
  min,
  max,
  a,
  b,
  shade = true,
  markers = [],
  overlays = [],
  yMax,
  xLabel = 'x',
  yLabel = 'f(x)',
  onDragInterval,
  height = 240,
}: {
  f: (x: number) => number
  min: number
  max: number
  a?: number
  b?: number
  shade?: boolean
  markers?: Array<{ x: number; label?: string; color?: string }>
  overlays?: Array<{ f: (x: number) => number; color: string; label?: string }>
  yMax?: number
  xLabel?: string
  yLabel?: string
  onDragInterval?: (edge: 'a' | 'b', value: number) => void
  height?: number
}) {
  const gid = useId()
  const width = 560
  const left = 46
  const right = width - 14
  const top = 16
  const bottom = height - 32
  const xs = linspace(min, max, 160)
  const curves = [{ f, color: '#2563eb' }, ...overlays]
  const peak = yMax ?? Math.max(0.05, ...curves.flatMap((curve) => xs.map((x) => curve.f(x))))
  const pathFor = (fn: (x: number) => number) =>
    xs
      .map((x, i) => {
        const px = scaleX(x, min, max, left, right)
        const py = scaleY(fn(x), 0, peak * 1.08, top, bottom)
        return `${i === 0 ? 'M' : 'L'}${px} ${py}`
      })
      .join(' ')

  const lo = a !== undefined && b !== undefined ? Math.min(a, b) : undefined
  const hi = a !== undefined && b !== undefined ? Math.max(a, b) : undefined
  const shadeXs = lo !== undefined && hi !== undefined ? xs.filter((x) => x >= lo && x <= hi) : []
  const shadePath =
    shade && shadeXs.length > 1
      ? `${shadeXs
          .map((x, i) => `${i === 0 ? 'M' : 'L'}${scaleX(x, min, max, left, right)} ${scaleY(f(x), 0, peak * 1.08, top, bottom)}`)
          .join(' ')} L${scaleX(shadeXs[shadeXs.length - 1] ?? hi ?? max, min, max, left, right)} ${bottom} L${scaleX(shadeXs[0] ?? lo ?? min, min, max, left, right)} ${bottom} Z`
      : ''

  const svgRef = useRef<SVGSVGElement | null>(null)
  const xFromEvent = (event: ReactPointerEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect()
    if (!box) return min
    const x = ((event.clientX - box.left) / box.width) * width
    const t = (x - left) / (right - left)
    return min + clamp01(t) * (max - min)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full touch-none"
      role="img"
      aria-label="Probability density"
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <text x="12" y="14" fontSize="11" fill="#94a3b8">
        {yLabel}
      </text>
      {ticks(0, peak, 4).map((t) => {
        const y = scaleY(t, 0, peak * 1.08, top, bottom)
        return (
          <g key={t}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#eef2f7" />
            <text x={left - 6} y={y + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
              {formatNum(t, 2)}
            </text>
          </g>
        )
      })}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      {shadePath && <path d={shadePath} fill={`url(#${gid}-fill)`} />}
      {curves.map((curve) => (
        <path key={curve.color} d={pathFor(curve.f)} fill="none" stroke={curve.color} strokeWidth="2.4" />
      ))}
      {lo !== undefined && hi !== undefined && onDragInterval && (
        <>
          {(['a', 'b'] as const).map((edge) => {
            const value = edge === 'a' ? (a ?? lo) : (b ?? hi)
            const px = scaleX(value, min, max, left, right)
            return (
              <g key={edge}>
                <line x1={px} y1={top} x2={px} y2={bottom} stroke="#2563eb" strokeDasharray="4 3" />
                <circle
                  cx={px}
                  cy={bottom}
                  r="6"
                  fill="#2563eb"
                  className="cursor-ew-resize"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }}
                  onPointerMove={(event) => {
                    if (event.buttons !== 1) return
                    onDragInterval(edge, xFromEvent(event as unknown as ReactPointerEvent<SVGSVGElement>))
                  }}
                />
              </g>
            )
          })}
        </>
      )}
      {markers.map((marker) => (
        <g key={`${marker.x}-${marker.label ?? ''}`}>
          <line
            x1={scaleX(marker.x, min, max, left, right)}
            y1={top}
            x2={scaleX(marker.x, min, max, left, right)}
            y2={bottom}
            stroke={marker.color ?? '#ef4444'}
            strokeDasharray="4 3"
          />
          {marker.label && (
            <text x={scaleX(marker.x, min, max, left, right)} y={top + 10} fontSize="10" fill={marker.color ?? '#ef4444'} textAnchor="middle">
              {marker.label}
            </text>
          )}
        </g>
      ))}
      {ticks(min, max, 7).map((t) => (
        <text key={t} x={scaleX(t, min, max, left, right)} y={bottom + 14} fontSize="10" fill="#94a3b8" textAnchor="middle">
          {formatNum(t, 1)}
        </text>
      ))}
      <text x={(left + right) / 2} y={height - 2} fontSize="11" fill="#94a3b8" textAnchor="middle">
        {xLabel}
      </text>
    </svg>
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function CDFPlot({
  F,
  min,
  max,
  x,
  p,
  discreteSteps,
  onChangeX,
  height = 240,
}: {
  F: (value: number) => number
  min: number
  max: number
  x: number
  p?: number
  discreteSteps?: Array<{ x: number; p: number }>
  onChangeX?: (value: number) => void
  height?: number
}) {
  const width = 560
  const left = 48
  const right = width - 14
  const top = 18
  const bottom = height - 32
  const xs = linspace(min, max, 180)
  const path = discreteSteps
    ? discreteSteps
        .flatMap((step, i) => {
          const prev = i === 0 ? min : discreteSteps[i - 1].x
          const y = scaleY(step.p, 0, 1, top, bottom)
          return [
            `${i === 0 ? 'M' : 'L'}${scaleX(prev, min, max, left, right)} ${y}`,
            `L${scaleX(step.x, min, max, left, right)} ${y}`,
          ]
        })
        .join(' ')
    : xs
        .map((value, i) => `${i === 0 ? 'M' : 'L'}${scaleX(value, min, max, left, right)} ${scaleY(F(value), 0, 1, top, bottom)}`)
        .join(' ')
  const px = scaleX(x, min, max, left, right)
  const py = scaleY(F(x), 0, 1, top, bottom)
  const svgRef = useRef<SVGSVGElement | null>(null)

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full touch-none"
      role="img"
      aria-label="Cumulative distribution function"
      onPointerDown={(event) => {
        if (!onChangeX || !svgRef.current) return
        const box = svgRef.current.getBoundingClientRect()
        const t = (event.clientX - box.left) / box.width
        onChangeX(min + clamp01((t * width - left) / (right - left)) * (max - min))
      }}
      onPointerMove={(event) => {
        if (!onChangeX || event.buttons !== 1 || !svgRef.current) return
        const box = svgRef.current.getBoundingClientRect()
        const t = (event.clientX - box.left) / box.width
        onChangeX(min + clamp01((t * width - left) / (right - left)) * (max - min))
      }}
    >
      {ticks(0, 1, 5).map((t) => {
        const y = scaleY(t, 0, 1, top, bottom)
        return (
          <g key={t}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#eef2f7" />
            <text x={left - 6} y={y + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
              {t.toFixed(1)}
            </text>
          </g>
        )
      })}
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      <path d={`${path} L${right} ${bottom} L${left} ${bottom} Z`} fill="#dbeafe" opacity="0.55" />
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.6" />
      <line x1={px} y1={py} x2={px} y2={bottom} stroke="#2563eb" strokeDasharray="4 3" />
      <line x1={left} y1={py} x2={px} y2={py} stroke="#93c5fd" strokeDasharray="4 3" />
      <circle cx={px} cy={py} r="5" fill="#2563eb" />
      <text x={px + 8} y={py - 8} fontSize="11" fill="#2563eb">
        F({formatNum(x, 2)}) = {formatNum(p ?? F(x), 4)}
      </text>
      {ticks(min, max, 7).map((t) => (
        <text key={t} x={scaleX(t, min, max, left, right)} y={bottom + 14} fontSize="10" fill="#94a3b8" textAnchor="middle">
          {formatNum(t, 2)}
        </text>
      ))}
      <text x="12" y="14" fontSize="11" fill="#94a3b8">
        F(x)
      </text>
    </svg>
  )
}

export function ScatterPlot({
  points,
  onMove,
  showLine,
  showMeans,
  height = 260,
}: {
  points: Point[]
  onMove?: (index: number, point: Point) => void
  showLine?: boolean
  showMeans?: boolean
  height?: number
}) {
  const width = 420
  const left = 40
  const right = width - 12
  const top = 12
  const bottom = height - 28
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = (xs.length ? Math.min(...xs) : -5) - 1.5
  const maxX = (xs.length ? Math.max(...xs) : 5) + 1.5
  const minY = (ys.length ? Math.min(...ys) : -5) - 1.5
  const maxY = (ys.length ? Math.max(...ys) : 5) + 1.5
  const mx = xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length)
  const my = ys.reduce((s, v) => s + v, 0) / Math.max(1, ys.length)
  const line = useMemo(() => {
    const n = points.length
    if (n < 2) return null
    const vx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0) / n
    const cov = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / n
    if (vx <= 1e-12) return null
    const slope = cov / vx
    const intercept = my - slope * mx
    return { slope, intercept }
  }, [mx, my, points])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full touch-none" role="img" aria-label="Scatter plot">
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#94a3b8" />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#94a3b8" />
      {showMeans && (
        <>
          <line x1={scaleX(mx, minX, maxX, left, right)} y1={top} x2={scaleX(mx, minX, maxX, left, right)} y2={bottom} stroke="#cbd5e1" strokeDasharray="4 3" />
          <line x1={left} y1={scaleY(my, minY, maxY, top, bottom)} x2={right} y2={scaleY(my, minY, maxY, top, bottom)} stroke="#cbd5e1" strokeDasharray="4 3" />
        </>
      )}
      {showLine && line && (
        <line
          x1={scaleX(minX, minX, maxX, left, right)}
          y1={scaleY(line.intercept + line.slope * minX, minY, maxY, top, bottom)}
          x2={scaleX(maxX, minX, maxX, left, right)}
          y2={scaleY(line.intercept + line.slope * maxX, minY, maxY, top, bottom)}
          stroke="#60a5fa"
          strokeWidth="1.8"
        />
      )}
      {points.map((point, index) => {
        const sameSign = (point.x - mx) * (point.y - my) >= 0
        return (
          <circle
            key={index}
            cx={scaleX(point.x, minX, maxX, left, right)}
            cy={scaleY(point.y, minY, maxY, top, bottom)}
            r="4"
            fill={sameSign ? '#2563eb' : '#f43f5e'}
            className={onMove ? 'cursor-move' : undefined}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => {
              if (!onMove || event.buttons !== 1) return
              const svg = event.currentTarget.ownerSVGElement
              if (!svg) return
              const box = svg.getBoundingClientRect()
              const sx = ((event.clientX - box.left) / box.width) * width
              const sy = ((event.clientY - box.top) / box.height) * height
              const nx = minX + clamp01((sx - left) / (right - left)) * (maxX - minX)
              const ny = minY + (1 - clamp01((sy - top) / (bottom - top))) * (maxY - minY)
              onMove(index, { x: nx, y: ny })
            }}
          />
        )
      })}
      <text x={width - 8} y={bottom + 16} fontSize="11" fill="#64748b" textAnchor="end">
        X
      </text>
      <text x={12} y={16} fontSize="11" fill="#64748b">
        Y
      </text>
    </svg>
  )
}

export function HeatmapGrid({
  table,
  active,
  onSelect,
}: {
  table: { xs: number[]; ys: number[]; cells: number[][] }
  active?: { i: number; j: number } | null
  onSelect?: (i: number, j: number) => void
}) {
  const max = Math.max(0.01, ...table.cells.flat())
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${table.ys.length}, minmax(0, 1fr))` }}>
      {table.cells.map((row, i) =>
        row.map((value, j) => {
          const t = value / max
          const selected = active?.i === i && active?.j === j
          return (
            <button
              key={`${i}-${j}`}
              type="button"
              onClick={() => onSelect?.(i, j)}
              className={`min-h-12 rounded-xl text-xs font-bold ${selected ? 'ring-2 ring-blue-600' : ''}`}
              style={{ background: `rgba(37, 99, 235, ${0.12 + t * 0.7})`, color: t > 0.55 ? '#fff' : '#1e3a8a' }}
            >
              {formatNum(value, 3)}
            </button>
          )
        }),
      )}
    </div>
  )
}
