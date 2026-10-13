import { createContext, useContext } from 'react'
import { readLocalJson } from '../../lib/safeStorage'

export const DIST_PALETTES = {
  indigo: { label: 'Indigo', primary: '#4f46e5', line: '#6366f1', selection: '#059669', wash: '#eef2ff' },
  ocean: { label: 'Ocean', primary: '#0369a1', line: '#0ea5e9', selection: '#d97706', wash: '#f0f9ff' },
  forest: { label: 'Forest', primary: '#047857', line: '#10b981', selection: '#9333ea', wash: '#ecfdf5' },
  sunset: { label: 'Sunset', primary: '#c2410c', line: '#f97316', selection: '#0284c7', wash: '#fff7ed' },
} as const
export type DistPalette = keyof typeof DIST_PALETTES
export type DistUIPreferences = { palette: DistPalette; density: 'comfortable' | 'compact'; readable: boolean; contrast: boolean; animate: boolean; speed: 'slow' | 'normal' | 'fast'; grid: boolean; legend: boolean }
export const DEFAULT_DIST_UI: DistUIPreferences = { palette: 'indigo', density: 'comfortable', readable: false, contrast: false, animate: true, speed: 'normal', grid: true, legend: true }

export function loadDistUI(): DistUIPreferences {
  return normalizeDistUI(readLocalJson<unknown>('distribution-ui', {}))
}

export function normalizeDistUI(raw: unknown): DistUIPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DIST_UI }
  const value = raw as Partial<DistUIPreferences>
  return {
    palette: value.palette && Object.hasOwn(DIST_PALETTES, value.palette) ? value.palette : 'indigo',
    density: value.density === 'compact' ? 'compact' : 'comfortable',
    readable: value.readable === true, contrast: value.contrast === true,
    animate: value.animate !== false,
    speed: value.speed === 'slow' || value.speed === 'fast' ? value.speed : 'normal',
    grid: value.grid !== false, legend: value.legend !== false,
  }
}

type ContextValue = { ui: DistUIPreferences; update: (patch: Partial<DistUIPreferences>) => void; reduced: boolean; focus: boolean; setFocus: (value: boolean) => void; replay: number; replayAnimations: () => void }
export const DistributionUIContext = createContext<ContextValue>({ ui: DEFAULT_DIST_UI, update: () => {}, reduced: false, focus: false, setFocus: () => {}, replay: 0, replayAnimations: () => {} })
export const useDistributionUI = () => useContext(DistributionUIContext)
