import { useMemo, useState } from 'react'
import {
  BAYES_HOME_COPY,
  formatNum,
  gammaPdfRate,
  linspace,
  logBetaPdf,
  logBinomialLikelihood,
  logGammaPdfRate,
  logNormalPdf,
  logPoissonLikelihood,
  multiplyLogCurves,
  normalPdf,
  updateBetaBinomial,
  updateGammaPoisson,
  updateNormalNormal,
  type BayesTab,
} from '../../../lib/bayesianStatistics'
import { BayesCard, BayesSelect, BayesSlider, CheckList, CurveLegend, FormulaBlock, Insight, QuizBlock, ResetButton } from '../shared'
import { DensityChart } from '../plots'

const PAIRS = [
  { id: 'beta-binomial', label: 'Binomial + Beta', note: 'Rate or proportion on (0, 1).' },
  { id: 'gamma-poisson', label: 'Poisson + Gamma (shape–rate)', note: 'Counts with an exposure.' },
  { id: 'normal-normal', label: 'Normal + Normal (known σ)', note: 'A mean with known noise.' },
] as const

export function ConjugatePriorsLab({ tab }: { tab: BayesTab }) {
  const [pair, setPair] = useState<(typeof PAIRS)[number]['id']>('beta-binomial')
  const [a, setA] = useState(2)
  const [b, setB] = useState(2)
  const [n, setN] = useState(16)
  const [k, setK] = useState(11)

  const xs01 = useMemo(() => linspace(0.001, 0.999, 160), [])
  const xsPos = useMemo(() => linspace(0.02, 10, 160), [])
  const xsReal = useMemo(() => linspace(-6, 6, 160), [])

  const chart = useMemo(() => {
    if (pair === 'beta-binomial') {
      const post = updateBetaBinomial(a, b, k, n)
      return {
        formula: `\\theta\\mid y\\sim\\mathrm{Beta}(${formatNum(post.alpha, 1)}, ${formatNum(post.beta, 1)})`,
        xLabel: 'θ',
        series: [
          { id: 'prior', label: 'Prior', role: 'prior' as const, points: xs01.map((x) => ({ x, y: Math.exp(logBetaPdf(x, a, b)) })) },
          { id: 'post', label: 'Posterior', role: 'posterior' as const, points: multiplyLogCurves(xs01, (x) => logBetaPdf(x, a, b), (x) => logBinomialLikelihood(x, n, k)) },
        ],
      }
    }
    if (pair === 'gamma-poisson') {
      const post = updateGammaPoisson(a, b, k, n / 8)
      return {
        formula: `\\lambda\\mid x\\sim\\mathrm{Gamma}(${formatNum(post.shape, 1)}, ${formatNum(post.rate, 1)})`,
        xLabel: 'λ',
        series: [
          { id: 'prior', label: 'Prior', role: 'prior' as const, points: xsPos.map((x) => ({ x, y: gammaPdfRate(x, a, b) })) },
          {
            id: 'post',
            label: 'Posterior',
            role: 'posterior' as const,
            points: multiplyLogCurves(xsPos, (x) => logGammaPdfRate(x, a, b), (x) => logPoissonLikelihood(x, k, n / 8)),
          },
        ],
      }
    }
    const post = updateNormalNormal(0, a, k / 4, n, b)
    return {
      formula: `\\mu\\mid x\\sim\\mathrm{N}(${formatNum(post.mu)}, ${formatNum(post.sd)}^2)`,
      xLabel: 'μ',
      series: [
        { id: 'prior', label: 'Prior', role: 'prior' as const, points: xsReal.map((x) => ({ x, y: normalPdf(x, 0, a) })) },
        {
          id: 'post',
          label: 'Posterior',
          role: 'posterior' as const,
          points: multiplyLogCurves(xsReal, (x) => logNormalPdf(x, 0, a), (x) => logNormalPdf(k / 4, x, b / Math.sqrt(n))),
        },
      ],
    }
  }, [pair, a, b, n, k, xs01, xsPos, xsReal])

  const reset = () => {
    setPair('beta-binomial')
    setA(2)
    setB(2)
    setN(16)
    setK(11)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <BayesCard title="Conjugacy is convenience">
          <p className="text-sm leading-6 text-slate-600">
            A prior is conjugate to a likelihood when the posterior stays in the same family. That gives a closed-form
            update. It is not the definition of Bayesian inference — Bayes still applies when the integral has no tidy
            answer. Then we use numerical integration or MCMC.
          </p>
          <FormulaBlock tex={'p(\\theta\\mid y)\\propto p(y\\mid\\theta)\\,p(\\theta)'} />
        </BayesCard>
        <BayesCard title="Common pairs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="pb-2">Likelihood</th>
                <th className="pb-2">Conjugate prior</th>
                <th className="pb-2">Posterior family</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr><td>Binomial</td><td>Beta</td><td>Beta</td></tr>
              <tr><td>Poisson</td><td>Gamma (shape–rate)</td><td>Gamma</td></tr>
              <tr><td>Normal, known σ</td><td>Normal</td><td>Normal</td></tr>
              <tr><td>Normal, unknown σ²</td><td>Normal–Inverse-Gamma</td><td>Normal–Inverse-Gamma</td></tr>
              <tr><td>Exponential</td><td>Gamma</td><td>Gamma</td></tr>
            </tbody>
          </table>
          <Insight title="Try this">{BAYES_HOME_COPY['conjugate-priors'].tryThis}</Insight>
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
              prompt: 'Conjugacy means…',
              options: ['the prior equals the likelihood', 'the posterior stays in the prior’s family', 'MCMC is required', 'the prior must be Uniform'],
              answer: 1,
              explanation: 'The update stays closed-form in that family. Bayes itself does not require conjugacy.',
            },
            {
              prompt: 'If the prior is not conjugate…',
              options: ['Bayes no longer applies', 'you can still compute or sample the posterior', 'the likelihood is invalid', 'the MLE disappears'],
              answer: 1,
              explanation: 'Use quadrature, Laplace, or MCMC. The product prior × likelihood is still the unnormalized posterior.',
            },
            {
              prompt: 'Gamma–Poisson in this studio uses…',
              options: ['shape–scale only', 'shape–rate, mean α/β', 'a Beta prior', 'unknown exposure'],
              answer: 1,
              explanation: 'Rate β, mean α/β. Scale is 1/β.',
            },
          ]}
        />
      </BayesCard>
    )
  }

  if (tab === 'practice') {
    return (
      <BayesCard title="When conjugacy stops">
        <CheckList
          items={[
            'A logistic regression prior on coefficients is typically not conjugate.',
            'A mixture of two Betas is a valid prior; the posterior is no longer a single Beta.',
            'MCMC does not change the target. It samples the same posterior you would integrate if you could.',
          ]}
        />
        <p className="mt-3 text-sm text-slate-500">The MCMC lab walks a Metropolis–Hastings chain on a posterior without using conjugacy.</p>
      </BayesCard>
    )
  }

  return (
    <BayesCard title="Conjugate pair workspace" action={<ResetButton onClick={reset} />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.8fr)]">
        <div>
          <CurveLegend items={[{ id: 'prior', label: 'Prior' }, { id: 'posterior', label: 'Posterior' }]} />
          <DensityChart series={chart.series} xLabel={chart.xLabel} ariaLabel="Conjugate prior and posterior" />
          <FormulaBlock tex={chart.formula} />
        </div>
        <div className="space-y-3">
          <BayesSelect
            label="Pair"
            value={pair}
            onChange={(value) => setPair(value as (typeof PAIRS)[number]['id'])}
            options={PAIRS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <p className="text-sm text-slate-500">{PAIRS.find((item) => item.id === pair)?.note}</p>
          <BayesSlider label={pair === 'normal-normal' ? 'Prior SD' : 'Prior first parameter'} value={a} min={0.5} max={8} step={0.1} onChange={setA} display={formatNum(a, 1)} />
          <BayesSlider label={pair === 'normal-normal' ? 'Known σ' : 'Prior second parameter'} value={b} min={0.4} max={8} step={0.1} onChange={setB} display={formatNum(b, 1)} />
          <BayesSlider label={pair === 'gamma-poisson' ? 'Exposure scale' : 'Sample size'} value={n} min={2} max={40} step={1} onChange={setN} />
          <BayesSlider label={pair === 'normal-normal' ? 'Data location (×4)' : 'Count / successes'} value={k} min={0} max={30} step={1} onChange={setK} />
        </div>
      </div>
    </BayesCard>
  )
}
