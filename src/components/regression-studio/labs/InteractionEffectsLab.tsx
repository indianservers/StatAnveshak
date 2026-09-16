import { useMemo, useState } from 'react'
import { formatNum, generatePreset, groupSlopes, interactionColumns, multipleOls } from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, QuizBlock, RegCard, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { ScatterChart } from '../plots'

export function InteractionEffectsLab() {
  const [seed, setSeed] = useState(31)
  const [includeInteraction, setIncludeInteraction] = useState(true)
  const [showBoth, setShowBoth] = useState(true)
  const [highlight, setHighlight] = useState<'Tutor' | 'No tutor' | 'both'>('both')

  const points = useMemo(() => generatePreset('tutoring', 56, seed, 5.2), [seed])
  const dummy = points.map((p) => (p.category === 'Tutor' ? 1 : 0))
  const columns = includeInteraction ? interactionColumns(points.map((p) => p.x), dummy) : [points.map((p) => p.x), dummy]
  const names = includeInteraction ? ['Study hours', 'Tutor', 'Hours × tutor'] : ['Study hours', 'Tutor']
  const fit = multipleOls(points.map((p) => p.y), columns, names)
  const slopes = groupSlopes(includeInteraction ? fit.beta : [fit.beta[0] ?? 0, fit.beta[1] ?? 0, fit.beta[2] ?? 0, 0])
  const xmin = Math.min(...points.map((p) => p.x))
  const xmax = Math.max(...points.map((p) => p.x))
  const styled = points
    .filter((p) => highlight === 'both' || p.category === highlight)
    .map((point) => ({
      ...point,
      style: point.category === 'Tutor' ? ('square' as const) : ('circle' as const),
      label: point.category,
    }))

  const lines = [
    {
      a: { x: xmin, y: slopes.interceptRef + slopes.slopeRef * xmin },
      b: { x: xmax, y: slopes.interceptRef + slopes.slopeRef * xmax },
      color: '#2563eb',
      label: `No tutor slope ${formatNum(slopes.slopeRef, 2)}`,
    },
    {
      a: { x: xmin, y: slopes.interceptOther + slopes.slopeOther * xmin },
      b: { x: xmax, y: slopes.interceptOther + slopes.slopeOther * xmax },
      color: '#7c3aed',
      dashed: true,
      label: `Tutor slope ${formatNum(slopes.slopeOther, 2)}`,
    },
  ].filter((_, i) => showBoth || (highlight === 'No tutor' ? i === 0 : highlight === 'Tutor' ? i === 1 : true))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.75fr)_minmax(230px,0.65fr)]">
        <RegCard title="Study hours and tutoring status">
          <p className="mb-2 text-sm text-slate-500">
            Circles = no tutor (reference). Squares = tutored. Non-parallel lines mean the study-hour slope depends on tutoring.
          </p>
          <ScatterChart points={styled} xLabel="Study hours" yLabel="Exam score" lines={lines} />
        </RegCard>
        <RegCard title="Model equation">
          <FormulaBlock tex={'\\hat{Y}=b_0+b_1 X+b_2 D+b_3(X\\times D)'} />
          <p className="mt-3 text-sm font-black leading-6">
            Ŷ = {formatNum(fit.beta[0] ?? 0, 1)} + {formatNum(fit.beta[1] ?? 0, 2)}X + {formatNum(fit.beta[2] ?? 0, 2)}D
            {includeInteraction ? ` + ${formatNum(fit.beta[3] ?? 0, 2)}(X×D)` : ''}
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>b₀ = {formatNum(slopes.interceptRef, 1)} — predicted score at 0 hours with no tutor.</li>
            <li>b₁ = {formatNum(slopes.slopeRef, 2)} — slope for the no-tutor (reference) group.</li>
            <li>b₂ = {formatNum(slopes.interceptOther - slopes.interceptRef, 2)} — intercept shift for tutored students.</li>
            {includeInteraction && <li>b₃ = {formatNum(slopes.slopeGap, 2)} — slope difference. Tutor slope = {formatNum(slopes.slopeRef, 2)} + {formatNum(slopes.slopeGap, 2)} = {formatNum(slopes.slopeOther, 2)}.</li>}
          </ul>
        </RegCard>
        <RegCard title="Dataset and model controls" action={<ResetButton onClick={() => { setSeed(31); setIncludeInteraction(true); setShowBoth(true); setHighlight('both') }} />}>
          <div className="space-y-3">
            <RegToggle label="Include interaction (non-parallel lines)" checked={includeInteraction} onChange={setIncludeInteraction} />
            <RegToggle label="Show both group lines" checked={showBoth} onChange={setShowBoth} />
            <fieldset>
              <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Highlight group</legend>
              {(['both', 'Tutor', 'No tutor'] as const).map((value) => (
                <label key={value} className="flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600">
                  <input type="radio" name="reg-int-group" checked={highlight === value} onChange={() => setHighlight(value)} />
                  {value === 'both' ? 'Both groups' : value}
                </label>
              ))}
            </fieldset>
            <button type="button" className="reg-btn w-full" onClick={() => setSeed((s) => s + 1)}>
              Update plot
            </button>
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              `Slope with no tutor (D = 0): ${formatNum(slopes.slopeRef, 2)} points per hour.`,
              `Slope with a tutor (D = 1): ${formatNum(slopes.slopeRef, 2)} + ${formatNum(slopes.slopeGap, 2)} = ${formatNum(slopes.slopeOther, 2)}.`,
              'The interaction coefficient is that slope difference.',
            ]}
            result={`The study-hour association is ${formatNum(Math.abs(slopes.slopeGap), 2)} points per hour ${slopes.slopeGap >= 0 ? 'stronger' : 'weaker'} for tutored students. That is a moderation reading, not a proof that tutoring caused the gap.`}
          />
        </RegCard>
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'How can you tell from the plot that an interaction is present?',
                options: [
                  'The two fitted lines have different intercepts only.',
                  'The two fitted lines have different slopes (they are not parallel).',
                  'Both groups have a positive relationship, so there is no interaction.',
                  'Interaction is present whenever the lines have different colors.',
                ],
                answer: 1,
                hint: 'An interaction is a slope difference.',
                explanation: 'β₃ changes the slope. Different intercepts alone are a main effect of the group dummy, not an interaction.',
              },
            ]}
          />
        </RegCard>
        <RegCard title="Key concepts">
          <ConceptList
            items={[
              'An interaction (moderation) means the effect of one predictor depends on another.',
              'β₃ is the slope difference: slope_other = β₁ + β₃.',
              'Non-parallel lines are the picture of an interaction. Parallel lines mean no interaction.',
              'β₁ is the slope for the reference group, not automatically the “main” causal effect.',
            ]}
          />
          {!includeInteraction && (
            <Insight title="Parallel lines" tone="info">
              With the interaction off, both groups share slope β₁. That is the no-moderation model.
            </Insight>
          )}
        </RegCard>
      </div>
    </div>
  )
}
