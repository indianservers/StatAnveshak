import { useMemo, useState } from 'react'
import { labChoice, labNumber, type LabParams } from '../../lib/classroom'
import type { LearnChapter } from '../../lib/learnChapters'
import {
  CLT_MAX_N,
  CLT_MAX_REPS,
  CLT_PARENT_OPTIONS,
  SamplingDistributionEngine,
  cltSimulationCount,
  createPopulation,
  defaultParentParams,
  formatNum,
  parseCltReps,
  parseCltSampleSize,
  samplingMomentsFor,
  specFromParent,
  type PopulationKind,
} from '../../lib/samplingDistributionsClt'
import { VIZ } from '../../lib/visualMath'
import { StatisticResult } from '../stats/StatisticResult'
import { MathText } from '../ui/MathText'
import { LessonChoice } from './LessonControls'
import { StageFrame } from './StageFrame'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { VisualLesson } from './VisualLesson'
import { useLessonPlayback } from './useLessonPlayback'

function defaultKind(value: string): PopulationKind {
  return CLT_PARENT_OPTIONS.some((option) => option.kind === value) ? (value as PopulationKind) : 'exponential'
}

export function CltMeansLab({ chapter, reducedMotion, params = {} }: { chapter: LearnChapter; reducedMotion: boolean; params?: LabParams }) {
  const [kind, setKind] = useState<PopulationKind>(() => defaultKind(labChoice(params, 'kind', 'exponential', CLT_PARENT_OPTIONS.map((option) => option.kind))))
  const [parentParams, setParentParams] = useState<Record<string, number>>(() => defaultParentParams(defaultKind(String(params.kind ?? 'exponential'))))
  const [nText, setNText] = useState(() => String(labNumber(params, 'n', 30)))
  const [rText, setRText] = useState('400')
  const [nError, setNError] = useState<string | null>(null)
  const [rError, setRError] = useState<string | null>(null)
  const [seed, setSeed] = useState(11)

  const nParsed = parseCltSampleSize(nText)
  const rParsed = parseCltReps(rText)
  const n = nParsed.ok ? nParsed.n : 30
  const requestedR = rParsed.ok ? rParsed.R : 400
  const R = cltSimulationCount(n, requestedR)

  const population = useMemo(() => createPopulation(specFromParent(kind, parentParams)), [kind, parentParams])
  const theoretical = useMemo(() => samplingMomentsFor(population, n), [population, n])
  const engine = useMemo(() => new SamplingDistributionEngine({ seed }), [seed])
  const result = useMemo(
    () => engine.simulate({ population, n, R, statistic: 'mean', seed, keepStatistics: R <= 2500 }),
    [engine, population, n, R, seed],
  )

  const popDots = population.density
  const means = result.statistics.length ? result.statistics : []
  const range = useMemo(() => {
    const xs = popDots.map((point) => point.x)
    const lo = Math.min(population.mean - 4 * population.sd, ...xs, ...means)
    const hi = Math.max(population.mean + 4 * population.sd, ...xs, ...means)
    return [Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) && hi > lo ? hi : lo + 1] as const
  }, [means, popDots, population.mean, population.sd])
  const scaleX = (value: number) => 40 + ((value - range[0]) / (range[1] - range[0] || 1)) * 640
  const bins = 24
  const hist = useMemo(() => {
    const counts = Array.from({ length: bins }, () => 0)
    means.forEach((value) => {
      const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - range[0]) / (range[1] - range[0] || 1)) * bins)))
      counts[index] += 1
    })
    return counts
  }, [means, range])
  const maxHist = Math.max(...hist, 1)
  const maxDensity = Math.max(...popDots.map((point) => point.y), 1e-6)

  const playback = useLessonPlayback({
    reducedMotion,
    autoPlay: false,
    onTick: () => setSeed((value) => value + 1),
    onReset: () => setSeed((value) => value + 1),
  })

  const applyN = (raw: string) => {
    setNText(raw)
    const parsed = parseCltSampleSize(raw)
    setNError(parsed.ok ? null : parsed.error)
  }

  const applyR = (raw: string) => {
    setRText(raw)
    const parsed = parseCltReps(raw)
    setRError(parsed.ok ? null : parsed.error)
  }

  const option = CLT_PARENT_OPTIONS.find((item) => item.kind === kind)

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
      readout={`${result.R} simulated means · n = ${n} · SE = ${formatNum(theoretical.se)}`}
      extraControls={
        <>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Parent distribution
            <select
              value={kind}
              onChange={(event) => {
                const next = event.target.value as PopulationKind
                setKind(next)
                setParentParams(defaultParentParams(next))
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              {CLT_PARENT_OPTIONS.map((item) => (
                <option key={item.kind} value={item.kind}>{item.label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(option?.params ?? []).map((param) => (
              <label key={param.key} className="text-xs font-semibold text-slate-500">
                {param.label}
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={parentParams[param.key] ?? param.default}
                  onChange={(event) => setParentParams((current) => ({ ...current, [param.key]: Number(event.target.value) }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 text-sm font-bold dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
            ))}
          </div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Sample size n
            <input
              type="number"
              min={1}
              max={CLT_MAX_N}
              step={1}
              value={nText}
              onChange={(event) => applyN(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
            />
            {nError ? <span className="mt-1 block text-xs font-normal text-rose-600">{nError}</span> : <span className="mt-1 block text-xs font-normal text-slate-500">Any positive integer up to {CLT_MAX_N}. Not limited to 2, 5, or 30.</span>}
          </label>
          <LessonChoice
            label="Shortcuts"
            value={n === 2 || n === 5 || n === 30 || n === 100 ? (`n${n}` as 'n2' | 'n5' | 'n30' | 'n100') : 'n30'}
            options={[
              { id: 'n2', label: 'n = 2' },
              { id: 'n5', label: 'n = 5' },
              { id: 'n30', label: 'n = 30' },
              { id: 'n100', label: 'n = 100' },
            ]}
            effect="Shortcuts only. Type 7 or 43 in the n field."
            onChange={(value) => applyN(value.slice(1))}
          />
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Simulated samples
            <input
              type="number"
              min={1}
              max={CLT_MAX_REPS}
              step={1}
              value={rText}
              onChange={(event) => applyR(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
            />
            {rError ? <span className="mt-1 block text-xs font-normal text-rose-600">{rError}</span> : <span className="mt-1 block text-xs font-normal text-slate-500">{R !== requestedR ? `Capped at ${R} draws for this n.` : `Run updates the histogram. Theoretical SE updates immediately.`}</span>}
          </label>
          <button type="button" className="min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white" onClick={() => setSeed((value) => value + 1)}>
            Run simulation
          </button>
          <div className="grid grid-cols-2 gap-2">
            <StatisticResult label="Parent μ" value={theoretical.mu} formula={'\\mu'} />
            <StatisticResult label="Parent σ²" value={theoretical.variance} formula={'\\sigma^2'} />
            <StatisticResult label="Parent σ" value={theoretical.sd} formula={'\\sigma'} />
            <StatisticResult label="μ of x̄" value={theoretical.meanOfMean} formula={'\\mu_{\\bar{X}}=\\mu'} />
            <StatisticResult label="σ² of x̄" value={theoretical.varOfMean} formula={'\\sigma^2_{\\bar{X}}=\\sigma^2/n'} />
            <StatisticResult label="SE of x̄" value={theoretical.se} formula={'SE=\\sigma/\\sqrt{n}'} />
            <StatisticResult label="Simulated mean" value={result.empiricalMean} hint="Average of the simulated sample means." />
            <StatisticResult label="Simulated SD" value={result.empiricalSd} hint="Spread of the simulated sample means." />
          </div>
          <MathText value={'E(\\bar{X})=\\mu\\qquad SE(\\bar{X})=\\sigma/\\sqrt{n}'} />
        </>
      }
    >
      <StageFrame label="Central limit theorem parent and sampling distributions">
        <text x="40" y="22" fill={VIZ.muted} fontSize="12">Parent distribution</text>
        {popDots.map((point, index) => {
          if (index === 0) return null
          const prev = popDots[index - 1]
          if (!prev) return null
          return (
            <line
              key={`d-${index}`}
              x1={scaleX(prev.x)}
              y1={110 - (prev.y / maxDensity) * 70}
              x2={scaleX(point.x)}
              y2={110 - (point.y / maxDensity) * 70}
              stroke={VIZ.population}
              strokeWidth="2"
            />
          )
        })}
        <line x1={scaleX(theoretical.mu)} y1="36" x2={scaleX(theoretical.mu)} y2="118" stroke={VIZ.success} strokeWidth="2" />
        <text x="40" y="148" fill={VIZ.sample} fontSize="12">Sampling distribution of x̄ · n = {n} · {result.R} samples</text>
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
        <line x1={scaleX(theoretical.meanOfMean)} y1="210" x2={scaleX(theoretical.meanOfMean)} y2="380" stroke={VIZ.success} strokeWidth="2" />
        <line x1={scaleX(theoretical.meanOfMean - theoretical.se)} y1="210" x2={scaleX(theoretical.meanOfMean - theoretical.se)} y2="380" stroke={VIZ.muted} strokeDasharray="4 3" />
        <line x1={scaleX(theoretical.meanOfMean + theoretical.se)} y1="210" x2={scaleX(theoretical.meanOfMean + theoretical.se)} y2="380" stroke={VIZ.muted} strokeDasharray="4 3" />
        <text x="40" y="404" fill={VIZ.ink} fontSize="13">Mean marker and ±1 SE</text>
      </StageFrame>
    </VisualLesson>
  )
}
