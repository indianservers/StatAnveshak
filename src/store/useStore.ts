import { create } from 'zustand'
import type { Dataset, Project, ChartConfig } from '../types'

const loadBool = (key: string, fallback: boolean) => localStorage.getItem(key) ? localStorage.getItem(key) === 'true' : fallback
const savePref = (key: string, value: string | boolean | number) => localStorage.setItem(key, String(value))

interface AppState {
  // Active dataset
  activeDataset: Dataset | null
  setActiveDataset: (ds: Dataset | null) => void

  // All loaded datasets in memory
  datasets: Dataset[]
  addDataset: (ds: Dataset) => void
  removeDataset: (id: string) => void
  updateDataset: (ds: Dataset) => void

  // Projects
  activeProject: Project | null
  setActiveProject: (p: Project | null) => void

  // Charts
  charts: ChartConfig[]
  addChart: (c: ChartConfig) => void
  removeChart: (id: string) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  activeModule: string
  setActiveModule: (m: string) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  highContrast: boolean
  toggleHighContrast: () => void
  largeText: boolean
  toggleLargeText: () => void
  zoomLevel: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  density: 'comfortable' | 'compact'
  toggleDensity: () => void
  reportPreviewOpen: boolean
  setReportPreviewOpen: (value: boolean) => void
  favoriteModules: string[]
  toggleFavoriteModule: (path: string) => void
  lastSavedAt: number | null
  setLastSavedAt: (value: number | null) => void
}

export const useStore = create<AppState>((set) => ({
  activeDataset: null,
  setActiveDataset: (ds) => set({ activeDataset: ds }),

  datasets: [],
  addDataset: (ds) => set((s) => ({ datasets: [...s.datasets.filter((d) => d.id !== ds.id), ds] })),
  removeDataset: (id) => set((s) => ({ datasets: s.datasets.filter((d) => d.id !== id) })),
  updateDataset: (ds) => set((s) => ({ datasets: s.datasets.map((d) => (d.id === ds.id ? ds : d)) })),

  activeProject: null,
  setActiveProject: (p) => set({ activeProject: p }),

  charts: [],
  addChart: (c) => set((s) => ({ charts: [...s.charts, c] })),
  removeChart: (id) => set((s) => ({ charts: s.charts.filter((c) => c.id !== id) })),

  sidebarOpen: loadBool('pref-sidebar-open', true),
  setSidebarOpen: (v) => { savePref('pref-sidebar-open', v); set({ sidebarOpen: v }) },
  activeModule: 'home',
  setActiveModule: (m) => set({ activeModule: m }),
  theme: localStorage.getItem('pref-theme') === 'dark' ? 'dark' : 'light',
  toggleTheme: () => set((s) => { const theme = s.theme === 'light' ? 'dark' : 'light'; savePref('pref-theme', theme); return { theme } }),
  highContrast: loadBool('pref-high-contrast', false),
  toggleHighContrast: () => set((s) => { const highContrast = !s.highContrast; savePref('pref-high-contrast', highContrast); return { highContrast } }),
  largeText: loadBool('pref-large-text', false),
  toggleLargeText: () => set((s) => { const largeText = !s.largeText; savePref('pref-large-text', largeText); return { largeText } }),
  zoomLevel: Number(localStorage.getItem('pref-zoom-level') ?? 1),
  zoomIn: () => set((s) => { const zoomLevel = Math.min(1.5, Number((s.zoomLevel + 0.1).toFixed(2))); savePref('pref-zoom-level', zoomLevel); return { zoomLevel } }),
  zoomOut: () => set((s) => { const zoomLevel = Math.max(0.8, Number((s.zoomLevel - 0.1).toFixed(2))); savePref('pref-zoom-level', zoomLevel); return { zoomLevel } }),
  resetZoom: () => { savePref('pref-zoom-level', 1); set({ zoomLevel: 1 }) },
  density: localStorage.getItem('pref-density') === 'compact' ? 'compact' : 'comfortable',
  toggleDensity: () => set((s) => { const density = s.density === 'comfortable' ? 'compact' : 'comfortable'; savePref('pref-density', density); return { density } }),
  reportPreviewOpen: false,
  setReportPreviewOpen: (value) => set({ reportPreviewOpen: value }),
  favoriteModules: [],
  toggleFavoriteModule: (path) => set((s) => ({
    favoriteModules: s.favoriteModules.includes(path)
      ? s.favoriteModules.filter((item) => item !== path)
      : [...s.favoriteModules, path],
  })),
  lastSavedAt: null,
  setLastSavedAt: (value) => set({ lastSavedAt: value }),
}))
