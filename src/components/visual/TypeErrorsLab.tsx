import { useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, VIZ } from '../../lib/visualMath'
import { LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

function pdf(x: number, mu: number, sigma: number) {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function invNorm(p: number) {
  const clamped = Math.min(0.99, Math.max(0.01, p))
  const t = Math.sqrt(-2 * Math.log(Math.min(clamped, 1 - clamped)))
  const z = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t)
  return clamped > 0.5 ? z : -z
}

export function TypeErrorsLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [delta, setDelta] = useState(() => labNumber(params, 'delta', 1.2))
  const [n, setN] = useState(() => labNumber(params, 'n', 16))
  const [alpha, setAlpha] = useState(() => labNumber(params, 'alpha', 0.05))
  const [observed, setObserved] = useState<number | null>(null)

  const se = 1 / Math.sqrt(n)
  const crit = invNorm(1 - alpha) * se
  const power = 1 - cdf((crit - delta) / se)
  const reject = observed !== null && observed > crit

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => setObserved(delta + se * gaussian()),
    onReset: () => setObserved(null),
  })

  const x = (value: number) => 40 + ((value + 1.2) / 4.4) * 640
  const curve = (mu: number) =>
    Array.from({ length: 80 }, (_, index) => {
      const t = -1.2 + (index / 79) * 4.4
      return `${x(t)},${380 - pdf(t, mu, se) * 520}`
    }).join(' ')

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ delta: Number(delta.toFixed(2)), n, alpha }}
      readout={`α = ${alpha.toFixed(2)} · power ≈ ${power.toFixed(2)} · last mean ${observed === null ? '—' : observed.toFixed(2)} · ${reject ? 'reject H0' : 'fail to reject'}`}
      extraControls={
        <>
          <LessonSlider label="H1 shift" value={Number(delta.toFixed(2))} min={0.2} max={2.4} step={0.05} unit="" effect="Moves the alternative. Power is the emerald area past the fence." onChange={setDelta} />
          <LessonSlider label="Sample size n" value={n} min={4} max={60} unit="" effect="Shrinks both sampling clouds. The fence moves in." onChange={setN} />
          <LessonSlider label="α" value={Number(alpha.toFixed(2))} min={0.01} max={0.2} step={0.01} unit="" effect="Shades the Type I tail under H0." onChange={setAlpha} />
        </>
      }
    >
      <StageFrame label="Type I and Type II overlapping sampling distributions">
        <polyline fill="none" stroke={VIZ.population} strokeWidth="2.5" points={curve(0)} />
        <polyline fill="none" stroke={VIZ.success} strokeWidth="2.5" points={curve(delta)} />
        <line x1={x(crit)} y1="40" x2={x(crit)} y2="380" stroke={VIZ.warn} strokeWidth="2" />
        <text x={x(crit) + 6} y="36" fill={VIZ.warn} fontSize="12">reject</text>
        {observed !== null && <polygon points={`${x(observed)},210 ${x(observed) - 8},228 ${x(observed) + 8},228`} fill={VIZ.sample} />}
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Grey H0 · emerald H1 · amber fence is α</text>
      </StageFrame>
    </VisualLesson>
  )
}

function cdf(z: number) {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

function erf(z: number) {
  const sign = z < 0 ? -1 : 1
  const x = Math.abs(z)
  const t = 1 / (1 + 0.3275911 * x)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return sign * y
}
