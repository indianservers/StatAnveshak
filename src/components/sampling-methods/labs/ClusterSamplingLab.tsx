import { useMemo, useState } from 'react'
import {
  createPopulation,
  designEffect,
  formatNum,
  formatPct,
  intraClassCorrelation,
  pickClusters,
  sampleClusters,
  sampleMean,
  SeededRng,
  WORKED,
  type ClusterStage,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard, SmSelect, SmSlider } from '../shared'
import { ClusterGrid } from '../plots'

export function ClusterSamplingLab({ tab }: { tab: SmTab }) {
  const [clusterCount, setClusterCount] = useState(8)
  const [perCluster, setPerCluster] = useState(20)
  const [c, setC] = useState(3)
  const [stage, setStage] = useState<ClusterStage>(1)
  const [m, setM] = useState(8)
  const [drawSeed, setDrawSeed] = useState(6)
  const N = clusterCount * perCluster
  const pop = useMemo(
    () => createPopulation({ N, seed: 14, clusterCount, icc: 0.25 }),
    [N, clusterCount],
  )
  const clusters = useMemo(() => pickClusters(pop, c, new SeededRng(drawSeed)), [pop, c, drawSeed])
  const ids = useMemo(() => sampleClusters(pop, clusters, stage, m, new SeededRng(drawSeed + 1)), [pop, clusters, stage, m, drawSeed])
  const rho = intraClassCorrelation(pop)
  const deff = designEffect(stage === 1 ? perCluster : m, rho)
  const xbar = sampleMean(pop, ids)

  const reset = () => {
    setClusterCount(8)
    setPerCluster(20)
    setC(3)
    setStage(1)
    setM(8)
    setDrawSeed(6)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="Sample some groups, not every group">
          <p className="text-sm leading-6 text-slate-600">
            Cluster sampling selects entire groups — classrooms, neighborhoods, stores — then measures units inside those groups. Unlike stratified sampling, some clusters are left out completely.
          </p>
          <FormulaBlock tex={'\\mathrm{DEFF}\\approx 1+(m-1)\\rho'} label="Approximate design effect" />
        </SmCard>
        <SmCard title="Design effect">
          <Insight title="Read this carefully">
            ρ (the intra-class correlation) measures how alike units inside a cluster are. When ρ is high, a cluster sample of size n is usually less precise than an SRS of the same n. DEFF ≈ 1 translates the extra variance. This is an approximation, not a guarantee.
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
              prompt: 'A city wants to estimate the average number of hours people spend on recreation each week. The city randomly selects neighborhoods and surveys several adults in those neighborhoods. What is the main advantage of cluster sampling in this situation?',
              options: [
                'It enumerates a larger sample size',
                'It reduces the cost compared with surveying individuals all over the city',
                'It provides a perfectly representative sample',
                'It eliminates sampling error',
              ],
              answer: 1,
              explanation: 'Clusters are cheaper to reach. The tradeoff is that high ICC can raise variance compared with SRS of the same n.',
            },
            {
              prompt: 'In one-stage cluster sampling you…',
              options: [
                'sample from every cluster',
                'take all units in the selected clusters',
                'always have DEFF = 1',
                'must use proportional allocation',
              ],
              answer: 1,
              explanation: 'One-stage: choose clusters, then take everyone inside them. Two-stage: then subsample within clusters.',
            },
            {
              prompt: 'If ρ is large, cluster sampling typically…',
              options: ['has DEFF near 1', 'is more precise than SRS', 'raises variance relative to SRS of the same n', 'removes bias'],
              answer: 2,
              explanation: 'Similar units inside a cluster add less new information, so variance often increases.',
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
            A population is divided into clusters (for example neighborhoods or classrooms). You select entire clusters, and members within those selected clusters are included — all of them in one-stage sampling, or a subsample in two-stage sampling.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Population: {clusterCount} clusters (total N = {pop.N})
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
            <ClusterGrid pop={pop} selectedClusters={clusters} />
            <div className="space-y-3">
              <SmSlider label="Number of clusters to select" value={c} min={1} max={clusterCount} step={1} onChange={setC} />
              <SmSelect
                label="Design"
                value={String(stage)}
                onChange={(value) => setStage(Number(value) as ClusterStage)}
                options={[
                  { value: '1', label: 'One-stage (take whole clusters)' },
                  { value: '2', label: 'Two-stage (subsample inside clusters)' },
                ]}
              />
              {stage === 2 && (
                <SmSlider label="Units per selected cluster (m)" value={m} min={2} max={perCluster} step={1} onChange={setM} />
              )}
              <button type="button" className="sm-btn w-full" onClick={() => setDrawSeed((value) => value + 1)}>
                Select {c} clusters randomly
              </button>
              <p className="text-sm font-semibold text-slate-600">
                Sample selected: {ids.length} of {pop.N} ({formatPct(ids.length / pop.N)}) · clusters {clusters.join(', ')}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="x̄" value={formatNum(xbar)} />
            <MetricCard label="μ" value={formatNum(pop.mu)} />
            <MetricCard label="ρ (ICC)" value={formatNum(rho, 3)} />
            <MetricCard label="DEFF" value={formatNum(deff, 2)} hint="≈ 1+(m−1)ρ" />
          </div>
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList
            items={[
              { title: 'Cluster', body: 'A natural group of individuals, such as a classroom, neighborhood, or geographic region.', icon: <span className="text-blue-600">◉</span> },
              { title: 'Sampling frame', body: 'A list of clusters in the population. You randomly select clusters from this list, not (at first) individuals.', icon: <span className="text-slate-500">☰</span> },
              { title: 'Cost efficiency', body: 'Cluster sampling is often cheaper when a complete list of individuals is impractical.', icon: <span className="text-blue-600">⚙</span> },
              { title: 'Common use cases', body: 'Education (classrooms), public health (neighborhoods), market research (stores), and geographic studies (cities).', icon: <span className="text-violet-600">▣</span> },
            ]}
          />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A researcher wants to study habits among high school students in a large district. The district has {WORKED.cluster.clusters} classrooms with {WORKED.cluster.perCluster} students each. The researcher randomly selects {WORKED.cluster.selected} classrooms and surveys all students in those classrooms.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Population: N = {WORKED.cluster.clusters * WORKED.cluster.perCluster} students in {WORKED.cluster.clusters} classrooms</li>
            <li>Clusters: classrooms</li>
            <li>Selected clusters: {WORKED.cluster.selected} classrooms</li>
            <li>Sample size: {WORKED.cluster.selected * WORKED.cluster.perCluster} = {formatPct((WORKED.cluster.selected * WORKED.cluster.perCluster) / (WORKED.cluster.clusters * WORKED.cluster.perCluster))} of the population</li>
            <li>Chance a classroom is selected: {WORKED.cluster.selected}/{WORKED.cluster.clusters} = {formatPct(WORKED.cluster.selected / WORKED.cluster.clusters)}</li>
          </ul>
          <Insight title="Tradeoff">This is efficient, but if students in the same classroom are very similar, precision is usually worse than an SRS of the same size.</Insight>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A city wants to estimate weekly recreation hours. It randomly selects neighborhoods and surveys adults there. What is the main advantage of cluster sampling here?',
                options: [
                  'It enumerates a larger sample size',
                  'It reduces the cost compared with surveying individuals across the whole city',
                  'It guarantees a perfectly representative sample',
                  'It eliminates sampling error',
                ],
                answer: 1,
                explanation: 'Traveling to a few neighborhoods is cheaper than visiting people scattered across the city.',
              },
              {
                prompt: 'Stratified vs cluster: which statement is true?',
                options: [
                  'Both select only some groups',
                  'Stratified sampling samples from every stratum; cluster sampling samples some clusters',
                  'Cluster sampling always has lower variance',
                  'They use the same estimator x̄_st',
                ],
                answer: 1,
                explanation: 'That is the key design difference.',
              },
              {
                prompt: 'DEFF ≈ 1+(m−1)ρ. If m = 20 and ρ = 0.2, DEFF ≈',
                options: ['1.2', '4.8', '20', '0.2'],
                answer: 1,
                explanation: '1 + 19 × 0.2 = 4.8. A cluster sample then behaves roughly like an SRS with n/4.8 effective observations.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
