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
    case 'simple-linear-regression':
      return (
        <Frame label="Simple linear regression" size={size}>
          <path d="M14 56 H58 M14 16 V56" fill="none" stroke="#cbd5e1" />
          <path d="M18 48 L56 22" stroke="#2563eb" strokeWidth="2.2" />
          <circle cx="24" cy="44" r="3" fill="#2563eb" />
          <circle cx="36" cy="36" r="3" fill="#3b82f6" />
          <circle cx="50" cy="26" r="3" fill="#1d4ed8" />
        </Frame>
      )
    case 'least-squares':
      return (
        <Frame label="Least squares" size={size}>
          <path d="M16 50 L56 24" stroke="#2563eb" strokeWidth="2" />
          <rect x="28" y="28" width="10" height="10" fill="#93c5fd" opacity="0.85" />
          <rect x="44" y="20" width="8" height="8" fill="#bfdbfe" />
          <circle cx="30" cy="44" r="2.6" fill="#0f172a" />
          <circle cx="48" cy="32" r="2.6" fill="#0f172a" />
        </Frame>
      )
    case 'prediction':
      return (
        <Frame label="Prediction" size={size}>
          <path d="M14 56 H58 M14 18 V56" fill="none" stroke="#e2e8f0" />
          <path d="M18 48 L56 22" stroke="#2563eb" strokeWidth="2" />
          <path d="M44 20 V48" stroke="#7c3aed" strokeDasharray="3 3" />
          <circle cx="44" cy="30" r="4" fill="#fff" stroke="#7c3aed" strokeWidth="2" />
        </Frame>
      )
    case 'residual-analysis':
      return (
        <Frame label="Residual analysis" size={size}>
          <path d="M16 36 H56" stroke="#94a3b8" />
          <circle cx="24" cy="28" r="3" fill="#2563eb" />
          <circle cx="36" cy="42" r="3" fill="#2563eb" />
          <circle cx="50" cy="24" r="3" fill="#2563eb" />
          <path d="M24 31 V36 M36 39 V36 M50 27 V36" stroke="#0f172a" />
        </Frame>
      )
    case 'goodness-of-fit':
      return (
        <Frame label="Goodness of fit" size={size}>
          <rect x="16" y="18" width="14" height="36" rx="3" fill="#2563eb" />
          <rect x="34" y="30" width="14" height="24" rx="3" fill="#93c5fd" />
          <text x="18" y="64" fontSize="8" fontWeight="700" fill="#64748b">
            SST
          </text>
        </Frame>
      )
    case 'confidence-prediction-intervals':
      return (
        <Frame label="Confidence and prediction intervals" size={size}>
          <path d="M16 50 C28 40 44 24 58 18" fill="none" stroke="#2563eb" strokeWidth="2" />
          <path d="M16 44 C28 34 44 18 58 12 L58 24 C44 30 28 46 16 56 Z" fill="#dbeafe" />
          <path d="M16 40 C28 30 44 14 58 8" fill="none" stroke="#7c3aed" strokeDasharray="3 2" />
        </Frame>
      )
    case 'multiple-regression':
      return (
        <Frame label="Multiple regression" size={size}>
          <path d="M18 52 L36 20 L56 46 Z" fill="#dbeafe" stroke="#2563eb" />
          <circle cx="28" cy="40" r="2.4" fill="#0f172a" />
          <circle cx="40" cy="32" r="2.4" fill="#0f172a" />
          <circle cx="46" cy="42" r="2.4" fill="#0f172a" />
        </Frame>
      )
    case 'polynomial-regression':
      return (
        <Frame label="Polynomial regression" size={size}>
          <path d="M14 50 C24 50 28 20 36 20 C44 20 48 50 58 50" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <path d="M14 42 L58 30" stroke="#94a3b8" strokeDasharray="3 3" />
        </Frame>
      )
    case 'categorical-predictors':
      return (
        <Frame label="Categorical predictors" size={size}>
          <path d="M16 50 L56 28" stroke="#2563eb" />
          <path d="M16 42 L56 20" stroke="#7c3aed" />
          <circle cx="24" cy="46" r="3" fill="#2563eb" />
          <rect x="44" y="22" width="7" height="7" fill="#fff" stroke="#7c3aed" strokeWidth="1.6" />
        </Frame>
      )
    case 'interaction-effects':
      return (
        <Frame label="Interaction effects" size={size}>
          <path d="M16 50 L56 38" stroke="#2563eb" />
          <path d="M16 46 L56 16" stroke="#7c3aed" />
          <circle cx="22" cy="48" r="2.6" fill="#2563eb" />
          <rect x="48" y="18" width="6.5" height="6.5" fill="#fff" stroke="#7c3aed" />
        </Frame>
      )
    case 'logistic-regression-basics':
      return (
        <Frame label="Logistic regression basics" size={size}>
          <path d="M14 52 C26 52 28 16 58 16" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <path d="M14 34 H58" stroke="#94a3b8" strokeDasharray="3 2" />
          <circle cx="22" cy="50" r="2.4" fill="#fff" stroke="#0f172a" />
          <circle cx="50" cy="18" r="2.8" fill="#0f172a" />
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

export function RegressionHeroArt({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative mx-auto w-full max-w-[420px] ${active ? '-translate-y-0.5' : ''}`}>
      <div className="reg-card grid place-items-center p-4">
        <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Scatter plot with a fitted regression line">
          <rect x="18" y="14" width="284" height="152" rx="16" fill="#f8fafc" />
          <path d="M40 150 H292 M40 28 V150" fill="none" stroke="#e2e8f0" />
          <path d="M52 128 L280 42" stroke="#2563eb" strokeWidth="3" />
          {[
            [68, 122],
            [92, 116],
            [112, 104],
            [132, 108],
            [154, 88],
            [176, 84],
            [198, 70],
            [220, 66],
            [242, 54],
            [262, 58],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#2563eb" />
          ))}
        </svg>
      </div>
    </div>
  )
}
