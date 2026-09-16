import { useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import {
  DRAW_BATCHES,
  SamplingDistributionEngine,
  createPopulation,
  formatNum,
  theoreticalSE,
  type CltTab,
  type PopulationKind,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock } from '../shared'
import { DensityPreview, HistogramChart, SampleDots } from '../plots'

const SHAPES: Array<{ id: PopulationKind; label: string }> = [
  { id: 'normal', label: 'Normal' },
  { id: 'uniform', label: 'Uniform' },
  { id: 'skewed', label: 'Right skewed' },
  { id: 'leftSkewed', label: 'Left skewed' },
]

function specFor(kind: PopulationKind) {
  if (kind === 'uniform') return { kind, min: 30, max: 70 }
  if (kind === 'skewed') return { kind, sigma: 12 }
  if (kind === 'leftSkewed') return { kind, sigma: 12 }
  return { kind, mu: 60, sigma: 10 }
}

export function MeanLab({ tab }: { tab: CltTab }) {
  const [kind, setKind] = useState<PopulationKind>('normal')
  const [n, setN] = useState(30)
  const [R, setR] = useState(500)
  const [seed, setSeed] = useState(11)
  const engine = useMemo(() => new SamplingDistributionEngine({ seed }), [seed])
  const population = useMemo(() => createPopulation(specFor(kind)), [kind])
  const result = useMemo(
    () => engine.simulate({ population, n, R, statistic: 'mean', seed, keepStatistics: R <= 2000 }),
    [engine, population, n, R, seed],
  )
  const se = theoreticalSE({ sigma: population.sd, n, kind: 'mean' })

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="What a sampling distribution is">
          <p className="text-sm leading-6 text-slate-600">
            One sample mean is a single number. Draw many independent samples of size n, compute each mean, and those
            means form a new random variable: the sampling distribution of x̄.
          </p>
          <FormulaBlock tex={'E(\\bar{X})=\\mu\\qquad SE(\\bar{X})=\\sigma/\\sqrt{n}'} label="Mean and standard error of the sample mean" />
        </CltCard>
        <CltCard title="Three pictures, three objects">
          <p className="text-sm leading-6 text-slate-600">
            The population is the parent. A current sample is n draws from it. The sampling distribution is the
            histogram of many sample means — not of the raw data.
          </p>
          <Insight title="Keep the language tight">
            Standard deviation describes the population or one sample. Standard error describes the statistic.
          </Insight>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
          <QuizBlock
            prompt="A population has μ = 50 and σ = 15. What is the standard error of the mean for samples of size 25?"
            options={['0.6', '3.0', '15.0', '75.0']}
            answer={1}
            explanation="SE(x̄) = σ/√n = 15/5 = 3. That is the spread of the means, not of the raw scores."
          />
        </CltCard>
        <CltCard title="Another check">
          <QuizBlock
            prompt="If you increase n, what happens to E(x̄) and SE(x̄)?"
            options={[
              'Both shrink toward zero',
              'The center stays at μ; the SE shrinks like 1/√n',
              'The center moves to the sample median',
              'The SE stays at σ',
            ]}
            answer={1}
            explanation="Unbiased sampling keeps the sampling distribution centered at μ. Only the spread of that distribution shrinks."
          />
        </CltCard>
      </div>
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
            Draw repeated samples from a population and watch the histogram of sample means build in real time.
          </p>
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">1. Choose a population shape</p>
              <div className="grid grid-cols-2 gap-2">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    className={`clt-shape ${kind === shape.id ? 'is-on' : ''}`}
                    onClick={() => setKind(shape.id)}
                    aria-pressed={kind === shape.id}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">2. Set parameters</p>
              <CltSlider label="Sample size (n)" value={n} min={2} max={120} step={1} onChange={setN} ticks={[5, 30, 60, 120]} />
              <CltSlider label="Number of samples" value={R} min={1} max={10000} step={1} onChange={setR} ticks={[1, 100, 1000, 10000]} />
              <div className="flex flex-wrap gap-2">
                {DRAW_BATCHES.map((count) => (
                  <button key={count} type="button" className="clt-btn clt-btn-ghost" onClick={() => setR(count)}>
                    {count}
                  </button>
                ))}
              </div>
              <button type="button" className="clt-btn w-full" onClick={() => setSeed((value) => value + 1)}>
                <Play size={14} aria-hidden /> Draw samples
              </button>
            </div>
            <div>
              <div className="mb-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-2 dark:bg-slate-800/70">
                  <DensityPreview points={population.density} label="Population" />
                </div>
                <div className="rounded-2xl bg-slate-50 p-2 dark:bg-slate-800/70">
                  <SampleDots values={result.lastSample} />
                  <p className="text-center text-[10px] font-semibold text-slate-400">Current sample · x̄ = {formatNum(result.lastStatistic)}</p>
                </div>
                <div className="flex flex-wrap content-start gap-2 p-1">
                  <Metric label="Samples" value={String(result.R)} />
                  <Metric label="Mean of x̄" value={formatNum(result.empiricalMean)} />
                  <Metric label="SD of x̄" value={formatNum(result.empiricalSd)} />
                </div>
              </div>
              <HistogramChart bins={result.histogram} mean={population.mean} xLabel="Sample mean (x̄)" ariaLabel="Sampling distribution of the mean" />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                As the number of samples increases, the histogram is clearer. The sampling distribution of the mean is
                centered at μ = {formatNum(population.mean)} with SE = {formatNum(se)}.
              </p>
            </div>
          </div>
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="mean" title="Sample mean">
              The sample mean is the average of a sample: x̄ = (Σ xᵢ) / n.
            </ConceptRow>
            <ConceptRow icon="repeat" title="Repeated sampling">
              If we take many random samples of size n, each sample mean is a new observation of the statistic.
            </ConceptRow>
            <ConceptRow icon="center" title="Center of the sampling distribution">
              The mean of the sampling distribution of x̄ equals the population mean: E(x̄) = μ.
            </ConceptRow>
            <ConceptRow icon="spread" title="Spread of the sampling distribution">
              The standard deviation of x̄ is the standard error: σ / √n. Larger samples lead to less variability.
            </ConceptRow>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A population of test scores is normally distributed with mean μ = 70 and standard deviation σ = 12. Consider
            all possible samples of size n = 36 from this population.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>μ<sub>x̄</sub> = μ = 70</li>
            <li>σ<sub>x̄</sub> = σ / √n = 12 / 6 = 2</li>
            <li>For this normal parent, the sampling distribution of x̄ is exactly normal.</li>
          </ol>
          <Insight title="Remember">
            No matter the shape of the population (as long as it has a finite standard deviation), the sampling
            distribution of the mean becomes approximately normal for large enough n — that is the CLT, not a rule that
            n = 30 always suffices.
          </Insight>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="A population has μ = 50 and σ = 15. What is the standard error of the mean for samples of size 25?"
            options={['0.6', '3.0', '15.0', '75.0']}
            answer={1}
            explanation="SE = 15 / √25 = 3."
          />
        </CltCard>
      }
    />
  )
}
