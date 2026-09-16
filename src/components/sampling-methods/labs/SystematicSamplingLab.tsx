import { useMemo, useState } from 'react'
import {
  createPopulation,
  formatNum,
  sampleMean,
  sampleSystematic,
  systematicInterval,
  systematicPositions,
  WORKED,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard, SmSlider } from '../shared'
import { OrderedDots, PopulationCanvas } from '../plots'

export function SystematicSamplingLab({ tab }: { tab: SmTab }) {
  const [N, setN] = useState(20)
  const [n, setNSize] = useState(4)
  const [start, setStart] = useState(3)
  const [period, setPeriod] = useState(0)
  const k = systematicInterval(N, n)
  const pop = useMemo(
    () =>
      createPopulation({
        N,
        seed: 3,
        clusterCount: 4,
        periodicEvery: period > 0 ? period : undefined,
        highValue: 92,
        lowValue: 58,
      }),
    [N, period],
  )
  const ids = useMemo(() => sampleSystematic(pop, k, start), [pop, k, start])
  const xbar = sampleMean(pop, ids)
  const locked = period > 0 && period === k

  const reset = () => {
    setN(20)
    setNSize(4)
    setStart(3)
    setPeriod(0)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="Every k-th unit after a random start">
          <p className="text-sm leading-6 text-slate-600">
            Systematic sampling orders the frame, draws a random start r between 1 and k, then takes r, r+k, r+2k, … until the list ends.
          </p>
          <FormulaBlock tex={'k\\approx N/n\\qquad i_j=r+(j-1)k'} label="Interval and positions" />
        </SmCard>
        <SmCard title="Periodicity risk">
          <Insight title="Try this">
            Turn on a hidden period equal to k. The sample can lock onto only the high (or only the low) units in the cycle. That is a design problem, not bad luck from one draw.
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
              prompt: 'A researcher has a list of 300 library visitors in the order they arrived. They want a sample of 30 visitors using systematic sampling with a random start of 4. Which positions will be included?',
              options: ['4, 14, 24, …, 294', '4, 34, 64, …, 294', '1, 11, 21, …, 291', '4, 34, 64, …, 304'],
              answer: 0,
              explanation: 'k = 300/30 = 10, so the positions are 4, 14, 24, …, 294.',
            },
            {
              prompt: 'The random start r is chosen from…',
              options: ['1 through N', '1 through k', 'only even IDs', 'the largest cluster'],
              answer: 1,
              explanation: 'r is drawn uniformly from 1, 2, …, k so that every unit has a chance to be first.',
            },
            {
              prompt: 'Periodicity is a problem when…',
              options: [
                'n is even',
                'the list has a repeating pattern that matches k',
                'μ equals x̄',
                'you use a census',
              ],
              answer: 1,
              explanation: 'If the hidden cycle length equals k, the sample can hit the same part of the pattern every time.',
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
            Create a systematic sample by selecting every k-th member from an ordered list after a random start. Adjust the parameters to see how the sample changes.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Ordered population (N = {pop.N})</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
            <div>
              {N <= 60 ? <OrderedDots N={N} selected={ids} /> : <PopulationCanvas pop={pop} selected={ids} height={160} />}
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1"><i className="sm-legend-dot bg-violet-600" /> Selected for sample</span>
                <span className="inline-flex items-center gap-1"><i className="sm-legend-dot bg-slate-200" /> Not selected</span>
              </div>
            </div>
            <div className="space-y-3">
              <SmSlider label="Population size (N)" value={N} min={20} max={200} step={5} onChange={setN} />
              <SmSlider label="Sample size (n)" value={n} min={2} max={Math.floor(N / 2)} step={1} onChange={setNSize} display={`${n}  ·  k = ${k}`} />
              <SmSlider label="Random start (r)" value={start} min={1} max={k} step={1} onChange={setStart} />
              <SmSlider
                label="Hidden period (0 = off)"
                value={period}
                min={0}
                max={k}
                step={1}
                onChange={setPeriod}
                display={period === 0 ? 'Off' : String(period)}
              />
              <p className="text-sm font-semibold text-slate-600">
                Sample selected: {ids.length} out of {pop.N} (positions {ids.slice(0, 8).join(', ')}
                {ids.length > 8 ? ', …' : ''})
              </p>
              {locked && (
                <Insight title="Periodicity risk">
                  The list repeats every {period} units, which matches k = {k}. This sample is locked to one part of the cycle, so x̄ can stay far from μ even after you change the start only within that cycle.
                </Insight>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="k" value={String(k)} />
            <MetricCard label="r" value={String(start)} />
            <MetricCard label="μ" value={formatNum(pop.mu)} />
            <MetricCard label="x̄" value={formatNum(xbar)} accent="#7c3aed" />
          </div>
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList
            items={[
              { title: 'Sampling interval (k)', body: 'The fixed step that determines the spacing between selected members. Here k ≈ N/n.', icon: <span className="font-black text-blue-600">k</span> },
              { title: 'Random start (r)', body: 'A randomly chosen starting position between 1 and k, so the sample is not a hand-picked sequence.', icon: <span className="text-blue-600">⚀</span> },
              { title: 'Ordered list', body: 'The population must already sit in a meaningful order — time, location, or ID — before you walk it.', icon: <span className="text-slate-500">☰</span> },
              { title: 'Periodicity risk', body: 'If the population has a repeating pattern that matches the sampling interval, the sample can be biased.', icon: <span className="text-amber-600">!</span> },
            ]}
          />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A store has {WORKED.systematic.N} products arranged in order on shelves. The manager wants a sample of {WORKED.systematic.n} products using systematic sampling. They choose a random start of {WORKED.systematic.start} and every {WORKED.systematic.k}-th product.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Population: {WORKED.systematic.N} products</li>
            <li>Sampling interval: k = {WORKED.systematic.N}/{WORKED.systematic.n} = {WORKED.systematic.k}</li>
            <li>Random start: {WORKED.systematic.start}</li>
            <li>Sample positions: {systematicPositions(WORKED.systematic.N, WORKED.systematic.k, WORKED.systematic.start).slice(0, 4).join(', ')}, …, {systematicPositions(WORKED.systematic.N, WORKED.systematic.k, WORKED.systematic.start).at(-1)}</li>
            <li>Sample size: {WORKED.systematic.n} products</li>
          </ul>
          <Insight title="Why people use it">Systematic sampling is efficient and easy to implement, especially with large, ordered populations — as long as the list is not periodic with period k.</Insight>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A researcher has a list of 300 library visitors in arrival order. They want n = 30 with random start 4. Which positions are included?',
                options: ['4, 14, 24, …, 294', '4, 34, 64, …, 294', '1, 11, 21, …, 291', '4, 34, 64, …, 304'],
                answer: 0,
                explanation: 'k = 10, so add 10 each time from 4 through 294.',
              },
              {
                prompt: 'If N = 20, n = 4, then k is…',
                options: ['4', '5', '8', '20'],
                answer: 1,
                explanation: 'k = floor(20/4) = 5.',
              },
              {
                prompt: 'A hidden weekly cycle with k = 7 can bias a systematic sample because…',
                options: [
                  'n is too small',
                  'every selected day of week can be the same',
                  'μ cannot be computed',
                  'clusters are required',
                ],
                answer: 1,
                explanation: 'The interval matches the period, so the sample can land on only Mondays, or only peak hours, and stay there.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
