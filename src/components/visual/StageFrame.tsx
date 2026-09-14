import type { ReactNode } from 'react'
import { VIZ } from '../../lib/visualMath'

export function StageFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 720 420" className="h-full w-full" role="img" aria-label={label}>
      <rect width="720" height="420" fill={VIZ.stage} />
      {children}
    </svg>
  )
}
