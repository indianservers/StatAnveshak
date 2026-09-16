import { useId, type ReactNode } from 'react'

function Frame({ children, label, size = 72 }: { children: ReactNode; label: string; size?: number }) {
  const washId = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} role="img" aria-label={label} className="shrink-0">
      <rect x="2" y="2" width="68" height="68" rx="18" fill={`url(#${washId})`} />
      <defs>
        <linearGradient id={washId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eef4ff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  )
}

const ICONS: Record<string, { label: string; art: ReactNode }> = {
  'point-estimation': {
    label: 'Point estimation',
    art: (
      <>
        <circle cx="22" cy="28" r="3" fill="#93c5fd" />
        <circle cx="30" cy="40" r="3" fill="#93c5fd" />
        <circle cx="18" cy="46" r="3" fill="#bfdbfe" />
        <circle cx="34" cy="22" r="3" fill="#bfdbfe" />
        <line x1="38" y1="36" x2="52" y2="36" stroke="#94a3b8" />
        <circle cx="52" cy="36" r="6" fill="#2563eb" />
        <path d="M58 22 C64 18 66 32 60 36" fill="none" stroke="#7c3aed" strokeWidth="2" />
      </>
    ),
  },
  'estimator-quality': {
    label: 'Estimator quality',
    art: (
      <>
        <path d="M12 50 C18 50 20 22 28 18 C34 15 36 40 40 42 C48 48 52 16 62 16" fill="none" stroke="#94a3b8" />
        <path d="M18 50 C24 50 26 28 32 26 C38 24 40 38 46 36 C52 34 54 22 60 22" fill="none" stroke="#2563eb" strokeWidth="2.2" />
        <line x1="36" y1="14" x2="36" y2="56" stroke="#f59e0b" strokeDasharray="3 3" />
      </>
    ),
  },
  'confidence-interval-mean': {
    label: 'CI for a mean',
    art: (
      <>
        <path d="M12 48 C22 48 24 16 36 16 C48 16 50 48 60 48" fill="#dbeafe" stroke="#2563eb" />
        <line x1="24" y1="40" x2="48" y2="40" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        <circle cx="36" cy="40" r="3.5" fill="#0f766e" />
      </>
    ),
  },
  'confidence-interval-proportion': {
    label: 'CI for a proportion',
    art: (
      <>
        {[0, 1, 2, 3, 4].flatMap((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <circle key={`${row}-${col}`} cx={16 + col * 10} cy={16 + row * 10} r="3.2" fill={row * 5 + col < 16 ? '#2563eb' : '#cbd5e1'} />
          )),
        )}
      </>
    ),
  },
  'confidence-interval-difference-of-means': {
    label: 'CI for difference of means',
    art: (
      <>
        <path d="M8 48 C16 48 16 22 24 22 C32 22 32 48 40 48" fill="#bfdbfe" />
        <path d="M32 48 C40 48 40 28 48 28 C56 28 56 48 64 48" fill="#ddd6fe" />
        <line x1="18" y1="18" x2="54" y2="18" stroke="#0f766e" strokeWidth="3" />
        <circle cx="36" cy="18" r="3.4" fill="#0f766e" />
      </>
    ),
  },
  'confidence-interval-difference-of-proportions': {
    label: 'CI for difference of proportions',
    art: (
      <>
        <circle cx="24" cy="30" r="12" fill="#dbeafe" stroke="#2563eb" />
        <circle cx="48" cy="30" r="12" fill="#ede9fe" stroke="#7c3aed" />
        <line x1="16" y1="54" x2="56" y2="54" stroke="#0f766e" strokeWidth="3" />
        <circle cx="36" cy="54" r="3.4" fill="#0f766e" />
      </>
    ),
  },
  'confidence-interval-variance': {
    label: 'CI for variance',
    art: (
      <>
        <path d="M14 52 C20 52 22 18 30 18 C40 18 36 52 62 52" fill="#fef3c7" stroke="#d97706" />
        <line x1="26" y1="44" x2="26" y2="20" stroke="#2563eb" />
        <line x1="46" y1="44" x2="46" y2="28" stroke="#2563eb" />
      </>
    ),
  },
  'margin-of-error': {
    label: 'Margin of error',
    art: (
      <>
        <line x1="12" y1="36" x2="60" y2="36" stroke="#cbd5e1" strokeWidth="3" />
        <line x1="22" y1="36" x2="50" y2="36" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="5" fill="#fff" stroke="#0f172a" strokeWidth="2" />
      </>
    ),
  },
  'sample-size-determination': {
    label: 'Sample size',
    art: (
      <>
        <rect x="14" y="40" width="10" height="16" rx="2" fill="#93c5fd" />
        <rect x="28" y="28" width="10" height="28" rx="2" fill="#60a5fa" />
        <rect x="42" y="16" width="10" height="40" rx="2" fill="#2563eb" />
        <text x="54" y="28" fontSize="12" fontWeight="800" fill="#0f766e">
          n
        </text>
      </>
    ),
  },
  'hypothesis-basics': {
    label: 'Hypothesis basics',
    art: (
      <>
        <path d="M18 20 H54 V52 H18 Z" fill="#eef2ff" stroke="#4f46e5" />
        <text x="24" y="38" fontSize="14" fontWeight="800" fill="#4f46e5">
          H
        </text>
        <text x="36" y="42" fontSize="10" fill="#e11d48">
          0
        </text>
        <path d="M40 22 L52 16 L52 28 Z" fill="#fb7185" />
      </>
    ),
  },
  'test-statistic-p-value': {
    label: 'Test statistic and p-value',
    art: (
      <>
        <path d="M10 50 C20 50 22 18 36 18 C50 18 52 50 62 50" fill="#ede9fe" stroke="#7c3aed" />
        <path d="M50 50 C54 40 58 28 62 22 L62 50 Z" fill="#e11d48" opacity="0.75" />
        <line x1="50" y1="16" x2="50" y2="50" stroke="#0f172a" strokeDasharray="3 3" />
      </>
    ),
  },
  'errors-and-power': {
    label: 'Errors and power',
    art: (
      <>
        <path d="M8 50 C18 50 18 22 28 22 C38 22 38 50 48 50" fill="#c4b5fd" opacity="0.8" />
        <path d="M28 50 C38 50 38 20 48 20 C58 20 58 50 66 50" fill="#fda4af" opacity="0.75" />
        <rect x="44" y="28" width="10" height="22" fill="#e11d48" opacity="0.55" />
      </>
    ),
  },
  'z-test': {
    label: 'Z-test',
    art: (
      <>
        <text x="20" y="46" fontSize="28" fontWeight="800" fill="#2563eb" fontFamily="Georgia, serif">
          z
        </text>
        <path d="M44 50 C50 50 52 22 60 22" fill="none" stroke="#7c3aed" strokeWidth="2" />
      </>
    ),
  },
  'one-sample-t-test': {
    label: 'One-sample t-test',
    art: (
      <>
        <text x="16" y="46" fontSize="28" fontWeight="800" fill="#7c3aed" fontFamily="Georgia, serif">
          t
        </text>
        <circle cx="50" cy="28" r="10" fill="#dbeafe" stroke="#2563eb" />
        <circle cx="50" cy="28" r="3" fill="#2563eb" />
      </>
    ),
  },
  'two-sample-t-test': {
    label: 'Two-sample t-test',
    art: (
      <>
        <circle cx="26" cy="30" r="11" fill="#dbeafe" stroke="#2563eb" />
        <circle cx="48" cy="34" r="11" fill="#ede9fe" stroke="#7c3aed" />
        <path d="M26 48 L48 48" stroke="#0f766e" strokeWidth="3" />
      </>
    ),
  },
  'paired-t-test': {
    label: 'Paired t-test',
    art: (
      <>
        {[16, 28, 40, 52].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="24" r="5" fill="#93c5fd" />
            <circle cx={x} cy="48" r="5" fill="#c4b5fd" />
            <line x1={x} y1="29" x2={x} y2="43" stroke="#64748b" />
            {i === 2 && <path d="M40 36 l4 -6" stroke="#e11d48" strokeWidth="2" />}
          </g>
        ))}
      </>
    ),
  },
  'proportion-tests': {
    label: 'Proportion tests',
    art: (
      <>
        <circle cx="36" cy="36" r="18" fill="#eff6ff" stroke="#2563eb" />
        <path d="M36 18 A18 18 0 0 1 52 42 L36 36 Z" fill="#2563eb" />
      </>
    ),
  },
  'chi-square-tests': {
    label: 'Chi-square tests',
    art: (
      <>
        <text x="16" y="46" fontSize="26" fontWeight="800" fill="#d97706">
          χ²
        </text>
        <rect x="48" y="20" width="8" height="8" fill="#fde68a" />
        <rect x="56" y="28" width="8" height="8" fill="#f59e0b" />
      </>
    ),
  },
  'f-test': {
    label: 'F-test',
    art: (
      <>
        <text x="18" y="46" fontSize="28" fontWeight="800" fill="#ea580c" fontFamily="Georgia, serif">
          F
        </text>
        <rect x="46" y="36" width="6" height="16" fill="#fdba74" />
        <rect x="54" y="24" width="6" height="28" fill="#ea580c" />
      </>
    ),
  },
  'effect-size': {
    label: 'Effect size',
    art: (
      <>
        <line x1="16" y1="36" x2="56" y2="36" stroke="#cbd5e1" />
        <circle cx="26" cy="36" r="7" fill="#93c5fd" />
        <circle cx="50" cy="36" r="11" fill="#2563eb" />
      </>
    ),
  },
  'multiple-testing': {
    label: 'Multiple testing',
    art: (
      <>
        {[16, 28, 40, 52].map((x, i) => (
          <circle key={x} cx={x} cy="36" r="7" fill={i === 2 ? '#e11d48' : '#c4b5fd'} />
        ))}
      </>
    ),
  },
  'sign-test': {
    label: 'Sign test',
    art: (
      <>
        <text x="14" y="44" fontSize="26" fontWeight="800" fill="#16a34a">
          +
        </text>
        <text x="40" y="44" fontSize="28" fontWeight="800" fill="#e11d48">
          −
        </text>
      </>
    ),
  },
  'wilcoxon-signed-rank': {
    label: 'Wilcoxon signed-rank',
    art: (
      <>
        <path d="M16 48 L28 20 L40 48" fill="none" stroke="#65a30d" strokeWidth="3" />
        <path d="M32 48 L44 26 L56 48" fill="none" stroke="#2563eb" strokeWidth="3" />
      </>
    ),
  },
  'mann-whitney-u': {
    label: 'Mann–Whitney U',
    art: (
      <>
        <text x="18" y="48" fontSize="30" fontWeight="800" fill="#65a30d" fontFamily="Georgia, serif">
          U
        </text>
        <circle cx="52" cy="24" r="5" fill="#86efac" />
        <circle cx="58" cy="38" r="5" fill="#2563eb" />
      </>
    ),
  },
  'kruskal-wallis': {
    label: 'Kruskal–Wallis',
    art: (
      <>
        <rect x="14" y="30" width="12" height="24" rx="3" fill="#86efac" />
        <rect x="30" y="18" width="12" height="36" rx="3" fill="#65a30d" />
        <rect x="46" y="26" width="12" height="28" rx="3" fill="#166534" />
      </>
    ),
  },
  'permutation-test': {
    label: 'Permutation test',
    art: (
      <>
        <rect x="14" y="20" width="18" height="14" rx="4" fill="#86efac" />
        <rect x="40" y="20" width="18" height="14" rx="4" fill="#93c5fd" />
        <rect x="14" y="40" width="18" height="14" rx="4" fill="#93c5fd" />
        <rect x="40" y="40" width="18" height="14" rx="4" fill="#86efac" />
        <path d="M32 27 H40 M32 47 H40" stroke="#0f172a" />
      </>
    ),
  },
  'bootstrap-test': {
    label: 'Bootstrap test',
    art: (
      <>
        <rect x="16" y="18" width="40" height="12" rx="3" fill="#dbeafe" />
        <rect x="20" y="34" width="14" height="10" rx="2" fill="#93c5fd" />
        <rect x="38" y="34" width="14" height="10" rx="2" fill="#60a5fa" />
        <rect x="28" y="48" width="16" height="8" rx="2" fill="#2563eb" />
      </>
    ),
  },
  'rank-based-methods': {
    label: 'Rank-based methods',
    art: (
      <>
        {[18, 32, 46, 56].map((y, i) => (
          <g key={y}>
            <text x="14" y={y} fontSize="10" fontWeight="800" fill="#65a30d">
              {i + 1}
            </text>
            <rect x="28" y={y - 8} width={18 + i * 6} height="8" rx="2" fill={i === 0 ? '#2563eb' : '#93c5fd'} />
          </g>
        ))}
      </>
    ),
  },
  'survival-function': {
    label: 'Survival function',
    art: (
      <>
        <path d="M14 18 H30 V30 H42 V44 H54 V56 H14 Z" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2" />
      </>
    ),
  },
  'hazard-function': {
    label: 'Hazard function',
    art: (
      <>
        <path d="M14 52 C22 50 24 18 36 16 C48 14 50 36 60 20" fill="none" stroke="#e11d48" strokeWidth="2.4" />
        <circle cx="36" cy="16" r="3.2" fill="#e11d48" />
      </>
    ),
  },
  censoring: {
    label: 'Censoring',
    art: (
      <>
        <path d="M14 40 H40" stroke="#2563eb" strokeWidth="3" />
        <circle cx="40" cy="40" r="4" fill="#fff" stroke="#2563eb" strokeWidth="2" />
        <path d="M48 40 H62" stroke="#94a3b8" strokeDasharray="4 3" strokeWidth="3" />
      </>
    ),
  },
  'kaplan-meier': {
    label: 'Kaplan–Meier',
    art: (
      <>
        <path d="M12 16 H26 V28 H38 V40 H50 V54" fill="none" stroke="#e11d48" strokeWidth="2.6" />
        <circle cx="26" cy="16" r="2.6" fill="#e11d48" />
        <circle cx="38" cy="28" r="2.6" fill="#e11d48" />
        <circle cx="50" cy="40" r="2.6" fill="#e11d48" />
      </>
    ),
  },
  'median-survival': {
    label: 'Median survival',
    art: (
      <>
        <path d="M12 18 H32 V36 H52 V56" fill="none" stroke="#e11d48" strokeWidth="2.4" />
        <line x1="12" y1="36" x2="52" y2="36" stroke="#0f766e" strokeDasharray="3 3" />
        <circle cx="32" cy="36" r="4" fill="#0f766e" />
      </>
    ),
  },
  'reliability-function': {
    label: 'Reliability function',
    art: (
      <>
        <circle cx="36" cy="36" r="16" fill="#fff1f2" stroke="#e11d48" />
        <path d="M28 36 l6 6 12 -14" fill="none" stroke="#16a34a" strokeWidth="3" />
      </>
    ),
  },
  'mean-time-to-failure': {
    label: 'Mean time to failure',
    art: (
      <>
        <path d="M12 20 C24 20 28 52 60 52 L12 52 Z" fill="#fecdd3" />
        <path d="M12 20 C24 20 28 52 60 52" fill="none" stroke="#e11d48" strokeWidth="2" />
      </>
    ),
  },
  'hazard-comparison': {
    label: 'Hazard comparison',
    art: (
      <>
        <path d="M12 20 H28 V36 H48 V54" fill="none" stroke="#fb7185" strokeWidth="2.2" />
        <path d="M12 28 H36 V50 H58" fill="none" stroke="#2563eb" strokeWidth="2.2" />
      </>
    ),
  },
  'weibull-reliability': {
    label: 'Weibull reliability',
    art: (
      <>
        <path d="M12 52 C20 52 22 48 30 20 C38 8 44 40 60 16" fill="none" stroke="#be123c" strokeWidth="2.4" />
      </>
    ),
  },
  'mean-vector-covariance-matrix': {
    label: 'Mean vector and covariance',
    art: (
      <>
        <rect x="14" y="16" width="18" height="40" rx="4" fill="#ede9fe" stroke="#7c3aed" />
        <rect x="40" y="16" width="20" height="20" rx="3" fill="#ddd6fe" />
        <rect x="40" y="38" width="20" height="18" rx="3" fill="#c4b5fd" />
      </>
    ),
  },
  'correlation-matrix': {
    label: 'Correlation matrix',
    art: (
      <>
        {[0, 1, 2, 3].flatMap((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={16 + c * 10}
              y={16 + r * 10}
              width="9"
              height="9"
              rx="2"
              fill={r === c ? '#4f46e5' : r < c ? '#a5b4fc' : '#c7d2fe'}
            />
          )),
        )}
      </>
    ),
  },
  'bivariate-normal': {
    label: 'Bivariate normal',
    art: (
      <>
        <ellipse cx="36" cy="36" rx="22" ry="14" transform="rotate(-28 36 36)" fill="#ede9fe" stroke="#7c3aed" />
        <ellipse cx="36" cy="36" rx="12" ry="7" transform="rotate(-28 36 36)" fill="#c4b5fd" />
      </>
    ),
  },
  'mahalanobis-distance': {
    label: 'Mahalanobis distance',
    art: (
      <>
        <ellipse cx="34" cy="36" rx="20" ry="12" fill="#eef2ff" stroke="#6366f1" />
        <circle cx="34" cy="36" r="3" fill="#4f46e5" />
        <circle cx="56" cy="18" r="4" fill="#e11d48" />
        <line x1="36" y1="34" x2="54" y2="20" stroke="#e11d48" />
      </>
    ),
  },
  'confidence-ellipse': {
    label: 'Confidence ellipse',
    art: (
      <>
        <ellipse cx="36" cy="36" rx="24" ry="14" fill="none" stroke="#7c3aed" strokeWidth="2" />
        <line x1="14" y1="36" x2="58" y2="36" stroke="#94a3b8" />
        <line x1="36" y1="22" x2="36" y2="50" stroke="#94a3b8" />
        <circle cx="36" cy="36" r="3" fill="#7c3aed" />
      </>
    ),
  },
  'multivariate-outliers': {
    label: 'Multivariate outliers',
    art: (
      <>
        {[
          [22, 40],
          [30, 28],
          [38, 36],
          [44, 24],
          [28, 48],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="#818cf8" />
        ))}
        <circle cx="56" cy="16" r="4.5" fill="#e11d48" />
      </>
    ),
  },
  'principal-component-analysis': {
    label: 'PCA',
    art: (
      <>
        <line x1="12" y1="50" x2="60" y2="16" stroke="#4f46e5" strokeWidth="2.4" />
        <line x1="20" y1="16" x2="50" y2="56" stroke="#94a3b8" />
        {[
          [24, 40],
          [32, 34],
          [40, 28],
          [48, 22],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#6366f1" />
        ))}
      </>
    ),
  },
  'eigenvalues-eigenvectors': {
    label: 'Eigenvalues and eigenvectors',
    art: (
      <>
        <line x1="16" y1="50" x2="56" y2="18" stroke="#7c3aed" strokeWidth="2.6" />
        <line x1="20" y1="20" x2="48" y2="54" stroke="#94a3b8" />
        <polygon points="56,18 50,26 46,16" fill="#7c3aed" />
      </>
    ),
  },
  'random-number-generation': {
    label: 'Random number generation',
    art: (
      <>
        <rect x="16" y="18" width="40" height="36" rx="8" fill="#eef2ff" stroke="#4f46e5" />
        <text x="22" y="42" fontSize="16" fontWeight="800" fill="#4f46e5">
          0.73
        </text>
      </>
    ),
  },
  'coin-dice-simulation': {
    label: 'Coin and dice simulation',
    art: (
      <>
        <circle cx="24" cy="34" r="12" fill="#fde68a" stroke="#d97706" />
        <rect x="40" y="22" width="20" height="20" rx="4" fill="#fecaca" />
        <circle cx="46" cy="28" r="2" fill="#111827" />
        <circle cx="54" cy="36" r="2" fill="#111827" />
      </>
    ),
  },
  'monte-carlo': {
    label: 'Monte Carlo',
    art: (
      <>
        <circle cx="36" cy="36" r="20" fill="#e0e7ff" />
        {[[24, 28], [40, 22], [48, 36], [30, 44], [42, 48], [20, 40]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#4f46e5" />
        ))}
      </>
    ),
  },
  'sampling-experiment': {
    label: 'Sampling experiment',
    art: (
      <>
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={16 + (i % 4) * 12} cy={16 + Math.floor(i / 4) * 12} r="4" fill={i % 5 === 0 ? '#2563eb' : '#bfdbfe'} />
        ))}
      </>
    ),
  },
  'clt-simulation': {
    label: 'CLT simulation',
    art: (
      <>
        <path d="M10 52 C20 52 22 18 36 18 C50 18 52 52 62 52" fill="#ede9fe" stroke="#7c3aed" />
        <rect x="16" y="40" width="6" height="12" fill="#c4b5fd" />
        <rect x="24" y="32" width="6" height="20" fill="#a78bfa" />
      </>
    ),
  },
  'bootstrap-simulation': {
    label: 'Bootstrap simulation',
    art: (
      <>
        <rect x="14" y="16" width="44" height="14" rx="3" fill="#c7d2fe" />
        <rect x="18" y="34" width="16" height="10" rx="2" fill="#818cf8" />
        <rect x="38" y="34" width="16" height="10" rx="2" fill="#6366f1" />
        <rect x="24" y="48" width="24" height="8" rx="2" fill="#4f46e5" />
      </>
    ),
  },
  'permutation-simulation': {
    label: 'Permutation simulation',
    art: (
      <>
        <path d="M20 20 C20 12 36 12 36 24 C36 36 52 36 52 28" fill="none" stroke="#4f46e5" strokeWidth="3" />
        <circle cx="20" cy="20" r="4" fill="#86efac" />
        <circle cx="52" cy="28" r="4" fill="#93c5fd" />
      </>
    ),
  },
  'law-of-large-numbers-simulation': {
    label: 'Law of large numbers',
    art: (
      <>
        <path d="M12 20 L22 40 L32 18 L42 36 L52 28 L60 32" fill="none" stroke="#93c5fd" />
        <path d="M12 34 H60" stroke="#2563eb" strokeWidth="2.4" />
      </>
    ),
  },
  'quality-control-charts': {
    label: 'Quality control charts',
    art: (
      <>
        <line x1="12" y1="20" x2="60" y2="20" stroke="#e11d48" strokeDasharray="4 3" />
        <line x1="12" y1="52" x2="60" y2="52" stroke="#e11d48" strokeDasharray="4 3" />
        <path d="M14 36 L26 32 L38 40 L50 28 L58 34" fill="none" stroke="#0f766e" strokeWidth="2.4" />
      </>
    ),
  },
  'process-capability': {
    label: 'Process capability',
    art: (
      <>
        <path d="M12 50 C22 50 24 18 36 18 C48 18 50 50 60 50" fill="#ccfbf1" stroke="#0f766e" />
        <line x1="20" y1="14" x2="20" y2="56" stroke="#e11d48" />
        <line x1="52" y1="14" x2="52" y2="56" stroke="#e11d48" />
      </>
    ),
  },
  'decision-thresholds': {
    label: 'Decision thresholds',
    art: (
      <>
        <path d="M10 50 C20 50 22 20 32 20 C42 20 42 50 54 50" fill="#e0e7ff" />
        <line x1="40" y1="14" x2="40" y2="56" stroke="#4f46e5" strokeWidth="2.4" />
      </>
    ),
  },
  'ab-testing': {
    label: 'A/B testing',
    art: (
      <>
        <rect x="12" y="20" width="20" height="32" rx="6" fill="#dbeafe" stroke="#2563eb" />
        <rect x="40" y="20" width="20" height="32" rx="6" fill="#fce7f3" stroke="#db2777" />
        <text x="17" y="42" fontSize="16" fontWeight="800" fill="#2563eb">
          A
        </text>
        <text x="45" y="42" fontSize="16" fontWeight="800" fill="#db2777">
          B
        </text>
      </>
    ),
  },
  'diagnostic-testing': {
    label: 'Diagnostic testing',
    art: (
      <>
        <circle cx="36" cy="36" r="16" fill="#ecfeff" stroke="#0f766e" />
        <path d="M28 36 l6 6 12 -14" fill="none" stroke="#0f766e" strokeWidth="3" />
        <rect x="50" y="14" width="10" height="10" rx="2" fill="#e11d48" />
      </>
    ),
  },
}

export function LabMark({ slug, size = 72 }: { slug: string; size?: number }) {
  const icon = ICONS[slug]
  if (!icon) {
    return (
      <Frame label={slug} size={size}>
        <circle cx="36" cy="36" r="14" fill="#dbeafe" stroke="#2563eb" />
        <path d="M28 36 h16 M36 28 v16" stroke="#2563eb" strokeWidth="2.4" />
      </Frame>
    )
  }
  return <Frame label={icon.label} size={size}>{icon.art}</Frame>
}

export function FeatureMark({ name }: { name: 'labs' | 'visual' | 'world' | 'practice' }) {
  const art = {
    labs: (
      <>
        <rect x="16" y="20" width="40" height="32" rx="8" fill="#dbeafe" stroke="#2563eb" />
        <path d="M24 32 H48 M24 42 H40" stroke="#2563eb" strokeWidth="2.2" />
      </>
    ),
    visual: (
      <>
        <path d="M14 50 H58 M14 18 V50" fill="none" stroke="#cbd5e1" />
        <path d="M18 42 L30 26 L42 34 L56 18" fill="none" stroke="#2563eb" strokeWidth="2.4" />
      </>
    ),
    world: (
      <>
        <circle cx="36" cy="36" r="16" fill="#ecfeff" stroke="#0f766e" />
        <path d="M20 36 H52 M36 20 C28 28 28 44 36 52 C44 44 44 28 36 20" fill="none" stroke="#0f766e" />
      </>
    ),
    practice: (
      <>
        <rect x="18" y="16" width="36" height="40" rx="6" fill="#fef3c7" stroke="#d97706" />
        <path d="M26 30 H46 M26 40 H40" stroke="#d97706" strokeWidth="2" />
      </>
    ),
  }[name]
  return (
    <svg viewBox="0 0 72 72" width="36" height="36" aria-hidden>
      {art}
    </svg>
  )
}

export function StudioHeroMark({ slug, active = false }: { slug: string; active?: boolean }) {
  const motion = active ? 'origin-center animate-pulse' : ''
  if (slug === 'estimation') {
    return (
      <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
        <path d="M20 150 C70 150 80 40 140 40 C200 40 210 150 260 150" fill="#ccfbf1" stroke="#0f766e" strokeWidth="3" />
        <line x1="90" y1="110" x2="190" y2="110" stroke="#115e59" strokeWidth="6" strokeLinecap="round" className={motion} />
        <circle cx="140" cy="110" r="8" fill="#fff" stroke="#0f172a" strokeWidth="2" />
        <line x1="140" y1="28" x2="140" y2="150" stroke="#f59e0b" strokeDasharray="5 4" />
      </svg>
    )
  }
  if (slug === 'hypothesis-testing') {
    return (
      <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
        <path d="M20 150 C80 150 90 36 140 36 C190 36 200 150 260 150" fill="#ede9fe" stroke="#7c3aed" strokeWidth="3" />
        <path d="M188 150 C210 110 230 70 250 46 L250 150 Z" fill="#e11d48" opacity="0.8" className={motion} />
        <line x1="188" y1="28" x2="188" y2="150" stroke="#0f172a" strokeDasharray="5 4" />
      </svg>
    )
  }
  if (slug === 'nonparametric-statistics') {
    return (
      <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
        {[40, 80, 120, 160, 200].map((x, i) => (
          <rect key={x} x={x} y={140 - (i + 1) * 18} width="24" height={(i + 1) * 18} rx="6" fill={i === 3 ? '#65a30d' : '#bef264'} />
        ))}
        <text x="40" y="36" fontSize="18" fontWeight="800" fill="#3f6212">
          ranks
        </text>
      </svg>
    )
  }
  if (slug === 'reliability-survival') {
    return (
      <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
        <path d="M24 28 H90 V60 H150 V100 H210 V150" fill="none" stroke="#e11d48" strokeWidth="5" className={motion} />
        <circle cx="90" cy="28" r="5" fill="#e11d48" />
        <circle cx="150" cy="60" r="5" fill="#e11d48" />
        <circle cx="210" cy="100" r="5" fill="#e11d48" />
      </svg>
    )
  }
  if (slug === 'multivariate-statistics') {
    return (
      <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
        <ellipse cx="140" cy="90" rx="90" ry="48" transform="rotate(-24 140 90)" fill="#ede9fe" stroke="#7c3aed" strokeWidth="3" />
        <line x1="60" y1="130" x2="220" y2="50" stroke="#4f46e5" strokeWidth="3" />
        <circle cx="140" cy="90" r="6" fill="#4f46e5" className={motion} />
      </svg>
    )
  }
  if (slug === 'statistical-simulation') {
    return (
      <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <circle
            key={i}
            cx={30 + (i % 7) * 34}
            cy={30 + Math.floor(i / 7) * 36}
            r={i % 4 === 0 ? 8 : 5}
            fill={i % 4 === 0 ? '#4f46e5' : '#c7d2fe'}
            className={i % 4 === 0 ? motion : undefined}
          />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 280 180" className="h-[168px] w-full" aria-hidden>
      <line x1="24" y1="36" x2="256" y2="36" stroke="#e11d48" strokeDasharray="6 5" />
      <line x1="24" y1="144" x2="256" y2="144" stroke="#e11d48" strokeDasharray="6 5" />
      <path d="M24 90 L70 80 L110 104 L160 70 L210 88 L256 76" fill="none" stroke="#0f766e" strokeWidth="4" className={motion} />
    </svg>
  )
}
