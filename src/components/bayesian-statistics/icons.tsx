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
    case 'bayesian-foundations':
      return (
        <Frame label="Bayesian foundations" size={size}>
          <path d="M10 50 C18 50 18 28 28 28 C36 28 36 42 44 42 C54 42 54 22 64 22" fill="none" stroke="#2563eb" strokeDasharray="4 3" strokeWidth="2.2" />
          <path d="M10 44 C22 44 26 18 40 18 C52 18 54 36 64 36" fill="none" stroke="#059669" strokeDasharray="1.5 3" strokeWidth="2.2" />
          <path d="M10 52 C20 52 28 16 42 16 C54 16 56 48 64 48" fill="none" stroke="#dc2626" strokeWidth="2.4" />
        </Frame>
      )
    case 'beta-binomial':
      return (
        <Frame label="Beta-Binomial" size={size}>
          <circle cx="18" cy="28" r="4" fill="#2563eb" />
          <circle cx="30" cy="22" r="4" fill="#2563eb" />
          <circle cx="42" cy="26" r="4" fill="#94a3b8" />
          <circle cx="54" cy="30" r="4" fill="#2563eb" />
          <path d="M12 52 C24 52 28 40 36 40 C46 40 50 54 62 54" fill="none" stroke="#dc2626" strokeWidth="2.4" />
        </Frame>
      )
    case 'gamma-poisson':
      return (
        <Frame label="Gamma-Poisson" size={size}>
          {[12, 22, 32, 42, 52, 62].map((x, i) => (
            <rect key={x} x={x - 4} y={48 - [10, 22, 28, 18, 12, 8][i]} width="8" height={[10, 22, 28, 18, 12, 8][i]} rx="2" fill="#93c5fd" />
          ))}
        </Frame>
      )
    case 'normal-normal':
      return (
        <Frame label="Normal-Normal" size={size}>
          <path d="M8 50 C18 50 22 28 36 28 C50 28 54 50 64 50" fill="none" stroke="#2563eb" strokeDasharray="4 3" strokeWidth="2" />
          <path d="M8 46 C20 46 24 18 36 18 C48 18 52 46 64 46" fill="none" stroke="#059669" strokeDasharray="1.5 3" strokeWidth="2" />
          <path d="M8 52 C20 52 26 22 36 22 C46 22 52 52 64 52" fill="none" stroke="#dc2626" strokeWidth="2.4" />
        </Frame>
      )
    case 'conjugate-priors':
      return (
        <Frame label="Conjugate priors" size={size}>
          <rect x="12" y="16" width="48" height="40" rx="8" fill="#eef4ff" stroke="#c7d7fb" />
          <path d="M20 28 H52 M20 38 H52 M20 48 H40" stroke="#2563eb" strokeWidth="2" />
        </Frame>
      )
    case 'map-vs-mle':
      return (
        <Frame label="MAP versus MLE" size={size}>
          <ellipse cx="36" cy="36" rx="22" ry="16" fill="none" stroke="#93c5fd" strokeWidth="2" />
          <ellipse cx="36" cy="36" rx="12" ry="8" fill="none" stroke="#60a5fa" strokeWidth="2" />
          <circle cx="28" cy="36" r="3.4" fill="#2563eb" />
          <circle cx="48" cy="32" r="3.4" fill="#dc2626" />
        </Frame>
      )
    case 'credible-intervals':
      return (
        <Frame label="Credible intervals" size={size}>
          <path d="M8 50 C18 50 24 18 36 18 C48 18 54 50 64 50" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <rect x="24" y="18" width="24" height="32" fill="#93c5fd" opacity="0.55" />
        </Frame>
      )
    case 'bayesian-prediction':
      return (
        <Frame label="Bayesian prediction" size={size}>
          <path d="M8 48 C20 48 24 30 36 30 C48 30 52 48 64 48" fill="none" stroke="#94a3b8" strokeWidth="2" />
          <path d="M8 50 C18 50 22 22 36 22 C50 22 54 50 64 50" fill="none" stroke="#7c3aed" strokeWidth="2.3" />
        </Frame>
      )
    case 'bayesian-vs-frequentist':
      return (
        <Frame label="Bayesian versus frequentist" size={size}>
          <path d="M8 48 C20 48 24 20 34 20 C44 20 46 48 58 48" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <path d="M14 50 C24 50 30 24 42 24 C54 24 58 50 66 50" fill="none" stroke="#dc2626" strokeDasharray="4 3" strokeWidth="2.2" />
        </Frame>
      )
    case 'mcmc-intuition':
      return (
        <Frame label="MCMC intuition" size={size}>
          <path d="M8 40 L16 28 L24 44 L32 22 L40 38 L48 18 L56 34 L64 26" fill="none" stroke="#2563eb" strokeWidth="2.2" />
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
        <path d="M8 3h8M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" stroke="#2563eb" strokeWidth="1.8" />
      </svg>
    )
  }
  if (name === 'visual') {
    return (
      <svg {...common}>
        <path d="M4 16c3-6 6-9 8-9s5 3 8 9" stroke="#2563eb" strokeWidth="1.8" />
        <circle cx="12" cy="16" r="2" fill="#2563eb" />
      </svg>
    )
  }
  if (name === 'world') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.8" />
        <path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" stroke="#2563eb" strokeWidth="1.6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M7 12h10M12 7v10" stroke="#2563eb" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.8" />
    </svg>
  )
}

export function BayesianHeroArt({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 420 220" className="h-auto w-full" role="img" aria-label="Bayes theorem with prior, likelihood, and posterior">
      <text x="210" y="28" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
        P(θ | D) = P(D | θ) P(θ) / P(D)
      </text>
      <text x="78" y="48" fontSize="10" fill="#2563eb">
        Prior P(θ)
      </text>
      <text x="196" y="48" fontSize="10" fill="#059669">
        Likelihood P(D | θ)
      </text>
      <text x="318" y="48" fontSize="10" fill="#dc2626">
        Posterior P(θ | D)
      </text>
      <path d="M20 180 C70 180 90 150 140 150 C190 150 200 176 260 176 C320 176 340 168 400 168" fill="none" stroke="#2563eb" strokeDasharray="7 5" strokeWidth={active ? 2.8 : 2.2} />
      <path d="M20 170 C80 170 110 70 180 70 C250 70 280 150 400 150" fill="none" stroke="#059669" strokeDasharray="2 4" strokeWidth={active ? 2.8 : 2.2} />
      <path d="M20 186 C90 186 130 78 210 78 C290 78 320 176 400 176" fill="none" stroke="#dc2626" strokeWidth={active ? 3.1 : 2.6} />
      <line x1="20" y1="190" x2="400" y2="190" stroke="#94a3b8" />
      <text x="210" y="210" textAnchor="middle" fontSize="11" fill="#64748b">
        θ
      </text>
    </svg>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  return <LabIcon id={slug} size={88} />
}
