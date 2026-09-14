import { useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, meanOf, VIZ } from '../../lib/visualMath'
import { LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

function drawGroups(spread: number) {
  const mus = [2.4, 4.4, 6.2 + spread]
  return mus.map((mu) => Array.from({ length: 8 }, () => mu + gaussian() * 0.55))
}

export function AnovaLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [spread, setSpread] = useState(() => labNumber(params, 'spread', 0.4))
  const [groups, setGroups] = useState(() => drawGroups(0.4))

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => setGroups(drawGroups(spread)),
    onReset: () => setGroups(drawGroups(spread)),
  })

  const grand = meanOf(groups.flat())
  const means = groups.map((group) => meanOf(group))
  const between = groups.reduce((sum, group, index) => sum + group.length * (means[index]! - grand) ** 2, 0) / 2
  const within = groups.reduce((sum, group, index) => sum + group.reduce((inner, value) => inner + (value - means[index]!) ** 2, 0), 0) / (groups.flat().length - 3)
  const f = within > 0 ? between / within : 0
  const x = (value: number) => 40 + (value / 10) * 640
  const colors = [VIZ.sample, VIZ.success, VIZ.warn]

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ spread: Number(spread.toFixed(2)) }}
      readout={`F ≈ ${f.toFixed(2)} · MS between ${between.toFixed(2)} · MS within ${within.toFixed(2)}`}
      extraControls={
        <LessonSlider
          label="Group 3 shift"
          value={Number(spread.toFixed(2))}
          min={0}
          max={2.4}
          step={0.05}
          unit=""
          effect="Pushes the third group. Between arrows grow; within stays the leftover scatter."
          onChange={(value) => {
            setSpread(value)
            setGroups(drawGroups(value))
          }}
        />
      }
    >
      <StageFrame label="ANOVA between versus within">
        {groups.map((group, g) =>
          group.map((value, index) => (
            <g key={`${g}-${index}`}>
              <line x1={x(value)} y1={70 + g * 70} x2={x(means[g]!)} y2={70 + g * 70} stroke={VIZ.muted} />
              <circle cx={x(value)} cy={70 + g * 70} r="6" fill={colors[g]} />
            </g>
          ))
        )}
        {means.map((mu, g) => (
          <line key={`m-${g}`} x1={x(mu)} y1={48 + g * 70} x2={x(grand)} y2={300} stroke={colors[g]} strokeWidth="2" />
        ))}
        <line x1={x(grand)} y1="40" x2={x(grand)} y2="380" stroke={VIZ.ink} strokeDasharray="5 4" />
        <rect x="80" y="320" width={Math.min(240, between * 40)} height="22" fill={VIZ.sampling} />
        <rect x="80" y="352" width={Math.min(240, within * 40)} height="22" fill={VIZ.population} />
        <text x="88" y="336" fill="#022c22" fontSize="11">Between</text>
        <text x="88" y="368" fill="#e2e8f0" fontSize="11">Within</text>
      </StageFrame>
    </VisualLesson>
  )
}
