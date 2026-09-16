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
    case 'scatter-plot-explorer':
      return (
        <Frame label="Scatter plot explorer" size={size}>
          <path d="M14 56 H58 M14 16 V56" fill="none" stroke="#cbd5e1" />
          <path d="M18 48 L56 22" stroke="#2563eb" strokeWidth="2" />
          <circle cx="24" cy="44" r="3.2" fill="#2563eb" />
          <circle cx="34" cy="38" r="3.2" fill="#3b82f6" />
          <circle cx="44" cy="30" r="3.2" fill="#2563eb" />
          <circle cx="52" cy="26" r="3.2" fill="#60a5fa" />
        </Frame>
      )
    case 'covariance':
      return (
        <Frame label="Covariance" size={size}>
          <path d="M16 36 H56 M36 16 V56" stroke="#e2e8f0" />
          <rect x="38" y="16" width="18" height="18" fill="#dcfce7" />
          <rect x="16" y="38" width="18" height="18" fill="#dcfce7" />
          <rect x="38" y="38" width="18" height="18" fill="#fee2e2" />
          <rect x="16" y="16" width="18" height="18" fill="#fee2e2" />
          <circle cx="48" cy="24" r="3" fill="#059669" />
          <circle cx="24" cy="48" r="3" fill="#059669" />
        </Frame>
      )
    case 'pearson-correlation':
      return (
        <Frame label="Pearson correlation" size={size}>
          <text x="16" y="44" fontSize="28" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
            r
          </text>
          <path d="M46 48 C50 20 58 20 60 48" fill="none" stroke="#93c5fd" strokeWidth="2" />
        </Frame>
      )
    case 'spearman-rank-correlation':
      return (
        <Frame label="Spearman rank correlation" size={size}>
          <text x="14" y="46" fontSize="28" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
            ρ
          </text>
          <path d="M44 50 H52 V40 H60 V28" fill="none" stroke="#38bdf8" strokeWidth="2.2" />
        </Frame>
      )
    case 'kendall-tau':
      return (
        <Frame label="Kendall tau" size={size}>
          <text x="14" y="46" fontSize="28" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
            τ
          </text>
          <path d="M44 48 L54 28" stroke="#059669" strokeWidth="2.2" />
          <path d="M50 48 L60 38" stroke="#dc2626" strokeWidth="2.2" />
          <circle cx="44" cy="48" r="2.4" fill="#2563eb" />
          <circle cx="54" cy="28" r="2.4" fill="#059669" />
        </Frame>
      )
    case 'correlation-matrix':
      return (
        <Frame label="Correlation matrix" size={size}>
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={16 + col * 14}
                y={16 + row * 14}
                width="12"
                height="12"
                rx="2"
                fill={row === col ? '#1d4ed8' : row + col === 2 ? '#fecaca' : '#93c5fd'}
              />
            )),
          )}
        </Frame>
      )
    case 'partial-correlation':
      return (
        <Frame label="Partial correlation" size={size}>
          <circle cx="22" cy="48" r="8" fill="#dbeafe" stroke="#2563eb" />
          <circle cx="50" cy="48" r="8" fill="#dbeafe" stroke="#2563eb" />
          <circle cx="36" cy="22" r="8" fill="#fef3c7" stroke="#d97706" />
          <path d="M28 44 L32 28 M44 44 L40 28 M30 48 H42" stroke="#94a3b8" />
        </Frame>
      )
    case 'correlation-vs-causation':
      return (
        <Frame label="Correlation vs causation" size={size}>
          <path d="M18 50 L36 22 L54 50 Z" fill="none" stroke="#2563eb" strokeWidth="2" />
          <circle cx="36" cy="22" r="4" fill="#f59e0b" />
          <circle cx="18" cy="50" r="4" fill="#2563eb" />
          <circle cx="54" cy="50" r="4" fill="#2563eb" />
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
      </svg>
    )
  }
  if (name === 'visual') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="3" fill="#e0e7ff" />
        <path d="M6 15l4-4 3 2 5-6" stroke="#2563eb" strokeWidth="1.8" fill="none" />
      </svg>
    )
  }
  if (name === 'world') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" fill="#dbeafe" stroke="#2563eb" />
        <path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" stroke="#3b82f6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" fill="#dcfce7" />
      <path d="M8 12l2.5 2.5L16 9" stroke="#16a34a" strokeWidth="1.8" />
    </svg>
  )
}

export function ConceptIcon({ name }: { name: 'plus' | 'minus' | 'none' | 'rank' | 'pair' | 'matrix' | 'control' | 'cause' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'plus') {
    return (
      <svg {...common}>
        <path d="M5 17 L19 7" stroke="#059669" strokeWidth="2" />
        <circle cx="8" cy="15" r="2" fill="#059669" />
        <circle cx="16" cy="9" r="2" fill="#059669" />
      </svg>
    )
  }
  if (name === 'minus') {
    return (
      <svg {...common}>
        <path d="M5 7 L19 17" stroke="#dc2626" strokeWidth="2" />
        <circle cx="8" cy="9" r="2" fill="#dc2626" />
        <circle cx="16" cy="15" r="2" fill="#dc2626" />
      </svg>
    )
  }
  if (name === 'none') {
    return (
      <svg {...common}>
        <circle cx="8" cy="9" r="2" fill="#64748b" />
        <circle cx="16" cy="8" r="2" fill="#64748b" />
        <circle cx="10" cy="16" r="2" fill="#64748b" />
        <circle cx="17" cy="15" r="2" fill="#64748b" />
      </svg>
    )
  }
  if (name === 'rank') {
    return (
      <svg {...common}>
        <path d="M6 16 H10 V12 H14 V8 H18" stroke="#2563eb" strokeWidth="2" />
      </svg>
    )
  }
  if (name === 'pair') {
    return (
      <svg {...common}>
        <circle cx="7" cy="16" r="2.2" fill="#2563eb" />
        <circle cx="17" cy="8" r="2.2" fill="#059669" />
        <path d="M8 15 L16 9" stroke="#94a3b8" />
      </svg>
    )
  }
  if (name === 'matrix') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" fill="#2563eb" />
        <rect x="12" y="4" width="8" height="6" fill="#93c5fd" />
        <rect x="4" y="12" width="6" height="8" fill="#93c5fd" />
        <rect x="12" y="12" width="8" height="8" fill="#fecaca" />
      </svg>
    )
  }
  if (name === 'control') {
    return (
      <svg {...common}>
        <circle cx="7" cy="17" r="3" fill="#dbeafe" stroke="#2563eb" />
        <circle cx="17" cy="17" r="3" fill="#dbeafe" stroke="#2563eb" />
        <circle cx="12" cy="7" r="3" fill="#fde68a" stroke="#d97706" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M6 18 L12 6 L18 18" fill="none" stroke="#2563eb" strokeWidth="1.8" />
      <circle cx="12" cy="6" r="2" fill="#f59e0b" />
    </svg>
  )
}

export function CorrelationHeroArt({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative mx-auto w-full max-w-[420px] ${active ? '-translate-y-0.5' : ''}`} aria-hidden>
      <div className="corr-card grid place-items-center p-4">
        <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Scatter plot with a fitted line">
          <rect x="18" y="14" width="284" height="152" rx="16" fill="#f8fafc" />
          <path d="M40 150 H292 M40 28 V150" fill="none" stroke="#e2e8f0" />
          <path d="M52 132 L280 46" stroke="#2563eb" strokeWidth="3" />
          {[
            [68, 124],
            [92, 118],
            [110, 102],
            [128, 108],
            [148, 90],
            [168, 86],
            [186, 74],
            [206, 70],
            [228, 58],
            [248, 62],
            [266, 50],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#2563eb" />
          ))}
        </svg>
        <p className="corr-note absolute -right-1 bottom-2 w-40 text-right">
          Look at the cloud.
          <br />
          Then name the number.
        </p>
      </div>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <LabIcon id={slug} size={72} />
      <p className="corr-note w-32 text-right">
        {slug === 'correlation-vs-causation' ? 'A clue, not a verdict.' : 'Association first.'}
      </p>
    </div>
  )
}
