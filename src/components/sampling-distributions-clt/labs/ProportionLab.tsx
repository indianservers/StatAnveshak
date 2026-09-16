import { useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import {
  SamplingDistributionEngine,
  createPopulation,
  createRng,
  formatNum,
  normalApproxOk,
  theoreticalSE,
  type CltTab,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock } from '../shared'
import { HistogramChart, PopulationDotsCanvas } from '../plots'

export function ProportionLab({ tab }: { tab: CltTab }) {
  const [p, setP] = useState(0.4)
  const [n, setN] = useState(50)
  const [R, setR] = useState(500)
  const [N, setNpop] = useState(1000)
  const [seed, setSeed] = useState(21)
  const engine = useMemo(() => new SamplingDistributionEngine({ seed }), [seed])
  const population = useMemo(() => createPopulation({ kind: 'bernoulli', p, size: N }, createRng(seed + 3)), [p, N, seed])
  const result = useMemo(
    () => engine.simulate({ population, n, R, statistic: 'proportion', seed, keepStatistics: R <= 2000 }),
    [engine, population, n, R, seed],
  )
  const se = theoreticalSE({ n, kind: 'proportion', p })
  const approx = normalApproxOk(n, p)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="A proportion is a mean of 0–1 data">
          <p className="text-sm leading-6 text-slate-600">
            Code success as 1 and failure as 0. Then p̂ = X / n is the sample mean of those indicators.
          </p>
          <FormulaBlock tex={'E(\\hat{p})=p\\qquad SE(\\hat{p})=\\sqrt{p(1-p)/n}'} label="Mean and standard error of a sample proportion" />
        </CltCard>
        <CltCard title="When a smooth normal is dishonest">
          <p className="text-sm leading-6 text-slate-600">
            A bell overlay is a large-sample approximation. If np or n(1 − p) is small, the sampling distribution of p̂
            is discrete, lumpy, and often skewed.
          </p>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="In a city, 30% of residents own a dog. A random sample of n = 200 is selected. What is the standard deviation of p̂?"
          options={['0.0322', '0.046', '0.0558', '0.0709']}
          answer={0}
          explanation="SE = √[0.3 × 0.7 / 200] ≈ 0.0324."
        />
      </CltCard>
    )
  }

  return (
    <LabExploreGrid
      simulation={
        <CltCard
          title="Interactive simulation"
          action={
            <button type="button" className="clt-btn clt-btn-ghost" onClick={() => setSeed((value) => value + 1)}>
              <RotateCcw size={14} aria-hidden /> Reset
            </button>
          }
        >
          <p className="mb-4 text-sm text-slate-500">
            Adjust the population proportion, sample size, and number of samples. Draw repeated samples and watch the
            distribution of sample proportions.
          </p>
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Population (N = {N})</p>
              <PopulationDotsCanvas values={population.values ?? []} />
              <p className="text-xs text-slate-400">
                True proportion p = {formatNum(p, 2)} ({Math.round(p * N)} successes, {Math.round((1 - p) * N)} failures)
              </p>
              <CltSlider label="Population proportion (p)" value={p} min={0.05} max={0.95} step={0.01} onChange={setP} display={formatNum(p, 2)} />
              <CltSlider label="Sample size (n)" value={n} min={5} max={200} step={1} onChange={setN} />
              <CltSlider label="Number of samples" value={R} min={20} max={5000} step={10} onChange={setR} />
              <CltSlider label="Population size N" value={N} min={80} max={1600} step={20} onChange={setNpop} />
              <button type="button" className="clt-btn w-full" onClick={() => setSeed((value) => value + 1)}>
                <Play size={14} aria-hidden /> Draw samples
              </button>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Metric label="Mean of p̂" value={formatNum(result.empiricalMean, 3)} />
                <Metric label="SD of p̂" value={formatNum(result.empiricalSd, 3)} />
                <Metric label="Theoretical SE" value={formatNum(se, 3)} />
              </div>
              <HistogramChart
                bins={result.histogram}
                mean={p}
                overlay={approx ? undefined : undefined}
                xLabel="Sample proportion (p̂)"
                yLabel="Count"
                ariaLabel="Sampling distribution of a proportion"
              />
              {!approx && (
                <Insight title="Normal overlay hidden" tone="warn">
                  np = {formatNum(n * p, 1)} and n(1 − p) = {formatNum(n * (1 - p), 1)}. At least one is below 10, so this
                  lab does not paint a smooth normal on a lumpy, discrete histogram.
                </Insight>
              )}
              {approx && (
                <p className="mt-2 text-xs text-slate-500">
                  np and n(1 − p) are both at least 10, so a normal approximation is a reasonable sketch — still an
                  approximation, not the population itself.
                </p>
              )}
            </div>
          </div>
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="hat" title="Sample proportion">
              p̂ = X / n, where X is the number of successes in a sample of size n.
            </ConceptRow>
            <ConceptRow icon="target" title="Center">
              The sampling distribution of p̂ is centered at the true proportion: E(p̂) = p.
            </ConceptRow>
            <ConceptRow icon="spread" title="Spread">
              SE(p̂) = √[p(1 − p) / n]. It is smaller as the sample size increases.
            </ConceptRow>
            <ConceptRow icon="bell" title="Approximate normality">
              For large enough n — typically np ≥ 10 and n(1 − p) ≥ 10 — the distribution of p̂ is approximately normal,
              even if the population is not.
            </ConceptRow>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A university reports that 40% of its students participate in a volunteer program. You take a random sample
            of 100 students. What is the mean and standard deviation of p̂?
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>Mean: E(p̂) = p = 0.40</li>
            <li>SE = √[0.40 × 0.60 / 100] = 0.049</li>
            <li>np = 40 and n(1 − p) = 60, both ≥ 10, so a normal sketch is reasonable.</li>
          </ol>
          <Insight title="Interpretation">
            Many samples of 100 students will typically sit within about 0.05 of 0.40.
          </Insight>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="In a city, 30% of residents own a dog. A random sample of 200 residents is selected. What is the standard deviation of p̂?"
            options={['0.0322', '0.0460', '0.0558', '0.0709']}
            answer={0}
            explanation={`SE = √[0.3 × 0.7 / 200] = ${formatNum(Math.sqrt((0.3 * 0.7) / 200), 4)}.`}
          />
        </CltCard>
      }
    />
  )
}
