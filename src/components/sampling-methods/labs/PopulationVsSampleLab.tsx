import { useMemo, useState } from 'react'
import {
  createPopulation,
  formatNum,
  nextSampleSize,
  sampleMean,
  sampleSrs,
  SeededRng,
  WORKED,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard, SmSelect, SmSlider } from '../shared'
import { PopulationCanvas } from '../plots'

const LEARN_ITEMS = [
  { title: 'Population', body: 'The entire group of individuals, objects, or measurements of interest, written N.', icon: <span className="text-blue-600">●</span> },
  { title: 'Sample', body: 'A subset of n units selected to represent the larger group.', icon: <span className="text-violet-600">●</span> },
  { title: 'Census', body: 'A study that collects data from every member of the population. Then x̄ equals μ.', icon: <span className="text-slate-500">▣</span> },
  { title: 'Representativeness', body: 'A well-chosen sample can reflect the key characteristics of the population closely enough for inference.', icon: <span className="text-blue-500">◎</span> },
]

export function PopulationVsSampleLab({ tab }: { tab: SmTab }) {
  const [N, setN] = useState(200)
  const [n, setNSize] = useState(20)
  const [seed, setSeed] = useState(11)
  const [drawSeed, setDrawSeed] = useState(101)
  const pop = useMemo(() => createPopulation({ N, seed, clusterCount: 8 }), [N, seed])
  const ids = useMemo(() => sampleSrs(pop, n, new SeededRng(drawSeed)), [pop, n, drawSeed])
  const xbar = sampleMean(pop, ids)
  const err = xbar - pop.mu
  const isCensus = n >= pop.N

  const reset = () => {
    setN(200)
    setNSize(20)
    setSeed(11)
    setDrawSeed(101)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="The idea">
          <p className="text-sm leading-6 text-slate-600">
            A population is the whole group you care about. A sample is the part you actually measure. The population mean μ is a parameter. The sample mean x̄ is a statistic.
          </p>
          <FormulaBlock tex={'\\bar{x}-\\mu'} label="Sample mean minus population mean" />
        </SmCard>
        <SmCard title="Why we sample">
          <Insight title="Try this">
            Take a sample, increase n, then run a census. The gap x̄ − μ generally shrinks as n grows, and it is exactly 0 for a census of this finite population.
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
              prompt: 'A researcher wants to study the study habits of all high school students in a city. Which option best describes a sample?',
              options: [
                'All high school students in the city',
                'A randomly selected group of high school students in the city',
                'The entire list of schools in the city',
                'Every student who volunteers to participate',
              ],
              answer: 1,
              explanation: 'The population is every high school student in the city. A sample is a selected subset of those students.',
            },
            {
              prompt: 'In this lab, what happens to x̄ − μ when you take a census of the finite population?',
              options: ['It stays random', 'It equals 0', 'It doubles', 'It becomes undefined'],
              answer: 1,
              explanation: 'A census measures every unit, so the sample mean is the population mean.',
            },
            {
              prompt: 'μ is a ______; x̄ is a ______.',
              options: ['statistic; parameter', 'parameter; statistic', 'sample; census', 'bias; error'],
              answer: 1,
              explanation: 'Parameters describe populations. Statistics are computed from samples.',
            },
          ]}
        />
      </SmCard>
    )
  }

  return (
    <LabSplit
      demo={
        <SmCard
          title="Interactive simulation"
          action={<ResetButton onClick={reset} />}
        >
          <p className="text-sm leading-6 text-slate-500">
            A population is the entire group. A sample is a subset selected from that population. Compare μ with x̄ on the actual scores.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <span>Population (N = {pop.N})</span>
            <span className="inline-flex items-center gap-1"><i className="sm-legend-dot bg-slate-300" /> Not in sample</span>
            <span className="inline-flex items-center gap-1"><i className="sm-legend-dot bg-violet-600" /> In sample</span>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
            <PopulationCanvas pop={pop} selected={ids} />
            <div className="space-y-3">
              <SmSlider label="Sample size" value={n} min={5} max={pop.N} step={1} onChange={setNSize} display={String(n)} />
              <SmSelect
                label="Sampling method"
                value="srs"
                onChange={() => undefined}
                options={[{ value: 'srs', label: 'Simple random sample' }]}
              />
              <button type="button" className="sm-btn w-full" onClick={() => setDrawSeed((value) => value + 1)}>
                Select new sample
              </button>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setDrawSeed((value) => value + 1)}>
                  Another
                </button>
                <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setNSize(nextSampleSize(n, pop.N))}>
                  Increase n
                </button>
                <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setNSize(pop.N)}>
                  Census
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-600">
                Sample selected: {ids.length} out of {pop.N} ({formatNum((ids.length / pop.N) * 100, 1)}% of the population)
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4" aria-live="polite">
            <MetricCard label="μ" value={formatNum(pop.mu)} hint="Population mean" />
            <MetricCard label="x̄" value={formatNum(xbar)} hint="Sample mean" accent="#7c3aed" />
            <MetricCard label="x̄ − μ" value={formatNum(err)} hint={isCensus ? 'Census: exact' : 'Sampling error'} />
            <MetricCard label="n / N" value={formatNum(n / pop.N, 3)} />
          </div>
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList items={LEARN_ITEMS} />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A university has {WORKED.pvs.N.toLocaleString()} students (the population). A researcher selects a random sample of {WORKED.pvs.n} students to estimate the proportion who use public transportation.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Population: all {WORKED.pvs.N.toLocaleString()} students (N = {WORKED.pvs.N.toLocaleString()})</li>
            <li>Sample: {WORKED.pvs.n} selected students (n = {WORKED.pvs.n})</li>
            <li>If {WORKED.pvs.transitCount} of those {WORKED.pvs.n} use public transit, p̂ = {WORKED.pvs.transitCount}/{WORKED.pvs.n} = {formatNum(WORKED.pvs.transitCount / WORKED.pvs.n, 2)}</li>
          </ul>
          <Insight title="Takeaway">A well-chosen sample can give usable insight about the population without surveying everyone.</Insight>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A researcher wants to study the study habits of all high school students in a city. Which option best describes a sample?',
                options: [
                  'All high school students in the city',
                  'A randomly selected group of high school students in the city',
                  'The entire list of schools in the city',
                  'Every student who volunteers to participate',
                ],
                answer: 1,
                explanation: 'The sample is a selected subset of the city-wide student population.',
              },
              {
                prompt: 'What quantity in this lab is the parameter?',
                options: ['n', 'x̄', 'μ', 'x̄ − μ'],
                answer: 2,
                explanation: 'μ is the population mean — a parameter. x̄ is the statistic computed from the sample.',
              },
              {
                prompt: 'Increasing n generally…',
                options: [
                  'removes all error',
                  'reduces sampling variability',
                  'increases bias',
                  'changes μ',
                ],
                answer: 1,
                explanation: 'Larger n generally reduces sampling variability. It does not fix systematic bias, and it does not change μ.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
