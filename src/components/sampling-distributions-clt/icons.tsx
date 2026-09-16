import type { ReactNode } from 'react'

function Frame({ children, label, size = 56 }: { children: ReactNode; label: string; size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} role="img" aria-label={label}>
      {children}
    </svg>
  )
}

export function LabIcon({ id, size = 56 }: { id: string; size?: number }) {
  switch (id) {
    case 'sampling-distribution-of-the-mean':
      return (
        <Frame label="Sampling distribution of the mean" size={size}>
          <rect x="12" y="42" width="7" height="16" rx="2" fill="#93c5fd" />
          <rect x="22" y="30" width="7" height="28" rx="2" fill="#60a5fa" />
          <rect x="32" y="18" width="7" height="40" rx="2" fill="#2563eb" />
          <rect x="42" y="28" width="7" height="30" rx="2" fill="#60a5fa" />
          <rect x="52" y="38" width="7" height="20" rx="2" fill="#93c5fd" />
        </Frame>
      )
    case 'sampling-distribution-of-a-proportion':
      return (
        <Frame label="Sampling distribution of a proportion" size={size}>
          <path d="M10 48 C16 48 18 22 26 18 C32 15 34 28 38 30" fill="none" stroke="#93c5fd" strokeWidth="2.4" />
          <path d="M28 48 C36 48 38 16 46 16 C54 16 56 48 64 48" fill="none" stroke="#2563eb" strokeWidth="2.4" />
          <circle cx="24" cy="56" r="3" fill="#c4b5fd" />
          <circle cx="48" cy="56" r="3" fill="#2563eb" />
        </Frame>
      )
    case 'standard-error':
      return (
        <Frame label="Standard error" size={size}>
          <text x="12" y="32" fontSize="13" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
            SE
          </text>
          <path d="M14 40 H58" stroke="#94a3b8" />
          <text x="18" y="56" fontSize="11" fontWeight="700" fill="#334155" fontFamily="Georgia, serif">
            σ / √n
          </text>
        </Frame>
      )
    case 'central-limit-theorem':
      return (
        <Frame label="Central Limit Theorem" size={size}>
          <path d="M8 50 C18 50 20 16 36 16 C52 16 54 50 64 50" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <line x1="36" y1="16" x2="36" y2="52" stroke="#1d4ed8" strokeWidth="1.6" strokeDasharray="3 3" />
        </Frame>
      )
    case 'law-of-large-numbers':
      return (
        <Frame label="Law of Large Numbers" size={size}>
          <path d="M10 50 H62 M10 14 V50" fill="none" stroke="#cbd5e1" />
          <path d="M12 40 C22 12 28 46 38 30 C48 16 54 28 60 24" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <circle cx="22" cy="28" r="2.4" fill="#60a5fa" />
          <circle cx="38" cy="30" r="2.4" fill="#2563eb" />
          <circle cx="54" cy="26" r="2.4" fill="#93c5fd" />
        </Frame>
      )
    case 'sampling-distribution-comparison':
      return (
        <Frame label="Sampling distribution comparison" size={size}>
          <path d="M8 50 C16 50 18 18 28 18 C38 18 40 50 50 50" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
          <path d="M22 50 C30 50 32 28 40 28 C48 28 50 50 64 50" fill="none" stroke="#2563eb" strokeWidth="2.2" />
        </Frame>
      )
    case 'bootstrap-intuition':
      return (
        <Frame label="Bootstrap intuition" size={size}>
          <path
            d="M22 20 a16 16 0 1 1 -2 22"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path d="M18 16 l4 6 6-3" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <rect x="38" y="40" width="6" height="14" rx="1.5" fill="#93c5fd" />
          <rect x="46" y="34" width="6" height="20" rx="1.5" fill="#60a5fa" />
          <rect x="54" y="28" width="6" height="26" rx="1.5" fill="#2563eb" />
        </Frame>
      )
    default:
      return (
        <Frame label="Lab" size={size}>
          <circle cx="36" cy="36" r="16" fill="#dbeafe" />
        </Frame>
      )
  }
}

export function FeatureIcon({ name }: { name: 'labs' | 'visual' | 'world' | 'practice' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'labs') {
    return (
      <svg {...common}>
        <rect x="8" y="3" width="8" height="6" rx="1" fill="#dbeafe" />
        <path d="M9 9h6l3.2 9.5H5.8L9 9z" fill="#2563eb" />
        <circle cx="16.5" cy="6.5" r="2.2" fill="#38bdf8" />
      </svg>
    )
  }
  if (name === 'visual') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="3" fill="#e0e7ff" />
        <path d="M6 15l3.2-3.4 2.3 2.1 4.6-5.2" stroke="#4f46e5" strokeWidth="1.8" fill="none" />
      </svg>
    )
  }
  if (name === 'world') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" fill="#dbeafe" stroke="#2563eb" />
        <path d="M4 12h16M12 4c2.4 2.6 3.6 5.4 3.6 8S14.4 17.4 12 20C9.6 17.4 8.4 14.6 8.4 12S9.6 6.6 12 4z" stroke="#2563eb" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" fill="#dbeafe" />
      <path d="M8 12.2l2.6 2.6L16.4 9" stroke="#2563eb" strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function MiniBars({ bars, color = '#8b9cff' }: { bars: number[]; color?: string }) {
  return bars.map((h, i) => <rect key={`${h}-${i}`} x={4 + i * 7} y={28 - h} width="5" height={h} rx="1" fill={color} />)
}

export function SamplingDistributionsHeroArt({ active = false }: { active?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[460px]" aria-hidden>
      <svg viewBox="0 0 460 210" className="h-auto w-full" role="img" aria-label="From a population to a sampling distribution">
        <text x="70" y="22" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="700">
          From population
        </text>
        <text x="232" y="22" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="700">
          Repeated samples
        </text>
        <text x="380" y="22" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="700">
          to sampling distribution
        </text>
        <g transform={`translate(28 ${active ? 48 : 52})`}>
          <rect x="10" y="42" width="10" height="22" rx="2" fill="#c7d2fe" />
          <rect x="24" y="28" width="10" height="36" rx="2" fill="#a5b4fc" />
          <rect x="38" y="14" width="10" height="50" rx="2" fill="#818cf8" />
          <rect x="52" y="24" width="10" height="40" rx="2" fill="#a5b4fc" />
          <rect x="66" y="36" width="10" height="28" rx="2" fill="#c7d2fe" />
          <line x1="8" y1="66" x2="80" y2="66" stroke="#cbd5e1" />
        </g>
        <path d="M120 98 H150" stroke="#94a3b8" strokeWidth="1.6" markerEnd="url(#clt-arrow)" />
        <g transform="translate(168 58)">
          <g transform="translate(0 0)">
            <MiniBars bars={[10, 16, 12, 8]} />
          </g>
          <g transform="translate(0 34)">
            <MiniBars bars={[8, 14, 18, 10]} color="#a78bfa" />
          </g>
          <g transform="translate(0 68)">
            <MiniBars bars={[12, 8, 16, 14]} color="#818cf8" />
          </g>
        </g>
        <path d="M230 98 H268" stroke="#94a3b8" strokeWidth="1.6" markerEnd="url(#clt-arrow)" />
        <g transform="translate(286 52)">
          <path d="M8 86 C24 86 30 12 62 12 C94 12 100 86 132 86" fill="#eef2ff" stroke="#6366f1" strokeWidth="2.2" />
          <line x1="62" y1="12" x2="62" y2="88" stroke="#4f46e5" strokeDasharray="3 3" />
        </g>
        <text x="70" y="168" textAnchor="middle" fontSize="11" fill="#94a3b8">
          Population
        </text>
        <text x="70" y="184" textAnchor="middle" fontSize="10" fill="#94a3b8">
          (mean μ, std. dev. σ)
        </text>
        <text x="380" y="168" textAnchor="middle" fontSize="11" fill="#94a3b8">
          Sampling distribution
        </text>
        <text x="380" y="184" textAnchor="middle" fontSize="10" fill="#94a3b8">
          of sample means x̄
        </text>
        <defs>
          <marker id="clt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
      <p className="clt-note absolute -right-1 bottom-[-6px] w-40 text-right">
        Same pattern.
        <br />
        Greater insights.
      </p>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  if (slug === 'sampling-distribution-of-the-mean') {
    return (
      <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
        <text x="58" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="700">
          Repeated samples
        </text>
        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(12 ${28 + row * 22})`}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx={10 + i * 16} cy="8" r="4.5" fill={i === 5 ? '#2563eb' : '#c4b5fd'} />
            ))}
          </g>
        ))}
        <path d="M118 62 H150" stroke="#94a3b8" markerEnd="url(#h1)" />
        <path d="M168 88 C180 88 186 28 208 28 C230 28 236 88 258 88" fill="#eef2ff" stroke="#6366f1" />
        <line x1="208" y1="28" x2="208" y2="90" stroke="#4f46e5" strokeDasharray="3 3" />
        <text x="214" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="700">
          Distribution of sample means
        </text>
        <defs>
          <marker id="h1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
    )
  }
  if (slug === 'sampling-distribution-of-a-proportion') {
    return (
      <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
        {Array.from({ length: 36 }, (_, i) => (
          <circle key={i} cx={12 + (i % 6) * 10} cy={28 + Math.floor(i / 6) * 10} r="3.4" fill={i % 3 === 0 ? '#7c3aed' : '#e2e8f0'} />
        ))}
        <path d="M80 58 H112" stroke="#94a3b8" />
        <path d="M168 90 C180 90 186 30 208 30 C230 30 236 90 258 90" fill="#eef2ff" stroke="#6366f1" />
        <text x="210" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="700">
          Sampling distribution of p̂
        </text>
      </svg>
    )
  }
  if (slug === 'standard-error') {
    return (
      <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
        <path d="M10 96 C28 96 34 28 58 28 C82 28 88 96 110 96" fill="#eef2ff" stroke="#818cf8" />
        <path d="M118 96 C130 96 134 48 148 48 C162 48 166 96 180 96" fill="#e0e7ff" stroke="#6366f1" />
        <path d="M196 96 C206 96 210 62 220 62 C230 62 234 96 248 96" fill="#c7d2fe" stroke="#4338ca" />
        <text x="58" y="16" textAnchor="middle" fontSize="10" fill="#64748b">
          n = 10
        </text>
        <text x="148" y="16" textAnchor="middle" fontSize="10" fill="#64748b">
          n = 50
        </text>
        <text x="220" y="16" textAnchor="middle" fontSize="10" fill="#64748b">
          n = 200
        </text>
      </svg>
    )
  }
  if (slug === 'central-limit-theorem') {
    return (
      <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
        <path d="M8 92 C18 92 22 88 28 40 C36 8 48 92 78 92" fill="#ede9fe" stroke="#8b5cf6" />
        <path d="M96 62 H128" stroke="#94a3b8" />
        <path d="M150 92 C164 92 170 28 196 28 C222 28 228 92 256 92" fill="#eef2ff" stroke="#4f46e5" />
        <text x="40" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8">
          Skewed population
        </text>
        <text x="200" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8">
          Sampling distribution of x̄
        </text>
      </svg>
    )
  }
  if (slug === 'law-of-large-numbers') {
    return (
      <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
        <path d="M16 100 H264 M16 16 V100" fill="none" stroke="#e2e8f0" />
        <path d="M20 78 C50 20 80 90 120 48 C160 18 200 42 250 36" fill="none" stroke="#2563eb" strokeWidth="2" />
        <line x1="16" y1="40" x2="264" y2="40" stroke="#94a3b8" strokeDasharray="4 4" />
        <text x="200" y="18" fontSize="10" fill="#64748b">
          Running average → μ
        </text>
      </svg>
    )
  }
  if (slug === 'sampling-distribution-comparison') {
    return (
      <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
        <path d="M20 100 C50 100 60 20 140 20 C220 20 230 100 260 100" fill="none" stroke="#93c5fd" strokeWidth="2" />
        <path d="M60 100 C90 100 100 48 140 48 C180 48 190 100 220 100" fill="none" stroke="#6366f1" strokeWidth="2" />
        <path d="M90 100 C110 100 116 68 140 68 C164 68 170 100 190 100" fill="none" stroke="#1d4ed8" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 280 120" className="hidden h-[120px] w-[280px] lg:block" aria-hidden>
      <rect x="12" y="28" width="70" height="64" rx="10" fill="#eef2ff" stroke="#c7d2fe" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => <circle key={`${r}-${c}`} cx={28 + c * 18} cy={44 + r * 12} r="4" fill="#818cf8" />),
      )}
      <path d="M92 60 H124" stroke="#94a3b8" />
      <path d="M168 96 C180 96 186 36 208 36 C230 36 236 96 258 96" fill="#eef2ff" stroke="#4f46e5" />
    </svg>
  )
}

export function ConceptIcon({ name }: { name: 'mean' | 'repeat' | 'center' | 'spread' | 'hat' | 'target' | 'bars' | 'bell' | 'formula' | 'prop' | 'check' | 'converge' | 'stable' | 'infinity' | 'quote' | 'resample' | 'dice' | 'interval' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'mean') {
    return (
      <svg {...common}>
        <text x="5" y="17" fontSize="12" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
          x̄
        </text>
      </svg>
    )
  }
  if (name === 'repeat') {
    return (
      <svg {...common}>
        <path d="M7 7a6 6 0 1 1-1 8" stroke="#2563eb" strokeWidth="1.8" />
        <path d="M6 4.5l1.5 3 3-1" stroke="#2563eb" strokeWidth="1.6" />
      </svg>
    )
  }
  if (name === 'center') {
    return (
      <svg {...common}>
        <path d="M3 18 C7 18 8 6 12 6 C16 6 17 18 21 18" stroke="#2563eb" />
        <line x1="12" y1="6" x2="12" y2="19" stroke="#1d4ed8" strokeDasharray="2 2" />
      </svg>
    )
  }
  if (name === 'spread') {
    return (
      <svg {...common}>
        <path d="M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3" stroke="#2563eb" strokeWidth="1.6" />
      </svg>
    )
  }
  if (name === 'hat') {
    return (
      <svg {...common}>
        <text x="6" y="17" fontSize="12" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
          p̂
        </text>
      </svg>
    )
  }
  if (name === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="#2563eb" />
        <circle cx="12" cy="12" r="3" fill="#2563eb" />
      </svg>
    )
  }
  if (name === 'bars') {
    return (
      <svg {...common}>
        <rect x="4" y="12" width="4" height="8" rx="1" fill="#93c5fd" />
        <rect x="10" y="8" width="4" height="12" rx="1" fill="#60a5fa" />
        <rect x="16" y="5" width="4" height="15" rx="1" fill="#2563eb" />
      </svg>
    )
  }
  if (name === 'bell') {
    return (
      <svg {...common}>
        <path d="M3 18 C7 18 8 6 12 6 C16 6 17 18 21 18" fill="#dbeafe" stroke="#2563eb" />
      </svg>
    )
  }
  if (name === 'formula') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="3" fill="#eff6ff" />
        <path d="M7 15 V9 h4 M13 9 h4 v6" stroke="#2563eb" />
      </svg>
    )
  }
  if (name === 'prop') {
    return (
      <svg {...common}>
        <circle cx="8" cy="10" r="3" fill="#7c3aed" />
        <circle cx="15" cy="14" r="3" fill="#cbd5e1" />
      </svg>
    )
  }
  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" fill="#dcfce7" />
        <path d="M8 12.2l2.6 2.6L16.2 9" stroke="#16a34a" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'converge') {
    return (
      <svg {...common}>
        <path d="M4 16 C8 6 12 18 20 8" stroke="#2563eb" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'stable') {
    return (
      <svg {...common}>
        <path d="M4 8h16M4 12h16M4 16h10" stroke="#2563eb" />
      </svg>
    )
  }
  if (name === 'infinity') {
    return (
      <svg {...common}>
        <path d="M7 12c0-3 2.2-5 4-3s2.4 5 5 5 4-2 4-5-2.2-5-4-3-2.4 5-5 5-4-2-4-5z" stroke="#2563eb" />
      </svg>
    )
  }
  if (name === 'quote') {
    return (
      <svg {...common}>
        <path d="M6 9h5v6H7c0-3 1-4 4-6H6zM13 9h5v6h-4c0-3 1-4 4-6h-5z" fill="#2563eb" />
      </svg>
    )
  }
  if (name === 'resample') {
    return (
      <svg {...common}>
        <path d="M7 7a6 6 0 1 1-1 8" stroke="#2563eb" strokeWidth="1.8" />
        <path d="M6 4.5l1.5 3 3-1" stroke="#2563eb" strokeWidth="1.6" />
      </svg>
    )
  }
  if (name === 'dice') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" fill="#eff6ff" stroke="#2563eb" />
        <circle cx="8.5" cy="8.5" r="1.2" fill="#2563eb" />
        <circle cx="15.5" cy="15.5" r="1.2" fill="#2563eb" />
        <circle cx="12" cy="12" r="1.2" fill="#2563eb" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <line x1="4" y1="12" x2="20" y2="12" stroke="#2563eb" />
      <path d="M8 8v8M16 8v8" stroke="#2563eb" />
    </svg>
  )
}
