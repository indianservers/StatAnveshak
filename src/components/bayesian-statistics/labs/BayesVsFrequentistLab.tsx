import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  betaInterval,
  betaPdf,
  formatNum,
  formatPct,
  frequentistWaldInterval,
  linspace,
  summarizeBeta,
  updateBetaBinomial,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSlider, CheckList, CurveLegend, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart } from '../plots'

export function BayesVsFrequentistLab({ tab }: { tab: BayesTab }) {
  const [alpha, setAlpha] = useState(1)
  const [beta, setBeta] = useState(1)
  const [n, setN] = useState(20)
  const [k, setK] = useState(14)

  const post = updateBetaBinomial(alpha, beta, k, n)
  const bayes = betaInterval(post.alpha, post.beta, 0.95, 'equal-tailed')
  const freq = frequentistWaldInterval(k, n, 0.95)
  const summary = summarizeBeta(post.alpha, post.beta)
  const xs = useMemo(() => linspace(0.001, 0.999, 180), [])
  const postPts = useMemo(() => xs.map((x) => ({ x, y: betaPdf(x, post.alpha, post.beta) })), [xs, post.alpha, post.beta])

  const reset = () => {
    setAlpha(1)
    setBeta(1)
    setN(20)
    setK(14)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Same proportion, two readings">
          <p className="text-sm leading-6 text-slate-600">
            Both approaches can analyze 14 successes in 20 trials. They often produce similar numbers. They do not make
            the same claim. Neither is “always better.” The difference is what probability is allowed to talk about.
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="pb-2">Aspect</th>
                <th className="pb-2">Bayesian</th>
                <th className="pb-2">Frequentist</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr>
                <td>Probability</td>
                <td>Degree of belief, updated by data</td>
                <td>Long-run frequency of a procedure</td>
              </tr>
              <tr>
                <td>Parameter θ</td>
                <td>Random under the posterior</td>
                <td>Fixed unknown</td>
              </tr>
              <tr>
                <td>Interval</td>
                <td>Credible: mass on θ | data</td>
                <td>Confidence: coverage of the method</td>
              </tr>
              <tr>
                <td>Prior</td>
                <td>Required and inspectable</td>
                <td>Not part of the model</td>
              </tr>
            </tbody>
          </table>
        </BayesCard>
        <BayesCard title="A fair comparison">
          <CheckList
            items={[
              'A Uniform Beta(1,1) prior makes the posterior mean (x+1)/(n+2), not x/n.',
              'The Wald CI uses a Normal approximation and can misbehave near 0 or 1.',
              'Matching numbers do not make the interpretations interchangeable.',
              'Choose the interpretation you can defend, not a slogan.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['bayesian-vs-frequentist'].tryThis}</Insight>
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
              prompt: 'A 95% confidence interval means…',
              options: [
                'P(θ is in this interval | data) = 0.95',
                'the procedure covers the true θ in 95% of repeated samples',
                'the posterior mass is 95%',
                'the prior was Uniform',
              ],
              answer: 1,
              explanation: 'Coverage is a property of the method across hypothetical repeats, not of this one interval given the data.',
            },
            {
              prompt: 'A 95% credible interval means…',
              options: [
                '95% of future samples will land inside',
                '95% of the posterior mass for θ lies in the interval',
                'the p-value is 0.05',
                'the MLE is inside'],
              answer: 1,
              explanation: 'That statement uses the posterior. It requires a prior.',
            },
            {
              prompt: 'This lab’s stance is…',
              options: ['Bayes is always better', 'frequentist methods are obsolete', 'the two answer different questions', 'they are identical'],
              answer: 2,
              explanation: 'Same data can support both analyses. The claims are not the same.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Change the prior, keep the data">
        <p className="text-sm leading-6 text-slate-600">
          Keep 14/20 fixed. Move the prior from Beta(1,1) to Beta(20, 20). The credible interval moves; the Wald interval
          does not. That is a feature of the Bayesian analysis, not a bug in the CI.
        </p>
      </BayesCard>
    )
  }

  return (
    <BayesCard title="One proportion, two intervals" action={<ResetButton onClick={reset} />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.8fr)]">
        <div>
          <CurveLegend
            items={[
              { id: 'posterior', label: 'Bayesian posterior' },
            ]}
          />
          <DensityChart
            series={[{ id: 'post', label: 'Posterior', role: 'posterior', points: postPts }]}
            shade={{ lo: bayes.lo, hi: bayes.hi, color: '#93c5fd' }}
            markers={[
              { x: freq.phat, label: `p̂ ${formatNum(freq.phat)}`, color: '#0f172a' },
              { x: freq.lo, label: 'CI L', color: '#2563eb', dash: '5 4' },
              { x: freq.hi, label: 'CI U', color: '#2563eb', dash: '5 4' },
            ]}
            xLabel="θ or p"
            ariaLabel="Posterior with credible interval and frequentist CI markers"
          />
        </div>
        <div className="space-y-3">
          <BayesSlider label="Prior α" value={alpha} min={0.5} max={30} step={0.5} onChange={setAlpha} />
          <BayesSlider label="Prior β" value={beta} min={0.5} max={30} step={0.5} onChange={setBeta} />
          <BayesSlider label="Trials n" value={n} min={5} max={80} step={1} onChange={setN} />
          <BayesSlider label="Successes x" value={Math.min(k, n)} min={0} max={n} step={1} onChange={setK} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bayesian (this posterior)</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Given the Beta({formatNum(alpha, 1)}, {formatNum(beta, 1)}) prior and {k}/{n} data, 95% of the posterior for θ
            lies in [{formatNum(bayes.lo)}, {formatNum(bayes.hi)}]. Posterior mean {formatNum(summary.mean)}.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Frequentist (Wald CI)</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            p̂ = {formatNum(freq.phat)}. The interval [{formatNum(freq.lo)}, {formatNum(freq.hi)}] comes from a procedure
            that covers the true p in about {formatPct(0.95, 0)} of repeated samples. It is not P(p is inside | data).
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <MetricCard label="p̂ / MLE" value={formatNum(freq.phat)} />
        <MetricCard label="95% credible" value={`[${formatNum(bayes.lo)}, ${formatNum(bayes.hi)}]`} accent="#dc2626" />
        <MetricCard label="95% Wald CI" value={`[${formatNum(freq.lo)}, ${formatNum(freq.hi)}]`} accent="#2563eb" />
      </div>
    </BayesCard>
  )
}
