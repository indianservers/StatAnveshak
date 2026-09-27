import { useState } from 'react'
import type { StudioLab } from '../../../lib/statisticsStudios'
import { chiInv, normalInv, tInv } from '../../../lib/remainingLabMath'
import { Card, LineChart, Metric, Slider, Theory } from './shared'
import { fmt } from './format'

const theory: Record<string, { intuition: string; formula: string; assumptions: string; caution: string }> = {
  'point-estimation': { intuition: 'A statistic summarizes a sample to guess a population parameter. Repeating the sample changes the guess.', formula: 'x̄ = Σxᵢ/n; SE(x̄) ≈ s/√n', assumptions: 'Use a representative independent sample. The mean estimates a population mean; a sample rate estimates a population proportion.', caution: 'A point estimate alone hides sampling uncertainty and possible selection bias.' },
  'estimator-quality': { intuition: 'A good estimator tends to land near the truth and varies little across repeated samples.', formula: 'MSE(θ̂) = Var(θ̂) + Bias(θ̂)²', assumptions: 'Compare estimators under a specified data-generating model and sample size.', caution: 'A slightly biased estimator can have lower MSE. Bias, variance, and consistency are distinct properties.' },
  'confidence-interval-mean': { intuition: 'An interval places uncertainty around the observed sample mean.', formula: 'x̄ ± t₁₋α/₂,n₋₁ × s/√n', assumptions: 'Independent sample; the t procedure works best with approximately normal data or a sufficiently large sample.', caution: '95% confidence describes long-run coverage of the procedure, not a 95% probability for this fixed interval.' },
  'confidence-interval-proportion': { intuition: 'The Wilson interval keeps a rate inside zero and one and behaves better than a plain Wald interval near boundaries.', formula: 'Wilson center = (p̂+z²/2n)/(1+z²/n)', assumptions: 'Independent binary trials with a reasonably representative sample.', caution: 'For very small samples or dependence, even Wilson may need a design-specific method.' },
  'confidence-interval-difference-of-means': { intuition: 'Subtract group means, then account for uncertainty in both independent samples.', formula: '(x̄₁−x̄₂) ± t*√(s₁²/n₁+s₂²/n₂)', assumptions: 'Two independent groups; Welch degrees of freedom allow unequal variances.', caution: 'An interval spanning zero is compatible with no mean difference; it does not prove equality.' },
  'confidence-interval-difference-of-proportions': { intuition: 'A risk difference quantifies how far apart two event rates are.', formula: '(p̂₁−p̂₂) ± z√[p̂₁(1−p̂₁)/n₁+p̂₂(1−p̂₂)/n₂]', assumptions: 'Independent binary outcomes in two groups with enough successes and failures for the normal approximation.', caution: 'The simple Wald interval can misbehave for small samples or rates near zero and one.' },
  'confidence-interval-variance': { intuition: 'Spread is positive, so its confidence interval is asymmetric.', formula: '[(n−1)s²/χ²₁₋α/₂, (n−1)s²/χ²α/₂]', assumptions: 'Independent observations from an approximately normal population.', caution: 'Variance intervals are especially sensitive to departures from normality.' },
  'margin-of-error': { intuition: 'Margin of error is the distance from an estimate to either endpoint of a symmetric interval.', formula: 'MOE = critical value × standard error', assumptions: 'A valid standard error and critical value for the sampling design.', caution: 'A narrow margin of error does not correct nonresponse, confounding, or measurement error.' },
  'sample-size-determination': { intuition: 'Planning runs the margin-of-error formula backward to find the required sample size.', formula: 'n ≥ (z × σ / target MOE)²', assumptions: 'Specify a plausible standard deviation and desired confidence level before collecting data.', caution: 'Round upward and account for dropout or complex sampling separately.' },
}

function IntervalGraphic({ estimate, lower, upper, truth, label }: { estimate: number; lower: number; upper: number; truth?: number; label: string }) {
  const lo = Math.min(lower, truth ?? lower) - Math.max(1, upper - lower) * 0.25
  const hi = Math.max(upper, truth ?? upper) + Math.max(1, upper - lower) * 0.25
  const x = (value: number) => 50 + (value - lo) / (hi - lo) * 520
  return <svg role="img" aria-label={`${label}: estimate ${fmt(estimate, 3)}, interval ${fmt(lower, 3)} to ${fmt(upper, 3)}${truth === undefined ? '' : `, reference ${fmt(truth, 3)}`}`} viewBox="0 0 620 155" className="w-full">
    <line x1="50" x2="570" y1="100" y2="100" stroke="#cbd5e1" />
    {truth !== undefined && <g><line x1={x(truth)} x2={x(truth)} y1="22" y2="115" stroke="#e11d48" strokeDasharray="5 4" /><text x={x(truth) + 4} y="28" fontSize="11" fill="#be123c">reference</text></g>}
    <line x1={x(lower)} x2={x(upper)} y1="75" y2="75" stroke="#0d9488" strokeWidth="8" strokeLinecap="round" /><line x1={x(lower)} x2={x(lower)} y1="63" y2="87" stroke="#0f766e" strokeWidth="2" /><line x1={x(upper)} x2={x(upper)} y1="63" y2="87" stroke="#0f766e" strokeWidth="2" /><circle cx={x(estimate)} cy="75" r="8" fill="#1d4ed8" />
    <text x={x(lower)} y="130" textAnchor="middle" fontSize="11" fill="#475569">{fmt(lower, 2)}</text><text x={x(upper)} y="130" textAnchor="middle" fontSize="11" fill="#475569">{fmt(upper, 2)}</text>
  </svg>
}

export function EstimationLab({ lab }: { lab: StudioLab }) {
  const [n, setN] = useState(30)
  const [estimate, setEstimate] = useState(52)
  const [sd, setSd] = useState(12)
  const [confidence, setConfidence] = useState(95)
  const [target, setTarget] = useState(4)
  const [rate, setRate] = useState(0.55)
  const [bias, setBias] = useState(2)
  const [other, setOther] = useState(48)
  const alpha = 1 - confidence / 100
  const z = normalInv(1 - alpha / 2)
  const t = tInv(1 - alpha / 2, n - 1)
  const se = sd / Math.sqrt(n)
  const slug = lab.slug
  let center = estimate
  let low = estimate - t * se
  let high = estimate + t * se
  let reference: number | undefined = 50
  let resultLabel = 'Sample mean'
  let secondaryLabel = 'Standard error'
  let secondary = fmt(se)
  if (slug === 'confidence-interval-proportion') {
    const denominator = 1 + z * z / n
    center = (rate + z * z / (2 * n)) / denominator
    const half = z / denominator * Math.sqrt(rate * (1 - rate) / n + z * z / (4 * n * n))
    low = center - half; high = center + half; reference = 0.5; resultLabel = 'Wilson center'; secondaryLabel = 'Observed rate'; secondary = fmt(rate, 2)
  } else if (slug === 'confidence-interval-difference-of-means') {
    center = estimate - other
    const combinedSe = sd * Math.sqrt(2 / n)
    low = center - tInv(1 - alpha / 2, 2 * n - 2) * combinedSe
    high = center + tInv(1 - alpha / 2, 2 * n - 2) * combinedSe
    reference = 0; resultLabel = 'Mean difference'; secondaryLabel = 'Welch SE'; secondary = fmt(combinedSe)
  } else if (slug === 'confidence-interval-difference-of-proportions') {
    const rate2 = Math.min(0.95, Math.max(0.05, other / 100))
    center = rate - rate2
    const combinedSe = Math.sqrt((rate * (1 - rate) + rate2 * (1 - rate2)) / n)
    low = center - z * combinedSe; high = center + z * combinedSe
    reference = 0; resultLabel = 'Risk difference'; secondaryLabel = 'Standard error'; secondary = fmt(combinedSe, 3)
  } else if (slug === 'confidence-interval-variance') {
    center = sd ** 2
    low = (n - 1) * center / chiInv(1 - alpha / 2, n - 1)
    high = (n - 1) * center / chiInv(alpha / 2, n - 1)
    reference = undefined; resultLabel = 'Sample variance'; secondaryLabel = 'Degrees of freedom'; secondary = String(n - 1)
  } else if (slug === 'sample-size-determination') {
    center = Math.ceil((z * sd / target) ** 2)
    low = center - 1; high = center + 1; reference = undefined; resultLabel = 'Required n'; secondaryLabel = 'Target MOE'; secondary = fmt(target, 1)
  } else if (slug === 'estimator-quality') {
    center = bias
    low = bias - se; high = bias + se; reference = 0; resultLabel = 'Estimator bias'; secondaryLabel = 'MSE'; secondary = fmt(se ** 2 + bias ** 2)
  } else if (slug === 'margin-of-error') {
    secondaryLabel = 'Margin of error'; secondary = fmt(t * se)
  }
  const isQuality = slug === 'estimator-quality'
  const isProportion = slug.includes('proportion')
  const isDifference = slug.includes('difference')
  const isVariance = slug.includes('variance')
  const isPlanning = slug === 'sample-size-determination'
  const theoryContent = theory[slug]
  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]">
      <Card title={isPlanning ? 'Precision plan' : isQuality ? 'Bias and variation' : 'Estimate and uncertainty'}>
        <p className="mb-3 text-sm text-slate-500">{isPlanning ? 'Smaller target error demands more observations. Change precision and confidence to see the cost.' : isQuality ? 'The blue point shows systematic bias; the interval shows one standard error of sampling variation.' : 'The blue point is the estimate, the teal bar is the interval, and the red line is a reference value.'}</p>
        {isPlanning ? <LineChart series={[{ name: 'Required sample size', points: Array.from({ length: 50 }, (_, i) => { const margin = 1 + i * 0.2; return { x: margin, y: Math.ceil((z * sd / margin) ** 2) } }) }]} markers={[{ x: target, label: `target ${fmt(target, 1)}` }]} xLabel="Target margin of error" yLabel="Required n" summary={`Required sample size is ${center} for margin of error ${target}`} /> : <IntervalGraphic estimate={center} lower={low} upper={high} truth={reference} label={lab.title} />}
        {slug === 'confidence-interval-mean' && <p className="text-xs text-slate-500">z half-width {fmt(z * se)} · t half-width {fmt(t * se)}. Estimating spread from the sample makes the t interval wider.</p>}
      </Card>
      <Card title="Change the inputs"><div className="space-y-4">
        <Slider label="Sample size n" value={n} min={5} max={200} onChange={setN} />
        {isProportion ? <Slider label="Observed rate A" value={rate} min={0.05} max={0.95} step={0.01} onChange={setRate} /> : isQuality ? <Slider label="Bias" value={bias} min={-10} max={10} onChange={setBias} /> : <Slider label={isVariance ? 'Sample standard deviation' : 'Observed mean A'} value={isVariance ? sd : estimate} min={isVariance ? 2 : 35} max={isVariance ? 25 : 65} onChange={isVariance ? setSd : setEstimate} />}
        {!isVariance && !isQuality && !isProportion && <Slider label="Sample standard deviation" value={sd} min={2} max={25} onChange={setSd} />}
        {isDifference && <Slider label={isProportion ? 'Observed rate B (%)' : 'Observed mean B'} value={other} min={isProportion ? 5 : 35} max={isProportion ? 95 : 65} onChange={setOther} />}
        {isPlanning && <Slider label="Target margin of error" value={target} min={1} max={10} step={0.5} onChange={setTarget} />}
        <Slider label="Confidence level" value={confidence} min={80} max={99} onChange={setConfidence} suffix="%" />
      </div></Card>
    </div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label={resultLabel} value={fmt(center, isProportion ? 3 : 2)} /><Metric label={isPlanning ? 'Planning rule' : isQuality ? 'One SE range' : `${confidence}% interval`} value={isPlanning ? `round up to ${center}` : `[${fmt(low, isProportion ? 3 : 1)}, ${fmt(high, isProportion ? 3 : 1)}]`} /><Metric label={secondaryLabel} value={secondary} /></div>
    <Theory {...theoryContent} />
  </div>
}
