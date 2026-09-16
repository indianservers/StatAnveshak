import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  diePmf,
  discreteCdfAt,
  discreteCdfTable,
  discreteQuantile,
  formatFixed,
  formatNum,
  markRvLabComplete,
  normalCdf,
  normalInv,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { CDFPlot } from '../plots'
import { ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect, RvSlider } from '../shared'

const CONCEPTS = [
  { id: 'cdf', title: 'Cumulative distribution function (CDF)', detail: 'F(x) = P(X ≤ x) gives the probability that a random variable is less than or equal to x.' },
  { id: 'quantile', title: 'Quantiles', detail: 'The p-quantile xₚ satisfies F(xₚ) = p. The median is the 0.5 quantile.' },
  { id: 'percentile', title: 'Percentiles', detail: 'The p-percentile is the value xₚ such that P(X ≤ xₚ) = p. The 90th percentile leaves 90% of observations to the left.' },
  { id: 'median', title: 'Median', detail: 'The 50th percentile (p = 0.5): the value that splits the distribution in half.' },
  { id: 'inverse', title: 'Inverse CDF', detail: 'The quantile function Q(p) = F⁻¹(p) returns the value with cumulative probability p.' },
]

const PERCENTILES = [0.1, 0.25, 0.5, 0.75, 0.9]

export function CdfQuantilesLab({ tab }: { tab: string }) {
  const [kind, setKind] = useState<'continuous' | 'discrete'>('continuous')
  const [x, setX] = useState(0.67)
  const [pSlider, setPSlider] = useState(0.75)
  const [concept, setConcept] = useState('cdf')
  const die = useMemo(() => diePmf(), [])
  const steps = discreteCdfTable(die)

  const F = (value: number) => (kind === 'continuous' ? normalCdf(value) : discreteCdfAt(die, value))
  const Q = (p: number) => (kind === 'continuous' ? normalInv(p) : discreteQuantile(die, p))
  const fx = F(x)
  const qp = Q(pSlider)

  const reset = () => {
    setKind('continuous')
    setX(0.67)
    setPSlider(0.75)
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="If X ~ N(0, 1), what is the 75th percentile Q(0.75)?"
          options={['−1.2816', '−0.6745', '0.6745', '1.2816']}
          answer={2}
          explanation="Φ⁻¹(0.75) ≈ 0.6745."
          onCorrect={() => markRvLabComplete('cdf-quantiles')}
        />
      </RvCard>
    )
  }

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive CDF explorer" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Move the slider or drag the vertical line to explore the cumulative distribution function.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Distribution"
              value={kind}
              onChange={(value) => setKind(value as 'continuous' | 'discrete')}
              options={[
                { value: 'continuous', label: 'Normal · X ~ N(0, 1)' },
                { value: 'discrete', label: 'Discrete · fair die' },
              ]}
            />
            <ResultBanner title={`P(X ≤ ${formatFixed(x, 2)}) = ${formatNum(fx, 5)}`}>
              There is a {(fx * 100).toFixed(2)}% chance that X is less than or equal to {formatFixed(x, 2)}.
            </ResultBanner>
          </div>
          <RvSlider
            label="x value"
            value={x}
            min={kind === 'continuous' ? -3 : 0}
            max={kind === 'continuous' ? 3 : 7}
            step={0.01}
            onChange={setX}
            display={formatFixed(x, 2)}
          />
          <RvSlider
            label="Percentile p"
            value={pSlider}
            min={0.01}
            max={0.99}
            step={0.01}
            onChange={(value) => {
              setPSlider(value)
              setX(Q(value))
            }}
            display={formatFixed(pSlider, 2)}
          />
          <p className="mt-3 text-sm font-bold text-slate-700">Cumulative distribution function (CDF)</p>
          <CDFPlot
            F={F}
            min={kind === 'continuous' ? -3 : 0}
            max={kind === 'continuous' ? 3 : 7}
            x={x}
            p={fx}
            discreteSteps={kind === 'discrete' ? steps : undefined}
            onChangeX={setX}
          />
          <p className="mt-2 text-sm text-slate-600">
            Inverse: Q({formatFixed(pSlider, 2)}) = {formatFixed(qp, 4)}
          </p>
          <div className="mt-4 overflow-x-auto">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Common percentiles {kind === 'continuous' ? '(standard normal)' : '(die)'}</p>
            <table className="rv-table">
              <thead>
                <tr>
                  {PERCENTILES.map((p) => (
                    <th key={p}>{Math.round(p * 100)}th</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {PERCENTILES.map((p) => (
                    <td key={p}>{formatFixed(Q(p), 4)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <Insight title="Trace the inverse">
            Moving x traces up to F(x). Moving p traces across to Q(p). Discrete CDFs jump at each atom of probability.
          </Insight>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            <MathText value={concept === 'inverse' ? 'Q(p) = F^{-1}(p)' : 'F(x) = P(X \\le x)'} block />
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">Let X ~ N(0, 1). Find (a) P(X ≤ 1.2), (b) the 90th percentile, and (c) the median.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>P(X ≤ 1.2) = Φ(1.2) ≈ 0.8849</li>
            <li>90th percentile x₀.₉₀ = Φ⁻¹(0.90) ≈ 1.2816</li>
            <li>Median x₀.₅₀ = 0 by symmetry of the normal distribution</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="If X ~ N(0, 1), what is the 75th percentile Q(0.75)?"
            options={['−1.2816', '−0.6745', '0.6745', '1.2816']}
            answer={2}
            explanation="Φ⁻¹(0.75) ≈ 0.6745."
            onCorrect={() => markRvLabComplete('cdf-quantiles')}
          />
        </RvCard>
      }
    />
  )
}
