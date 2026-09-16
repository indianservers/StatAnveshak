import { useMemo, useState } from 'react'
import { formatProb, markPfLabComplete } from '../../../lib/probabilityFoundations'
import { FormulaBlock, Insight, PfCard, QuizBlock, ResetButton } from '../shared'

type Color = 'red' | 'blue' | 'green'

const BAG: Record<Color, number> = { red: 6, blue: 4, green: 2 }

export function ConditionalProbabilityLab({ tab }: { tab: string }) {
  const [condition, setCondition] = useState<Color>('blue')
  const [event, setEvent] = useState<Color>('red')
  const total = BAG.red + BAG.blue + BAG.green
  const counts = useMemo(() => ({ ...BAG }), [])

  const pB = counts[condition] / total
  const pBoth = condition === event ? counts[event] / total : 0
  const pAGivenB = pB === 0 ? 0 : pBoth / pB

  const reset = () => {
    setCondition('blue')
    setEvent('red')
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <PfCard title="P(A | B)">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Conditional probability shrinks the sample space to event B, then asks what fraction of B is also in A.
          </p>
          <FormulaBlock tex="P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}" />
        </PfCard>
        <Insight title="Visual intuition">
          Once you know the ball is blue, every red and green ball is gone. The remaining space has no red balls, so
          P(red | blue) = 0.
        </Insight>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Practice">
        <QuizBlock
          prompt="A bag has 6 red, 4 blue, and 2 green balls. What is P(red | red)?"
          options={['0', '0.5', '1', '6/12']}
          answer={2}
          explanation="If the condition is already red, every remaining outcome in B is red, so the conditional probability is 1."
          onCorrect={() => markPfLabComplete('conditional-probability')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_280px]">
      <PfCard title="Conditional Probability in Action">
        <div className="mb-3 flex justify-end">
          <ResetButton onClick={reset} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">1 · The scenario</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A bag contains 6 red, 4 blue, and 2 green balls (12 total). You randomly draw one ball.
            </p>
            <Bag counts={counts} condition={condition} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">2 · Choose the condition and event</p>
            <label className="block text-sm font-semibold">
              Condition B
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                value={condition}
                onChange={(event) => setCondition(event.target.value as Color)}
              >
                <option value="blue">The ball is blue</option>
                <option value="red">The ball is red</option>
                <option value="green">The ball is green</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Event A
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                value={event}
                onChange={(event) => setEvent(event.target.value as Color)}
              >
                <option value="red">The ball is red</option>
                <option value="blue">The ball is blue</option>
                <option value="green">The ball is green</option>
              </select>
            </label>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">3 · See the result</p>
            <FormulaBlock tex="P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}" />
            <p className="mt-2 text-sm text-slate-500">
              P(A ∩ B) = {formatProb(pBoth)} · P(B) = {counts[condition]}/{total} = {formatProb(pB)}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              P({event} | {condition}) = {formatProb(pAGivenB)}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Insight title="What does this mean?">
            Given that the ball is {condition}, the sample space shrinks to the {counts[condition]} {condition} balls.
            {event === condition
              ? ` Every remaining ball is ${event}, so the conditional probability is 1.`
              : ` None of those balls are ${event}, so the conditional probability is 0.`}
          </Insight>
          <Insight title="Real-world use case">
            In medical testing we ask: given a positive test, what is the probability a person has the disease?
            Conditioning updates beliefs from new evidence.
          </Insight>
        </div>
      </PfCard>
      <PfCard title="Key Concepts">
        <ul className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <li>
            <strong>P(A | B)</strong> = P(A ∩ B) / P(B)
          </li>
          <li>Conditioning uses known information to update probabilities.</li>
          <li>The restricted sample space keeps only outcomes inside the condition.</li>
        </ul>
      </PfCard>
    </div>
  )
}

function Bag({ counts, condition }: { counts: Record<Color, number>; condition: Color }) {
  const dots: Color[] = [
    ...Array.from({ length: counts.red }, () => 'red' as const),
    ...Array.from({ length: counts.blue }, () => 'blue' as const),
    ...Array.from({ length: counts.green }, () => 'green' as const),
  ]
  const color = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e' }
  return (
    <div className="mt-3">
      <svg viewBox="0 0 160 140" className="h-36 w-full" role="img" aria-label="Bag of colored balls">
        <path d="M40 38 C40 18 120 18 120 38 L132 118 C132 132 28 132 28 118 Z" fill="#f1f5f9" stroke="#cbd5e1" />
        <path d="M52 36 C60 22 100 22 108 36" fill="none" stroke="#94a3b8" strokeWidth="4" />
        {dots.map((dot, index) => {
          const col = index % 6
          const row = Math.floor(index / 6)
          return (
            <circle
              key={`${dot}-${index}`}
              cx={48 + col * 14}
              cy={62 + row * 16}
              r="6"
              fill={color[dot]}
              opacity={dot === condition ? 1 : 0.28}
            />
          )
        })}
      </svg>
      <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
        <li>Red · 6</li>
        <li>Blue · 4</li>
        <li>Green · 2</li>
        <li>Total · 12</li>
      </ul>
    </div>
  )
}
