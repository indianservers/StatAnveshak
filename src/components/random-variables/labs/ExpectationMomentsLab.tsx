import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  discreteCentralMoment,
  discreteMean,
  discreteRawMoment,
  discreteVariance,
  formatFixed,
  formatNum,
  isValidPmf,
  markRvLabComplete,
  normalizePmf,
  pmfSum,
  type DiscreteMass,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { PMFChart } from '../plots'
import { ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect } from '../shared'

const CONCEPTS = [
  { id: 'mean', title: 'Expected value', detail: 'The expected value (mean) of a discrete random variable is E[X] = Σ x p(x), a probability-weighted average of all possible values.' },
  { id: 'moments', title: 'Moments', detail: 'The k-th raw moment is E[Xᵏ] = Σ xᵏ p(x). The first moment is the mean; higher moments describe spread and shape.' },
  { id: 'variance', title: 'Variance and standard deviation', detail: 'Var(X) = E[X²] − (E[X])² measures spread. σ = √Var(X).' },
  { id: 'interpret', title: 'Interpretation', detail: 'Moments help us understand the center (mean), spread (variance), and shape (skewness, kurtosis) of a random variable.' },
]

const DEFAULT: DiscreteMass[] = [
  { x: 0, p: 0.1 },
  { x: 1, p: 0.2 },
  { x: 2, p: 0.4 },
  { x: 3, p: 0.2 },
  { x: 4, p: 0.1 },
]

export function ExpectationMomentsLab({ tab }: { tab: string }) {
  const [items, setItems] = useState<DiscreteMass[]>(DEFAULT)
  const [k, setK] = useState(1)
  const [concept, setConcept] = useState('mean')

  const mean = discreteMean(items)
  const raw = discreteRawMoment(items, k)
  const central = discreteCentralMoment(items, k)
  const second = discreteRawMoment(items, 2)
  const variance = discreteVariance(items)
  const valid = isValidPmf(items)

  const terms = useMemo(
    () => items.map((item) => ({ x: item.x, contrib: item.x ** k * item.p })),
    [items, k],
  )

  const reset = () => {
    setItems(DEFAULT)
    setK(1)
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="A random variable X has P(X = −1,0,1,2) = 0.2, 0.3, 0.4, 0.1. What is E[X]?"
          options={['−0.1', '0.0', '0.4', '0.7']}
          answer={2}
          explanation="E[X] = (−1)(0.2) + 0 + 1(0.4) + 2(0.1) = 0.4."
          onCorrect={() => markRvLabComplete('expectation-moments')}
        />
      </RvCard>
    )
  }

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive distribution" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Adjust the probabilities to see the expected value and moments change.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Distribution type"
              value="custom"
              onChange={() => undefined}
              options={[{ value: 'custom', label: 'Custom discrete' }]}
            />
            <RvSelect
              label="Moment order k"
              value={String(k)}
              onChange={(value) => setK(Number(value))}
              options={[1, 2, 3, 4].map((value) => ({ value: String(value), label: `k = ${value}` }))}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <table className="rv-table">
              <thead>
                <tr>
                  <th>x</th>
                  <th>P(X = x)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={row.x}>
                    <td>{row.x}</td>
                    <td>
                      <input
                        className="rv-input"
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={row.p}
                        onChange={(event) => {
                          const next = items.map((item, i) => (i === index ? { ...item, p: Number(event.target.value) } : item))
                          setItems(next)
                        }}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Total</td>
                  <td className="font-bold">{formatFixed(pmfSum(items), 2)}</td>
                </tr>
              </tbody>
            </table>
            <div>
              <p className="mb-1 text-sm font-bold text-slate-700">Probability distribution</p>
              <PMFChart items={items} mean={mean} showLabels />
              <p className="mt-2 text-center text-xs text-rose-500">Balance point μ = {formatFixed(mean, 2)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ResultBanner title={`E[X] = ${formatFixed(mean, 2)}`} />
            <ResultBanner tone="info" title={`E[X²] = ${formatFixed(second, 2)}`} />
            <ResultBanner tone="info" title={`Var(X) = ${formatFixed(variance, 2)}`}>
              σ = {formatFixed(Math.sqrt(variance), 2)}
            </ResultBanner>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/80">
            <p className="font-bold text-slate-700 dark:text-white">
              {k === 1 ? '1st raw moment → mean' : k === 2 ? '2nd central moment → variance' : k === 3 ? '3rd central moment relates to skewness' : '4th central moment relates to kurtosis'}
            </p>
            <p className="mt-1 text-slate-500">
              E[X^{k}] = {formatNum(raw, 4)} · E[(X−μ)^{k}] = {formatNum(central, 4)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Terms: {terms.map((term) => `${term.x}^${k}·p = ${formatNum(term.contrib, 3)}`).join(' + ')}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rv-btn rv-btn-ghost" onClick={() => setItems(normalizePmf(items))} disabled={valid}>
              Normalize probabilities
            </button>
          </div>
          <Insight title="Move the mass">
            Shift probability toward larger x-values. The red balance point — E[X] — slides with the mass.
          </Insight>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            <MathText value={concept === 'variance' ? '\\mathrm{Var}(X) = E[X^2]-(E[X])^2' : 'E[X] = \\sum x\\,p(x)'} block />
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">A random variable X has the following distribution:</p>
          <table className="rv-table mt-2">
            <thead>
              <tr>
                <th>x</th>
                <th>0</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P(X = x)</td>
                <td>0.1</td>
                <td>0.3</td>
                <td>0.4</td>
                <td>0.2</td>
              </tr>
            </tbody>
          </table>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>E[X] = 0(0.1)+1(0.3)+2(0.4)+3(0.2) = 1.7</li>
            <li>E[X²] = 0+1(0.3)+4(0.4)+9(0.2) = 3.7</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="A random variable X has P(X = −1, 0, 1, 2) = 0.2, 0.3, 0.4, 0.1. What is E[X]?"
            options={['−0.1', '0.0', '0.4', '0.7']}
            answer={2}
            explanation="E[X] = −0.2 + 0 + 0.4 + 0.2 = 0.4."
            onCorrect={() => markRvLabComplete('expectation-moments')}
          />
        </RvCard>
      }
    />
  )
}
