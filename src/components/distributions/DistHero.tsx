import type { DistributionId } from '../../lib/distributions'

/** Fixed frame so heroes never collapse when the header card has no intrinsic height. */
const SVG = 'h-[140px] w-full text-indigo-600 dark:text-indigo-400'

export function DistHero({ id }: { id: DistributionId }) {
  switch (id) {
    case 'bernoulli':
      return <BernoulliHero />
    case 'binomial':
    case 'multinomial':
      return <BarsHero heights={[0.18, 0.32, 0.5, 0.72, 0.96, 0.74, 0.5, 0.32, 0.2, 0.12]} />
    case 'geometric':
      return <MarksHero marks={['✕', '✕', '✕', '✓']} />
    case 'negative_binomial':
      return <MarksHero marks={['✕', '✓', '✕', '✓', '✓']} />
    case 'poisson':
    case 'zip':
      return <DotsHero accentZero={id === 'zip'} />
    case 'zinb':
      return <MarksHero marks={['0', '✕', '✓', '✓']} />
    case 'hypergeometric':
      return <UrnHero />
    case 'discrete_uniform':
      return <EqualBarsHero count={6} />
    case 'continuous_uniform':
      return <PlateauHero />
    case 'exponential':
    case 'weibull':
    case 'pareto':
    case 'gumbel':
      return <DecayHero />
    case 'beta':
    case 'stretched_beta':
    case 'dirichlet':
      return <MultiCurveHero />
    case 'student_t':
    case 'cauchy':
    case 'laplace':
      return <BellHero heavy />
    case 'mixture_normal':
      return <MixtureHero />
    case 'lognormal':
    case 'gamma':
    case 'chi_square':
    case 'f':
    case 'inverse_gaussian':
    case 'skew_normal':
      return <SkewHero />
    case 'empirical':
      return <BarsHero heights={[0.42, 0.58, 0.92, 0.7, 0.48, 0.3, 0.2]} />
    case 'normal':
    case 'standard_normal':
    case 'logistic':
    default:
      return <BellHero />
  }
}

function BernoulliHero() {
  return (
    <div className="relative flex h-[140px] items-center justify-center gap-4">
      <CoinBadge label="Success (1)" tone="emerald" star className="dl-coin" />
      <svg width="56" height="28" viewBox="0 0 56 28" className="text-violet-500 dark:text-violet-300" aria-hidden>
        <path d="M4 22 C18 22 22 6 52 6" pathLength={1} fill="none" stroke="currentColor" strokeWidth="2.5" className="dl-trace" />
      </svg>
      <CoinBadge label="Failure (0)" tone="violet" className="dl-coin-b" />
    </div>
  )
}

function CoinBadge({ label, tone, star, className }: { label: string; tone: 'emerald' | 'violet'; star?: boolean; className?: string }) {
  const cls = tone === 'emerald' ? 'from-amber-300 to-amber-500 text-amber-900' : 'from-violet-200 to-violet-400 text-violet-900'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br text-lg font-black shadow-md ${cls} ${className ?? ''}`}>
        {star ? '★' : '○'}
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/70 dark:text-violet-200'}`}>{label}</span>
    </div>
  )
}

function BarsHero({ heights }: { heights: number[] }) {
  const gap = 8
  const w = Math.min(22, (220 - gap * (heights.length - 1)) / heights.length)
  const total = heights.length * w + (heights.length - 1) * gap
  const x0 = (280 - total) / 2
  return (
    <svg viewBox="0 0 280 120" className={SVG} aria-hidden>
      {heights.map((h, i) => {
        const height = 16 + h * 72
        return (
          <rect
            key={i}
            className="dl-bar"
            x={x0 + i * (w + gap)}
            y={100 - height}
            width={w}
            height={height}
            rx={4}
            fill="currentColor"
            opacity={0.82}
          />
        )
      })}
      <line x1="24" y1="102" x2="256" y2="102" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    </svg>
  )
}

function EqualBarsHero({ count }: { count: number }) {
  const w = 22
  const gap = 8
  const total = count * w + (count - 1) * gap
  const x0 = (280 - total) / 2
  return (
    <svg viewBox="0 0 280 120" className={SVG} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <rect className="dl-bar" x={x0 + i * (w + gap)} y={28} width={w} height={70} rx={5} fill="currentColor" opacity={0.88} />
          <text x={x0 + i * (w + gap) + w / 2} y={114} textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor" opacity={0.7}>
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

function PlateauHero() {
  return (
    <svg viewBox="0 0 280 120" className={SVG} aria-hidden>
      <rect className="dl-bar" x="36" y="30" width="208" height="62" rx="8" fill="currentColor" opacity={0.28} />
      <path className="dl-trace" pathLength={1} d="M36 92 L36 38 Q36 30 44 30 L236 30 Q244 30 244 38 L244 92" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="24" y1="92" x2="256" y2="92" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    </svg>
  )
}

function MarksHero({ marks }: { marks: string[] }) {
  return (
    <div className="flex h-[140px] items-center justify-center gap-2">
      {marks.map((mark, i) => {
        const ok = mark === '✓'
        const zero = mark === '0'
        return (
          <span
            key={`${mark}-${i}`}
            className={`dl-mark grid h-10 w-10 place-items-center rounded-full text-sm font-black ${
              ok
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/80 dark:text-emerald-300'
                : zero
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200'
                  : 'bg-rose-100 text-rose-500 dark:bg-rose-900/70 dark:text-rose-300'
            }`}
            style={{ animationDelay: `${i * 180}ms` }}
          >
            {mark}
          </span>
        )
      })}
    </div>
  )
}

function DotsHero({ accentZero }: { accentZero?: boolean }) {
  return (
    <div className="flex h-[140px] items-center justify-center">
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={`dl-dot h-3.5 w-3.5 rounded-full ${accentZero && i === 0 ? 'bg-amber-400' : 'bg-violet-500 dark:bg-violet-300'}`}
            style={{ animationDelay: `${(i % 6) * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function UrnHero() {
  return (
    <div className="flex h-[140px] items-center justify-center">
      <div className="relative h-24 w-24 rounded-full bg-sky-100 shadow-inner dark:bg-sky-950">
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className={`dl-dot absolute h-3.5 w-3.5 rounded-full ${i % 3 === 0 ? 'bg-sky-500 dark:bg-sky-300' : 'bg-rose-400 dark:bg-rose-300'}`}
            style={{ left: `${18 + (i * 17) % 58}px`, top: `${16 + (i * 13) % 52}px`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function BellHero({ heavy }: { heavy?: boolean }) {
  return (
    <svg viewBox="0 0 280 120" className={SVG} aria-hidden>
      <path className="dl-bar" d="M10 96 C 40 96 55 26 140 24 C 225 26 240 96 270 96 L 270 96 L 10 96 Z" fill="currentColor" opacity="0.22" />
      <path className="dl-trace" pathLength={1} d="M10 96 C 40 96 55 26 140 24 C 225 26 240 96 270 96" fill="none" stroke="currentColor" strokeWidth="3.2" />
      {heavy ? <path className="dl-trace" pathLength={1} d="M10 96 C 50 94 70 44 140 42 C 210 44 230 94 270 96" fill="none" stroke="#a855f7" strokeWidth="2.4" /> : null}
    </svg>
  )
}

function DecayHero() {
  return (
    <svg viewBox="0 0 280 120" className="h-[140px] w-full text-emerald-500 dark:text-emerald-300" aria-hidden>
      <path className="dl-drop" d="M20 22 C 50 26 70 78 260 98 L 260 104 L 20 104 Z" fill="currentColor" opacity="0.2" />
      <path className="dl-trace" pathLength={1} d="M20 22 C 50 26 70 78 260 98" fill="none" stroke="currentColor" strokeWidth="3.2" />
    </svg>
  )
}

function MultiCurveHero() {
  return (
    <svg viewBox="0 0 280 120" className="h-[140px] w-full" aria-hidden>
      <path className="dl-trace" pathLength={1} d="M16 96 C 40 96 50 34 90 26 C 140 16 180 76 264 94" fill="none" stroke="#6366f1" strokeWidth="2.6" />
      <path className="dl-trace" pathLength={1} d="M16 94 C 80 92 120 24 170 22 C 220 20 240 76 264 94" fill="none" stroke="#ec4899" strokeWidth="2.4" />
      <path className="dl-trace" pathLength={1} d="M16 98 C 70 44 90 22 140 44 C 190 76 220 94 264 98" fill="none" stroke="#22c55e" strokeWidth="2.4" />
    </svg>
  )
}

function SkewHero() {
  return (
    <svg viewBox="0 0 280 120" className={SVG} aria-hidden>
      <path className="dl-bar" d="M16 98 C 40 98 52 28 88 26 C 140 24 190 70 264 98 L 16 98 Z" fill="currentColor" opacity="0.22" />
      <path className="dl-trace" pathLength={1} d="M16 98 C 40 98 52 28 88 26 C 140 24 190 70 264 98" fill="none" stroke="currentColor" strokeWidth="3.2" />
    </svg>
  )
}

function MixtureHero() {
  return (
    <svg viewBox="0 0 280 120" className={SVG} aria-hidden>
      <path className="dl-bar" d="M16 98 C 36 98 48 50 86 48 C 120 46 132 86 148 88 C 164 86 176 40 214 38 C 248 36 262 90 268 98 L 16 98 Z" fill="currentColor" opacity="0.2" />
      <path className="dl-trace" pathLength={1} d="M16 98 C 36 98 48 50 86 48 C 120 46 132 86 148 88 C 164 86 176 40 214 38 C 248 36 262 90 268 98" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}
