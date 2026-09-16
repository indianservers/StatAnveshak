import type { ReactNode } from 'react'

function Frame({ children, label, size = 72 }: { children: ReactNode; label: string; size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} role="img" aria-label={label}>
      {children}
    </svg>
  )
}

export function LabIcon({ id, size = 72 }: { id: string; size?: number }) {
  switch (id) {
    case 'measures-of-center':
      return (
        <Frame label="Measures of center" size={size}>
          <rect x="12" y="42" width="8" height="16" rx="2" fill="#93c5fd" />
          <rect x="22" y="30" width="8" height="28" rx="2" fill="#60a5fa" />
          <rect x="32" y="18" width="8" height="40" rx="2" fill="#2563eb" />
          <rect x="42" y="26" width="8" height="32" rx="2" fill="#60a5fa" />
          <rect x="52" y="38" width="8" height="20" rx="2" fill="#93c5fd" />
          <line x1="36" y1="12" x2="36" y2="58" stroke="#f59e0b" strokeWidth="2" />
        </Frame>
      )
    case 'measures-of-spread':
      return (
        <Frame label="Measures of spread" size={size}>
          <text x="22" y="42" fontSize="22" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
            σ
          </text>
          <path d="M10 36 H20" stroke="#2563eb" strokeWidth="2.2" />
          <path d="M52 36 H62" stroke="#2563eb" strokeWidth="2.2" />
          <path d="M16 32 L10 36 L16 40" fill="none" stroke="#2563eb" strokeWidth="2" />
          <path d="M56 32 L62 36 L56 40" fill="none" stroke="#2563eb" strokeWidth="2" />
        </Frame>
      )
    case 'position-measures':
      return (
        <Frame label="Position measures" size={size}>
          <line x1="10" y1="48" x2="62" y2="48" stroke="#cbd5e1" strokeWidth="3" />
          {[18, 36, 54].map((x, i) => (
            <g key={x}>
              <line x1={x} y1="24" x2={x} y2="48" stroke={i === 1 ? '#059669' : '#2563eb'} strokeWidth="2" />
              <circle cx={x} cy="22" r="4" fill={i === 1 ? '#059669' : '#2563eb'} />
            </g>
          ))}
        </Frame>
      )
    case 'five-number-summary':
      return (
        <Frame label="Five-number summary" size={size}>
          <line x1="10" y1="36" x2="62" y2="36" stroke="#94a3b8" />
          <rect x="22" y="24" width="28" height="24" rx="4" fill="#dbeafe" stroke="#2563eb" />
          <line x1="36" y1="24" x2="36" y2="48" stroke="#1d4ed8" strokeWidth="2" />
        </Frame>
      )
    case 'data-visualization-basics':
      return (
        <Frame label="Data visualization" size={size}>
          <rect x="12" y="36" width="10" height="18" rx="2" fill="#60a5fa" />
          <rect x="26" y="24" width="10" height="30" rx="2" fill="#2563eb" />
          <rect x="40" y="30" width="10" height="24" rx="2" fill="#38bdf8" />
          <circle cx="58" cy="28" r="8" fill="#fbbf24" />
        </Frame>
      )
    case 'distribution-shape':
      return (
        <Frame label="Distribution shape" size={size}>
          <path d="M8 50 C16 50 18 28 26 22 C32 16 36 34 40 38 C48 50 52 18 64 18" fill="none" stroke="#2563eb" strokeWidth="2.4" />
          <path d="M8 54 C18 54 22 40 30 40 C40 40 44 54 64 54" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
        </Frame>
      )
    case 'box-plot-outliers':
      return (
        <Frame label="Box plot and outliers" size={size}>
          <line x1="12" y1="36" x2="58" y2="36" stroke="#94a3b8" />
          <rect x="22" y="24" width="26" height="24" rx="4" fill="#dbeafe" stroke="#2563eb" />
          <circle cx="60" cy="20" r="4" fill="#ef4444" />
        </Frame>
      )
    case 'frequency-tables':
      return (
        <Frame label="Frequency tables" size={size}>
          <rect x="14" y="16" width="44" height="40" rx="6" fill="#fff" stroke="#93c5fd" />
          <path d="M14 28 H58 M28 16 V56" stroke="#93c5fd" />
          <text x="32" y="48" fontSize="10" fill="#2563eb" fontWeight="700">
            ||||
          </text>
        </Frame>
      )
    case 'ecdf-stem-and-leaf':
      return (
        <Frame label="ECDF and stem-and-leaf" size={size}>
          <path d="M12 52 H24 V40 H36 V28 H48 V16 H60" fill="none" stroke="#2563eb" strokeWidth="2.4" />
          <text x="14" y="66" fontSize="9" fill="#64748b">
            4 | 2 5
          </text>
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

export function FeatureIcon({ name }: { name: 'labs' | 'visual' | 'data' | 'skills' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'labs') {
    return (
      <svg {...common}>
        <rect x="8" y="4" width="8" height="6" rx="1" fill="#dbeafe" />
        <path d="M9 10h6l3 8H6l3-8z" fill="#2563eb" />
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
  if (name === 'data') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" fill="#dbeafe" />
        <path d="M8 9h8M8 12h8M8 15h5" stroke="#2563eb" strokeWidth="1.6" />
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

export function DescriptiveStatsHeroArt({ active = false }: { active?: boolean }) {
  const cells = [
    { id: 'measures-of-center', note: '' },
    { id: 'measures-of-spread', note: '' },
    { id: 'position-measures', note: '' },
    { id: 'five-number-summary', note: '' },
    { id: 'data-visualization-basics', note: '' },
    { id: 'distribution-shape', note: '' },
    { id: 'box-plot-outliers', note: '' },
    { id: 'frequency-tables', note: '' },
    { id: 'ecdf-stem-and-leaf', note: '' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`grid h-[92px] place-items-center rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 shadow-sm ${active ? 'translate-y-[-2px]' : ''}`}
          >
            <LabIcon id={cell.id} size={58} />
          </div>
        ))}
      </div>
      <p className="ds-note absolute -right-2 bottom-[-8px] w-36 text-right">
        Summarize first.
        <br />
        Infer later.
      </p>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  if (slug === 'distribution-shape') {
    return (
      <div className="hidden items-end gap-3 lg:flex">
        {[
          { d: 'M4 36 C12 36 14 18 22 12 C28 8 32 28 40 28', color: '#f59e0b', label: 'Left-skewed' },
          { d: 'M4 36 C12 36 16 10 22 10 C28 10 32 36 40 36', color: '#2563eb', label: 'Symmetric' },
          { d: 'M4 36 C14 36 16 28 22 12 C30 8 34 36 40 36', color: '#22c55e', label: 'Right-skewed' },
        ].map((curve) => (
          <div key={curve.label} className="text-center">
            <svg viewBox="0 0 44 44" width="72" height="56" aria-hidden>
              <path d={curve.d} fill="none" stroke={curve.color} strokeWidth="2.2" />
            </svg>
            <p className="text-[10px] font-semibold text-slate-400">{curve.label}</p>
          </div>
        ))}
      </div>
    )
  }
  if (slug === 'frequency-tables') {
    return (
      <div className="hidden items-center gap-3 lg:flex">
        <LabIcon id={slug} size={72} />
        <p className="ds-note w-32 text-right">From data to understanding.</p>
      </div>
    )
  }
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <LabIcon id={slug} size={72} />
      <p className="ds-note w-32 text-right">See the story in the spread.</p>
    </div>
  )
}
