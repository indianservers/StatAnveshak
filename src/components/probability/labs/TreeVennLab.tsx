import { useState } from 'react'
import { formatProb, markPfLabComplete, twoCoinOutcomes } from '../../../lib/probabilityFoundations'
import { Insight, PfCard, QuizBlock, ResetButton, ResultBanner } from '../shared'

type Mode = 'tree' | 'venn'
type Path = 'HH' | 'HT' | 'TH' | 'TT'

export function TreeVennLab({ tab }: { tab: string }) {
  const [mode, setMode] = useState<Mode>('tree')
  const [pH, setPH] = useState(0.5)
  const [highlight, setHighlight] = useState<Path | null>('HH')
  const pT = 1 - pH
  const outcomes = [
    { path: 'HH' as const, p: pH * pH },
    { path: 'HT' as const, p: pH * pT },
    { path: 'TH' as const, p: pT * pH },
    { path: 'TT' as const, p: pT * pT },
  ]
  const total = outcomes.reduce((sum, item) => sum + item.p, 0)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <PfCard title="Lab content">
          <ol className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>1. Probability tree diagrams visualize all possible outcomes.</li>
            <li>2. Venn diagrams show relationships between events.</li>
            <li>3. Outcome paths: multiply probabilities along branches.</li>
            <li>4. Combined reasoning: use trees and Venn diagrams together.</li>
          </ol>
        </PfCard>
        <Insight title="Key insight">
          The probabilities along each path are multiplied, and the total probability across all outcomes equals 1.
        </Insight>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Try it yourself">
        <QuizBlock
          prompt="Two fair coins are tossed. What is P(exactly one head)?"
          options={['1/4', '1/3', '1/2', '3/4']}
          answer={2}
          explanation="The paths HT and TH each have probability 1/4, so 1/2."
          onCorrect={() => markPfLabComplete('probability-tree-venn')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1.2fr)_280px]">
      <PfCard title="Lab content">
        <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li>1. Probability tree diagrams</li>
          <li>2. Venn diagrams</li>
          <li>3. Outcome paths</li>
          <li>4. Combined reasoning</li>
        </ol>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Lab resources</p>
        <ul className="mt-1 space-y-1 text-sm text-slate-500">
          <li>Cheat sheet</li>
          <li>Example problems</li>
          <li>Related readings</li>
        </ul>
      </PfCard>

      <PfCard>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${mode === 'tree' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              onClick={() => setMode('tree')}
            >
              Tree diagram
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${mode === 'venn' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              onClick={() => setMode('venn')}
            >
              Venn diagram
            </button>
          </div>
          <ResetButton
            onClick={() => {
              setPH(0.5)
              setHighlight('HH')
              setMode('tree')
            }}
          />
        </div>
        <p className="text-sm font-bold">Example: two coin tosses</p>
        <p className="text-sm text-slate-500">
          Each coin has probability {formatProb(pH)} of landing heads. Explore the tree to see all outcomes.
        </p>
        <label className="mt-3 block text-xs font-bold text-slate-400">
          P(Heads) = {formatProb(pH)}
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={pH}
            onChange={(event) => {
              setPH(Number(event.target.value))
              markPfLabComplete('probability-tree-venn')
            }}
            className="mt-1 w-full accent-blue-600"
          />
        </label>
        {mode === 'tree' ? (
          <CoinTree pH={pH} highlight={highlight} onHighlight={setHighlight} />
        ) : (
          <RelatedVenn highlight={highlight} />
        )}
        <Insight title="Key insight">
          Multiply along a path. The highlighted path {highlight ?? '—'} has probability{' '}
          {formatProb(outcomes.find((item) => item.path === highlight)?.p ?? 0)}.
        </Insight>
      </PfCard>

      <div className="grid gap-4">
        <PfCard title="Results & probabilities">
          <table className="w-full text-sm">
            <tbody>
              {outcomes.map((item) => (
                <tr key={item.path} className={highlight === item.path ? 'bg-blue-50 dark:bg-blue-950/30' : ''}>
                  <td className="py-1.5 font-semibold">P({item.path})</td>
                  <td className="py-1.5 text-right font-mono">{formatProb(item.p)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-bold">Total probability</td>
                <td className="py-2 text-right font-black">{formatProb(total)}</td>
              </tr>
            </tbody>
          </table>
          <ResultBanner title="The branches add to 1" />
        </PfCard>
        <PfCard title="Related Venn view">
          <RelatedVenn highlight={highlight} />
          <button type="button" className="pf-btn mt-3 w-full" onClick={() => setMode(mode === 'tree' ? 'venn' : 'tree')}>
            Switch to {mode === 'tree' ? 'Venn' : 'tree'}
          </button>
        </PfCard>
      </div>
    </div>
  )
}

function CoinTree({
  pH,
  highlight,
  onHighlight,
}: {
  pH: number
  highlight: Path | null
  onHighlight: (path: Path) => void
}) {
  const pT = 1 - pH
  const nodes: Array<{ path: Path; x: number; y: number; label: string }> = [
    { path: 'HH', x: 250, y: 28, label: 'HH' },
    { path: 'HT', x: 250, y: 68, label: 'HT' },
    { path: 'TH', x: 250, y: 108, label: 'TH' },
    { path: 'TT', x: 250, y: 148, label: 'TT' },
  ]
  return (
    <svg viewBox="0 0 320 180" className="mt-3 h-52 w-full" role="img" aria-label="Two-coin probability tree">
      <line x1="30" y1="88" x2="90" y2="48" stroke="#3b82f6" strokeWidth="2" />
      <line x1="30" y1="88" x2="90" y2="128" stroke="#ef4444" strokeWidth="2" />
      <line x1="90" y1="48" x2="170" y2="28" stroke="#3b82f6" strokeWidth="2" />
      <line x1="90" y1="48" x2="170" y2="68" stroke="#ef4444" strokeWidth="2" />
      <line x1="90" y1="128" x2="170" y2="108" stroke="#3b82f6" strokeWidth="2" />
      <line x1="90" y1="128" x2="170" y2="148" stroke="#ef4444" strokeWidth="2" />
      <circle cx="24" cy="88" r="10" fill="#e2e8f0" />
      <text x="12" y="80" fontSize="9" fill="#64748b">Start</text>
      <circle cx="90" cy="48" r="11" fill="#3b82f6" />
      <circle cx="90" cy="128" r="11" fill="#ef4444" />
      <text x="86" y="52" fontSize="10" fill="#fff">H</text>
      <text x="86" y="132" fontSize="10" fill="#fff">T</text>
      <circle cx="170" cy="28" r="10" fill="#3b82f6" />
      <circle cx="170" cy="68" r="10" fill="#ef4444" />
      <circle cx="170" cy="108" r="10" fill="#3b82f6" />
      <circle cx="170" cy="148" r="10" fill="#ef4444" />
      <text x="40" y="60" fontSize="10" fill="#64748b">{formatProb(pH)}</text>
      <text x="40" y="130" fontSize="10" fill="#64748b">{formatProb(pT)}</text>
      {nodes.map((node) => (
        <g key={node.path} onClick={() => onHighlight(node.path)} className="cursor-pointer">
          <text x={node.x} y={node.y + 4} fontSize="12" fontWeight={highlight === node.path ? 800 : 600} fill={highlight === node.path ? '#2563eb' : '#334155'}>
            {node.label} {formatProb(node.path[0] === 'H' ? pH : pT)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function RelatedVenn({ highlight }: { highlight: Path | null }) {
  const a = highlight === 'HH' || highlight === 'HT'
  const b = highlight === 'HH' || highlight === 'TH'
  return (
    <div className="mt-2">
      <svg viewBox="0 0 200 110" className="h-28 w-full" aria-hidden>
        <circle cx="80" cy="58" r="36" fill="#fda4af" opacity={a ? 0.95 : 0.45} />
        <circle cx="120" cy="58" r="36" fill="#93c5fd" opacity={b ? 0.85 : 0.4} />
        <text x="54" y="62" fontSize="11" fontWeight="700">A</text>
        <text x="126" y="62" fontSize="11" fontWeight="700">B</text>
      </svg>
      <p className="text-xs text-slate-500">
        A = first toss heads · B = second toss heads · A ∩ B = HH = {formatProb(0.25)} when the coins are fair.
      </p>
      <p className="sr-only">{twoCoinOutcomes().map((item) => item.path).join(' ')}</p>
    </div>
  )
}
