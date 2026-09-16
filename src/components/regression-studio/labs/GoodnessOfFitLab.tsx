import { useMemo, useState } from 'react'
import { formatNum, generatePreset, multipleOls, rmse, simpleOls } from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, Metric, QuizBlock, RegCard, RegSlider, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { BarSplit, ScatterChart } from '../plots'

export function GoodnessOfFitLab() {
  const [n, setN] = useState(50)
  const [noise, setNoise] = useState(8)
  const [seed, setSeed] = useState(16)
  const [showLine, setShowLine] = useState(true)
  const [addJunk, setAddJunk] = useState(false)

  const points = useMemo(() => generatePreset(addJunk ? 'junk-predictor' : 'study-exam', n, seed, noise), [addJunk, n, seed, noise])
  const simple = useMemo(() => simpleOls(points.map((p) => p.x), points.map((p) => p.y)), [points])
  const multi = useMemo(
    () =>
      addJunk && points[0]?.x2 !== undefined
        ? multipleOls(points.map((p) => p.y), [points.map((p) => p.x), points.map((p) => p.x2 ?? 0)], ['hours', 'junk'])
        : null,
    [addJunk, points],
  )
  const fit = multi ?? {
    ...simple,
    residualSE: simple.residualSE,
  }
  const xmin = Math.min(...points.map((p) => p.x))
  const xmax = Math.max(...points.map((p) => p.x))
  const fitted = points.map((point, i) => ({ ...point, fitted: simple.fitted[i] }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.8fr)_minmax(240px,0.7fr)]">
        <RegCard title="Study hours vs exam score">
          <p className="mb-2 text-sm text-slate-500">A tighter cloud around the line means more of SST sits in SSR.</p>
          <ScatterChart
            points={fitted}
            xLabel="Study hours"
            yLabel="Exam score"
            lines={showLine ? [{ a: { x: xmin, y: simple.b0 + simple.b1 * xmin }, b: { x: xmax, y: simple.b0 + simple.b1 * xmax }, label: 'Fitted line' }] : []}
          />
        </RegCard>
        <div className="space-y-4">
          <RegCard title="Key fit metrics">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="R²" value={formatNum(fit.r2, 3)} hint="Share of SST in SSR" />
              <Metric label="RMSE" value={formatNum(rmse(points.map((p) => p.y), simple.fitted), 1)} hint="Typical residual size" />
              <Metric label="Residual SE" value={formatNum(simple.residualSE, 1)} hint="s" />
            </div>
            <div className="mt-4">
              <BarSplit left={simple.ssr} right={simple.sse} leftLabel="Explained (SSR)" rightLabel="Unexplained (SSE)" />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              R² = {formatNum(simple.r2, 3)} is the proportion of total variation in exam score associated with the model. It is not “{formatNum(100 * simple.r2, 0)}% accurate.”
            </p>
          </RegCard>
          <RegCard title="Adding a junk predictor">
            <RegToggle label="Add an unrelated predictor" checked={addJunk} onChange={setAddJunk} />
            {multi && (
              <Insight title="R² cannot fall; adjusted R² can" tone="warn">
                Simple R² = {formatNum(simple.r2, 3)}, adj R² = {formatNum(simple.adjR2, 3)}. With junk: R² = {formatNum(multi.r2, 3)}, adj R² = {formatNum(multi.adjR2, 3)}. Extra noise variables tend to inflate R² and punish adjusted R².
              </Insight>
            )}
          </RegCard>
        </div>
        <RegCard title="Dataset and model controls" action={<ResetButton onClick={() => { setN(50); setNoise(8); setSeed(16); setShowLine(true); setAddJunk(false) }} />}>
          <div className="space-y-3">
            <RegToggle label="Show regression line" checked={showLine} onChange={setShowLine} />
            <RegSlider label="Sample size (n)" value={n} min={12} max={120} step={1} onChange={setN} />
            <RegSlider label="Noise / variability" value={noise} min={1} max={22} step={0.5} display={formatNum(noise, 1)} onChange={setNoise} />
            <button type="button" className="reg-btn w-full" onClick={() => setSeed((s) => s + 1)}>
              Update plot
            </button>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Formulas">
          <FormulaBlock tex={'R^2=1-\\mathrm{SSE}/\\mathrm{SST}'} label="Coefficient of determination" />
          <FormulaBlock tex={'\\mathrm{RMSE}=\\sqrt{\\mathrm{SSE}/n}'} label="Root mean squared error" />
          <p className="mt-2 text-sm text-slate-500">SST = SSR + SSE. R² ranges from 0 to 1 when the model includes an intercept.</p>
        </RegCard>
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              `SST = ${formatNum(simple.sst, 1)}, SSR = ${formatNum(simple.ssr, 1)}, SSE = ${formatNum(simple.sse, 1)}.`,
              `R² = 1 − ${formatNum(simple.sse, 1)}/${formatNum(simple.sst, 1)} = ${formatNum(simple.r2, 2)}.`,
              `RMSE = ${formatNum(rmse(points.map((p) => p.y), simple.fitted), 1)}.`,
            ]}
            result={`R² = ${formatNum(simple.r2, 2)} means about ${formatNum(100 * simple.r2, 0)}% of the variation in scores is associated with the fitted line — not that ${formatNum(100 * simple.r2, 0)}% of predictions are “correct.”`}
          />
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'Does a higher R² always mean you selected a good model?',
                options: [
                  'Yes. Higher R² always means the best model.',
                  'No. A high R² is not a guarantee of a good model — overfitting and leftover patterns still matter.',
                  'R² is not useful for model evaluation.',
                  'Only if R² is greater than 0.9.',
                ],
                answer: 1,
                hint: 'Think about overfitting and leftover plots.',
                explanation: 'R² rises whenever you add a predictor, even a junk one. Adjusted R², residuals, and out-of-sample error are part of the story.',
              },
            ]}
          />
        </RegCard>
      </div>
      <RegCard title="Key concepts">
        <ConceptList
          items={[
            'R² is the share of SST sitting in SSR. It is not percent accuracy.',
            'RMSE and residual SE measure typical leftover size in the units of Y.',
            'Adding a junk predictor cannot decrease R²; adjusted R² often falls.',
            'Use more than one metric, and always look at residual plots.',
          ]}
        />
      </RegCard>
    </div>
  )
}
