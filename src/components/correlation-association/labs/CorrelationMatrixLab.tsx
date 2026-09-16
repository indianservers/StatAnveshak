import { useMemo, useState } from 'react'
import {
  correlationMatrix,
  formatNum,
  generateStudentMatrix,
  MATRIX_VARS,
  type CaTab,
  type CorrMethod,
  type NamedSeries,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { Heatmap, MiniCloud, ScatterPlot } from '../plots'

export function CorrelationMatrixLab({ tab }: { tab: CaTab }) {
  const [method, setMethod] = useState<CorrMethod>('pearson')
  const [seed, setSeed] = useState(44)
  const [selected, setSelected] = useState<[number, number]>([0, 3])
  const [on, setOn] = useState<string[]>(MATRIX_VARS.map((item) => item.id))

  const rows = useMemo(() => generateStudentMatrix(36, seed), [seed])
  const columns: NamedSeries[] = useMemo(
    () =>
      MATRIX_VARS.filter((item) => on.includes(item.id)).map((item) => ({
        id: item.id,
        label: item.label,
        values: rows.map((row) => row[item.id] ?? Number.NaN),
      })),
    [on, rows],
  )
  const matrix = useMemo(() => correlationMatrix(columns, method), [columns, method])
  const i = Math.min(selected[0], columns.length - 1)
  const j = Math.min(selected[1], columns.length - 1)
  const scatterPoints = useMemo(() => {
    if (!columns[i] || !columns[j]) return []
    return columns[i].values.map((x, index) => ({ id: `m-${index}`, x, y: columns[j].values[index] }))
  }, [columns, i, j])

  const reset = () => {
    setMethod('pearson')
    setSeed(44)
    setSelected([0, 3])
    setOn(MATRIX_VARS.map((item) => item.id))
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="How to read the matrix">
          <p className="text-sm leading-6 text-slate-600">
            Each cell is a pairwise correlation. The diagonal is 1. Color and sign both encode direction so a heatmap is
            not color-only. A constant column is undefined, not 0.
          </p>
          <FormulaBlock tex={'r_{jk}=\\mathrm{corr}(X_j,X_k)'} label="Pairwise correlation" />
        </CaCard>
        <CaCard title="Pairwise n">
          <Insight title="Missingness">Each pair uses the rows that have both variables. n can differ from cell to cell.</Insight>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          Study hours versus test score is usually the strongest positive cell in this teaching matrix. Screen time versus
          test score is typically negative. Homework versus activity is often weak.
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
              prompt: 'In a correlation matrix, which pair of statements is true?',
              options: [
                'The matrix is symmetric, and the diagonal is 1 when variance is positive.',
                'Off-diagonal cells are always 0.',
                'Color alone is enough; signs are optional.',
                'A constant column should be reported as r = 0.',
              ],
              answer: 0,
              explanation: 'Symmetry follows from corr(X,Y)=corr(Y,X). A constant column is undefined.',
            },
            {
              prompt: 'Clicking a cell should…',
              options: ['fit a causal model', 'open the scatter for that pair', 'delete the variables', 'force Pearson to 1'],
              answer: 1,
              explanation: 'The heatmap is a screening tool. The scatter is the check.',
            },
          ]}
        />
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore the correlation matrix" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Method"
              value={method}
              onChange={(value) => setMethod(value as CorrMethod)}
              options={[
                { value: 'pearson', label: 'Pearson r' },
                { value: 'spearman', label: 'Spearman ρ' },
              ]}
            />
            <fieldset>
              <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Variables</legend>
              <div className="space-y-1">
                {MATRIX_VARS.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={on.includes(item.id)}
                      onChange={() => {
                        setOn((current) =>
                          current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
                        )
                        setSelected([0, Math.min(1, on.length - 1)])
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample students
            </button>
          </div>
        </CaCard>
      }
      plot={
        <CaCard title="Correlation matrix" action={<span className="text-xs font-bold text-slate-500">{method === 'pearson' ? 'Pearson' : 'Spearman'} · click a cell</span>}>
          <Heatmap
            labels={columns.map((column) => column.label)}
            values={matrix.values}
            ns={matrix.ns}
            selected={[i, j]}
            onSelect={(a, b) => setSelected([a, b])}
          />
          <p className="mt-2 text-xs text-slate-400">Green / plus = positive. Red / minus = negative. Gray / dash = undefined.</p>
        </CaCard>
      }
      aside={
        <CaCard title="Interpreting correlations">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="plus" title="Strong positive">Variables tend to rise together.</ConceptRow>
              <MiniCloud kind="pos" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="minus" title="Strong negative">Variables tend to move in opposite directions.</ConceptRow>
              <MiniCloud kind="neg" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="none" title="Weak">Little linear or monotonic tilt.</ConceptRow>
              <MiniCloud kind="weak" />
            </div>
          </div>
        </CaCard>
      }
      bottom={
        <div className="grid gap-4 lg:grid-cols-2">
          <CaCard title={columns[i] && columns[j] ? `${columns[i].label} vs ${columns[j].label}` : 'Pair scatter'}>
            <ScatterPlot
              points={scatterPoints}
              xLabel={columns[i]?.label ?? 'X'}
              yLabel={columns[j]?.label ?? 'Y'}
              showTrend
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label={method === 'pearson' ? 'r' : 'ρ'} value={formatNum(matrix.values[i]?.[j] ?? Number.NaN, 3)} />
              <Metric label="pairwise n" value={String(matrix.ns[i]?.[j] ?? 0)} />
            </div>
          </CaCard>
          <CaCard title="Key concepts">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Symmetry — r<sub>jk</sub> = r<sub>kj</sub>.</li>
              <li>Diagonal — each variable with itself is 1 when variance is positive.</li>
              <li>Pairwise view — n is computed per cell.</li>
              <li>Screening — the matrix is a map, not a causal model.</li>
            </ul>
          </CaCard>
        </div>
      }
    />
  )
}
