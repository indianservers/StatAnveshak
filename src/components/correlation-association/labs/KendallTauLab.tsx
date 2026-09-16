import { useMemo, useState } from 'react'
import {
  classifyPair,
  formatNum,
  generatePreset,
  kendallBreakdown,
  kendallPairs,
  type CaTab,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { MiniCloud, ScatterPlot } from '../plots'

export function KendallTauLab({ tab }: { tab: CaTab }) {
  const [preset, setPreset] = useState<'kendall-small' | 'ranks-tied' | 'strong-pos'>('kendall-small')
  const [pairIndex, setPairIndex] = useState(0)
  const [seed, setSeed] = useState(2)

  const points = useMemo(() => generatePreset(preset === 'strong-pos' ? 'strong-pos' : preset, preset === 'strong-pos' ? 8 : 5, seed), [preset, seed])
  const pairs = useMemo(() => kendallPairs(points), [points])
  const shownPairs = pairs.slice(0, 28)
  const selected = shownPairs[Math.min(pairIndex, Math.max(0, shownPairs.length - 1))]
  const breakdown = useMemo(
    () => kendallBreakdown(points.map((p) => p.x), points.map((p) => p.y)),
    [points],
  )

  const reset = () => {
    setPreset('kendall-small')
    setPairIndex(0)
    setSeed(2)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="Formula and definition">
          <p className="text-sm leading-6 text-slate-600">
            This lab reports Kendall’s τ-b. Concordant pairs move in the same direction; discordant pairs move in opposite
            directions. Ties on X or Y are neither, and τ-b adjusts the denominator for those ties.
          </p>
          <FormulaBlock tex={'\\tau_b=\\dfrac{C-D}{\\sqrt{(n_0-T_x)(n_0-T_y)}}'} label="Kendall tau-b" />
        </CaCard>
        <CaCard title="Why not draw every pair?">
          <Insight title="Small n on purpose">
            Five points give 10 pairs. Eight points give 28. We highlight one pair at a time instead of drawing thousands
            of SVG lines.
          </Insight>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          For this cloud, n = {breakdown.n}, pairs = {breakdown.pairs}, C = {breakdown.concordant}, D = {breakdown.discordant}.
          τ-b = {formatNum(breakdown.tau, 3)}. Variant: {breakdown.variant}.
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
              prompt: 'A pair is concordant when…',
              options: [
                'the two points have the same X',
                'X and Y both increase or both decrease from one point to the other',
                'Pearson r is positive',
                'the pair is tied on Y',
              ],
              answer: 1,
              explanation: 'Concordance is about the signs of Δx and Δy matching.',
            },
            {
              prompt: 'This studio reports which Kendall variant?',
              options: ['τ-a only', 'τ-b, with ties in the denominator', 'τ-c', 'Pearson of ranks'],
              answer: 1,
              explanation: 'τ-b is labeled explicitly so it is not mixed with τ-a.',
            },
          ]}
        />
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore concordant and discordant pairs" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Dataset"
              value={preset}
              onChange={(value) => {
                setPreset(value as typeof preset)
                setPairIndex(0)
              }}
              options={[
                { value: 'kendall-small', label: 'Five exam scores' },
                { value: 'ranks-tied', label: 'Tied ranks' },
                { value: 'strong-pos', label: 'Eight-point positive cloud' },
              ]}
            />
            {selected && (
              <CaSelect
                label="Selected pair"
                value={String(pairIndex)}
                onChange={(value) => setPairIndex(Number(value))}
                options={shownPairs.map((pair, index) => ({
                  value: String(index),
                  label: `${pair.a.id} (${formatNum(pair.a.x, 1)}, ${formatNum(pair.a.y, 1)}) vs ${pair.b.id} (${formatNum(pair.b.x, 1)}, ${formatNum(pair.b.y, 1)})`,
                }))}
              />
            )}
            <button type="button" className="corr-btn w-full" onClick={() => setPairIndex((index) => (index + 1) % shownPairs.length)}>
              Next pair
            </button>
            <p className="text-xs text-slate-400">Variant: Kendall {breakdown.variant}. Ties are labeled, not silently dropped into C or D.</p>
          </div>
        </CaCard>
      }
      plot={
        <CaCard title="Pairwise comparison (ranks or values)">
          <ScatterPlot
            points={points}
            xLabel="X"
            yLabel="Y"
            showTrend={false}
            highlightIds={selected ? [selected.a.id, selected.b.id] : []}
            pairKind={selected?.kind}
            selectedId={selected?.a.id}
          />
          {selected && (
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {selected.kind === 'concordant' && 'Concordant pair — X and Y move in the same direction.'}
              {selected.kind === 'discordant' && 'Discordant pair — X and Y move in opposite directions.'}
              {selected.kind === 'tie-x' && 'Tie on X — this pair is neither concordant nor discordant.'}
              {selected.kind === 'tie-y' && 'Tie on Y — this pair is neither concordant nor discordant.'}
              {selected.kind === 'tie-both' && 'Tie on both coordinates.'}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="C" value={String(breakdown.concordant)} />
            <Metric label="D" value={String(breakdown.discordant)} />
            <Metric label="Ties" value={String(breakdown.tieX + breakdown.tieY + breakdown.tieBoth)} />
            <Metric label="τ-b" value={formatNum(breakdown.tau, 3)} />
          </div>
        </CaCard>
      }
      aside={
        <CaCard title="Understanding concordant and discordant pairs">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="plus" title="Concordant">Δx and Δy have the same sign.</ConceptRow>
              <MiniCloud kind="pos" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="minus" title="Discordant">Δx and Δy have opposite signs.</ConceptRow>
              <MiniCloud kind="neg" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="pair" title="Ties">If X or Y is tied, the pair is excluded from C and D.</ConceptRow>
              <MiniCloud kind="none" />
            </div>
          </div>
        </CaCard>
      }
      bottom={
        <CaCard title="Key concepts">
          <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <li>Rank-based — compares orderings, not squared distances.</li>
            <li>Robust — less pulled by a single wild gap than Pearson.</li>
            <li>Monotonic — captures increasing or decreasing order.</li>
            <li>Check: classifyPair on the selected pair is {selected ? classifyPair(selected.a, selected.b) : '—' }.</li>
          </ul>
        </CaCard>
      }
    />
  )
}
