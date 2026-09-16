import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  formatNum,
  linspace,
  logNormalPdf,
  multiplyLogCurves,
  normalInterval,
  normalPdf,
  summarizeNormal,
  updateNormalNormal,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, MetricCard, QuizBlock, ResetButton } from '../shared'
import { BalanceBar, DensityChart } from '../plots'

export function NormalNormalLab({ tab }: { tab: BayesTab }) {
  const [mu0, setMu0] = useState(0)
  const [tau0, setTau0] = useState(2)
  const [xbar, setXbar] = useState(1.8)
  const [n, setN] = useState(10)
  const [sigma, setSigma] = useState(2)

  const post = updateNormalNormal(mu0, tau0, xbar, n, sigma)
  const priorSum = summarizeNormal(mu0, tau0)
  const postSum = summarizeNormal(post.mu, post.sd)
  const interval = normalInterval(post.mu, post.sd, 0.95, 'equal-tailed')
  const span = Math.max(8, Math.abs(mu0) + 4 * tau0, Math.abs(xbar) + 4 * (sigma / Math.sqrt(n)), Math.abs(post.mu) + 4 * post.sd)
  const xs = useMemo(() => linspace(-span, span, 200), [span])
  const priorPts = useMemo(() => xs.map((x) => ({ x, y: normalPdf(x, mu0, tau0) })), [xs, mu0, tau0])
  const likePts = useMemo(() => {
    const se = sigma / Math.sqrt(n)
    const raw = xs.map((x) => normalPdf(xbar, x, se))
    const peak = Math.max(...raw, 1e-12)
    const scale = Math.max(...priorPts.map((p) => p.y), 1e-6)
    return xs.map((x, i) => ({ x, y: (raw[i] / peak) * scale }))
  }, [xs, xbar, sigma, n, priorPts])
  const postPts = useMemo(
    () =>
      multiplyLogCurves(
        xs,
        (x) => logNormalPdf(x, mu0, tau0),
        (x) => logNormalPdf(xbar, x, sigma / Math.sqrt(n)),
      ),
    [xs, mu0, tau0, xbar, sigma, n],
  )

  const reset = () => {
    setMu0(0)
    setTau0(2)
    setXbar(1.8)
    setN(10)
    setSigma(2)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Precision-weighted mean">
          <p className="text-sm leading-6 text-slate-600">
            With known σ, a Normal prior for μ stays Normal. The posterior mean is a precision-weighted average of the
            prior mean μ₀ and the sample mean x̄. Precision is 1/variance.
          </p>
          <FormulaBlock tex={'\\mu_n=\\frac{\\lambda_0\\mu_0+\\lambda_n\\bar x}{\\lambda_0+\\lambda_n},\\quad \\lambda_0=1/\\tau_0^2,\\;\\lambda_n=n/\\sigma^2'} />
        </BayesCard>
        <BayesCard title="Who wins the tug-of-war?">
          <CheckList
            items={[
              'A tight prior (small τ₀) has large λ₀ and pulls hard toward μ₀.',
              'A large n or a small σ raises the data precision λ_n.',
              'The posterior variance is 1/(λ₀ + λ_n) — always smaller than either piece alone.',
            ]}
          />
          <Insight title="Try this">{BAYES_HOME_COPY['normal-normal'].tryThis}</Insight>
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
              prompt: 'The posterior mean is a weighted average of μ₀ and x̄. The weights are…',
              options: ['sample sizes', 'precisions (1/variance)', 'p-values', 'always 50–50'],
              answer: 1,
              explanation: 'λ₀ = 1/τ₀² for the prior and λ_n = n/σ² for the data.',
            },
            {
              prompt: 'This conjugate update assumes…',
              options: ['unknown σ', 'known σ', 'a Uniform prior only', 'binary data'],
              answer: 1,
              explanation: 'The Normal–Normal pair here is for a mean with known measurement SD.',
            },
            {
              prompt: 'If n grows while the prior stays fixed, the posterior mean…',
              options: ['stays at μ₀', 'moves toward x̄', 'becomes the prior median', 'is undefined'],
              answer: 1,
              explanation: 'Data precision grows with n, so the data get more weight.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="Read the weights" action={<ResetButton onClick={reset} />}>
        <BalanceBar prior={post.priorWeight} data={post.dataWeight} />
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Posterior mean {formatNum(post.mu)} = {formatNum(post.priorWeight)} × {formatNum(mu0)} + {formatNum(post.dataWeight)} × {formatNum(xbar)}.
        </p>
        <Insight title="Check">
          Shrink τ₀ to 0.4. The prior weight should rise and μ_n should slide toward {formatNum(mu0)}.
        </Insight>
      </BayesCard>
    )
  }

  return (
    <BayesCard title="Known-σ Normal–Normal update" action={<ResetButton onClick={reset} />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.75fr)]">
        <div>
          <CurveLegend
            items={[
              { id: 'prior', label: `Prior N(${formatNum(mu0, 1)}, ${formatNum(tau0, 1)}²)` },
              { id: 'likelihood', label: 'Likelihood of μ (scaled)' },
              { id: 'posterior', label: `Posterior N(${formatNum(post.mu)}, ${formatNum(post.sd)}²)` },
            ]}
          />
          <DensityChart
            series={[
              { id: 'prior', label: 'Prior', role: 'prior', points: priorPts },
              { id: 'like', label: 'Likelihood', role: 'likelihood', points: likePts },
              { id: 'post', label: 'Posterior', role: 'posterior', points: postPts },
            ]}
            xLabel="μ"
            ariaLabel="Normal prior, likelihood, and posterior for a mean"
          />
          <div className="mt-3">
            <BalanceBar prior={post.priorWeight} data={post.dataWeight} />
          </div>
        </div>
        <div className="space-y-3">
          <BayesSlider label="Prior mean μ₀" value={mu0} min={-6} max={6} step={0.1} onChange={setMu0} display={formatNum(mu0, 1)} />
          <BayesSlider label="Prior SD τ₀" value={tau0} min={0.2} max={6} step={0.1} onChange={setTau0} display={formatNum(tau0, 1)} />
          <BayesSlider label="Sample mean x̄" value={xbar} min={-6} max={6} step={0.1} onChange={setXbar} display={formatNum(xbar, 1)} />
          <BayesSlider label="Sample size n" value={n} min={1} max={80} step={1} onChange={setN} />
          <BayesSlider label="Known σ" value={sigma} min={0.4} max={6} step={0.1} onChange={setSigma} display={formatNum(sigma, 1)} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Prior mean" value={formatNum(priorSum.mean)} />
        <MetricCard label="Data mean" value={formatNum(xbar)} />
        <MetricCard label="Posterior mean" value={formatNum(postSum.mean)} accent="#dc2626" />
        <MetricCard label="95% credible" value={`[${formatNum(interval.lo)}, ${formatNum(interval.hi)}]`} />
      </div>
    </BayesCard>
  )
}
