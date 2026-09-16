import { useMemo, useState } from 'react'
import {
  formatNum,
  generatePreset,
  multipleOls,
  polynomialColumns,
  predictFromColumns,
  rmse,
  simpleOls,
  trainTestSplit,
} from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, QuizBlock, RegCard, RegSlider, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { ScatterChart } from '../plots'

export function PolynomialRegressionLab() {
  const [degree, setDegree] = useState(2)
  const [n, setN] = useState(50)
  const [seed, setSeed] = useState(24)
  const [showLinear, setShowLinear] = useState(true)
  const [xStar, setXStar] = useState(105)

  const points = useMemo(() => generatePreset('ice-cream', n, seed, 14), [n, seed])
  const split = useMemo(() => trainTestSplit(points, seed, 0.7), [points, seed])
  const linear = simpleOls(split.train.map((p) => p.x), split.train.map((p) => p.y))
  const poly = polynomialColumns(split.train.map((p) => p.x), degree)
  const fit = multipleOls(split.train.map((p) => p.y), poly.columns, poly.names)
  const xs = useMemo(() => {
    const lo = Math.min(...points.map((p) => p.x)) - 8
    const hi = Math.max(...points.map((p) => p.x)) + 18
    return Array.from({ length: 60 }, (_, i) => lo + ((hi - lo) * i) / 59)
  }, [points])
  const curve = predictFromColumns(fit.beta, polynomialColumns(xs, degree).columns)
  const testPred = predictFromColumns(fit.beta, polynomialColumns(split.test.map((p) => p.x), degree).columns)
  const trainRmse = rmse(split.train.map((p) => p.y), fit.fitted)
  const testRmse = rmse(split.test.map((p) => p.y), testPred)
  const linearTest = split.test.map((p) => linear.b0 + linear.b1 * p.x)
  const yStar = predictFromColumns(fit.beta, polynomialColumns([xStar], degree).columns)[0]
  const xmax = Math.max(...points.map((p) => p.x))

  const lines = xs.slice(0, -1).map((x, i) => ({
    a: { x, y: curve[i] },
    b: { x: xs[i + 1], y: curve[i + 1] },
    color: '#2563eb',
    label: `Degree ${degree} fit`,
  }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.7fr)_minmax(230px,0.65fr)]">
        <RegCard title="Sales vs temperature">
          <p className="mb-2 text-sm text-slate-500">Ice cream sales can rise, level off, then fall. A quadratic can follow that curve; a line cannot.</p>
          <ScatterChart
            points={points}
            xLabel="Temperature (°F)"
            yLabel="Ice cream sales"
            xDomain={[50, 120]}
            lines={[
              ...lines,
              ...(showLinear
                ? [{ a: { x: 50, y: linear.b0 + linear.b1 * 50 }, b: { x: 120, y: linear.b0 + linear.b1 * 120 }, dashed: true, color: '#94a3b8', label: 'Linear fit' }]
                : []),
            ]}
            marker={{ x: xStar, y: yStar, label: `x* = ${formatNum(xStar, 0)}` }}
          />
          {xStar > xmax && (
            <Insight title="Wild extrapolation" tone="warn">
              x* = {formatNum(xStar, 0)} is past the last observed temperature ({formatNum(xmax, 0)}). High-degree polynomials can wander far from any sensible sales number.
            </Insight>
          )}
        </RegCard>
        <RegCard title="Model equation">
          <FormulaBlock tex={'\\hat{Y}=b_0+b_1 X+b_2 X^2+\\cdots'} />
          <p className="mt-3 text-sm font-black leading-6">
            Ŷ = {formatNum(fit.beta[0] ?? 0, 1)}
            {fit.beta.slice(1).map((coef, i) => ` ${coef >= 0 ? '+' : '−'} ${formatNum(Math.abs(coef), 3)}X${i === 0 ? '' : `^${i + 1}`}`).join('')}
          </p>
          <p className="mt-3 text-sm text-slate-500">A linear model works well when the cloud is straight. Use a polynomial when the scatter shows a clear curve.</p>
        </RegCard>
        <RegCard title="Dataset and model controls" action={<ResetButton onClick={() => { setDegree(2); setN(50); setSeed(24); setShowLinear(true); setXStar(105) }} />}>
          <div className="space-y-3">
            <RegSlider label="Polynomial degree" value={degree} min={1} max={5} step={1} onChange={setDegree} />
            <RegToggle label="Show linear comparison" checked={showLinear} onChange={setShowLinear} />
            <RegSlider label="Sample size (n)" value={n} min={20} max={120} step={1} onChange={setN} />
            <RegSlider label="Extrapolate to x*" value={xStar} min={50} max={125} step={1} onChange={setXStar} />
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Model comparison">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Train R²</th>
                <th>Train RMSE</th>
                <th>Test RMSE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Linear</td>
                <td>{formatNum(linear.r2, 3)}</td>
                <td>{formatNum(linear.residualSE, 1)}</td>
                <td>{formatNum(rmse(split.test.map((p) => p.y), linearTest), 1)}</td>
              </tr>
              <tr>
                <td>Degree {degree}</td>
                <td>{formatNum(fit.r2, 3)}</td>
                <td>{formatNum(trainRmse, 1)}</td>
                <td>{formatNum(testRmse, 1)}</td>
              </tr>
            </tbody>
          </table>
          {degree >= 4 && testRmse > trainRmse * 1.15 && (
            <Insight title="Overfitting warning" tone="warn">
              Train error dropped, but test RMSE is larger. Extra powers can memorize noise.
            </Insight>
          )}
        </RegCard>
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              'Daily ice cream sales versus temperature often rise then fall.',
              `A degree-${degree} polynomial is fit by least squares on the training share.`,
              `Predicted sales at ${formatNum(xStar, 0)}°F = ${formatNum(yStar, 1)}.`,
            ]}
            result={xStar > xmax ? 'That prediction sits in the extrapolation zone. Do not trust a wild swing just because the algebra produced a number.' : 'Inside the observed temperatures the curve can track the bend better than a straight line.'}
          />
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'Which relationship is most likely better modeled by a quadratic than a straight line?',
                options: [
                  'Hours studied vs exam score, if the cloud is a straight tilt.',
                  'Age vs systolic blood pressure, if the cloud is a straight tilt.',
                  'Fertilizer amount vs crop yield, if yield rises then levels off or falls.',
                  'Number of rooms vs house price, if the cloud is a straight tilt.',
                ],
                answer: 2,
                hint: 'Look for a pattern that increases and then decreases.',
                explanation: 'A rise-then-fall (or U-shape) is the classic reason to try a quadratic. A straight cloud does not need extra powers.',
              },
            ]}
          />
        </RegCard>
      </div>
      <RegCard title="Key concepts">
        <ConceptList
          items={[
            'Polynomial regression captures curvature with powers of X, not a new variable.',
            'Higher degrees fit the training cloud more tightly and can overfit.',
            'Always compare train vs test error, and watch extrapolation.',
            'A better in-sample R² is not a license to trust the curve outside the data.',
          ]}
        />
      </RegCard>
    </div>
  )
}
