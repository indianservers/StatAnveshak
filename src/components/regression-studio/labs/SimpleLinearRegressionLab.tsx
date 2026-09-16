import { useEffect, useMemo, useState } from 'react'
import {
  equationText,
  formatNum,
  formatSigned,
  generatePreset,
  simpleOls,
  type Observation,
  type PresetId,
} from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, Metric, QuizBlock, RegCard, RegSelect, RegSlider, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { ScatterChart } from '../plots'

const PRESETS: Array<{ value: PresetId; label: string }> = [
  { value: 'study-exam', label: 'Study hours vs exam score' },
  { value: 'strong-linear', label: 'Strong linear' },
  { value: 'weak-linear', label: 'Weak linear' },
  { value: 'neg-linear', label: 'Negative linear' },
  { value: 'none', label: 'No linear association' },
]

export function SimpleLinearRegressionLab() {
  const [preset, setPreset] = useState<PresetId>('study-exam')
  const [n, setN] = useState(50)
  const [noise, setNoise] = useState(8)
  const [seed, setSeed] = useState(12)
  const [showLine, setShowLine] = useState(true)
  const [custom, setCustom] = useState<Observation[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const generated = useMemo(() => generatePreset(preset, n, seed, noise), [preset, n, seed, noise])
  const points = custom ?? generated
  const fit = useMemo(() => simpleOls(points.map((p) => p.x), points.map((p) => p.y)), [points])
  const fittedPoints = points.map((point, i) => ({ ...point, fitted: fit.fitted[i], residual: fit.residuals[i] }))
  const xmin = Math.min(...points.map((p) => p.x))
  const xmax = Math.max(...points.map((p) => p.x))

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        setCustom(points.filter((point) => point.id !== selectedId))
        setSelectedId(undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [points, selectedId])

  const reset = () => {
    setPreset('study-exam')
    setN(50)
    setNoise(8)
    setSeed(12)
    setShowLine(true)
    setCustom(null)
    setSelectedId(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.7fr)_minmax(240px,0.75fr)]">
        <RegCard title="Study hours vs exam score">
          <p className="mb-2 text-sm text-slate-500">Each point is a student. Double-click to add a point; drag to move; select and press Delete to remove.</p>
          <ScatterChart
            points={fittedPoints}
            xLabel="Study hours"
            yLabel="Exam score"
            editable
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={setCustom}
            onAdd={({ x, y }) => setCustom([...points, { id: `custom-${Date.now()}`, x, y }])}
            lines={
              showLine
                ? [{ a: { x: xmin, y: fit.b0 + fit.b1 * xmin }, b: { x: xmax, y: fit.b0 + fit.b1 * xmax }, label: 'OLS line' }]
                : []
            }
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="reg-btn reg-btn-ghost"
              disabled={!selectedId}
              onClick={() => {
                setCustom(points.filter((point) => point.id !== selectedId))
                setSelectedId(undefined)
              }}
            >
              Delete selected
            </button>
          </div>
        </RegCard>

        <div className="space-y-4">
          <RegCard title="Model equation">
            <FormulaBlock tex={'\\hat{Y}=b_0+b_1 x'} label="Fitted simple linear regression" />
            <p className="mt-3 text-center text-sm font-black text-slate-800 dark:text-white">
              {equationText(fit.b0, [{ name: 'x', coef: fit.b1 }])}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Intercept b0" value={formatNum(fit.b0, 2)} />
              <Metric label="Slope b1" value={formatNum(fit.b1, 2)} />
              <Metric label="R²" value={formatNum(fit.r2, 3)} />
              <Metric label="n" value={String(fit.n)} />
            </div>
          </RegCard>
          <RegCard title="Interpretation">
            <p className="text-sm leading-6 text-slate-600">
              <strong>Intercept (b₀ = {formatNum(fit.b0, 2)}).</strong> Predicted exam score when study hours = 0.
            </p>
            {fit.interceptOutOfRange && (
              <Insight title="X = 0 is outside the data" tone="warn">
                The intercept is a formal number at x = 0. These study hours do not include 0, so treat b₀ as a fitting constant — not a student who studied nothing.
              </Insight>
            )}
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <strong>Slope (b₁ = {formatSigned(fit.b1, 2)}).</strong> Each additional study hour is associated with a {formatNum(Math.abs(fit.b1), 2)}-point {fit.b1 >= 0 ? 'increase' : 'decrease'} in predicted exam score. That is an association, not an automatic causal effect.
            </p>
          </RegCard>
        </div>

        <RegCard title="Dataset and model controls" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <RegSelect
              label="Dataset"
              value={preset}
              onChange={(value) => {
                setPreset(value as PresetId)
                setCustom(null)
              }}
              options={PRESETS}
            />
            <RegToggle label="Show regression line" checked={showLine} onChange={setShowLine} />
            <RegSlider label="Sample size (n)" value={n} min={10} max={120} step={1} onChange={(value) => { setN(value); setCustom(null) }} />
            <RegSlider label="Noise / variability" value={noise} min={1} max={20} step={0.5} display={formatNum(noise, 1)} onChange={(value) => { setNoise(value); setCustom(null) }} />
            <button type="button" className="reg-btn w-full" onClick={() => { setSeed((s) => s + 1); setCustom(null) }}>
              Update plot
            </button>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              'Fit a simple linear model of exam score on study hours by least squares.',
              `Estimated equation: ${equationText(fit.b0, [{ name: 'x', coef: fit.b1 }])}.`,
              `A student who studies 4 hours has predicted score ${formatNum(fit.b0 + fit.b1 * 4, 1)}.`,
            ]}
            result={`A student who studies 4 hours is predicted to score ${formatNum(fit.b0 + fit.b1 * 4, 1)} on the exam.`}
          />
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: `Using Ŷ = ${formatNum(fit.b0, 2)} + ${formatNum(fit.b1, 2)}x, what is the predicted exam score at 6 study hours?`,
                options: [
                  formatNum(fit.b0 + fit.b1 * 6, 1),
                  formatNum(fit.b0, 1),
                  formatNum(fit.b1 * 6, 1),
                  formatNum(fit.r2, 2),
                ],
                answer: 0,
                hint: 'Substitute x = 6 into the equation.',
                explanation: `Plug in x = 6: ${formatNum(fit.b0, 2)} + ${formatNum(fit.b1, 2)}×6 = ${formatNum(fit.b0 + fit.b1 * 6, 1)}.`,
              },
            ]}
          />
        </RegCard>
        <RegCard title="Key concepts">
          <ConceptList
            items={[
              'Simple linear regression models one response with one predictor: Ŷ = b₀ + b₁x.',
              'The slope is the average change in the predicted response for a one-unit increase in x.',
              'The intercept is the predicted response at x = 0 and may sit outside the data range.',
              'Always check residuals before trusting the line. Correlation is not the same as regression, and neither is automatically causal.',
            ]}
          />
        </RegCard>
      </div>
    </div>
  )
}
