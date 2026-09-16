import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BAYES_HOME_COPY,
  formatNum,
  formatPct,
  histogram,
  logBetaPdf,
  logBinomialLikelihood,
  metropolisHastingsStep,
  runMetropolisHastings,
  SeededRng,
  type BayesTab,
  type MhStep,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSlider, CheckList, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { HistogramChart, TraceChart } from '../plots'

export function McmcLab({ tab }: { tab: BayesTab }) {
  const [alpha, setAlpha] = useState(2)
  const [beta, setBeta] = useState(8)
  const [n, setN] = useState(20)
  const [k, setK] = useState(14)
  const [step, setStep] = useState(0.08)
  const [current, setCurrent] = useState(0.4)
  const [trace, setTrace] = useState<number[]>([0.4])
  const [last, setLast] = useState<MhStep | null>(null)
  const [accepted, setAccepted] = useState(0)
  const [rejected, setRejected] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(8)
  const [seed, setSeed] = useState(5)
  const rngRef = useRef(new SeededRng(5))
  const currentRef = useRef(0.4)
  const stepRef = useRef(step)
  const targetRef = useRef<(x: number) => number>((x) => x)

  const logTarget = useMemo(
    () => (x: number) => {
      if (x <= 0 || x >= 1) return -1e12
      return logBetaPdf(x, alpha, beta) + logBinomialLikelihood(x, n, k)
    },
    [alpha, beta, n, k],
  )

  useEffect(() => {
    rngRef.current = new SeededRng(seed)
  }, [seed])

  useEffect(() => {
    currentRef.current = current
  }, [current])

  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    targetRef.current = logTarget
  }, [logTarget])

  const applyStep = (result: MhStep) => {
    const next = result.accepted ? result.proposed : currentRef.current
    currentRef.current = next
    setCurrent(next)
    setLast(result)
    setTrace((values) => [...values.slice(-240), next])
    if (result.accepted) setAccepted((value) => value + 1)
    else setRejected((value) => value + 1)
  }

  const takeStep = () => {
    applyStep(metropolisHastingsStep(currentRef.current, targetRef.current, stepRef.current, rngRef.current))
  }

  useEffect(() => {
    if (!playing) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPlaying(false)
      return
    }
    const id = window.setInterval(() => {
      applyStep(metropolisHastingsStep(currentRef.current, targetRef.current, stepRef.current, rngRef.current))
    }, Math.max(40, 700 / speed))
    return () => window.clearInterval(id)
  }, [playing, speed])

  const runBatch = (draws: number) => {
    const run = runMetropolisHastings({
      logTarget: targetRef.current,
      start: currentRef.current,
      step: stepRef.current,
      draws,
      rng: rngRef.current,
      burn: 0,
    })
    const next = run.samples[run.samples.length - 1] ?? currentRef.current
    currentRef.current = next
    setCurrent(next)
    setTrace((values) => [...values, ...run.trace].slice(-800))
    setAccepted((value) => value + run.accepted)
    setRejected((value) => value + run.rejected)
    setLast(run.steps[run.steps.length - 1] ?? null)
    setPlaying(false)
  }

  const reset = () => {
    setPlaying(false)
    setAlpha(2)
    setBeta(8)
    setN(20)
    setK(14)
    setStep(0.08)
    setCurrent(0.4)
    setTrace([0.4])
    setLast(null)
    setAccepted(0)
    setRejected(0)
    setSeed((value) => value + 1)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Metropolis–Hastings in one idea">
          <p className="text-sm leading-6 text-slate-600">
            When the posterior has no closed form, we can still walk around it. Propose a nearby value, accept it if it
            is more plausible, and sometimes accept a downhill move so the chain can travel. The stored positions are
            dependent MCMC samples, not i.i.d. posterior draws.
          </p>
          <CheckList
            items={[
              'Proposal: θ′ = θ + Normal(0, s²). Small s crawls; large s jumps and gets rejected.',
              'Accept if log U < log π(θ′) − log π(θ).',
              'A trace that looks “stuck” or “noisy” is a clue, not a proof of convergence.',
            ]}
          />
        </BayesCard>
        <BayesCard title="What this lab will not claim">
          <Insight title="Limits">{BAYES_HOME_COPY['mcmc-intuition'].tryThis} Visual inspection does not prove the chain has converged.</Insight>
          <p className="mt-3 text-sm text-slate-500">
            Large runs are computed in a batch. Animating 100,000 steps would not teach more than the acceptance rate
            and the histogram.
          </p>
        </BayesCard>
      </div>
    )
  }

  if (tab === 'quiz') {
    return (
      <BayesCard title="Check your understanding">
        <QuizBlock
          items={[
            {
              prompt: 'MCMC samples are…',
              options: ['always independent', 'a dependent path that targets the posterior', 'the same as the prior', 'bootstrap replicates'],
              answer: 1,
              explanation: 'Each draw depends on the previous one. After enough mixing they can be used as posterior samples.',
            },
            {
              prompt: 'A very large proposal step usually…',
              options: ['always mixes better', 'is rejected often', 'removes the prior', 'proves convergence'],
              answer: 1,
              explanation: 'Far proposals land in the tails and get rejected, so the chain barely moves.',
            },
            {
              prompt: 'Watching a pretty trace…',
              options: ['proves convergence', 'is a useful check but not a proof', 'replaces a posterior', 'makes samples independent'],
              answer: 1,
              explanation: 'Diagnostics help; they do not certify that you have the whole posterior.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Two step sizes">
        <p className="text-sm leading-6 text-slate-600">
          Run 1,000 steps at s = 0.02, then reset and try s = 0.8. Compare acceptance rates. A tiny step accepts often
          but mixes slowly. A huge step rejects often. Neither picture proves convergence.
        </p>
      </BayesCard>
    )
  }

  const rate = accepted + rejected === 0 ? 0 : accepted / (accepted + rejected)

  return (
    <div className="grid gap-4">
      <BayesCard title="Metropolis–Hastings walker" action={<ResetButton onClick={reset} />}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.85fr)]">
          <div className="space-y-3">
            <TraceChart values={trace} ariaLabel="Trace of the Metropolis-Hastings walker" />
            <HistogramChart
              bins={histogram(trace, 18, 0, 1)}
              mean={current}
              xLabel="θ (dependent MCMC samples)"
              ariaLabel="Histogram of MCMC samples"
            />
          </div>
          <div className="space-y-3">
            <BayesSlider label="Prior α" value={alpha} min={0.6} max={20} step={0.2} onChange={setAlpha} display={formatNum(alpha, 1)} />
            <BayesSlider label="Prior β" value={beta} min={0.6} max={20} step={0.2} onChange={setBeta} display={formatNum(beta, 1)} />
            <BayesSlider label="Trials n" value={n} min={2} max={60} step={1} onChange={setN} />
            <BayesSlider label="Successes x" value={Math.min(k, n)} min={0} max={n} step={1} onChange={setK} />
            <BayesSlider label="Proposal SD" value={step} min={0.01} max={0.8} step={0.01} onChange={setStep} display={formatNum(step, 2)} />
            <BayesSlider label="Walk speed" value={speed} min={1} max={20} step={1} onChange={setSpeed} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bayes-btn" onClick={() => setPlaying((value) => !value)}>
                {playing ? 'Pause' : 'Play'}
              </button>
              <button type="button" className="bayes-btn bayes-btn-ghost" onClick={takeStep}>
                Step
              </button>
              <button type="button" className="bayes-btn bayes-btn-ghost" onClick={() => runBatch(1000)}>
                Batch 1,000
              </button>
              <button type="button" className="bayes-btn bayes-btn-ghost" onClick={() => runBatch(20000)}>
                Batch 20,000
              </button>
            </div>
            {last && (
              <p className="text-sm leading-6 text-slate-600">
                Proposed {formatNum(last.proposed)}. {last.accepted ? 'Accepted.' : 'Rejected.'} log α = {formatNum(last.logAlpha, 2)}.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Current θ" value={formatNum(current)} />
          <MetricCard label="Accepted" value={String(accepted)} />
          <MetricCard label="Rejected" value={String(rejected)} />
          <MetricCard label="Accept rate" value={formatPct(rate)} />
        </div>
      </BayesCard>
    </div>
  )
}
