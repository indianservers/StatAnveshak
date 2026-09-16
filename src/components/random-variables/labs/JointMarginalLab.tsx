import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  conditionalGivenX,
  conditionalGivenY,
  DEFAULT_JOINT,
  formatFixed,
  formatNum,
  jointIndependent,
  jointMarginalX,
  jointMarginalY,
  markRvLabComplete,
  normalizeJoint,
  PRACTICE_JOINT,
  type JointTable,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { HeatmapGrid, PMFChart } from '../plots'
import { ChipToggle, ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect } from '../shared'

type View = 'joint' | 'marginal-x' | 'marginal-y' | 'cond-x' | 'cond-y'

const CONCEPTS = [
  { id: 'joint', title: 'Joint distribution', detail: 'The joint distribution P(X, Y) gives the probability of each combination of values of two random variables.' },
  { id: 'marginal', title: 'Marginal distributions', detail: 'Marginals are found by summing over the other variable: P(X = x) = Σ_y P(X = x, Y = y).' },
  { id: 'cond', title: 'Conditional distribution', detail: 'The conditional distribution of X given Y = y is P(X = x | Y = y) = P(x, y) / P(Y = y) for P(Y = y) > 0.' },
  { id: 'ind', title: 'Independence', detail: 'X and Y are independent if P(x, y) = P(x)P(y) for all x, y. Otherwise they are dependent.' },
]

export function JointMarginalLab({ tab }: { tab: string }) {
  const [table, setTable] = useState<JointTable>(DEFAULT_JOINT)
  const [view, setView] = useState<View>('joint')
  const [showMargins, setShowMargins] = useState(true)
  const [showHeat, setShowHeat] = useState(false)
  const [active, setActive] = useState<{ i: number; j: number } | null>({ i: 1, j: 1 })
  const [concept, setConcept] = useState('joint')

  const px = useMemo(() => jointMarginalX(table), [table])
  const py = useMemo(() => jointMarginalY(table), [table])
  const independent = jointIndependent(table)
  const condX = active ? conditionalGivenY(table, active.j) : []
  const condY = active ? conditionalGivenX(table, active.i) : []

  const reset = () => {
    setTable(DEFAULT_JOINT)
    setView('joint')
    setActive({ i: 1, j: 1 })
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="From the practice table, what is P(Y = 1 | X = 2)?"
          options={['0.28', '0.40', '0.60', '0.70']}
          answer={1}
          explanation={`P(Y=1 | X=2) = 0.28 / 0.70 = 0.40.`}
          onCorrect={() => markRvLabComplete('joint-marginal-conditional')}
        />
      </RvCard>
    )
  }

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive bivariate distribution" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Explore a joint probability distribution and view marginal and conditional distributions.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Joint distribution"
              value="custom"
              onChange={() => setTable(DEFAULT_JOINT)}
              options={[{ value: 'custom', label: 'Custom table' }]}
            />
            <RvSelect
              label="View"
              value={view}
              onChange={(value) => setView(value as View)}
              options={[
                { value: 'joint', label: 'Joint distribution P(X, Y)' },
                { value: 'marginal-x', label: 'Marginal P(X)' },
                { value: 'marginal-y', label: 'Marginal P(Y)' },
                { value: 'cond-y', label: 'Conditional P(Y | X)' },
                { value: 'cond-x', label: 'Conditional P(X | Y)' },
              ]}
            />
          </div>
          <div className="mb-3 flex flex-wrap gap-3">
            <ChipToggle checked={showMargins} onChange={setShowMargins} label="Show marginal totals" />
            <ChipToggle checked={showHeat} onChange={setShowHeat} label="Show as heatmap" />
            <button type="button" className="rv-btn rv-btn-ghost" onClick={() => setTable(normalizeJoint(table))}>
              Normalize table
            </button>
          </div>
          {showHeat && (
            <div className="mb-4">
              <HeatmapGrid table={table} active={active} onSelect={(i, j) => setActive({ i, j })} />
            </div>
          )}
          <div className="overflow-x-auto">
            <p className="mb-2 text-sm font-bold text-slate-700">Joint probability P(X, Y)</p>
            <table className="rv-table">
              <thead>
                <tr>
                  <th />
                  {table.ys.map((y) => (
                    <th key={y}>Y = {y}</th>
                  ))}
                  {showMargins && <th>P(X)</th>}
                </tr>
              </thead>
              <tbody>
                {table.xs.map((x, i) => (
                  <tr key={x}>
                    <th>X = {x}</th>
                    {table.ys.map((_y, j) => (
                      <td key={j} className={active?.i === i && active?.j === j ? 'rv-cell-active' : active?.i === i || active?.j === j ? 'bg-blue-50' : ''}>
                        <input
                          className="rv-input"
                          type="number"
                          min={0}
                          step={0.01}
                          value={table.cells[i]?.[j] ?? 0}
                          onChange={(event) => {
                            const next = table.cells.map((row) => [...row])
                            next[i] = [...(next[i] ?? [])]
                            next[i][j] = Number(event.target.value)
                            setTable({ ...table, cells: next })
                            setActive({ i, j })
                          }}
                          onFocus={() => setActive({ i, j })}
                        />
                      </td>
                    ))}
                    {showMargins && <td className="font-bold">{formatFixed(px[i]?.p ?? 0, 2)}</td>}
                  </tr>
                ))}
                {showMargins && (
                  <tr>
                    <th>P(Y)</th>
                    {py.map((item) => (
                      <td key={item.x} className="font-bold">
                        {formatFixed(item.p, 2)}
                      </td>
                    ))}
                    <td className="font-bold">1.00</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {view === 'marginal-x' && <PMFChart items={px} />}
          {view === 'marginal-y' && <PMFChart items={py} />}
          {view === 'cond-x' && active && (
            <div className="mt-3">
              <p className="text-sm font-bold">P(X | Y = {table.ys[active.j]}) — row/column renormalized to 1</p>
              <PMFChart items={condX} />
            </div>
          )}
          {view === 'cond-y' && active && (
            <div className="mt-3">
              <p className="text-sm font-bold">P(Y | X = {table.xs[active.i]})</p>
              <PMFChart items={condY} />
            </div>
          )}
          <Insight title="Insight">
            Click a cell to highlight its row and column. The marginal P(X = x) is the row sum, and P(Y = y) is the column sum.
            {active && ` Selected P(X=${table.xs[active.i]}, Y=${table.ys[active.j]}) = ${formatNum(table.cells[active.i]?.[active.j] ?? 0, 3)}.`}
          </Insight>
          <ResultBanner tone={independent ? 'ok' : 'warn'} title={independent ? 'X and Y appear independent' : 'X and Y are dependent'}>
            Independence requires P(x, y) = P(x)P(y) for every cell.
          </ResultBanner>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            <MathText value="P(X=x)=\\sum_y P(X=x,Y=y)" block />
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">Using the joint table shown, find the marginals, P(X | Y = 2), and check independence.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>P(X) = (0.20, 0.50, 0.30) and P(Y) = (0.20, 0.50, 0.30)</li>
            <li>P(X = 2 | Y = 2) = 0.25 / 0.50 = 0.50</li>
            <li>P(1, 1) = 0.05 ≠ 0.20 × 0.20 = 0.04, so X and Y are dependent</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <table className="rv-table mb-3">
            <thead>
              <tr>
                <th />
                <th>Y = 1</th>
                <th>Y = 2</th>
                <th>P(X)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>X = 1</td>
                <td>0.12</td>
                <td>0.18</td>
                <td>0.30</td>
              </tr>
              <tr>
                <td>X = 2</td>
                <td>0.28</td>
                <td>0.42</td>
                <td>0.70</td>
              </tr>
            </tbody>
          </table>
          <QuizBlock
            prompt="What is P(Y = 1 | X = 2)?"
            options={['0.28', '0.40', '0.60', '0.70']}
            answer={1}
            explanation={`0.28 / ${formatFixed(PRACTICE_JOINT.cells[1][0] + PRACTICE_JOINT.cells[1][1], 2)} = 0.40.`}
            onCorrect={() => markRvLabComplete('joint-marginal-conditional')}
          />
        </RvCard>
      }
    />
  )
}
