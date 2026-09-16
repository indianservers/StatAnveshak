import { useMemo, useRef, useState } from 'react'
import {
  ANOVA_PALETTE,
  boxStats,
  fCurve,
  formatNum,
  groupStyle,
  type AnovaObservation,
  type GroupShape,
  type GroupSummary,
  type PostHocPair,
  type ResidualPoint,
} from '../../lib/anovaStudio'

type Box = { left: number; right: number; top: number; bottom: number }
const PLOT: Box = { left: 46, right: 16, top: 16, bottom: 36 }

function extent(values: number[], pad = 0.1): [number, number] {
  if (values.length === 0) return [0, 1]
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  if (lo === hi) return [lo - 1, hi + 1]
  const span = hi - lo
  return [lo - span * pad, hi + span * pad]
}

function sx(value: number, domain: [number, number], width: number) {
  return PLOT.left + ((value - domain[0]) / (domain[1] - domain[0])) * (width - PLOT.left - PLOT.right)
}

function sy(value: number, domain: [number, number], height: number) {
  return height - PLOT.bottom - ((value - domain[0]) / (domain[1] - domain[0])) * (height - PLOT.top - PLOT.bottom)
}

function invertY(py: number, domain: [number, number], height: number) {
  return domain[0] + ((height - PLOT.bottom - py) / (height - PLOT.top - PLOT.bottom)) * (domain[1] - domain[0])
}

export function Marker({
  x,
  y,
  shape,
  color,
  size = 5,
  label,
  selected,
}: {
  x: number
  y: number
  shape: GroupShape
  color: string
  size?: number
  label?: string
  selected?: boolean
}) {
  const stroke = selected ? '#0f172a' : color
  if (shape === 'square') return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} fill={color} stroke={stroke} />
  if (shape === 'triangle') return <path d={`M${x} ${y - size - 1} L${x + size} ${y + size} L${x - size} ${y + size} Z`} fill={color} stroke={stroke} />
  if (shape === 'diamond') return <path d={`M${x} ${y - size - 1} L${x + size} ${y} L${x} ${y + size + 1} L${x - size} ${y} Z`} fill={color} stroke={stroke} />
  if (shape === 'plus') {
    return (
      <g stroke={color} strokeWidth="2">
        <path d={`M${x - size} ${y} H${x + size} M${x} ${y - size} V${y + size}`} />
      </g>
    )
  }
  if (shape === 'cross') {
    return (
      <g stroke={color} strokeWidth="2">
        <path d={`M${x - size} ${y - size} L${x + size} ${y + size} M${x + size} ${y - size} L${x - size} ${y + size}`} />
      </g>
    )
  }
  return <circle cx={x} cy={y} r={size} fill={color} stroke={stroke} aria-label={label} />
}

export function GroupBoxPlot({
  groups,
  points,
  grandMean,
  showPoints,
  showMeans,
  showGrand,
  showWithin,
  showBetween,
  selectedId,
  onSelect,
  onMove,
  yLabel = 'Response',
  height = 280,
}: {
  groups: GroupSummary[]
  points: AnovaObservation[]
  grandMean: number
  showPoints?: boolean
  showMeans?: boolean
  showGrand?: boolean
  showWithin?: boolean
  showBetween?: boolean
  selectedId?: string
  onSelect?: (id: string | undefined) => void
  onMove?: (id: string, y: number) => void
  yLabel?: string
  height?: number
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const width = 560
  const names = groups.map((group) => group.name)
  const ys = points.map((point) => point.y)
  const yd = extent([...ys, grandMean], 0.14)
  const slot = (width - PLOT.left - PLOT.right) / Math.max(groups.length, 1)

  const toY = (clientY: number) => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    return invertY(((clientY - rect.top) / rect.height) * height, yd, height)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Group box plots"
      onPointerMove={(event) => {
        if (dragging && onMove) onMove(dragging, toY(event.clientY))
      }}
      onPointerUp={() => setDragging(null)}
      onPointerLeave={() => setDragging(null)}
    >
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      <text x="14" y="18" fontSize="10" fill="#94a3b8">
        {yLabel}
      </text>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const v = yd[0] + t * (yd[1] - yd[0])
        const y = sy(v, yd, height)
        return (
          <g key={t}>
            <path d={`M${PLOT.left} ${y} H${width - PLOT.right}`} stroke="#eef2f7" />
            <text x={PLOT.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
              {formatNum(v, 0)}
            </text>
          </g>
        )
      })}
      {showGrand && (
        <path d={`M${PLOT.left} ${sy(grandMean, yd, height)} H${width - PLOT.right}`} stroke="#0f172a" strokeDasharray="4 4" />
      )}
      {groups.map((group, i) => {
        const style = groupStyle(i)
        const cx = PLOT.left + slot * (i + 0.5)
        const box = boxStats(group.values)
        const x0 = cx - 16
        const x1 = cx + 16
        const y1 = sy(box.q3, yd, height)
        const y2 = sy(box.q1, yd, height)
        const ym = sy(box.median, yd, height)
        const yMean = sy(group.mean, yd, height)
        return (
          <g key={group.name}>
            <path d={`M${cx} ${sy(box.max, yd, height)} V${y1} M${cx} ${y2} V${sy(box.min, yd, height)}`} stroke={style.color} />
            <rect x={x0} y={Math.min(y1, y2)} width={32} height={Math.max(8, Math.abs(y2 - y1))} rx="3" fill={style.color} opacity="0.28" stroke={style.color} />
            <path d={`M${x0} ${ym} H${x1}`} stroke="#0f172a" strokeWidth="2" />
            {showMeans && <path d={`M${x0} ${yMean} H${x1}`} stroke={style.color} strokeDasharray="3 2" />}
            {showBetween && <path d={`M${cx} ${yMean} L${cx} ${sy(grandMean, yd, height)}`} stroke="#0f172a" />}
            {showPoints &&
              points
                .filter((point) => point.a === group.name)
                .map((point, pi) => {
                  const jitter = ((pi % 5) - 2) * 3.2
                  const x = cx + jitter
                  const y = sy(point.y, yd, height)
                  return (
                    <g
                      key={point.id}
                      style={{ cursor: onMove ? 'grab' : 'default' }}
                      onPointerDown={(event) => {
                        event.preventDefault()
                        onSelect?.(point.id)
                        if (onMove) setDragging(point.id)
                      }}
                    >
                      <Marker x={x} y={y} shape={style.shape} color={style.color} selected={selectedId === point.id} size={4} />
                      {showWithin && <path d={`M${x} ${y} L${cx} ${yMean}`} stroke={style.color} opacity="0.35" />}
                    </g>
                  )
                })}
            <text x={cx} y={height - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
              {group.name}
            </text>
            <text x={cx} y={height - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">
              n = {group.n} · {style.shape}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function FDistPlot({
  df1,
  df2,
  fObs,
  fCrit,
  alpha,
  height = 220,
}: {
  df1: number
  df2: number
  fObs: number
  fCrit: number
  alpha: number
  height?: number
}) {
  const width = 560
  const curve = useMemo(() => {
    const hi = Math.max(6, fCrit * 1.8, Math.min(Number.isFinite(fObs) ? fObs * 1.15 : 6, Math.max(fCrit * 4, 12)))
    return fCurve(df1, df2, hi)
  }, [df1, df2, fObs, fCrit])
  const xd: [number, number] = [0, curve[curve.length - 1]?.x ?? 8]
  const fMark = Math.min(fObs, xd[1])
  const yd: [number, number] = [0, Math.max(...curve.map((p) => p.y), 0.01) * 1.15]
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x, xd, width)} ${sy(p.y, yd, height)}`).join(' ')
  const tail = curve.filter((p) => p.x >= fCrit)
  const tailPath =
    tail.length > 1
      ? `M${sx(tail[0]!.x, xd, width)} ${sy(0, yd, height)} ` +
        tail.map((p) => `L${sx(p.x, xd, width)} ${sy(p.y, yd, height)}`).join(' ') +
        ` L${sx(tail[tail.length - 1]!.x, xd, width)} ${sy(0, yd, height)} Z`
      : ''

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="F distribution with observed F and critical value">
      {tailPath && <path d={tailPath} fill="#fecaca" opacity="0.85" />}
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" />
      <path d={`M${sx(fCrit, xd, width)} ${PLOT.top} V${height - PLOT.bottom}`} stroke="#dc2626" strokeDasharray="4 3" />
      <path d={`M${sx(fMark, xd, width)} ${PLOT.top} V${height - PLOT.bottom}`} stroke="#0f172a" />
      <text x={Math.min(sx(fMark, xd, width) + 6, width - 90)} y={28} fontSize="11" fontWeight="700" fill="#0f172a">
        F obs {formatNum(fObs, 2)}
        {fObs > xd[1] ? ' (far tail)' : ''}
      </text>
      <text x={sx(fCrit, xd, width) + 6} y={46} fontSize="11" fill="#dc2626">
        F crit {formatNum(fCrit, 2)} · α = {alpha}
      </text>
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
        F({df1}, {df2})
      </text>
    </svg>
  )
}

export function ForestPlot({
  pairs,
  highlight,
  onSelect,
  height = 260,
}: {
  pairs: PostHocPair[]
  highlight?: string
  onSelect?: (key: string) => void
  height?: number
}) {
  const width = 560
  const diffs = pairs.flatMap((pair) => [pair.ciLo, pair.ciHi, 0])
  const xd = extent(diffs, 0.12)
  const rowH = (height - PLOT.top - PLOT.bottom) / Math.max(pairs.length, 1)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Pairwise confidence intervals">
      <path d={`M${sx(0, xd, width)} ${PLOT.top} V${height - PLOT.bottom}`} stroke="#94a3b8" strokeDasharray="3 3" />
      {pairs.map((pair, i) => {
        const style = ANOVA_PALETTE[i % ANOVA_PALETTE.length]!
        const y = PLOT.top + rowH * (i + 0.5)
        const key = `${pair.a} vs ${pair.b}`
        const on = highlight === key
        return (
          <g key={key} style={{ cursor: 'pointer' }} onClick={() => onSelect?.(key)}>
            <path
              d={`M${sx(pair.ciLo, xd, width)} ${y} H${sx(pair.ciHi, xd, width)}`}
              stroke={style.color}
              strokeWidth={on ? 4 : 2.4}
            />
            <Marker x={sx(pair.diff, xd, width)} y={y} shape={style.shape} color={style.color} size={on ? 6 : 5} />
            <text x={8} y={y + 3} fontSize="10" fontWeight="700" fill="#475569">
              {pair.a} − {pair.b}
            </text>
            <text x={width - 8} y={y + 3} textAnchor="end" fontSize="10" fill={pair.significant ? '#166534' : '#64748b'}>
              {pair.significant ? 'sig' : 'n.s.'} · {style.shape}
            </text>
          </g>
        )
      })}
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
        Mean difference (group 1 − group 2)
      </text>
    </svg>
  )
}

export function InteractionPlot({
  cells,
  aLevels,
  bLevels,
  showLines = true,
  showPoints = true,
  height = 260,
}: {
  cells: Array<{ a: string; b: string; mean: number }>
  aLevels: string[]
  bLevels: string[]
  showLines?: boolean
  showPoints?: boolean
  height?: number
}) {
  const width = 560
  const means = cells.map((cell) => cell.mean)
  const yd = extent(means, 0.16)
  const xd: [number, number] = [-0.2, bLevels.length - 0.8]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Interaction plot of cell means">
      {aLevels.map((a, i) => {
        const style = groupStyle(i)
        const pts = bLevels.map((b, j) => ({
          x: sx(j, xd, width),
          y: sy(cells.find((cell) => cell.a === a && cell.b === b)?.mean ?? 0, yd, height),
        }))
        return (
          <g key={a}>
            {showLines && (
              <path d={pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')} fill="none" stroke={style.color} strokeWidth="2" />
            )}
            {showPoints &&
              pts.map((p, j) => (
                <Marker key={`${a}-${j}`} x={p.x} y={p.y} shape={style.shape} color={style.color} />
              ))}
          </g>
        )
      })}
      {bLevels.map((b, j) => (
        <text key={b} x={sx(j, xd, width)} y={height - 12} textAnchor="middle" fontSize="11" fill="#64748b">
          {b}
        </text>
      ))}
      <text x={14} y="16" fontSize="10" fill="#94a3b8">
        Cell mean
      </text>
    </svg>
  )
}

export function TrajectoryPlot({
  series,
  conditions,
  means,
  height = 240,
}: {
  series: Array<{ id: string; values: number[]; color?: string }>
  conditions: string[]
  means?: number[]
  height?: number
}) {
  const width = 560
  const ys = series.flatMap((item) => item.values)
  const yd = extent(ys, 0.12)
  const xd: [number, number] = [0, Math.max(conditions.length - 1, 1)]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Subject trajectories across conditions">
      {series.map((item, i) => {
        const color = item.color ?? `hsl(${(i * 47) % 360} 55% 48%)`
        const pts = item.values.map((value, j) => ({ x: sx(j, xd, width), y: sy(value, yd, height) }))
        return (
          <path
            key={item.id}
            d={pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')}
            fill="none"
            stroke={color}
            opacity="0.7"
            strokeWidth="1.4"
          />
        )
      })}
      {means && (
        <path
          d={means.map((value, j) => `${j === 0 ? 'M' : 'L'}${sx(j, xd, width)} ${sy(value, yd, height)}`).join(' ')}
          fill="none"
          stroke="#0f172a"
          strokeWidth="2.4"
        />
      )}
      {conditions.map((cond, j) => (
        <text key={cond} x={sx(j, xd, width)} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">
          {cond}
        </text>
      ))}
    </svg>
  )
}

export function ResidualPlots({
  residuals,
  height = 220,
  mode = 'both',
}: {
  residuals: ResidualPoint[]
  height?: number
  mode?: 'both' | 'qq' | 'hist'
}) {
  const width = 360
  const qqXd = extent(residuals.map((p) => p.theoretical))
  const qqYd = extent(residuals.map((p) => p.residual), 0.16)
  const histBins = 10
  const lo = Math.min(...residuals.map((p) => p.residual))
  const hi = Math.max(...residuals.map((p) => p.residual))
  const span = hi - lo || 1
  const bins = Array.from({ length: histBins }, () => 0)
  for (const point of residuals) {
    const idx = Math.min(histBins - 1, Math.floor(((point.residual - lo) / span) * histBins))
    bins[idx] += 1
  }
  const maxBin = Math.max(...bins, 1)
  const qq = (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Normal QQ plot of residuals">
      <path d={`M${PLOT.left} ${height - PLOT.bottom} H${width - PLOT.right} M${PLOT.left} ${PLOT.top} V${height - PLOT.bottom}`} fill="none" stroke="#e2e8f0" />
      <path d={`M${sx(qqXd[0], qqXd, width)} ${sy(qqXd[0], qqYd, height)} L${sx(qqXd[1], qqXd, width)} ${sy(qqXd[1], qqYd, height)}`} stroke="#94a3b8" />
      {residuals.map((point) => (
        <circle key={point.id} cx={sx(point.theoretical, qqXd, width)} cy={sy(point.residual, qqYd, height)} r="3.2" fill="#2563eb" />
      ))}
      <text x={width / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="#64748b">
        Theoretical quantiles
      </text>
    </svg>
  )
  const hist = (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Histogram of residuals">
      <path d={`M${PLOT.left} ${height - PLOT.bottom} H${width - PLOT.right} M${PLOT.left} ${PLOT.top} V${height - PLOT.bottom}`} fill="none" stroke="#e2e8f0" />
      {bins.map((count, i) => {
        const x = PLOT.left + (i * (width - PLOT.left - PLOT.right)) / histBins
        const h = (count / maxBin) * (height - PLOT.top - PLOT.bottom)
        return (
          <rect
            key={i}
            x={x + 1}
            y={height - PLOT.bottom - h}
            width={(width - PLOT.left - PLOT.right) / histBins - 2}
            height={Math.max(h, 0)}
            fill="#2563eb"
            opacity="0.8"
          />
        )
      })}
      <text x={width / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="#64748b">
        Residual
      </text>
    </svg>
  )
  if (mode === 'qq') return qq
  if (mode === 'hist') return hist
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {qq}
      {hist}
    </div>
  )
}

export function VarianceBars({ groups, height = 180 }: { groups: GroupSummary[]; height?: number }) {
  const width = 360
  const maxSd = Math.max(...groups.map((group) => group.sd), 1)
  const slot = (width - 40) / groups.length
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Group standard deviations">
      {groups.map((group, i) => {
        const style = groupStyle(i)
        const h = (group.sd / maxSd) * (height - 50)
        const x = 24 + i * slot
        return (
          <g key={group.name}>
            <rect x={x} y={height - 28 - h} width={slot * 0.55} height={h} rx="4" fill={style.color} opacity="0.8" />
            <text x={x + slot * 0.28} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
              {group.name}
            </text>
            <text x={x + slot * 0.28} y={height - 32 - h} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">
              {formatNum(group.sd, 1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
