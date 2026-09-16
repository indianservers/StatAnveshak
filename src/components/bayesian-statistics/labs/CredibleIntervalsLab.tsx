import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  CREDIBLE_LEVELS,
  betaInterval,
  betaPdf,
  formatNum,
  formatPct,
  linspace,
  type BayesTab,
  type IntervalKind,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSelect, BayesSlider, CheckList, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { DensityChart, IntervalReadout } from '../plots'

export function CredibleIntervalsLab({ tab }: { tab: BayesTab }) {
  const [alpha, setAlpha] = useState(2)
  const [beta, setBeta] = useState(10)
  const [mass, setMass] = useState<(typeof CREDIBLE_LEVELS)[number]>(0.95)
  const [kind, setKind] = useState<IntervalKind>('equal-tailed')
  const [lo, setLo] = useState(0.02)
  const [hi, setHi] = useState(0.4)

  const auto = betaInterval(alpha, beta, mass, kind)
  const other = betaInterval(alpha, beta, mass, kind === 'hpd' ? 'equal-tailed' : 'hpd')
  const xs = useMemo(() => linspace(0.001, 0.999, 200), [])
  const postPts = useMemo(() => xs.map((x) => ({ x, y: betaPdf(x, alpha, beta) })), [xs, alpha, beta])

  const reset = () => {
    setAlpha(2)
    setBeta(10)
    setMass(0.95)
    setKind('equal-tailed')
    setLo(0.02)
    setHi(0.4)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="An interval of posterior mass">
          <p className="text-sm leading-6 text-slate-600">
            A 95% credible interval is any interval that holds 95% of the posterior. The equal-tailed version leaves
            2.5% in each tail. The HPD is the shortest interval of that mass — useful when the posterior is skewed.
          </p>
          <FormulaBlock tex={'P(L\\le\\theta\\le U\\mid D)=1-\\alpha'} />
        </BayesCard>
        <BayesCard title="Not a confidence interval">
          <CheckList
            items={[
              'A credible interval is a probability statement about θ given the data and prior.',
              'A frequentist CI is a statement about a procedure’s long-run coverage.',
              'Those can look similar numerically and still mean different things.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['credible-intervals'].tryThis}</Insight>
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
              prompt: 'A 95% Bayesian credible interval is…',
              options: [
                'an interval that covers the true θ in 95% of repeated experiments',
                'an interval containing 95% of the posterior mass',
                'the same as a p-value',
                'always the HPD',
              ],
              answer: 1,
              explanation: 'It is a statement about θ under the posterior, not about the sampling procedure.',
            },
            {
              prompt: 'On a skewed posterior the HPD…',
              options: ['is always identical to the equal-tailed interval', 'is the shortest interval of the given mass', 'ignores the posterior', 'must be two-sided around 0.5'],
              answer: 1,
              explanation: 'HPD minimizes width among intervals of that posterior probability.',
            },
            {
              prompt: 'Dragging the endpoints changes…',
              options: ['the prior', 'which slice of posterior mass you are highlighting', 'the likelihood family', 'n'],
              answer: 1,
              explanation: 'The shaded region is the interval you chose. The automatic 50–99% buttons pick standard mass.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Compare two 90% intervals">
        <p className="text-sm leading-6 text-slate-600">
          For Beta(2, 10), the equal-tailed 90% interval and the HPD both contain 90% posterior mass. The HPD should be
          shorter. Widths: equal-tailed {formatNum(other.kind === 'equal-tailed' ? other.width : auto.width, 3)}, HPD{' '}
          {formatNum(other.kind === 'hpd' ? other.width : auto.width, 3)}.
        </p>
      </BayesCard>
    )
  }

  return (
    <BayesCard title="Posterior interval" action={<ResetButton onClick={reset} />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.75fr)]">
        <div>
          <DensityChart
            series={[{ id: 'post', label: 'Posterior', role: 'posterior', points: postPts }]}
            shade={{ lo: Math.min(lo, hi), hi: Math.max(lo, hi), color: '#93c5fd' }}
            markers={[
              { x: auto.lo, label: 'auto L', color: '#2563eb' },
              { x: auto.hi, label: 'auto U', color: '#2563eb' },
            ]}
            xLabel="θ"
            ariaLabel="Posterior with a shaded credible interval"
          />
          <IntervalReadout interval={auto} />
        </div>
        <div className="space-y-3">
          <BayesSlider label="Posterior α" value={alpha} min={0.6} max={30} step={0.1} onChange={setAlpha} display={formatNum(alpha, 1)} />
          <BayesSlider label="Posterior β" value={beta} min={0.6} max={30} step={0.1} onChange={setBeta} display={formatNum(beta, 1)} />
          <BayesSelect
            label="Mass"
            value={String(mass)}
            onChange={(value) => setMass(Number(value) as (typeof CREDIBLE_LEVELS)[number])}
            options={CREDIBLE_LEVELS.map((level) => ({ value: String(level), label: formatPct(level, 0) }))}
          />
          <BayesSelect
            label="Rule"
            value={kind}
            onChange={(value) => setKind(value as IntervalKind)}
            options={[
              { value: 'equal-tailed', label: 'Equal-tailed' },
              { value: 'hpd', label: 'Highest posterior density' },
            ]}
          />
          <button type="button" className="bayes-btn w-full" onClick={() => { setLo(auto.lo); setHi(auto.hi) }}>
            Snap handles to {formatPct(mass, 0)} {kind === 'hpd' ? 'HPD' : 'equal-tailed'}
          </button>
          <BayesSlider label="Left handle" value={lo} min={0} max={0.98} step={0.005} onChange={setLo} display={formatNum(lo)} />
          <BayesSlider label="Right handle" value={hi} min={0.02} max={1} step={0.005} onChange={setHi} display={formatNum(hi)} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Automatic width" value={formatNum(auto.width)} hint={auto.kind} />
        <MetricCard label="Other rule width" value={formatNum(other.width)} hint={other.kind} />
      </div>
    </BayesCard>
  )
}
