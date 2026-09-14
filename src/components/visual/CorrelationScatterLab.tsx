import { useState } from 'react'
import { meanOf, sdOf, VIZ } from '../../lib/visualMath'
import { LessonChoice } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Pair = { x: number; y: number }

function pearson(pairs: Pair[]) {
  if (pairs.length < 2) return 0
  const xs = pairs.map((pair) => pair.x)
  const ys = pairs.map((pair) => pair.y)
  const mx = meanOf(xs)
  const my = meanOf(ys)
  const sx = sdOf(xs)
  const sy = sdOf(ys)
  if (sx === 0 || sy === 0) return 0
  const cov = pairs.reduce((sum, pair) => sum + (pair.x - mx) * (pair.y - my), 0) / (pairs.length - 1)
  return cov / (sx * sy)
}

function ols(pairs: Pair[]) {
  const mx = meanOf(pairs.map((pair) => pair.x))
  const my = meanOf(pairs.map((pair) => pair.y))
  const sxx = pairs.reduce((sum, pair) => sum + (pair.x - mx) ** 2, 0)
  const sxy = pairs.reduce((sum, pair) => sum + (pair.x - mx) * (pair.y - my), 0)
  const slope = sxx === 0 ? 0 : sxy / sxx
  return { intercept: my - slope * mx, slope }
}

function shuffleY(pairs: Pair[]) {
  const ys = pairs.map((pair) => pair.y)
  for (let i = ys.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = ys[i]
    const b = ys[j]
    ys[i] = b ?? a ?? 0
    ys[j] = a ?? 0
  }
  return pairs.map((pair, index) => ({ x: pair.x, y: ys[index] ?? pair.y }))
}

export function CorrelationScatterLab({
  pairs,
  xLabel,
  yLabel,
  reducedMotion,
}: {
  pairs: Pair[]
  xLabel: string
  yLabel: string
  reducedMotion: boolean
}) {
  const [shuffled, setShuffled] = useState<Pair[] | null>(null)
  const [showLine, setShowLine] = useState(true)
  const [showStalks, setShowStalks] = useState(true)
  const original = pairs
  const data = shuffled ?? original
  const r = pearson(data)
  const fit = ols(data)

  const playback = useLessonPlayback({
    reducedMotion,
    onTick: () => setShuffled(shuffleY(original)),
    onReset: () => setShuffled(null),
  })

  const xs = data.map((pair) => pair.x)
  const ys = data.map((pair) => pair.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const xSpan = xMax - xMin || 1
  const ySpan = yMax - yMin || 1
  const px = (value: number) => 48 + ((value - xMin) / xSpan) * 620
  const py = (value: number) => 360 - ((value - yMin) / ySpan) * 300

  const lineX0 = xMin
  const lineX1 = xMax
  const ellipse = (() => {
    const cx = (xMin + xMax) / 2
    const cy = (yMin + yMax) / 2
    const rx = (xSpan / 2) * (0.35 + Math.abs(r) * 0.55)
    const ry = (ySpan / 2) * (0.85 - Math.abs(r) * 0.55)
    return { cx: px(cx), cy: py(cy), rx: (rx / xSpan) * 620, ry: (ry / ySpan) * 300, rotate: r >= 0 ? -28 : 28 }
  })()

  return (
    <VisualLesson
      title="Correlation"
      intuition="r is the skinny ellipse around the cloud. Shuffle Y and the association dissolves — that is the null picture."
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula="r = \\mathrm{corr}(X,Y)"
      misuse="Association is not causation. A shuffled cloud is what “no relationship” looks like."
      readout={`r = ${r.toFixed(2)} · ${shuffled ? 'Y shuffled' : 'observed pairs'} · ${xLabel} vs ${yLabel}`}
      extraControls={
        <>
          <LessonChoice
            label="Least-squares line"
            value={showLine ? 'on' : 'off'}
            options={[
              { id: 'on', label: 'Show' },
              { id: 'off', label: 'Hide' },
            ]}
            effect="The line is a vertical-miss fit, not a causal story."
            onChange={(value) => setShowLine(value === 'on')}
          />
          <LessonChoice
            label="Residual stalks"
            value={showStalks ? 'on' : 'off'}
            options={[
              { id: 'on', label: 'Show' },
              { id: 'off', label: 'Hide' },
            ]}
            effect="Each stalk is y minus the line at that x."
            onChange={(value) => setShowStalks(value === 'on')}
          />
          <p className="text-xs leading-5 text-slate-500">Play permutes Y. Reset restores the observed pairing.</p>
        </>
      }
    >
      <StageFrame label="Correlation scatter with residual stalks">
        <ellipse
          cx={ellipse.cx}
          cy={ellipse.cy}
          rx={Math.max(18, ellipse.rx)}
          ry={Math.max(12, ellipse.ry)}
          transform={`rotate(${ellipse.rotate} ${ellipse.cx} ${ellipse.cy})`}
          fill={VIZ.sampling}
          opacity="0.18"
          stroke={VIZ.sampling}
        />
        {showLine && (
          <line
            x1={px(lineX0)}
            y1={py(fit.intercept + fit.slope * lineX0)}
            x2={px(lineX1)}
            y2={py(fit.intercept + fit.slope * lineX1)}
            stroke={VIZ.sample}
            strokeWidth="3"
          />
        )}
        {showStalks &&
          data.map((pair, index) => {
            const fitted = fit.intercept + fit.slope * pair.x
            return (
              <line
                key={`s-${index}`}
                x1={px(pair.x)}
                y1={py(pair.y)}
                x2={px(pair.x)}
                y2={py(fitted)}
                stroke={VIZ.warn}
                strokeWidth="1.4"
                opacity="0.7"
              />
            )
          })}
        {data.map((pair, index) => (
          <circle key={index} cx={px(pair.x)} cy={py(pair.y)} r="5" fill={VIZ.sample} />
        ))}
        <text x="48" y="404" fill={VIZ.ink} fontSize="13">
          {xLabel} → · {yLabel} ↑
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
