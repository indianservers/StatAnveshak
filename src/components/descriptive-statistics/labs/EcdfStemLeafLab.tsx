import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  ECDF_DEFAULT,
  PRACTICE_ECDF,
  formatNum,
  ecdfAt,
  ecdfSteps,
  percentile,
  stemLeaf,
  type DsTab,
} from '../../../lib/descriptiveStatistics'
import { DatasetEditor, DsCard, DsSlider, FormulaBlock, LabSplit, MetricCard, QuizBlock } from '../shared'
import { EcdfPlot } from '../plots'

export function EcdfStemLeafLab({ tab }: { tab: DsTab }) {
  const [values, setValues] = useState(ECDF_DEFAULT)
  const [x, setX] = useState(36)
  const [stem, setStem] = useState<number | null>(null)
  const steps = useMemo(() => ecdfSteps(values), [values])
  const rows = useMemo(() => stemLeaf(values, 10), [values])
  const fn = ecdfAt(values, x)
  const practiceFn = ecdfAt(PRACTICE_ECDF, 22)
  const p75 = percentile(PRACTICE_ECDF, 75)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <DsCard title="Empirical CDF">
          <p className="text-sm leading-6 text-slate-600">The ECDF jumps by 1/n at each observation. Fₙ(x) is the proportion of values less than or equal to x.</p>
          <FormulaBlock tex={'F_n(x)=\\frac{1}{n}\\sum_{i=1}^{n} I(X_i\\le x)'} />
        </DsCard>
        <DsCard title="Stem-and-leaf">
          <p className="text-sm leading-6 text-slate-600">A stem-and-leaf keeps the actual digits while showing shape. Key: 4 | 2 = 42 when stems are tens and leaves are ones.</p>
        </DsCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <DsCard title="Practice">
        <p className="mb-3 text-sm text-slate-600">Study minutes: {PRACTICE_ECDF.join(', ')}</p>
        <QuizBlock
          prompt="What is F(22)?"
          options={['0.25', formatNum(practiceFn.value, 2), '0.50', '0.75']}
          answer={1}
          explanation={`${practiceFn.count} of ${practiceFn.n} values are ≤ 22, so F(22) = ${formatNum(practiceFn.value, 2)}.`}
        />
      </DsCard>
    )
  }

  return (
    <>
      <LabSplit
        demo={
          <DsCard title="Explore the data" action={<button type="button" className="ds-btn ds-btn-ghost" onClick={() => { setValues(ECDF_DEFAULT); setX(36) }}>Reset data</button>}>
            <DatasetEditor values={values} onChange={setValues} fallback={ECDF_DEFAULT} presets={['ecdf', 'scores30', 'shared', 'five']} />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Empirical CDF</p>
                <EcdfPlot steps={steps} x={x} />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Stem-and-leaf (tens | ones)</p>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Stem</th>
                      <th>Leaves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.stem}
                        className={stem === row.stem ? 'ds-cell-active' : ''}
                        onClick={() => {
                          setStem(row.stem)
                          setX(row.values[0] ?? x)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{row.stem}</td>
                        <td className="text-left">{row.leaves.join(' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-slate-400">Key: 1 | 2 = 12</p>
              </div>
            </div>
            <div className="mt-4">
              <DsSlider
                label="Inspect cumulative proportion"
                value={x}
                min={Math.min(...values, x)}
                max={Math.max(...values, x)}
                step={1}
                onChange={setX}
                display={`x = ${formatNum(x)}`}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <MetricCard label="F(x)" value={formatNum(fn.value, 2)} />
                <MetricCard label="Count ≤ x" value={`${fn.count} / ${fn.n}`} />
                <MetricCard label="Percentile" value={`${formatNum(fn.value * 100, 0)}th`} />
              </div>
            </div>
          </DsCard>
        }
        concepts={
          <DsCard title="Key concepts">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li>The ECDF shows the proportion of observations ≤ x.</li>
              <li>It increases by 1/n at each distinct data value (or a multiple of 1/n for ties).</li>
              <li>A stem-and-leaf splits each value into a leading stem and a last digit, preserving the raw number.</li>
            </ul>
            <FormulaBlock tex={'F_n(x)=(\\text{# of }X_i\\le x)/n'} />
          </DsCard>
        }
        worked={
          <DsCard title="Worked example">
            <p className="text-sm leading-6 text-slate-600">
              On the default scores, F({formatNum(x)}) = {fn.count}/{fn.n} = {formatNum(fn.value, 2)}. The 75th percentile of the practice list is {formatNum(p75)}.
            </p>
          </DsCard>
        }
        practice={
          <DsCard title="Try it yourself">
            <p className="mb-2 text-sm text-slate-600">Study minutes: {PRACTICE_ECDF.join(', ')}</p>
            <QuizBlock
              prompt="F(22) equals…"
              options={['0.25', formatNum(practiceFn.value, 2), '0.50', '0.75']}
              answer={1}
              explanation={`${practiceFn.count}/${practiceFn.n} = ${formatNum(practiceFn.value, 2)}.`}
            />
          </DsCard>
        }
      />
      <section className="ds-card flex flex-col items-start justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-slate-800">You have completed all 9 labs in Descriptive Statistics.</p>
          <p className="text-xs text-slate-400">You can describe center, spread, position, shape, and unusual points from raw data.</p>
        </div>
        <Link to="/statistics/sampling-methods" className="ds-btn">
          Explore the next studio <ArrowRight size={15} aria-hidden />
        </Link>
      </section>
    </>
  )
}
