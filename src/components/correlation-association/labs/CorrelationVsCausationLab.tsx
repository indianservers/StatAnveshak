import { useMemo, useState } from 'react'
import {
  formatNum,
  generatePreset,
  pearsonR,
  summarizePair,
  type CaTab,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { Dag, MiniCloud, ScatterPlot } from '../plots'

const STORIES = [
  { id: 'confounder', label: 'Ice cream, drownings, temperature' },
  { id: 'direct', label: 'Direct cause (hours → score)' },
  { id: 'reverse', label: 'Reverse cause (score → hours)' },
  { id: 'trend', label: 'Common trend' },
  { id: 'simpson', label: 'Simpson-style groups' },
] as const

export function CorrelationVsCausationLab({ tab }: { tab: CaTab }) {
  const [story, setStory] = useState<(typeof STORIES)[number]['id']>('confounder')
  const [showZ, setShowZ] = useState(true)
  const [showTrend, setShowTrend] = useState(true)
  const [seed, setSeed] = useState(9)

  const points = useMemo(() => {
    if (story === 'simpson') return generatePreset('simpson', 40, seed)
    if (story === 'direct' || story === 'reverse') return generatePreset('study-exam', 40, seed)
    if (story === 'trend') return generatePreset('strong-pos', 40, seed)
    return generatePreset('ice-cream', 36, seed)
  }, [story, seed])
  const stats = useMemo(() => summarizePair(points), [points])
  const z = points.map((p) => p.z ?? 0)
  const rXZ = pearsonR(points.map((p) => p.x), z)
  const rYZ = pearsonR(points.map((p) => p.y), z)

  const reset = () => {
    setStory('confounder')
    setShowZ(true)
    setShowTrend(true)
    setSeed(9)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="Association can come from a cause">
          <p className="text-sm leading-6 text-slate-600">
            A real causal path can produce a correlation. So can a confounder, reverse causation, or a shared trend. The
            number does not name the diagram.
          </p>
          <FormulaBlock tex={'\\text{association}\\not\\Rightarrow\\text{identified cause}'} label="Association is not identification" />
        </CaCard>
        <CaCard title="A summer example">
          <Insight title="Ice cream and drownings">
            Both rise with temperature. The XY correlation is real. Revealing temperature changes the story without
            deleting the association.
          </Insight>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          Umbrella sales and wet streets can correlate because rainfall lifts both. Buying an umbrella does not make the
          pavement wet. The lurking variable is rain.
        </p>
      </CaCard>
    )
  }

  if (tab === 'quiz') {
    return (
      <CaCard title="Try it yourself">
        <QuizBlock
          items={[
            {
              prompt: 'Which statement is correct?',
              options: [
                'If two variables are correlated, one must cause the other.',
                'A lurking variable can create a correlation with no direct causal link between the pair.',
                'Correlation and causation are the same once r is large.',
                'A confounder always makes r equal 0.',
              ],
              answer: 1,
              explanation: 'Association is a clue. Identification needs a design or a justified causal model.',
            },
            {
              prompt: 'Ice cream sales and drowning deaths both rise in summer. The most careful reading is…',
              options: [
                'ice cream causes drownings',
                'the association can be explained by a shared temperature pattern',
                'the correlation must be fake',
                'r cannot be computed in summer',
              ],
              answer: 1,
              explanation: 'Temperature is a classic common cause. The XY association can still be numerically real.',
            },
          ]}
        />
      </CaCard>
    )
  }

  const dag = (() => {
    if (story === 'direct') {
      return {
        nodes: [
          { id: 'x', label: 'Hours', x: 80, y: 70 },
          { id: 'y', label: 'Score', x: 240, y: 70 },
        ],
        edges: [{ from: 'x', to: 'y' }],
      }
    }
    if (story === 'reverse') {
      return {
        nodes: [
          { id: 'x', label: 'Hours', x: 80, y: 70 },
          { id: 'y', label: 'Score', x: 240, y: 70 },
        ],
        edges: [{ from: 'y', to: 'x' }],
      }
    }
    if (story === 'trend') {
      return {
        nodes: [
          { id: 't', label: 'Time', x: 160, y: 32, tone: 'cause' as const },
          { id: 'x', label: 'X', x: 80, y: 100 },
          { id: 'y', label: 'Y', x: 240, y: 100 },
        ],
        edges: [
          { from: 't', to: 'x' },
          { from: 't', to: 'y' },
        ],
      }
    }
    if (story === 'simpson') {
      return {
        nodes: [
          { id: 'g', label: 'Group', x: 160, y: 32, tone: 'cause' as const },
          { id: 'x', label: 'X', x: 80, y: 100 },
          { id: 'y', label: 'Y', x: 240, y: 100 },
        ],
        edges: [
          { from: 'g', to: 'x' },
          { from: 'g', to: 'y' },
          { from: 'x', to: 'y', dashed: true },
        ],
      }
    }
    return {
      nodes: [
        { id: 'z', label: 'Temp', x: 160, y: 32, tone: 'cause' as const },
        { id: 'x', label: 'Ice', x: 70, y: 108 },
        { id: 'y', label: 'Drown', x: 250, y: 108 },
      ],
      edges: [
        { from: 'z', to: 'x', hidden: false },
        { from: 'z', to: 'y', hidden: false },
        { from: 'x', to: 'y', dashed: true },
      ],
    }
  })()

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore a real-world example" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Story"
              value={story}
              onChange={(value) => setStory(value as typeof story)}
              options={STORIES.map((item) => ({ value: item.id, label: item.label }))}
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={showZ} onChange={(event) => setShowZ(event.target.checked)} />
              Show confounding / common-cause node
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={showTrend} onChange={(event) => setShowTrend(event.target.checked)} />
              Show regression line
            </label>
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample summer
            </button>
          </div>
        </CaCard>
      }
      plot={
        <CaCard
          title="Scatter plot"
          action={<span className="text-xs font-bold text-slate-500">r = {formatNum(stats.pearson, 3)} · {stats.pearson > 0.5 ? 'strong positive' : 'association present'}</span>}
        >
          <ScatterPlot
            points={points}
            xLabel={story === 'confounder' ? 'Ice cream sales' : 'X'}
            yLabel={story === 'confounder' ? 'Drowning deaths' : 'Y'}
            showTrend={showTrend}
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="r(X,Y)" value={formatNum(stats.pearson, 3)} />
            <Metric label="r(X,Z)" value={showZ ? formatNum(rXZ, 3) : 'hidden'} />
            <Metric label="r(Y,Z)" value={showZ ? formatNum(rYZ, 3) : 'hidden'} />
          </div>
        </CaCard>
      }
      aside={
        <CaCard title="Correlation vs causation">
          <Dag nodes={dag.nodes} edges={dag.edges} reveal={showZ} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-bold text-slate-800">Correlation</p>
              <p>Two variables go together. The number does not say why.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-bold">Causation</p>
              <p>One variable produces a change in another. That needs a design or a justified DAG.</p>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <ConceptRow icon="cause" title="Everyday examples">Ice cream and drownings; umbrellas and wet streets.</ConceptRow>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-500">A lurking temperature or rainfall pattern can generate both series.</p>
              <MiniCloud kind="pos" />
            </div>
          </div>
        </CaCard>
      }
      bottom={
        <CaCard title="Key concepts">
          <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <li>Confounding — a common cause of X and Y.</li>
            <li>Reverse causation — the arrow may run the other way.</li>
            <li>Common trend — two series can drift together in time.</li>
            <li>Careful interpretation — association is a clue, not a verdict.</li>
          </ul>
        </CaCard>
      }
    />
  )
}
