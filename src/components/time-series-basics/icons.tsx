import type { ReactNode } from 'react'

function Frame({ children, label, size = 56 }: { children: ReactNode; label: string; size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} role="img" aria-label={label}>
      {children}
    </svg>
  )
}

export function FeatureIcon({ name }: { name: 'labs' | 'world' | 'steps' | 'visual' }) {
  const paths = {
    labs: (
      <>
        <rect x="16" y="20" width="40" height="32" rx="6" fill="#eff6ff" stroke="#2563eb" />
        <path d="M24 30 H48 M24 38 H40" stroke="#2563eb" strokeWidth="2" />
        <circle cx="50" cy="46" r="5" fill="#2563eb" />
      </>
    ),
    world: (
      <>
        <circle cx="36" cy="36" r="16" fill="#eff6ff" stroke="#2563eb" />
        <path d="M20 36 H52 M36 20 C28 28 28 44 36 52 C44 44 44 28 36 20" fill="none" stroke="#2563eb" />
      </>
    ),
    steps: (
      <>
        <rect x="16" y="40" width="12" height="12" rx="3" fill="#93c5fd" />
        <rect x="30" y="30" width="12" height="22" rx="3" fill="#60a5fa" />
        <rect x="44" y="20" width="12" height="32" rx="3" fill="#2563eb" />
      </>
    ),
    visual: (
      <>
        <path d="M14 50 H58 M14 18 V50" fill="none" stroke="#cbd5e1" />
        <path d="M18 42 L30 30 L40 36 L56 20" fill="none" stroke="#2563eb" strokeWidth="2.2" />
        <path d="M18 48 L30 40 L40 44 L56 32" fill="#dbeafe" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 72 72" width="36" height="36" aria-hidden>
      {paths[name]}
    </svg>
  )
}

export function LabIcon({ id, size = 40 }: { id: string; size?: number }) {
  switch (id) {
    case 'time-plot':
      return (
        <Frame label="Time plot" size={size}>
          <path d="M14 54 H58 M14 16 V54" fill="none" stroke="#e2e8f0" />
          <path d="M18 42 L28 28 L38 34 L50 20 L58 26" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <circle cx="28" cy="28" r="2.6" fill="#2563eb" />
          <circle cx="50" cy="20" r="2.6" fill="#2563eb" />
        </Frame>
      )
    case 'trend':
      return (
        <Frame label="Trend" size={size}>
          <path d="M16 50 L58 18" stroke="#93c5fd" strokeDasharray="4 3" />
          <path d="M16 48 L26 40 L36 42 L46 28 L58 22" fill="none" stroke="#2563eb" strokeWidth="2.2" />
        </Frame>
      )
    case 'seasonality':
      return (
        <Frame label="Seasonality" size={size}>
          <path d="M14 36 C22 18 28 54 36 36 C44 18 50 54 58 36" fill="none" stroke="#2563eb" strokeWidth="2.2" />
        </Frame>
      )
    case 'moving-average':
      return (
        <Frame label="Moving average" size={size}>
          <path d="M14 46 L22 30 L30 50 L38 24 L46 44 L58 18" fill="none" stroke="#93c5fd" />
          <path d="M16 40 L58 26" stroke="#f59e0b" strokeWidth="2.4" />
        </Frame>
      )
    case 'autocorrelation':
      return (
        <Frame label="Autocorrelation" size={size}>
          <path d="M18 50 V28 H30 V50 Z" fill="#2563eb" />
          <path d="M34 50 V36 H46 V50 Z" fill="#93c5fd" />
          <path d="M50 50 V22 H60 V50 Z" fill="#1d4ed8" />
        </Frame>
      )
    case 'acf-pacf':
      return (
        <Frame label="ACF and PACF" size={size}>
          <rect x="14" y="34" width="6" height="18" fill="#2563eb" />
          <rect x="22" y="28" width="6" height="24" fill="#60a5fa" />
          <rect x="38" y="22" width="6" height="30" fill="#7c3aed" />
          <rect x="46" y="38" width="6" height="14" fill="#c4b5fd" />
        </Frame>
      )
    case 'stationarity':
      return (
        <Frame label="Stationarity" size={size}>
          <path d="M14 28 C22 18 30 38 38 22 L58 12" fill="none" stroke="#f43f5e" />
          <path d="M14 48 C22 42 30 54 38 46 C46 38 52 50 58 44" fill="none" stroke="#2563eb" strokeWidth="2" />
        </Frame>
      )
    case 'white-noise-random-walk':
      return (
        <Frame label="White noise and random walk" size={size}>
          <path d="M14 28 L20 22 L26 32 L32 18 L38 30 L44 20 L50 28 L58 16" fill="none" stroke="#2563eb" />
          <path d="M14 52 L26 46 L38 40 L50 28 L58 24" fill="none" stroke="#7c3aed" strokeWidth="2" />
        </Frame>
      )
    default:
      return (
        <Frame label="AR, MA, and ARIMA" size={size}>
          <path d="M16 50 C24 20 36 20 40 36 C44 52 52 48 58 28" fill="none" stroke="#2563eb" strokeWidth="2.2" />
          <circle cx="40" cy="36" r="3" fill="#f59e0b" />
        </Frame>
      )
  }
}

export function DomainIcon({ name }: { name: 'finance' | 'weather' | 'retail' | 'sensor' | 'econ' }) {
  const art = {
    finance: <path d="M16 48 L28 32 L40 40 L56 18" fill="none" stroke="#2563eb" strokeWidth="2.2" />,
    weather: <path d="M16 40 C22 20 34 20 40 36 C46 20 56 28 56 40 C56 50 16 50 16 40 Z" fill="#dbeafe" stroke="#2563eb" />,
    retail: (
      <>
        <rect x="20" y="28" width="8" height="24" fill="#93c5fd" />
        <rect x="32" y="20" width="8" height="32" fill="#2563eb" />
        <rect x="44" y="34" width="8" height="18" fill="#60a5fa" />
      </>
    ),
    sensor: <path d="M16 44 L24 28 L32 48 L40 22 L48 40 L58 18" fill="none" stroke="#0f172a" strokeWidth="2" />,
    econ: <path d="M16 50 L28 36 L40 42 L56 20" fill="none" stroke="#7c3aed" strokeWidth="2.2" />,
  }
  return (
    <svg viewBox="0 0 72 36" className="h-10 w-full" aria-hidden>
      <path d="M8 28 H64" stroke="#e2e8f0" />
      {art[name]}
    </svg>
  )
}

export function TimeSeriesHeroArt({ active }: { active: boolean }) {
  const path = 'M20 118 L40 112 L56 118 L72 96 L88 102 L104 88 L120 94 L136 78 L152 86 L168 70 L184 76 L200 62 L216 70 L232 54 L248 60 L264 48 L280 56 L296 42 L312 50 L328 36 L344 44 L360 30 L376 38 L392 24 L410 18'
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-5 dark:from-slate-900 dark:to-slate-800">
      <div className="ts-mountain pointer-events-none absolute inset-x-0 bottom-0 opacity-80" />
      <svg viewBox="0 0 430 140" className="relative h-40 w-full" role="img" aria-label="Time series with trend, seasonality, and a path toward forecasting">
        <path d="M28 18 V122 H410" fill="none" stroke="#e2e8f0" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={active ? 2.6 : 2.1} />
        <circle cx="150" cy="66" r="3" fill="#2563eb" />
        <circle cx="230" cy="42" r="3" fill="#2563eb" />
        <circle cx="330" cy="34" r="3" fill="#2563eb" />
        <text x="40" y="134" fontSize="9" fill="#94a3b8">2020</text>
        <text x="200" y="134" fontSize="9" fill="#94a3b8">2023</text>
        <text x="370" y="134" fontSize="9" fill="#94a3b8">2025</text>
      </svg>
      <div className="relative mt-2 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">Trend</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">Seasonality</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">Forecasting</span>
      </div>
    </div>
  )
}

export function LabHeroArt({ slug }: { slug: string }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 px-3 py-2 lg:block">
      <LabIcon id={slug} size={72} />
    </div>
  )
}
