import { useState } from 'react'
import { labChoice, labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import { meanOf, quantile, sampleNormal, sdOf, VIZ } from '../../lib/visualMath'
import { LessonChoice, LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Method = 'z' | 'bootstrap'
type Interval = { lo: number; hi: number; hit: boolean }

const MU = 50
const SIGMA = 12
const Z: Record<number, number> = { 90: 1.645, 95: 1.96, 99: 2.576 }

function drawSample(n: number) {
  return Array.from({ length: n }, () => sampleNormal(MU, SIGMA))
}

function zInterval(sample: number[], z: number) {
  const m = meanOf(sample)
  const se = sdOf(sample) / Math.sqrt(sample.length)
  return { lo: m - z * se, hi: m + z * se }
}

function bootstrapInterval(sample: number[], level: number) {
  const means = Array.from({ length: 240 }, () => {
    const resample = Array.from({ length: sample.length }, () => sample[Math.floor(Math.random() * sample.length)] ?? 0)
    return meanOf(resample)
  }).sort((a, b) => a - b)
  const alpha = (1 - level / 100) / 2
  return { lo: quantile(means, alpha), hi: quantile(means, 1 - alpha) }
}

export function CoverageLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [n, setN] = useState(() => labNumber(params, 'n', 20))
  const [level, setLevel] = useState(() => labNumber(params, 'level', 95))
  const [method, setMethod] = useState<Method>(() => labChoice(params, 'method', 'z', ['z', 'bootstrap'] as const))
  const [intervals, setIntervals] = useState<Interval[]>([])
  const [sample, setSample] = useState<number[]>([])

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const next = drawSample(n)
      const z = Z[level] ?? 1.96
      const band = method === 'z' ? zInterval(next, z) : bootstrapInterval(next, level)
      const hit = band.lo <= MU && MU <= band.hi
      setSample(next)
      setIntervals((current) => [...current.slice(-79), { ...band, hit }])
    },
    onReset: () => {
      setIntervals([])
      setSample([])
    },
  })

  const hits = intervals.filter((item) => item.hit).length
  const coverage = intervals.length === 0 ? 0 : hits / intervals.length
  const x = (value: number) => 40 + ((value - 10) / 80) * 640

  return (
    <VisualLesson
      title={chapter.title}
      intuition={chapter.intuition}
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula={chapter.formula}
      misuse={chapter.misuse}
      chapterId={chapter.id}
      params={{ n, level: String(level), method }}
      readout={`${intervals.length} intervals · ${hits} capture μ · coverage ${(coverage * 100).toFixed(0)}% vs ${level}%`}
      extraControls={
        <>
          <LessonSlider
            label="Sample size n"
            value={n}
            min={8}
            max={80}
            unit=""
            effect="Larger n shortens each interval immediately."
            onChange={(value) => {
              setN(value)
              const z = Z[level] ?? 1.96
              const next = Array.from({ length: 24 }, () => {
                const draw = drawSample(value)
                const band = method === 'z' ? zInterval(draw, z) : bootstrapInterval(draw, level)
                return { ...band, hit: band.lo <= MU && MU <= band.hi }
              })
              setSample(drawSample(value))
              setIntervals(next)
            }}
          />
          <LessonChoice
            label="Confidence"
            value={String(level) as '90' | '95' | '99'}
            options={[
              { id: '90', label: '90%' },
              { id: '95', label: '95%' },
              { id: '99', label: '99%' },
            ]}
            effect="The long-run fraction of green nets, not a probability for this interval."
            onChange={(value) => setLevel(Number(value))}
          />
          <LessonChoice
            label="How the net is made"
            value={method}
            options={[
              { id: 'z', label: 'z interval' },
              { id: 'bootstrap', label: 'Bootstrap' },
            ]}
            effect="Bootstrap rebuilds the sample with replacement, then takes percentiles."
            onChange={setMethod}
          />
        </>
      }
    >
      <StageFrame label="Confidence interval coverage">
        {sample.map((value, index) => (
          <circle key={`${value}-${index}`} cx={x(value)} cy={28 + (index % 6) * 9} r="3.4" fill={VIZ.sample} />
        ))}
        <line x1={x(MU)} y1="20" x2={x(MU)} y2="400" stroke={VIZ.population} strokeDasharray="6 6" strokeWidth="2" />
        <text x={x(MU) + 8} y="18" fill={VIZ.population} fontSize="12">μ</text>
        {intervals.map((item, index) => {
          const y = 96 + index * 4
          return (
            <line
              key={`${item.lo}-${index}`}
              x1={x(item.lo)}
              y1={y}
              x2={x(item.hi)}
              y2={y}
              stroke={item.hit ? VIZ.success : VIZ.warn}
              strokeWidth="3"
            />
          )
        })}
        <text x="40" y="408" fill={VIZ.ink} fontSize="13">
          Green catches the dashed truth. Amber misses. Play throws another net.
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
