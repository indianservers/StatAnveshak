import { useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import {
  SE_OVERLAY_NS,
  SamplingDistributionEngine,
  createPopulation,
  formatNum,
  seVsN,
  theoreticalSE,
  type CltTab,
  type PopulationKind,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSelect, CltSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock } from '../shared'
import { HistogramChart, SeCurveChart } from '../plots'

export function StandardErrorLab({ tab }: { tab: CltTab }) {
  const [sigma, setSigma] = useState(10)
  const [n, setN] = useState(30)
  const [kind, setKind] = useState<PopulationKind>('normal')
  const [seed, setSeed] = useState(31)
  const engine = useMemo(() => new SamplingDistributionEngine({ seed }), [seed])
  const population = useMemo(() => createPopulation({ kind, mu: 0, sigma, min: -2 * sigma, max: 2 * sigma }), [kind, sigma])
  const result = useMemo(
    () => engine.simulate({ population, n, R: 1000, statistic: 'mean', seed }),
    [engine, population, n, seed],
  )
  const small = useMemo(
    () => engine.simulate({ population, n: 10, R: 800, statistic: 'mean', seed: seed + 1 }),
    [engine, population, seed],
  )
  const large = useMemo(
    () => engine.simulate({ population, n: 100, R: 800, statistic: 'mean', seed: seed + 2 }),
    [engine, population, seed],
  )
  const se = theoreticalSE({ sigma, n, kind: 'mean' })
  const markers = seVsN(sigma, [...SE_OVERLAY_NS])

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="Standard error is not standard deviation">
          <p className="text-sm leading-6 text-slate-600">
            σ describes how far a single observation typically sits from μ. SE describes how far a statistic typically
            sits from the parameter it estimates.
          </p>
          <FormulaBlock tex={'SE(\\bar{X})=\\sigma/\\sqrt{n}'} label="Standard error of the mean" />
        </CltCard>
        <CltCard title="The inverse-square-root law">
          <p className="text-sm leading-6 text-slate-600">
            Doubling n multiplies SE by 1/√2 ≈ 0.71, not by 1/2. To cut SE in half you need about four times as many
            observations.
          </p>
          <Insight title="Precision is expensive">
            n = 5, 20, 50, and 200 overlay that curve. The last jump is large in sample size and modest in SE.
          </Insight>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="A population has a standard deviation of 15. What is the standard error of the sample mean for a sample of size 100?"
          options={['0.15', '1.5', '5.0', '15']}
          answer={1}
          explanation="SE = 15 / √100 = 1.5."
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
            See how the standard error of the sample mean changes as the sample size increases. Draw random samples and
            compare the distribution of sample means.
          </p>
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-4">
              <CltSlider label="Population standard deviation (σ)" value={sigma} min={1} max={30} step={1} onChange={setSigma} ticks={[1, 5, 10, 20, 30]} />
              <CltSlider label="Sample size (n)" value={n} min={5} max={200} step={1} onChange={setN} ticks={[5, 10, 30, 100, 200]} />
              <CltSelect
                label="Population distribution"
                value={kind}
                onChange={(value) => setKind(value as PopulationKind)}
                options={[
                  { value: 'normal', label: 'Normal (μ = 0)' },
                  { value: 'uniform', label: 'Uniform' },
                  { value: 'skewed', label: 'Right-skewed' },
                ]}
              />
              <button type="button" className="clt-btn w-full" onClick={() => setSeed((value) => value + 1)}>
                <Play size={14} aria-hidden /> Draw 1,000 samples
              </button>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Metric label="Sample size" value={String(n)} />
                <Metric label="SE" value={formatNum(se, 3)} />
                <Metric label="σ / √n" value={`${formatNum(sigma)} / √${n}`} />
              </div>
              <HistogramChart bins={result.histogram} mean={0} xLabel="Sample mean (x̄)" ariaLabel="Distribution of sample means" />
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Small n = 10 · SE = {formatNum(sigma / Math.sqrt(10))}</p>
              <HistogramChart bins={small.histogram} height={160} ariaLabel="Sample means for n equals 10" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Large n = 100 · SE = {formatNum(sigma / Math.sqrt(100))}</p>
              <HistogramChart bins={large.histogram} height={160} ariaLabel="Sample means for n equals 100" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">SE versus n (inverse square root)</p>
              <SeCurveChart sigma={sigma} markers={[...SE_OVERLAY_NS]} height={160} />
              <ul className="mt-1 text-[11px] leading-5 text-slate-500">
                {markers.map((item) => (
                  <li key={item.n}>
                    n = {item.n}: SE = {formatNum(item.se, 2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="formula" title="Standard error of the mean">
              SE(x̄) = σ / √n. As n increases, the sample mean is less variable.
            </ConceptRow>
            <ConceptRow icon="prop" title="Standard error of a proportion">
              For a sample proportion, SE(p̂) = √[p(1 − p) / n]. Near p = 0.5 it is largest, and it decreases as n increases.
            </ConceptRow>
            <Insight title="Not a 50% shortcut">
              Doubling n does not halve SE. Four times n approximately halves it.
            </Insight>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A population has a standard deviation of 12. What is the standard error of the sample mean for a sample of
            size 36?
          </p>
          <FormulaBlock tex={'SE=\\sigma/\\sqrt{n}=12/\\sqrt{36}=2'} label="Worked standard error" />
          <p className="mt-2 text-sm text-slate-500">If we take many samples of size 36, the sample means typically sit about 2 units from μ.</p>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="A population has a standard deviation of 15. What is the standard error of the sample mean for a sample of size 100?"
            options={['0.15', '1.5', '5.0', '15']}
            answer={1}
            explanation="SE = 15 / 10 = 1.5."
          />
        </CltCard>
      }
    />
  )
}
