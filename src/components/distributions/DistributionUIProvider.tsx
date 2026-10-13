import { useState, type CSSProperties, type ReactNode } from 'react'
import { useReducedMotion } from '../visual/useReducedMotion'
import { writeLocalJson } from '../../lib/safeStorage'
import { DIST_PALETTES, DistributionUIContext, loadDistUI, type DistUIPreferences } from './distributionUI'
import { DistributionUIStyles } from './DistributionUIStyles'

export function DistributionUIProvider({ children }: { children: ReactNode }) {
  const [ui, setUI] = useState(loadDistUI)
  const [focus, setFocus] = useState(false)
  const [replay, setReplay] = useState(0)
  const systemReduced = useReducedMotion()
  const colors = DIST_PALETTES[ui.palette]
  const update = (patch: Partial<DistUIPreferences>) => setUI((previous) => {
    const next = { ...previous, ...patch }
    writeLocalJson('distribution-ui', next)
    return next
  })
  const reduced = systemReduced || !ui.animate
  const style = { '--dist-primary': colors.primary, '--dist-line': colors.line, '--dist-selection': colors.selection, '--dist-wash': colors.wash, '--dist-motion-scale': ui.speed === 'slow' ? 1.8 : ui.speed === 'fast' ? 0.6 : 1 } as CSSProperties
  return <DistributionUIContext.Provider value={{ ui, update, reduced, focus, setFocus, replay, replayAnimations: () => setReplay((value) => value + 1) }}>
    <div className="dist-studio min-h-full" style={style} data-palette={ui.palette} data-density={ui.density} data-readable={ui.readable} data-contrast={ui.contrast} data-motion={reduced ? 'reduced' : 'full'} data-focus={focus}>
      <DistributionUIStyles />{children}
    </div>
  </DistributionUIContext.Provider>
}
