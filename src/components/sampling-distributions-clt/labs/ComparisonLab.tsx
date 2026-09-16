import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  COMPARE_NS,
  SamplingDistributionEngine,
  createPopulation,
  formatNum,
  theoreticalSE,
  type CltTab,
  type PopulationKind,
  type StatisticKind,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSelect, ConceptRow, Insight, LabExploreGrid, QuizBlock } from '../shared'
import { DensityChart, HistogramChart } from '../plots'

const COLORS = ['#60a5fa', '#7c3aed', '#2563eb', '#0f766e']

export function ComparisonLab({ tab }: { tab: CltTab }) {
  const [statistic, setStatistic] = useState<StatisticKind>('mean')
  const [kind, setKind] = useState<PopulationKind>('normal')
  const [sigma, setSigma] = useState(10)
  const [selected, setSelected] = useState<number[]>([5, 15, 30, 100])
  const [seed, setSeed] = useState(61)
  const engine = useMemo(() => new SamplingDistributionEngine({ seed }), [seed])
  const p = 0.5
  const population = useMemo(() => {
    if (statistic === 'proportion') return createPopulation({ kind: 'bernoulli', p, size: 2000 })
    return createPopulation({ kind, mu: 50, sigma, min: 50 - 2 * sigma, max: 50 + 2 * sigma })
  }, [statistic, kind, sigma])

  const runs = useMemo(
    () =>
      selected.map((n, index) => {
        const result = engine.simulate({
          population,
          n,
          R: 1200,
          statistic,
          seed: seed + n,
          keepStatistics: false,
        })
        const se = theoreticalSE({
          sigma: population.sd,
          n,
          kind: statistic,
          p: statistic === 'proportion' ? p : undefined,
        })
        return { n, result, se, color: COLORS[index] ?? '#2563eb' }
      }),
    [engine, population, selected, seed, statistic],
  )

  const toggle = (n: number) => {
    setSelected((current) => {
      if (current.includes(n)) return current.filter((item) => item !== n)
      if (current.length >= 4) return current
      return [...current, n].sort((a, b) => a - b)
    })
  }

  const series = runs.map((run) => {
    const center = statistic === 'proportion' ? 0.5 : population.mean
    const se = Math.max(run.se, 1e-6)
    const lo = center - 4.2 * se
    const hi = center + 4.2 * se
    const points = Array.from({ length: 90 }, (_, i) => {
      const x = lo + ((hi - lo) * i) / 89
      const z = (x - center) / se
      return { x, y: Math.exp(-0.5 * z * z) / (se * Math.sqrt(2 * Math.PI)) }
    })
    return { id: `n-${run.n}`, color: run.color, points }
  })

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="Compare center, SE, shape, and bias">
          <p className="text-sm leading-6 text-slate-600">
            Two sampling distributions can share a center and still disagree on spread. Changing n, the parent, σ, or
            the statistic (mean versus proportion) changes the picture in different ways.
          </p>
        </CltCard>
        <CltCard title="Same population, different n">
          <p className="text-sm leading-6 text-slate-600">
            Larger n does not move an unbiased sampling distribution off μ or p. It narrows the SE. A biased procedure
            would shift the center; ordinary random sampling of the mean or proportion does not.
          </p>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="A population has mean μ = 100 and standard deviation σ = 20. Which sampling distribution will have the smaller standard error?"
          options={[
            'The sample mean with n = 10',
            'The sample mean with n = 50',
            'The sample proportion with n = 50 (assuming p = 0.5)',
            'They all have the same standard error',
          ]}
          answer={1}
          explanation="For the mean, SE = 20/√50 = 2.83, smaller than 20/√10 = 6.32. A proportion lives on a different scale, so it is not the same SE."
        />
      </CltCard>
    )
  }

  return (
    <LabExploreGrid
      simulation={
        <CltCard
          title="Interactive comparison"
          action={
            <button type="button" className="clt-btn clt-btn-ghost" onClick={() => setSeed((value) => value + 1)}>
              <RotateCcw size={14} aria-hidden /> Reset
            </button>
          }
        >
          <p className="mb-4 text-sm text-slate-500">
            Compare sampling distributions by changing the sample size or the statistic. Larger samples lead to less
            variability, and different statistics have different distributions.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <CltSelect
              label="Statistic to compare"
              value={statistic}
              onChange={(value) => setStatistic(value as StatisticKind)}
              options={[
                { value: 'mean', label: 'Sample mean (x̄)' },
                { value: 'proportion', label: 'Sample proportion (p̂)' },
                { value: 'median', label: 'Sample median' },
              ]}
            />
            {statistic !== 'proportion' && (
              <>
                <CltSelect
                  label="Parent population"
                  value={kind}
                  onChange={(value) => setKind(value as PopulationKind)}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'skewed', label: 'Right-skewed' },
                    { value: 'uniform', label: 'Uniform' },
                    { value: 'bimodal', label: 'Bimodal' },
                  ]}
                />
                <label className="block min-w-[180px]">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">σ</span>
                  <input
                    className="clt-input"
                    type="number"
                    min={4}
                    max={30}
                    value={sigma}
                    onChange={(event) => setSigma(Number(event.target.value))}
                  />
                </label>
              </>
            )}
            <fieldset>
              <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Sample sizes (select up to 4)
              </legend>
              <div className="flex flex-wrap gap-3">
                {COMPARE_NS.map((n) => (
                  <label key={n} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input type="checkbox" checked={selected.includes(n)} onChange={() => toggle(n)} />
                    n = {n}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              Sampling distributions of the {statistic} · parent {statistic === 'proportion' ? 'Bernoulli(0.5)' : kind} · σ = {formatNum(population.sd)}
            </p>
            <DensityChart
              series={series}
              xLabel={statistic === 'proportion' ? 'Sample proportion (p̂)' : 'Sample mean (x̄)'}
              ariaLabel="Overlay of sampling distributions"
            />
            <ul className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
              {runs.map((run) => (
                <li key={run.n} style={{ color: run.color }}>
                  n = {run.n} (SE = {formatNum(run.se, 2)}) · empirical SD {formatNum(run.result.empiricalSd, 2)} · bias{' '}
                  {formatNum(run.result.bias, 3)}
                </li>
              ))}
            </ul>
          </div>
          {runs[0] && (
            <div className="mt-4">
              <HistogramChart bins={runs[0].result.histogram} height={150} ariaLabel="Histogram for the smallest selected sample size" />
            </div>
          )}
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="center" title="Center">
              The sampling distribution is centered at the true population value — μ for the mean, p for the proportion
              — when the procedure is unbiased.
            </ConceptRow>
            <ConceptRow icon="spread" title="Spread">
              Spread is measured by the standard error. For the mean, SE = σ / √n. The distribution becomes less
              variable as n increases.
            </ConceptRow>
            <ConceptRow icon="bell" title="Larger samples, narrower distributions">
              As the sample size increases, the sampling distribution is more concentrated, narrower, and taller — more
              precise estimates, not a different center.
            </ConceptRow>
            <Insight title="Same population. Different sample sizes.">
              Same center. Less variability. Shape can still differ if you switch from a mean to a proportion or change
              the parent.
            </Insight>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            Suppose a population is normally distributed with μ = 50 and σ = 10. Compare the sampling distributions of
            the sample mean at n = 10 and n = 50.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>For n = 10, SE = 10/√10 ≈ 3.16. The sampling distribution is approximately N(50, 3.16).</li>
            <li>For n = 50, SE = 10/√50 ≈ 1.41. The sampling distribution is approximately N(50, 1.41).</li>
            <li>Both are centered at 50, and the n = 50 distribution is narrower.</li>
          </ul>
          <Insight title="Takeaway">
            Increasing the sample size does not change the center of an unbiased sampling distribution, but it reduces
            the spread, leading to more precise estimates.
          </Insight>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="A population has mean μ = 100 and σ = 20. Which sampling distribution has the smaller standard error?"
            options={[
              'The sample mean with n = 10',
              'The sample mean with n = 50',
              'The sample proportion with n = 50 (assuming p = 0.5)',
              'They all have the same standard error',
            ]}
            answer={1}
            explanation="Only the two means share a scale. n = 50 gives SE = 20/√50 ≈ 2.83, smaller than 6.32."
          />
        </CltCard>
      }
    />
  )
}
