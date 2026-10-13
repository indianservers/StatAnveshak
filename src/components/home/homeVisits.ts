import { readLocalJson } from '../../lib/safeStorage'
export type HomeVisit = { path: string; title: string; analyze?: boolean; at: number }
export function readHomeVisits(): HomeVisit[] {
  const raw = readLocalJson<unknown>('home-recent-visits', [])
  return Array.isArray(raw) ? raw.filter((entry): entry is HomeVisit => Boolean(entry && typeof entry === 'object' && typeof entry.path === 'string' && entry.path.startsWith('/') && !entry.path.startsWith('//') && typeof entry.title === 'string' && typeof entry.at === 'number')).slice(0, 8) : []
}
