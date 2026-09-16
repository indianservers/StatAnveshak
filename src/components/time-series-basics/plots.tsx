import { useMemo, useRef, useState } from 'react'
import type { TsObservation } from '../../lib/timeSeriesBasics'

type Box = { left: number; right: number; top: number; bottom: number }
const PLOT: Box = { left: 52, right: 16, top: 16, bottom: 36 }

function extent(values: number[], pad = 0.08): [number, number] {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return [0, 1]
  const lo = Math.min(...finite)
  const hi = Math.max(...finite)
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

function ticks(domain: [number, number], count = 4) {
  const span = domain[1] - domain[0]
  return Array.from({ length: count + 1 }, (_, i) => domain[0] + (span * i) / count)
}

export type ChartSeries = {
  id: string
  values: Array<number | undefined>
  color?: string
  dashed?: boolean
  dotted?: boolean
  markers?: boolean
  width?: number
  label: string
}

export function Sparkline({ values, color = '#2563eb', dashed = false }: { values: number[]; color?: string; dashed?: boolean }) {
  const w = 160
  const h = 42
  const xd: [number, number] = [0, Math.max(1, values.length - 1)]
  const yd = extent(values, 0.15)
  const d = values
    .map((value, i) => `${i === 0 ? 'M' : 'L'}${8 + (i / xd[1]) * (w - 16)},${h - 6 - ((value - yd[0]) / (yd[1] - yd[0])) * (h - 12)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeDasharray={dashed ? '4 3' : undefined} />
    </svg>
  )
}

export function TimeChart({
  series,
  labels,
  xLabel = 'Time',
  yLabel = 'Value',
  height = 280,
  showGrid = true,
  bands,
  annotations,
  editable,
  selectedId,
  points,
  onSelect,
  onChange,
  onAdd,
  yDomain,
  xDomain,
  title,
}: {
  series: ChartSeries[]
  labels?: string[]
  xLabel?: string
  yLabel?: string
  height?: number
  showGrid?: boolean
  bands?: Array<{ x0: number; x1: number; fill: string; label: string }>
  annotations?: Array<{ x: number; y: number; text: string }>
  editable?: boolean
  selectedId?: string
  points?: TsObservation[]
  onSelect?: (id: string | undefined) => void
  onChange?: (points: TsObservation[]) => void
  onAdd?: (point: { t: number; value: number }) => void
  yDomain?: [number, number]
  xDomain?: [number, number]
  title?: string
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const width = 720
  const n = Math.max(2, ...series.map((item) => item.values.length), points?.length ?? 0)
  const allY = series.flatMap((item) => item.values.filter((value): value is number => value !== undefined && Number.isFinite(value)))
  if (points) allY.push(...points.map((row) => row.value))
  const xd = xDomain ?? [0, n - 1]
  const yd = yDomain ?? extent(allY, 0.12)

  const toSvg = (event: { clientX: number; clientY: number }) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const box = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - box.left) / box.width) * width,
      y: ((event.clientY - box.top) / box.height) * height,
    }
  }

  const pathFor = (values: Array<number | undefined>) => {
    const parts: string[] = []
    values.forEach((value, i) => {
      if (value === undefined || !Number.isFinite(value)) return
      const cmd = parts.length === 0 || values[i - 1] === undefined ? 'M' : 'L'
      parts.push(`${cmd}${scaleX(i, xd, width).toFixed(1)},${scaleY(value, yd, height).toFixed(1)}`)
    })
    return parts.join(' ')
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full touch-none"
      role="img"
      aria-label={title ?? `${yLabel} over ${xLabel}`}
      onPointerMove={(event) => {
        if (!dragging || !onChange || !points) return
        const pt = toSvg(event)
        onChange(points.map((row) => (row.id === dragging ? { ...row, value: invertY(pt.y, yd, height) } : row)))
      }}
      onPointerUp={() => setDragging(null)}
      onPointerLeave={() => setDragging(null)}
      onDoubleClick={(event) => {
        if (!onAdd) return
        const pt = toSvg(event)
        onAdd({ t: Math.round(invertX(pt.x, xd, width)), value: invertY(pt.y, yd, height) })
      }}
    >
      {showGrid &&
        ticks(yd).map((tick) => (
          <g key={`y-${tick}`}>
            <line x1={PLOT.left} x2={width - PLOT.right} y1={scaleY(tick, yd, height)} y2={scaleY(tick, yd, height)} stroke="#eef2f7" />
            <text x={PLOT.left - 8} y={scaleY(tick, yd, height) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
              {tick.toFixed(0)}
            </text>
          </g>
        ))}
      {bands?.map((band) => (
        <rect
          key={band.label}
          x={scaleX(band.x0, xd, width)}
          y={PLOT.top}
          width={Math.max(1, scaleX(band.x1, xd, width) - scaleX(band.x0, xd, width))}
          height={height - PLOT.top - PLOT.bottom}
          fill={band.fill}
        >
          <title>{band.label}</title>
        </rect>
      ))}
      <line x1={PLOT.left} x2={width - PLOT.right} y1={height - PLOT.bottom} y2={height - PLOT.bottom} stroke="#cbd5e1" />
      <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={height - PLOT.bottom} stroke="#cbd5e1" />
      {series.map((item) => (
        <g key={item.id}>
          <path
            d={pathFor(item.values)}
            fill="none"
            stroke={item.color ?? '#2563eb'}
            strokeWidth={item.width ?? 2}
            strokeDasharray={item.dashed ? '6 4' : item.dotted ? '2 3' : undefined}
          />
          {item.markers &&
            item.values.map((value, i) =>
              value === undefined ? null : (
                <circle
                  key={`${item.id}-${i}`}
                  cx={scaleX(i, xd, width)}
                  cy={scaleY(value, yd, height)}
                  r={3}
                  fill="#fff"
                  stroke={item.color ?? '#2563eb'}
                  strokeWidth="1.6"
                />
              ),
            )}
        </g>
      ))}
      {points?.map((row) => (
        <circle
          key={row.id}
          cx={scaleX(row.t, xd, width)}
          cy={scaleY(row.value, yd, height)}
          r={row.id === selectedId ? 5.5 : 3.4}
          fill={row.id === selectedId ? '#1d4ed8' : '#2563eb'}
          stroke="#fff"
          strokeWidth="1.2"
          className={editable ? 'cursor-pointer' : undefined}
          onPointerDown={(event) => {
            if (!editable) return
            event.preventDefault()
            setDragging(row.id)
            onSelect?.(row.id)
          }}
        >
          <title>{`${row.label ?? row.t}: ${row.value.toFixed(2)}`}</title>
        </circle>
      ))}
      {ticks(xd, Math.min(5, Math.max(1, n - 1))).map((tick) => {
        const i = Math.min(n - 1, Math.max(0, Math.round(tick)))
        const label = labels?.[i] ?? String(i + 1)
        const short = label.length > 12 ? label.replace(/^\w{3}\s/, '') : label
        return (
          <text key={`x-${tick}`} x={scaleX(i, xd, width)} y={height - 12} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {short}
          </text>
        )
      })}
      {annotations?.map((note) => (
        <text key={note.text} x={scaleX(note.x, xd, width)} y={scaleY(note.y, yd, height) - 8} fontSize="11" fill="#64748b">
          {note.text}
        </text>
      ))}
      <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#64748b">
        {xLabel}
      </text>
      <text x="14" y="14" fontSize="11" fill="#64748b">
        {yLabel}
      </text>
    </svg>
  )
}

export function LagScatter({
  current,
  lagged,
  r,
}: {
  current: number[]
  lagged: number[]
  r: number | undefined
}) {
  const width = 360
  const height = 240
  const xd = extent(lagged, 0.12)
  const yd = extent(current, 0.12)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Scatter of Y t versus Y t minus lag, r equals ${r ?? 'undefined'}`}>
      <line x1={PLOT.left} x2={width - 16} y1={height - 32} y2={height - 32} stroke="#cbd5e1" />
      <line x1={PLOT.left} x2={PLOT.left} y1={16} y2={height - 32} stroke="#cbd5e1" />
      {lagged.map((x, i) => (
        <circle key={i} cx={scaleX(x, xd, width)} cy={scaleY(current[i]!, yd, height)} r="3.2" fill="#2563eb" />
      ))}
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
        Y(t − k)
      </text>
      <text x="12" y="14" fontSize="11" fill="#64748b">
        Y(t)
      </text>
    </svg>
  )
}

export function BarCorrChart({
  result,
  title,
  color = '#2563eb',
  showBand = true,
}: {
  result: { lags: number[]; values: Array<number | undefined>; band: number }
  title: string
  color?: string
  showBand?: boolean
}) {
  const width = 520
  const height = 220
  const maxLag = Math.max(1, result.lags[result.lags.length - 1] ?? 1)
  const barW = Math.min(14, (width - PLOT.left - 20) / (maxLag + 1.5))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={title}>
      <line x1={PLOT.left} x2={width - 16} y1={scaleY(0, [-1, 1], height)} y2={scaleY(0, [-1, 1], height)} stroke="#94a3b8" />
      {showBand && Number.isFinite(result.band) && (
        <>
          <line x1={PLOT.left} x2={width - 16} y1={scaleY(result.band, [-1, 1], height)} y2={scaleY(result.band, [-1, 1], height)} stroke="#94a3b8" strokeDasharray="4 3" />
          <line x1={PLOT.left} x2={width - 16} y1={scaleY(-result.band, [-1, 1], height)} y2={scaleY(-result.band, [-1, 1], height)} stroke="#94a3b8" strokeDasharray="4 3" />
          <text x={width - 18} y={scaleY(result.band, [-1, 1], height) - 4} textAnchor="end" fontSize="9" fill="#64748b">
            ±1.96/√n
          </text>
        </>
      )}
      {result.lags.map((lag, i) => {
        const value = result.values[i]
        if (value === undefined || !Number.isFinite(value)) return null
        const x = scaleX(lag, [0, maxLag], width)
        const y0 = scaleY(0, [-1, 1], height)
        const y1 = scaleY(value, [-1, 1], height)
        return (
          <g key={lag}>
            <rect x={x - barW / 2} y={Math.min(y0, y1)} width={barW} height={Math.max(1.5, Math.abs(y1 - y0))} fill={color} />
            {lag % Math.ceil(maxLag / 6) === 0 && (
              <text x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {lag}
              </text>
            )}
          </g>
        )
      })}
      <text x="12" y="14" fontSize="11" fill="#64748b">
        Correlation
      </text>
    </svg>
  )
}

export function SeasonBars({ values, labels, yLabel = 'Index' }: { values: number[]; labels: string[]; yLabel?: string }) {
  const width = 520
  const height = 220
  const finite = values.filter(Number.isFinite)
  const yd = extent(finite.length ? [...finite, 0] : [0, 1], 0.08)
  const barW = Math.min(22, (width - PLOT.left - 20) / Math.max(values.length, 1))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Average value for each season">
      <line x1={PLOT.left} x2={width - 16} y1={scaleY(0, yd, height)} y2={scaleY(0, yd, height)} stroke="#cbd5e1" />
      {values.map((value, i) => {
        const x = scaleX(i, [0, Math.max(1, values.length - 1)], width)
        const y0 = scaleY(0, yd, height)
        const y1 = scaleY(value, yd, height)
        return (
          <g key={labels[i] ?? i}>
            <rect x={x - barW / 2} y={Math.min(y0, y1)} width={barW} height={Math.max(1.5, Math.abs(y1 - y0))} fill={i === 11 ? '#f59e0b' : '#2563eb'} />
            <text x={x} y={height - 12} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {labels[i] ?? i + 1}
            </text>
          </g>
        )
      })}
      <text x="12" y="14" fontSize="11" fill="#64748b">
        {yLabel}
      </text>
    </svg>
  )
}

export function SeasonalSubseries({
  values,
  period,
  labels,
}: {
  values: number[]
  period: number
  labels: string[]
}) {
  const years = Math.ceil(values.length / period)
  const colors = ['#2563eb', '#f43f5e', '#f59e0b', '#10b981', '#7c3aed', '#0ea5e9']
  const dashes = [undefined, '6 3', '2 3', '8 3 2 3']
  const series: ChartSeries[] = useMemo(
    () =>
      Array.from({ length: years }, (_, year) => ({
        id: `year-${year}`,
        label: `Year ${year + 1}`,
        color: colors[year % colors.length],
        dashed: Boolean(dashes[year % dashes.length]),
        values: Array.from({ length: period }, (_, season) => values[year * period + season]),
        markers: true,
      })),
    [period, values, years],
  )
  return <TimeChart series={series} labels={labels} xLabel="Season" yLabel="Value" height={220} />
}
