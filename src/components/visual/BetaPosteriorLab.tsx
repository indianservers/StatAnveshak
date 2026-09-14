import { useMemo, useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { betaPdf, VIZ } from '../../lib/visualMath'
import { LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

function curve(alpha: number, beta: number) {
  const points = Array.from({ length: 121 }, (_, index) => {
    const x = index / 120
    return { x, y: betaPdf(x, alpha, beta) }
  })
  const max = Math.max(...points.map((point) => point.y), 1e-6)
  return points.map((point) => ({ x: 40 + point.x * 640, y: 360 - (point.y / max) * 280 }))
}

function pathOf(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
}

export function BetaPosteriorLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [alpha, setAlpha] = useState(() => labNumber(params, 'alpha', 2))
  const [beta, setBeta] = useState(() => labNumber(params, 'beta', 6))
  const [successes, setSuccesses] = useState(0)
  const [trials, setTrials] = useState(0)

  const posteriorA = alpha + successes
  const posteriorB = beta + (trials - successes)
  const priorMean = alpha / (alpha + beta)
  const postMean = posteriorA / (posteriorA + posteriorB)

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const success = Math.random() < 0.62
      setTrials((value) => value + 1)
      if (success) setSuccesses((value) => value + 1)
    },
    onReset: () => {
      setSuccesses(0)
      setTrials(0)
    },
  })

  const priorPath = useMemo(() => pathOf(curve(alpha, beta)), [alpha, beta])
  const postPath = useMemo(() => pathOf(curve(posteriorA, posteriorB)), [posteriorA, posteriorB])

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ alpha, beta }}
      readout={`Prior mean ${priorMean.toFixed(2)} · ${successes}/${trials} heads · posterior mean ${postMean.toFixed(2)}`}
      extraControls={
        <>
          <LessonSlider label="Prior α" value={alpha} min={1} max={12} unit="" effect="More α stacks belief toward high θ (heads)." onChange={setAlpha} />
          <LessonSlider label="Prior β" value={beta} min={1} max={12} unit="" effect="More β stacks belief toward low θ." onChange={setBeta} />
        </>
      }
    >
      <StageFrame label="Beta prior to posterior">
        <path d={priorPath} fill="none" stroke={VIZ.population} strokeWidth="3" strokeDasharray="8 6" />
        <path d={postPath} fill="none" stroke={VIZ.sampling} strokeWidth="4" />
        <line x1={40 + priorMean * 640} y1="70" x2={40 + priorMean * 640} y2="360" stroke={VIZ.population} strokeDasharray="5 5" />
        <line x1={40 + postMean * 640} y1="70" x2={40 + postMean * 640} y2="360" stroke={VIZ.sampling} />
        {Array.from({ length: successes }, (_, index) => (
          <circle key={`s-${index}`} cx={48 + (index % 16) * 18} cy="48" r="6" fill={VIZ.success} />
        ))}
        {Array.from({ length: trials - successes }, (_, index) => (
          <circle key={`f-${index}`} cx={48 + (index % 16) * 18} cy="72" r="6" fill={VIZ.warn} />
        ))}
        <text x="40" y="394" fill={VIZ.ink} fontSize="13">
          Slate is the prior. Violet is the posterior after each coin. Play adds one observation.
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
