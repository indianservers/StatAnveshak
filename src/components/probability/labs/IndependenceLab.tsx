import { useMemo, useState } from 'react'
import {
  formatProb,
  independenceGap,
  isApproximatelyIndependent,
  markPfLabComplete,
} from '../../../lib/probabilityFoundations'
import { ConceptList, Insight, PfCard, QuizBlock, ResetButton, ResultBanner } from '../shared'

type EventId = 'first1' | 'second2' | 'sum7' | 'evenFirst' | 'evenSecond'

const EVENTS: Record<EventId, { label: string; test: (a: number, b: number) => boolean; theory: number }> = {
  first1: { label: 'First die shows a 1', test: (a) => a === 1, theory: 1 / 6 },
  second2: { label: 'Second die shows a 2', test: (_a, b) => b === 2, theory: 1 / 6 },
  sum7: { label: 'Sum is 7', test: (a, b) => a + b === 7, theory: 6 / 36 },
  evenFirst: { label: 'First die is even', test: (a) => a % 2 === 0, theory: 1 / 2 },
  evenSecond: { label: 'Second die is even', test: (_a, b) => b % 2 === 0, theory: 1 / 2 },
}

const CONCEPTS = [
  { id: 'what', title: 'What does independence mean?', detail: 'One outcome does not affect the other' },
  { id: 'ind', title: 'Independent events', detail: 'P(A ∩ B) = P(A)P(B)' },
  { id: 'dep', title: 'Dependent events', detail: 'Knowing A changes P(B)' },
  { id: 'check', title: 'Checking P(A ∩ B) = P(A)P(B)', detail: 'Compare product with overlap' },
]

export function IndependenceLab({ tab }: { tab: string }) {
  const [eventA, setEventA] = useState<EventId>('first1')
  const [eventB, setEventB] = useState<EventId>('second2')
  const [trials, setTrials] = useState(100000)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ pA: number; pB: number; pBoth: number } | null>(null)

  const theoretical = useMemo(() => {
    let both = 0
    for (let a = 1; a <= 6; a += 1) {
      for (let b = 1; b <= 6; b += 1) {
        if (EVENTS[eventA].test(a, b) && EVENTS[eventB].test(a, b)) both += 1
      }
    }
    return {
      pA: EVENTS[eventA].theory,
      pB: EVENTS[eventB].theory,
      pBoth: both / 36,
    }
  }, [eventA, eventB])

  const run = () => {
    setRunning(true)
    window.setTimeout(() => {
      let aCount = 0
      let bCount = 0
      let both = 0
      const n = trials
      for (let i = 0; i < n; i += 1) {
        const d1 = 1 + Math.floor(Math.random() * 6)
        const d2 = 1 + Math.floor(Math.random() * 6)
        const inA = EVENTS[eventA].test(d1, d2)
        const inB = EVENTS[eventB].test(d1, d2)
        if (inA) aCount += 1
        if (inB) bCount += 1
        if (inA && inB) both += 1
      }
      setResult({ pA: aCount / n, pB: bCount / n, pBoth: both / n })
      setRunning(false)
      markPfLabComplete('independence')
    }, 20)
  }

  const shown = result ?? theoretical
  const gap = independenceGap(shown.pA, shown.pB, shown.pBoth)
  const independent = isApproximatelyIndependent(shown.pA, shown.pB, shown.pBoth, result ? 0.008 : 0.001)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <PfCard title="Lab contents">
          <ConceptList items={CONCEPTS} />
        </PfCard>
        <PfCard>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Two events are independent when knowing one occurred does not change the probability of the other. The
            numerical test is P(A ∩ B) = P(A)P(B), which is the same as P(A | B) = P(A).
          </p>
        </PfCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Practice">
        <QuizBlock
          prompt="A first die shows 1 and a second die shows 2. Are these events independent?"
          options={['Yes', 'No', 'Only if the dice are loaded', 'Only for 10 trials']}
          answer={0}
          explanation="The faces live on different dice, so P(A ∩ B) = (1/6)(1/6) = 1/36."
          onCorrect={() => markPfLabComplete('independence')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <PfCard title="Lab contents">
        <ConceptList items={CONCEPTS} />
        <p className="mt-4 text-xs text-slate-400">Need a hint? Compare the product P(A)P(B) with the overlap.</p>
      </PfCard>
      <PfCard title="Interactive simulation: two dice">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Roll two fair six-sided dice and compare P(A ∩ B) with P(A)P(B).</p>
          <label className="text-xs font-bold text-slate-500">
            Trials
            <select
              className="ml-2 rounded-xl border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
              value={trials}
              onChange={(event) => setTrials(Number(event.target.value))}
            >
              <option value={1000}>1,000</option>
              <option value={10000}>10,000</option>
              <option value={100000}>100,000</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <EventPicker label="1 · Select event A" value={eventA} onChange={setEventA} />
          <EventPicker label="2 · Select event B" value={eventB} onChange={setEventB} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="pf-btn" onClick={run} disabled={running}>
            {running ? 'Running…' : `Run simulation (${trials.toLocaleString()} rolls)`}
          </button>
          <ResetButton
            onClick={() => {
              setResult(null)
              setEventA('first1')
              setEventB('second2')
            }}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <table className="w-full text-sm">
            <tbody>
              <Row name="P(A)" value={shown.pA} hint={EVENTS[eventA].theory} />
              <Row name="P(B)" value={shown.pB} hint={EVENTS[eventB].theory} />
              <Row name="P(A ∩ B)" value={shown.pBoth} hint={theoretical.pBoth} />
              <Row name="P(A)P(B)" value={shown.pA * shown.pB} hint={theoretical.pA * theoretical.pB} />
            </tbody>
          </table>
          <div className="space-y-3">
            <ResultBanner tone={independent ? 'ok' : 'warn'} title={independent ? 'These events are independent!' : 'These events are dependent.'}>
              |P(A ∩ B) − P(A)P(B)| = {formatProb(Math.abs(gap), 5)}
            </ResultBanner>
            <Insight title="Intuition">
              {independent
                ? 'Knowing the first die’s result does not change the probability of the second die.'
                : 'The overlap is not the product of the margins, so one event carries information about the other.'}
            </Insight>
          </div>
        </div>
      </PfCard>
    </div>
  )
}

function EventPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: EventId
  onChange: (value: EventId) => void
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        value={value}
        onChange={(event) => onChange(event.target.value as EventId)}
      >
        {Object.entries(EVENTS).map(([id, item]) => (
          <option key={id} value={id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Row({ name, value, hint }: { name: string; value: number; hint: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      <th className="py-2 text-left font-semibold text-slate-500">{name}</th>
      <td className="py-2 text-right font-mono">{formatProb(value, 5)}</td>
      <td className="py-2 text-right text-xs text-slate-400">(≈ {formatProb(hint, 3)})</td>
    </tr>
  )
}
