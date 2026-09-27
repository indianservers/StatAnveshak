import { useState } from 'react'
import type { StudioLab } from '../../../lib/statisticsStudios'
import { bootstrapDifference, exactPermutation } from '../../../lib/nonparametricLabs'
import { average, quantile, seededRandom } from '../../../lib/remainingLabMath'
import { BarChart, Card, LineChart, Metric, Slider, Theory } from './shared'
import { fmt, fmtP } from './format'

const theory: Record<string, { intuition: string; formula: string; assumptions: string; caution: string }> = {
  'random-number-generation': { intuition: 'A pseudo-random generator turns a seed into a reproducible stream that behaves approximately like independent uniform draws.', formula: 'Uᵢ ∈ [0,1); same seed ⇒ same sequence', assumptions: 'A suitable generator and independent simulation streams for the task.', caution: 'Pseudo-random values are deterministic. Reproducibility is useful, but it is not cryptographic unpredictability.' },
  'coin-dice-simulation': { intuition: 'Empirical proportions fluctuate early and tend to approach model probabilities across many trials.', formula: 'frequency(A) = count(A)/number of trials', assumptions: 'Independent trials with unchanged coin or die probabilities.', caution: 'Convergence does not promise that a short run looks balanced.' },
  'monte-carlo': { intuition: 'Random points in a unit square estimate area by the fraction landing inside a quarter-circle.', formula: 'π̂ = 4 × (inside-circle count)/N', assumptions: 'Independent uniform points in the unit square.', caution: 'Simulation error shrinks roughly as 1/√N, so one extra decimal place can cost about 100 times more draws.' },
  'sampling-experiment': { intuition: 'Repeated samples produce a distribution of estimates, even when the population stays fixed.', formula: 'x̄* = ΣXᵢ/n for each repeated sample', assumptions: 'The simulation samples independently from a specified population model.', caution: 'Sampling variability is not the same as measurement error or selection bias.' },
  'clt-simulation': { intuition: 'Averages from a skewed population become more nearly normal as sample size grows.', formula: '√n(x̄−μ)/σ → N(0,1)', assumptions: 'Independent identically distributed draws with finite variance.', caution: 'The original data do not become normal. Heavy tails or dependence can delay the approximation.' },
  'bootstrap-simulation': { intuition: 'Resampling observed data with replacement approximates the statistic’s sampling distribution.', formula: 'CI = [quantile₂.₅%(T*), quantile₉₇.₅%(T*)]', assumptions: 'The observed sample reasonably represents the population.', caution: 'Bootstrap intervals can be unreliable with tiny samples or extreme skew; the simulation here uses a percentile interval.' },
  'permutation-simulation': { intuition: 'Reassign labels while keeping outcomes fixed to see differences expected under no group effect.', formula: 'p = fraction of rearrangements at least as extreme as observed', assumptions: 'Exchangeable labels under the null, as in randomized assignment.', caution: 'The reference distribution is exact for exchangeability, not for every possible null claim.' },
  'law-of-large-numbers-simulation': { intuition: 'A running average settles toward the expected value with increasing independent draws.', formula: '(1/N)ΣXᵢ → E[X]', assumptions: 'A stable process with finite expectation and suitable independence.', caution: 'The law does not predict when a particular path will settle or erase past deviations.' },
}

function histogram(values: number[], bins = 10) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const counts = Array(bins).fill(0) as number[]
  values.forEach((value) => counts[Math.min(bins - 1, Math.floor((value - lo) / Math.max(1e-9, hi - lo) * bins))]++)
  return { counts, labels: counts.map((_, index) => fmt(lo + (index + 0.5) / bins * (hi - lo), 1)) }
}

export function SimulationLab({ lab }: { lab: StudioLab }) {
  const [draws, setDraws] = useState(200)
  const [sampleSize, setSampleSize] = useState(10)
  const [seed, setSeed] = useState(17)
  const [population, setPopulation] = useState<'uniform' | 'skewed'>('skewed')
  const random = seededRandom(seed)
  const uniforms = Array.from({ length: draws * 2 }, () => random())
  const values = uniforms.slice(0, draws).map((value) => population === 'uniform' ? value : -Math.log(Math.max(value, 1e-9)))
  const expectation = population === 'uniform' ? 0.5 : 1
  const running = values.map((_, index) => ({ x: index + 1, y: average(values.slice(0, index + 1)) }))
  const means = Array.from({ length: Math.min(draws, 500) }, () => {
    let sum = 0
    for (let i = 0; i < sampleSize; i++) sum += population === 'uniform' ? random() : -Math.log(Math.max(random(), 1e-9))
    return sum / sampleSize
  })
  const piRunning: Array<{ x: number; y: number }> = []
  let inside = 0
  for (let i = 0; i < draws; i++) {
    const x = uniforms[i * 2]
    const y = uniforms[i * 2 + 1]
    if (x * x + y * y <= 1) inside++
    piRunning.push({ x: i + 1, y: 4 * inside / (i + 1) })
  }
  const a = [4, 5, 6, 8, 9]
  const b = [5, 6, 8, 10, 11]
  const permutation = lab.slug === 'permutation-simulation' ? exactPermutation(a, b) : null
  const bootstrap = lab.slug === 'bootstrap-simulation' ? bootstrapDifference(a, b, Math.min(draws, 2000), seed) : null
  const slug = lab.slug
  const isRunning = ['monte-carlo', 'law-of-large-numbers-simulation'].includes(slug)
  const isSampling = ['sampling-experiment', 'clt-simulation'].includes(slug)
  const plottedValues = slug === 'random-number-generation' ? uniforms.slice(0, draws) : slug === 'coin-dice-simulation' ? Array.from({ length: 6 }, (_, face) => uniforms.slice(0, draws).filter((value) => Math.floor(value * 6) === face).length) : isSampling ? means : bootstrap ? bootstrap.distribution : permutation ? permutation.distribution.slice(0, draws) : values
  const bars = histogram(plottedValues)
  let chart = <BarChart values={bars.counts} labels={bars.labels} summary={`${plottedValues.length} simulated values shown in ten bins`} />
  if (slug === 'coin-dice-simulation') chart = <BarChart values={plottedValues} labels={['1', '2', '3', '4', '5', '6']} summary={`Die-face frequencies: ${plottedValues.join(', ')}`} />
  if (isRunning) chart = <LineChart series={[{ name: 'Running estimate', points: (slug === 'monte-carlo' ? piRunning : running).filter((_, index) => index % Math.max(1, Math.floor(draws / 150)) === 0) }, { name: 'Theoretical target', points: [{ x: 1, y: slug === 'monte-carlo' ? Math.PI : expectation }, { x: draws, y: slug === 'monte-carlo' ? Math.PI : expectation }], color: '#16a34a', dashed: true }]} xLabel="Trials" yLabel="Running estimate" summary={`${draws} trials; current estimate ${fmt(slug === 'monte-carlo' ? piRunning.at(-1)?.y ?? 0 : running.at(-1)?.y ?? 0, 3)}`} />
  const primary = slug === 'monte-carlo' ? piRunning.at(-1)?.y ?? 0 : slug === 'coin-dice-simulation' ? plottedValues[0] / draws : slug === 'random-number-generation' ? average(uniforms.slice(0, draws)) : slug === 'permutation-simulation' ? permutation?.observed ?? 0 : slug === 'bootstrap-simulation' ? bootstrap?.observed ?? 0 : isSampling ? average(means) : average(values)
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]"><Card title={isRunning ? 'Convergence path' : slug === 'coin-dice-simulation' ? 'Die outcomes' : 'Simulated distribution'}><p className="mb-2 text-sm text-slate-500">{lab.summary} {permutation ? 'Reveal exact label rearrangements to build the null distribution.' : 'Change the seed for a new, reproducible run.'}</p>{chart}{slug === 'random-number-generation' && <p className="mt-2 text-xs text-slate-500">First eight draws: {uniforms.slice(0, 8).map((value) => fmt(value, 3)).join(', ')}</p>}</Card><Card title="Experiment controls"><div className="space-y-4"><Slider label={permutation ? 'Rearrangements shown' : 'Simulation trials'} value={draws} min={50} max={permutation?.distribution.length ?? 1000} step={permutation ? 1 : 50} onChange={setDraws} />{isSampling && <Slider label="Sample size per repeat" value={sampleSize} min={2} max={40} onChange={setSampleSize} />}{!['random-number-generation', 'coin-dice-simulation', 'monte-carlo', 'permutation-simulation', 'bootstrap-simulation'].includes(slug) && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">Population<select value={population} onChange={(event) => setPopulation(event.target.value as 'uniform' | 'skewed')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800"><option value="uniform">Uniform [0, 1]</option><option value="skewed">Skewed exponential</option></select></label>}{!permutation && <Slider label="Random seed" value={seed} min={1} max={100} onChange={setSeed} />}<div className="flex gap-2"><button type="button" onClick={() => setDraws((value) => Math.min(permutation?.distribution.length ?? 1000, value + 50))} className="rounded-xl bg-indigo-700 px-3 py-2 text-sm font-bold text-white">{permutation ? 'Reveal 50 more' : 'Run 50 more'}</button>{!permutation && <button type="button" onClick={() => setSeed((value) => value + 1)} className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700">New seed</button>}</div></div></Card></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label={slug === 'monte-carlo' ? 'π estimate' : slug === 'coin-dice-simulation' ? 'Face 1 frequency' : isSampling ? 'Mean of sample means' : slug === 'permutation-simulation' || slug === 'bootstrap-simulation' ? 'Observed A − B' : 'Empirical average'} value={fmt(primary, 3)} /><Metric label={slug === 'permutation-simulation' ? 'Exact two-sided p' : slug === 'bootstrap-simulation' ? 'Bootstrap 95% interval' : 'Target'} value={slug === 'permutation-simulation' ? fmtP(permutation?.p ?? 1) : slug === 'bootstrap-simulation' ? `[${fmt(bootstrap?.low ?? 0, 1)}, ${fmt(bootstrap?.high ?? 0, 1)}]` : fmt(slug === 'monte-carlo' ? Math.PI : slug === 'coin-dice-simulation' ? 1 / 6 : slug === 'random-number-generation' ? 0.5 : expectation, 3)} /><Metric label={permutation ? 'Assignments revealed' : 'Repetitions'} value={String(permutation ? Math.min(draws, permutation.distribution.length) : isSampling ? means.length : draws)} note={permutation ? `${permutation.distribution.length} possible assignments` : `Seed ${seed}`} /></div>
    {isSampling && <Card title="Sampling spread"><p className="text-sm text-slate-600 dark:text-slate-300">The middle 95% of simulated sample means is [{fmt(quantile(means, 0.025), 2)}, {fmt(quantile(means, 0.975), 2)}]. Increase sample size to tighten this spread.</p></Card>}
    <Theory {...theory[slug]} />
  </div>
}
