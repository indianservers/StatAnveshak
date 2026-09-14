import { useMemo, useState } from 'react'
import { labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { VIZ } from '../../lib/visualMath'
import { LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

export function ChanceCoinsLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [p, setP] = useState(() => labNumber(params, 'p', 0.5))
  const [flips, setFlips] = useState<Array<0 | 1>>([])

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const face: 0 | 1 = Math.random() < p ? 1 : 0
      setFlips((current) => [...current.slice(-399), face])
    },
    onReset: () => setFlips([]),
  })

  const heads = flips.filter((face) => face === 1).length
  const rate = flips.length === 0 ? p : heads / flips.length
  const recent = flips.slice(-18)

  const bins = useMemo(() => {
    const size = 20
    const counts = Array.from({ length: size }, () => 0)
    flips.forEach((_, index) => {
      const window = flips.slice(0, index + 1)
      const local = window.filter((face) => face === 1).length / window.length
      counts[Math.min(size - 1, Math.floor(local * (size - 1)))] += 1
    })
    return counts
  }, [flips])
  const maxBin = Math.max(...bins, 1)

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ p: Number(p.toFixed(2)) }}
      readout={`${flips.length} flips · heads ${heads} · rate ${rate.toFixed(2)} vs p ${p.toFixed(2)}`}
      extraControls={
        <LessonSlider
          label="P(heads)"
          value={Number(p.toFixed(2))}
          min={0.05}
          max={0.95}
          step={0.01}
          unit=""
          effect="Reallocates the two faces. Play flips coins into the running rate."
          onChange={setP}
        />
      }
    >
      <StageFrame label="Bernoulli coin flips">
        <rect x="36" y="36" width={300 * p} height="88" rx="44" fill={VIZ.success} />
        <rect x={36 + 300 * p} y="36" width={300 * (1 - p)} height="88" rx="44" fill={VIZ.sample} />
        <text x="54" y="88" fill="#022c22" fontSize="18" fontWeight="800">H {p.toFixed(2)}</text>
        <text x="248" y="88" fill="#e0e7ff" fontSize="18" fontWeight="800">T {(1 - p).toFixed(2)}</text>

        {recent.map((face, index) => (
          <circle
            key={`${index}-${face}`}
            cx={52 + index * 36}
            cy="168"
            r="14"
            fill={face === 1 ? VIZ.success : VIZ.sample}
            style={reducedMotion ? undefined : { transition: 'cx 180ms ease-out' }}
          />
        ))}

        <line x1="40" y1="250" x2="680" y2="250" stroke={VIZ.muted} />
        <line x1={40 + p * 640} y1="228" x2={40 + p * 640} y2="392" stroke={VIZ.population} strokeDasharray="6 6" />
        <text x={44 + p * 640} y="222" fill={VIZ.population} fontSize="12">true p</text>
        {bins.map((count, index) => {
          const height = (count / maxBin) * 120
          return (
            <rect
              key={index}
              x={40 + index * 32}
              y={250 - height}
              width="26"
              height={height}
              rx="4"
              fill={VIZ.sampling}
              opacity="0.9"
            />
          )
        })}
        <circle cx={40 + rate * 640} cy="250" r="7" fill={VIZ.success} />
        <text x="40" y="400" fill={VIZ.ink} fontSize="13">
          Running rate sits on the histogram of successive p̂ values
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
