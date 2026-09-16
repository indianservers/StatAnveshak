import { useEffect, useMemo, useState } from 'react'
import { candidateSse, formatNum, generatePreset, simpleOls } from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, QuizBlock, RegCard, RegSelect, RegSlider, RegToggle, ResetButton } from '../shared'
import { ScatterChart } from '../plots'

export function LeastSquaresLab() {
  const [n, setN] = useState(50)
  const [noise, setNoise] = useState(8)
  const [seed, setSeed] = useState(8)
  const [showResiduals, setShowResiduals] = useState(true)
  const [b0, setB0] = useState(35)
  const [b1, setB1] = useState(2.4)
  const [animating, setAnimating] = useState(false)

  const points = useMemo(() => generatePreset('study-exam', n, seed, noise), [n, seed, noise])
  const ols = useMemo(() => simpleOls(points.map((p) => p.x), points.map((p) => p.y)), [points])
  const sse = candidateSse(points.map((p) => p.x), points.map((p) => p.y), b0, b1)
  const xmin = Math.min(...points.map((p) => p.x))
  const xmax = Math.max(...points.map((p) => p.x))
  const fitted = points.map((point) => ({ ...point, fitted: b0 + b1 * point.x, residual: point.y - (b0 + b1 * point.x) }))
  const table = points.slice(0, 5).map((point, i) => {
    const yhat = b0 + b1 * point.x
    const e = point.y - yhat
    return { i: i + 1, x: point.x, y: point.y, yhat, e, e2: e * e }
  })

  useEffect(() => {
    if (!animating) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setB0(ols.b0)
      setB1(ols.b1)
      setAnimating(false)
      return
    }
    const id = window.setInterval(() => {
      setB0((current) => current + (ols.b0 - current) * 0.18)
      setB1((current) => current + (ols.b1 - current) * 0.18)
    }, 40)
    return () => window.clearInterval(id)
  }, [animating, ols.b0, ols.b1])

  useEffect(() => {
    if (Math.abs(b0 - ols.b0) < 0.04 && Math.abs(b1 - ols.b1) < 0.02) setAnimating(false)
  }, [b0, b1, ols.b0, ols.b1])

  const reset = () => {
    setN(50)
    setNoise(8)
    setSeed(8)
    setShowResiduals(true)
    setB0(35)
    setB1(2.4)
    setAnimating(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.7fr)_minmax(240px,0.75fr)]">
        <RegCard title="Study hours vs exam score">
          <p className="mb-2 text-sm text-slate-500">Blue line is a candidate. Vertical dashed segments are residuals. Squares grow with |residual|.</p>
          <ScatterChart
            points={fitted}
            xLabel="Study hours"
            yLabel="Exam score"
            residualStems={showResiduals}
            lines={[
              { a: { x: xmin, y: b0 + b1 * xmin }, b: { x: xmax, y: b0 + b1 * xmax }, label: 'Candidate line' },
              { a: { x: xmin, y: ols.b0 + ols.b1 * xmin }, b: { x: xmax, y: ols.b0 + ols.b1 * xmax }, dashed: true, color: '#94a3b8', label: 'OLS line' },
            ]}
          />
        </RegCard>
        <div className="space-y-4">
          <RegCard title="How least squares works">
            <ol className="space-y-2 text-sm leading-6 text-slate-600">
              <li>1. For each point compute the residual eᵢ = yᵢ − ŷᵢ.</li>
              <li>2. Square residuals so positive and negative errors do not cancel.</li>
              <li>3. Find the line that minimizes the sum of squared residuals (SSE).</li>
            </ol>
            <FormulaBlock tex={'\\min_{b_0,b_1}\\sum_{i=1}^{n}(y_i-\\hat{y}_i)^2'} label="Least squares objective" />
            <p className="mt-2 text-sm text-slate-500">
              SSE now = {formatNum(sse, 1)}. OLS SSE = {formatNum(ols.sse, 1)}.
            </p>
            <div className="mt-2 h-3 rounded-full bg-slate-100" aria-label="SSE meter">
              <div className="h-3 rounded-full bg-blue-600" style={{ width: `${Math.max(8, Math.min(100, 100 * (ols.sse / Math.max(sse, ols.sse))))}%` }} />
            </div>
          </RegCard>
        </div>
        <RegCard title="Dataset and model controls" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <RegSelect label="Dataset" value="study-exam" onChange={() => undefined} options={[{ value: 'study-exam', label: 'Study hours vs exam score' }]} />
            <RegToggle label="Show residual stems" checked={showResiduals} onChange={setShowResiduals} />
            <RegSlider label="Sample size (n)" value={n} min={10} max={120} step={1} onChange={setN} />
            <RegSlider label="Noise / variability" value={noise} min={1} max={20} step={0.5} display={formatNum(noise, 1)} onChange={setNoise} />
            <RegSlider label="Candidate intercept" value={b0} min={10} max={90} step={0.1} display={formatNum(b0, 1)} onChange={setB0} />
            <RegSlider label="Candidate slope" value={b1} min={-2} max={10} step={0.05} display={formatNum(b1, 2)} onChange={setB1} />
            <button type="button" className="reg-btn w-full" onClick={() => setAnimating(true)}>
              Animate toward OLS
            </button>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Worked example">
          <table className="reg-table">
            <thead>
              <tr>
                <th>i</th>
                <th>Hours (x)</th>
                <th>Score (y)</th>
                <th>Predicted ŷ</th>
                <th>Residual e</th>
                <th>e²</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.i}>
                  <td>{row.i}</td>
                  <td>{formatNum(row.x, 1)}</td>
                  <td>{formatNum(row.y, 1)}</td>
                  <td>{formatNum(row.yhat, 1)}</td>
                  <td>{formatNum(row.e, 1)}</td>
                  <td>{formatNum(row.e2, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Insight title="SSE" tone="info">
            Sum of these five squared residuals is {formatNum(table.reduce((s, row) => s + row.e2, 0), 1)}. The full-sample SSE is {formatNum(sse, 1)}.
          </Insight>
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'Why do we square residuals in least squares?',
                options: [
                  'To keep residuals positive.',
                  'To prevent positive and negative residuals from canceling.',
                  'To make the units easier to interpret.',
                  'To give more weight to large errors only when they are negative.',
                ],
                answer: 1,
                explanation: 'Squaring removes the sign so a −10 residual and a +10 residual both add 100 to SSE. Large errors still count more, in either direction.',
              },
            ]}
          />
        </RegCard>
        <RegCard title="Key concepts">
          <ConceptList
            items={[
              'A residual is the vertical difference y − ŷ.',
              'Least squares chooses b₀ and b₁ to minimize SSE.',
              'The OLS line for a given dataset with an intercept is unique when X has variance.',
              'Residual plots still have to be checked; a minimum SSE is not a certificate that the line is a good story.',
            ]}
          />
        </RegCard>
      </div>
    </div>
  )
}
