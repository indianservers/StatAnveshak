import { useId, useMemo } from 'react'
import { curvePoints, type Distribution } from '../../lib/distributions'

type Overlay = {
  x: number[]
  y: number[]
  color: string
  dash?: string
  label: string
}

export function DistChart({
  dist,
  params,
  mode = 'density',
  shade,
  highlightX,
  overlays = [],
  data,
  height = 220,
}: {
  dist: Distribution
  params: Record<string, number>
  mode?: 'density' | 'cdf'
  shade?: { lo: number; hi: number }
  highlightX?: number
  overlays?: Overlay[]
  data?: number[]
  height?: number
}) {
  const uid = useId()
  const curve = useMemo(() => curvePoints(dist, params, mode, data), [data, dist, mode, params])
  const width = 520
  const pad = { l: 44, r: 16, t: 18, b: 36 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const xs = curve.x
  const ys = curve.y
  const xMin = xs[0] ?? 0
  const xMax = xs[xs.length - 1] ?? 1
  const yMax = Math.max(0.0001, ...ys, ...overlays.flatMap((o) => o.y), 0.05)
  const xAt = (x: number) => pad.l + ((x - xMin) / Math.max(1e-9, xMax - xMin)) * innerW
  const yAt = (y: number) => pad.t + innerH - (y / yMax) * innerH
  const ticks = 5
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) => xMin + (i / ticks) * (xMax - xMin))
  const yTicks = Array.from({ length: 5 }, (_, i) => (i / 4) * yMax)

  const shadePath = useMemo(() => {
    if (!shade || curve.type === 'bar') return ''
    const lo = Math.min(shade.lo, shade.hi)
    const hi = Math.max(shade.lo, shade.hi)
    const pts = xs.map((x, i) => ({ x, y: ys[i] ?? 0 })).filter((p) => p.x >= lo && p.x <= hi)
    if (pts.length < 2) return ''
    return `M ${xAt(pts[0].x)} ${yAt(0)} ${pts.map((p) => `L ${xAt(p.x)} ${yAt(p.y)}`).join(' ')} L ${xAt(pts[pts.length - 1].x)} ${yAt(0)} Z`
  }, [curve.type, shade, xAt, xs, yAt, ys])

  const linePath = useMemo(() => {
    if (curve.type === 'bar' || xs.length < 2) return ''
    return xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${xAt(x)} ${yAt(ys[i] ?? 0)}`).join(' ')
  }, [curve.type, xAt, xs, yAt, ys])

  const areaPath = useMemo(() => {
    if (!linePath) return ''
    return `M ${xAt(xs[0])} ${yAt(0)} ${xs.map((x, i) => `L ${xAt(x)} ${yAt(ys[i] ?? 0)}`).join(' ')} L ${xAt(xs[xs.length - 1])} ${yAt(0)} Z`
  }, [linePath, xAt, xs, yAt, ys])

  const fmt = (v: number) => {
    if (!Number.isFinite(v)) return '—'
    const a = Math.abs(v)
    if (a >= 100) return v.toFixed(0)
    if (a >= 10) return v.toFixed(1)
    return v.toFixed(2)
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={`${dist.name} ${mode === 'cdf' ? 'CDF' : dist.family === 'discrete' ? 'PMF' : 'PDF'}`}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {yTicks.map((y, i) => (
        <line key={`gy-${i}`} x1={pad.l} x2={width - pad.r} y1={yAt(y)} y2={yAt(y)} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {xTicks.map((x, i) => (
        <g key={`xt-${i}`}>
          <text x={xAt(x)} y={height - 10} textAnchor="middle" className="fill-slate-400" fontSize="10">{fmt(x)}</text>
        </g>
      ))}
      {yTicks.map((y, i) => (
        <text key={`yt-${i}`} x={pad.l - 6} y={yAt(y) + 3} textAnchor="end" className="fill-slate-400" fontSize="10">{fmt(y)}</text>
      ))}
      {curve.type === 'bar' ? (
        xs.map((x, i) => {
          const y = ys[i] ?? 0
          const gap = Math.max(2, innerW / Math.max(xs.length, 1) * 0.22)
          const bw = Math.max(4, innerW / Math.max(xs.length, 1) - gap)
          const highlighted = highlightX !== undefined && Math.round(x) === Math.round(highlightX)
          const inShade = shade ? x >= Math.min(shade.lo, shade.hi) - 1e-9 && x <= Math.max(shade.lo, shade.hi) + 1e-9 : highlighted
          const bernoulliTone = dist.id === 'bernoulli' ? (Math.round(x) === 1 ? '#10b981' : '#818cf8') : null
          return (
            <g key={x}>
              <rect
                x={xAt(x) - bw / 2}
                y={yAt(y)}
                width={bw}
                height={Math.max(0, yAt(0) - yAt(y))}
                rx={4}
                fill={bernoulliTone ?? (inShade ? '#10b981' : '#818cf8')}
                opacity={inShade || bernoulliTone ? 1 : 0.72}
              />
              {xs.length <= 16 ? (
                <text x={xAt(x)} y={yAt(y) - 4} textAnchor="middle" className="fill-slate-500" fontSize="9">{y.toFixed(2)}</text>
              ) : null}
            </g>
          )
        })
      ) : (
        <>
          <path d={areaPath} fill={`url(#${uid}-fill)`} />
          {shadePath ? <path d={shadePath} fill={`url(#${uid}-shade)`} /> : null}
          <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.4" strokeLinejoin="round" />
        </>
      )}
      {overlays.map((overlay) => {
        const path = overlay.x.map((x, i) => `${i === 0 ? 'M' : 'L'} ${xAt(x)} ${yAt(overlay.y[i] ?? 0)}`).join(' ')
        return <path key={overlay.label} d={path} fill="none" stroke={overlay.color} strokeWidth="2" strokeDasharray={overlay.dash} />
      })}
      {highlightX !== undefined && curve.type !== 'bar' ? (
        <line x1={xAt(highlightX)} x2={xAt(highlightX)} y1={pad.t} y2={height - pad.b} stroke="#64748b" strokeDasharray="4 4" />
      ) : null}
    </svg>
  )
}
