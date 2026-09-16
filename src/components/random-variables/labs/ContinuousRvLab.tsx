import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  betaCdf,
  betaPdf,
  clamp,
  exponentialCdf,
  exponentialPdf,
  formatFixed,
  formatNum,
  intervalProbability,
  markRvLabComplete,
  normalCdf,
  normalPdf,
  uniformCdf,
  uniformPdf,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { PDFPlot } from '../plots'
import { ChipToggle, ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect, RvSlider } from '../shared'

type Dist = 'normal' | 'uniform' | 'exponential' | 'beta'

const CONCEPTS = [
  { id: 'continuous', title: 'Continuous random variable', detail: 'A random variable that can take any value in an interval of real numbers.' },
  { id: 'pdf', title: 'Probability density function (PDF)', detail: 'A function f(x) ≥ 0 whose total area is 1: ∫ f(x) dx = 1.' },
  { id: 'area', title: 'Probabilities as areas', detail: 'P(a ≤ X ≤ b) is the area under the PDF between a and b.' },
  { id: 'normal', title: 'Normal distribution', detail: 'A fundamental bell-shaped model determined by mean μ and standard deviation σ.' },
]

export function ContinuousRvLab({ tab }: { tab: string }) {
  const [dist, setDist] = useState<Dist>('normal')
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(1)
  const [lambda, setLambda] = useState(1)
  const [alpha, setAlpha] = useState(2)
  const [beta, setBeta] = useState(5)
  const [a, setA] = useState(-1)
  const [b, setB] = useState(1)
  const [shade, setShade] = useState(true)
  const [showPoint, setShowPoint] = useState(false)
  const [concept, setConcept] = useState('continuous')

  const model = useMemo(() => {
    if (dist === 'uniform') {
      return {
        pdf: (x: number) => uniformPdf(x, -3, 3),
        cdf: (x: number) => uniformCdf(x, -3, 3),
        min: -3.2,
        max: 3.2,
      }
    }
    if (dist === 'exponential') {
      return {
        pdf: (x: number) => exponentialPdf(x, lambda),
        cdf: (x: number) => exponentialCdf(x, lambda),
        min: 0,
        max: 8 / Math.max(lambda, 0.2),
      }
    }
    if (dist === 'beta') {
      return {
        pdf: (x: number) => betaPdf(x, alpha, beta),
        cdf: (x: number) => betaCdf(x, alpha, beta),
        min: 0,
        max: 1,
      }
    }
    return {
      pdf: (x: number) => normalPdf(x, mu, sigma),
      cdf: (x: number) => normalCdf(x, mu, sigma),
      min: mu - 4 * sigma,
      max: mu + 4 * sigma,
    }
  }, [alpha, beta, dist, lambda, mu, sigma])

  const lo = clamp(Math.min(a, b), model.min, model.max)
  const hi = clamp(Math.max(a, b), model.min, model.max)
  const prob = intervalProbability(model.cdf, lo, hi)

  const reset = () => {
    setDist('normal')
    setMu(0)
    setSigma(1)
    setLambda(1)
    setA(-1)
    setB(1)
    setShade(true)
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="Let X ~ N(5, 2²). What is P(3 ≤ X ≤ 7)?"
          options={['0.3413', '0.4772', '0.6827', '0.9545']}
          answer={2}
          explanation="Standardize: P(−1 ≤ Z ≤ 1) ≈ 0.6827 for a standard normal."
          onCorrect={() => markRvLabComplete('continuous-random-variables')}
        />
      </RvCard>
    )
  }

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive density" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Adjust the parameters and explore probabilities as areas under the curve.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Distribution"
              value={dist}
              onChange={(value) => setDist(value as Dist)}
              options={[
                { value: 'normal', label: 'Normal distribution' },
                { value: 'uniform', label: 'Uniform' },
                { value: 'exponential', label: 'Exponential' },
                { value: 'beta', label: 'Beta-like shape' },
              ]}
            />
            <div className="space-y-2">
              <ChipToggle checked={shade} onChange={setShade} label="Show shaded area" />
              <ChipToggle checked={showPoint} onChange={setShowPoint} label="Show P(X = x) = 0" />
            </div>
          </div>
          {dist === 'normal' && (
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <RvSlider label="Mean (μ)" value={mu} min={-3} max={3} step={0.1} onChange={setMu} display={formatFixed(mu, 1)} />
              <RvSlider label="Standard deviation (σ)" value={sigma} min={0.1} max={3} step={0.1} onChange={setSigma} display={formatFixed(sigma, 1)} />
            </div>
          )}
          {dist === 'exponential' && (
            <RvSlider label="Rate (λ)" value={lambda} min={0.2} max={3} step={0.1} onChange={setLambda} display={formatFixed(lambda, 1)} />
          )}
          {dist === 'beta' && (
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <RvSlider label="α" value={alpha} min={0.5} max={8} step={0.1} onChange={setAlpha} />
              <RvSlider label="β" value={beta} min={0.5} max={8} step={0.1} onChange={setBeta} />
            </div>
          )}
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <RvSlider label="Interval a" value={a} min={model.min} max={model.max} step={0.05} onChange={setA} display={formatFixed(a, 2)} />
            <RvSlider label="Interval b" value={b} min={model.min} max={model.max} step={0.05} onChange={setB} display={formatFixed(b, 2)} />
          </div>
          <p className="mb-1 text-sm font-bold text-slate-700">Probability density function</p>
          <PDFPlot
            f={model.pdf}
            min={model.min}
            max={model.max}
            a={lo}
            b={hi}
            shade={shade}
            onDragInterval={(edge, value) => {
              if (edge === 'a') setA(value)
              else setB(value)
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <MathText value="P(a \\le X \\le b) = \\int_a^b f(x)\\,dx" />
            </p>
            <ResultBanner title={`P(${formatFixed(lo, 2)} ≤ X ≤ ${formatFixed(hi, 2)}) = ${formatFixed(prob, 4)}`} />
          </div>
          {showPoint && (
            <Insight title="Exact point probability">
              For a continuous random variable, P(X = x) = 0. Probability lives in intervals — the height f(x) is density, not chance.
            </Insight>
          )}
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            {concept === 'area' ? <MathText value="P(a \\le X \\le b) = \\int_a^b f(x)\\,dx" block /> : <MathText value="\\int_{-\\infty}^{\\infty} f(x)\\,dx = 1" block />}
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">Let X be a normal random variable with μ = 0 and σ = 1. Find P(−1 ≤ X ≤ 1).</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Standardize: Z ~ N(0, 1)</li>
            <li>P(−1 ≤ X ≤ 1) = Φ(1) − Φ(−1) ≈ 0.6827</li>
            <li>About 68.27% of values lie within one standard deviation of the mean.</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="Let X ~ N(5, 2²). What is P(3 ≤ X ≤ 7)?"
            options={['0.3413', '0.4772', '0.6827', '0.9545']}
            answer={2}
            explanation="P(3 ≤ X ≤ 7) = P(−1 ≤ Z ≤ 1) ≈ 0.6827."
            onCorrect={() => markRvLabComplete('continuous-random-variables')}
          />
        </RvCard>
      }
    />
  )
}
