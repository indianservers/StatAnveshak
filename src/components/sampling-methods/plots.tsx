import { useEffect, useId, useRef } from 'react'
import type { Population, PopulationUnit } from '../../lib/samplingMethods'

function sizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

export function PopulationCanvas({
  pop,
  selected,
  colorBy = 'selected',
  height = 220,
}: {
  pop: Population
  selected: number[]
  colorBy?: 'selected' | 'group' | 'cluster'
  height?: number
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const selectedSet = new Set(selected)
  const colors = new Map(pop.groups.map((group) => [group.id, group.color]))

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => {
      const width = Math.max(160, canvas.parentElement?.clientWidth ?? 480)
      const ctx = sizeCanvas(canvas, width, height)
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      const cols = Math.max(1, Math.ceil(Math.sqrt(pop.N * (width / Math.max(height, 1)))))
      const rows = Math.ceil(pop.N / cols)
      const pad = 8
      const cellW = (width - pad * 2) / cols
      const cellH = (height - pad * 2) / rows
      const r = Math.max(2.4, Math.min(cellW, cellH) * 0.36)
      pop.units.forEach((unit, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = pad + col * cellW + cellW / 2
        const y = pad + row * cellH + cellH / 2
        const isOn = selectedSet.has(unit.id)
        ctx.beginPath()
        ctx.arc(x, y, isOn ? r + 0.8 : r, 0, Math.PI * 2)
        if (colorBy === 'group') ctx.fillStyle = colors.get(unit.group) ?? '#94a3b8'
        else if (colorBy === 'cluster') ctx.fillStyle = `hsl(${(unit.cluster * 47) % 360} 62% 58%)`
        else ctx.fillStyle = isOn ? '#7c3aed' : '#cbd5e1'
        ctx.fill()
        if (colorBy !== 'selected' && isOn) {
          ctx.strokeStyle = '#0f172a'
          ctx.lineWidth = 1.4
          ctx.stroke()
        }
      })
    }
    draw()
    const observer = new ResizeObserver(draw)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    return () => observer.disconnect()
  }, [pop, selected, colorBy, height])

  return (
    <div className="min-w-0">
      <canvas
        ref={ref}
        className="w-full"
        role="img"
        aria-label={`Population of ${pop.N} units with ${selected.length} selected.`}
      />
    </div>
  )
}

export function OrderedDots({
  N,
  selected,
  maxShow = 60,
}: {
  N: number
  selected: number[]
  maxShow?: number
}) {
  const show = Math.min(N, maxShow)
  const picked = new Set(selected)
  return (
    <ol className="grid grid-cols-5 gap-2 sm:grid-cols-10" aria-label="Ordered population">
      {Array.from({ length: show }, (_, i) => {
        const id = i + 1
        const on = picked.has(id)
        return (
          <li
            key={id}
            className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black ${
              on ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {id}
          </li>
        )
      })}
      {N > show && <li className="self-center text-xs font-semibold text-slate-400">… {N}</li>}
    </ol>
  )
}

export function ShareBars({
  labels,
  values,
  colors,
  title,
}: {
  labels: string[]
  values: number[]
  colors: string[]
  title: string
}) {
  const max = Math.max(0.5, ...values)
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="flex h-40 items-end gap-3">
        {values.map((value, index) => (
          <div key={labels[index]} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[11px] font-bold tabular-nums text-slate-500">{Math.round(value * 100)}%</span>
            <div
              className="w-full rounded-t-lg"
              style={{ height: `${(value / max) * 100}%`, background: colors[index] ?? '#2563eb' }}
            />
            <span className="mt-1 text-[10px] font-semibold text-slate-400">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Histogram({
  values,
  marker,
  label,
}: {
  values: number[]
  marker?: number
  label: string
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const width = canvas.parentElement?.clientWidth ?? 420
    const height = 160
    const ctx = sizeCanvas(canvas, width, height)
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    if (values.length === 0) return
    const lo = Math.min(...values)
    const hi = Math.max(...values)
    const bins = 14
    const widthBin = hi === lo ? 1 : (hi - lo) / bins
    const counts = Array.from({ length: bins }, () => 0)
    for (const value of values) {
      const idx = hi === lo ? 0 : Math.min(bins - 1, Math.floor((value - lo) / widthBin))
      counts[idx] += 1
    }
    const peak = Math.max(1, ...counts)
    const left = 28
    const bottom = height - 22
    const top = 12
    const innerW = width - left - 10
    counts.forEach((count, index) => {
      const h = ((bottom - top) * count) / peak
      const x = left + (index * innerW) / bins
      ctx.fillStyle = '#93c5fd'
      ctx.fillRect(x + 2, bottom - h, innerW / bins - 4, h)
    })
    if (marker !== undefined && Number.isFinite(marker) && hi !== lo) {
      const x = left + ((marker - lo) / (hi - lo)) * innerW
      ctx.strokeStyle = '#d97706'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, bottom)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.fillStyle = '#64748b'
    ctx.font = '11px sans-serif'
    ctx.fillText(lo.toFixed(1), left, height - 6)
    ctx.fillText(hi.toFixed(1), width - 36, height - 6)
  }, [values, marker])

  return <canvas ref={ref} className="w-full" role="img" aria-label={label} />
}

export function ErrorCurve({
  n,
  p,
  bias,
}: {
  n: number
  p: number
  bias: number
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const gradId = useId()
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const width = canvas.parentElement?.clientWidth ?? 420
    const height = 180
    const ctx = sizeCanvas(canvas, width, height)
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    const left = 36
    const bottom = height - 24
    const top = 12
    const innerW = width - left - 12
    const ns = [100, 250, 500, 1000, 2500, 5000, 10000]
    const moes = ns.map((size) => 1.96 * Math.sqrt((p * (1 - p)) / size))
    const maxY = Math.max(0.12, ...moes, Math.abs(bias) + 0.02)
    const xAt = (size: number) => left + ((Math.log(size) - Math.log(100)) / (Math.log(10000) - Math.log(100))) * innerW
    const yAt = (value: number) => bottom - (value / maxY) * (bottom - top)
    ctx.strokeStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, bottom)
    ctx.lineTo(width - 8, bottom)
    ctx.stroke()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    moes.forEach((moe, i) => {
      const x = xAt(ns[i])
      const y = yAt(moe)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    if (bias !== 0) {
      ctx.strokeStyle = '#d97706'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(left, yAt(Math.abs(bias)))
      ctx.lineTo(width - 8, yAt(Math.abs(bias)))
      ctx.stroke()
      ctx.setLineDash([])
    }
    const nx = xAt(n)
    const ny = yAt(1.96 * Math.sqrt((p * (1 - p)) / n))
    ctx.fillStyle = '#2563eb'
    ctx.beginPath()
    ctx.arc(nx, ny, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#64748b'
    ctx.font = '11px sans-serif'
    ctx.fillText('100', left, height - 6)
    ctx.fillText('10,000', width - 48, height - 6)
  }, [n, p, bias, gradId])

  return <canvas ref={ref} className="w-full" role="img" aria-label="Margin of error versus sample size" />
}

export function ClusterGrid({
  pop,
  selectedClusters,
}: {
  pop: Population
  selectedClusters: number[]
}) {
  const picked = new Set(selectedClusters)
  const byCluster = new Map<number, PopulationUnit[]>()
  for (const unit of pop.units) {
    const list = byCluster.get(unit.cluster) ?? []
    list.push(unit)
    byCluster.set(unit.cluster, list)
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[...byCluster.entries()].map(([id, units]) => {
        const on = picked.has(id)
        return (
          <div
            key={id}
            className={`rounded-2xl border px-2 py-2 ${on ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white dark:bg-slate-900'}`}
          >
            <p className="mb-1 text-[11px] font-bold text-slate-500">
              Cluster {id} · n = {units.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {units.slice(0, 12).map((unit) => (
                <span key={unit.id} className={`h-3 w-3 rounded-full ${on ? 'bg-blue-600' : 'bg-slate-300'}`} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
