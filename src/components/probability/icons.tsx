import type { CSSProperties, ReactNode } from 'react'

const PIP: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
}

export function DieFace({
  value,
  size = 92,
  accent = '#ef4444',
  style,
  className,
}: {
  value: number
  size?: number
  accent?: string
  style?: CSSProperties
  className?: string
}) {
  const face = Math.min(6, Math.max(1, Math.round(value)))
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
    >
      <defs>
        <linearGradient id={`pf-die-${face}-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="70%" stopColor="#f4f6fb" />
          <stop offset="100%" stopColor="#e4e9f2" />
        </linearGradient>
      </defs>
      <rect x="14" y="18" width="74" height="74" rx="16" fill="#d5dce8" />
      <rect x="8" y="8" width="74" height="74" rx="16" fill={`url(#pf-die-${face}-${size})`} stroke="#eef2f7" strokeWidth="2" />
      <rect x="8" y="8" width="74" height="10" rx="16" fill={accent} opacity="0.12" />
      {PIP[face].map(([x, y], i) => (
        <circle key={i} cx={x - 5} cy={y - 5} r="6.2" fill="#111827" />
      ))}
    </svg>
  )
}

export function TwinDice({ active = false }: { active?: boolean }) {
  return (
    <div className="relative h-[132px] w-[168px]" aria-hidden>
      <DieFace
        value={5}
        size={96}
        className={active ? 'origin-center animate-[si-tumble-a_2.6s_ease-in-out_infinite]' : ''}
        style={{ position: 'absolute', left: 0, top: 18 }}
      />
      <DieFace
        value={2}
        size={78}
        accent="#2563eb"
        className={active ? 'origin-center animate-[si-tumble-b_2.4s_ease-in-out_infinite]' : ''}
        style={{ position: 'absolute', right: 0, top: 0 }}
      />
    </div>
  )
}

function IconFrame({ children, label, size = 72 }: { children: ReactNode; label: string; size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} role="img" aria-label={label}>
      {children}
    </svg>
  )
}

export function LabIcon({ id, size = 72 }: { id: string; size?: number }) {
  switch (id) {
    case 'sample-space-events':
      return (
        <IconFrame size={size} label="Sample space die">
          <rect x="14" y="16" width="40" height="40" rx="10" fill="#fff" stroke="#fecaca" strokeWidth="2" />
          <rect x="18" y="20" width="40" height="40" rx="10" fill="#fff1f2" />
          <rect x="16" y="14" width="40" height="40" rx="10" fill="#fff" stroke="#fda4af" strokeWidth="1.5" />
          <circle cx="26" cy="24" r="3.2" fill="#e11d48" />
          <circle cx="46" cy="24" r="3.2" fill="#e11d48" />
          <circle cx="36" cy="34" r="3.2" fill="#e11d48" />
          <circle cx="26" cy="44" r="3.2" fill="#e11d48" />
          <circle cx="46" cy="44" r="3.2" fill="#e11d48" />
        </IconFrame>
      )
    case 'set-operations':
      return (
        <IconFrame size={size} label="Overlapping sets">
          <circle cx="30" cy="36" r="16" fill="#60a5fa" opacity="0.85" />
          <circle cx="42" cy="36" r="16" fill="#34d399" opacity="0.75" />
        </IconFrame>
      )
    case 'probability-rules':
      return (
        <IconFrame size={size} label="Probability rules">
          <text x="16" y="48" fontSize="36" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
            Σ
          </text>
        </IconFrame>
      )
    case 'conditional-probability':
      return (
        <IconFrame size={size} label="Conditional overlap">
          <circle cx="30" cy="36" r="15" fill="none" stroke="#22c55e" strokeWidth="4" />
          <circle cx="42" cy="36" r="15" fill="none" stroke="#86efac" strokeWidth="4" />
        </IconFrame>
      )
    case 'independence':
      return (
        <IconFrame size={size} label="Independence link">
          <path d="M24 28a10 10 0 1 0 0 16h6" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
          <path d="M42 28h6a10 10 0 1 1 0 16h-6" fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />
          <rect x="28" y="33" width="16" height="6" rx="3" fill="#f59e0b" />
        </IconFrame>
      )
    case 'bayes-theorem':
      return (
        <IconFrame size={size} label="Bayes density">
          <path d="M10 50 C20 50 22 18 36 18 C50 18 52 50 62 50" fill="none" stroke="#8b5cf6" strokeWidth="3.5" />
          <path d="M10 50 C20 50 22 18 36 18 C50 18 52 50 62 50 V54 H10 Z" fill="#ddd6fe" opacity="0.85" />
        </IconFrame>
      )
    case 'law-of-total-probability':
      return (
        <IconFrame size={size} label="Branching paths">
          <circle cx="18" cy="36" r="5" fill="#22c55e" />
          <circle cx="40" cy="20" r="5" fill="#86efac" />
          <circle cx="40" cy="36" r="5" fill="#4ade80" />
          <circle cx="40" cy="52" r="5" fill="#16a34a" />
          <circle cx="58" cy="20" r="4" fill="#bbf7d0" />
          <circle cx="58" cy="52" r="4" fill="#bbf7d0" />
          <path d="M23 36 L35 20 M23 36 L35 36 M23 36 L35 52 M45 20 L54 20 M45 52 L54 52" stroke="#22c55e" strokeWidth="2.4" />
        </IconFrame>
      )
    case 'counting-techniques':
      return (
        <IconFrame size={size} label="Counting bars">
          <rect x="16" y="38" width="10" height="18" rx="3" fill="#fdba74" />
          <rect x="31" y="26" width="10" height="30" rx="3" fill="#fb923c" />
          <rect x="46" y="16" width="10" height="40" rx="3" fill="#f97316" />
        </IconFrame>
      )
    case 'probability-tree-venn':
      return (
        <IconFrame size={size} label="Probability tree">
          <circle cx="16" cy="36" r="5" fill="#fb923c" />
          <circle cx="36" cy="22" r="5" fill="#60a5fa" />
          <circle cx="36" cy="50" r="5" fill="#f87171" />
          <circle cx="56" cy="14" r="4.5" fill="#a78bfa" />
          <circle cx="56" cy="30" r="4.5" fill="#38bdf8" />
          <circle cx="56" cy="42" r="4.5" fill="#fbbf24" />
          <circle cx="56" cy="58" r="4.5" fill="#34d399" />
          <path d="M21 36 L31 22 M21 36 L31 50 M41 22 L52 14 M41 22 L52 30 M41 50 L52 42 M41 50 L52 58" stroke="#94a3b8" strokeWidth="2" />
        </IconFrame>
      )
    default:
      return (
        <IconFrame size={size} label="Lab">
          <circle cx="36" cy="36" r="16" fill="#dbeafe" />
        </IconFrame>
      )
  }
}

export function FeatureIcon({ name }: { name: 'labs' | 'visual' | 'sim' | 'world' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'labs') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" fill="#dbeafe" />
        <path d="M10 8h4l-1 4h3l-5 7 1-5H9l1-6z" fill="#2563eb" />
      </svg>
    )
  }
  if (name === 'visual') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="14" rx="3" fill="#e0e7ff" />
        <path d="M7 15l3-3 2 2 4-5" stroke="#4f46e5" strokeWidth="1.8" fill="none" />
      </svg>
    )
  }
  if (name === 'sim') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="#0ea5e9" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2" fill="#0ea5e9" />
        <path d="M12 6v3M18 12h-3M12 18v-3M6 12h3" stroke="#0ea5e9" strokeWidth="1.6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" fill="#dcfce7" />
      <ellipse cx="12" cy="12" rx="4" ry="8" stroke="#16a34a" strokeWidth="1.4" />
      <path d="M4 12h16" stroke="#16a34a" strokeWidth="1.4" />
    </svg>
  )
}

export function ProbabilityHeroArt({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto h-[230px] w-full max-w-[460px]" aria-hidden>
      <TwinDice active={active} />
      <svg viewBox="0 0 220 140" className="absolute right-0 top-2 h-[150px] w-[220px]">
        <circle cx="78" cy="62" r="38" fill="#fda4af" opacity="0.9" />
        <circle cx="118" cy="62" r="38" fill="#93c5fd" opacity="0.78" />
        <text x="62" y="66" fontSize="16" fontWeight="700" fill="#1e293b">A</text>
        <text x="122" y="66" fontSize="16" fontWeight="700" fill="#1e293b">B</text>
        <text x="48" y="118" fontSize="13" fill="#64748b">P(A ∪ B)</text>
        <circle cx="188" cy="28" r="4" fill="#2563eb" />
        <line x1="188" y1="28" x2="168" y2="58" stroke="#2563eb" strokeWidth="1.6" />
        <line x1="188" y1="28" x2="208" y2="58" stroke="#2563eb" strokeWidth="1.6" />
        <circle cx="168" cy="58" r="4" fill="#60a5fa" />
        <circle cx="208" cy="58" r="4" fill="#93c5fd" />
        <text x="154" y="76" fontSize="11" fill="#64748b">P(A)</text>
        <text x="198" y="76" fontSize="11" fill="#64748b">Aᶜ</text>
      </svg>
      <div className="absolute bottom-2 left-2 rounded-2xl bg-white/80 px-3 py-2 text-[15px] text-slate-600 shadow-sm backdrop-blur dark:bg-slate-900/80">
        P(A | B) = P(A ∩ B) / P(B)
      </div>
      <p className="pf-note absolute bottom-3 right-2 w-[120px] text-right">
        Small ideas.
        <br />
        Big possibilities.
      </p>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  if (slug === 'independence') {
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 72 48" width="72" height="48" aria-hidden>
          <path d="M20 14a12 12 0 1 0 0 20h10" fill="none" stroke="#f59e0b" strokeWidth="6" />
          <path d="M42 14h10a12 12 0 1 1 0 20H42" fill="none" stroke="#3b82f6" strokeWidth="6" />
        </svg>
        <TwinDice />
      </div>
    )
  }
  if (slug === 'counting-techniques') {
    return (
      <div className="flex items-end gap-2" aria-hidden>
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-black shadow-md ring-1 ring-slate-200">
            {n}
          </div>
        ))}
      </div>
    )
  }
  if (slug === 'conditional-probability' || slug === 'set-operations' || slug === 'probability-tree-venn') {
    return (
      <svg viewBox="0 0 160 90" width="168" height="90" aria-hidden>
        <circle cx="60" cy="48" r="30" fill="#fda4af" opacity="0.9" />
        <circle cx="96" cy="48" r="30" fill="#93c5fd" opacity="0.78" />
        <text x="46" y="52" fontSize="16" fontWeight="700">A</text>
        <text x="100" y="52" fontSize="16" fontWeight="700">B</text>
      </svg>
    )
  }
  if (slug === 'law-of-total-probability') {
    return (
      <div className="text-right">
        <p className="text-lg text-slate-500">P(A) = Σ P(A | Bᵢ) P(Bᵢ)</p>
      </div>
    )
  }
  return <TwinDice />
}
