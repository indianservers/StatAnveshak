import { useMemo, useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, meanOf, VIZ } from '../../lib/visualMath'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

function makeGroups() {
  const a = Array.from({ length: 10 }, () => 3.1 + gaussian() * 0.7)
  const b = Array.from({ length: 10 }, () => 4.6 + gaussian() * 0.7)
  return { a, b, all: [...a, ...b] }
}

export function PermutationLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const groups = useMemo(() => makeGroups(), [])
  const observed = meanOf(groups.b) - meanOf(groups.a)
  const [gaps, setGaps] = useState<number[]>([])
  const [shuffled, setShuffled] = useState<boolean[]>(() => Array.from({ length: 20 }, (_, index) => index >= 10))
  const freeze = labNumber(params, 'obs', Number(observed.toFixed(2)))

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const labels = Array.from({ length: 20 }, () => Math.random() < 0.5)
      const a = groups.all.filter((_, index) => !labels[index])
      const b = groups.all.filter((_, index) => labels[index])
      setShuffled(labels)
      setGaps((current) => [...current.slice(-399), meanOf(b) - meanOf(a)])
    },
    onReset: () => {
      setGaps([])
      setShuffled(Array.from({ length: 20 }, (_, index) => index >= 10))
    },
  })

  const bins = 18
  const hist = Array.from({ length: bins }, () => 0)
  gaps.forEach((value) => {
    hist[Math.min(bins - 1, Math.max(0, Math.floor(((value + 3) / 6) * bins)))] += 1
  })
  const maxHist = Math.max(...hist, 1)
  const x = (value: number) => 40 + ((value + 3) / 6) * 640
  const extreme = gaps.filter((value) => Math.abs(value) >= Math.abs(observed)).length
  const p = gaps.length === 0 ? 0 : extreme / gaps.length

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ obs: freeze }}
      readout={`observed gap ${observed.toFixed(2)} · ${gaps.length} shuffles · two-sided p ≈ ${p.toFixed(2)}`}
      extraControls={
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Play shuffles group colors. The emerald line is the real gap, frozen on the null histogram.
        </p>
      }
    >
      <StageFrame label="Permutation shuffle null">
        {groups.all.map((value, index) => (
          <circle key={index} cx={40 + (value / 8) * 640} cy={shuffled[index] ? 70 : 110} r="6" fill={shuffled[index] ? VIZ.success : VIZ.sample} />
        ))}
        <text x="40" y="28" fill={VIZ.muted} fontSize="12">Shuffle the labels. Observed gap stays put.</text>
        {hist.map((count, index) => {
          const height = (count / maxHist) * 150
          return <rect key={index} x={40 + index * (640 / bins)} y={380 - height} width={640 / bins - 3} height={height} rx="3" fill={VIZ.sampling} />
        })}
        <line x1={x(observed)} y1="210" x2={x(observed)} y2="380" stroke={VIZ.success} strokeWidth="3" />
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Null histogram of shuffled gaps</text>
      </StageFrame>
    </VisualLesson>
  )
}
