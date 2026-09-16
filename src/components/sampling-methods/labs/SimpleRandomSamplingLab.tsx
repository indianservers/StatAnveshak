import { useMemo, useState } from 'react'
import {
  createPopulation,
  formatNum,
  formatPct,
  inclusionProbability,
  meanStandardError,
  repeatStatistic,
  sampleMean,
  sampleSrs,
  SeededRng,
  WORKED,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard, SmSlider } from '../shared'
import { Histogram, PopulationCanvas } from '../plots'

export function SimpleRandomSamplingLab({ tab }: { tab: SmTab }) {
  const [N, setN] = useState(200)
  const [n, setNSize] = useState(20)
  const [seed, setSeed] = useState(8)
  const [drawSeed, setDrawSeed] = useState(21)
  const [reps, setReps] = useState(0)
  const pop = useMemo(() => createPopulation({ N, seed, clusterCount: 8 }), [N, seed])
  const ids = useMemo(() => sampleSrs(pop, n, new SeededRng(drawSeed)), [pop, n, drawSeed])
  const xbar = sampleMean(pop, ids)
  const pi = inclusionProbability(n, pop.N)
  const repeat = useMemo(() => {
    if (reps <= 0) return null
    return repeatStatistic(reps, 77 + n, (rng) => sampleMean(pop, sampleSrs(pop, n, rng)), pop.mu)
  }, [pop, n, reps])

  const reset = () => {
    setN(200)
    setNSize(20)
    setSeed(8)
    setDrawSeed(21)
    setReps(0)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="Equal chance, without replacement">
          <p className="text-sm leading-6 text-slate-600">
            In a simple random sample of size n from a finite population of size N, every unit has the same inclusion probability, and units are drawn without replacement.
          </p>
          <FormulaBlock tex={'\\pi_i=n/N\\qquad f=n/N'} label="Inclusion probability and sampling fraction" />
        </SmCard>
        <SmCard title="Sampling distribution">
          <Insight title="Try this">
            Draw 1, 10, 100, or 1,000 samples. The histogram of x̄ is the sampling distribution of the mean. Larger n generally tightens that distribution around μ.
          </Insight>
        </SmCard>
      </div>
    )
  }

  if (tab === 'quiz') {
    return (
      <SmCard title="Check your understanding">
        <QuizBlock
          items={[
            {
              prompt: 'A town has 1,500 households. A researcher uses a random number generator to select 100 unique households to survey. What is the probability that a particular household is selected?',
              options: ['1 in 100 (0.01)', '1 in 15 (0.0667)', '1 in 1,500 (0.00067)', '1 in 10 (0.10)'],
              answer: 1,
              explanation: 'Under SRS, πᵢ = n/N = 100/1,500 = 1/15 ≈ 0.0667.',
            },
            {
              prompt: 'SRS in this lab is drawn…',
              options: ['with replacement', 'without replacement', 'only from volunteers', 'from one cluster'],
              answer: 1,
              explanation: 'Each unit can appear at most once. That is sampling without replacement.',
            },
            {
              prompt: 'The sampling fraction f equals…',
              options: ['N/n', 'n/N', 'x̄ − μ', 'σ/√n'],
              answer: 1,
              explanation: 'f = n/N is the share of the population that is sampled.',
            },
          ]}
        />
      </SmCard>
    )
  }

  return (
    <LabSplit
      demo={
        <SmCard title="Interactive simulation" action={<ResetButton onClick={reset} />}>
          <p className="text-sm leading-6 text-slate-500">
            A simple random sample gives every member of the population an equal chance of being selected. Click the button to draw a new sample.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <span>Population (N = {pop.N})</span>
            <span className="inline-flex items-center gap-1"><i className="sm-legend-dot bg-slate-300" /> Not in sample</span>
            <span className="inline-flex items-center gap-1"><i className="sm-legend-dot bg-violet-600" /> In sample</span>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
            <PopulationCanvas pop={pop} selected={ids} />
            <div className="space-y-3">
              <SmSlider label="Population size (N)" value={N} min={100} max={1000} step={20} onChange={setN} />
              <SmSlider label="Sample size (n)" value={n} min={5} max={N} step={1} onChange={setNSize} />
              <button type="button" className="sm-btn w-full" onClick={() => setDrawSeed((value) => value + 1)}>
                Draw random sample
              </button>
              <p className="text-sm font-semibold text-slate-600">
                Sample selected: {ids.length} out of {pop.N} ({formatPct(ids.length / pop.N)})
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 10, 100, 1000].map((count) => (
                  <button key={count} type="button" className="sm-btn sm-btn-ghost" onClick={() => setReps(count)}>
                    {count} sample{count === 1 ? '' : 's'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="πᵢ = n/N" value={formatNum(pi, 3)} />
            <MetricCard label="μ" value={formatNum(pop.mu)} />
            <MetricCard label="x̄" value={formatNum(xbar)} accent="#7c3aed" />
            <MetricCard label="SE(x̄)" value={formatNum(meanStandardError(pop.sigma, n, pop.N))} hint="with FPC" />
          </div>
          {repeat && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sampling distribution of x̄ ({reps} draws)</p>
              <Histogram values={repeat.stats} marker={pop.mu} label="Sampling distribution of the sample mean" />
              <p className="mt-2 text-sm text-slate-500">
                Mean of x̄ = {formatNum(repeat.mean)}, empirical SE = {formatNum(repeat.se)}, bias = {formatNum(repeat.bias)}.
                SRS is unbiased for μ; larger n generally reduces the spread of this distribution.
              </p>
            </div>
          )}
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList
            items={[
              { title: 'Equal chance', body: 'Every member of the population has the same probability of being selected (πᵢ = n/N).', icon: <span className="font-black text-blue-600">=</span> },
              { title: 'Randomness', body: 'Selection is based on chance, not personal judgment, to avoid selection bias.', icon: <span className="text-blue-600">⚀</span> },
              { title: 'Sample size', body: 'Larger samples tend to be more representative and produce more precise estimates — they do not guarantee a perfect picture.', icon: <span className="text-blue-600">▣</span> },
              { title: 'Representativeness', body: 'A well-chosen random sample helps the sample reflect the characteristics of the population.', icon: <span className="text-blue-600">◎</span> },
            ]}
          />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A school has {WORKED.srs.N} students. We want to randomly select {WORKED.srs.n} students to complete a survey about study habits.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Number each student from 1 to {WORKED.srs.N}.</li>
            <li>Use a random number generator to select {WORKED.srs.n} unique numbers between 1 and {WORKED.srs.N}.</li>
            <li>Invite the students with those numbers to participate.</li>
          </ol>
          <p className="mt-3 text-sm text-slate-600">
            πᵢ = {WORKED.srs.n}/{WORKED.srs.N} = {formatNum(WORKED.srs.n / WORKED.srs.N, 4)}. Because every student has that equal chance, this is a simple random sample.
          </p>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A town has 1,500 households. A researcher selects 100 unique households. What is the probability that a particular household is selected?',
                options: ['1 in 100 (0.01)', '1 in 15 (0.0667)', '1 in 1,500 (0.00067)', '1 in 10 (0.10)'],
                answer: 1,
                explanation: 'πᵢ = 100/1,500 = 1/15 ≈ 0.0667.',
              },
              {
                prompt: 'If you draw many SRS means from the same population, their average should sit near…',
                options: ['0', 'n/N', 'μ', 'the first sample mean'],
                answer: 2,
                explanation: 'The sample mean is unbiased for μ under SRS, so the sampling distribution is centered at μ.',
              },
              {
                prompt: 'f = n/N is called the…',
                options: ['design effect', 'sampling fraction', 'margin of error', 'cluster size'],
                answer: 1,
                explanation: 'The sampling fraction is the share of the population included in the sample.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
