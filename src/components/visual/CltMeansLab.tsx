import { useMemo, useState } from 'react'
import { labChoice, labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { gaussian, VIZ } from '../../lib/visualMath'
import { LessonChoice, LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Population = 'skew' | 'uniform' | 'bimodal'

function drawFrom(kind: Population) {
  if (kind === 'uniform') return Math.random() * 10
  if (kind === 'bimodal') return (Math.random() < 0.5 ? sampleAround(2.2, 0.55) : sampleAround(7.6, 0.6))
  return Math.min(10, Math.max(0, Math.exp(gaussian() * 0.55) * 1.8))
}

function sampleAround(mu: number, sigma: number) {
  return Math.min(10, Math.max(0, mu + sigma * gaussian()))
}

function meanOf(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function drawBatch(kind: Population, sampleN: number, draws: number) {
  return Array.from({ length: draws }, () => meanOf(Array.from({ length: sampleN }, () => drawFrom(kind))))
}

export function CltMeansLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [kind, setKind] = useState<Population>(() => labChoice(params, 'kind', 'skew', ['skew', 'uniform', 'bimodal'] as const))
  const [n, setN] = useState(() => labNumber(params, 'n', 5))
  const [means, setMeans] = useState<number[]>(() => drawBatch(labChoice(params, 'kind', 'skew', ['skew', 'uniform', 'bimodal'] as const), labNumber(params, 'n', 5), 80))
  const [current, setCurrent] = useState<number[]>([])

  const rebuild = (nextN: number, nextKind: Population) => {
    const sample = Array.from({ length: nextN }, () => drawFrom(nextKind))
    setCurrent(sample)
    setMeans(drawBatch(nextKind, nextN, 160))
  }

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const sample = Array.from({ length: n }, () => drawFrom(kind))
      setCurrent(sample)
      setMeans((existing) => [...existing.slice(-399), meanOf(sample)])
    },
    onReset: () => rebuild(n, kind),
  })

  const popDots = useMemo(() => Array.from({ length: 140 }, () => drawFrom(kind)), [kind])
  const bins = 22
  const hist = useMemo(() => {
    const counts = Array.from({ length: bins }, () => 0)
    means.forEach((value) => {
      const index = Math.min(bins - 1, Math.max(0, Math.floor((value / 10) * bins)))
      counts[index] += 1
    })
    return counts
  }, [means])
  const maxHist = Math.max(...hist, 1)
  const grand = means.length === 0 ? 0 : meanOf(means)

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ n, kind }}
      readout={`${means.length} sample means · n = ${n} · mean of means ${grand.toFixed(2)}`}
      extraControls={
        <>
          <LessonChoice
            label="Population"
            value={kind}
            options={[
              { id: 'skew', label: 'Skewed' },
              { id: 'uniform', label: 'Flat' },
              { id: 'bimodal', label: 'Bimodal' },
            ]}
            effect="The top row is one draw from the population. The pile below is means, not the data."
            onChange={(value) => {
              setKind(value)
              rebuild(n, value)
            }}
          />
          <LessonSlider
            label="Sample size n"
            value={n}
            min={2}
            max={40}
            unit=""
            effect="Drag n. The pile of means tightens immediately — no Run."
            onChange={(value) => {
              setN(value)
              rebuild(value, kind)
            }}
          />
          <LessonChoice
            label="Try n"
            value={n === 2 || n === 5 || n === 30 ? (`n${n}` as 'n2' | 'n5' | 'n30') : 'n5'}
            options={[
              { id: 'n2', label: 'n = 2' },
              { id: 'n5', label: 'n = 5' },
              { id: 'n30', label: 'n = 30' },
            ]}
            effect="These three pictures are the whole CLT lesson."
            onChange={(value) => {
              const next = Number(value.slice(1))
              setN(next)
              rebuild(next, kind)
            }}
          />
        </>
      }
    >
      <StageFrame label="Central limit theorem means pile">
        {popDots.map((value, index) => (
          <circle key={`p-${index}`} cx={40 + (value / 10) * 640} cy={36 + (index % 7) * 10} r="3.2" fill={VIZ.population} opacity="0.7" />
        ))}
        {current.map((value, index) => (
          <circle key={`s-${index}`} cx={40 + (value / 10) * 640} cy="128" r="6" fill={VIZ.sample} />
        ))}
        <text x="40" y="24" fill={VIZ.muted} fontSize="12">Population</text>
        <text x="40" y="150" fill={VIZ.sample} fontSize="12">One sample of n</text>
        <line x1="40" y1="210" x2="680" y2="210" stroke={VIZ.muted} />
        {hist.map((count, index) => {
          const height = (count / maxHist) * 150
          return (
            <rect
              key={index}
              x={40 + index * (640 / bins)}
              y={380 - height}
              width={640 / bins - 3}
              height={height}
              rx="3"
              fill={VIZ.sampling}
            />
          )
        })}
        {means.slice(-1).map((value) => (
          <line key={value} x1={40 + (value / 10) * 640} y1="210" x2={40 + (value / 10) * 640} y2="380" stroke={VIZ.success} strokeWidth="2" />
        ))}
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Sampling distribution of the mean</text>
      </StageFrame>
    </VisualLesson>
  )
}
