import { useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import {
  createPopulation,
  createRng,
  downsamplePath,
  drawSample,
  formatNum,
  runningMeans,
  type CltTab,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSelect, CltSlider, ConceptRow, Insight, LabExploreGrid, Metric, QuizBlock } from '../shared'
import { LineChart } from '../plots'

type LlnKind = 'coin' | 'die' | 'bernoulli' | 'continuous'

export function LlnLab({ tab }: { tab: CltTab }) {
  const [kind, setKind] = useState<LlnKind>('coin')
  const [p, setP] = useState(0.5)
  const [n, setN] = useState(1000)
  const [paths, setPaths] = useState(2)
  const [seed, setSeed] = useState(51)

  const population = useMemo(() => {
    if (kind === 'die') return createPopulation({ kind: 'discrete', values: [1, 2, 3, 4, 5, 6] })
    if (kind === 'continuous') return createPopulation({ kind: 'normal', mu: 10, sigma: 3 })
    return createPopulation({ kind: 'bernoulli', p, size: 20 })
  }, [kind, p])

  const series = useMemo(() => {
    const colors = ['#2563eb', '#7c3aed', '#0ea5e9']
    return Array.from({ length: paths }, (_, index) => {
      const rng = createRng(seed + index * 97)
      const draws = drawSample(population, n, rng, { replacement: true })
      const means = downsamplePath(runningMeans(draws), 360)
      const step = n / Math.max(means.length - 1, 1)
      return {
        id: `path-${index}`,
        color: colors[index] ?? '#2563eb',
        points: means.map((y, i) => ({ x: Math.round(i * step), y })),
      }
    })
  }, [population, n, paths, seed])

  const last = series[0]?.points[series[0].points.length - 1]?.y ?? Number.NaN
  const target = population.mean

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="The Law of Large Numbers is not the CLT">
          <p className="text-sm leading-6 text-slate-600">
            The LLN says that a running average x̄ₙ moves toward the population mean μ as n grows. It does not say the
            histogram of many means becomes a bell. Paths can wander, cross, and still arrive near μ.
          </p>
        </CltCard>
        <CltCard title="More data does not remove randomness">
          <p className="text-sm leading-6 text-slate-600">
            Individual tosses stay random. What settles is the average. Two coins with the same p take different routes.
          </p>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="You sample from a population with mean μ = 10. Which statement is best as the sample size increases?"
          options={[
            'x̄ becomes more variable and moves farther from 10',
            'x̄ stays the same no matter how large the sample is',
            'x̄ tends to get closer to 10 and become more stable',
            'x̄ equals 10 exactly',
          ]}
          answer={2}
          explanation="The LLN is about one running average settling near μ. It does not claim the next draw is 10, or that the distribution has become normal."
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
            Generate random observations and watch the running average converge to the true mean. Try different
            populations and see how more observations lead to greater stability — not to a bell-shaped histogram.
          </p>
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-4">
              <CltSelect
                label="Choose a population"
                value={kind}
                onChange={(value) => setKind(value as LlnKind)}
                options={[
                  { value: 'coin', label: 'Coin toss (Bernoulli)' },
                  { value: 'die', label: 'Fair die' },
                  { value: 'bernoulli', label: 'Bernoulli(p)' },
                  { value: 'continuous', label: 'Continuous (normal)' },
                ]}
              />
              {(kind === 'coin' || kind === 'bernoulli') && (
                <CltSlider label="Probability of heads (p)" value={p} min={0.05} max={0.95} step={0.01} onChange={setP} display={formatNum(p, 2)} />
              )}
              <CltSlider label="Sample size (number of tosses)" value={n} min={20} max={10000} step={10} onChange={setN} ticks={[10, 100, 1000, 5000]} />
              <CltSlider label="Number of paths" value={paths} min={1} max={3} step={1} onChange={setPaths} />
              <button type="button" className="clt-btn w-full" onClick={() => setSeed((value) => value + 1)}>
                <Play size={14} aria-hidden /> Run simulation
              </button>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Running average of {kind === 'coin' ? 'coin tosses' : kind === 'die' ? 'die rolls' : 'observations'}
              </p>
              <LineChart
                series={series}
                target={target}
                xLabel="Number of observations"
                yLabel="Running average"
                ariaLabel="Running sample mean approaching the population mean"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Metric label="Current n" value={String(n)} />
                <Metric label="Running x̄" value={formatNum(last, 4)} />
                <Metric label="True mean μ" value={formatNum(target, 3)} />
                <Metric label="Difference" value={formatNum(last - target, 4)} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                As the number of observations increases, the running average gets closer to the true mean. Different
                paths can still disagree along the way.
              </p>
            </div>
          </div>
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="bars" title="Law of Large Numbers">
              As the sample size increases, the sample average approaches the population mean.
            </ConceptRow>
            <ConceptRow icon="converge" title="Convergence">
              The sample average becomes less variable as n increases. It does not “become normal.”
            </ConceptRow>
            <ConceptRow icon="stable" title="Long-run stability">
              In the long run, the average of repeated observations is close to the population mean, even if you do not
              know the parent shape.
            </ConceptRow>
            <ConceptRow icon="infinity" title="Why samples matter">
              The LLN is the reason a large honest sample can stand in for a population — it is not a license to ignore
              bias.
            </ConceptRow>
            <Insight title="A useful sentence">
              More data does not eliminate randomness. It reveals the truth of the average.
            </Insight>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A coin is tossed 500 times. Let x̄ be the sample proportion of heads (1).
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>Population: Bernoulli with p = 0.5</li>
            <li>Sample size n = 500</li>
            <li>In one simulation, x̄ = 0.484</li>
          </ul>
          <p className="mt-2 text-sm text-slate-500">
            If we repeated this many times, most sample averages would sit near 0.5, and they would sit even closer as n
            increased. That is the LLN, not a claim that the tosses themselves became normal.
          </p>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="You sample from a population with mean μ = 10. Which is best as n increases?"
            options={[
              'x̄ becomes more variable and moves farther from 10',
              'x̄ stays the same no matter how large n is',
              'x̄ tends to get closer to 10 and become more stable',
              'x̄ equals 10 exactly',
            ]}
            answer={2}
            explanation="The running average settles toward μ. It does not lock onto 10 after a handful of draws."
          />
        </CltCard>
      }
    />
  )
}
