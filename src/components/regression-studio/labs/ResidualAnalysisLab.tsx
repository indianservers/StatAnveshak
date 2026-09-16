import { useMemo, useState } from 'react'
import {
  formatNum,
  generatePreset,
  residualPatternLabel,
  simpleOls,
  type PresetId,
} from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, QuizBlock, RegCard, RegSelect, RegToggle, ResetButton } from '../shared'
import { QQPlot, ResidualHistogram, ResidualPanel, ScatterChart } from '../plots'

const PRESETS: Array<{ value: PresetId; label: string; kind: 'random' | 'curve' | 'funnel' | 'outlier' | 'leverage' | 'clustered' }> = [
  { value: 'study-exam', label: 'Random leftover (study hours)', kind: 'random' },
  { value: 'nonlinear', label: 'Curved leftover', kind: 'curve' },
  { value: 'heteroskedastic', label: 'Funnel leftover', kind: 'funnel' },
  { value: 'influential', label: 'Outlier / leverage point', kind: 'leverage' },
  { value: 'grouped', label: 'Clustered groups', kind: 'clustered' },
]

export function ResidualAnalysisLab() {
  const [preset, setPreset] = useState<PresetId>('study-exam')
  const [showStems, setShowStems] = useState(true)
  const [showLine, setShowLine] = useState(true)
  const [seed, setSeed] = useState(19)

  const meta = PRESETS.find((item) => item.value === preset) ?? PRESETS[0]
  const points = useMemo(() => generatePreset(preset, 48, seed, 7), [preset, seed])
  const fit = useMemo(() => simpleOls(points.map((p) => p.x), points.map((p) => p.y)), [points])
  const fitted = points.map((point, i) => ({ ...point, fitted: fit.fitted[i], residual: fit.residuals[i] }))
  const xmin = Math.min(...points.map((p) => p.x))
  const xmax = Math.max(...points.map((p) => p.x))
  const rows = fitted.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(240px,0.7fr)]">
        <RegCard title="Study hours vs exam score, with residuals">
          <p className="mb-2 text-sm text-slate-500">Observed points, fitted line, and vertical residual segments (observed − predicted).</p>
          <ScatterChart
            points={fitted}
            xLabel="Study hours"
            yLabel="Exam score"
            residualStems={showStems}
            lines={showLine ? [{ a: { x: xmin, y: fit.b0 + fit.b1 * xmin }, b: { x: xmax, y: fit.b0 + fit.b1 * xmax }, label: 'Fitted line' }] : []}
          />
        </RegCard>
        <RegCard title="Residual plots">
          <ResidualPanel residuals={fit.residuals} fitted={fit.fitted} x={points.map((p) => p.x)} />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Distribution of residuals</p>
          <ResidualHistogram residuals={fit.residuals} />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Normal Q–Q</p>
          <QQPlot residuals={fit.residuals} />
        </RegCard>
        <RegCard title="Dataset and plot controls" action={<ResetButton onClick={() => { setPreset('study-exam'); setSeed(19); setShowStems(true); setShowLine(true) }} />}>
          <div className="space-y-3">
            <RegSelect
              label="Residual story"
              value={preset}
              onChange={(value) => setPreset(value as PresetId)}
              options={PRESETS.map((item) => ({ value: item.value, label: item.label }))}
            />
            <RegToggle label="Show residual stems" checked={showStems} onChange={setShowStems} />
            <RegToggle label="Show regression line" checked={showLine} onChange={setShowLine} />
            <button type="button" className="reg-btn w-full" onClick={() => setSeed((s) => s + 1)}>
              Update plots
            </button>
            <Insight title="What the leftovers reveal" tone="info">
              {residualPatternLabel(meta.kind)}
            </Insight>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Model equation and residual formula">
          <FormulaBlock tex={`\\hat{Y}=${formatNum(fit.b0, 2)}+${formatNum(fit.b1, 2)}x`} />
          <FormulaBlock tex={'e_i=y_i-\\hat{y}_i'} label="Residual for each observation" />
          <p className="mt-2 text-sm text-slate-500">A residual can be positive or negative. Sign is read from which side of the line the point sits on, not from color alone.</p>
        </RegCard>
        <RegCard title="Example data with residuals">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Hours</th>
                <th>Score</th>
                <th>Fitted</th>
                <th>Residual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatNum(row.x, 1)}</td>
                  <td>{formatNum(row.y, 1)}</td>
                  <td>{formatNum(row.fitted ?? 0, 1)}</td>
                  <td>{formatNum(row.residual ?? 0, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'A residual plot shows a clear U-shaped pattern. What does this suggest?',
                options: [
                  'The residuals are consistent with unstructured leftover variation.',
                  'A curved leftover pattern may indicate the linear model is missing a nonlinear relationship.',
                  'The residuals have constant variance.',
                  'The model assumptions have been proven true.',
                ],
                answer: 1,
                explanation: 'A curve in the leftovers may indicate missing nonlinearity. Residual plots never “pass” assumptions; they can only be consistent with a story or raise a concern.',
              },
            ]}
          />
        </RegCard>
      </div>
      <RegCard title="Key concepts">
        <ConceptList
          items={[
            'Residuals randomly scattered around zero are consistent with no leftover pattern — not a proof that assumptions passed.',
            'A curve may indicate nonlinearity; a funnel may indicate unequal spread; a far point may indicate an outlier or leverage case.',
            'Language stays cautious: “consistent with” and “may indicate,” not “assumptions passed.”',
          ]}
        />
      </RegCard>
    </div>
  )
}
