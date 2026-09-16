import { useMemo, useRef, useState } from 'react'
import type { Observation, PairKind } from '../../lib/correlationAssociation'
import { associationLabel, formatNum, mean, olsFit, pearsonR } from '../../lib/correlationAssociation'

type Box = { left: number; right: number; top: number; bottom: number }

const PLOT: Box = { left: 48, right: 16, top: 16, bottom: 36 }

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

function heatColor(value: number): { bg: string; fg: string; pattern: string } {
  if (!Number.isFinite(value)) return { bg: '#e2e8f0', fg: '#334155', pattern: 'undefined' }
  const t = Math.max(-1, Math.min(1, value))
  if (t >= 0) {
    const a = 0.12 + 0.78 * t
    return { bg: `rgba(5, 150, 105, ${a})`, fg: t > 0.45 ? '#ecfdf5' : '#064e3b', pattern: t > 0.08 ? 'positive' : 'near-zero' }
  }
  const a = 0.12 + 0.78 * -t
  return { bg: `rgba(220, 38, 38, ${a})`, fg: t < -0.45 ? '#fef2f2' : '#7f1d1d', pattern: t < -0.08 ? 'negative' : 'near-zero' }
}

export function ScatterPlot({
  points,
  xLabel = 'X',
  yLabel = 'Y',
  showTrend = true,
  showMeans = false,
  showQuadrants = false,
  selectedId,
  highlightIds = [],
  pairKind,
  editable = false,
  onSelect,
  onChange,
  height = 320,
}: {
  points: Observation[]
  xLabel?: string
  yLabel?: string
  showTrend?: boolean
  showMeans?: boolean
  showQuadrants?: boolean
  selectedId?: string
  highlightIds?: string[]
  pairKind?: PairKind
  editable?: boolean
  onSelect?: (id: string | undefined) => void
  onChange?: (points: Observation[]) => void
  height?: number
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const width = 520
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const xDomain = extent(xs)
  const yDomain = extent(ys)
  const mx = mean(xs)
  const my = mean(ys)
  const fit = points.length >= 2 ? olsFit(xs, ys) : null
  const r = pearsonR(xs, ys)

  const toSvg = (event: { clientX: number; clientY: number }) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const box = svg.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * width
    const y = ((event.clientY - box.top) / box.height) * height
    return { x, y }
  }

  const movePoint = (id: string, px: number, py: number) => {
    if (!onChange) return
    onChange(
      points.map((point) =>
        point.id === id ? { ...point, x: invertX(px, xDomain, width), y: invertY(py, yDomain, height) } : point,
      ),
    )
  }

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`Scatter plot of ${points.length} points. ${associationLabel(r)}.`}
        onPointerMove={(event) => {
          if (!dragging) return
          const pt = toSvg(event)
          movePoint(dragging, pt.x, pt.y)
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
        onClick={(event) => {
          if (!editable || !onChange) return
          const target = event.target as SVGElement
          if (target.tagName === 'circle') return
          const pt = toSvg(event)
          if (pt.x < PLOT.left || pt.y > height - PLOT.bottom) return
          onChange([
            ...points,
            { id: `new-${Date.now()}`, x: invertX(pt.x, xDomain, width), y: invertY(pt.y, yDomain, height) },
          ])
        }}
      >
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
        <path
          d={`M${PLOT.left} ${PLOT.top} V${height - PLOT.bottom} H${width - PLOT.right}`}
          fill="none"
          stroke="#cbd5e1"
        />
        {showQuadrants && Number.isFinite(mx) && Number.isFinite(my) && (
          <>
            <rect x={scaleX(mx, xDomain, width)} y={PLOT.top} width={Math.max(0, width - PLOT.right - scaleX(mx, xDomain, width))} height={Math.max(0, scaleY(my, yDomain, height) - PLOT.top)} fill="#dcfce7" opacity="0.35" />
            <rect x={PLOT.left} y={scaleY(my, yDomain, height)} width={Math.max(0, scaleX(mx, xDomain, width) - PLOT.left)} height={Math.max(0, height - PLOT.bottom - scaleY(my, yDomain, height))} fill="#dcfce7" opacity="0.35" />
            <rect x={PLOT.left} y={PLOT.top} width={Math.max(0, scaleX(mx, xDomain, width) - PLOT.left)} height={Math.max(0, scaleY(my, yDomain, height) - PLOT.top)} fill="#fee2e2" opacity="0.3" />
            <rect x={scaleX(mx, xDomain, width)} y={scaleY(my, yDomain, height)} width={Math.max(0, width - PLOT.right - scaleX(mx, xDomain, width))} height={Math.max(0, height - PLOT.bottom - scaleY(my, yDomain, height))} fill="#fee2e2" opacity="0.3" />
          </>
        )}
        {(showMeans || showQuadrants) && Number.isFinite(mx) && (
          <line x1={scaleX(mx, xDomain, width)} y1={PLOT.top} x2={scaleX(mx, xDomain, width)} y2={height - PLOT.bottom} stroke="#94a3b8" strokeDasharray="4 4" />
        )}
        {(showMeans || showQuadrants) && Number.isFinite(my) && (
          <line x1={PLOT.left} y1={scaleY(my, yDomain, height)} x2={width - PLOT.right} y2={scaleY(my, yDomain, height)} stroke="#94a3b8" strokeDasharray="4 4" />
        )}
        {showTrend && fit && Number.isFinite(fit.slope) && (
          <line
            x1={scaleX(xDomain[0], xDomain, width)}
            y1={scaleY(fit.intercept + fit.slope * xDomain[0], yDomain, height)}
            x2={scaleX(xDomain[1], xDomain, width)}
            y2={scaleY(fit.intercept + fit.slope * xDomain[1], yDomain, height)}
            stroke="#2563eb"
            strokeWidth="2.2"
          />
        )}
        {highlightIds.length === 2 && (() => {
          const a = points.find((point) => point.id === highlightIds[0])
          const b = points.find((point) => point.id === highlightIds[1])
          if (!a || !b) return null
          const color = pairKind === 'discordant' ? '#dc2626' : pairKind === 'concordant' ? '#059669' : '#d97706'
          return (
            <line
              x1={scaleX(a.x, xDomain, width)}
              y1={scaleY(a.y, yDomain, height)}
              x2={scaleX(b.x, xDomain, width)}
              y2={scaleY(b.y, yDomain, height)}
              stroke={color}
              strokeWidth="2.4"
              strokeDasharray={pairKind?.startsWith('tie') ? '5 4' : undefined}
            />
          )
        })()}
        {points.map((point) => {
          const selected = point.id === selectedId || highlightIds.includes(point.id)
          const groupColor = point.group === 'B' ? '#7c3aed' : point.group === 'A' ? '#2563eb' : '#2563eb'
          return (
            <circle
              key={point.id}
              cx={scaleX(point.x, xDomain, width)}
              cy={scaleY(point.y, yDomain, height)}
              r={selected ? 6.5 : 4.4}
              fill={selected ? '#0f172a' : groupColor}
              stroke={selected ? '#fbbf24' : '#fff'}
              strokeWidth={selected ? 2 : 1}
              onPointerDown={(event) => {
                event.stopPropagation()
                onSelect?.(point.id)
                if (editable) {
                  setDragging(point.id)
                  event.currentTarget.setPointerCapture(event.pointerId)
                }
              }}
              onDoubleClick={(event) => {
                event.stopPropagation()
                if (editable && onChange) onChange(points.filter((item) => item.id !== point.id))
              }}
            >
              <title>{`${xLabel} ${formatNum(point.x, 2)}, ${yLabel} ${formatNum(point.y, 2)}`}</title>
            </circle>
          )
        })}
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
          {xLabel}
        </text>
        <text x="14" y={height / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90 14 ${height / 2})`}>
          {yLabel}
        </text>
      </svg>
      {editable && (
        <p className="mt-1 text-[11px] text-slate-400">
          Click empty space to add a point. Drag to move. Double-click a point to delete it.
        </p>
      )}
    </div>
  )
}

export function MiniCloud({ kind }: { kind: 'pos' | 'neg' | 'none' | 'curve' | 'weak' }) {
  const pts =
    kind === 'pos'
      ? [[8, 28], [16, 24], [24, 20], [32, 16], [40, 12], [48, 10]]
      : kind === 'neg'
        ? [[8, 10], [16, 14], [24, 18], [32, 22], [40, 26], [48, 30]]
        : kind === 'curve'
          ? [[8, 26], [16, 16], [24, 10], [32, 16], [40, 24], [48, 30]]
          : kind === 'weak'
            ? [[10, 18], [18, 22], [26, 16], [34, 24], [42, 20], [48, 26]]
            : [[10, 12], [18, 26], [24, 16], [32, 28], [40, 14], [48, 22]]
  return (
    <svg viewBox="0 0 56 36" width="72" height="44" aria-hidden>
      {pts.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={kind === 'neg' ? '#dc2626' : kind === 'none' ? '#64748b' : '#2563eb'} />
      ))}
    </svg>
  )
}

export function CorrelationMeter({ value }: { value: number }) {
  const left = Number.isFinite(value) ? ((value + 1) / 2) * 100 : 50
  return (
    <div>
      <div className="corr-meter" aria-hidden>
        {Number.isFinite(value) && <span className="corr-meter-thumb" style={{ left: `${left}%` }} />}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
        <span>−1</span>
        <span>0</span>
        <span>+1</span>
      </div>
      <p className="sr-only">
        Correlation meter at {Number.isFinite(value) ? formatNum(value, 3) : 'undefined'}.
      </p>
    </div>
  )
}

export function Heatmap({
  labels,
  values,
  ns,
  selected,
  onSelect,
}: {
  labels: string[]
  values: number[][]
  ns: number[][]
  selected?: [number, number]
  onSelect?: (i: number, j: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="corr-heat">
        <caption className="sr-only">Correlation matrix. Color and sign both encode direction.</caption>
        <thead>
          <tr>
            <th />
            {labels.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, i) => (
            <tr key={rowLabel}>
              <th scope="row">{rowLabel}</th>
              {labels.map((colLabel, j) => {
                const value = values[i][j]
                const color = heatColor(value)
                const active = selected && ((selected[0] === i && selected[1] === j) || (selected[0] === j && selected[1] === i))
                return (
                  <td key={colLabel}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(i, j)}
                      style={{ background: color.bg, color: color.fg, outline: active ? '2px solid #0f172a' : undefined }}
                      aria-label={`${rowLabel} and ${colLabel}: ${Number.isFinite(value) ? formatNum(value, 2) : 'undefined'}, ${color.pattern}, pairwise n ${ns[i][j]}`}
                    >
                      {Number.isFinite(value) ? formatNum(value, 2) : '—'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Dag({
  nodes,
  edges,
  reveal,
}: {
  nodes: Array<{ id: string; label: string; x: number; y: number; tone?: 'cause' | 'effect' }>
  edges: Array<{ from: string; to: string; hidden?: boolean; dashed?: boolean }>
  reveal?: boolean
}) {
  const byId = useMemo(() => Object.fromEntries(nodes.map((node) => [node.id, node])), [nodes])
  return (
    <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="Directed relationship diagram">
      {edges.map((edge) => {
        const a = byId[edge.from]
        const b = byId[edge.to]
        if (!a || !b || (edge.hidden && !reveal)) return null
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={edge.dashed ? '#94a3b8' : '#2563eb'}
            strokeWidth="2"
            strokeDasharray={edge.dashed ? '6 4' : undefined}
            markerEnd="url(#corr-arrow)"
          />
        )
      })}
      <defs>
        <marker id="corr-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#2563eb" />
        </marker>
      </defs>
      {nodes.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="22" fill={node.tone === 'cause' ? '#fef3c7' : '#eff6ff'} stroke={node.tone === 'cause' ? '#d97706' : '#2563eb'} />
          <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
