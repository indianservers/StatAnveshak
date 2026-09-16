import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { diePmf, discreteMean, discreteSd, discreteVariance, formatFixed, markRvLabComplete, normalPdf } from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { PDFPlot, PMFChart } from '../plots'
import { ChipToggle, ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect, RvSlider } from '../shared'

const CONCEPTS = [
  { id: 'var', title: 'Variance (σ²)', detail: 'Variance is the average of the squared deviations from the mean: σ² = E[(X − μ)²].' },
  { id: 'sd', title: 'Standard deviation (σ)', detail: 'The standard deviation is the square root of the variance and has the same units as X: σ = √σ².' },
  { id: 'interpret', title: 'Interpretation', detail: 'A larger variance or standard deviation means greater spread — more variability in the data.' },
  { id: 'props', title: 'Properties', detail: 'σ² ≥ 0 and σ ≥ 0. If X is a constant, then σ² = 0. Standard deviation is not resistant to the mean in the sense that it uses every deviation.' },
]

export function VarianceSdLab({ tab }: { tab: string }) {
  const [mode, setMode] = useState<'same-mean' | 'same-var' | 'discrete'>('same-mean')
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(0.5)
  const [refSigma, setRefSigma] = useState(2)
  const [showMean, setShowMean] = useState(true)
  const [show1, setShow1] = useState(true)
  const [show2, setShow2] = useState(false)
  const [concept, setConcept] = useState('var')
  const die = diePmf()

  const reset = () => {
    setMode('same-mean')
    setMu(0)
    setSigma(0.5)
    setRefSigma(2)
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="A random variable X has mean μ = 10 and variance σ² = 16. What is the standard deviation σ?"
          options={['2', '4', '8', '16']}
          answer={1}
          explanation="σ = √16 = 4."
          onCorrect={() => markRvLabComplete('variance-standard-deviation')}
        />
      </RvCard>
    )
  }

  const leftMu = mode === 'same-var' ? -2 : mu
  const rightMu = mode === 'same-var' ? 2 : mu
  const leftSigma = mode === 'same-var' ? 1 : sigma
  const rightSigma = mode === 'same-var' ? 1 : refSigma

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive distribution explorer" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Adjust the spread to see how variance and standard deviation change.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Comparison mode"
              value={mode}
              onChange={(value) => setMode(value as typeof mode)}
              options={[
                { value: 'same-mean', label: 'Same mean, different variance' },
                { value: 'same-var', label: 'Different mean, same variance' },
                { value: 'discrete', label: 'Fair die (discrete)' },
              ]}
            />
            <div className="space-y-2">
              <ChipToggle checked={showMean} onChange={setShowMean} label="Show mean (μ)" />
              <ChipToggle checked={show1} onChange={setShow1} label="Show ±1σ region" />
              <ChipToggle checked={show2} onChange={setShow2} label="Show ±2σ region" />
            </div>
          </div>
          {mode !== 'discrete' && (
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <RvSlider label="Mean (μ)" value={mu} min={-2} max={2} step={0.1} onChange={setMu} display={formatFixed(mu, 1)} />
              <RvSlider label="Standard deviation (σ)" value={sigma} min={0.1} max={3} step={0.1} onChange={setSigma} display={formatFixed(sigma, 1)} />
            </div>
          )}
          {mode === 'discrete' ? (
            <div>
              <PMFChart items={die} mean={discreteMean(die)} />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {die.map((item) => (
                  <p key={item.x} className="text-xs text-slate-500">
                    x={item.x}: x−μ = {formatFixed(item.x - discreteMean(die), 2)}, (x−μ)² = {formatFixed((item.x - discreteMean(die)) ** 2, 2)}
                  </p>
                ))}
              </div>
              <ResultBanner title={`Var(X) = ${formatFixed(discreteVariance(die), 4)}`}>
                σ = {formatFixed(discreteSd(die), 4)}
              </ResultBanner>
            </div>
          ) : (
            <>
              <p className="mb-1 text-sm font-bold text-slate-700">Effect of standard deviation on a distribution</p>
              <PDFPlot
                f={(x) => normalPdf(x, leftMu, leftSigma)}
                overlays={[{ f: (x) => normalPdf(x, rightMu, rightSigma), color: '#8b5cf6', label: 'wide' }]}
                min={-5}
                max={5}
                a={show1 ? leftMu - leftSigma : undefined}
                b={show1 ? leftMu + leftSigma : undefined}
                shade={show1}
                markers={[
                  ...(showMean ? [{ x: leftMu, label: 'μ', color: '#2563eb' }] : []),
                  ...(show2 ? [{ x: leftMu - 2 * leftSigma, color: '#93c5fd' }, { x: leftMu + 2 * leftSigma, color: '#93c5fd' }] : []),
                ]}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <p className="text-xs text-slate-500">
                  N({formatFixed(leftMu, 1)}, {formatFixed(leftSigma, 1)}²) · σ² = {formatFixed(leftSigma ** 2, 4)}
                </p>
                <p className="text-xs text-slate-500">
                  N({formatFixed(rightMu, 1)}, {formatFixed(rightSigma, 1)}²) · σ² = {formatFixed(rightSigma ** 2, 4)}
                </p>
              </div>
              <Insight title="Larger σ means more spread">
                Keep μ fixed and raise σ. The curve flattens and probability mass moves away from the mean even though the balance point does not move.
              </Insight>
            </>
          )}
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/70">
            <p className="font-bold">Formulas</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <MathText value="\\sigma^2 = E[(X-\\mu)^2]" />
              <MathText value="\\sigma = \\sqrt{\\sigma^2}" />
            </div>
          </div>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">A fair die is rolled. Find the variance and standard deviation.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Values x = 1,…,6, μ = 3.5</li>
            <li>Variance σ² = (1/6) Σ (x − 3.5)² = 35/12 ≈ 2.9167</li>
            <li>Standard deviation σ = √(35/12) ≈ 1.7078</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="A random variable X has mean μ = 10 and variance σ² = 16. What is the standard deviation σ?"
            options={['2', '4', '8', '16']}
            answer={1}
            explanation="σ = √16 = 4."
            onCorrect={() => markRvLabComplete('variance-standard-deviation')}
          />
        </RvCard>
      }
    />
  )
}
