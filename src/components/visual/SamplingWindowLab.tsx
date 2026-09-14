import { useMemo, useState } from 'react'
import { labChoice, labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, meanOf, VIZ } from '../../lib/visualMath'
import { LessonChoice, LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Mode = 'without' | 'with'

function populationDots() {
  return Array.from({ length: 72 }, (_, index) => ({
    id: index,
    x: 0.6 + gaussian() * 1.8 + (index % 9) * 0.35,
    y: (index % 8) * 0.22,
  }))
}

export function SamplingWindowLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const pop = useMemo(() => populationDots(), [])
  const [n, setN] = useState(() => labNumber(params, 'n', 12))
  const [mode, setMode] = useState<Mode>(() => labChoice(params, 'mode', 'without', ['without', 'with'] as const))
  const [picked, setPicked] = useState<number[]>([])

  const draw = (size: number, nextMode: Mode) => {
    if (nextMode === 'with') {
      return Array.from({ length: size }, () => Math.floor(Math.random() * pop.length))
    }
    const order = [...pop.keys()].sort(() => Math.random() - 0.5)
    return order.slice(0, size)
  }

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => setPicked(draw(n, mode)),
    onReset: () => setPicked([]),
  })

  const sample = picked.map((id) => pop[id]?.x ?? 0)
  const sampleMean = meanOf(sample)
  const popMean = meanOf(pop.map((dot) => dot.x))

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ n, mode }}
      readout={`${picked.length} drawn ${mode === 'without' ? 'without' : 'with'} replacement · sample mean ${sampleMean.toFixed(2)} · pop ${popMean.toFixed(2)}`}
      extraControls={
        <>
          <LessonSlider
            label="Sample size n"
            value={n}
            min={4}
            max={24}
            unit=""
            effect="Play highlights which population dots enter the sample window."
            onChange={(value) => {
              setN(value)
              setPicked(draw(value, mode))
            }}
          />
          <LessonChoice
            label="Replacement"
            value={mode}
            options={[
              { id: 'without', label: 'Without' },
              { id: 'with', label: 'With' },
            ]}
            effect="Without replacement a dot can light once. With replacement the same dot can be drawn twice."
            onChange={(value) => {
              setMode(value)
              setPicked(draw(n, value))
            }}
          />
        </>
      }
    >
      <StageFrame label="Population to sample window">
        <text x="40" y="28" fill={VIZ.muted} fontSize="12">Population</text>
        {pop.map((dot) => {
          const selected = picked.includes(dot.id)
          return (
            <circle
              key={dot.id}
              cx={40 + (dot.x / 8) * 640}
              cy={48 + dot.y * 90}
              r={selected ? 6 : 4}
              fill={selected ? VIZ.sample : VIZ.population}
              opacity={selected ? 1 : 0.55}
            />
          )
        })}
        <rect x="40" y="250" width="640" height="120" rx="12" fill="#0f172a" stroke={VIZ.muted} />
        <text x="52" y="272" fill={VIZ.muted} fontSize="12">Sample window</text>
        {sample.map((value, index) => (
          <circle key={`${index}-${value}`} cx={70 + index * (580 / Math.max(sample.length, 1))} cy="318" r="8" fill={VIZ.sampling} />
        ))}
        <line x1={40 + (sampleMean / 8) * 640} y1="250" x2={40 + (sampleMean / 8) * 640} y2="370" stroke={VIZ.success} strokeWidth="2" />
      </StageFrame>
    </VisualLesson>
  )
}
