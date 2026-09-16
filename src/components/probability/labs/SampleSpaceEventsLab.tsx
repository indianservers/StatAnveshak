import { useMemo, useState } from 'react'
import { useReducedMotion } from '../../visual/useReducedMotion'
import { dieFaces, formatProb, isEven, isPrimeDie, markPfLabComplete } from '../../../lib/probabilityFoundations'
import { CoinFace, ConceptList, Insight, PlayingCard, PfCard, QuizBlock, ResetButton, RollingDie } from '../shared'

type Experiment = 'die' | 'coin' | 'cards'
type Face = { rank: string; suit: string; label: string }

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUITS = [
  { suit: '♠', name: 'spades' },
  { suit: '♥', name: 'hearts' },
  { suit: '♦', name: 'diamonds' },
  { suit: '♣', name: 'clubs' },
]

function deck(): Face[] {
  return SUITS.flatMap(({ suit }) => RANKS.map((rank) => ({ rank, suit, label: `${rank}${suit}` })))
}

const CONCEPTS = [
  { id: 'space', title: 'Sample space', detail: 'All possible outcomes' },
  { id: 'event', title: 'Event', detail: 'A collection of outcomes' },
  { id: 'simple', title: 'Simple events', detail: 'A single outcome' },
  { id: 'compound', title: 'Compound events', detail: 'Multiple outcomes' },
  { id: 'exclusive', title: 'Mutually exclusive events', detail: 'Cannot happen together' },
  { id: 'exhaustive', title: 'Exhaustive events', detail: 'Cover every possible outcome' },
]

export function SampleSpaceEventsLab({ tab }: { tab: string }) {
  const reduced = useReducedMotion()
  const [experiment, setExperiment] = useState<Experiment>('die')
  const [die, setDie] = useState(5)
  const [rolling, setRolling] = useState(false)
  const [heads, setHeads] = useState(true)
  const [card, setCard] = useState<Face>({ rank: 'A', suit: '♠', label: 'A♠' })
  const [concept, setConcept] = useState('space')
  const cards = useMemo(deck, [])

  const runDie = () => {
    if (rolling) return
    if (reduced) {
      setDie(1 + Math.floor(Math.random() * 6))
      markPfLabComplete('sample-space-events')
      return
    }
    setRolling(true)
    let ticks = 0
    const timer = window.setInterval(() => {
      setDie(1 + Math.floor(Math.random() * 6))
      ticks += 1
      if (ticks >= 10) {
        window.clearInterval(timer)
        const final = 1 + Math.floor(Math.random() * 6)
        setDie(final)
        setRolling(false)
        markPfLabComplete('sample-space-events')
      }
    }, 70)
  }

  const runCoin = () => {
    setHeads(Math.random() < 0.5)
    markPfLabComplete('sample-space-events')
  }

  const runCard = () => {
    setCard(cards[Math.floor(Math.random() * cards.length)] ?? cards[0])
    markPfLabComplete('sample-space-events')
  }

  const reset = () => {
    setDie(5)
    setHeads(true)
    setCard({ rank: 'A', suit: '♠', label: 'A♠' })
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <PfCard title="Key Concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
        </PfCard>
        <PfCard>
          <LearnCopy id={concept} />
          <Insight title="Quick tip">The sample space includes every possible outcome — nothing is left out.</Insight>
        </PfCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt="A fair six-sided die is rolled. What is P(even)?"
          options={['1/6', '1/3', '1/2', '2/3']}
          answer={2}
          explanation="Even faces are {2,4,6}, so |A|/|S| = 3/6 = 1/2."
          onCorrect={() => markPfLabComplete('sample-space-events')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <PfCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Interactive Experiment</p>
            <p className="text-xs text-slate-400">Run a simple experiment and see how outcomes relate to events.</p>
          </div>
          <ResetButton onClick={reset} />
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {(
            [
              ['die', 'Die', '6 outcomes'],
              ['coin', 'Coin', '2 outcomes'],
              ['cards', 'Cards', '52 outcomes'],
            ] as const
          ).map(([id, title, detail]) => (
            <button
              key={id}
              type="button"
              onClick={() => setExperiment(id)}
              className={`rounded-2xl px-3 py-2 text-left ${
                experiment === id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 dark:bg-slate-800'
              }`}
            >
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-[11px] opacity-80">{detail}</span>
            </button>
          ))}
        </div>

        {experiment === 'die' && <RollingDie value={die} rolling={rolling} onRoll={runDie} />}
        {experiment === 'coin' && (
          <div className="flex flex-col items-center gap-4">
            <CoinFace heads={heads} />
            <button type="button" className="pf-btn" onClick={runCoin}>
              Flip coin
            </button>
          </div>
        )}
        {experiment === 'cards' && (
          <div className="flex flex-col items-center gap-4">
            <PlayingCard label={card.label} />
            <button type="button" className="pf-btn" onClick={runCard}>
              Draw card
            </button>
          </div>
        )}
      </PfCard>

      <div className="grid gap-4">
        <PfCard title="Sample space">
          <SpaceCopy experiment={experiment} />
        </PfCard>
        <PfCard title="Example events">
          <EventPanel experiment={experiment} die={die} heads={heads} card={card} />
        </PfCard>
      </div>
    </div>
  )
}

function LearnCopy({ id }: { id: string }) {
  const copy: Record<string, { tex: string; text: string }> = {
    space: { tex: 'S = \\{1,2,3,4,5,6\\}', text: 'The sample space is the complete list of outcomes for the experiment.' },
    event: { tex: 'A \\subseteq S', text: 'An event is any subset of the sample space — the outcomes we care about.' },
    simple: { tex: 'A = \\{5\\}', text: 'A simple event contains exactly one outcome, such as rolling a 5.' },
    compound: { tex: 'E = \\{2,4,6\\}', text: 'A compound event groups several outcomes, such as “even”.' },
    exclusive: { tex: 'A \\cap B = \\emptyset', text: 'Mutually exclusive events cannot occur on the same trial.' },
    exhaustive: { tex: 'A \\cup A^{c} = S', text: 'Exhaustive events cover every outcome in the sample space.' },
  }
  const item = copy[id] ?? copy.space
  return (
    <div className="mb-4">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
      <p className="mt-3 text-center text-lg">
        <span className="font-mono">{item.tex.replace(/\\/g, '')}</span>
      </p>
    </div>
  )
}

function SpaceCopy({ experiment }: { experiment: Experiment }) {
  if (experiment === 'coin') return <p className="text-sm text-slate-600">S = {'{H, T}'}</p>
  if (experiment === 'cards') return <p className="text-sm text-slate-600">S = 52 cards = 13 ranks × 4 suits.</p>
  return (
    <div>
      <p className="text-sm text-slate-500">All possible outcomes when rolling a die.</p>
      <p className="mt-2 font-mono text-sm">S = {'{1, 2, 3, 4, 5, 6}'}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {dieFaces().map((face) => (
          <span key={face} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-sm font-bold dark:bg-slate-800">
            {face}
          </span>
        ))}
      </div>
    </div>
  )
}

function EventPanel({
  experiment,
  die,
  heads,
  card,
}: {
  experiment: Experiment
  die: number
  heads: boolean
  card: Face
}) {
  if (experiment === 'die') {
    const even = isEven(die)
    const prime = isPrimeDie(die)
    return (
      <div className="space-y-3 text-sm">
        <p>Even numbers E = {'{2, 4, 6}'} · P(E) = 3/6 = {formatProb(0.5)}</p>
        <p>Prime numbers P = {'{2, 3, 5}'} · P(P) = 3/6 = {formatProb(0.5)}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat label="Last result" value={String(die)} />
          <Stat label="In even?" value={even ? 'Yes' : 'No'} ok={even} />
          <Stat label="In prime?" value={prime ? 'Yes' : 'No'} ok={prime} />
        </div>
      </div>
    )
  }
  if (experiment === 'coin') {
    return (
      <div className="space-y-2 text-sm">
        <p>Heads H = {'{H}'} · P(H) = 1/2</p>
        <Stat label="Last result" value={heads ? 'Heads' : 'Tails'} />
      </div>
    )
  }
  const heart = card.suit === '♥'
  return (
    <div className="space-y-2 text-sm">
      <p>Hearts · P = 13/52 = 0.25</p>
      <Stat label="Last card" value={card.label} />
      <Stat label="Is a heart?" value={heart ? 'Yes' : 'No'} ok={heart} />
    </div>
  )
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className={`text-sm font-black ${ok === true ? 'text-emerald-600' : ok === false ? 'text-slate-500' : 'text-slate-800 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}
