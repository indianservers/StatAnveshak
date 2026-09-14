import type { LearnChapter } from '../../lib/learnChapters'

export function ChapterPreview({ preview, looping = true }: { preview: LearnChapter['preview']; looping?: boolean }) {
  const motion = looping ? 'lesson-preview-loop' : ''

  if (preview === 'coins') {
    return (
      <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
        {[28, 72, 116, 160, 198].map((x, index) => (
          <circle
            key={x}
            className={motion}
            cx={x}
            cy={64}
            r={index % 2 ? 16 : 14}
            fill={index % 2 ? '#34d399' : '#818cf8'}
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
      </svg>
    )
  }

  if (preview === 'sets') {
    return (
      <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
        <circle cx="88" cy="62" r="38" fill="#4f46e5" opacity="0.55" />
        <circle className={motion} cx="132" cy="62" r="38" fill="#34d399" opacity="0.5" />
      </svg>
    )
  }

  if (preview === 'clt') {
    const bars = [8, 14, 22, 36, 48, 36, 22, 14, 8]
    return (
      <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
        {bars.map((height, index) => (
          <rect
            key={index}
            className={motion}
            x={18 + index * 22}
            y={100 - height}
            width="16"
            height={height}
            rx="3"
            fill="#8b5cf6"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </svg>
    )
  }

  if (preview === 'ci') {
    return (
      <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
        {[28, 48, 68, 88].map((y, index) => (
          <g key={y} className={motion} style={{ animationDelay: `${index * 120}ms` }}>
            <line x1="40" y1={y} x2="180" y2={y} stroke={index === 2 ? '#f59e0b' : '#34d399'} strokeWidth="4" />
            <circle cx="110" cy={y} r="4" fill="#e2e8f0" />
          </g>
        ))}
        <line x1="110" y1="18" x2="110" y2="108" stroke="#94a3b8" strokeDasharray="4 4" />
      </svg>
    )
  }

  if (preview === 'beta') {
    return (
      <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
        <path d="M16 96 C 50 96 70 24 110 40 C 150 56 170 88 204 88" fill="none" stroke="#64748b" strokeWidth="3" />
        <path className={motion} d="M16 96 C 70 96 90 16 140 28 C 180 40 190 72 204 80" fill="none" stroke="#8b5cf6" strokeWidth="3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden>
      {[18, 46, 78, 112, 150, 188].map((x, index) => {
        const y = 88 - ((x - 20) * 0.22)
        const residual = index % 2 ? 14 : -10
        return (
          <g key={x}>
            <circle cx={x} cy={y + residual} r="4" fill="#4f46e5" />
            <rect className={motion} x={x - 6} y={Math.min(y, y + residual)} width="12" height={Math.abs(residual)} fill="#fb7185" opacity="0.45" />
          </g>
        )
      })}
      <line x1="12" y1="92" x2="208" y2="28" stroke="#94a3b8" strokeWidth="2" />
    </svg>
  )
}
