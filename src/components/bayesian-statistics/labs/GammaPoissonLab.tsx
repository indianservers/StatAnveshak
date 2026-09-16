import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  formatNum,
  gammaInterval,
  gammaPdfRate,
  histogram,
  linspace,
  logGammaPdfRate,
  logPoissonLikelihood,
  multiplyLogCurves,
  posteriorPredictivePoisson,
  SeededRng,
  summarizeGammaRate,
  updateGammaPoisson,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart, HistogramChart } from '../plots'

export function GammaPoissonLab({ tab }: { tab: BayesTab }) {
  const [shape, setShape] = useState(2)
  const [rate, setRate] = useState(1)
  const [count, setCount] = useState(5)
  const [exposure, setExposure] = useState(1)
  const [seq, setSeq] = useState<number[]>([])
  const [predDraws, setPredDraws] = useState(0)

  const totalCount = seq.length > 0 ? seq.reduce((sum, value) => sum + value, 0) : count
  const totalExposure = seq.length > 0 ? seq.length * exposure : exposure
  const post = updateGammaPoisson(shape, rate, totalCount, totalExposure)
  const priorSum = summarizeGammaRate(shape, rate)
  const postSum = summarizeGammaRate(post.shape, post.rate)
  const interval = gammaInterval(post.shape, post.rate, 0.95, 'equal-tailed')
  const xmax = Math.max(12, postSum.mean + 5 * postSum.sd, priorSum.mean + 4 * priorSum.sd)
  const xs = useMemo(() => linspace(0.01, xmax, 180), [xmax])
  const priorPts = useMemo(() => xs.map((x) => ({ x, y: gammaPdfRate(x, shape, rate) })), [xs, shape, rate])
  const likePts = useMemo(() => {
    const raw = xs.map((x) => Math.exp(logPoissonLikelihood(x, totalCount, totalExposure)))
    const peak = Math.max(...raw, 1e-12)
    const scale = Math.max(...priorPts.map((p) => p.y), 1e-6)
    return xs.map((x, i) => ({ x, y: (raw[i] / peak) * scale }))
  }, [xs, totalCount, totalExposure, priorPts])
  const postPts = useMemo(
    () => multiplyLogCurves(xs, (x) => logGammaPdfRate(x, shape, rate), (x) => logPoissonLikelihood(x, totalCount, totalExposure)),
    [xs, shape, rate, totalCount, totalExposure],
  )
  const pred = useMemo(() => {
    if (predDraws <= 0) return []
    return posteriorPredictivePoisson(post.shape, post.rate, 1, predDraws, new SeededRng(8))
  }, [predDraws, post.shape, post.rate])

  const reset = () => {
    setShape(2)
    setRate(1)
    setCount(5)
    setExposure(1)
    setSeq([])
    setPredDraws(0)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Shape–rate Gamma prior">
          <p className="text-sm leading-6 text-slate-600">
            This lab uses the shape–rate parameterization: λ ~ Gamma(α, β) with rate β, so E[λ] = α/β. The Distributions
            studio uses shape–scale θ = 1/β. After counts with total exposure t, the posterior is Gamma(α + Σx, β + t).
          </p>
          <FormulaBlock tex={'\\lambda\\sim\\mathrm{Gamma}(\\alpha,\\beta_{\\mathrm{rate}}),\\quad x\\mid\\lambda\\sim\\mathrm{Poisson}(\\lambda t)'} />
          <FormulaBlock tex={'\\lambda\\mid x\\sim\\mathrm{Gamma}(\\alpha+x,\\,\\beta+t)'} />
        </BayesCard>
        <BayesCard title="Exposure and sequential counts">
          <CheckList
            items={[
              'Exposure t is time, area, or traffic. A rate of 2 events per hour for 3 hours has t = 3.',
              'Each new count adds to α; each new exposure adds to β.',
              'The posterior predictive draws λ from the posterior, then a new count given that λ.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['gamma-poisson'].tryThis}</Insight>
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
              prompt: 'In this studio, Gamma(α, β) uses…',
              options: ['shape and scale, mean αβ', 'shape and rate, mean α/β', 'rate and scale only', 'a Normal approximation'],
              answer: 1,
              explanation: 'Shape–rate: mean α/β and variance α/β². Scale is the reciprocal of the rate.',
            },
            {
              prompt: 'Five events in exposure t = 2 with prior Gamma(2, 1) give posterior…',
              options: ['Gamma(7, 3)', 'Gamma(5, 2)', 'Gamma(2, 5)', 'Poisson(2.5)'],
              answer: 0,
              explanation: 'α′ = 2+5 = 7, β′ = 1+2 = 3.',
            },
            {
              prompt: 'A histogram of λ draws is…',
              options: ['the posterior predictive for new counts', 'the posterior of the rate', 'the likelihood', 'a confidence interval'],
              answer: 1,
              explanation: 'Parameter draws describe λ. Predictive counts come from x_new | λ after drawing λ.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Add sequential counts" action={<ResetButton onClick={reset} />}>
        <p className="text-sm leading-6 text-slate-500">Each click is one more exposure window of length t = {exposure}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 5].map((value) => (
            <button key={value} type="button" className="bayes-btn" onClick={() => setSeq((items) => [...items, value])}>
              Observe {value}
            </button>
          ))}
          <button type="button" className="bayes-btn bayes-btn-ghost" onClick={() => setSeq([])}>
            Clear sequence
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Total counts {totalCount} in exposure {formatNum(totalExposure, 1)}. Posterior mean {formatNum(postSum.mean)}.
        </p>
      </BayesCard>
    )
  }

  return (
    <div className="grid gap-4">
      <BayesCard title="Gamma prior and Poisson data" action={<ResetButton onClick={reset} />}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.75fr)]">
          <div>
            <CurveLegend
              items={[
                { id: 'prior', label: `Prior Gamma(${formatNum(shape, 1)}, ${formatNum(rate, 1)})` },
                { id: 'likelihood', label: 'Likelihood (scaled)' },
                { id: 'posterior', label: `Posterior Gamma(${formatNum(post.shape, 1)}, ${formatNum(post.rate, 1)})` },
              ]}
            />
            <DensityChart
              series={[
                { id: 'prior', label: 'Prior', role: 'prior', points: priorPts },
                { id: 'like', label: 'Likelihood', role: 'likelihood', points: likePts },
                { id: 'post', label: 'Posterior', role: 'posterior', points: postPts },
              ]}
              xLabel="Rate λ (events per unit exposure)"
              ariaLabel="Gamma prior, Poisson likelihood, and gamma posterior"
            />
          </div>
          <div className="space-y-3">
            <BayesSlider label="Prior shape α" value={shape} min={0.5} max={20} step={0.5} onChange={setShape} />
            <BayesSlider label="Prior rate β" value={rate} min={0.2} max={8} step={0.1} onChange={setRate} display={formatNum(rate, 1)} />
            <p className="text-xs text-slate-400">Mean α/β = {formatNum(priorSum.mean)}. Scale θ = 1/β = {formatNum(1 / rate)}.</p>
            <BayesSlider label="Observed count x" value={count} min={0} max={40} step={1} onChange={(value) => { setCount(value); setSeq([]) }} />
            <BayesSlider label="Exposure t" value={exposure} min={0.5} max={10} step={0.5} onChange={(value) => { setExposure(value); setSeq([]) }} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Prior mean" value={formatNum(priorSum.mean)} />
          <MetricCard label="MLE x/t" value={formatNum(totalCount / totalExposure)} />
          <MetricCard label="Posterior mean" value={formatNum(postSum.mean)} accent="#dc2626" />
          <MetricCard label="95% credible" value={`[${formatNum(interval.lo)}, ${formatNum(interval.hi)}]`} />
        </div>
      </BayesCard>
      <BayesCard title="Posterior predictive counts">
        <p className="text-sm text-slate-500">Draw λ from the posterior, then a new count x_new | λ for exposure 1.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 200, 1000].map((value) => (
            <button key={value} type="button" className="bayes-btn bayes-btn-ghost" onClick={() => setPredDraws(value)}>
              {value === 0 ? 'Clear' : `Simulate ${value}`}
            </button>
          ))}
        </div>
        {pred.length > 0 && (
          <HistogramChart bins={histogram(pred, 16, 0, Math.max(8, ...pred))} xLabel="Future count" ariaLabel="Posterior predictive counts" />
        )}
      </BayesCard>
    </div>
  )
}
