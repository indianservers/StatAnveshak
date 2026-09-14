import { useEffect, useMemo, useState } from 'react'
import { meanOf, sdOf, VIZ } from '../../lib/visualMath'
import { LessonChoice, LessonSlider } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

type Picture = 'means' | 'coverage'
type AlphaKey = '0.10' | '0.05' | '0.01'

const Z: Record<AlphaKey, number> = { '0.10': 1.645, '0.05': 1.96, '0.01': 2.576 }

function pick(values: number[], n: number) {
  return Array.from({ length: n }, () => values[Math.floor(Math.random() * values.length)] ?? 0)
}

function displayDots(values: number[], max = 160) {
  if (values.length <= max) return values
  const step = values.length / max
  return Array.from({ length: max }, (_, index) => values[Math.floor(index * step)] ?? 0)
}

export function SamplingMachine({
  values,
  column,
  reducedMotion,
}: {
  values: number[]
  column: string
  reducedMotion: boolean
}) {
  const [picture, setPicture] = useState<Picture>('means')
  const [n, setN] = useState(12)
  const [alpha, setAlpha] = useState<AlphaKey>('0.05')
  const [means, setMeans] = useState<number[]>([])
  const [sample, setSample] = useState<number[]>([])
  const [hits, setHits] = useState(0)
  const [mu0, setMu0] = useState(() => meanOf(values))

  useEffect(() => {
    setMu0(meanOf(values))
    setMeans([])
    setSample([])
    setHits(0)
  }, [column])

  const mu = useMemo(() => meanOf(values), [values])
  const sigma = useMemo(() => sdOf(values), [values])
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const x = (value: number) => 40 + ((value - lo) / span) * 640

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: true,
    onTick: () => {
      const next = pick(values, n)
      const m = meanOf(next)
      setSample(next)
      if (picture === 'coverage') {
        const se = sdOf(next) / Math.sqrt(next.length) || 1e-9
        const z = Z[alpha]
        const hit = m - z * se <= mu && mu <= m + z * se
        setHits((count) => count + (hit ? 1 : 0))
      }
      setMeans((existing) => [...existing.slice(-399), m])
    },
    onReset: () => {
      setMeans([])
      setSample([])
      setHits(0)
    },
  })

  const bins = 24
  const hist = useMemo(() => {
    const counts = Array.from({ length: bins }, () => 0)
    means.forEach((value) => {
      const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - lo) / span) * bins)))
      counts[index] += 1
    })
    return counts
  }, [means, lo, span])
  const maxHist = Math.max(...hist, 1)
  const last = means[means.length - 1]
  const se = sigma / Math.sqrt(n)
  const z = Z[alpha]
  const extreme = last === undefined ? false : Math.abs(last - mu0) > z * se
  const coverage = means.length === 0 ? 0 : hits / means.length
  const popDots = displayDots(values)

  return (
    <VisualLesson
      title="Sampling distribution"
      intuition="Each Play draws a sample from this column. The triangle is one mean. The pile is what that statistic does across repeats."
      datasetChip={<TeachingDatasetChip compact />}
      playback={playback}
      formula="\\bar{X}_n \\pm z\\,\\mathrm{SE}"
      misuse="A 95% interval is not “95% chance μ lives here” after you computed this one interval."
      readout={
        picture === 'coverage'
          ? `${means.length} nets · ${hits} trap the column mean · coverage ${(coverage * 100).toFixed(0)}%`
          : `${means.length} means · n = ${n} · last ${last === undefined ? '—' : last.toFixed(2)} · H0 fence ${mu0.toFixed(2)}${extreme ? ' · unusual vs fence' : ''}`
      }
      extraControls={
        <>
          <p className="text-xs text-slate-500">Column: {column}</p>
          <LessonChoice
            label="Picture"
            value={picture}
            options={[
              { id: 'means', label: 'Means pile' },
              { id: 'coverage', label: 'CI nets' },
            ]}
            effect="Means show the sampling cloud. Coverage throws intervals at a fixed column mean."
            onChange={(value) => {
              setPicture(value)
              setMeans([])
              setSample([])
              setHits(0)
            }}
          />
          <LessonSlider
            label="Sample size n"
            value={n}
            min={4}
            max={60}
            unit=""
            effect="Drag n. The means pile tightens without pressing Run."
            onChange={(value) => {
              setN(value)
              setSample(pick(values, value))
              setMeans(Array.from({ length: 120 }, () => meanOf(pick(values, value))))
              setHits(0)
            }}
          />
          <LessonSlider
            label="H0 fence μ0"
            value={Number(mu0.toFixed(2))}
            min={Number(lo.toFixed(2))}
            max={Number(hi.toFixed(2))}
            step={span / 80}
            unit=""
            effect="Drag the hypothesized value. Play still samples the data, not this fence."
            onChange={setMu0}
          />
          <LessonChoice
            label="α"
            value={alpha}
            options={[
              { id: '0.10', label: '10%' },
              { id: '0.05', label: '5%' },
              { id: '0.01', label: '1%' },
            ]}
            effect="Tail area for the unusual-mean cue and CI width."
            onChange={setAlpha}
          />
        </>
      }
    >
      <StageFrame label="Sampling distribution of the mean">
        {popDots.map((value, index) => (
          <circle key={`p-${index}`} cx={x(value)} cy={28 + (index % 6) * 8} r="2.8" fill={VIZ.population} opacity="0.75" />
        ))}
        {sample.map((value, index) => (
          <circle key={`s-${index}`} cx={x(value)} cy="92" r="5" fill={VIZ.sample} />
        ))}
        <text x="40" y="18" fill={VIZ.muted} fontSize="12">Population ({column})</text>
        <text x="40" y="118" fill={VIZ.sample} fontSize="12">One sample</text>
        <line x1={x(mu)} y1="8" x2={x(mu)} y2="400" stroke={VIZ.ink} strokeDasharray="6 5" strokeWidth="1.5" />
        <line x1={x(mu0)} y1="8" x2={x(mu0)} y2="400" stroke={VIZ.warn} strokeDasharray="3 4" />
        <line x1="40" y1="200" x2="680" y2="200" stroke={VIZ.muted} />
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
        {last !== undefined && (
          <polygon points={`${x(last)},188 ${x(last) - 8},172 ${x(last) + 8},172`} fill={extreme ? VIZ.misuse : VIZ.success} />
        )}
        {picture === 'coverage' && last !== undefined && sample.length > 1 && (
          <line
            x1={x(last - z * (sdOf(sample) / Math.sqrt(sample.length)))}
            y1="196"
            x2={x(last + z * (sdOf(sample) / Math.sqrt(sample.length)))}
            y2="196"
            stroke={VIZ.success}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">
          {picture === 'coverage' ? 'Each bar is a mean; the last net tries to trap the dashed truth' : 'Sampling distribution of the mean'}
        </text>
      </StageFrame>
    </VisualLesson>
  )
}
