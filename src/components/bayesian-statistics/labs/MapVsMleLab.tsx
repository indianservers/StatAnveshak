import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  binomialMap,
  binomialMle,
  formatNum,
  linspace,
  logBetaPdf,
  logBinomialLikelihood,
  multiplyLogCurves,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart } from '../plots'

export function MapVsMleLab({ tab }: { tab: BayesTab }) {
  const [alpha, setAlpha] = useState(8)
  const [beta, setBeta] = useState(2)
  const [n, setN] = useState(10)
  const [k, setK] = useState(3)

  const mle = binomialMle(k, n)
  const map = binomialMap(alpha, beta, k, n)
  const xs = useMemo(() => linspace(0.001, 0.999, 200), [])
  const likePts = useMemo(() => {
    const raw = xs.map((x) => Math.exp(logBinomialLikelihood(x, n, k)))
    const z = Math.max(...raw, 1e-12)
    return xs.map((x, i) => ({ x, y: raw[i] / z }))
  }, [xs, n, k])
  const postPts = useMemo(
    () => multiplyLogCurves(xs, (x) => logBetaPdf(x, alpha, beta), (x) => logBinomialLikelihood(x, n, k)),
    [xs, alpha, beta, n, k],
  )
  const gap = Number.isFinite(map) ? Math.abs(map - mle) : Number.NaN

  const reset = () => {
    setAlpha(8)
    setBeta(2)
    setN(10)
    setK(3)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Two point summaries">
          <p className="text-sm leading-6 text-slate-600">
            The MLE maximizes the likelihood alone. The MAP maximizes the posterior — likelihood times prior. For a
            Beta(α, β) prior the interior MAP is (α + x − 1)/(α + β + n − 2), and only when that posterior is unimodal
            inside (0, 1).
          </p>
          <FormulaBlock tex={'\\hat\\theta_{\\mathrm{MLE}}=x/n'} />
          <FormulaBlock tex={'\\hat\\theta_{\\mathrm{MAP}}=(\\alpha+x-1)/(\\alpha+\\beta+n-2)\\quad(\\alpha+x>1,\\;\\beta+n-x>1)'} />
        </BayesCard>
        <BayesCard title="When they agree">
          <CheckList
            items={[
              'A weak prior or a large n pulls MAP toward the MLE.',
              'A strong prior and little data keep them apart.',
              'MAP is not the posterior mean. On a skewed Beta they differ.',
              'Beta(1,1) is flat: every interior point is a mode, so we do not report a unique MAP.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['map-vs-mle'].tryThis}</Insight>
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
              prompt: 'MAP uses…',
              options: ['the likelihood only', 'the prior only', 'the posterior (likelihood × prior)', 'a p-value'],
              answer: 2,
              explanation: 'MAP is the mode of the posterior.',
            },
            {
              prompt: 'For Beta(1,1) and no interior peak, the unique MAP is…',
              options: ['always 0.5', 'the MLE', 'not defined as a single interior point', '1'],
              answer: 2,
              explanation: 'A flat posterior has no unique mode. The formula (α+x−1)/(α+β+n−2) is only for the interior case.',
            },
            {
              prompt: 'Lots of data and a weak prior make MAP…',
              options: ['ignore the data', 'approach the MLE', 'equal the prior mean forever', 'become the HPD'],
              answer: 1,
              explanation: 'The likelihood dominates, so the posterior mode tracks the MLE.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Two settings">
        <p className="text-sm leading-6 text-slate-600">
          Strong prior, little data: keep α = 8, β = 2, n = 10, k = 3. Weak prior, lots of data: set α = β = 1.2, n = 80,
          k = 24. Watch the gap {Number.isFinite(gap) ? formatNum(gap) : '—'} shrink.
        </p>
      </BayesCard>
    )
  }

  return (
    <BayesCard title="Markers on the likelihood and posterior" action={<ResetButton onClick={reset} />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.75fr)]">
        <div>
          <CurveLegend
            items={[
              { id: 'likelihood', label: 'Likelihood (scaled)' },
              { id: 'posterior', label: 'Posterior' },
            ]}
          />
          <DensityChart
            series={[
              { id: 'like', label: 'Likelihood', role: 'likelihood', points: likePts },
              { id: 'post', label: 'Posterior', role: 'posterior', points: postPts },
            ]}
            markers={[
              { x: mle, label: `MLE ${formatNum(mle)}`, color: '#2563eb', dash: '5 4' },
              ...(Number.isFinite(map) ? [{ x: map, label: `MAP ${formatNum(map)}`, color: '#dc2626' }] : []),
            ]}
            xLabel="θ"
            ariaLabel="Likelihood and posterior with MLE and MAP markers"
          />
        </div>
        <div className="space-y-3">
          <BayesSlider label="Prior α" value={alpha} min={0.5} max={30} step={0.1} onChange={setAlpha} display={formatNum(alpha, 1)} />
          <BayesSlider label="Prior β" value={beta} min={0.5} max={30} step={0.1} onChange={setBeta} display={formatNum(beta, 1)} />
          <BayesSlider label="Trials n" value={n} min={1} max={120} step={1} onChange={setN} />
          <BayesSlider label="Successes x" value={Math.min(k, n)} min={0} max={n} step={1} onChange={setK} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricCard label="MLE" value={formatNum(mle)} hint="x / n" accent="#2563eb" />
        <MetricCard label="MAP" value={Number.isFinite(map) ? formatNum(map) : 'not unique'} hint="Posterior mode" accent="#dc2626" />
        <MetricCard label="|MAP − MLE|" value={Number.isFinite(gap) ? formatNum(gap) : '—'} />
      </div>
    </BayesCard>
  )
}
