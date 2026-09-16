import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  BETA_PRESETS,
  betaMean,
  formatNum,
  linspace,
  logBetaPdf,
  logBinomialLikelihood,
  multiplyLogCurves,
  updateBetaBinomial,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSelect, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart } from '../plots'

const PRESET_OPTIONS = Object.entries(BETA_PRESETS).map(([value, item]) => ({ value, label: item.label }))

export function FoundationsLab({ tab }: { tab: BayesTab }) {
  const [preset, setPreset] = useState<keyof typeof BETA_PRESETS>('uniform')
  const [alpha, setAlpha] = useState(1)
  const [beta, setBeta] = useState(1)
  const [flips, setFlips] = useState(20)
  const [heads, setHeads] = useState(14)
  const [prev, setPrev] = useState(0.01)
  const [sens, setSens] = useState(0.95)
  const [spec, setSpec] = useState(0.9)

  const applyPreset = (id: keyof typeof BETA_PRESETS) => {
    setPreset(id)
    setAlpha(BETA_PRESETS[id].alpha)
    setBeta(BETA_PRESETS[id].beta)
  }

  const safeHeads = Math.min(heads, flips)
  const post = updateBetaBinomial(alpha, beta, safeHeads, flips)
  const xs = useMemo(() => linspace(0.001, 0.999, 180), [])
  const priorPts = useMemo(() => xs.map((x) => ({ x, y: Math.exp(logBetaPdf(x, alpha, beta)) })), [xs, alpha, beta])
  const likePts = useMemo(() => {
    const raw = xs.map((x) => Math.exp(logBinomialLikelihood(x, flips, safeHeads)))
    const peak = Math.max(...raw, 1e-12)
    return xs.map((x, i) => ({ x, y: (raw[i] / peak) * Math.max(...priorPts.map((p) => p.y), 1e-6) }))
  }, [xs, flips, safeHeads, priorPts])
  const postPts = useMemo(
    () => multiplyLogCurves(xs, (x) => logBetaPdf(x, alpha, beta), (x) => logBinomialLikelihood(x, flips, safeHeads)),
    [xs, alpha, beta, flips, safeHeads],
  )
  const falsePos = 1 - spec
  const pData = sens * prev + falsePos * (1 - prev)
  const pDisease = (sens * prev) / pData

  const reset = () => {
    applyPreset('uniform')
    setFlips(20)
    setHeads(14)
    setPrev(0.01)
    setSens(0.95)
    setSpec(0.9)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Bayes’ theorem">
          <p className="text-sm leading-6 text-slate-600">
            A prior is your belief about a parameter before the data. The likelihood is how plausible the data are for
            each parameter value. The posterior is the updated belief: posterior ∝ likelihood × prior.
          </p>
          <FormulaBlock tex={'P(\\theta\\mid D)=\\frac{P(D\\mid\\theta)\\,P(\\theta)}{P(D)}'} label="Bayes theorem" />
        </BayesCard>
        <BayesCard title="Three named pieces">
          <CheckList
            items={[
              'Prior P(θ): belief before seeing D. Weak priors are wide; strong priors are concentrated.',
              'Likelihood P(D | θ): how well each θ predicts the observed data. It is not a density over θ.',
              'Posterior P(θ | D): the reweighted belief. The evidence P(D) only normalizes.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['bayesian-foundations'].tryThis}</Insight>
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
              prompt: 'The posterior is proportional to…',
              options: ['the prior alone', 'the likelihood alone', 'likelihood × prior', '1 − the p-value'],
              answer: 2,
              explanation: 'Bayes’ theorem says P(θ | D) ∝ P(D | θ) P(θ). The evidence P(D) is the normalizing constant.',
            },
            {
              prompt: 'A strong prior that conflicts with the data will…',
              options: ['be ignored immediately', 'pull the posterior toward the prior', 'make the likelihood invalid', 'turn the posterior into the MLE'],
              answer: 1,
              explanation: 'The posterior is a compromise. A concentrated prior keeps more pull until more data arrive.',
            },
            {
              prompt: 'The likelihood P(D | θ), as a function of θ, is…',
              options: ['already a probability distribution over θ', 'how probable the observed data are for each θ', 'the same as the posterior', 'always Beta'],
              answer: 1,
              explanation: 'It is a function of θ, not automatically a density on θ. We scale it on the plot only for comparison.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Medical test (event form of Bayes)" action={<ResetButton onClick={reset} />}>
          <p className="text-sm leading-6 text-slate-500">
            A test with high sensitivity is not a diagnosis. Prevalence still matters. This is Bayes for events, not a
            parameter posterior.
          </p>
          <div className="mt-3 space-y-3">
            <BayesSlider label="Prevalence P(disease)" value={prev} min={0.001} max={0.3} step={0.001} onChange={setPrev} display={formatNum(prev, 3)} />
            <BayesSlider label="Sensitivity P(+ | disease)" value={sens} min={0.5} max={0.999} step={0.001} onChange={setSens} display={formatNum(sens, 3)} />
            <BayesSlider label="Specificity P(− | no disease)" value={spec} min={0.5} max={0.999} step={0.001} onChange={setSpec} display={formatNum(spec, 3)} />
          </div>
        </BayesCard>
        <BayesCard title="Updated probability">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="P(disease | +)" value={formatNum(pDisease, 4)} hint="Posterior probability" accent="#059669" />
            <MetricCard label="P(+)" value={formatNum(pData, 4)} hint="Evidence" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Even with sensitivity {formatNum(sens, 2)} and specificity {formatNum(spec, 2)}, a rare disease (prevalence{' '}
            {formatNum(prev, 3)}) keeps the posterior well below 1.
          </p>
        </BayesCard>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <BayesCard title="Interactive example: a coin’s bias" action={<ResetButton onClick={reset} />}>
        <p className="text-sm leading-6 text-slate-500">
          Prior, likelihood, and posterior are linked. Change the prior strength or the data. The red posterior is the
          normalized product of the dashed prior and the dotted likelihood.
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
          <div>
            <CurveLegend
              items={[
                { id: 'prior', label: `Prior Beta(${formatNum(alpha, 1)}, ${formatNum(beta, 1)})` },
                { id: 'likelihood', label: `Likelihood Binomial(${flips}, ${safeHeads})` },
                { id: 'posterior', label: `Posterior Beta(${formatNum(post.alpha, 1)}, ${formatNum(post.beta, 1)})` },
              ]}
            />
            <DensityChart
              series={[
                { id: 'prior', label: 'Prior', role: 'prior', points: priorPts },
                { id: 'like', label: 'Likelihood (scaled)', role: 'likelihood', points: likePts },
                { id: 'post', label: 'Posterior', role: 'posterior', points: postPts },
              ]}
              xLabel="Probability of heads (θ)"
              ariaLabel="Prior, scaled likelihood, and posterior for a coin bias"
            />
          </div>
          <div className="space-y-3">
            <BayesSelect
              label="Prior preset"
              value={preset}
              onChange={(value) => applyPreset(value as keyof typeof BETA_PRESETS)}
              options={PRESET_OPTIONS}
            />
            <BayesSlider label="Prior α" value={alpha} min={0.5} max={30} step={0.5} onChange={setAlpha} />
            <BayesSlider label="Prior β" value={beta} min={0.5} max={30} step={0.5} onChange={setBeta} />
            <BayesSlider label="Number of flips" value={flips} min={1} max={80} step={1} onChange={setFlips} />
            <BayesSlider label="Number of heads" value={safeHeads} min={0} max={flips} step={1} onChange={setHeads} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Prior mean" value={formatNum(betaMean(alpha, beta))} hint={`Beta(${formatNum(alpha, 1)}, ${formatNum(beta, 1)})`} />
          <MetricCard label="Data" value={`${safeHeads} / ${flips}`} hint={`${formatNum((safeHeads / flips) * 100, 1)}% heads`} />
          <MetricCard label="Posterior mean" value={formatNum(betaMean(post.alpha, post.beta))} hint={`Beta(${formatNum(post.alpha, 1)}, ${formatNum(post.beta, 1)})`} accent="#dc2626" />
        </div>
      </BayesCard>
    </div>
  )
}
