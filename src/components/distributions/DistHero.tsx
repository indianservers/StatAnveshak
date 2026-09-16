import type { DistributionId } from '../../lib/distributions'

export function DistHero({ id }: { id: DistributionId }) {
  switch (id) {
    case 'bernoulli':
      return (
        <div className="relative flex h-full min-h-[132px] items-center justify-center gap-4">
          <CoinBadge label="Success (1)" tone="emerald" star />
          <svg width="56" height="28" viewBox="0 0 56 28" className="text-violet-300" aria-hidden>
            <path d="M4 22 C18 22 22 6 52 6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          <CoinBadge label="Failure (0)" tone="violet" />
        </div>
      )
    case 'binomial':
      return (
        <div className="flex h-full min-h-[132px] items-end justify-center gap-1 pb-2">
          {[0.15, 0.28, 0.45, 0.7, 0.95, 0.72, 0.48, 0.3, 0.18, 0.1].map((h, i) => (
            <div key={i} className="w-3 rounded-t-md bg-violet-400/80" style={{ height: `${h * 92}px` }} />
          ))}
        </div>
      )
    case 'geometric':
      return (
        <div className="flex h-full min-h-[132px] items-center justify-center gap-2">
          {['✕', '✕', '✕', '✓'].map((mark, i) => (
            <span key={i} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black ${mark === '✓' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>{mark}</span>
          ))}
        </div>
      )
    case 'poisson':
      return (
        <div className="flex h-full min-h-[132px] items-center justify-center">
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="h-3.5 w-3.5 rounded-full bg-violet-400" style={{ opacity: 0.35 + (i % 5) * 0.12 }} />
            ))}
          </div>
        </div>
      )
    case 'hypergeometric':
      return (
        <div className="flex h-full min-h-[132px] items-center justify-center">
          <div className="relative h-24 w-24 rounded-full bg-sky-100 shadow-inner">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                className={`absolute h-3.5 w-3.5 rounded-full ${i % 3 === 0 ? 'bg-sky-500' : 'bg-rose-400'}`}
                style={{ left: `${18 + (i * 17) % 58}px`, top: `${16 + (i * 13) % 52}px` }}
              />
            ))}
          </div>
        </div>
      )
    case 'normal':
    case 'standard_normal':
    case 'student_t':
    case 'logistic':
    case 'laplace':
    case 'skew_normal':
    case 'mixture_normal':
      return <BellHero heavy={id === 'student_t' || id === 'cauchy'} />
    case 'exponential':
      return <DecayHero />
    case 'beta':
      return <MultiCurveHero />
    case 'continuous_uniform':
    case 'discrete_uniform':
      return (
        <div className="flex h-full min-h-[132px] items-end justify-center px-8 pb-6">
          <div className="h-20 w-full max-w-[240px] rounded-md border-2 border-indigo-400 bg-indigo-100/80" />
        </div>
      )
    default:
      return <BellHero />
  }
}

function CoinBadge({ label, tone, star }: { label: string; tone: 'emerald' | 'violet'; star?: boolean }) {
  const cls = tone === 'emerald' ? 'from-amber-300 to-amber-500 text-amber-900' : 'from-violet-200 to-violet-400 text-violet-900'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br shadow-md ${cls}`}>
        {star ? '★' : '○'}
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>{label}</span>
    </div>
  )
}

function BellHero({ heavy }: { heavy?: boolean }) {
  return (
    <svg viewBox="0 0 280 110" className="h-full w-full" aria-hidden>
      <path d="M10 90 C 40 90 55 20 140 18 C 225 20 240 90 270 90" fill="none" stroke="#6366f1" strokeWidth="3" />
      {heavy ? <path d="M10 90 C 50 88 70 38 140 36 C 210 38 230 88 270 90" fill="none" stroke="#a855f7" strokeWidth="2.5" /> : null}
      <path d="M10 90 C 40 90 55 20 140 18 C 225 20 240 90 270 90 L 270 90 L 10 90 Z" fill="#6366f1" opacity="0.12" />
    </svg>
  )
}

function DecayHero() {
  return (
    <svg viewBox="0 0 280 110" className="h-full w-full" aria-hidden>
      <path d="M20 18 C 50 22 70 70 260 92" fill="none" stroke="#10b981" strokeWidth="3" />
      <path d="M20 18 C 50 22 70 70 260 92 L 260 98 L 20 98 Z" fill="#10b981" opacity="0.12" />
    </svg>
  )
}

function MultiCurveHero() {
  return (
    <svg viewBox="0 0 280 110" className="h-full w-full" aria-hidden>
      <path d="M16 90 C 40 90 50 30 90 22 C 140 12 180 70 264 88" fill="none" stroke="#6366f1" strokeWidth="2.4" />
      <path d="M16 88 C 80 86 120 20 170 18 C 220 16 240 70 264 88" fill="none" stroke="#ec4899" strokeWidth="2.2" />
      <path d="M16 92 C 70 40 90 18 140 40 C 190 70 220 88 264 92" fill="none" stroke="#22c55e" strokeWidth="2.2" />
    </svg>
  )
}
