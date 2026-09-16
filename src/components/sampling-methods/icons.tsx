import type { ReactNode } from 'react'

function Frame({ children, label, size = 72 }: { children: ReactNode; label: string; size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} role="img" aria-label={label}>
      {children}
    </svg>
  )
}

function Person({ x, y, fill, r = 4 }: { x: number; y: number; fill: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} />
      <path d={`M${x - r * 1.4} ${y + r * 3.2} Q${x} ${y + r} ${x + r * 1.4} ${y + r * 3.2}`} fill={fill} />
    </g>
  )
}

export function LabIcon({ id, size = 72 }: { id: string; size?: number }) {
  switch (id) {
    case 'population-vs-sample':
      return (
        <Frame label="Population versus sample" size={size}>
          <Person x={24} y={26} fill="#93c5fd" />
          <Person x={36} y={22} fill="#60a5fa" />
          <Person x={48} y={26} fill="#93c5fd" />
          <Person x={36} y={42} fill="#2563eb" />
        </Frame>
      )
    case 'simple-random-sampling':
      return (
        <Frame label="Simple random sampling" size={size}>
          <rect x="16" y="16" width="40" height="40" rx="10" fill="#eef4ff" stroke="#c7d7fb" />
          <circle cx="28" cy="28" r="4" fill="#2563eb" />
          <circle cx="44" cy="28" r="4" fill="#2563eb" />
          <circle cx="28" cy="44" r="4" fill="#2563eb" />
          <circle cx="44" cy="36" r="4" fill="#2563eb" />
          <circle cx="36" cy="48" r="4" fill="#2563eb" />
        </Frame>
      )
    case 'stratified-sampling':
      return (
        <Frame label="Stratified sampling" size={size}>
          <Person x={22} y={22} fill="#2563eb" />
          <Person x={34} y={22} fill="#2563eb" />
          <Person x={26} y={36} fill="#7c3aed" />
          <Person x={38} y={36} fill="#7c3aed" />
          <Person x={32} y={50} fill="#059669" />
          <Person x={44} y={50} fill="#059669" />
        </Frame>
      )
    case 'cluster-sampling':
      return (
        <Frame label="Cluster sampling" size={size}>
          <circle cx="24" cy="28" r="13" fill="#dbeafe" />
          <circle cx="48" cy="28" r="13" fill="#ede9fe" />
          <circle cx="36" cy="50" r="13" fill="#d1fae5" />
          <Person x={24} y={26} fill="#2563eb" r={3} />
          <Person x={48} y={26} fill="#7c3aed" r={3} />
          <Person x={36} y={48} fill="#059669" r={3} />
        </Frame>
      )
    case 'systematic-sampling':
      return (
        <Frame label="Systematic sampling" size={size}>
          {[18, 28, 38, 48, 58].map((y, i) => (
            <circle key={y} cx="36" cy={y} r={i % 2 === 0 ? 5 : 4} fill={i % 2 === 0 ? '#2563eb' : '#cbd5e1'} />
          ))}
        </Frame>
      )
    case 'sampling-bias':
      return (
        <Frame label="Sampling bias" size={size}>
          <path d="M36 14 L60 56 H12 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="2.2" />
          <rect x="34" y="30" width="4" height="16" rx="2" fill="#b45309" />
          <circle cx="36" cy="52" r="2.4" fill="#b45309" />
        </Frame>
      )
    case 'sampling-vs-nonsampling-error':
      return (
        <Frame label="Sampling error versus non-sampling error" size={size}>
          <circle cx="36" cy="36" r="20" fill="none" stroke="#93c5fd" strokeWidth="3" />
          <circle cx="36" cy="36" r="12" fill="none" stroke="#60a5fa" strokeWidth="3" />
          <circle cx="36" cy="36" r="4" fill="#2563eb" />
          <path d="M36 10 V16 M36 56 V62 M10 36 H16 M56 36 H62" stroke="#2563eb" strokeWidth="2" />
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
        <circle cx="12" cy="12" r="9" fill="#dbeafe" />
        <path d="M10 8l7 4-7 4V8z" fill="#2563eb" />
      </svg>
    )
  }
  if (name === 'visual') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" fill="#e0e7ff" />
        <path d="M5 12s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="#4f46e5" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2" fill="#4f46e5" />
      </svg>
    )
  }
  if (name === 'world') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" fill="#dbeafe" stroke="#2563eb" />
        <path d="M4 12h16M12 4c2.5 3 2.5 13 0 16M12 4c-2.5 3-2.5 13 0 16" stroke="#2563eb" strokeWidth="1.4" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" fill="#dbeafe" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="#2563eb" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.4" fill="#2563eb" />
    </svg>
  )
}

export function SamplingMethodsHeroArt({ active = false }: { active?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden>
      <svg viewBox="0 0 420 220" className="w-full">
        <defs>
          <radialGradient id="sm-pop" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#eff6ff" />
          </radialGradient>
        </defs>
        <ellipse cx="150" cy="118" rx="128" ry="78" fill="url(#sm-pop)" />
        {[
          [86, 86], [118, 70], [150, 80], [182, 68], [214, 88],
          [98, 118], [132, 108], [166, 118], [200, 108],
          [110, 148], [146, 140], [180, 152], [208, 136],
        ].map(([x, y], i) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <circle r="7" fill={i === 7 ? '#2563eb' : '#60a5fa'} />
            <path d="M-9 18 Q0 8 9 18" fill={i === 7 ? '#2563eb' : '#60a5fa'} />
          </g>
        ))}
        <path d="M286 110 H328" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
        <path d="M328 104 L338 110 L328 116" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <rect x="348" y="78" width="58" height="70" rx="14" fill="#fff" stroke="#c7d7fb" strokeDasharray="5 4" />
        <g transform="translate(377 104)">
          <circle r="8" fill="#2563eb" />
          <path d="M-10 20 Q0 9 10 20" fill="#2563eb" />
        </g>
        <rect x="368" y="28" width="36" height="44" rx="8" fill="#fff" stroke="#bfdbfe" />
        <path d="M376 40 h20 M376 48 h20 M376 56 h12" stroke="#2563eb" strokeWidth="2" />
        <path d="M390 62 l4 4 8-10" fill="none" stroke="#16a34a" strokeWidth="2" />
      </svg>
      <p className={`sm-note absolute right-0 top-2 w-36 text-right ${active ? 'translate-y-[-2px]' : ''}`}>
        From populations
        <br />
        to insights.
      </p>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  if (slug === 'population-vs-sample') {
    return (
      <div className="hidden items-center gap-3 lg:flex">
        <SamplingMethodsHeroArt />
      </div>
    )
  }
  if (slug === 'simple-random-sampling') {
    return (
      <div className="hidden items-center gap-4 lg:flex" aria-hidden>
        <svg viewBox="0 0 180 92" width="180" height="92">
          {[28, 56, 84, 112, 140].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy="36" r="8" fill={i === 2 ? '#2563eb' : '#93c5fd'} />
              <path d={`M${x - 10} 56 Q${x} 44 ${x + 10} 56`} fill={i === 2 ? '#2563eb' : '#93c5fd'} />
            </g>
          ))}
          <path d="M84 18 C120 8 148 22 160 18" fill="none" stroke="#94a3b8" strokeDasharray="4 4" />
        </svg>
        <LabIcon id={slug} size={72} />
      </div>
    )
  }
  if (slug === 'systematic-sampling') {
    return (
      <div className="hidden lg:block" aria-hidden>
        <svg viewBox="0 0 280 72" width="280" height="72">
          {Array.from({ length: 20 }, (_, i) => {
            const x = 10 + i * 14
            const selected = [2, 7, 12, 17].includes(i)
            return <circle key={i} cx={x} cy="36" r={selected ? 5 : 3.4} fill={selected ? '#2563eb' : '#cbd5e1'} />
          })}
          <path d="M38 20 C52 8 66 8 80 20" fill="none" stroke="#94a3b8" />
          <path d="M108 20 C122 8 136 8 150 20" fill="none" stroke="#94a3b8" />
        </svg>
      </div>
    )
  }
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <LabIcon id={slug} size={72} />
      <p className="sm-note w-32 text-right">Better samples. Brighter insights.</p>
    </div>
  )
}
