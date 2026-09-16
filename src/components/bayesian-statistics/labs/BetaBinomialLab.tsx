import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  BETA_PRESETS,
  betaInterval,
  formatNum,
  histogram,
  linspace,
  logBetaPdf,
  logBinomialLikelihood,
  multiplyLogCurves,
  sampleBeta,
  sampleBinomial,
  SeededRng,
  summarizeBeta,
  updateBetaBinomial,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSelect, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart, HistogramChart } from '../plots'

export function BetaBinomialLab({ tab }: { tab: BayesTab }) {
  const [preset, setPreset] = useState<keyof typeof BETA_PRESETS>('weak')
  const [alpha, setAlpha] = useState(2)
  const [beta, setBeta] = useState(2)
  const [n, setN] = useState(20)
  const [k, setK] = useState(14)
  const [seq, setSeq] = useState<Array<'s' | 'f'>>([])
  const [trueP, setTrueP] = useState(0.6)
  const [simN, setSimN] = useState(50)
  const [simSeed, setSimSeed] = useState(4)
  const [draws, setDraws] = useState(0)

  const applyPreset = (id: keyof typeof BETA_PRESETS) => {
    setPreset(id)
    setAlpha(BETA_PRESETS[id].alpha)
    setBeta(BETA_PRESETS[id].beta)
  }

  const dataK = seq.length > 0 ? seq.filter((item) => item === 's').length : Math.min(k, n)
  const dataN = seq.length > 0 ? seq.length : n
  const post = updateBetaBinomial(alpha, beta, dataK, dataN)
  const priorSum = summarizeBeta(alpha, beta)
  const postSum = summarizeBeta(post.alpha, post.beta)
  const interval = betaInterval(post.alpha, post.beta, 0.95, 'equal-tailed')
  const xs = useMemo(() => linspace(0.001, 0.999, 180), [])
  const priorPts = useMemo(() => xs.map((x) => ({ x, y: Math.exp(logBetaPdf(x, alpha, beta)) })), [xs, alpha, beta])
  const likePts = useMemo(() => {
    const raw = xs.map((x) => Math.exp(logBinomialLikelihood(x, dataN, dataK)))
    const peak = Math.max(...raw, 1e-12)
    const scale = Math.max(...priorPts.map((p) => p.y), 1e-6)
    return xs.map((x, i) => ({ x, y: (raw[i] / peak) * scale }))
  }, [xs, dataN, dataK, priorPts])
  const postPts = useMemo(
    () => multiplyLogCurves(xs, (x) => logBetaPdf(x, alpha, beta), (x) => logBinomialLikelihood(x, dataN, dataK)),
    [xs, alpha, beta, dataN, dataK],
  )
  const sim = useMemo(() => {
    const rng = new SeededRng(simSeed)
    const successes = sampleBinomial(simN, trueP, rng)
    return { successes, failures: simN - successes, phat: successes / simN }
  }, [simSeed, simN, trueP])
  const thetaDraws = useMemo(() => {
    if (draws <= 0) return []
    const rng = new SeededRng(21 + draws)
    return Array.from({ length: draws }, () => sampleBeta(post.alpha, post.beta, rng))
  }, [draws, post.alpha, post.beta])

  const reset = () => {
    applyPreset('weak')
    setN(20)
    setK(14)
    setSeq([])
    setTrueP(0.6)
    setSimN(50)
    setDraws(0)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="A conjugate pair for a rate">
          <p className="text-sm leading-6 text-slate-600">
            If θ ~ Beta(α, β) and y | θ ~ Binomial(n, θ), the posterior is Beta(α + y, β + n − y). Concentration α + β
            is prior strength — an analogy to sample size, not a literal n unless you choose to interpret it that way.
          </p>
          <FormulaBlock tex={'\\theta\\sim\\mathrm{Beta}(\\alpha,\\beta),\\quad y\\mid\\theta\\sim\\mathrm{Bin}(n,\\theta)'} />
          <FormulaBlock tex={'\\theta\\mid y\\sim\\mathrm{Beta}(\\alpha+y,\\,\\beta+n-y)'} />
        </BayesCard>
        <BayesCard title="What the numbers mean">
          <CheckList
            items={[
              'α is prior successes; β is prior failures. Their sum is how stubborn the prior is.',
              'Uniform Beta(1,1) is a flat prior. U-shaped Beta(0.5,0.5) puts mass near 0 and 1.',
              'As n grows, the posterior concentrates around the observed proportion.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['beta-binomial'].tryThis}</Insight>
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
              prompt: 'After 14 successes in 20 trials with a Beta(2, 2) prior, the posterior is…',
              options: ['Beta(2, 2)', 'Beta(16, 8)', 'Beta(14, 6)', 'Binomial(20, 14)'],
              answer: 1,
              explanation: 'α′ = 2+14 = 16 and β′ = 2+6 = 8.',
            },
            {
              prompt: 'α + β is best read as…',
              options: ['the sample size n', 'prior concentration / strength', 'the posterior mean', 'the MLE'],
              answer: 1,
              explanation: 'It measures how concentrated the prior is. Calling it “pseudo-counts” is an analogy, not a second dataset.',
            },
            {
              prompt: 'A 95% credible interval from the posterior is a statement about…',
              options: ['the procedure’s long-run coverage', 'θ given the data and prior', 'the next observation only', 'the p-value'],
              answer: 1,
              explanation: 'It is an interval of posterior mass for θ.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    const practiced = updateBetaBinomial(2, 2, sim.successes, simN)
    const practicedMean = summarizeBeta(practiced.alpha, practiced.beta).mean
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Simulate binomial data" action={<ResetButton onClick={reset} />}>
          <BayesSlider label="True θ for simulation" value={trueP} min={0.05} max={0.95} step={0.01} onChange={setTrueP} display={formatNum(trueP)} />
          <BayesSlider label="Number of trials" value={simN} min={10} max={200} step={1} onChange={setSimN} />
          <button type="button" className="bayes-btn mt-3" onClick={() => setSimSeed((value) => value + 1)}>
            Generate data
          </button>
          <p className="mt-3 text-sm text-slate-500">
            Simulated successes {sim.successes}, failures {sim.failures}, sample proportion {formatNum(sim.phat)}.
          </p>
        </BayesCard>
        <BayesCard title="Update from the simulation">
          <p className="text-sm leading-6 text-slate-600">
            Starting from Beta(2, 2), the posterior is Beta({practiced.alpha}, {practiced.beta}) with mean {formatNum(practicedMean)}.
          </p>
          <FormulaBlock tex={'E[\\theta\\mid y]=(\\alpha+y)/(\\alpha+\\beta+n)'} />
        </BayesCard>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <BayesCard title="Prior, likelihood, and posterior" action={<ResetButton onClick={reset} />}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.75fr)]">
          <div>
            <CurveLegend
              items={[
                { id: 'prior', label: `Prior Beta(${formatNum(alpha, 1)}, ${formatNum(beta, 1)})` },
                { id: 'likelihood', label: 'Likelihood (scaled)' },
                { id: 'posterior', label: `Posterior Beta(${formatNum(post.alpha, 1)}, ${formatNum(post.beta, 1)})` },
              ]}
            />
            <DensityChart
              series={[
                { id: 'prior', label: 'Prior', role: 'prior', points: priorPts },
                { id: 'like', label: 'Likelihood', role: 'likelihood', points: likePts },
                { id: 'post', label: 'Posterior', role: 'posterior', points: postPts },
              ]}
              xLabel="Probability of success (θ)"
              ariaLabel="Beta prior, binomial likelihood, and beta posterior"
            />
          </div>
          <div className="space-y-3">
            <BayesSelect
              label="Prior preset"
              value={preset}
              onChange={(value) => applyPreset(value as keyof typeof BETA_PRESETS)}
              options={Object.entries(BETA_PRESETS).map(([value, item]) => ({ value, label: item.label }))}
            />
            <BayesSlider label="Prior α" value={alpha} min={0.5} max={40} step={0.5} onChange={setAlpha} />
            <BayesSlider label="Prior β" value={beta} min={0.5} max={40} step={0.5} onChange={setBeta} />
            <BayesSlider label="Trials n" value={n} min={1} max={100} step={1} onChange={(value) => { setN(value); setSeq([]) }} />
            <BayesSlider label="Successes k" value={Math.min(k, n)} min={0} max={n} step={1} onChange={(value) => { setK(value); setSeq([]) }} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bayes-btn" onClick={() => setSeq((items) => [...items, 's'])}>
                Sequential success
              </button>
              <button type="button" className="bayes-btn bayes-btn-ghost" onClick={() => setSeq((items) => [...items, 'f'])}>
                Sequential failure
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Prior concentration α+β = {formatNum(alpha + beta, 1)} (strength, not a literal sample size). Sequence length {seq.length}.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Prior mean" value={formatNum(priorSum.mean)} hint={`Var ${formatNum(priorSum.variance, 4)}`} />
          <MetricCard label="Posterior mean" value={formatNum(postSum.mean)} hint={`SD ${formatNum(postSum.sd, 3)}`} accent="#dc2626" />
          <MetricCard label="Observed data" value={`${dataK} / ${dataN}`} hint={`p̂ = ${formatNum(dataK / Math.max(dataN, 1))}`} />
          <MetricCard label="95% credible" value={`[${formatNum(interval.lo)}, ${formatNum(interval.hi)}]`} />
        </div>
      </BayesCard>
      <BayesCard title="Posterior samples of θ">
        <div className="flex flex-wrap gap-2">
          {[0, 200, 1000].map((count) => (
            <button key={count} type="button" className="bayes-btn bayes-btn-ghost" onClick={() => setDraws(count)}>
              {count === 0 ? 'Clear' : `Draw ${count} θ`}
            </button>
          ))}
        </div>
        {thetaDraws.length > 0 && (
          <HistogramChart
            bins={histogram(thetaDraws, 20, 0, 1)}
            mean={postSum.mean}
            xLabel="θ"
            ariaLabel="Histogram of posterior draws of theta"
          />
        )}
        {thetaDraws.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">These are draws of the parameter θ, not future observations.</p>
        )}
      </BayesCard>
    </div>
  )
}

