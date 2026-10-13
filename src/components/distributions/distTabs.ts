import { Activity, BookOpen, Lightbulb, PenLine, Table2 } from 'lucide-react'

export const DIST_TABS = [
  { id: 'learn', label: 'Learn', icon: Lightbulb },
  { id: 'viz', label: 'Visualization', icon: Activity },
  { id: 'sample', label: 'Sample data', icon: Table2 },
  { id: 'formulas', label: 'Formulas', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: PenLine },
] as const

export type DistTabId = (typeof DIST_TABS)[number]['id']

export function isDistTabId(value: string | null): value is DistTabId {
  return DIST_TABS.some((tab) => tab.id === value)
}

export function tabFromQuery(value: string | null): DistTabId {
  if (value === 'how' || value === 'learn') return 'learn'
  return isDistTabId(value) ? value : 'learn'
}


