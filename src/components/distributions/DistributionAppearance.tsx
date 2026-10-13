import { Pause, Play, RotateCcw, Scan, Star } from 'lucide-react'
import type { DistributionId } from '../../lib/distributions'
import { useStore, type AppTheme } from '../../store/useStore'
import { DEFAULT_DIST_UI, DIST_PALETTES, useDistributionUI, type DistPalette, type DistUIPreferences } from './distributionUI'
import { useReducedMotion } from '../visual/useReducedMotion'

export function DistributionAppearance({ id, name }: { id: DistributionId; name: string }) {
  const { ui, update, focus, setFocus, reduced, replayAnimations } = useDistributionUI()
  const { theme, setTheme, favoriteModules, toggleFavoriteModule } = useStore()
  const systemReduced = useReducedMotion()
  const path = `/distributions/${id}`
  const favorite = favoriteModules.includes(path)
  return <section aria-label="Distribution appearance" className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-sm font-black">Make this studio yours</p><p className="text-xs text-slate-500">Appearance is remembered in this browser.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className="dist-ui-button" onClick={() => update({ animate: !ui.animate })} aria-pressed={!ui.animate}>{ui.animate ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}{ui.animate ? 'Pause motion' : 'Resume motion'}</button>
        <button className="dist-ui-button" onClick={() => setFocus(!focus)} aria-pressed={focus}><Scan size={15} aria-hidden />{focus ? 'Exit focus mode' : 'Focus mode'}</button>
        <button className="dist-ui-button" onClick={() => toggleFavoriteModule(path)} aria-label={`${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} distribution favorites`} aria-pressed={favorite}><Star size={15} fill={favorite ? 'currentColor' : 'none'} aria-hidden />{favorite ? 'Saved' : 'Favorite'}</button>
      </div>
    </div>
    <details className="mt-2"><summary className="flex cursor-pointer items-center text-sm font-bold">Appearance &amp; chart settings · {DIST_PALETTES[ui.palette].label} / {theme}</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold">App theme<select aria-label="App theme" className="dist-ui-control mt-1 block w-full" value={theme} onChange={(event) => setTheme(event.target.value as AppTheme)}>{['light', 'dark', 'midnight', 'forest', 'rose', 'sepia'].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <label className="text-xs font-bold">Studio palette<select aria-label="Studio palette" className="dist-ui-control mt-1 block w-full" value={ui.palette} onChange={(event) => update({ palette: event.target.value as DistPalette })}>{Object.entries(DIST_PALETTES).map(([value, palette]) => <option key={value} value={value}>{palette.label}</option>)}</select></label>
        <label className="text-xs font-bold">Layout density<select aria-label="Layout density" className="dist-ui-control mt-1 block w-full" value={ui.density} onChange={(event) => update({ density: event.target.value as DistUIPreferences['density'] })}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
        <label className="text-xs font-bold">Animation speed<select aria-label="Animation speed" className="dist-ui-control mt-1 block w-full" value={ui.speed} onChange={(event) => update({ speed: event.target.value as DistUIPreferences['speed'] })}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="dist-ui-button" aria-pressed={ui.readable} onClick={() => update({ readable: !ui.readable })}>Larger lesson text</button>
        <button className="dist-ui-button" aria-pressed={ui.contrast} onClick={() => update({ contrast: !ui.contrast })}>High contrast charts &amp; text</button>
        <button className="dist-ui-button" aria-pressed={ui.grid} onClick={() => update({ grid: !ui.grid })}>Chart grid</button>
        <button className="dist-ui-button" aria-pressed={ui.legend} onClick={() => update({ legend: !ui.legend })}>Chart legends</button>
        <button className="dist-ui-button" onClick={replayAnimations} disabled={reduced}><RotateCcw size={15} aria-hidden />Replay illustrations</button>
        <button className="dist-ui-button" onClick={() => { update(DEFAULT_DIST_UI); setFocus(false) }}>Reset studio appearance</button>
      </div>
      <p role="status" className="mt-3 text-xs text-slate-500">{systemReduced ? 'App or system reduced-motion preference is active; illustrations remain still.' : reduced ? 'Motion paused. Charts and experiments remain usable.' : 'Motion is on. Offscreen illustrations and hidden tabs pause automatically.'} Theme changes apply throughout the app; other settings apply to this studio.</p>
    </details>
  </section>
}

