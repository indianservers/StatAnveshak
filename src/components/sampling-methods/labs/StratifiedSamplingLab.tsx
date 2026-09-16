import { useMemo, useState } from 'react'
import {
  allocateEqual,
  allocateProportional,
  createPopulation,
  formatNum,
  formatPct,
  sampleMean,
  sampleStratified,
  SeededRng,
  STRATA_GROUPS,
  stratifiedEstimate,
  WORKED,
  type AllocationMode,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard, SmSelect, SmSlider } from '../shared'
import { PopulationCanvas } from '../plots'

export function StratifiedSamplingLab({ tab }: { tab: SmTab }) {
  const [Nh, setNh] = useState<[number, number, number]>([120, 100, 80])
  const [n, setNSize] = useState(60)
  const [mode, setMode] = useState<AllocationMode>('proportional')
  const [custom, setCustom] = useState<[number, number, number]>([24, 20, 16])
  const [drawSeed, setDrawSeed] = useState(4)
  const N = Nh[0] + Nh[1] + Nh[2]
  const groups = useMemo(
    () =>
      STRATA_GROUPS.map((group, index) => ({
        ...group,
        share: Nh[index] / N,
      })),
    [Nh, N],
  )
  const pop = useMemo(() => createPopulation({ N, seed: 19, groups, clusterCount: 6 }), [N, groups])
  const planned = mode === 'equal' ? allocateEqual(3, n) : mode === 'proportional' ? allocateProportional(Nh, n) : custom
  const allocation = { S1: planned[0], S2: planned[1], S3: planned[2] }
  const ids = useMemo(() => sampleStratified(pop, allocation, new SeededRng(drawSeed)), [pop, planned, drawSeed])
  const est = stratifiedEstimate(pop, ids)
  const raw = sampleMean(pop, ids)

  const reset = () => {
    setNh([120, 100, 80])
    setNSize(60)
    setMode('proportional')
    setCustom([24, 20, 16])
    setDrawSeed(4)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="Sample from every stratum">
          <p className="text-sm leading-6 text-slate-600">
            Stratified sampling splits the population into non-overlapping subgroups, then draws a random sample inside each one. That is the opposite of cluster sampling, which selects only some groups.
          </p>
          <FormulaBlock tex={'\\bar{x}_{st}=\\sum_h W_h\\bar{x}_h\\qquad W_h=N_h/N'} label="Stratified mean" />
        </SmCard>
        <SmCard title="Allocation">
          <Insight title="Try this">
            Proportional allocation sets nₕ ≈ n × Nₕ/N. Equal allocation gives each stratum the same nₕ. Custom lets you oversample a small but important group.
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
              prompt: 'A company has 500 employees: 200 in Sales, 180 in Engineering, and 120 in HR. For a stratified sample of 90 using proportional allocation, how many employees should come from Sales?',
              options: ['24', '30', '36', '40'],
              answer: 2,
              explanation: 'n_Sales = 90 × (200/500) = 36.',
            },
            {
              prompt: 'Wₕ equals…',
              options: ['nₕ/n', 'Nₕ/N', 'x̄ₕ', 'N/n'],
              answer: 1,
              explanation: 'The stratum weight is the stratum’s share of the population, Nₕ/N.',
            },
            {
              prompt: 'How is stratified sampling different from cluster sampling?',
              options: [
                'Stratified sampling selects some groups and ignores the rest',
                'Stratified sampling samples from every stratum',
                'They are the same design',
                'Stratified sampling never uses random selection',
              ],
              answer: 1,
              explanation: 'Every stratum contributes units. Cluster sampling selects only some clusters.',
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
            Adjust the size of each stratum and the sample size to see how stratified sampling works. A random sample is drawn from each stratum separately.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <span>Population (N = {pop.N})</span>
            {pop.groups.map((group, index) => (
              <span key={group.id} className="inline-flex items-center gap-1">
                <i className="sm-legend-dot" style={{ background: group.color }} /> {group.label} ({Nh[index]})
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
            <PopulationCanvas pop={pop} selected={ids} colorBy="group" />
            <div className="space-y-3">
              <SmSelect
                label="Allocation"
                value={mode}
                onChange={(value) => setMode(value as AllocationMode)}
                options={[
                  { value: 'proportional', label: 'Proportional' },
                  { value: 'equal', label: 'Equal' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
              {Nh.map((size, index) => (
                <SmSlider
                  key={pop.groups[index].id}
                  label={`${pop.groups[index].label} size (Nₕ)`}
                  value={size}
                  min={40}
                  max={200}
                  step={5}
                  onChange={(value) => {
                    const next: [number, number, number] = [...Nh]
                    next[index] = value
                    setNh(next)
                  }}
                />
              ))}
              <SmSlider label="Total sample size (n)" value={n} min={15} max={Math.min(180, N)} step={3} onChange={setNSize} />
              {mode === 'custom' &&
                custom.map((size, index) => (
                  <SmSlider
                    key={`c-${index}`}
                    label={`${pop.groups[index].label} sample nₕ`}
                    value={size}
                    min={1}
                    max={Nh[index]}
                    step={1}
                    onChange={(value) => {
                      const next: [number, number, number] = [...custom]
                      next[index] = value
                      setCustom(next)
                    }}
                  />
                ))}
              <button type="button" className="sm-btn w-full" onClick={() => setDrawSeed((value) => value + 1)}>
                Draw stratified sample
              </button>
              <p className="text-sm font-semibold text-slate-600">
                Sample selected: {ids.length} of {pop.N} ({formatPct(ids.length / pop.N)}) · nₕ = {planned.join(', ')}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="x̄_st" value={formatNum(est.xbarSt)} hint="Σ Wₕ x̄ₕ" accent="#2563eb" />
            <MetricCard label="Simple x̄" value={formatNum(raw)} hint="unweighted" />
            <MetricCard label="W₁, W₂, W₃" value={pop.groups.map((group) => formatNum(est.weights[group.id], 2)).join(', ')} />
            <MetricCard label="μ" value={formatNum(pop.mu)} />
          </div>
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList
            items={[
              { title: 'Strata', body: 'The population is divided into non-overlapping subgroups (strata) that share a characteristic.', icon: <span className="text-blue-600">☰</span> },
              { title: 'Proportional allocation', body: 'The sample from each stratum is proportional to the stratum size (same percentage of every group).', icon: <span className="text-violet-600">%</span> },
              { title: 'Representativeness', body: 'Every important group is included, which can reduce the risk of missing a part of the population.', icon: <span className="text-emerald-600">◎</span> },
              { title: 'When to use it', body: 'Use stratification when the population has distinct subgroups — grade levels, departments, or regions — and you want all of them in the sample.', icon: <span className="text-blue-600">ⓘ</span> },
            ]}
          />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A high school has 300 students: 120 in 9th grade, 100 in 10th grade, and 80 in 11th grade. The school wants to survey 60 students using stratified sampling with proportional allocation.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Stratum 1 (9th grade): 120/300 = 40% → 24 students</li>
            <li>Stratum 2 (10th grade): 100/300 ≈ 33.3% → 20 students</li>
            <li>Stratum 3 (11th grade): 80/300 ≈ 26.7% → 16 students</li>
          </ul>
          <Insight title="Why this helps">Sampling from every grade includes a representative mix and reduces the risk of missing important differences among grades.</Insight>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A company has 500 employees: 200 in Sales, 180 in Engineering, and 120 in HR. For a stratified sample of 90 using proportional allocation, how many should come from Sales?',
                options: ['24', '30', '36', '40'],
                answer: 2,
                explanation: '90 × 200/500 = 36.',
              },
              {
                prompt: 'If allocation is equal and n = 60 with 3 strata, nₕ is…',
                options: ['24, 20, 16', '20, 20, 20', '30, 20, 10', '60, 0, 0'],
                answer: 1,
                explanation: 'Equal allocation splits n as evenly as possible: 20 per stratum.',
              },
              {
                prompt: 'x̄_st uses…',
                options: ['equal weights', 'population weights Wₕ = Nₕ/N', 'sample shares nₕ/n only', 'cluster totals'],
                answer: 1,
                explanation: 'The stratified mean is the weighted sum of stratum means, with weights Nₕ/N.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
