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
    case 'one-way-anova':
      return (
        <Frame label="One-way ANOVA" size={size}>
          <rect x="14" y="28" width="10" height="22" rx="2" fill="#93c5fd" />
          <rect x="31" y="20" width="10" height="30" rx="2" fill="#c4b5fd" />
          <rect x="48" y="16" width="10" height="34" rx="2" fill="#86efac" />
          <path d="M18 36 H20 M35 32 H37 M52 28 H54" stroke="#0f172a" />
        </Frame>
      )
    case 'anova-table':
      return (
        <Frame label="ANOVA table" size={size}>
          <rect x="14" y="16" width="44" height="40" rx="4" fill="#eff6ff" stroke="#2563eb" />
          <path d="M14 28 H58 M28 16 V56" stroke="#93c5fd" />
          <text x="32" y="40" fontSize="10" fontWeight="800" fill="#1d4ed8">
            F
          </text>
        </Frame>
      )
    case 'post-hoc-comparisons':
      return (
        <Frame label="Post-hoc comparisons" size={size}>
          <path d="M18 22 H42 M18 36 H50 M18 50 H34" stroke="#2563eb" strokeWidth="3" />
          <circle cx="42" cy="22" r="3" fill="#2563eb" />
          <rect x="47" y="33" width="6" height="6" fill="#7c3aed" />
          <path d="M31 47 L37 53 L31 53 Z" fill="#16a34a" />
        </Frame>
      )
    case 'two-way-anova':
      return (
        <Frame label="Two-way ANOVA" size={size}>
          <path d="M16 50 L34 34 L56 22" stroke="#2563eb" strokeWidth="2" />
          <path d="M16 46 L34 40 L56 38" stroke="#16a34a" strokeWidth="2" />
          <circle cx="16" cy="50" r="3" fill="#2563eb" />
          <rect x="53" y="19" width="6" height="6" fill="#fff" stroke="#2563eb" />
          <path d="M53 35 L59 41 L53 41 Z" fill="#16a34a" />
        </Frame>
      )
    case 'repeated-measures-anova':
      return (
        <Frame label="Repeated measures ANOVA" size={size}>
          <path d="M14 46 C24 40 34 30 58 22" fill="none" stroke="#2563eb" strokeWidth="2" />
          <path d="M14 52 C24 48 36 44 58 40" fill="none" stroke="#7c3aed" strokeWidth="2" />
          <path d="M14 56 C26 54 38 52 58 50" fill="none" stroke="#16a34a" strokeWidth="2" />
        </Frame>
      )
    case 'anova-assumptions':
      return (
        <Frame label="ANOVA assumptions" size={size}>
          <path d="M16 50 H56 M16 20 V50" fill="none" stroke="#cbd5e1" />
          <path d="M20 46 L52 18" stroke="#2563eb" />
          {[22, 30, 38, 46].map((x, i) => (
            <circle key={x} cx={x} cy={44 - i * 7} r="2.4" fill="#2563eb" />
          ))}
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

export function FeatureIcon({ name }: { name: 'labs' | 'world' | 'steps' | 'visual' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'labs') {
    return (
      <svg {...common}>
        <rect x="8" y="3" width="8" height="6" rx="1" fill="#dbeafe" />
        <path d="M9 9h6l3.2 9.5H5.8L9 9z" fill="#2563eb" />
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
  if (name === 'steps') {
    return (
      <svg {...common}>
        <rect x="4" y="14" width="5" height="6" rx="1" fill="#93c5fd" />
        <rect x="10" y="9" width="5" height="11" rx="1" fill="#60a5fa" />
        <rect x="16" y="4" width="5" height="16" rx="1" fill="#2563eb" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="#e0e7ff" />
      <path d="M6 15l4-4 3 2 5-6" stroke="#2563eb" strokeWidth="1.8" fill="none" />
    </svg>
  )
}

export function AppIcon({ name }: { name: 'education' | 'biology' | 'manufacturing' | 'marketing' | 'experiments' }) {
  const common = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  if (name === 'education') {
    return (
      <svg {...common}>
        <path d="M3 10 L12 6 L21 10 L12 14 Z" fill="#dbeafe" stroke="#2563eb" />
        <path d="M7 12v5c2 1.4 8 1.4 10 0v-5" stroke="#2563eb" />
      </svg>
    )
  }
  if (name === 'biology') {
    return (
      <svg {...common}>
        <path d="M7 20c4-8 6-8 10-16" stroke="#16a34a" strokeWidth="1.8" />
        <circle cx="9" cy="16" r="2" fill="#86efac" />
        <circle cx="15" cy="8" r="2.2" fill="#16a34a" />
      </svg>
    )
  }
  if (name === 'manufacturing') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" fill="#dbeafe" stroke="#2563eb" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M6.2 17.8l1.4-1.4M16.4 7.6l1.4-1.4" stroke="#2563eb" />
      </svg>
    )
  }
  if (name === 'marketing') {
    return (
      <svg {...common}>
        <path d="M4 14h4l6-6v12l-6-6H4z" fill="#dbeafe" stroke="#2563eb" />
        <path d="M16 9c2 1.4 2 4.6 0 6" stroke="#2563eb" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M8 4h8v4H8z" fill="#dbeafe" />
      <path d="M9 8h6l2 12H7L9 8z" fill="#2563eb" />
    </svg>
  )
}

export function AnovaHeroArt({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative mx-auto w-full max-w-[420px] ${active ? '-translate-y-0.5' : ''}`}>
      <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Three group box plots with an F statistic">
        <rect x="12" y="10" width="296" height="160" rx="16" fill="#f8fafc" />
        <path d="M36 150 H292 M36 24 V150" fill="none" stroke="#e2e8f0" />
        <rect x="58" y="86" width="36" height="36" rx="4" fill="#93c5fd" />
        <path d="M76 70 V86 M76 122 V138" stroke="#2563eb" />
        <rect x="138" y="70" width="36" height="40" rx="4" fill="#c4b5fd" />
        <path d="M156 52 V70 M156 110 V128" stroke="#7c3aed" />
        <rect x="218" y="48" width="36" height="46" rx="4" fill="#86efac" />
        <path d="M236 30 V48 M236 94 V118" stroke="#16a34a" />
        <circle cx="76" cy="100" r="3" fill="#1d4ed8" />
        <rect x="153" y="86" width="6" height="6" fill="#5b21b6" />
        <path d="M232 68 L240 78 L224 78 Z" fill="#166534" />
        <text x="58" y="164" fontSize="9" fill="#64748b">
          Group A
        </text>
        <text x="138" y="164" fontSize="9" fill="#64748b">
          Group B
        </text>
        <text x="218" y="164" fontSize="9" fill="#64748b">
          Group C
        </text>
        <text x="210" y="28" fontSize="10" fontWeight="700" fill="#1d4ed8">
          F(2, 57) = 4.26
        </text>
      </svg>
    </div>
  )
}

export function LabCardArt({ id }: { id: string }) {
  if (id === 'one-way-anova') {
    return (
      <svg viewBox="0 0 140 64" className="h-16 w-full" aria-hidden>
        <rect x="18" y="28" width="18" height="22" rx="2" fill="#93c5fd" />
        <rect x="58" y="18" width="18" height="32" rx="2" fill="#c4b5fd" />
        <rect x="98" y="12" width="18" height="38" rx="2" fill="#86efac" />
      </svg>
    )
  }
  if (id === 'anova-table') {
    return (
      <svg viewBox="0 0 140 64" className="h-16 w-full" aria-hidden>
        <rect x="10" y="10" width="120" height="44" rx="6" fill="#eff6ff" />
        <path d="M10 24 H130 M46 10 V54" stroke="#bfdbfe" />
        <text x="54" y="40" fontSize="10" fontWeight="700" fill="#1d4ed8">
          F = 4.26
        </text>
      </svg>
    )
  }
  if (id === 'post-hoc-comparisons') {
    return (
      <svg viewBox="0 0 140 64" className="h-16 w-full" aria-hidden>
        <path d="M20 18 H70" stroke="#2563eb" strokeWidth="3" />
        <path d="M36 32 H110" stroke="#7c3aed" strokeWidth="3" />
        <path d="M18 46 H58" stroke="#16a34a" strokeWidth="3" />
      </svg>
    )
  }
  if (id === 'two-way-anova') {
    return (
      <svg viewBox="0 0 140 64" className="h-16 w-full" aria-hidden>
        <rect x="18" y="30" width="12" height="22" fill="#2563eb" />
        <rect x="32" y="20" width="12" height="32" fill="#93c5fd" />
        <rect x="62" y="26" width="12" height="26" fill="#16a34a" />
        <rect x="76" y="16" width="12" height="36" fill="#86efac" />
      </svg>
    )
  }
  if (id === 'repeated-measures-anova') {
    return (
      <svg viewBox="0 0 140 64" className="h-16 w-full" aria-hidden>
        <path d="M16 44 L48 36 L80 28 L112 18" fill="none" stroke="#2563eb" />
        <path d="M16 50 L48 46 L80 40 L112 36" fill="none" stroke="#16a34a" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 140 64" className="h-16 w-full" aria-hidden>
      <path d="M18 48 L122 16" stroke="#2563eb" />
      <circle cx="36" cy="42" r="3" fill="#2563eb" />
      <circle cx="70" cy="30" r="3" fill="#2563eb" />
      <circle cx="104" cy="20" r="3" fill="#2563eb" />
    </svg>
  )
}
