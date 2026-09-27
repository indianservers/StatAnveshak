import { useState } from 'react'
import type { StudioLab } from '../../../lib/statisticsStudios'
import { chiCdf, fCdf, normalCdf, normalInv, normalPdf, normalPoints, tCdf, tInv, tPdf } from '../../../lib/remainingLabMath'
import { BarChart, Card, LineChart, Metric, Slider, Theory } from './shared'
import { fmt, fmtP } from './format'

const theory: Record<string, { intuition: string; formula: string; assumptions: string; caution: string }> = {
  'hypothesis-basics': { intuition: 'A null specifies a reference model. An alternative tells us which departures count as evidence.', formula: 'H₀: θ = θ₀; H₁: θ ≠ θ₀ (or >, <)', assumptions: 'Choose the direction before seeing the data, based on the scientific question.', caution: 'Failure to reject H₀ is not proof that it is true.' },
  'test-statistic-p-value': { intuition: 'Standardize the observed difference, then measure how much null probability is at least as extreme.', formula: 'z = (estimate − null)/SE; p = P₀(|Z| ≥ |zobs|)', assumptions: 'The null distribution and standard error must match the design.', caution: 'A p value is not the probability that H₀ is true, nor an effect size.' },
  'errors-and-power': { intuition: 'Lowering the rejection threshold reduces false positives but can miss more real effects.', formula: 'Power = P(reject H₀ | specified alternative) = 1 − β', assumptions: 'Power requires a specified effect size, noise level, sample size, and decision rule.', caution: 'Post-hoc observed power adds little beyond the p value; plan power before collecting data.' },
  'z-test': { intuition: 'Compare an observed mean with a reference using a known or well-justified standard error.', formula: 'z = (x̄ − μ₀)/(σ/√n)', assumptions: 'Independent sample, known population σ or a justified large-sample approximation.', caution: 'If σ is estimated in a small sample, use a t reference instead.' },
  'one-sample-t-test': { intuition: 'Estimating spread from the same sample adds uncertainty reflected by the t distribution.', formula: 't = (x̄ − μ₀)/(s/√n); df = n − 1', assumptions: 'Independent observations; approximate normality matters most for small n.', caution: 'Inspect outliers and shape; a significant result need not be practically large.' },
  'two-sample-t-test': { intuition: 'Welch’s test allows two independent groups to have different variances.', formula: 't = (x̄₁ − x̄₂)/√(s₁²/n₁+s₂²/n₂)', assumptions: 'Independent groups, numeric outcome, and an approximately valid t approximation.', caution: 'This is about means; unequal shapes and outliers can complicate interpretation.' },
  'paired-t-test': { intuition: 'Pairing removes between-person variation; test each within-pair change.', formula: 't = d̄/(s_d/√n); df = n − 1', assumptions: 'Independent pairs and approximately normal paired differences for small samples.', caution: 'Treating paired observations as independent throws away the design.' },
  'proportion-tests': { intuition: 'Compare an observed event rate with a null rate using binomial variability.', formula: 'z = (p̂ − p₀)/√[p₀(1−p₀)/n]', assumptions: 'Independent binary trials and enough expected successes and failures for a normal approximation.', caution: 'For sparse data use an exact binomial method.' },
  'chi-square-tests': { intuition: 'Large gaps between observed and expected category counts add to the chi-square statistic.', formula: 'χ² = Σ(Oᵢ−Eᵢ)²/Eᵢ', assumptions: 'Independent counts in mutually exclusive categories; expected counts should not be too small.', caution: 'A large statistic says some pattern differs, not which cells caused it.' },
  'f-test': { intuition: 'A ratio of estimated variances can be compared with an F reference distribution.', formula: 'F = s₁²/s₂²; df = (n₁−1, n₂−1)', assumptions: 'Independent samples from approximately normal populations for a variance-ratio test.', caution: 'The variance F test is sensitive to nonnormality; ANOVA F tests compare model terms under their own assumptions.' },
  'effect-size': { intuition: 'Standardize a mean difference to express magnitude on a common scale.', formula: 'Cohen’s d = (x̄₁−x̄₂)/s_pooled', assumptions: 'A meaningful numeric outcome and a relevant standardizer.', caution: 'Statistical significance and practical importance answer different questions; context sets what counts as large.' },
  'multiple-testing': { intuition: 'Every extra uncorrected test adds another chance of at least one false positive.', formula: 'FWER = 1 − (1−α)^m for m independent true-null tests', assumptions: 'The displayed formula assumes independence; Bonferroni controls FWER without it.', caution: 'Corrections reduce false discoveries but also reduce power. Define the family of questions thoughtfully.' },
}

export function HypothesisLab({ lab }: { lab: StudioLab }) {
  const [effect, setEffect] = useState(3)
  const [n, setN] = useState(30)
  const [alpha, setAlpha] = useState(0.05)
  const [tests, setTests] = useState(8)
  const [tails, setTails] = useState<'two' | 'right'>('two')
  const slug = lab.slug
  const isTwoSample = slug === 'two-sample-t-test'
  const isProportion = slug === 'proportion-tests'
  const se = isTwoSample ? 10 * Math.sqrt(2 / n) : 10 / Math.sqrt(n)
  const z = isProportion ? (effect / 100) / Math.sqrt(0.25 / n) : effect / se
  const t = effect / se
  const df = isTwoSample ? 2 * n - 2 : n - 1
  const isT = ['one-sample-t-test', 'two-sample-t-test', 'paired-t-test'].includes(slug)
  const critical = isT ? tInv(1 - alpha / (tails === 'two' ? 2 : 1), df) : normalInv(1 - alpha / (tails === 'two' ? 2 : 1))
  const baseP = tails === 'two' ? 2 * (1 - normalCdf(Math.abs(z))) : 1 - normalCdf(z)
  const tP = tails === 'two' ? 2 * (1 - tCdf(Math.abs(t), df)) : 1 - tCdf(t, df)
  const power = tails === 'two' ? normalCdf(-critical - z) + 1 - normalCdf(critical - z) : 1 - normalCdf(critical - z)
  const observedCounts = [20 + effect * 2, 20 - effect, 20 - effect]
  const chi = observedCounts.reduce((sum, count) => sum + (count - 20) ** 2 / 20, 0)
  const f = Math.max(0.1, 1 + effect / 2)
  let statistic = z
  let p = baseP
  let statisticLabel = 'z statistic'
  if (['one-sample-t-test', 'two-sample-t-test', 'paired-t-test'].includes(slug)) { statistic = t; p = tP; statisticLabel = 't statistic' }
  if (slug === 'chi-square-tests') { statistic = chi; p = 1 - chiCdf(chi, 2); statisticLabel = 'χ² statistic' }
  if (slug === 'f-test') { statistic = f; p = 1 - fCdf(f, n - 1, n - 1); statisticLabel = 'F ratio' }
  if (slug === 'effect-size') { statistic = effect / 10; statisticLabel = 'Cohen’s d' }
  if (slug === 'multiple-testing') { statistic = 1 - (1 - alpha) ** tests; statisticLabel = 'Family-wise error' }
  if (slug === 'errors-and-power') { statistic = power; statisticLabel = 'Power' }
  const isSpecial = ['chi-square-tests', 'f-test', 'multiple-testing', 'effect-size'].includes(slug)
  const chart = slug === 'multiple-testing' ? <LineChart series={[{ name: 'Uncorrected FWER', points: Array.from({ length: 30 }, (_, i) => ({ x: i + 1, y: 1 - (1 - alpha) ** (i + 1) })) }, { name: 'Bonferroni upper bound', points: Array.from({ length: 30 }, (_, i) => ({ x: i + 1, y: Math.min(1, alpha) })), color: '#16a34a' }]} markers={[{ x: tests, label: `${tests} tests` }]} xLabel="Number of tests" yLabel="Chance of ≥1 false positive" summary={`Family-wise error is ${fmt(statistic, 3)} for ${tests} independent tests`} yMax={1} /> : slug === 'chi-square-tests' ? <BarChart values={observedCounts} labels={['A', 'B', 'C']} summary={`Observed counts ${observedCounts.map((value) => fmt(value, 0)).join(', ')} versus expected 20 in each category`} /> : slug === 'f-test' ? <LineChart series={[{ name: 'F cumulative probability', points: Array.from({ length: 100 }, (_, i) => ({ x: 0.05 + i * 0.05, y: fCdf(0.05 + i * 0.05, n - 1, n - 1) })) }]} markers={[{ x: f, label: `F = ${fmt(f)}` }]} xLabel="Variance ratio F" yLabel="Cumulative probability" summary={`F ratio ${fmt(f)}, upper-tail p ${fmt(p, 3)}`} yMax={1} /> : slug === 'effect-size' ? <LineChart series={[{ name: 'Group A', points: normalPoints(-4, 5).map((point) => ({ x: point.x, y: normalPdf(point.x) })) }, { name: 'Group B', points: normalPoints(-4, 5).map((point) => ({ x: point.x, y: normalPdf(point.x - effect / 10) })), color: '#ea580c' }]} xLabel="Standardized score" yLabel="Density" summary={`Two normal group curves separated by Cohen's d ${fmt(effect / 10)}`} /> : <LineChart series={[{ name: isT ? `t distribution, df ${df}` : 'Null standard normal', points: normalPoints(-4, 4).map((point) => ({ x: point.x, y: isT ? tPdf(point.x, df) : point.y })) }, ...(slug === 'errors-and-power' ? [{ name: 'Alternative', points: normalPoints(-4, 4).map((point) => ({ x: point.x, y: normalPdf(point.x - z) })), color: '#16a34a' }] : [])]} markers={[{ x: statistic, label: `observed ${fmt(statistic)}` }, { x: critical, label: `critical ${fmt(critical)}`, color: '#16a34a' }]} xLabel="Standardized statistic" yLabel="Null density" summary={`Observed statistic ${fmt(statistic)}, critical value ${fmt(critical)}, p ${fmt(p, 3)}`} />
  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]"><Card title={slug === 'multiple-testing' ? 'False positives accumulate' : slug === 'chi-square-tests' ? 'Observed category counts' : slug === 'effect-size' ? 'Magnitude of group separation' : 'Reference distribution'}><p className="mb-2 text-sm text-slate-500">{isSpecial ? lab.summary : 'The observed statistic moves across the null curve as the effect or sample size changes. The dashed green line marks the rejection cutoff.'}</p>{chart}</Card><Card title="Experiment controls"><div className="space-y-4"><Slider label={slug === 'chi-square-tests' ? 'Count imbalance' : slug === 'effect-size' ? 'Mean difference' : isProportion ? 'Rate shift (percentage points)' : 'Observed difference / effect'} value={effect} min={-6} max={10} onChange={setEffect} /><Slider label={isTwoSample ? 'Sample size per group' : 'Sample size n'} value={n} min={8} max={150} onChange={setN} /><Slider label="Significance level α" value={alpha} min={0.01} max={0.2} step={0.01} onChange={setAlpha} />{slug === 'multiple-testing' && <Slider label="Number of tests" value={tests} min={1} max={30} onChange={setTests} />}{!isSpecial && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">Alternative direction<select value={tails} onChange={(event) => setTails(event.target.value as 'two' | 'right')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800"><option value="two">Two-sided</option><option value="right">Right-sided</option></select></label>}</div></Card></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label={statisticLabel} value={fmt(statistic, 3)} /><Metric label={slug === 'errors-and-power' ? 'Type II error β' : slug === 'multiple-testing' ? 'Bonferroni α per test' : slug === 'effect-size' ? 'Mean difference' : 'p value'} value={slug === 'errors-and-power' ? fmt(1 - power, 3) : slug === 'multiple-testing' ? fmt(alpha / tests, 4) : slug === 'effect-size' ? fmt(effect) : fmtP(p)} /><Metric label={slug === 'multiple-testing' ? 'Number of tests' : slug === 'errors-and-power' ? 'Type I error α' : slug === 'effect-size' ? 'Standardizer' : 'Decision'} value={slug === 'multiple-testing' ? String(tests) : slug === 'errors-and-power' ? fmt(alpha, 2) : slug === 'effect-size' ? '10 units' : p <= alpha ? 'Reject H₀' : 'Do not reject H₀'} note={slug === 'hypothesis-basics' ? `H₀: effect = 0; H₁: ${tails === 'two' ? 'effect ≠ 0' : 'effect > 0'}` : undefined} /></div>
    {slug === 'proportion-tests' && <Card title="Binary outcome example"><p className="text-sm text-slate-600 dark:text-slate-300">Null rate p₀ = 0.50. Observed rate p̂ = {fmt(0.5 + effect / 100, 2)} across n = {n} trials. The plotted z uses the null standard error √[p₀(1−p₀)/n].</p></Card>}
    <Theory {...theory[slug]} />
  </div>
}
