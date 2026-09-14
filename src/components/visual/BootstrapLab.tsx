import { useMemo, useState } from 'react'
import { labChoice, labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, meanOf, quantile, VIZ } from '../../lib/visualMath'
import { LessonChoice, LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Stat = 'mean' | 'median'

function originalSample() {
  return Array.from({ length: 18 }, () => Math.min(10, Math.max(0, 4.2 + gaussian() * 1.6)))
}

function statistic(values: number[], kind: Stat) {
  if (kind === 'median') {
    const sorted = [...values].sort((a, b) => a - b)
    return quantile(sorted, 0.5)
  }
  return meanOf(values)
}

export function BootstrapLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const data = useMemo(() => originalSample(), [])
  const [bShown, setBShown] = useState(() => labNumber(params, 'b', 80))
  const [stat, setStat] = useState<Stat>(() => labChoice(params, 'stat', 'mean', ['mean', 'median'] as const))
  const [stats, setStats] = useState<number[]>([])
  const [last, setLast] = useState<number[]>([])

  const resample = () => Array.from({ length: data.length }, () => data[Math.floor(Math.random() * data.length)] ?? 0)

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const next = resample()
      setLast(next)
      setStats((current) => [...current.slice(-399), statistic(next, stat)])
    },
    onReset: () => {
      setStats([])
      setLast([])
    },
  })

  const bins = 18
  const hist = Array.from({ length: bins }, () => 0)
  stats.forEach((value) => {
    hist[Math.min(bins - 1, Math.max(0, Math.floor((value / 10) * bins)))] += 1
  })
  const maxHist = Math.max(...hist, 1)
  const observed = statistic(data, stat)
  const x = (value: number) => 40 + (value / 10) * 640

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ b: bShown, stat }}
      readout={`${stats.length} resamples · ${stat} ${stats.length ? meanOf(stats).toFixed(2) : '—'} · original ${observed.toFixed(2)}`}
      extraControls={
        <>
          <LessonSlider
            label="Visible resamples"
            value={bShown}
            min={20}
            max={200}
            unit=""
            effect="Play keeps drawing. Extra draws still update the counter after 400 marks."
            onChange={setBShown}
          />
          <LessonChoice
            label="Statistic"
            value={stat}
            options={[
              { id: 'mean', label: 'Mean' },
              { id: 'median', label: 'Median' },
            ]}
            effect="The histogram is the sampling distribution of this statistic under resampling."
            onChange={(value) => {
              setStat(value)
              setStats([])
            }}
          />
        </>
      }
    >
      <StageFrame label="Bootstrap resample histogram">
        {data.map((value, index) => (
          <circle key={`d-${index}`} cx={x(value)} cy={36 + (index % 5) * 10} r="4" fill={VIZ.population} />
        ))}
        <text x="40" y="24" fill={VIZ.muted} fontSize="12">Original sample</text>
        {last.map((value, index) => (
          <circle key={`r-${index}`} cx={x(value)} cy="128" r="5" fill={VIZ.sample} />
        ))}
        <text x="40" y="150" fill={VIZ.sample} fontSize="12">One resample (with replacement)</text>
        {hist.map((count, index) => {
          const height = (count / maxHist) * 140
          return <rect key={index} x={40 + index * (640 / bins)} y={380 - height} width={640 / bins - 3} height={height} rx="3" fill={VIZ.sampling} />
        })}
        <line x1={x(observed)} y1="210" x2={x(observed)} y2="380" stroke={VIZ.success} strokeWidth="2" />
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Bootstrap distribution of the statistic</text>
      </StageFrame>
    </VisualLesson>
  )
}
