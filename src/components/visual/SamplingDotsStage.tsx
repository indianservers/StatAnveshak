import { useCallback, useMemo, useState } from 'react'

function gaussian(mu: number, sigma: number) {
  const u = 1 - Math.random()
  const v = Math.random()
  return mu + sigma * Math.sqrt(-2 * Math.log(Math.max(u, 1e-12))) * Math.cos(2 * Math.PI * v)
}

export function SamplingDotsStage({
  draws,
  mu,
  reducedMotion,
}: {
  draws: number[]
  mu: number
  reducedMotion: boolean
}) {
  const stats = useMemo(() => {
    if (draws.length === 0) return { mean: mu, min: mu - 4, max: mu + 4 }
    const visibleDraws = draws.slice(-400)
    const mean = visibleDraws.reduce((sum, value) => sum + value, 0) / visibleDraws.length
    const min = Math.min(...visibleDraws, mu - 4)
    const max = Math.max(...visibleDraws, mu + 4)
    return { mean, min, max }
  }, [draws, mu])
  const visible = draws.slice(-400)

  const width = 720
  const height = 420
  const pad = 28
  const x = (value: number) => pad + ((value - stats.min) / Math.max(stats.max - stats.min, 0.001)) * (width - pad * 2)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Sampling stage">
      <rect width={width} height={height} fill="#020617" />
      <line x1={x(mu)} y1="24" x2={x(mu)} y2={height - 36} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" />
      <text x={x(mu) + 8} y="22" fill="#94a3b8" fontSize="12">population μ</text>
      {visible.map((value, index) => {
        const cx = x(value)
        const cy = 56 + (index % 14) * 22 + ((index * 7) % 11)
        return (
          <circle
            key={`${value}-${index}`}
            cx={cx}
            cy={Math.min(height - 48, cy)}
            r="5"
            fill="#818cf8"
            opacity={0.85}
            style={reducedMotion ? undefined : { transition: 'cx 100ms linear' }}
          />
        )
      })}
      <line x1={x(stats.mean)} y1="24" x2={x(stats.mean)} y2={height - 36} stroke="#34d399" strokeWidth="2" />
      <text x={16} y={height - 14} fill="#cbd5e1" fontSize="13">
        {visible.length} draws · sample mean {stats.mean.toFixed(2)}
      </text>
    </svg>
  )
}

export function nextDraw(mu: number, spread: number) {
  return gaussian(mu, spread)
}

export function useDraws() {
  const [draws, setDraws] = useState<number[]>([])
  const add = useCallback((value: number) => {
    setDraws((current) => [...current.slice(-799), value])
  }, [])
  const reset = useCallback(() => setDraws([]), [])
  return { draws, add, reset }
}
