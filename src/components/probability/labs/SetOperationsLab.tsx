import { useMemo, useState } from 'react'
import { dieFaces, formatProb, isEven, markPfLabComplete, probabilityOf } from '../../../lib/probabilityFoundations'
import { ConceptList, FormulaBlock, Insight, PfCard, QuizBlock } from '../shared'

type Op = 'union' | 'intersection' | 'complement'

const CONCEPTS = [
  { id: 'union', title: 'Union (A ∪ B)', detail: 'The event that A or B occurs' },
  { id: 'intersection', title: 'Intersection (A ∩ B)', detail: 'The event that both occur' },
  { id: 'complement', title: 'Complement (Aᶜ)', detail: 'The event that A does not occur' },
  { id: 'venn', title: 'Venn diagrams', detail: 'A visual tool to represent events' },
]

export function SetOperationsLab({ tab }: { tab: string }) {
  const space = dieFaces()
  const [useA, setUseA] = useState(true)
  const [useB, setUseB] = useState(true)
  const [op, setOp] = useState<Op>('union')
  const [concept, setConcept] = useState('union')

  const A = useMemo(() => space.filter(isEven), [space])
  const B = useMemo(() => space.filter((n) => n > 3), [space])
  const onlyA = A.filter((n) => !B.includes(n))
  const onlyB = B.filter((n) => !A.includes(n))
  const both = A.filter((n) => B.includes(n))
  const union = [...new Set([...A, ...B])]
  const complement = space.filter((n) => !A.includes(n))

  const highlighted =
    op === 'union' ? union : op === 'intersection' ? both : complement

  const pA = probabilityOf(space, A)
  const pB = probabilityOf(space, B)
  const pUnion = probabilityOf(space, union)
  const pBoth = probabilityOf(space, both)
  const pAc = probabilityOf(space, complement)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <PfCard title="Key Concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
        </PfCard>
        <PfCard>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {concept === 'union' && 'A ∪ B includes every outcome that is in A, in B, or in both.'}
            {concept === 'intersection' && 'A ∩ B keeps only the outcomes that belong to both events.'}
            {concept === 'complement' && 'Aᶜ is everything in the sample space that is not in A.'}
            {concept === 'venn' && 'The two circles are events; the rectangle is the sample space.'}
          </p>
          <FormulaBlock
            tex={
              concept === 'intersection'
                ? 'P(A \\cap B)'
                : concept === 'complement'
                  ? 'P(A^{c}) = 1 - P(A)'
                  : 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)'
            }
          />
        </PfCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Quick practice">
        <QuizBlock
          prompt="For A = even and B = greater than 3 on a die, what is P(A ∩ B)?"
          options={['0.17', '0.33', '0.50', '0.67']}
          answer={1}
          explanation="A ∩ B = {4,6}, so 2/6 ≈ 0.33."
          onCorrect={() => markPfLabComplete('set-operations')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_280px]">
      <PfCard title="Interactive Venn Diagram">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_200px]">
          <div className="space-y-3 text-sm">
            <p className="font-bold text-slate-700 dark:text-slate-200">Choose events</p>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={useA} onChange={() => setUseA((v) => !v)} />
              <span>
                Event A · even numbers {useA ? '{2, 4, 6}' : '—'}
                <br />
                <span className="text-slate-400">P(A) = {formatProb(useA ? pA : 0)}</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={useB} onChange={() => setUseB((v) => !v)} />
              <span>
                Event B · greater than 3 {useB ? '{4, 5, 6}' : '—'}
                <br />
                <span className="text-slate-400">P(B) = {formatProb(useB ? pB : 0)}</span>
              </span>
            </label>
            <p className="pt-2 font-bold text-slate-700 dark:text-slate-200">Highlight operation</p>
            {(
              [
                ['union', 'A ∪ B (A or B)'],
                ['intersection', 'A ∩ B (A and B)'],
                ['complement', 'Aᶜ (not A)'],
              ] as const
            ).map(([id, label]) => (
              <label key={id} className="flex items-center gap-2">
                <input type="radio" name="op" checked={op === id} onChange={() => setOp(id)} />
                {label}
              </label>
            ))}
          </div>

          <Venn
            onlyA={useA ? onlyA : []}
            onlyB={useB ? onlyB : []}
            both={useA && useB ? both : []}
            highlight={highlighted}
            op={op}
          />

          <div className="space-y-2 text-sm">
            <p className="font-bold">Results</p>
            <p>P(A) = {formatProb(useA ? pA : 0)}</p>
            <p>P(B) = {formatProb(useB ? pB : 0)}</p>
            <p className="text-blue-600 font-bold">P(A ∪ B) = {formatProb(useA || useB ? pUnion : 0)}</p>
            <p className="text-violet-600 font-bold">P(A ∩ B) = {formatProb(useA && useB ? pBoth : 0)}</p>
            <p className="text-amber-600 font-bold">P(Aᶜ) = {formatProb(pAc)}</p>
            <p className="pt-2 text-xs text-slate-400">
              Sets: A = {'{'}
              {A.join(', ')}
              {'}'} · B = {'{'}
              {B.join(', ')}
              {'}'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Insight title={`What does ${op === 'union' ? 'A ∪ B' : op === 'intersection' ? 'A ∩ B' : 'Aᶜ'} mean?`}>
            {op === 'union' && `The union includes ${union.join(', ')}, so P(A ∪ B) = ${union.length}/6 = ${formatProb(pUnion)}.`}
            {op === 'intersection' && `The overlap is ${both.join(', ') || 'empty'}, so P(A ∩ B) = ${formatProb(pBoth)}.`}
            {op === 'complement' && `Aᶜ = {${complement.join(', ')}}, so P(Aᶜ) = 1 − P(A) = ${formatProb(pAc)}.`}
          </Insight>
          <PfCard title="Formula">
            <FormulaBlock tex="P(A \\cup B) = P(A) + P(B) - P(A \\cap B)" />
            <p className="mt-2 text-center text-sm text-slate-500">
              {formatProb(pA)} + {formatProb(pB)} − {formatProb(pBoth)} = {formatProb(pA + pB - pBoth)}
            </p>
          </PfCard>
        </div>
      </PfCard>

      <div className="grid gap-4">
        <PfCard title="Key Concepts">
          <ConceptList
            items={CONCEPTS}
            active={op}
            onSelect={(id) => {
              if (id === 'union' || id === 'intersection' || id === 'complement') setOp(id)
            }}
          />
        </PfCard>
      </div>
    </div>
  )
}

function Venn({
  onlyA,
  onlyB,
  both,
  highlight,
  op,
}: {
  onlyA: number[]
  onlyB: number[]
  both: number[]
  highlight: number[]
  op: Op
}) {
  const lit = new Set(highlight)
  return (
    <div className="relative mx-auto h-[230px] w-[260px]">
      <p className="absolute left-1/2 top-0 -translate-x-1/2 text-sm font-bold text-slate-500">
        {op === 'union' ? 'A ∪ B' : op === 'intersection' ? 'A ∩ B' : 'Aᶜ'}
      </p>
      <svg viewBox="0 0 260 200" className="absolute inset-0 h-full w-full" role="img" aria-label="Venn diagram of events A and B">
        <rect x="8" y="20" width="244" height="170" rx="28" fill="#f8fafc" stroke="#e2e8f0" />
        <circle cx="105" cy="110" r="62" fill="#fda4af" opacity={op === 'complement' ? 0.25 : 0.85} />
        <circle cx="155" cy="110" r="62" fill="#93c5fd" opacity={op === 'complement' ? 0.25 : 0.75} />
        <text x="70" y="78" fontSize="14" fontWeight="700">A</text>
        <text x="176" y="78" fontSize="14" fontWeight="700">B</text>
      </svg>
      <Region left={68} top={108} values={onlyA} lit={lit} />
      <Region left={118} top={108} values={both} lit={lit} />
      <Region left={168} top={108} values={onlyB} lit={lit} />
      <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] text-slate-400">Sample space {dieFaces().join(', ')}</p>
    </div>
  )
}

function Region({ left, top, values, lit }: { left: number; top: number; values: number[]; lit: Set<number> }) {
  return (
    <div className="absolute -translate-x-1/2 text-center text-xs font-bold" style={{ left, top }}>
      {values.map((value) => (
        <span key={value} className={`mx-0.5 inline-block ${lit.has(value) ? 'text-slate-900' : 'text-slate-400'}`}>
          {value}
        </span>
      ))}
    </div>
  )
}
