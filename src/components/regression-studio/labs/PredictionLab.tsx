import { useMemo, useState } from 'react'
import {
  equationText,
  formatNum,
  generatePreset,
  interpolationKind,
  predictSimple,
  simpleOls,
} from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, Metric, QuizBlock, RegCard, RegSlider, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { ScatterChart } from '../plots'

export function PredictionLab() {
  const [n, setN] = useState(50)
  const [noise, setNoise] = useState(8)
  const [seed, setSeed] = useState(14)
  const [showLine, setShowLine] = useState(true)
  const [showMarker, setShowMarker] = useState(true)
  const [xStar, setXStar] = useState(7)

  const points = useMemo(() => generatePreset('study-exam', n, seed, noise), [n, seed, noise])
  const fit = useMemo(() => simpleOls(points.map((p) => p.x), points.map((p) => p.y)), [points])
  const yhat = predictSimple(fit, xStar)
  const kind = interpolationKind(xStar, points.map((p) => p.x))
  const xmin = Math.min(...points.map((p) => p.x))
  const xmax = Math.max(...points.map((p) => p.x))
  const fitted = points.map((point, i) => ({ ...point, fitted: fit.fitted[i] }))

  const reset = () => {
    setN(50)
    setNoise(8)
    setSeed(14)
    setShowLine(true)
    setShowMarker(true)
    setXStar(7)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.7fr)_minmax(240px,0.75fr)]">
        <RegCard title="Predicting exam score from study hours">
          <p className="mb-2 text-sm text-slate-500">The highlighted marker is the predicted score at the chosen study hours.</p>
          <ScatterChart
            points={fitted}
            xLabel="Study hours"
            yLabel="Exam score"
            yDomain={[20, 110]}
            lines={showLine ? [{ a: { x: Math.min(xmin, xStar), y: fit.b0 + fit.b1 * Math.min(xmin, xStar) }, b: { x: Math.max(xmax, xStar), y: fit.b0 + fit.b1 * Math.max(xmax, xStar) }, label: 'Fitted line' }] : []}
            marker={showMarker ? { x: xStar, y: yhat, label: `Predicted ${formatNum(yhat, 1)}` } : undefined}
          />
        </RegCard>
        <div className="space-y-4">
          <RegCard title="Model equation">
            <FormulaBlock tex={'\\hat{Y}=b_0+b_1 x'} />
            <p className="mt-3 text-center text-sm font-black">{equationText(fit.b0, [{ name: 'x', coef: fit.b1 }])}</p>
          </RegCard>
          <RegCard title="Prediction input">
            <p className="text-sm text-slate-500">Enter a study-hour value to get a predicted exam score from the fitted model.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Study hours x*" value={formatNum(xStar, 1)} />
              <Metric label="Predicted score" value={formatNum(yhat, 1)} />
            </div>
          </RegCard>
        </div>
        <RegCard title="Dataset and plot controls" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <RegToggle label="Show regression line" checked={showLine} onChange={setShowLine} />
            <RegToggle label="Show prediction marker" checked={showMarker} onChange={setShowMarker} />
            <RegSlider label="Study hours (x*)" value={xStar} min={-1} max={14} step={0.1} display={formatNum(xStar, 1)} onChange={setXStar} />
            <RegSlider label="Sample size (n)" value={n} min={10} max={120} step={1} onChange={setN} />
            {kind === 'interpolation' ? (
              <Insight title="Inside the data range" tone="ok">
                x* = {formatNum(xStar, 1)} sits between {formatNum(xmin, 1)} and {formatNum(xmax, 1)}. This is interpolation.
              </Insight>
            ) : (
              <Insight title="Extrapolation caution" tone="warn">
                x* = {formatNum(xStar, 1)} is outside {formatNum(xmin, 1)}–{formatNum(xmax, 1)}. The formula still returns a number; the line may not hold there.
              </Insight>
            )}
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Prediction example">
          <WorkedSteps
            steps={[
              `Fitted model: ${equationText(fit.b0, [{ name: 'x', coef: fit.b1 }])}.`,
              `Plug in x* = 7: ${formatNum(fit.b0, 2)} + ${formatNum(fit.b1, 2)}×7.`,
              `Predicted score = ${formatNum(predictSimple(fit, 7), 1)}.`,
            ]}
            result={`A student who studies 7 hours is predicted to score ${formatNum(predictSimple(fit, 7), 1)}. That is a mean-response prediction, not a guarantee for one person.`}
          />
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: `What is the predicted exam score for a student who studies 9 hours?`,
                options: [
                  formatNum(predictSimple(fit, 9), 1),
                  formatNum(fit.b0, 1),
                  formatNum(fit.b1, 2),
                  formatNum(fit.r2, 2),
                ],
                answer: 0,
                hint: `Use ${equationText(fit.b0, [{ name: 'x', coef: fit.b1 }])}.`,
                explanation: `9 hours: ${formatNum(fit.b0, 2)} + ${formatNum(fit.b1, 2)}×9 = ${formatNum(predictSimple(fit, 9), 1)}.`,
              },
            ]}
          />
        </RegCard>
        <RegCard title="Key concepts">
          <ConceptList
            items={[
              'The fitted line predicts a mean response for a given x*.',
              'One new student still varies around that mean — prediction is not a promise.',
              'Interpolation stays inside the observed x range; extrapolation does not.',
              'A slope is an association per unit of x. Check assumptions before using the number.',
            ]}
          />
        </RegCard>
      </div>
    </div>
  )
}
