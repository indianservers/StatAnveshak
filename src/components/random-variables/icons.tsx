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
    case 'discrete-random-variables':
      return (
        <Frame label="Discrete random variables" size={size}>
          <rect x="14" y="18" width="20" height="20" rx="5" fill="#fff" stroke="#93c5fd" strokeWidth="1.6" />
          <rect x="38" y="18" width="20" height="20" rx="5" fill="#fff" stroke="#93c5fd" strokeWidth="1.6" />
          <circle cx="20" cy="24" r="2" fill="#2563eb" />
          <circle cx="28" cy="32" r="2" fill="#2563eb" />
          <circle cx="44" cy="24" r="2" fill="#2563eb" />
          <circle cx="52" cy="24" r="2" fill="#2563eb" />
          <circle cx="44" cy="32" r="2" fill="#2563eb" />
          <circle cx="52" cy="32" r="2" fill="#2563eb" />
        </Frame>
      )
    case 'continuous-random-variables':
      return (
        <Frame label="Continuous density" size={size}>
          <path d="M10 50 C20 50 22 18 36 18 C50 18 52 50 62 50" fill="none" stroke="#2563eb" strokeWidth="3" />
          <path d="M10 50 C20 50 22 18 36 18 C50 18 52 50 62 50 V54 H10 Z" fill="#dbeafe" />
        </Frame>
      )
    case 'cdf-quantiles':
      return (
        <Frame label="CDF and quantiles" size={size}>
          <path d="M10 52 C22 52 28 46 36 28 C44 12 52 12 62 12" fill="none" stroke="#2563eb" strokeWidth="3" />
          <path d="M10 52 H36 V28" fill="none" stroke="#86efac" strokeWidth="1.6" strokeDasharray="3 3" />
          <circle cx="36" cy="28" r="3.5" fill="#2563eb" />
        </Frame>
      )
    case 'expectation-moments':
      return (
        <Frame label="Expectation" size={size}>
          <text x="6" y="46" fontSize="20" fontWeight="800" fill="#ef4444" fontFamily="Georgia, serif">
            E[X]
          </text>
        </Frame>
      )
    case 'variance-standard-deviation':
      return (
        <Frame label="Variance" size={size}>
          <text x="18" y="48" fontSize="28" fontWeight="800" fill="#f59e0b" fontFamily="Georgia, serif">
            σ²
          </text>
        </Frame>
      )
    case 'skewness-kurtosis':
      return (
        <Frame label="Skewness and kurtosis" size={size}>
          <path d="M8 50 C16 50 18 36 26 22 C32 12 38 34 44 42 C52 54 58 18 64 18" fill="none" stroke="#2563eb" strokeWidth="2.6" />
        </Frame>
      )
    case 'transformations':
      return (
        <Frame label="Transformations" size={size}>
          <circle cx="22" cy="28" r="10" fill="none" stroke="#38bdf8" strokeWidth="2.4" />
          <path d="M34 28 H46" stroke="#64748b" strokeWidth="2" markerEnd="url(#rv-arrow)" />
          <circle cx="56" cy="28" r="10" fill="none" stroke="#a78bfa" strokeWidth="2.4" />
          <text x="10" y="56" fontSize="11" fontWeight="700" fill="#334155">
            Y=g(X)
          </text>
        </Frame>
      )
    case 'joint-marginal-conditional':
      return (
        <Frame label="Joint distributions" size={size}>
          <circle cx="30" cy="36" r="16" fill="#60a5fa" opacity="0.85" />
          <circle cx="44" cy="36" r="16" fill="#a78bfa" opacity="0.7" />
        </Frame>
      )
    case 'covariance-correlation':
      return (
        <Frame label="Covariance and correlation" size={size}>
          <path d="M14 52 L58 16" stroke="#93c5fd" strokeWidth="2" />
          <circle cx="22" cy="46" r="2.4" fill="#2563eb" />
          <circle cx="30" cy="40" r="2.4" fill="#2563eb" />
          <circle cx="38" cy="32" r="2.4" fill="#2563eb" />
          <circle cx="46" cy="26" r="2.4" fill="#2563eb" />
          <circle cx="54" cy="20" r="2.4" fill="#2563eb" />
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

export function FeatureIcon({ name }: { name: 'labs' | 'visual' | 'sim' | 'world' }) {
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
  if (name === 'sim') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="#0ea5e9" strokeWidth="1.8" />
        <path d="M12 7v5l3 2" stroke="#0ea5e9" strokeWidth="1.6" />
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

export function RandomVariablesHeroArt({ active = false }: { active?: boolean }) {
  return (
    <div className="relative mx-auto h-[230px] w-full max-w-[460px]" aria-hidden>
      <svg viewBox="0 0 460 230" className="h-full w-full">
        <text x="118" y="28" fontSize="13" fill="#94a3b8">
          f(x)
        </text>
        <text x="188" y="36" fontSize="14" fill="#334155" fontStyle="italic">
          X ~ N(μ, σ²)
        </text>
        <path
          d={`M20 150 C70 150 90 40 140 40 C190 40 210 150 260 150`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.4"
          className={active ? 'origin-center animate-pulse' : ''}
        />
        <path d="M20 150 C70 150 90 40 140 40 C190 40 210 150 260 150 V158 H20 Z" fill="#dbeafe" opacity="0.85" />
        {[70, 100, 130, 160, 190].map((x, i) => (
          <rect key={x} x={x} y={118 - i * 6} width="10" height={32 + i * 6} rx="2" fill="#93c5fd" opacity="0.7" />
        ))}
        <line x1="20" y1="158" x2="270" y2="158" stroke="#94a3b8" strokeWidth="1.2" />
        <text x="268" y="170" fontSize="12" fill="#94a3b8">
          x
        </text>
        <line x1="300" y1="150" x2="440" y2="150" stroke="#94a3b8" />
        <line x1="370" y1="40" x2="370" y2="150" stroke="#94a3b8" />
        <text x="432" y="164" fontSize="12" fill="#64748b">
          X
        </text>
        <text x="376" y="36" fontSize="12" fill="#64748b">
          Y
        </text>
        {[
          [318, 118],
          [332, 96],
          [348, 108],
          [360, 84],
          [376, 72],
          [392, 90],
          [408, 66],
          [424, 78],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="#2563eb" />
        ))}
        <text x="318" y="36" fontSize="13" fill="#64748b">
          Cov(X, Y)
        </text>
        <text x="20" y="196" fontSize="16" fill="#334155">
          P(X ≤ x) = F(x)
        </text>
      </svg>
      <p className="rv-note absolute bottom-2 right-2 w-36 text-right">
        Randomness
        <br />
        reveals patterns.
      </p>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  if (slug === 'discrete-random-variables') {
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 180 110" width="180" height="110" aria-hidden>
          <g transform="translate(8,18)">
            <rect x="10" y="18" width="58" height="58" rx="12" fill="#1d4ed8" />
            <rect x="4" y="8" width="58" height="58" rx="12" fill="#2563eb" />
            <circle cx="18" cy="22" r="4" fill="#dbeafe" />
            <circle cx="48" cy="22" r="4" fill="#dbeafe" />
            <circle cx="33" cy="37" r="4" fill="#dbeafe" />
            <circle cx="18" cy="52" r="4" fill="#dbeafe" />
            <circle cx="48" cy="52" r="4" fill="#dbeafe" />
          </g>
          <g transform="translate(88,0)">
            <rect x="10" y="18" width="52" height="52" rx="12" fill="#1d4ed8" />
            <rect x="4" y="8" width="52" height="52" rx="12" fill="#3b82f6" />
            <circle cx="18" cy="20" r="3.5" fill="#dbeafe" />
            <circle cx="42" cy="20" r="3.5" fill="#dbeafe" />
            <circle cx="18" cy="46" r="3.5" fill="#dbeafe" />
            <circle cx="42" cy="46" r="3.5" fill="#dbeafe" />
          </g>
        </svg>
        <p className="rv-note w-32 text-right">Countable outcomes. Real insight.</p>
      </div>
    )
  }
  if (slug === 'continuous-random-variables') {
    return (
      <div className="text-right">
        <LabIcon id={slug} size={88} />
        <p className="rv-note mt-1">Continuous possibilities.</p>
      </div>
    )
  }
  if (slug === 'expectation-moments') {
    return (
      <div className="text-right">
        <p className="text-5xl font-black text-rose-500">E[X]</p>
        <p className="rv-note mt-2">Averages reveal insight.</p>
      </div>
    )
  }
  if (slug === 'variance-standard-deviation') {
    return (
      <div className="text-right">
        <p className="text-5xl font-black text-amber-500">σ²</p>
        <p className="rv-note mt-2">Same mean. Different spread.</p>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3">
      <LabIcon id={slug} size={72} />
      <p className="rv-note w-32 text-right">Small experiments. Big insights.</p>
    </div>
  )
}
