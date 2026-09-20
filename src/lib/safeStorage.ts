export function peekLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function readLocal(key: string, fallback = ''): string {
  return peekLocal(key) ?? fallback
}

export function writeLocal(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Browser storage can be blocked in private mode.
  }
}

export function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readStringArray(key: string): string[] {
  const value = readLocalJson<unknown>(key, [])
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function writeLocalJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function storageFailureMessage(error: unknown, kind: 'dataset' | 'project' | 'preference' = 'dataset'): string {
  const text = error instanceof Error ? error.message : String(error ?? '')
  const quota = /quota|exceeded|full/i.test(text)
  if (quota) {
    return kind === 'dataset'
      ? 'The dataset was read, but could not be stored in this browser. Free some browser storage and try again.'
      : `Could not save this ${kind} because browser storage is full.`
  }
  if (/blocked|access|security|denied|private/i.test(text)) {
    return kind === 'dataset'
      ? 'The dataset was read, but could not be stored in this browser.'
      : `Browser storage is unavailable, so this ${kind} could not be saved.`
  }
  return kind === 'dataset'
    ? 'The dataset was read, but could not be stored in this browser.'
    : `Could not save this ${kind} in browser storage.`
}
