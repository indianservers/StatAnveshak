import { useMemo, useState } from 'react'
import { dummyCode, formatNum, generatePreset, mean, multipleOls } from '../../../lib/regressionStudio'
import { ConceptList, FormulaBlock, Insight, QuizBlock, RegCard, RegSelect, RegToggle, ResetButton, WorkedSteps } from '../shared'
import { ScatterChart } from '../plots'

export function CategoricalPredictorsLab() {
  const [reference, setReference] = useState('Public')
  const [coding, setCoding] = useState<'dummy' | 'numeric'>('dummy')
  const [showMeans, setShowMeans] = useState(true)
  const [seed, setSeed] = useState(27)
  const [levels, setLevels] = useState<'binary' | 'three'>('binary')

  const raw = useMemo(() => {
    const base = generatePreset('school-type', 56, seed, 6)
    if (levels === 'binary') return base
    return base.map((point, i) => ({
      ...point,
      category: i % 3 === 0 ? 'Public' : i % 3 === 1 ? 'Private' : 'Charter',
      group: i % 3 === 0 ? 'Public' : i % 3 === 1 ? 'Private' : 'Charter',
      y: point.y + (i % 3 === 2 ? 4.5 : 0),
    }))
  }, [levels, seed])

  const cats = raw.map((p) => p.category ?? 'Public')
  const dummy = dummyCode(cats, reference)
  const numericCodes = cats.map((value) => dummy.levels.indexOf(value) + 1)
  const columns = coding === 'dummy' ? [raw.map((p) => p.x), ...dummy.names.map((_, j) => dummy.matrix.map((row) => row[j]))] : [raw.map((p) => p.x), numericCodes]
  const names = coding === 'dummy' ? ['Study hours', ...dummy.names] : ['Study hours', 'School code 1,2,3']
  const fit = multipleOls(raw.map((p) => p.y), columns, names)
  const xmin = Math.min(...raw.map((p) => p.x))
  const xmax = Math.max(...raw.map((p) => p.x))
  const styled = raw.map((point) => ({
    ...point,
    style: point.category === reference ? ('circle' as const) : ('square' as const),
    label: `${point.category ?? ''} student`,
  }))

  const lines = dummy.levels.map((level) => {
    const row = dummy.levels.map((item) => (item === level && item !== dummy.reference ? 1 : 0)).filter((_, i) => dummy.levels[i] !== dummy.reference)
    // intercept + hours*x + dummy effects
    const extra = dummy.names.reduce((sum, _name, j) => {
      const isThis = level === dummy.names[j].split(' ')[0]
      return sum + (isThis ? fit.beta[j + 2] ?? 0 : 0)
    }, 0)
    const intercept = (fit.beta[0] ?? 0) + extra
    const slope = fit.beta[1] ?? 0
    return {
      a: { x: xmin, y: intercept + slope * xmin },
      b: { x: xmax, y: intercept + slope * xmax },
      color: level === reference ? '#2563eb' : '#7c3aed',
      dashed: level !== reference,
      label: `${level} line`,
    }
  })

  const groups = dummy.levels.map((level) => {
    const subset = raw.filter((p) => p.category === level)
    return { level, n: subset.length, meanX: mean(subset.map((p) => p.x)), meanY: mean(subset.map((p) => p.y)) }
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.75fr)_minmax(230px,0.65fr)]">
        <RegCard title="Exam score by school type">
          <p className="mb-2 text-sm text-slate-500">
            Circles are the {reference} reference group. Squares are other schools. Parallel lines (no interaction) share one slope.
          </p>
          <ScatterChart points={styled} xLabel="Study hours" yLabel="Exam score" lines={coding === 'dummy' ? lines : []} />
        </RegCard>
        <RegCard title="Model equation">
          <FormulaBlock tex={'\\hat{Y}=b_0+b_1 X+b_2 D'} />
          <p className="mt-3 text-sm font-black leading-6">
            Ŷ = {formatNum(fit.beta[0] ?? 0, 1)} + {formatNum(fit.beta[1] ?? 0, 2)}X
            {fit.beta.slice(2).map((coef, i) => ` ${coef >= 0 ? '+' : '−'} ${formatNum(Math.abs(coef), 2)}D${i + 1}`).join('')}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {coding === 'dummy'
              ? `D codes the non-reference groups against ${reference}. Changing the reference changes the labels; fitted values stay equivalent.`
              : 'Treating Public=1, Private=2, Charter=3 as a number assumes equal steps between schools — usually the wrong story.'}
          </p>
        </RegCard>
        <RegCard title="Dataset and model controls" action={<ResetButton onClick={() => { setReference('Public'); setCoding('dummy'); setLevels('binary'); setSeed(27) }} />}>
          <div className="space-y-3">
            <RegSelect
              label="Groups"
              value={levels}
              onChange={(value) => {
                setLevels(value as 'binary' | 'three')
                setReference('Public')
              }}
              options={[
                { value: 'binary', label: 'Public vs private' },
                { value: 'three', label: 'Public, private, charter' },
              ]}
            />
            <RegSelect
              label="Reference level"
              value={reference}
              onChange={setReference}
              options={dummy.levels.map((level) => ({ value: level, label: level }))}
            />
            <RegSelect
              label="Category coding"
              value={coding}
              onChange={(value) => setCoding(value as 'dummy' | 'numeric')}
              options={[
                { value: 'dummy', label: 'Dummy / reference coding' },
                { value: 'numeric', label: 'Treat 1, 2, 3 as numeric (don’t)' },
              ]}
            />
            <RegToggle label="Show group means table" checked={showMeans} onChange={setShowMeans} />
          </div>
        </RegCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegCard title="Model coefficients">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Term</th>
                <th>Coefficient</th>
              </tr>
            </thead>
            <tbody>
              {fit.names.map((name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{formatNum(fit.beta[i] ?? 0, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Insight title="What D means" tone="info">
            For the reference group every dummy is 0, so the intercept is that group’s baseline. Each dummy is the vertical shift versus {dummy.reference}, holding study hours fixed.
          </Insight>
        </RegCard>
        {showMeans ? (
          <RegCard title="Group means">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Mean hours</th>
                  <th>Mean score</th>
                  <th>n</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.level}>
                    <td>
                      {group.level}
                      {group.level === dummy.reference ? ' (reference)' : ''}
                    </td>
                    <td>{formatNum(group.meanX, 1)}</td>
                    <td>{formatNum(group.meanY, 1)}</td>
                    <td>{group.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RegCard>
        ) : (
          <div />
        )}
        <RegCard title="Worked example">
          <WorkedSteps
            steps={[
              `Reference = ${dummy.reference}.`,
              `Hours coefficient = ${formatNum(fit.beta[1] ?? 0, 2)} for every group when there is no interaction.`,
              `At 6 study hours, predicted scores differ by the dummy coefficients only.`,
            ]}
            result="Parallel lines mean the hour-to-score slope is shared. The groups differ by a vertical shift, not by a different slope."
          />
        </RegCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RegCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'In Ŷ = 42.3 + 5.1X + 10.8D with D = 1 for private school, what does 10.8 mean?',
                options: [
                  'Private students study 10.8 more hours.',
                  'Holding study hours fixed, private school is associated with a 10.8-point higher predicted score than the reference group.',
                  'School type caused a 10.8-point increase.',
                  'The codes 1 and 2 are equally spaced numeric values.',
                ],
                answer: 1,
                explanation: 'A dummy coefficient is a vertical shift versus the reference, holding the numeric predictor fixed. It is an association, not automatic causation.',
              },
            ]}
          />
        </RegCard>
        <RegCard title="Key concepts">
          <ConceptList
            items={[
              'Categorical predictors enter as dummy variables against a chosen reference.',
              'Changing the reference changes coefficient labels; fitted values stay equivalent.',
              'Do not treat 1, 2, 3 group codes as a numeric scale.',
              'Without an interaction, group lines are parallel — one shared slope.',
            ]}
          />
        </RegCard>
      </div>
    </div>
  )
}
