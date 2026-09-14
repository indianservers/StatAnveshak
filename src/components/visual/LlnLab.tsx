import { useMemo, useState } from 'react'
import { labChoice, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, VIZ } from '../../lib/visualMath'
import { LessonChoice } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Kind = 'skew' | 'normal' | 'uniform'

function draw(kind: Kind) {
  if (kind === 'uniform') return Math.random() * 10
  if (kind === 'normal') return Math.min(10, Math.max(0, 5 + gaussian() * 1.4))
  return Math.min(10, Math.max(0, Math.exp(gaussian() * 0.55) * 1.8))
}

function muOf(kind: Kind) {
  if (kind === 'uniform') return 5
  if (kind === 'normal') return 5
  return 2.2
}

export function LlnLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [kind, setKind] = useState<Kind>(() => labChoice(params, 'kind', 'skew', ['skew', 'normal', 'uniform'] as const))
  const [values, setValues] = useState<number[]>([])

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => setValues((current) => [...current.slice(-399), draw(kind)]),
    onReset: () => setValues([]),
  })

  const path = useMemo(() => {
    let sum = 0
    return values.map((value, index) => {
      sum += value
      return sum / (index + 1)
    })
  }, [values])
  const mu = muOf(kind)
  const running = path[path.length - 1] ?? mu
  const x = (index: number) => 40 + (index / Math.max(values.length - 1, 1)) * 640
  const y = (value: number) => 360 - (value / 10) * 280

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ kind }}
      readout={`n = ${values.length} · running mean ${running.toFixed(2)} · μ ≈ ${mu.toFixed(1)}`}
      extraControls={
        <LessonChoice
          label="Population"
          value={kind}
          options={[
            { id: 'skew', label: 'Skewed' },
            { id: 'normal', label: 'Normal' },
            { id: 'uniform', label: 'Flat' },
          ]}
          effect="The faint line is μ. Play adds one draw; the purple path is the running mean."
          onChange={(value) => {
            setKind(value)
            setValues([])
          }}
        />
      }
    >
      <StageFrame label="Law of large numbers running mean">
        <line x1="40" y1={y(mu)} x2="680" y2={y(mu)} stroke={VIZ.population} strokeDasharray="6 5" />
        <text x="48" y={y(mu) - 8} fill={VIZ.muted} fontSize="12">μ</text>
        {values.slice(-40).map((value, index) => (
          <circle key={`${index}-${value}`} cx={40 + ((values.length - 40 + index) / Math.max(values.length, 1)) * 640} cy={y(value)} r="3" fill={VIZ.sample} opacity="0.55" />
        ))}
        {path.length > 1 && (
          <polyline
            fill="none"
            stroke={VIZ.sampling}
            strokeWidth="3"
            points={path.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
          />
        )}
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Running mean vs truth</text>
      </StageFrame>
    </VisualLesson>
  )
}
