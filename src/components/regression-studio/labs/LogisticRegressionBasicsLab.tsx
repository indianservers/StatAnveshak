import { useMemo, useState } from 'react'
import {
  confusionMatrix,
  formatNum,
  generatePreset,
  logisticFit,
  sigmoid,
} from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, Metric, QuizBlock, RegCard, RegSelect, RegSlider, RegToggle, ResetButton } from '../shared'
import { HorizontalBars, ScatterChart } from '../plots'

export function LogisticRegressionBasicsLab() {
  const [preset, setPreset] = useState<'heart-disease' | 'logistic-separation'>('heart-disease')
  const [threshold, setThreshold] = useState(0.5)
  const [showCurve, setShowCurve] = useState(true)
  const [showThreshold, setShowThreshold] = useState(true)
  const [showPoints, setShowPoints] = useState(true)
  const [seed, setSeed] = useState(33)

  const points = useMemo(() => generatePreset(preset, 70, seed, 1), [preset, seed])
  const y = points.map((p) => p.binaryY ?? p.y)
  const x = points.map((p) => p.x)
  const fit = logisticFit(y, [x], ['Age'])
  const matrix = confusionMatrix(y, fit.probability, threshold)
  const xs = useMemo(() => {
    const lo = Math.min(...x) - 4
    const hi = Math.max(...x) + 4
    return Array.from({ length: 50 }, (_, i) => lo + ((hi - lo) * i) / 49)
  }, [x])
  const curve = xs.map((value) => sigmoid((fit.beta[0] ?? 0) + (fit.beta[1] ?? 0) * value))
  const xAtHalf = fit.beta[1] ? -((fit.beta[0] ?? 0) / (fit.beta[1] ?? 1)) : meanSafe(x)
  const styled = points.map((point) => ({
    ...point,
    y: point.binaryY ?? point.y,
    style: (point.binaryY ?? point.y) === 1 ? ('square' as const) : ('circle' as const),
    label: (point.binaryY ?? point.y) === 1 ? 'Y = 1' : 'Y = 0',
  }))
  const lines = showCurve
    ? xs.slice(0, -1).map((value, i) => ({
        a: { x: value, y: curve[i] },
        b: { x: xs[i + 1], y: curve[i + 1] },
        color: '#2563eb',
        label: 'Fitted probability',
      }))
    : []

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.8fr)_minmax(230px,0.65fr)]">
        <RegCard title="Logistic regression fit">
          <p className="mb-2 text-sm text-slate-500">
            Open circles are Y = 0; filled squares are Y = 1. The S-curve is fitted probability. The dashed line is a decision threshold — moving it does not change the curve.
          </p>
          <ScatterChart
            points={showPoints ? styled : []}
            xLabel="Age"
            yLabel="Probability of Y = 1"
            yDomain={[-0.05, 1.08]}
            lines={[
              ...lines,
              ...(showThreshold
                ? [{ a: { x: Math.min(...xs), y: threshold }, b: { x: Math.max(...xs), y: threshold }, dashed: true, color: '#64748b', label: `Threshold ${formatNum(threshold, 2)}` }]
                : []),
            ]}
            marker={showThreshold ? { x: xAtHalf, y: 0.5, label: 'p = 0.5' } : undefined}
          />
        </RegCard>
        <div className="space-y-4">
          <RegCard title="Key idea">
            <FormulaBlock tex={'P(Y=1\\mid X)=\\dfrac{1}{1+\\exp(-(b_0+b_1 X))}' } label="Logistic probability" />
            <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-600">
              <li>Outputs a probability between 0 and 1.</li>
              <li>Models the log-odds as a linear function of the predictor.</li>
              <li>Used for classification decisions after you pick a threshold.</li>
            </ul>
          </RegCard>
          <RegCard title="Fitted model">
            <p className="text-sm font-black">log-odds = {formatNum(fit.beta[0] ?? 0, 3)} + {formatNum(fit.beta[1] ?? 0, 3)} × Age</p>
            <p className="mt-2 text-sm text-slate-600">
              Odds ratio = e<sup>{formatNum(fit.beta[1] ?? 0, 3)}</sup> = {formatNum(fit.oddsRatio[1] ?? 0, 3)}. Each additional year of age is associated with a {formatNum(100 * ((fit.oddsRatio[1] ?? 1) - 1), 1)}% change in the odds of the outcome.
            </p>
            {fit.separated && (
              <Insight title="Complete separation warning" tone="warn">
                In this sample the predictor almost perfectly separates the two classes. Coefficients can explode and probabilities pile up at 0 and 1. Treat the fit as unstable.
              </Insight>
            )}
          </RegCard>
        </div>
        <RegCard title="Try it yourself" action={<ResetButton onClick={() => { setPreset('heart-disease'); setThreshold(0.5); setSeed(33); setShowCurve(true); setShowThreshold(true); setShowPoints(true) }} />}>
          <div className="space-y-3">
            <RegSelect
              label="Dataset"
              value={preset}
              onChange={(value) => setPreset(value as 'heart-disease' | 'logistic-separation')}
              options={[
                { value: 'heart-disease', label: 'Heart disease (binary outcome)' },
                { value: 'logistic-separation', label: 'Near-complete separation' },
              ]}
            />
            <RegToggle label="Show logistic curve" checked={showCurve} onChange={setShowCurve} />
            <RegToggle label="Show decision threshold" checked={showThreshold} onChange={setShowThreshold} />
            <RegToggle label="Show data points" checked={showPoints} onChange={setShowPoints} />
            <RegSlider label="Decision threshold" value={threshold} min={0.05} max={0.95} step={0.01} display={formatNum(threshold, 2)} onChange={setThreshold} />
            <Insight title="Threshold is a decision rule" tone="info">
              Fitted probabilities stay put when the threshold moves. Only the confusion-matrix counts change.
            </Insight>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Model output">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Coefficient</th>
                <th>Odds ratio</th>
              </tr>
            </thead>
            <tbody>
              {fit.names.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{formatNum(fit.beta[i] ?? 0, 3)}</td>
                  <td>{i === 0 ? '—' : formatNum(fit.oddsRatio[i] ?? 0, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RegCard>
        <RegCard title="Confusion matrix at this threshold">
          <table className="reg-table">
            <thead>
              <tr>
                <th />
                <th>Predicted 1</th>
                <th>Predicted 0</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Actual 1</td>
                <td>TP {matrix.tp}</td>
                <td>FN {matrix.fn}</td>
              </tr>
              <tr>
                <td>Actual 0</td>
                <td>FP {matrix.fp}</td>
                <td>TN {matrix.tn}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="Accuracy" value={formatNum(matrix.accuracy, 2)} />
            <Metric label="Precision" value={formatNum(matrix.precision, 2)} />
            <Metric label="Recall" value={formatNum(matrix.recall, 2)} />
          </div>
        </RegCard>
        <RegCard title="Model performance">
          <HorizontalBars
            items={[
              { label: 'Accuracy', value: matrix.accuracy },
              { label: 'Precision', value: matrix.precision, pattern: 'hatch' },
              { label: 'Recall', value: matrix.recall },
            ]}
          />
          <QuizBlock
            items={[
              {
                prompt: 'You move the decision threshold from 0.3 to 0.7. What happens to the fitted probability curve?',
                options: [
                  'The S-curve shifts so that p = 0.7 at the old midpoint.',
                  'Nothing. Fitted probabilities are unchanged; only class assignments change.',
                  'All odds ratios are recomputed.',
                  'Complete separation is created.',
                ],
                answer: 1,
                explanation: 'The model’s p̂ = 1 / (1 + e^{−η}) does not depend on a later cutoff. The cutoff is a decision rule layered on top.',
              },
            ]}
          />
        </RegCard>
      </div>
      <RegCard title="Key concepts">
        <ConceptList
          items={[
            'Logistic regression models P(Y = 1 | X) with a stable sigmoid of the linear predictor.',
            'Coefficients live on the log-odds scale; exp(β₁) is an odds ratio.',
            'A threshold is a decision rule. Changing it does not change fitted probabilities.',
            'Complete separation makes estimates unstable — the lab warns instead of hiding it.',
          ]}
        />
      </RegCard>
    </div>
  )
}

function meanSafe(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
