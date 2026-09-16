import { useMemo, useState } from 'react'
import { formatNum, generateMultiple, generatePreset, multipleOls } from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, Metric, QuizBlock, RegCard, RegSlider, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { HorizontalBars, ScatterChart } from '../plots'

export function MultipleRegressionLab() {
  const [seed, setSeed] = useState(21)
  const [useCollinear, setUseCollinear] = useState(false)
  const [useX2, setUseX2] = useState(true)
  const [useX3, setUseX3] = useState(true)
  const [hours, setHours] = useState(6)
  const [attend, setAttend] = useState(90)
  const [sleep, setSleep] = useState(7)

  const points = useMemo(() => (useCollinear ? generatePreset('collinear', 48, seed, 5) : generateMultiple(48, seed, 6.5)), [seed, useCollinear])
  const columns: number[][] = [points.map((p) => p.x)]
  const names = ['Study hours']
  if (useX2) {
    columns.push(points.map((p) => p.x2 ?? 0))
    names.push(useCollinear ? 'Almost 2× hours' : 'Attendance %')
  }
  if (useX3) {
    columns.push(points.map((p) => p.x3 ?? 6))
    names.push('Sleep hours')
  }
  const fit = useMemo(() => multipleOls(points.map((p) => p.y), columns, names), [points, columns, names])
  const predicted = (fit.beta[0] ?? 0) + (fit.beta[1] ?? 0) * hours + (useX2 ? (fit.beta[2] ?? 0) * attend : 0) + (useX3 ? (fit.beta[useX2 ? 3 : 2] ?? 0) * sleep : 0)
  const stdItems = names.map((name, i) => ({ label: name, value: Math.abs(fit.standardized[i] ?? 0), pattern: i === 1 ? ('hatch' as const) : ('solid' as const) }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.85fr)_minmax(230px,0.7fr)]">
        <RegCard title="Exam score vs study habits, attendance, and sleep">
          <p className="mb-2 text-sm text-slate-500">A 2D slice: exam score against attendance (or the second predictor). Other predictors are still in the model.</p>
          <ScatterChart
            points={points.map((point, i) => ({ ...point, x: point.x2 ?? point.x, fitted: fit.fitted[i] }))}
            xLabel={useX2 ? names[1] : 'Study hours'}
            yLabel="Exam score"
          />
          {fit.deficient && (
            <Insight title="Rank-deficient design" tone="warn">
              The predictors are collinear enough that the design is rank-deficient. Coefficients are not uniquely identified. Fitted values can still be computed.
            </Insight>
          )}
        </RegCard>
        <RegCard title="Model equation">
          <FormulaBlock tex={'\\hat{Y}=b_0+b_1 X_1+b_2 X_2+b_3 X_3'} />
          <p className="mt-3 text-sm font-black leading-6">
            Ŷ = {formatNum(fit.beta[0] ?? 0, 1)}
            {names.map((name, i) => ` ${ (fit.beta[i + 1] ?? 0) >= 0 ? '+' : '−'} ${formatNum(Math.abs(fit.beta[i + 1] ?? 0), 2)} ${name}`).join('')}
          </p>
          <p className="mt-2 text-xs text-slate-400">Each slope is the association with Y holding the other included predictors fixed. It is not an automatic causal effect.</p>
        </RegCard>
        <RegCard title="Dataset and model controls" action={<ResetButton onClick={() => { setSeed(21); setUseCollinear(false); setUseX2(true); setUseX3(true) }} />}>
          <div className="space-y-3">
            <RegToggle label="Attendance (X₂)" checked={useX2} onChange={setUseX2} />
            <RegToggle label="Sleep hours (X₃)" checked={useX3} onChange={setUseX3} />
            <RegToggle label="Collinear predictors" checked={useCollinear} onChange={setUseCollinear} />
            <button type="button" className="reg-btn w-full" onClick={() => setSeed((s) => s + 1)}>
              Update model
            </button>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Regression coefficients">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Predictor</th>
                <th>Estimate b</th>
                <th>VIF</th>
              </tr>
            </thead>
            <tbody>
              {fit.names.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{formatNum(fit.beta[i] ?? 0, 2)}</td>
                  <td>{i === 0 ? '—' : formatNum(fit.vif[i - 1] ?? 1, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Each slope is the change in predicted score for a one-unit increase in that predictor, holding the other included predictors fixed. The intercept is the formal prediction when those predictors are 0 — often outside the data.
          </p>
        </RegCard>
        <RegCard title="Relative importance (standardized coefficients)">
          <HorizontalBars items={stdItems} />
          <p className="mt-2 text-xs text-slate-400">Bars use length, and the second bar uses a hatch pattern, so rank does not rely on color alone.</p>
        </RegCard>
        <RegCard title="Make a prediction">
          <RegSlider label="Study hours" value={hours} min={1} max={10} step={0.1} display={formatNum(hours, 1)} onChange={setHours} />
          {useX2 && <RegSlider label={names[1]} value={attend} min={50} max={100} step={1} onChange={setAttend} />}
          {useX3 && <RegSlider label="Sleep hours" value={sleep} min={4} max={10} step={0.1} display={formatNum(sleep, 1)} onChange={setSleep} />}
          <Metric label="Predicted exam score" value={formatNum(predicted, 1)} />
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              `A student with ${hours} study hours${useX2 ? `, ${attend}% attendance` : ''}${useX3 ? `, and ${sleep} hours of sleep` : ''} is plugged into the fitted equation.`,
              `Predicted score = ${formatNum(predicted, 1)}.`,
            ]}
            result="The number holds the other included predictors fixed. Changing one slider is a partial-effect slice, not a causal experiment."
          />
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A sleep-hours coefficient of 2.8 means, in this model:',
                options: [
                  'Every student who sleeps more scores exactly 2.8 points higher.',
                  'Holding the other included predictors fixed, one extra sleep hour is associated with a 2.8-point higher predicted score.',
                  'Sleep causes a 2.8-point increase.',
                  'Attendance increases 2.8 points.',
                ],
                answer: 1,
                explanation: 'Multiple-regression slopes are partial associations. They are not automatic causal effects.',
              },
            ]}
          />
        </RegCard>
      </div>
      <RegCard title="Key concepts">
        <ConceptList
          items={[
            'Multiple regression models one response with two or more predictors.',
            'Each coefficient is a partial association, holding the other included predictors fixed.',
            'Standardized coefficients compare relative association on a common scale.',
            'VIF_j = 1 / (1 − R_j²). Large VIF is a collinearity warning, not a model failure by itself.',
          ]}
        />
      </RegCard>
    </div>
  )
}
