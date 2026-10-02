import { create } from 'zustand'
import type { AnalysisLogEntry, Dataset, Project, ChartConfig } from '../types'
import { loadDatasets, loadProjects } from '../lib/storage'
import { addSavedStage, loadSavedStages, removeSavedStage, type SavedStage } from '../lib/lessonWall'
import { DEFAULT_LEARN_CHAPTER, type LearnChapterId } from '../lib/learnChapters'
import { peekLocal, readLocal, readLocalJson, writeLocal } from '../lib/safeStorage'
import type { DatasetStatus } from '../lib/datasetGuard'

export type WorkspaceMode = 'learn' | 'analyze'
export type MotionPreference = 'full' | 'reduced'
export type CaptionSize = 'sm' | 'md' | 'lg'
export type StorageStatus = DatasetStatus

const ACTIVE_DATASET_KEY = 'pref-active-dataset-id'
const ACTIVE_PROJECT_KEY = 'pref-active-project-id'

const loadMode = (): WorkspaceMode => (readLocal('pref-workspace-mode') === 'analyze' ? 'analyze' : 'learn')
const loadMotion = (): MotionPreference => (readLocal('pref-motion') === 'reduced' ? 'reduced' : 'full')
const loadCaptionSize = (): CaptionSize => {
  const value = readLocal('pref-caption-size')
  return value === 'sm' || value === 'lg' ? value : 'md'
}
const loadChapter = (): LearnChapterId => {
  const value = readLocal('pref-default-chapter')
  return value === 'compound' || value === 'distributions' || value === 'frequentist' || value === 'bayesian' || value === 'regression'
    ? value
    : DEFAULT_LEARN_CHAPTER
}

const loadBool = (key: string, fallback: boolean) => {
  const value = readLocal(key)
  return value ? value === 'true' : fallback
}
const savePref = (key: string, value: string | boolean | number) => {
  writeLocal(key, String(value))
}
const loadStringArray = (key: string) => {
  const value = readLocalJson<unknown>(key, [])
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
const loadAnalysisHistory = () => {
  const value = readLocalJson<unknown>('analysis-history', [])
  return Array.isArray(value) ? value.filter((item): item is AnalysisLogEntry => Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item)) : []
}
const persistAnalysisHistory = (value: AnalysisLogEntry[]) => {
  writeLocal('analysis-history', JSON.stringify(value.slice(0, 80)))
  return value.slice(0, 80)
}

export type AppTheme = 'light' | 'dark' | 'midnight' | 'forest' | 'rose' | 'sepia'
const THEMES: AppTheme[] = ['light', 'dark', 'midnight', 'forest', 'rose', 'sepia']
const loadTheme = (): AppTheme => {
  const value = readLocal('pref-theme')
  return THEMES.includes(value as AppTheme) ? value as AppTheme : 'light'
}

function restoreById<T extends { id: string }>(items: T[], savedId: string | null) {
  if (savedId === '') return null
  if (savedId) return items.find((item) => item.id === savedId) ?? items[0] ?? null
  return items[0] ?? null
}

interface AppState {
  activeDataset: Dataset | null
  setActiveDataset: (ds: Dataset | null) => void

  datasets: Dataset[]
  storageStatus: StorageStatus
  storageError: string | null
  hydrateStorage: () => Promise<void>
  addDataset: (ds: Dataset) => void
  removeDataset: (id: string) => void
  updateDataset: (ds: Dataset) => void

  projects: Project[]
  activeProject: Project | null
  setActiveProject: (p: Project | null) => void
  addProject: (p: Project) => void
  removeProject: (id: string) => void
  updateProject: (p: Project) => void

  charts: ChartConfig[]
  addChart: (c: ChartConfig) => void
  removeChart: (id: string) => void

  activeModule: string
  setActiveModule: (m: string) => void
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
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
  analysisHistory: AnalysisLogEntry[]
  addAnalysisLog: (entry: AnalysisLogEntry) => void
  removeAnalysisLog: (id: string) => void
  clearAnalysisHistory: () => void
  workspaceMode: WorkspaceMode
  setWorkspaceMode: (mode: WorkspaceMode) => void
  motion: MotionPreference
  setMotion: (value: MotionPreference) => void
  colorblindPalette: boolean
  toggleColorblindPalette: () => void
  captionSize: CaptionSize
  setCaptionSize: (value: CaptionSize) => void
  defaultChapter: LearnChapterId
  setDefaultChapter: (value: LearnChapterId) => void
  savedStages: SavedStage[]
  pinStage: (stage: SavedStage) => void
  unpinStage: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  activeDataset: null,
  setActiveDataset: (ds) => {
    savePref(ACTIVE_DATASET_KEY, ds?.id ?? '')
    set({ activeDataset: ds })
  },

  datasets: [],
  storageStatus: 'loading',
  storageError: null,
  hydrateStorage: async () => {
    try {
      const [datasets, projects] = await Promise.all([loadDatasets(), loadProjects()])
      const sortedDatasets = [...datasets].sort((a, b) => b.createdAt - a.createdAt)
      const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
      const savedDatasetId = peekLocal(ACTIVE_DATASET_KEY)
      const savedProjectId = peekLocal(ACTIVE_PROJECT_KEY)
      set((state) => ({
        datasets: sortedDatasets,
        projects: sortedProjects,
        activeDataset: state.activeDataset ?? restoreById(sortedDatasets, savedDatasetId),
        activeProject: state.activeProject ?? restoreById(sortedProjects, savedProjectId),
        storageStatus: 'loaded',
        storageError: null,
      }))
    } catch (error) {
      set({
        storageStatus: 'error',
        storageError: error instanceof Error ? error.message : 'Browser storage could not be read.',
      })
    }
  },
  addDataset: (ds) => set((s) => {
    const activeDataset = s.activeDataset?.id === ds.id ? ds : s.activeDataset ?? ds
    if (!s.activeDataset || s.activeDataset.id === ds.id) savePref(ACTIVE_DATASET_KEY, ds.id)
    return {
      datasets: [...s.datasets.filter((d) => d.id !== ds.id), ds],
      activeDataset,
      storageStatus: 'loaded',
    }
  }),
  removeDataset: (id) => set((s) => {
    const datasets = s.datasets.filter((d) => d.id !== id)
    const activeDataset = s.activeDataset?.id === id ? null : s.activeDataset
    if (activeDataset === null) savePref(ACTIVE_DATASET_KEY, '')
    return { datasets, activeDataset }
  }),
  updateDataset: (ds) => set((s) => ({
    datasets: s.datasets.map((d) => (d.id === ds.id ? ds : d)),
    activeDataset: s.activeDataset?.id === ds.id ? ds : s.activeDataset,
  })),

  projects: [],
  activeProject: null,
  setActiveProject: (p) => {
    savePref(ACTIVE_PROJECT_KEY, p?.id ?? '')
    set({ activeProject: p })
  },
  addProject: (p) => {
    savePref(ACTIVE_PROJECT_KEY, p.id)
    set((s) => ({
      projects: [...s.projects.filter((item) => item.id !== p.id), p],
      activeProject: p,
    }))
  },
  removeProject: (id) => set((s) => {
    const projects = s.projects.filter((item) => item.id !== id)
    const activeProject = s.activeProject?.id === id ? null : s.activeProject
    if (activeProject === null) savePref(ACTIVE_PROJECT_KEY, '')
    return { projects, activeProject }
  }),
  updateProject: (p) => set((s) => ({
    projects: s.projects.map((item) => (item.id === p.id ? p : item)),
    activeProject: s.activeProject?.id === p.id ? p : s.activeProject,
  })),

  charts: [],
  addChart: (c) => set((s) => ({ charts: [...s.charts, c] })),
  removeChart: (id) => set((s) => ({ charts: s.charts.filter((c) => c.id !== id) })),

  activeModule: 'home',
  setActiveModule: (m) => set({ activeModule: m }),
  theme: loadTheme(),
  setTheme: (theme) => { savePref('pref-theme', theme); set({ theme }) },
  toggleTheme: () => set((s) => {
    const theme: AppTheme = s.theme === 'light' ? 'dark' : 'light'
    savePref('pref-theme', theme)
    return { theme }
  }),
  highContrast: loadBool('pref-high-contrast', false),
  toggleHighContrast: () => set((s) => { const highContrast = !s.highContrast; savePref('pref-high-contrast', highContrast); return { highContrast } }),
  largeText: loadBool('pref-large-text', false),
  toggleLargeText: () => set((s) => { const largeText = !s.largeText; savePref('pref-large-text', largeText); return { largeText } }),
  zoomLevel: Number(readLocal('pref-zoom-level', '1')) || 1,
  zoomIn: () => set((s) => { const zoomLevel = Math.min(1.5, Number((s.zoomLevel + 0.1).toFixed(2))); savePref('pref-zoom-level', zoomLevel); return { zoomLevel } }),
  zoomOut: () => set((s) => { const zoomLevel = Math.max(0.8, Number((s.zoomLevel - 0.1).toFixed(2))); savePref('pref-zoom-level', zoomLevel); return { zoomLevel } }),
  resetZoom: () => { savePref('pref-zoom-level', 1); set({ zoomLevel: 1 }) },
  density: readLocal('pref-density') === 'compact' ? 'compact' : 'comfortable',
  toggleDensity: () => set((s) => { const density = s.density === 'comfortable' ? 'compact' : 'comfortable'; savePref('pref-density', density); return { density } }),
  reportPreviewOpen: false,
  setReportPreviewOpen: (value) => set({ reportPreviewOpen: value }),
  favoriteModules: loadStringArray('pref-favorite-modules'),
  toggleFavoriteModule: (path) => set((s) => ({
    favoriteModules: persistFavorites(s.favoriteModules.includes(path)
      ? s.favoriteModules.filter((item) => item !== path)
      : [...s.favoriteModules, path]),
  })),
  lastSavedAt: null,
  setLastSavedAt: (value) => set({ lastSavedAt: value }),
  analysisHistory: loadAnalysisHistory(),
  addAnalysisLog: (entry) => set((s) => ({
    analysisHistory: persistAnalysisHistory([entry, ...s.analysisHistory.filter((item) => item.id !== entry.id)]),
  })),
  removeAnalysisLog: (id) => set((s) => ({
    analysisHistory: persistAnalysisHistory(s.analysisHistory.filter((item) => item.id !== id)),
  })),
  clearAnalysisHistory: () => {
    writeLocal('analysis-history', '[]')
    set({ analysisHistory: [] })
  },
  workspaceMode: loadMode(),
  setWorkspaceMode: (mode) => { savePref('pref-workspace-mode', mode); set({ workspaceMode: mode }) },
  motion: loadMotion(),
  setMotion: (value) => { savePref('pref-motion', value); set({ motion: value }) },
  colorblindPalette: loadBool('pref-colorblind-palette', false),
  toggleColorblindPalette: () => set((s) => { const colorblindPalette = !s.colorblindPalette; savePref('pref-colorblind-palette', colorblindPalette); return { colorblindPalette } }),
  captionSize: loadCaptionSize(),
  setCaptionSize: (value) => { savePref('pref-caption-size', value); set({ captionSize: value }) },
  defaultChapter: loadChapter(),
  setDefaultChapter: (value) => { savePref('pref-default-chapter', value); set({ defaultChapter: value }) },
  savedStages: loadSavedStages(),
  pinStage: (stage) => set((s) => ({ savedStages: addSavedStage(stage, s.savedStages) })),
  unpinStage: (id) => set((s) => ({ savedStages: removeSavedStage(id, s.savedStages) })),
}))

function persistFavorites(value: string[]) {
  writeLocal('pref-favorite-modules', JSON.stringify(value))
  return value
}
