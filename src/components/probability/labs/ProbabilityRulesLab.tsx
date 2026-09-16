import { useState } from 'react'
import { clamp01, formatProb, markPfLabComplete } from '../../../lib/probabilityFoundations'
import { ConceptList, FormulaBlock, PfCard, PfStepper, QuizBlock, ResultBanner } from '../shared'

const RULES = [
  { id: 'bound', title: '0 ≤ P(A) ≤ 1', detail: 'Probabilities are between 0 and 1' },
  { id: 'sure', title: 'P(S) = 1', detail: 'The probability of the sample space' },
  { id: 'complement', title: 'Complement rule', detail: 'P(Aᶜ) = 1 − P(A)' },
  { id: 'addition', title: 'Addition rule', detail: 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B)' },
  { id: 'multiplication', title: 'Multiplication rule', detail: 'P(A ∩ B) = P(A)P(B) if independent' },
]

export function ProbabilityRulesLab({ tab }: { tab: string }) {
  const [rule, setRule] = useState('complement')
  const [pass, setPass] = useState(70)

  const p = clamp01(pass / 100)
  const complement = 1 - p

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <PfCard title="Key Probability Rules">
          <ConceptList items={RULES} active={rule} onSelect={setRule} />
        </PfCard>
        <RuleDetail rule={rule} />
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Try a practice question">
        <QuizBlock
          prompt="A card is drawn from a standard deck of 52. If A is “the card is a heart,” what is P(Aᶜ)?"
          options={['0.25', '0.75', '0.50', '0.13']}
          answer={1}
          explanation="P(A) = 13/52 = 0.25, so P(Aᶜ) = 1 − 0.25 = 0.75."
          onCorrect={() => markPfLabComplete('probability-rules')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <PfCard title="Key Probability Rules">
        <ConceptList items={RULES} active={rule} onSelect={setRule} />
        <p className="mt-4 text-xs leading-5 text-slate-400">
          These rules form the foundation for more advanced probability concepts.
        </p>
      </PfCard>
      <div className="grid gap-4">
        <RuleDetail rule={rule} />
        <PfCard title="Work through an example">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Suppose the probability a student passes a test is {formatProb(p)}. What is the probability the student does
            not pass?
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_200px]">
            <PfStepper label="P(A) as percent" value={pass} min={0} max={100} onChange={setPass} />
            <FormulaBlock tex={`P(A^{c}) = 1 - ${formatProb(p)} = ${formatProb(complement)}`} />
            <ResultBanner title="Correct!">
              The probability the student does not pass is {formatProb(complement)} ({Math.round(complement * 100)}%).
            </ResultBanner>
          </div>
        </PfCard>
      </div>
    </div>
  )
}

function RuleDetail({ rule }: { rule: string }) {
  const map: Record<string, { title: string; tex: string; text: string }> = {
    bound: { title: 'Bounded probability', tex: '0 \\le P(A) \\le 1', text: 'No event can be more certain than the whole sample space, or less than impossible.' },
    sure: { title: 'Normalization', tex: 'P(S) = 1', text: 'If an experiment happens, some outcome in S must occur.' },
    complement: { title: 'Complement rule', tex: 'P(A^{c}) = 1 - P(A)', text: 'The complement of A, written Aᶜ, is the event that A does not occur.' },
    addition: { title: 'Addition rule', tex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', text: 'Adding P(A) and P(B) double-counts the overlap, so subtract it once.' },
    multiplication: { title: 'Multiplication rule', tex: 'P(A \\cap B) = P(A)P(B)', text: 'This product form holds when A and B are independent.' },
  }
  const item = map[rule] ?? map.complement
  return (
    <PfCard title={item.title}>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
      <div className="mt-3">
        <FormulaBlock tex={item.tex} />
      </div>
      {rule === 'complement' && <ComplementPicture />}
    </PfCard>
  )
}

function ComplementPicture() {
  return (
    <div className="mt-4 flex items-center justify-end gap-4">
      <svg viewBox="0 0 160 90" width="160" height="90" aria-hidden>
        <rect x="8" y="8" width="144" height="74" rx="12" fill="#eff6ff" stroke="#bfdbfe" />
        <circle cx="62" cy="45" r="24" fill="#fb7185" />
        <text x="56" y="50" fontSize="14" fontWeight="700" fill="#fff">A</text>
        <text x="108" y="50" fontSize="13" fill="#64748b">Aᶜ</text>
        <text x="136" y="22" fontSize="12" fill="#64748b">S</text>
      </svg>
    </div>
  )
}
