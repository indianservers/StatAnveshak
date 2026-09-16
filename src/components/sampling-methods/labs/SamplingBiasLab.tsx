import { useMemo, useState } from 'react'
import {
  biasedSample,
  createPopulation,
  formatNum,
  groupShares,
  repeatStatistic,
  sampleMean,
  SeededRng,
  type BiasMechanism,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard } from '../shared'
import { ShareBars } from '../plots'

const MECHANISMS: Array<{ id: BiasMechanism; title: string; body: string }> = [
  { id: 'convenience', title: 'Convenience sampling', body: 'Select people who are easiest to reach — friends, people on campus, an online panel.' },
  { id: 'voluntary', title: 'Voluntary response', body: 'People choose themselves. Those with strong opinions or high interest are more likely to appear.' },
  { id: 'undercoverage', title: 'Undercoverage', body: 'Some members of the population are not in the sampling frame, so they have no chance of selection.' },
  { id: 'nonresponse', title: 'Nonresponse', body: 'Selected members do not respond, and the people who stay are systematically different.' },
]

export function SamplingBiasLab({ tab }: { tab: SmTab }) {
  const [mechanism, setMechanism] = useState<BiasMechanism>('convenience')
  const [n, setN] = useState(40)
  const [drawSeed, setDrawSeed] = useState(12)
  const pop = useMemo(() => createPopulation({ N: 240, seed: 21, clusterCount: 8 }), [])
  const ids = useMemo(() => biasedSample(pop, n, mechanism, new SeededRng(drawSeed)), [pop, n, mechanism, drawSeed])
  const popShares = groupShares(pop)
  const sampleShares = groupShares(pop, ids)
  const xbar = sampleMean(pop, ids)
  const repeats = useMemo(
    () => repeatStatistic(80, 33, (rng) => sampleMean(pop, biasedSample(pop, n, mechanism, rng)), pop.mu),
    [pop, n, mechanism],
  )

  const reset = () => {
    setMechanism('convenience')
    setN(40)
    setDrawSeed(12)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="Bias is a mechanism">
          <p className="text-sm leading-6 text-slate-600">
            Sampling bias happens when some members of a population are more likely to be selected than others. The result is a sample that does not represent the population — and drawing again does not fix it.
          </p>
        </SmCard>
        <SmCard title="It persists">
          <Insight title="Try this">
            Switch mechanisms and run 80 repeats. The average of x̄ stays away from μ. That persistent gap is bias, not ordinary sampling error.
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
              prompt: 'A researcher conducting a survey by asking people at a busy shopping mall about their favorite type of music. Which type of sampling bias is most likely?',
              options: ['No response bias', 'Undercoverage bias', 'Convenience sampling', 'Voluntary response'],
              answer: 2,
              explanation: 'Mall visitors are whoever is easy to reach at that place and time — a classic convenience sample.',
            },
            {
              prompt: 'Undercoverage means…',
              options: [
                'people refuse to answer',
                'part of the population is missing from the frame',
                'the interviewer records the wrong number',
                'n is too small',
              ],
              answer: 1,
              explanation: 'If a group is not on the list, those people cannot be selected, no matter how carefully you randomize the rest.',
            },
            {
              prompt: 'Repeating a biased mechanism many times will…',
              options: ['cancel the bias', 'keep a systematic gap from μ', 'always hit μ', 'only change variance'],
              answer: 1,
              explanation: 'Bias is about the process. Repeating the same broken process reproduces the same tilt.',
            },
          ]}
        />
      </SmCard>
    )
  }

  return (
    <LabSplit
      demo={
        <SmCard title="See how sampling bias changes results" action={<ResetButton onClick={reset} />}>
          <p className="text-sm leading-6 text-slate-500">
            Compare a population with a biased sample. Choose a type of sampling bias to see how the sample can differ from the true population.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ShareBars
              title={`Population (N = ${pop.N})`}
              labels={pop.groups.map((group) => group.label)}
              values={pop.groups.map((group) => popShares[group.id] ?? 0)}
              colors={pop.groups.map((group) => group.color)}
            />
            <ShareBars
              title={`Biased sample (n = ${ids.length})`}
              labels={pop.groups.map((group) => group.label)}
              values={pop.groups.map((group) => sampleShares[group.id] ?? 0)}
              colors={pop.groups.map((group) => group.color)}
            />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-700">Select a type of sampling bias</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {MECHANISMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMechanism(item.id)}
                className={`rounded-2xl border px-3 py-3 text-left ${
                  mechanism === item.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white dark:bg-slate-900'
                }`}
              >
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{item.body}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="sm-btn" onClick={() => setDrawSeed((value) => value + 1)}>
              Draw another biased sample
            </button>
            <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setN(n === 40 ? 80 : 40)}>
              n = {n === 40 ? 80 : 40}
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="μ" value={formatNum(pop.mu)} />
            <MetricCard label="x̄" value={formatNum(xbar)} accent="#d97706" />
            <MetricCard label="This draw bias" value={formatNum(xbar - pop.mu)} />
            <MetricCard label="80-draw mean bias" value={formatNum(repeats.bias)} hint={`MSE ${formatNum(repeats.mse)}`} />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Across 80 repeats the average x̄ is {formatNum(repeats.mean)}, so the mechanism stays {formatNum(repeats.bias)} away from μ.
            Growing n does not repair a broken frame or a voluntary process.
          </p>
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList
            items={[
              { title: 'Sampling bias', body: 'Occurs when some members of a population are more likely to be selected than others, leading to distorted results.', icon: <span className="text-amber-600">!</span> },
              { title: 'Undercoverage', body: 'Some members of the population are not included in the sampling frame and so have no chance of being selected.', icon: <span className="text-blue-600">◌</span> },
              { title: 'Nonresponse', body: 'Selected members do not respond, and the people who stay can differ from the people who leave.', icon: <span className="text-rose-600">✕</span> },
              { title: 'Reducing bias', body: 'Use random selection from a complete frame, follow up nonrespondents, and avoid samples of whoever is nearby.', icon: <span className="text-emerald-600">✓</span> },
            ]}
          />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A teacher posts a poll on a class social media page asking how many hours students study. Of 2,000 students, 500 who are already online respond. Their average is 12 hours; a careful classroom roster sample later finds about 8 hours.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Population: all 2,000 students</li>
            <li>Sample: 500 students who chose to respond</li>
            <li>Result: a voluntary-response sample, over-representing students who are online and willing to talk about studying</li>
          </ul>
          <Insight title="Conclusion">The sample is large and still systematically wrong. Size does not cancel a biased mechanism.</Insight>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A researcher surveys people at a busy shopping mall about favorite music. Which bias is most likely?',
                options: ['No response bias', 'Undercoverage bias', 'Convenience sampling', 'Voluntary response'],
                answer: 2,
                explanation: 'Whoever happens to be at the mall and willing to stop is easy to reach — convenience sampling.',
              },
              {
                prompt: 'Leaving households without phones out of a telephone frame is…',
                options: ['nonresponse', 'undercoverage', 'voluntary response', 'processing error'],
                answer: 1,
                explanation: 'Those households never enter the frame, so they cannot be selected.',
              },
              {
                prompt: 'In this lab, the 80-draw mean of x̄ staying off μ is evidence of…',
                options: ['only sampling variability', 'bias in the mechanism', 'a census', 'zero MSE'],
                answer: 1,
                explanation: 'Sampling error averages out. A systematic gap that remains is bias.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
