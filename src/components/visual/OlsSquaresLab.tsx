import { useMemo, useRef, useState } from 'react'
import type { LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { sampleNormal, VIZ } from '../../lib/visualMath'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Point = { x: number; y: number }

function makeCloud(): Point[] {
  return Array.from({ length: 14 }, () => {
    const x = 8 + Math.random() * 24
    const y = 6 + 0.55 * x + sampleNormal(0, 2.4)
    return { x, y }
  })
}

function olsFit(points: Point[]) {
  const n = points.length
  const mx = points.reduce((sum, point) => sum + point.x, 0) / n
  const my = points.reduce((sum, point) => sum + point.y, 0) / n
  const cov = points.reduce((sum, point) => sum + (point.x - mx) * (point.y - my), 0)
  const varx = points.reduce((sum, point) => sum + (point.x - mx) ** 2, 0)
  const slope = cov / Math.max(varx, 1e-9)
  const intercept = my - slope * mx
  return { intercept, slope }
}

function sse(points: Point[], intercept: number, slope: number) {
  return points.reduce((sum, point) => {
    const residual = point.y - (intercept + slope * point.x)
    return sum + residual ** 2
  }, 0)
}

export function OlsSquaresLab({ chapter, reducedMotion }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [points, setPoints] = useState<Point[]>(() => makeCloud())
  const fit = useMemo(() => olsFit(points), [points])
  const [intercept, setIntercept] = useState(fit.intercept)
  const [slope, setSlope] = useState(fit.slope)
  const drag = useRef<'left' | 'right' | null>(null)

  const playback = useLessonPlayback({
    reducedMotion,
    onTick: () => {
      const next = makeCloud()
      const mid = next.reduce((sum, point) => sum + point.y, 0) / next.length
      setPoints(next)
      setIntercept(mid)
      setSlope(0)
    },
    onReset: () => {
      const next = makeCloud()
      const line = olsFit(next)
      setPoints(next)
      setIntercept(line.intercept)
      setSlope(line.slope)
    },
  })

  const xMin = 4
  const xMax = 36
  const sx = (x: number) => 48 + ((x - 4) / 32) * 620
  const sy = (y: number) => 360 - ((y - 2) / 28) * 300
  const leftY = intercept + slope * xMin
  const rightY = intercept + slope * xMax
  const currentSse = sse(points, intercept, slope)
  const bestSse = sse(points, fit.intercept, fit.slope)

  const onPointer = (which: 'left' | 'right', clientY: number, target: SVGSVGElement) => {
    const box = target.getBoundingClientRect()
    const viewY = ((clientY - box.top) / Math.max(box.height, 1)) * 420
    const dataY = 2 + ((360 - viewY) / 300) * 28
    if (which === 'left') {
      const nextSlope = (rightY - dataY) / (xMax - xMin)
      setIntercept(dataY - nextSlope * xMin)
      setSlope(nextSlope)
    } else {
      const nextSlope = (dataY - leftY) / (xMax - xMin)
      setIntercept(leftY - nextSlope * xMin)
      setSlope(nextSlope)
    }
  }

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{}}
      readout={`SSE ${currentSse.toFixed(1)} · OLS ${bestSse.toFixed(1)} · drag the handles`}
      extraControls={
        <button
          type="button"
          onClick={() => {
            setIntercept(fit.intercept)
            setSlope(fit.slope)
          }}
          className="min-h-11 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Snap to OLS
        </button>
      }
    >
      <StageFrame label="Ordinary least squares residual squares">
        <g
          onPointerDown={(event) => {
            const svg = event.currentTarget.ownerSVGElement
            if (!svg) return
            const rect = svg.getBoundingClientRect()
            const px = ((event.clientX - rect.left) / rect.width) * 720
            drag.current = px < 360 ? 'left' : 'right'
            onPointer(drag.current, event.clientY, svg)
            svg.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!drag.current) return
            const svg = event.currentTarget.ownerSVGElement
            if (!svg) return
            onPointer(drag.current, event.clientY, svg)
          }}
          onPointerUp={() => {
            drag.current = null
          }}
        >
          <line x1={sx(xMin)} y1={sy(leftY)} x2={sx(xMax)} y2={sy(rightY)} stroke={VIZ.sample} strokeWidth="4" />
          <circle cx={sx(xMin)} cy={sy(leftY)} r="11" fill={VIZ.ink} />
          <circle cx={sx(xMax)} cy={sy(rightY)} r="11" fill={VIZ.ink} />
        </g>
        {points.map((point, index) => {
          const fitted = intercept + slope * point.x
          const residual = point.y - fitted
          const size = Math.abs(sy(point.y) - sy(fitted))
          return (
            <g key={`${point.x}-${index}`}>
              <rect
                x={sx(point.x) - size / 2}
                y={Math.min(sy(point.y), sy(fitted))}
                width={size}
                height={size}
                fill={residual >= 0 ? VIZ.misuse : VIZ.success}
                opacity="0.35"
              />
              <circle cx={sx(point.x)} cy={sy(point.y)} r="5" fill={VIZ.sample} />
            </g>
          )
        })}
        <text x="40" y="400" fill={VIZ.ink} fontSize="13">
          Squares are squared vertical misses. Snap to OLS when the pile of squares is smallest.
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
