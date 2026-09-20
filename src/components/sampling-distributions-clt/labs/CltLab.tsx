import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import {
  CLT_MAX_N,
  CLT_PARENT_OPTIONS,
  CLT_SAMPLE_SIZES,
  appendSimulatedStatistics,
  buildHistogram,
  cltSimulationCount,
  createPopulation,
  createRng,
  defaultParentParams,
  formatNum,
  histogramRangeForStatistic,
  parseCltSampleSize,
  samplingMomentsFor,
  specFromParent,
  type CltTab,
  type HistBin,
  type PopulationKind,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSelect, CltSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock } from '../shared'
import { DensityPreview, HistogramChart } from '../plots'

export function CltLab({ tab }: { tab: CltTab }) {
  const [kind, setKind] = useState<PopulationKind>('exponential')
  const [parentParams, setParentParams] = useState<Record<string, number>>(() => defaultParentParams('exponential'))
  const [n, setN] = useState(30)
  const [nText, setNText] = useState('30')
  const [nError, setNError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(40)
  const [seed, setSeed] = useState(41)
  const population = useMemo(() => createPopulation(specFromParent(kind, parentParams)), [kind, parentParams])
  const theoretical = useMemo(() => samplingMomentsFor(population, n), [population, n])
  const range = useMemo(() => histogramRangeForStatistic(population, n, 'mean'), [population, n])
  const [histogram, setHistogram] = useState<HistBin[]>(() => buildHistogram([], 28, range))
  const [stats, setStats] = useState({ R: 0, sum: 0, sumSq: 0, lastStatistic: Number.NaN })
  const rngRef = useRef(createRng(seed))
  const histRef = useRef(histogram)
  const statsRef = useRef(stats)
  histRef.current = histogram
  statsRef.current = stats
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    rngRef.current = createRng(seed)
    const nextHist = buildHistogram([], 28, range)
    const rebuilt = appendSimulatedStatistics({
      population,
      n,
      add: cltSimulationCount(n, 800),
      statistic: 'mean',
      rng: createRng(seed + 5),
      histogram: nextHist,
      range,
      prior: { R: 0, sum: 0, sumSq: 0 },
    })
    histRef.current = nextHist
    const nextStats = { R: rebuilt.R, sum: rebuilt.sum, sumSq: rebuilt.sumSq, lastStatistic: rebuilt.lastStatistic }
    statsRef.current = nextStats
    setHistogram(nextHist)
    setStats(nextStats)
    setPlaying(false)
  }, [kind, n, seed, range, population])

  useEffect(() => {
    if (!playing) return
    let cancelled = false
    let timer = 0
    const tick = () => {
      if (cancelled) return
      const add = reduced ? 80 : Math.max(4, Math.round(speed / 4))
      const next = appendSimulatedStatistics({
        population,
        n,
        add,
        statistic: 'mean',
        rng: rngRef.current,
        histogram: histRef.current,
        range,
        prior: statsRef.current,
      })
      const cloned = histRef.current.map((bin) => ({ ...bin }))
      histRef.current = cloned
      const nextStats = { R: next.R, sum: next.sum, sumSq: next.sumSq, lastStatistic: next.lastStatistic }
      statsRef.current = nextStats
      setHistogram(cloned)
      setStats(nextStats)
      if (next.R >= 4000) {
        setPlaying(false)
        return
      }
      timer = window.setTimeout(tick, reduced ? 0 : Math.max(40, 220 - speed * 2))
    }
    timer = window.setTimeout(tick, 30)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [playing, population, n, range, speed, reduced])

  const empiricalMean = stats.R > 0 ? stats.sum / stats.R : Number.NaN
  const empiricalSd = stats.R > 1 ? Math.sqrt(Math.max(0, stats.sumSq / stats.R - empiricalMean * empiricalMean)) : Number.NaN
  const se = theoretical.se
  const option = CLT_PARENT_OPTIONS.find((item) => item.kind === kind)
  const commitN = (raw: string) => {
    setNText(raw)
    const parsed = parseCltSampleSize(raw)
    if (!parsed.ok) {
      setNError(parsed.error)
      return
    }
    setNError(null)
    setN(parsed.n)
  }

  const stepOnce = () => {
    const next = appendSimulatedStatistics({
      population,
      n,
      add: 1,
      statistic: 'mean',
      rng: rngRef.current,
      histogram,
      range,
      prior: stats,
    })
    setHistogram(histogram.map((bin) => ({ ...bin })))
    setStats({ R: next.R, sum: next.sum, sumSq: next.sumSq, lastStatistic: next.lastStatistic })
  }

  const generate = () => {
    const nextHist = buildHistogram([], 28, range)
    const rebuilt = appendSimulatedStatistics({
      population,
      n,
      add: 1000,
      statistic: 'mean',
      rng: createRng(seed + 17),
      histogram: nextHist,
      range,
      prior: { R: 0, sum: 0, sumSq: 0 },
    })
    setHistogram(nextHist)
    setStats({ R: rebuilt.R, sum: rebuilt.sum, sumSq: rebuilt.sumSq, lastStatistic: rebuilt.lastStatistic })
    setPlaying(false)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="What the CLT does — and does not — say">
          <p className="text-sm leading-6 text-slate-600">
            For independent draws from a parent with finite mean and variance, the distribution of x̄ becomes
            approximately normal as n grows. How large n needs to be depends on the parent. A skewed or heavy-tailed
            population needs more. There is no universal “n ≥ 30 always normal” rule.
          </p>
          <FormulaBlock tex={'\\bar{X}\\approx N(\\mu,\\,\\sigma/\\sqrt{n})\\quad\\text{for large }n'} label="CLT approximation for the sample mean" />
        </CltCard>
        <CltCard title="This is not the Law of Large Numbers">
          <p className="text-sm leading-6 text-slate-600">
            The CLT is about the shape of the sampling distribution. The LLN is about one running average settling near
            μ. A pile of means can look bell-shaped while a single path is still wandering.
          </p>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="A city’s household incomes are right-skewed with mean $50,000 and standard deviation $30,000. You take random samples of size n = 36. What is a fair description of the sampling distribution of x̄?"
          options={[
            'Right-skewed with standard deviation $30,000',
            'Approximately normal with standard deviation $5,000',
            'Approximately normal with standard deviation $30,000',
            'Left-skewed with standard deviation $4,743',
          ]}
          answer={1}
          explanation="SE = 30,000 / 6 = 5,000. The parent is skewed, but n = 36 is often enough for a usable normal sketch of the means — not a guarantee for every parent."
        />
      </CltCard>
    )
  }

  return (
    <LabExploreGrid
      simulation={
        <CltCard
          title="Interactive simulation"
          action={
            <button type="button" className="clt-btn clt-btn-ghost" onClick={() => setSeed((value) => value + 1)}>
              <RotateCcw size={14} aria-hidden /> Reset
            </button>
          }
        >
          <p className="mb-4 text-sm text-slate-500">
            See the Central Limit Theorem in action. Choose a parent distribution, select a sample size, and view the
            distribution of sample means from many repeated samples — actual draws, not a fake morph.
          </p>
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-4">
              <CltSelect
                label="Population distribution"
                value={kind}
                onChange={(value) => {
                  const next = value as PopulationKind
                  setKind(next)
                  setParentParams(defaultParentParams(next))
                }}
                options={CLT_PARENT_OPTIONS.map((item) => ({ value: item.kind, label: item.label }))}
              />
              {(option?.params ?? []).map((param) => (
                <label key={param.key} className="block text-xs font-semibold text-slate-500">
                  {param.label}
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={parentParams[param.key] ?? param.default}
                    onChange={(event) => setParentParams((current) => ({ ...current, [param.key]: Number(event.target.value) }))}
                    className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              ))}
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
                Sample size (n)
                <input
                  type="number"
                  min={1}
                  max={CLT_MAX_N}
                  step={1}
                  value={nText}
                  onChange={(event) => commitN(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                {nError ? <span className="mt-1 block text-xs font-normal text-rose-600">{nError}</span> : <span className="mt-1 block text-xs font-normal text-slate-400">Any positive integer up to {CLT_MAX_N}.</span>}
              </label>
              <CltSlider
                label="Sample size slider"
                value={Math.min(n, 200)}
                min={1}
                max={200}
                step={1}
                onChange={(value) => commitN(String(value))}
                ticks={[1, 7, 30, 43, 100, 200]}
              />
              <div className="flex flex-wrap gap-2">
                {CLT_SAMPLE_SIZES.map((size) => (
                  <button key={size} type="button" className={`clt-btn ${n === size ? '' : 'clt-btn-ghost'}`} onClick={() => commitN(String(size))}>
                    {size}
                  </button>
                ))}
              </div>
              <CltSlider label="Playback speed" value={speed} min={8} max={80} step={1} onChange={setSpeed} display={`${speed}`} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="clt-btn" onClick={() => setPlaying((value) => !value)}>
                  {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
                  {playing ? 'Pause' : 'Play'}
                </button>
                <button type="button" className="clt-btn clt-btn-ghost" onClick={stepOnce}>
                  <SkipForward size={14} aria-hidden /> Step
                </button>
                <button type="button" className="clt-btn clt-btn-ghost" onClick={generate}>
                  Run simulation
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Parent distribution</p>
                <DensityPreview points={population.density} label={`${kind} parent`} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Metric label="μ" value={formatNum(theoretical.mu)} />
                  <Metric label="σ²" value={formatNum(theoretical.variance)} />
                  <Metric label="σ" value={formatNum(theoretical.sd)} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Sampling distribution of x̄</p>
                <HistogramChart bins={histogram} mean={population.mean} xLabel="Sample mean (x̄)" height={180} ariaLabel="Sampling distribution of the mean under the CLT" />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Metric label="n" value={String(n)} />
                  <Metric label="μx̄" value={formatNum(theoretical.meanOfMean)} />
                  <Metric label="SE (σ/√n)" value={formatNum(se)} />
                  <Metric label="Samples" value={String(stats.R)} />
                  <Metric label="Simulated mean" value={formatNum(empiricalMean)} />
                  <Metric label="Simulated SD" value={formatNum(empiricalSd)} />
                </div>
              </div>
            </div>
          </div>
          <Insight title="Read the picture, not a slogan">
            For n = {n}, the sampling distribution of x̄ is {n < 10 ? 'still close to the parent shape' : n < 30 ? 'starting to look more symmetric' : 'often a usable normal sketch'}
            {kind === 'normal' ? ', and the parent was already normal.' : ', even though the parent is not normal.'} How
            convincing that looks still depends on the parent.
          </Insight>
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="bell" title="Central Limit Theorem">
              If a random sample of size n comes from any population with mean μ and finite variance, the sampling
              distribution of x̄ is approximately normal for sufficiently large n.
            </ConceptRow>
            <FormulaBlock tex={'\\bar{X}\\ \\approx\\ N(\\mu,\\ \\sigma/\\sqrt{n})'} label="Approximate sampling distribution" />
            <ConceptRow icon="check" title="Conditions">
              Independent samples, a finite mean and variance, and a sample size large enough for that parent. Smaller n
              can work for mild parents; skewed or heavy-tailed parents need more.
            </ConceptRow>
            <Insight title="Why it matters">
              The CLT lets us use normal-based confidence intervals and tests even when the population is not normal —
              once the sampling distribution of the statistic is the thing that has become approximately normal.
            </Insight>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A hospital wants to estimate average length of stay (in days) for its patients. Historical data suggest a
            right-skewed population with mean 4 days and standard deviation 6. What happens if we take random samples of
            size n = 36?
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>By the CLT, the sampling distribution of x̄ is approximately normal, even though the population is right-skewed.</li>
            <li>Mean: μ<sub>x̄</sub> = 4 days</li>
            <li>SE = 6 / √36 = 1 day</li>
            <li>So for n = 36, x̄ is approximately N(4, 1).</li>
          </ol>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="A city’s household incomes are right-skewed with mean $50,000 and SD $30,000. You take random samples of size 36. The sampling distribution of x̄ is:"
            options={[
              'Right-skewed with SD $30,000',
              'Approximately normal with SD $5,000',
              'Approximately normal with SD $4,743',
              'Left-skewed with SD $4,743',
            ]}
            answer={1}
            explanation="SE = 30,000 / 6 = 5,000. The CLT is about the means, not about the incomes themselves becoming normal."
          />
        </CltCard>
      }
    />
  )
}
