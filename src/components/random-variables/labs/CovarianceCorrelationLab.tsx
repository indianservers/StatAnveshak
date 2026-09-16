import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  EXAM_SCORES,
  formatFixed,
  generateLinearCloud,
  generateOutlierCloud,
  generateUCloud,
  markRvLabComplete,
  pearsonR,
  sampleCovariance,
  sampleMean,
  STUDY_HOURS,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { ScatterPlot } from '../plots'
import { ChipToggle, ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect, RvSlider } from '../shared'

type Preset = 'strong-pos' | 'weak-pos' | 'none' | 'weak-neg' | 'strong-neg' | 'u' | 'outlier'

const CONCEPTS = [
  { id: 'cov', title: 'Covariance', detail: 'Cov(X, Y) measures the direction of the linear relationship between two random variables. Cov > 0 is positive, < 0 is negative, and 0 means no linear relationship.' },
  { id: 'corr', title: 'Correlation', detail: 'The correlation coefficient r standardizes covariance, measuring the strength and direction of a linear relationship on a scale from −1 to 1.' },
  { id: 'props', title: 'Key properties', detail: 'r is unitless and unaffected by changing location or scale. r = 1 is perfect positive, r = −1 is perfect negative, r = 0 is no linear relationship. Correlation measures linear association, not causation.' },
]

function cloudFor(preset: Preset, strength: number, noise: number): Array<{ x: number; y: number }> {
  if (preset === 'u') return generateUCloud(48)
  if (preset === 'outlier') return generateOutlierCloud(40)
  const sign = preset.includes('neg') ? -1 : 1
  const mag = preset === 'none' ? 0 : preset.startsWith('weak') ? 0.35 : preset.startsWith('strong') ? 0.85 : Math.abs(strength)
  return generateLinearCloud(48, sign * mag, noise)
}

export function CovarianceCorrelationLab({ tab }: { tab: string }) {
  const [preset, setPreset] = useState<Preset>('strong-pos')
  const [strength, setStrength] = useState(0.8)
  const [noise, setNoise] = useState(0.2)
  const [showLine, setShowLine] = useState(true)
  const [showMeans, setShowMeans] = useState(false)
  const [points, setPoints] = useState(() => cloudFor('strong-pos', 0.8, 0.2))
  const [concept, setConcept] = useState('cov')

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const mx = sampleMean(xs)
  const my = sampleMean(ys)
  const cov = sampleCovariance(xs, ys)
  const r = pearsonR(xs, ys)

  const rebuild = (next: Preset, nextStrength = strength, nextNoise = noise) => {
    setPreset(next)
    setPoints(cloudFor(next, nextStrength, nextNoise))
  }

  const reset = () => {
    setStrength(0.8)
    setNoise(0.2)
    rebuild('strong-pos', 0.8, 0.2)
  }

  const tone = Math.abs(r) > 0.7 ? 'ok' : Math.abs(r) > 0.3 ? 'info' : 'warn'

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="Which of the following best describes a correlation coefficient of r = −0.65?"
          options={['Strong positive relationship', 'Moderate negative linear relationship', 'Weak negative linear relationship', 'No linear relationship']}
          answer={1}
          explanation="|r| ≈ 0.65 is a moderate linear association, and the sign is negative."
          onCorrect={() => markRvLabComplete('covariance-correlation')}
        />
      </RvCard>
    )
  }

  return (
    <LabSplit
      demo={
        <RvCard title="Interactive scatterplot" action={<ResetButton onClick={reset} />}>
          <p className="mb-3 text-xs text-slate-400">Adjust the relationship between X and Y to see how covariance and correlation change.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Preset"
              value={preset}
              onChange={(value) => rebuild(value as Preset)}
              options={[
                { value: 'strong-pos', label: 'Strong positive' },
                { value: 'weak-pos', label: 'Weak positive' },
                { value: 'none', label: 'No linear correlation' },
                { value: 'weak-neg', label: 'Weak negative' },
                { value: 'strong-neg', label: 'Strong negative' },
                { value: 'u', label: 'Nonlinear U-shape' },
                { value: 'outlier', label: 'Outlier influence' },
              ]}
            />
            <div className="space-y-2">
              <ChipToggle checked={showLine} onChange={setShowLine} label="Show best-fit line" />
              <ChipToggle checked={showMeans} onChange={setShowMeans} label="Show means (x̄, ȳ)" />
            </div>
          </div>
          <RvSlider
            label="Relationship strength |r|"
            value={strength}
            min={0}
            max={0.95}
            step={0.05}
            onChange={(value) => {
              setStrength(value)
              rebuild(preset.includes('neg') ? 'strong-neg' : 'strong-pos', value, noise)
            }}
            display={formatFixed(strength, 2)}
          />
          <RvSlider
            label="Noise level"
            value={noise}
            min={0}
            max={1.2}
            step={0.05}
            onChange={(value) => {
              setNoise(value)
              rebuild(preset, strength, value)
            }}
            display={formatFixed(noise, 2)}
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
            <ScatterPlot
              points={points}
              showLine={showLine}
              showMeans={showMeans}
              onMove={(index, point) => {
                setPoints((prev) => prev.map((item, i) => (i === index ? point : item)))
              }}
            />
            <div className="space-y-3">
              <ResultBanner tone="info" title={formatFixed(cov, 3)}>
                Covariance (data units²)
              </ResultBanner>
              <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{formatFixed(r, 3)}</p>
              <p className="text-xs text-slate-400">Correlation r (−1 ≤ r ≤ 1)</p>
              <ResultBanner tone={tone} title={Math.abs(r) < 0.15 ? 'Little linear association' : r > 0 ? 'Positive linear relationship' : 'Negative linear relationship'} />
            </div>
          </div>
          <Insight title="Quadrants around the means">
            Blue points sit in same-sign quadrants — they add to covariance. Rose points sit in opposite-sign quadrants — they subtract.
            Mean X = {formatFixed(mx, 2)}, mean Y = {formatFixed(my, 2)}.
            {preset === 'u' ? ' The U-shape is a clear relationship, but Pearson r can sit near zero because the association is not linear.' : ''}
          </Insight>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            <MathText value="\\rho = \\frac{\\mathrm{Cov}(X,Y)}{\\sigma_X \\sigma_Y}" block />
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">Study hours (X) and exam scores (Y) for 6 students:</p>
          <table className="rv-table mt-2">
            <thead>
              <tr>
                {STUDY_HOURS.map((h, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {STUDY_HOURS.map((h) => (
                  <td key={h}>{h}</td>
                ))}
              </tr>
              <tr>
                {EXAM_SCORES.map((s) => (
                  <td key={s}>{s}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Cov(X, Y) = {formatFixed(sampleCovariance(STUDY_HOURS, EXAM_SCORES), 2)}</li>
            <li>r = {formatFixed(pearsonR(STUDY_HOURS, EXAM_SCORES), 3)}</li>
            <li>There is a strong positive linear relationship between study hours and exam scores.</li>
          </ul>
        </RvCard>
      }
      practice={
        <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
          <QuizBlock
            prompt="Which of the following best describes a correlation coefficient of r = −0.65?"
            options={['Strong positive relationship', 'Moderate negative linear relationship', 'Weak negative linear relationship', 'No linear relationship']}
            answer={1}
            explanation="A correlation of −0.65 is a moderate negative linear relationship."
            onCorrect={() => markRvLabComplete('covariance-correlation')}
          />
        </RvCard>
      }
    />
  )
}
