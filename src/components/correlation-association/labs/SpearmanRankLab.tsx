import { useMemo, useState } from 'react'
import {
  associationLabel,
  averageRanks,
  formatNum,
  generatePreset,
  pearsonR,
  spearmanRho,
  summarizePair,
  WORKED,
  type CaTab,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { MiniCloud, ScatterPlot } from '../plots'

export function SpearmanRankLab({ tab }: { tab: CaTab }) {
  const [preset, setPreset] = useState<'spearman' | 'monotonic-nonlinear' | 'ranks-tied' | 'u-shape' | 'outlier'>('spearman')
  const [view, setView] = useState<'raw' | 'rank'>('rank')
  const [seed, setSeed] = useState(3)

  const raw = useMemo(() => {
    if (preset === 'spearman') {
      return WORKED.spearman.map((row, i) => ({ id: `s-${i + 1}`, x: row.x, y: row.y }))
    }
    return generatePreset(preset, preset === 'ranks-tied' ? 10 : 36, seed)
  }, [preset, seed])
  const ranks = useMemo(() => {
    const rx = averageRanks(raw.map((p) => p.x))
    const ry = averageRanks(raw.map((p) => p.y))
    return raw.map((point, i) => ({ ...point, x: rx[i], y: ry[i], extras: { rawX: point.x, rawY: point.y } }))
  }, [raw])
  const shown = view === 'rank' ? ranks : raw
  const stats = useMemo(() => summarizePair(raw), [raw])
  const rho = stats.spearman
  const r = stats.pearson

  const reset = () => {
    setPreset('spearman')
    setView('rank')
    setSeed(3)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="The Spearman formula">
          <p className="text-sm leading-6 text-slate-600">
            Spearman’s ρ is Pearson’s r computed on average ranks. Ties share a rank: 2, 5, 5, 9 become 1, 2.5, 2.5, 4.
            The popular 1 − 6Σd² / (n(n²−1)) form is for the no-tie case only.
          </p>
          <FormulaBlock tex={'\\rho=r(\\mathrm{rank}\\,X,\\mathrm{rank}\\,Y)'} label="Spearman as Pearson of ranks" />
        </CaCard>
        <CaCard title="Monotonic, not linear">
          <Insight title="Why ranks help">
            A steadily increasing curve can have high ρ and a milder r. ρ asks whether order is preserved, not whether
            the cloud is a straight line.
          </Insight>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    const x = WORKED.spearman.map((row) => row.x)
    const y = WORKED.spearman.map((row) => row.y)
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          These ten increasing pairs have no ties, so ρ = {formatNum(spearmanRho(x, y), 3)} and the d<sub>i</sub>² shortcut
          agrees with Pearson-on-ranks.
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
              prompt: 'When is Spearman’s ρ more appropriate than Pearson’s r?',
              options: [
                'When the relationship is linear.',
                'When the relationship is monotonic but not necessarily linear.',
                'When both variables are categorical.',
                'When you need a causal effect.',
              ],
              answer: 1,
              explanation: 'ρ uses ranks, so a steady curve can still score high.',
            },
            {
              prompt: 'The values 2, 5, 5, 9 receive ranks…',
              options: ['1, 2, 3, 4', '1, 2.5, 2.5, 4', '1, 3, 3, 4', '2, 2, 2, 4'],
              answer: 1,
              explanation: 'Tied 5s share the average of ranks 2 and 3.',
            },
          ]}
        />
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore with ranks" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Dataset"
              value={preset}
              onChange={(value) => setPreset(value as typeof preset)}
              options={[
                { value: 'spearman', label: 'Study hours vs exam (monotonic)' },
                { value: 'monotonic-nonlinear', label: 'Curved but increasing' },
                { value: 'ranks-tied', label: 'Tied ranks' },
                { value: 'u-shape', label: 'U-shape' },
                { value: 'outlier', label: 'Outlier' },
              ]}
            />
            <CaSelect
              label="View"
              value={view}
              onChange={(value) => setView(value as 'raw' | 'rank')}
              options={[
                { value: 'raw', label: 'Raw values' },
                { value: 'rank', label: 'Ranks' },
              ]}
            />
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
            <p className="text-xs text-slate-400">Tied ranks are visible in the table. Spearman is Pearson of those ranks.</p>
          </div>
        </CaCard>
      }
      plot={
        <CaCard
          title={view === 'rank' ? 'Rank plot (X ranks vs Y ranks)' : 'Raw scatter'}
          action={<span className="text-xs font-bold text-slate-500">ρ = {formatNum(rho, 3)} · {associationLabel(rho)}</span>}
        >
          <ScatterPlot
            points={shown}
            xLabel={view === 'rank' ? 'Rank of X' : 'X'}
            yLabel={view === 'rank' ? 'Rank of Y' : 'Y'}
            showTrend
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Pearson r" value={formatNum(r, 3)} />
            <Metric label="Spearman ρ" value={formatNum(rho, 3)} />
          </div>
        </CaCard>
      }
      aside={
        <CaCard title="Understanding Spearman">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="plus" title="Monotonic increasing">Ranks rise together at a steady rate.</ConceptRow>
              <MiniCloud kind="pos" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="minus" title="Monotonic decreasing">One rank rises as the other falls.</ConceptRow>
              <MiniCloud kind="neg" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="none" title="Not monotonic">A U-shape is patterned but not monotone, so ρ drops.</ConceptRow>
              <MiniCloud kind="curve" />
            </div>
          </div>
        </CaCard>
      }
      bottom={
        <div className="grid gap-4 lg:grid-cols-2">
          <CaCard title="Rank table">
            <div className="max-h-56 overflow-auto">
              <table className="corr-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Rank X</th>
                    <th>Rank Y</th>
                  </tr>
                </thead>
                <tbody>
                  {raw.map((point, i) => (
                    <tr key={point.id} className={ranks[i].x !== Math.round(ranks[i].x) || ranks[i].y !== Math.round(ranks[i].y) ? 'is-on' : ''}>
                      <td>{i + 1}</td>
                      <td>{formatNum(point.x, 2)}</td>
                      <td>{formatNum(point.y, 2)}</td>
                      <td>{formatNum(ranks[i].x, 2)}</td>
                      <td>{formatNum(ranks[i].y, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CaCard>
          <CaCard title="Key concepts">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Monotonicity — order, not a straight line.</li>
              <li>Rank-based — uses average ranks, including ties.</li>
              <li>Robustness — large raw outliers become rank extremes, not wild distances.</li>
              <li>Check: Pearson of the rank columns is {formatNum(pearsonR(ranks.map((p) => p.x), ranks.map((p) => p.y)), 3)}.</li>
            </ul>
          </CaCard>
        </div>
      }
    />
  )
}
