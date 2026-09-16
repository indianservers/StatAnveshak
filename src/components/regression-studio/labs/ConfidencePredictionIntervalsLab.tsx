import { useMemo, useState } from 'react'
import {
  formatNum,
  generatePreset,
  meanAndPredictionIntervals,
  predictSimple,
  simpleOls,
} from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, Metric, QuizBlock, RegCard, RegSelect, RegSlider, ResetButton, WorkedSteps } from '../shared'
import { ScatterChart } from '../plots'

export function ConfidencePredictionIntervalsLab() {
  const [level, setLevel] = useState(0.95)
  const [x0, setX0] = useState(6)
  const [seed, setSeed] = useState(18)
  const points = useMemo(() => generatePreset('study-exam', 48, seed, 8), [seed])
  const fit = useMemo(() => simpleOls(points.map((p) => p.x), points.map((p) => p.y)), [points])
  const interval = meanAndPredictionIntervals(fit, x0, level)
  const xs = Array.from({ length: 25 }, (_, i) => {
    const lo = Math.min(...points.map((p) => p.x)) - 0.8
    const hi = Math.max(...points.map((p) => p.x)) + 0.8
    return lo + ((hi - lo) * i) / 24
  })
  const ciBand = xs.map((x) => {
    const band = meanAndPredictionIntervals(fit, x, level)
    return { x, lo: band.ciLo, hi: band.ciHi }
  })
  const piBand = xs.map((x) => {
    const band = meanAndPredictionIntervals(fit, x, level)
    return { x, lo: band.piLo, hi: band.piHi }
  })
  const xmin = xs[0]
  const xmax = xs[xs.length - 1]
  const fitted = points.map((point, i) => ({ ...point, fitted: fit.fitted[i] }))
  const pct = Math.round(level * 100)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.75fr)_minmax(230px,0.65fr)]">
        <RegCard title="Regression line with confidence and prediction intervals">
          <p className="mb-2 text-sm text-slate-500">
            The narrower solid band is the {pct}% confidence interval for the mean response. The wider dashed band is the {pct}% prediction interval for a new observation.
          </p>
          <div className="mb-2 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-sm bg-blue-600/70" aria-hidden />
              CI for the mean (solid)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0 w-6 border-t-2 border-dashed border-violet-700" aria-hidden />
              PI for a new Y (dashed)
            </span>
          </div>
          <ScatterChart
            points={fitted}
            xLabel="Study hours"
            yLabel="Exam score"
            yDomain={[
              Math.min(...fitted.map((p) => p.y), ...piBand.map((p) => p.lo)) - 4,
              Math.max(...fitted.map((p) => p.y), ...piBand.map((p) => p.hi)) + 4,
            ]}
            bands={[
              { points: piBand, fill: 'rgba(124,58,237,0.22)', dashed: true, label: `${pct}% prediction interval for a new Y` },
              { points: ciBand, fill: 'rgba(37,99,235,0.4)', dashed: false, label: `${pct}% confidence interval for the mean response` },
            ]}
            lines={[{ a: { x: xmin, y: fit.b0 + fit.b1 * xmin }, b: { x: xmax, y: fit.b0 + fit.b1 * xmax }, label: 'Fitted mean' }]}
            marker={{ x: x0, y: interval.yhat, label: `x* = ${formatNum(x0, 1)}` }}
          />
        </RegCard>
        <RegCard title="Formulas">
          <FormulaBlock tex={'\\hat{Y}=b_0+b_1 x_0'} />
          <FormulaBlock tex={'\\hat{Y}\\pm t^*\\,\\mathrm{SE}(\\hat{Y})'} label="CI for the mean response" />
          <FormulaBlock tex={'\\hat{Y}\\pm t^*\\,\\mathrm{SE}_{\\mathrm{pred}}'} label="PI for a new observation" />
          <p className="mt-2 text-sm leading-6 text-slate-500">
            SE(Ŷ) uses 1/n + (x₀ − x̄)² / Sxx. SE_pred adds 1 inside the square root for individual variation. Bands are narrowest near x̄ = {formatNum(fit.xbar, 2)}.
          </p>
        </RegCard>
        <RegCard title="Choose values and see results" action={<ResetButton onClick={() => { setLevel(0.95); setX0(6); setSeed(18) }} />}>
          <div className="space-y-3">
            <RegSelect
              label="Confidence level"
              value={String(level)}
              onChange={(value) => setLevel(Number(value))}
              options={[
                { value: '0.9', label: '90%' },
                { value: '0.95', label: '95%' },
                { value: '0.99', label: '99%' },
              ]}
            />
            <RegSlider label="Study hours x₀" value={x0} min={0} max={12} step={0.1} display={formatNum(x0, 1)} onChange={setX0} />
            <Metric label="Predicted mean Ŷ" value={formatNum(interval.yhat, 1)} />
            <Metric label={`${pct}% CI (mean)`} value={`[${formatNum(interval.ciLo, 1)}, ${formatNum(interval.ciHi, 1)}]`} hint={`width ${formatNum(interval.ciWidth, 1)}`} />
            <Metric label={`${pct}% PI (new Y)`} value={`[${formatNum(interval.piLo, 1)}, ${formatNum(interval.piHi, 1)}]`} hint={`width ${formatNum(interval.piWidth, 1)}`} />
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              `At x₀ = 6, Ŷ = ${formatNum(predictSimple(fit, 6), 1)}.`,
              `${pct}% CI for the mean: [${formatNum(meanAndPredictionIntervals(fit, 6, level).ciLo, 1)}, ${formatNum(meanAndPredictionIntervals(fit, 6, level).ciHi, 1)}].`,
              `${pct}% PI for a new student: [${formatNum(meanAndPredictionIntervals(fit, 6, level).piLo, 1)}, ${formatNum(meanAndPredictionIntervals(fit, 6, level).piHi, 1)}].`,
            ]}
            result={`We are ${pct}% confident the mean exam score at 6 hours sits in the narrower interval. One new student’s score is more variable, so the prediction interval is wider.`}
          />
        </RegCard>
        <RegCard title="Interpretation">
          <Insight title="Two sources of uncertainty" tone="info">
            The CI covers uncertainty in the fitted mean. The PI also includes leftover individual variation. That is why PI width &gt; CI width at every x₀.
          </Insight>
          <QuizBlock
            items={[
              {
                prompt: 'Which interval is wider at a given x-value?',
                options: [
                  'The confidence interval, because it uses the t distribution.',
                  'The prediction interval, because it includes individual variation.',
                  'Both intervals are the same width.',
                  'It depends only on the value of x.',
                ],
                answer: 1,
                explanation: 'Both widen away from x̄, but the PI always includes an extra 1 inside the SE, so it stays wider.',
              },
            ]}
          />
        </RegCard>
        <RegCard title="Key concepts">
          <ConceptList
            items={[
              'A confidence interval estimates the mean response at x₀.',
              'A prediction interval estimates one new Y at x₀.',
              'Prediction intervals are wider because they include leftover individual variation — this is a feature, not a bug.',
              'Both bands are narrowest near the mean of X.',
            ]}
          />
        </RegCard>
      </div>
    </div>
  )
}
