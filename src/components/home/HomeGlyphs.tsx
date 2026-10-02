export type GlyphKind =
  | 'bars'
  | 'whisker'
  | 'boxes'
  | 'line'
  | 'factor'
  | 'survival'
  | 'scatter'
  | 'bell'
  | 'network'
  | 'wave'
  | 'pie'
  | 'gauge'
  | 'steps'
  | 'cluster'
  | 'grid'
  | 'circle'

export type GlyphTone = 'indigo' | 'violet' | 'emerald' | 'orange' | 'rose' | 'sky' | 'amber' | 'teal' | 'fuchsia'

const TONES: Record<GlyphTone, { wash: string; main: string; soft: string; accent: string }> = {
  indigo: { wash: 'bg-indigo-50 dark:bg-indigo-950/40', main: '#4f46e5', soft: '#a5b4fc', accent: '#f97316' },
  violet: { wash: 'bg-violet-50 dark:bg-violet-950/40', main: '#7c3aed', soft: '#c4b5fd', accent: '#10b981' },
  emerald: { wash: 'bg-emerald-50 dark:bg-emerald-950/40', main: '#059669', soft: '#6ee7b7', accent: '#6366f1' },
  orange: { wash: 'bg-orange-50 dark:bg-orange-950/40', main: '#ea580c', soft: '#fdba74', accent: '#6366f1' },
  rose: { wash: 'bg-rose-50 dark:bg-rose-950/40', main: '#e11d48', soft: '#fda4af', accent: '#6366f1' },
  sky: { wash: 'bg-sky-50 dark:bg-sky-950/40', main: '#0284c7', soft: '#7dd3fc', accent: '#f97316' },
  amber: { wash: 'bg-amber-50 dark:bg-amber-950/40', main: '#d97706', soft: '#fcd34d', accent: '#6366f1' },
  teal: { wash: 'bg-teal-50 dark:bg-teal-950/40', main: '#0d9488', soft: '#5eead4', accent: '#f43f5e' },
  fuchsia: { wash: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', main: '#c026d3', soft: '#f0abfc', accent: '#0ea5e9' },
}

/** Small decorative chart used on home tiles. Purely presentational, so it is hidden from assistive tech. */
export function HomeGlyph({ kind, tone, size = 'md' }: { kind: GlyphKind; tone: GlyphTone; size?: 'sm' | 'md' }) {
  const t = TONES[tone]
  const box = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-14 w-14 rounded-2xl'
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center ${box} ${t.wash}`}>
      <svg viewBox="0 0 40 40" className={size === 'sm' ? 'h-7 w-7' : 'h-10 w-10'}>
        <GlyphShape kind={kind} main={t.main} soft={t.soft} accent={t.accent} />
      </svg>
    </span>
  )
}

function GlyphShape({ kind, main, soft, accent }: { kind: GlyphKind; main: string; soft: string; accent: string }) {
  switch (kind) {
    case 'bars':
      return (
        <g>
          {[14, 22, 30, 18, 26].map((h, i) => <rect key={i} x={5 + i * 6.4} y={34 - h} width="4.6" height={h} rx="1.2" fill={i % 2 ? soft : main} />)}
        </g>
      )
    case 'whisker':
      return (
        <g stroke={main} strokeWidth="2" strokeLinecap="round">
          <line x1="13" y1="8" x2="13" y2="32" />
          <line x1="9" y1="8" x2="17" y2="8" />
          <line x1="9" y1="32" x2="17" y2="32" />
          <circle cx="13" cy="19" r="3.2" fill={main} />
          <line x1="27" y1="12" x2="27" y2="34" stroke={soft} />
          <line x1="23" y1="12" x2="31" y2="12" stroke={soft} />
          <line x1="23" y1="34" x2="31" y2="34" stroke={soft} />
          <circle cx="27" cy="24" r="3.2" fill={soft} stroke="none" />
        </g>
      )
    case 'boxes':
      return (
        <g>
          {[0, 1, 2].map((i) => {
            const x = 6 + i * 11
            const top = [12, 8, 15][i]
            const colors = [accent, main, soft]
            return (
              <g key={i}>
                <line x1={x + 3.5} y1={top - 5} x2={x + 3.5} y2={top + 19} stroke="#94a3b8" strokeWidth="1.4" />
                <rect x={x} y={top} width="7" height="13" rx="1.6" fill={colors[i]} />
                <line x1={x} y1={top + 6} x2={x + 7} y2={top + 6} stroke="#1e293b" strokeWidth="1.2" />
              </g>
            )
          })}
        </g>
      )
    case 'line':
      return (
        <g>
          {[[8, 30], [12, 27], [15, 28], [19, 22], [23, 21], [26, 16], [30, 14], [33, 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill={soft} />)}
          <line x1="6" y1="32" x2="35" y2="8" stroke={main} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )
    case 'factor':
      return (
        <g>
          <rect x="5" y="6" width="9" height="6" rx="1.5" fill={main} />
          <rect x="5" y="17" width="9" height="6" rx="1.5" fill={soft} />
          <rect x="5" y="28" width="9" height="6" rx="1.5" fill={main} />
          <circle cx="30" cy="20" r="6" fill="none" stroke={main} strokeWidth="2" />
          {[9, 20, 31].map((y) => <line key={y} x1="15" y1={y} x2="24" y2="20" stroke="#94a3b8" strokeWidth="1.3" />)}
        </g>
      )
    case 'survival':
      return <path d="M5 8 H12 V14 H18 V19 H23 V26 H29 V30 H36" fill="none" stroke={main} strokeWidth="2.4" strokeLinejoin="round" />
    case 'scatter':
      return (
        <g>
          {[[8, 28], [12, 22], [16, 26], [18, 16], [23, 19], [25, 12], [29, 15], [32, 9], [14, 31], [27, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill={i % 3 ? main : soft} />)}
        </g>
      )
    case 'bell':
      return (
        <g>
          <path d="M3 33 C12 33 13 8 20 8 C27 8 28 33 37 33 Z" fill={soft} opacity="0.55" />
          <path d="M3 33 C12 33 13 8 20 8 C27 8 28 33 37 33" fill="none" stroke={main} strokeWidth="2.2" />
          <line x1="20" y1="8" x2="20" y2="33" stroke={main} strokeWidth="1.2" strokeDasharray="2 2" />
        </g>
      )
    case 'network':
      return (
        <g>
          {[[10, 10, 29, 14], [10, 10, 15, 30], [29, 14, 15, 30], [29, 14, 32, 31], [15, 30, 32, 31]].map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#94a3b8" strokeWidth="1.4" />)}
          {[[10, 10, main], [29, 14, accent], [15, 30, soft], [32, 31, main]].map(([x, y, fill], i) => <circle key={i} cx={x as number} cy={y as number} r="4" fill={fill as string} />)}
        </g>
      )
    case 'wave':
      return (
        <g>
          <path d="M4 26 L9 20 L13 24 L18 14 L22 19 L27 10 L31 16 L36 8" fill="none" stroke={main} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M4 32 L9 28 L13 30 L18 24 L22 27 L27 21 L31 24 L36 19" fill="none" stroke={soft} strokeWidth="1.6" strokeDasharray="2.5 2" />
        </g>
      )
    case 'pie':
      return (
        <g>
          <circle cx="20" cy="20" r="13" fill={soft} />
          <path d="M20 20 L20 7 A13 13 0 0 1 32.4 24 Z" fill={main} />
          <path d="M20 20 L32.4 24 A13 13 0 0 1 22 32.8 Z" fill={accent} />
        </g>
      )
    case 'gauge':
      return (
        <g>
          <path d="M6 28 A14 14 0 0 1 34 28" fill="none" stroke={soft} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M6 28 A14 14 0 0 1 26 15.6" fill="none" stroke={main} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="20" y1="28" x2="27" y2="18" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="28" r="2.4" fill="#1e293b" />
        </g>
      )
    case 'steps':
      return (
        <g>
          <path d="M5 10 H12 V16 H19 V22 H26 V28 H35" fill="none" stroke={main} strokeWidth="2.6" strokeLinejoin="round" />
          <line x1="5" y1="34" x2="35" y2="34" stroke={soft} strokeWidth="1.5" strokeDasharray="2 2" />
        </g>
      )
    case 'cluster':
      return (
        <g>
          <ellipse cx="20" cy="20" rx="15" ry="11" fill={soft} opacity="0.45" />
          {[[12, 17], [15, 23], [18, 15], [22, 21], [25, 16], [28, 23], [20, 27], [14, 13]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.3" fill={main} />)}
        </g>
      )
    case 'grid':
      return (
        <g>
          {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={7 + c * 9.5} y={7 + r * 9.5} width="7.5" height="7.5" rx="1.6" fill={(r + c) % 2 ? soft : main} />))}
        </g>
      )
    case 'circle':
      return (
        <g>
          <circle cx="20" cy="20" r="13" fill="none" stroke={soft} strokeWidth="2" />
          {[0, 40, 75, 110, 200, 250].map((deg) => {
            const rad = (deg * Math.PI) / 180
            return <circle key={deg} cx={20 + Math.cos(rad) * 13} cy={20 + Math.sin(rad) * 13} r="2.4" fill={main} />
          })}
          <line x1="20" y1="20" x2="30" y2="14" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      )
  }
}
