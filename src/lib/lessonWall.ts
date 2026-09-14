export type SavedStage = {
  id: string
  href: string
  title: string
  intuition: string
  formula: string
  misuse: string
  readout: string
  pngDataUrl: string
  savedAt: string
}

const KEY = 'statanveshak-lesson-wall'
const MAX = 8

export function loadSavedStages(): SavedStage[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is SavedStage => Boolean(item?.id && item?.href && item?.pngDataUrl))
  } catch {
    return []
  }
}

export function persistSavedStages(stages: SavedStage[]) {
  const next = stages.slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    const smaller = next.slice(0, Math.max(1, next.length - 1))
    try {
      localStorage.setItem(KEY, JSON.stringify(smaller))
    } catch {
      localStorage.removeItem(KEY)
      return []
    }
    return smaller
  }
}

export function addSavedStage(stage: SavedStage, existing = loadSavedStages()) {
  return persistSavedStages([stage, ...existing.filter((item) => item.id !== stage.id)])
}

export function removeSavedStage(id: string, existing = loadSavedStages()) {
  return persistSavedStages(existing.filter((item) => item.id !== id))
}
