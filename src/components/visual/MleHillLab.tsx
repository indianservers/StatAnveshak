import { useMemo, useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, meanOf, VIZ } from '../../lib/visualMath'
import { LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

function logLik(mu: number, values: number[]) {
  return values.reduce((sum, value) => sum + -0.5 * ((value - mu) / 1.1) ** 2, 0)
}

export function MleHillLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [n, setN] = useState(() => labNumber(params, 'n', 12))
  const [walk, setWalk] = useState(() => labNumber(params, 'theta', 3.2))
  const [sample, setSample] = useState<number[]>(() => Array.from({ length: 12 }, () => 5 + gaussian() * 1.1))

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => setSample(Array.from({ length: n }, () => 5 + gaussian() * 1.1)),
    onReset: () => setSample(Array.from({ length: n }, () => 5 + gaussian() * 1.1)),
  })

  const mle = meanOf(sample)
  const curve = useMemo(() => {
    return Array.from({ length: 80 }, (_, index) => {
      const mu = 1 + (index / 79) * 8
      return { mu, ll: logLik(mu, sample) }
    })
  }, [sample])
  const minLl = Math.min(...curve.map((item) => item.ll))
  const maxLl = Math.max(...curve.map((item) => item.ll))
  const x = (mu: number) => 40 + ((mu - 1) / 8) * 640
  const y = (ll: number) => 340 - ((ll - minLl) / Math.max(maxLl - minLl, 1e-6)) * 220

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ n, theta: Number(walk.toFixed(2)) }}
      readout={`n = ${sample.length} · MLE μ̂ = ${mle.toFixed(2)} · walker ${walk.toFixed(2)} · L(walker) ${logLik(walk, sample).toFixed(1)}`}
      extraControls={
        <>
          <LessonSlider
            label="Sample size n"
            value={n}
            min={4}
            max={30}
            unit=""
            effect="Play redraws the sample. The hill sharpens around the mean."
            onChange={(value) => {
              setN(value)
              setSample(Array.from({ length: value }, () => 5 + gaussian() * 1.1))
            }}
          />
          <LessonSlider
            label="Walk θ"
            value={Number(walk.toFixed(2))}
            min={1.2}
            max={8.8}
            step={0.05}
            unit=""
            effect="Climb the hill. The peak is the MLE for these points."
            onChange={setWalk}
          />
        </>
      }
    >
      <StageFrame label="Likelihood hill">
        {sample.map((value, index) => (
          <circle key={index} cx={x(value)} cy="48" r="6" fill={VIZ.sample} />
        ))}
        <text x="40" y="24" fill={VIZ.muted} fontSize="12">Sample on the axis</text>
        <polyline fill="none" stroke={VIZ.sampling} strokeWidth="3" points={curve.map((item) => `${x(item.mu)},${y(item.ll)}`).join(' ')} />
        <circle cx={x(mle)} cy={y(logLik(mle, sample))} r="8" fill={VIZ.success} />
        <circle cx={x(walk)} cy={y(logLik(walk, sample))} r="7" fill={VIZ.warn} />
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Emerald = MLE peak · amber = your walk</text>
      </StageFrame>
    </VisualLesson>
  )
}
