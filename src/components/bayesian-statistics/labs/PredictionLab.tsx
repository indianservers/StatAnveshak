import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  betaBinomialPredictivePmf,
  betaPdf,
  formatNum,
  histogram,
  linspace,
  posteriorPredictiveBinomial,
  SeededRng,
  summarizeBeta,
  updateBetaBinomial,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart, HistogramChart } from '../plots'

const DRAW_SIZES = [1, 10, 100, 1000] as const

export function PredictionLab({ tab }: { tab: BayesTab }) {
  const [alpha, setAlpha] = useState(8)
  const [beta, setBeta] = useState(4)
  const [nNew, setNNew] = useState(12)
  const [draws, setDraws] = useState<(typeof DRAW_SIZES)[number]>(100)
  const [seed, setSeed] = useState(3)

  const post = updateBetaBinomial(alpha, beta, 0, 0)
  const summary = summarizeBeta(post.alpha, post.beta)
  const xs = useMemo(() => linspace(0.001, 0.999, 160), [])
  const postPts = useMemo(() => xs.map((x) => ({ x, y: betaPdf(x, alpha, beta) })), [xs, alpha, beta])
  const pmf = useMemo(() => betaBinomialPredictivePmf(alpha, beta, nNew), [alpha, beta, nNew])
  const sims = useMemo(() => posteriorPredictiveBinomial(alpha, beta, nNew, draws, new SeededRng(seed)), [alpha, beta, nNew, draws, seed])
  const predMean = pmf.reduce((sum, point) => sum + point.x * point.y, 0)

  const reset = () => {
    setAlpha(8)
    setBeta(4)
    setNNew(12)
    setDraws(100)
    setSeed(3)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Parameter vs. new data">
          <p className="text-sm leading-6 text-slate-600">
            The posterior is a distribution for θ. The posterior predictive is a distribution for a new observation:
            draw θ from the posterior, then x_new | θ. That second step is required. A histogram of θ is not a
            prediction of future counts.
          </p>
          <FormulaBlock tex={'p(x_{\\mathrm{new}}\\mid y)=\\int p(x_{\\mathrm{new}}\\mid\\theta)\\,p(\\theta\\mid y)\\,d\\theta'} />
        </BayesCard>
        <BayesCard title="Why it is wider">
          <CheckList
            items={[
              'Posterior uncertainty in θ spreads the predictive.',
              'Even if you knew θ, Binomial or Poisson noise would remain.',
              'The Beta–Binomial pmf is the exact integral for this conjugate pair.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['bayesian-prediction'].tryThis}</Insight>
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
              prompt: 'To simulate one future dataset you should…',
              options: ['reuse the last θ forever', 'draw θ from the posterior, then x | θ', 'draw x from the prior', 'use the MLE only'],
              answer: 1,
              explanation: 'That two-step draw is the posterior predictive.',
            },
            {
              prompt: 'The posterior of θ and the posterior predictive of x_new…',
              options: ['are the same curve', 'live on different spaces', 'ignore the likelihood', 'cannot be simulated'],
              answer: 1,
              explanation: 'θ is a parameter (here a probability). x_new is a future count.',
            },
            {
              prompt: 'More posterior uncertainty makes the predictive…',
              options: ['narrower', 'wider', 'equal to the prior', 'a confidence interval'],
              answer: 1,
              explanation: 'Uncertainty in θ adds to the sampling noise of x | θ.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Compare 1 draw with 1,000">
        <p className="text-sm leading-6 text-slate-600">
          One future dataset is a single integer. One thousand datasets estimate the predictive distribution. The
          theoretical mean is n_new × posterior mean = {formatNum(nNew * summary.mean)}.
        </p>
      </BayesCard>
    )
  }

  return (
    <div className="grid gap-4">
      <BayesCard title="Posterior and posterior predictive" action={<ResetButton onClick={reset} />}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <CurveLegend items={[{ id: 'posterior', label: 'Posterior of θ' }]} />
            <DensityChart series={[{ id: 'post', label: 'Posterior', role: 'posterior', points: postPts }]} xLabel="θ" ariaLabel="Posterior of theta" />
            <p className="mt-2 text-xs text-slate-400">This curve is about the parameter, not a future count.</p>
          </div>
          <div>
            <CurveLegend items={[{ id: 'predictive', label: 'Predictive P(x_new | y)' }]} />
            <DensityChart
              series={[{ id: 'pred', label: 'Predictive', role: 'predictive', points: pmf }]}
              xLabel={`Future successes in ${nNew} trials`}
              yLabel="Probability"
              ariaLabel="Beta-binomial posterior predictive"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Posterior mean θ" value={formatNum(summary.mean)} />
          <MetricCard label="Predictive mean" value={formatNum(predMean)} hint={`n_new × E[θ | y] = ${formatNum(nNew * summary.mean)}`} accent="#7c3aed" />
          <MetricCard label="Simulated mean" value={formatNum(sims.reduce((sum, value) => sum + value, 0) / sims.length)} />
        </div>
      </BayesCard>
      <BayesCard title="Simulate future datasets">
        <div className="grid gap-3 md:grid-cols-3">
          <BayesSlider label="Posterior α" value={alpha} min={0.8} max={30} step={0.2} onChange={setAlpha} display={formatNum(alpha, 1)} />
          <BayesSlider label="Posterior β" value={beta} min={0.8} max={30} step={0.2} onChange={setBeta} display={formatNum(beta, 1)} />
          <BayesSlider label="Future trials n_new" value={nNew} min={1} max={40} step={1} onChange={setNNew} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DRAW_SIZES.map((value) => (
            <button key={value} type="button" className={value === draws ? 'bayes-btn' : 'bayes-btn bayes-btn-ghost'} onClick={() => setDraws(value)}>
              {value} dataset{value === 1 ? '' : 's'}
            </button>
          ))}
          <button type="button" className="bayes-btn bayes-btn-ghost" onClick={() => setSeed((value) => value + 1)}>
            New seed
          </button>
        </div>
        <HistogramChart
          bins={histogram(sims, Math.min(nNew + 1, 16), 0, nNew)}
          mean={predMean}
          xLabel="Simulated future successes"
          ariaLabel="Simulated posterior predictive datasets"
        />
        <p className="mt-2 text-sm text-slate-500">
          Each replicate draws θ ~ posterior, then x_new ~ Binomial(n_new, θ). That is not a histogram of θ.
        </p>
      </BayesCard>
    </div>
  )
}
