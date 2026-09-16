import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  chiSquarePdf,
  diePmf,
  discreteMean,
  discreteVariance,
  formatFixed,
  markRvLabComplete,
  normalPdf,
  transformDiscrete,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { PDFPlot, PMFChart } from '../plots'
import { ChipToggle, ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect, RvSlider } from '../shared'

type Source = 'normal' | 'die'
type MapKind = 'shift' | 'scale' | 'linear' | 'square' | 'abs' | 'log'

const CONCEPTS = [
  { id: 'transform', title: 'Transformation', detail: 'If Y = g(X), then Y is a random variable whose distribution depends on g and the distribution of X.' },
  { id: 'oneone', title: 'One-to-one transformations', detail: 'If g is one-to-one and differentiable, then f_Y(y) = f_X(g⁻¹(y)) |d/dy g⁻¹(y)|.' },
  { id: 'linear', title: 'Linear transformations', detail: 'If Y = aX + b, then μ_Y = aμ_X + b and σ²_Y = a² σ²_X.' },
  { id: 'common', title: 'Common transformations', detail: 'Functions like g(X) = X², exp(X), or log(X) lead to important distributions such as chi-square and log-normal.' },
]

function applyMap(kind: MapKind, x: number, a: number, b: number): number {
  if (kind === 'shift') return x + b
  if (kind === 'scale') return a * x
  if (kind === 'linear') return a * x + b
  if (kind === 'square') return x * x
  if (kind === 'abs') return Math.abs(x)
  return x > 0 ? Math.log(x) : Number.NaN
}

export function TransformationsLab({ tab }: { tab: string }) {
  const [source, setSource] = useState<Source>('normal')
  const [kind, setKind] = useState<MapKind>('square')
  const [a, setA] = useState(2)
  const [b, setB] = useState(-1)
  const [sigma, setSigma] = useState(1)
  const [showTheory, setShowTheory] = useState(true)
  const [concept, setConcept] = useState('transform')

  const die = useMemo(() => diePmf(), [])
  const mappedDie = useMemo(() => transformDiscrete(die, (x) => applyMap(kind, x, a, b)).filter((item) => Number.isFinite(item.x)), [a, b, die, kind])

  const reset = () => {
    setSource('normal')
    setKind('square')
    setA(2)
    setB(-1)
    setSigma(1)
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="Let X ~ Exponential(λ = 2) and Y = 3X. What is the distribution of Y?"
          options={['Exponential(1/2)', 'Exponential(2)', 'Exponential(2/3)', 'Exponential(6)']}
          answer={2}
          explanation="If X ~ Exp(λ) and Y = cX with c > 0, then Y ~ Exp(λ/c). Here λ/c = 2/3."
          onCorrect={() => markRvLabComplete('transformations')}
        />
      </RvCard>
    )
  }

  const linear = kind === 'shift' || kind === 'scale' || kind === 'linear'
  const aa = kind === 'shift' ? 1 : a
  const bb = kind === 'scale' ? 0 : b

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive transformation explorer" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">See how transforming a random variable changes its distribution.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <RvSelect
              label="1. Original variable X"
              value={source}
              onChange={(value) => setSource(value as Source)}
              options={[
                { value: 'normal', label: 'Normal distribution' },
                { value: 'die', label: 'Fair die (discrete)' },
              ]}
            />
            <RvSelect
              label="2. Transformation g(x)"
              value={kind}
              onChange={(value) => setKind(value as MapKind)}
              options={[
                { value: 'shift', label: 'Y = X + c' },
                { value: 'scale', label: 'Y = aX' },
                { value: 'linear', label: 'Y = aX + b' },
                { value: 'square', label: 'Y = X²' },
                { value: 'abs', label: 'Y = |X|' },
                { value: 'log', label: 'Y = log(X) (X > 0)' },
              ]}
            />
            <ChipToggle checked={showTheory} onChange={setShowTheory} label="Show theoretical curve" />
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            {(kind === 'scale' || kind === 'linear') && <RvSlider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} display={formatFixed(a, 1)} />}
            {(kind === 'shift' || kind === 'linear') && <RvSlider label="c / b" value={b} min={-3} max={3} step={0.1} onChange={setB} display={formatFixed(b, 1)} />}
            {source === 'normal' && <RvSlider label="σ of X" value={sigma} min={0.4} max={2} step={0.1} onChange={setSigma} display={formatFixed(sigma, 1)} />}
          </div>
          <p className="mb-3 text-center text-lg font-black text-slate-800">
            Y = g(X) = {kind === 'square' ? 'X²' : kind === 'abs' ? '|X|' : kind === 'log' ? 'log(X)' : kind === 'shift' ? `X + ${formatFixed(b, 1)}` : kind === 'scale' ? `${formatFixed(a, 1)}X` : `${formatFixed(a, 1)}X + ${formatFixed(b, 1)}`}
          </p>
          {source === 'die' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-bold">Distribution of X</p>
                <PMFChart items={die} />
              </div>
              <div>
                <p className="mb-1 text-sm font-bold">Distribution of Y</p>
                <PMFChart items={mappedDie} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-bold">Distribution of X</p>
                <PDFPlot f={(x) => normalPdf(x, 0, sigma)} min={-4} max={4} shade={false} xLabel="x" />
                <p className="mt-1 text-center text-xs text-slate-400">X ~ N(0, {formatFixed(sigma, 1)}²)</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-bold">Distribution of Y</p>
                {kind === 'square' && showTheory ? (
                  <PDFPlot f={(y) => Math.min(chiSquarePdf(y, 1), 1.4)} min={0.02} max={10} yMax={1.4} shade={false} xLabel="y" />
                ) : kind === 'abs' && showTheory ? (
                  <PDFPlot f={(y) => (y >= 0 ? 2 * normalPdf(y, 0, sigma) : 0)} min={0} max={5} shade={false} xLabel="y" />
                ) : linear ? (
                  <PDFPlot f={(y) => normalPdf(y, bb, Math.abs(aa) * sigma)} min={-8} max={8} shade={false} xLabel="y" />
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    log(X) is only defined for X &gt; 0. Use a positive source, or choose a one-to-one map on the support. We do not plot an incorrect density.
                  </p>
                )}
              </div>
            </div>
          )}
          {linear && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ResultBanner title={`E[aX+b] = a E[X] + b = ${formatFixed(aa * 0 + bb, 2)}`} />
              <ResultBanner tone="info" title={`Var(aX+b) = a² Var(X) = ${formatFixed(aa * aa * sigma * sigma, 2)}`} />
            </div>
          )}
          {kind === 'square' && source === 'normal' && (
            <Insight title="Insight">If X ~ N(0, 1), then Y = X² follows a chi-square distribution with 1 degree of freedom.</Insight>
          )}
          {source === 'die' && (
            <Insight title="Mass can collapse">
              Several x values can map to the same y. Their probabilities add: P(Y = y) = Σ P(X = x) over all x with g(x) = y.
              Mean of X is {formatFixed(discreteMean(die), 2)}; mean of Y is {formatFixed(discreteMean(mappedDie), 2)}; Var(Y) = {formatFixed(discreteVariance(mappedDie), 2)}.
            </Insight>
          )}
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            <MathText value="E[aX+b] = aE[X]+b,\\quad \\mathrm{Var}(aX+b)=a^2\\mathrm{Var}(X)" block />
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">Let X ~ N(2, 3²) and Y = 2X − 1. Find the distribution of Y.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Y = 2X − 1 is a linear transformation</li>
            <li>μ_Y = 2μ_X − 1 = 4 − 1 = 3</li>
            <li>σ²_Y = 2² σ²_X = 4 · 9 = 36, so σ_Y = 6</li>
            <li>Therefore Y ~ N(3, 36)</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="Let X ~ Exponential(λ = 2) and Y = 3X. What is the distribution of Y?"
            options={['Exponential(1/2)', 'Exponential(2)', 'Exponential(2/3)', 'Exponential(6)']}
            answer={2}
            explanation="Y = 3X stretches an Exp(2) into an Exp(2/3)."
            onCorrect={() => markRvLabComplete('transformations')}
          />
        </RvCard>
      }
    />
  )
}
